import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.VITE_GEMINI_API_KEY || "AIzaSyD9X4zCAUCV90TowgQ20G3RpwRwDzY4oEc";
const ai = new GoogleGenAI({ apiKey });

async function listModels() {
    try {
        const models = await ai.models.list();
        console.log("Available models:");
        models.forEach((model: any) => {
            console.log(`- ${model.name} (${model.displayName})`);
        });
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
