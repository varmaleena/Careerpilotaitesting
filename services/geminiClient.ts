import { GoogleGenAI } from "@google/genai";
import { getCachedAIResponse, setCachedAIResponse } from "./aiCache";
import { RequestLoadBalancer } from "./loadBalancer";

export const GEMINI_MODEL = 'gemini-2.5-flash';

// Helper to gather all exposed Gemini API keys for load balancer
const getGeminiKeys = (): string[] => {
    const keys = [
        import.meta.env.VITE_GEMINI_API_KEY,
        import.meta.env.VITE_GEMINI_API_KEY_2,
        import.meta.env.VITE_GEMINI_API_KEY_3,
        import.meta.env.VITE_GEMINI_API_KEY_4,
        import.meta.env.VITE_GEMINI_API_KEY_5,
        import.meta.env.VITE_GEMINI_API_KEY_6,
        import.meta.env.VITE_GEMINI_API_KEY_7,
    ].filter((k): k is string => Boolean(k && typeof k === 'string' && k.trim() !== ''));
    return keys;
};

// Singleton load balancer instance for direct client-side requests
let loadBalancerInstance: RequestLoadBalancer | null = null;
const getLoadBalancer = (): RequestLoadBalancer => {
    if (!loadBalancerInstance) {
        const keys = getGeminiKeys();
        loadBalancerInstance = new RequestLoadBalancer(keys);
    }
    return loadBalancerInstance;
};

// Returns true if either a custom backend URL or direct Gemini API keys are configured
export const HAS_GEMINI_KEYS = Boolean(
    import.meta.env.VITE_BACKEND_URL || getGeminiKeys().length > 0
);

// Robust JSON cleaner (runs on client for safety)
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
 * generateWithRetry — Bulletproof AI generation.
 * 1. Checks session-level cache.
 * 2. Uses VITE_BACKEND_URL if specified in production.
 * 3. Falls back to direct @google/genai client load balancer if API keys are present.
 * 4. Falls back to local http://localhost:8000 only if reachable.
 */
export const generateWithRetry = async (
    modelName: string,
    params: any,
    skipCache = false
) => {
    // Check session cache first (zero latency, zero API cost)
    if (!skipCache) {
        const cached = getCachedAIResponse(modelName, params.contents);
        if (cached !== null) {
            return cached;
        }
    }

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    // Mode A: Configured Backend URL (e.g. Render / Railway / Cloud run backend)
    if (backendUrl) {
        try {
            const token = await getAuthToken();
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const response = await fetch(`${backendUrl}/api/generate`, {
                method: "POST",
                headers: headers,
                body: JSON.stringify({
                    model: modelName,
                    contents: params.contents,
                    config: params.config
                })
            });

            if (response.ok) {
                const data = await response.json();
                const result = { text: data.text };
                if (!skipCache) {
                    setCachedAIResponse(modelName, params.contents, result);
                }
                return result;
            }
        } catch (backendErr) {
            console.warn("Backend API call failed, attempting fallback modes:", backendErr);
        }
    }

    // Mode B: Direct Client-Side Gemini SDK with Load Balancer & Verified Models
    const keys = getGeminiKeys();
    if (keys.length > 0) {
        try {
            const lb = getLoadBalancer();
            const textResult = await lb.execute(async (apiKey: string) => {
                const ai = new GoogleGenAI({ apiKey });
                // Verified models available on Google API
                const candidateModels = Array.from(
                    new Set([modelName || GEMINI_MODEL, 'gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'])
                );

                let lastErr: any = null;
                for (const m of candidateModels) {
                    try {
                        const response = await ai.models.generateContent({
                            model: m,
                            contents: params.contents,
                            config: params.config
                        });
                        if (response && response.text) {
                            return response.text;
                        }
                    } catch (mErr: any) {
                        lastErr = mErr;
                        const errMsg = (mErr?.message || '').toLowerCase();
                        if (errMsg.includes('404') || errMsg.includes('not found')) {
                            console.warn(`Model ${m} returned 404, attempting fallback candidate model...`);
                            continue;
                        }
                        throw mErr;
                    }
                }
                throw lastErr || new Error("All Gemini model candidates failed.");
            });

            const result = { text: textResult };
            if (!skipCache) {
                setCachedAIResponse(modelName, params.contents, result);
            }
            return result;
        } catch (directErr: any) {
            console.error("Direct Gemini API error:", directErr);
            throw new Error(directErr.message || "Failed to generate AI response via Gemini API.");
        }
    }

    // Mode C: Local Backend Fallback (development mode)
    try {
        const defaultBackend = "http://localhost:8000";
        const response = await fetch(`${defaultBackend}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: modelName,
                contents: params.contents,
                config: params.config
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(errBody || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const result = { text: data.text };
        if (!skipCache) {
            setCachedAIResponse(modelName, params.contents, result);
        }
        return result;

    } catch (error: any) {
        console.error("Backend API Connection Refused:", error);
        throw new Error(
            "AI service unavailable. When deploying on Vercel, please set VITE_GEMINI_API_KEY or VITE_BACKEND_URL in your Vercel Environment Variables."
        );
    }
};

export const getAiInstance = () => {
    return null as any;
};
export const ai = null as any;

