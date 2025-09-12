import { GoogleGenAI } from "@google/genai";
import { parseApiError } from './geminiService';

let ai: GoogleGenAI | null = null;
const API_KEY = process.env.API_KEY;

if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
    console.error("Gemini API key not found for translation service.");
}

const checkApi = (): GoogleGenAI => {
    if (!ai) {
        throw new Error("API key not configured for translation service.");
    }
    return ai;
};

/**
 * Translates the given text to the target language using the Gemini API.
 * @param text The text to translate.
 * @param targetLanguage The target language ('Thai' or 'English').
 * @returns A promise that resolves to the translated text.
 */
export const translateText = async (text: string, targetLanguage: 'Thai' | 'English'): Promise<string> => {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Translate the following text to ${targetLanguage}. Respond only with the translated text, without any preamble or explanation.\n\nText: "${text}"`,
            config: {
                // Using a small thinking budget for faster, direct translations.
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error translating text:", error);
        throw new Error(`Could not translate: ${parseApiError(error)}`);
    }
};
