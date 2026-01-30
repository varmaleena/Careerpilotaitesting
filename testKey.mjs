import { GoogleGenAI } from "@google/genai";

const key = process.env.TEST_KEY;
if (!key) {
  console.error('No TEST_KEY provided in environment');
  process.exit(2);
}

const ai = new GoogleGenAI({ apiKey: key });

(async () => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ type: 'text', text: 'Say hello in one short sentence.' }]
    });
    console.log('SUCCESS', JSON.stringify(response, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err && err.toString ? err.toString() : JSON.stringify(err));
    if (err?.response?.data) console.error('DETAILS', JSON.stringify(err.response.data));
    process.exit(1);
  }
})();
