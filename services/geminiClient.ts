import { GoogleGenAI } from "@google/genai";
import { RequestLoadBalancer } from "./loadBalancer";
import { getCachedAIResponse, setCachedAIResponse } from "./aiCache";

// Model Constants - Using gemini-2.5-flash (VERIFIED to have quota on free tier)
// Available models: gemini-2.5-flash, gemini-2.0-flash, gemini-2.0-flash-exp
export const GEMINI_MODEL = 'gemini-2.5-flash';

// Initialize API Keys (up to 7 keys for load balancing)
// PERF FIX: All 7 keys are now properly injected by vite.config.ts define block
const keys = [
    import.meta.env.VITE_GEMINI_API_KEY,
    import.meta.env.VITE_GEMINI_API_KEY_2,
    import.meta.env.VITE_GEMINI_API_KEY_3,
    import.meta.env.VITE_GEMINI_API_KEY_4,
    import.meta.env.VITE_GEMINI_API_KEY_5,
    import.meta.env.VITE_GEMINI_API_KEY_6,
    import.meta.env.VITE_GEMINI_API_KEY_7
].filter(Boolean);

// PERF FIX: Restored — required by resumeService.ts and learningService.ts for mock bypass
export const HAS_GEMINI_KEYS = keys.length > 0;

// Initialize the Load Balancer with all available keys
const balancer = new RequestLoadBalancer(keys);

// Robust JSON cleaner
export const cleanJson = (text: string): string => {
    if (!text) return "[]";
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '');
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        const lastBrace = cleaned.lastIndexOf('}');
        if (lastBrace !== -1) return cleaned.substring(firstBrace, lastBrace + 1);
    }
    if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
        const lastBracket = cleaned.lastIndexOf(']');
        if (lastBracket !== -1) return cleaned.substring(firstBracket, lastBracket + 1);
    }
    return cleaned;
};

/**
 * generateWithRetry — Wraps Gemini API calls with:
 * 1. Session-level cache check (returns instantly on hit, no API call)
 * 2. Load-balanced key rotation across up to 7 API keys
 * 3. Automatic retry with exponential backoff on 429/quota errors
 *
 * @param modelName - Gemini model identifier
 * @param params    - { contents, config } matching Gemini SDK generateContent signature
 * @param skipCache - Set true for non-deterministic calls (e.g. interviews) where fresh output matters
 */
export const generateWithRetry = async (
    modelName: string,
    params: any,
    skipCache = false
) => {
    // PERF: Check session cache first — zero latency, zero quota on cache hit
    if (!skipCache) {
        const cached = getCachedAIResponse(modelName, params.contents);
        if (cached !== null) {
            return cached;
        }
    }

    const result = await balancer.execute(async (apiKey) => {
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: modelName,
            contents: params.contents,
            config: params.config
        });

        return {
            text: response.text,
            response: response
        };
    });

    // Store successful response in session cache
    if (!skipCache && result) {
        setCachedAIResponse(modelName, params.contents, result);
    }

    return result;
};

// Export a consistent AI instance for stateful features (e.g. live chat)
export const getAiInstance = () => {
    const key = keys[0] || "";
    return new GoogleGenAI({ apiKey: key });
};

// Backward compatibility alias
export const ai = getAiInstance();
