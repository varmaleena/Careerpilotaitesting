import { getCachedAIResponse, setCachedAIResponse } from "./aiCache";

export const GEMINI_MODEL = 'gemini-2.5-flash';

// Force true as the Python backend handles keys securely server-side
export const HAS_GEMINI_KEYS = true;

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
 * generateWithRetry — Proxies calls to the local Python FastAPI Backend.
 * Uses session-level cache to reduce redundant network hits.
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

    const BACKEND_URL = "http://localhost:8000";

    try {
        const response = await fetch(`${BACKEND_URL}/api/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
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
        
        // Match the shape expected by the frontend calling code: { text: string }
        const result = {
            text: data.text
        };

        // Cache successful response
        if (!skipCache) {
            setCachedAIResponse(modelName, params.contents, result);
        }

        return result;

    } catch (error: any) {
        console.error("Backend API Request Error:", error);
        throw new Error(error.message || "Failed to communicate with the Python backend server.");
    }
};

// Export fallback mock for consistent interface (though raw 'ai' is not directly used)
export const getAiInstance = () => {
    return null as any;
};
export const ai = null as any;
