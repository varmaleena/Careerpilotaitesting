import { GoogleGenAI } from "@google/genai";
import { RequestLoadBalancer } from "./loadBalancer";

// Model Constants - Using gemini-2.0-flash (VERIFIED to exist via API)
// Available models: gemini-2.5-flash, gemini-2.0-flash, gemini-2.0-flash-exp
export const GEMINI_MODEL = 'gemini-2.0-flash';

// Initialize API Keys
const keys = [
    import.meta.env.VITE_GEMINI_API_KEY,
    import.meta.env.VITE_GEMINI_API_KEY_2,
    import.meta.env.VITE_GEMINI_API_KEY_3
].filter(Boolean);

// Initialize the Load Balancer
const balancer = new RequestLoadBalancer(keys);

console.log(`🔑 Loaded ${keys.length} Gemini API keys`);
console.log(`🤖 Using model: ${GEMINI_MODEL}`);

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
 * Enhanced generateWithRetry using VERIFIED working model
 */
export const generateWithRetry = async (modelName: string, params: any) => {
    return balancer.execute(async (apiKey) => {
        // Use default API version (v1beta) since that's where the models are
        const ai = new GoogleGenAI({ apiKey });

        // Use the correct SDK pattern: ai.models.generateContent()
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
};

// Export a consistent AI interface for stateful features like Chat
export const getAiInstance = () => {
    const key = keys[0] || "";
    return new GoogleGenAI({ apiKey: key });
};

// For backward compatibility
export const ai = getAiInstance();
