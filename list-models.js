import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.VITE_GEMINI_API_KEY || "AIzaSyD9X4zCAUCV90TowgQ20G3RpwRwDzY4oEc";
const ai = new GoogleGenAI({ apiKey });

async function testGenerate36() {
    try {
        console.log("Testing generation with gemini-3.6-flash...");
        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: "Say 'Gemini 3.6 Flash is active!'"
        });
        console.log("SUCCESS Response:", response.text);
    } catch (error) {
        console.error("ERROR generating with gemini-3.6-flash:", error);
    }
}

testGenerate36();
