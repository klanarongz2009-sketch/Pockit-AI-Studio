
import { GoogleGenAI, Type, Chat, Modality, Content, GenerateContentResponse } from "@google/genai";
import * as preferenceService from './preferenceService';
import { AiModel } from './aiModels';

// Interfaces remain as exports for type safety across the app
export interface AnimationIdea {
    title: string;
    prompt: string;
}

// FIX: Added missing type definitions.
export type Song = string[][];

export interface MidiNote {
    pitch: number;
    startTime: number;
    duration: number;
}

export interface SoundEffectParameters {
    name: string;
    type: 'sine' | 'square' | 'sawtooth' | 'triangle';
    startFreq: number;
    endFreq: number;
    duration: number;
    volume: number;
}


export interface PromptSuggestion {
    title: string;
    prompt: string;
}

export interface PromptEnhancement {
    title: string;
    description: string;
    prompt: string;
}

export interface WordMatch {
    category: string;
    match: string;
}

export interface SearchResult {
    identificationType: 'direct' | 'similarity';
    title: string | null;
    artist: string | null;
    album: string | null;
    year: string | null;
    genre: string | null;
    overview: string;
    searchSuggestions: string[];
    sources: {
        uri: string;
        title: string;
    }[];
}

export interface PromptEvaluation {
    similarity: number; // 0-100
    feedback: string;
}

export interface AiDetectionResult {
    isAI: boolean;
    aiProbability: number; // 0-100
    reasoning: string;
}

export interface AppProfile {
    suggestedNames: string[];
    description: string;
    keywords: string[];
    manifest: {
      short_name: string;
      name: string;
      description: string;
      display: string;
      background_color: string;
      theme_color: string;
    };
}

export interface ColorResult {
    hex: string;
    name: string;
    description: string;
}

// FIX: Added missing type definition for chat messages.
export interface FileChatMessage {
    role: 'user' | 'model';
    text: string;
}

let ai: GoogleGenAI | null = null;
const API_KEY = process.env.API_KEY;

if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
    console.error("Gemini API key not found. Please set the API_KEY environment variable.");
}

const checkApi = (): GoogleGenAI => {
    if (!ai) {
        throw new Error("ไม่ได้กำหนดค่า API_KEY ไม่สามารถเรียกใช้ Gemini API ได้");
    }
    return ai;
};

// --- Throttling for Image Generation ---
let lastImageGenerationTime = 0;
const MIN_IMAGE_GENERATION_INTERVAL_MS = 15000;

// --- Throttling for Video Generation ---
let lastVideoGenerationTime = 0;
const MIN_VIDEO_GENERATION_INTERVAL_MS = 120000;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const throttleImageGeneration = async () => {
    const now = Date.now();
    const timeSinceLast = now - lastImageGenerationTime;
    if (timeSinceLast < MIN_IMAGE_GENERATION_INTERVAL_MS) {
        const waitTime = MIN_IMAGE_GENERATION_INTERVAL_MS - timeSinceLast;
        await delay(waitTime);
    }
    lastImageGenerationTime = Date.now();
};

const throttleVideoGeneration = async () => {
    const now = Date.now();
    const timeSinceLast = now - lastVideoGenerationTime;
    if (timeSinceLast < MIN_VIDEO_GENERATION_INTERVAL_MS) {
        const waitTime = MIN_VIDEO_GENERATION_INTERVAL_MS - timeSinceLast;
        await delay(waitTime);
    }
    lastVideoGenerationTime = Date.now();
};

export function parseApiError(error: unknown): string {
    // 1. Handle specific Gemini API feedback structure (e.g., safety blocks)
    if (typeof error === 'object' && error !== null && 'promptFeedback' in error) {
        const feedback = (error as any).promptFeedback;
        if (feedback?.blockReason) {
            return `คำสั่งของคุณถูกบล็อกเนื่องจากนโยบายความปลอดภัย (${feedback.blockReason}). โปรดลองปรับเปลี่ยนคำสั่งให้เป็นกลางมากขึ้น`;
        }
    }

    let message = '';
    let details: any = {};

    // 2. Try to extract a structured error message and details
    if (error instanceof Error) {
        message = error.message;
    } else if (typeof error === 'object' && error !== null) {
        details = (error as any).error || (error as any).response?.data?.error || error;
        if (typeof details.message === 'string' && details.message.trim()) {
            message = details.message;
        } else {
            message = String(error);
        }
    } else if (error != null) {
        message = String(error);
    }
    
    const sanitizedMessage = message.trim();
    const lowerCaseMessage = sanitizedMessage.toLowerCase();

    // 3. Check for common, specific error types based on status or content
    // API Key / Permission Error
    if (details?.status === 'PERMISSION_DENIED' || lowerCaseMessage.includes('api key not valid')) {
        return 'เกิดข้อผิดพลาดในการกำหนดค่าบริการ ไม่สามารถเชื่อมต่อกับ AI ได้ในขณะนี้';
    }
    // Quota/Rate Limit Error
    if (details?.status === 'RESOURCE_EXHAUSTED' || lowerCaseMessage.includes('quota') || lowerCaseMessage.includes('rate limit')) {
        return 'มีการใช้งานเกินโควต้าที่กำหนด โปรดรอสักครู่แล้วลองอีกครั้ง';
    }
    // Invalid Argument Error
    if (details?.status === 'INVALID_ARGUMENT') {
        return `คำขอไม่ถูกต้อง: โปรดตรวจสอบว่าข้อมูลที่ส่งถูกต้องและครบถ้วน`;
    }
    // Server/Service Error
    if (lowerCaseMessage.includes('service is currently unavailable') || (details.code && details.code >= 500)) {
        return 'บริการ AI ไม่พร้อมใช้งานชั่วคราว โปรดลองอีกครั้งในภายหลัง';
    }
    // Safety Policy Error (catch-all)
    if (lowerCaseMessage.includes('safety policy') || lowerCaseMessage.includes('blocked') || lowerCaseMessage.includes('safety threshold')) {
        return `คำสั่งของคุณอาจขัดต่อนโยบายความปลอดภัยและถูกบล็อก โปรดลองปรับเปลี่ยนคำสั่ง`;
    }
    // Network Error
    if (lowerCaseMessage.includes('failed to fetch') || lowerCaseMessage.includes('network request failed')) {
        return 'เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณแล้วลองอีกครั้ง';
    }
    // JSON parsing error from `safeJsonParse`
    if (lowerCaseMessage.includes('api sent back a non-json response') || lowerCaseMessage.includes('api ส่งคืนการตอบกลับที่ไม่ใช่รูปแบบ json')) {
        return 'AI ส่งคืนข้อมูลในรูปแบบที่ไม่คาดคิด โปรดลองอีกครั้ง หากยังพบปัญหาอยู่ โปรดลองเปลี่ยนคำสั่งของคุณ';
    }
    
    // 4. Final cleanup and fallback
    let finalMessage = sanitizedMessage;
    if (finalMessage.startsWith('Error: ')) finalMessage = finalMessage.substring(7);
    if (finalMessage.startsWith('[GoogleGenerativeAI Error]: ')) finalMessage = finalMessage.substring(28);
    if (!finalMessage || finalMessage.toLowerCase() === 'undefined') {
        return 'เกิดข้อผิดพลาดที่ไม่สามารถระบุสาเหตุได้ โปรดลองอีกครั้งในภายหลัง';
    }

    // Default to showing the cleaned-up error message
    return `เกิดข้อผิดพลาดที่ไม่คาดคิด: ${finalMessage}`;
}


function safeJsonParse<T>(text: string | undefined): T {
    // 1. Ensure we have a workable string
    if (typeof text !== 'string' || text.trim() === '') {
        throw new Error("ได้รับข้อมูลตอบกลับที่ว่างเปล่าหรือไม่ถูกต้องจาก API");
    }

    let potentialJson = text.trim();

    // 2. Aggressively strip markdown fences
    // This handles cases like ```json ... ``` or just ``` ... ```
    const markdownMatch = potentialJson.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (markdownMatch && markdownMatch[1]) {
        potentialJson = markdownMatch[1].trim();
    }
    
    // 3. If the entire response is just 'undefined' after cleaning, it's invalid.
    if (potentialJson.toLowerCase() === 'undefined' || potentialJson === '') {
        console.error("Invalid content after cleaning. Original text:", text);
        throw new Error("API returned an empty or invalid 'undefined' response.");
    }

    // 4. Proactively replace unquoted 'undefined' with 'null' to fix malformed JSON from the API.
    // The word boundary `\b` ensures we don't replace 'undefined' inside a string.
    if (potentialJson.includes('undefined')) {
        potentialJson = potentialJson.replace(/\bundefined\b/g, 'null');
    }

    // 5. Attempt to parse the cleaned and potentially fixed string
    try {
        return JSON.parse(potentialJson);
    } catch (e: any) {
        console.error("Failed to parse JSON even after cleaning:", potentialJson);
        console.error("Original text from API:", text);
        throw new Error(`API ส่งคืนการตอบกลับที่ไม่ใช่รูปแบบ JSON ที่ถูกต้อง: ${e.message}`);
    }
}


// --- START OF IMPLEMENTED FUNCTIONS ---

// FIX: Implemented missing function generateSongFromMedia
export async function generateSongFromMedia(base64Data: string, mimeType: string): Promise<Song> {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType: mimeType } },
                    { text: 'Analyze this media and generate an 8-bit chiptune song based on its mood and content. The song should have 2 tracks. Respond ONLY with a JSON array of arrays of strings, where each string is a musical note (e.g., "C4", "G#3") or null for a rest.' }
                ]
            },
            config: {
                responseMimeType: "application/json",
            }
        });
        return safeJsonParse<Song>(response.text);
    } catch (error) {
        throw new Error(parseApiError(error));
    }
}

// FIX: Implemented missing function convertAudioToMidi
export async function convertAudioToMidi(base64Data: string, mimeType: string): Promise<MidiNote[]> {
    const ai = checkApi();
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                pitch: { type: Type.NUMBER, description: 'MIDI note number (e.g., 60 for C4)' },
                startTime: { type: Type.NUMBER, description: 'Start time in seconds' },
                duration: { type: Type.NUMBER, description: 'Duration in seconds' },
            },
            required: ['pitch', 'startTime', 'duration']
        }
    };
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType: mimeType } },
                    { text: 'Analyze the melody in this audio and convert it to a series of MIDI notes. Respond ONLY with the JSON.' }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });
        return safeJsonParse<MidiNote[]>(response.text);
    } catch (error) {
        throw new Error(parseApiError(error));
    }
}

// FIX: Implemented missing function generateSoundEffectIdeas
export async function generateSoundEffectIdeas(prompt: string): Promise<SoundEffectParameters[]> {
    const ai = checkApi();
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['sine', 'square', 'sawtooth', 'triangle'] },
                startFreq: { type: Type.NUMBER },
                endFreq: { type: Type.NUMBER },
                duration: { type: Type.NUMBER },
                volume: { type: Type.NUMBER },
            },
            required: ['name', 'type', 'startFreq', 'endFreq', 'duration', 'volume']
        }
    };
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate 4 distinct 8-bit sound effect parameter sets based on the theme "${prompt}". The duration should be between 0.1 and 0.5 seconds. Volume should be between 0.1 and 0.4. Frequencies should be between 100 and 4000. Respond ONLY with the JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });
        return safeJsonParse<SoundEffectParameters[]>(response.text);
    } catch (error) {
        throw new Error(parseApiError(error));
    }
}

// FIX: Implemented missing function getVideosOperation
export async function getVideosOperation(operation: any): Promise<any> {
    const ai = checkApi();
    try {
        return await ai.operations.getVideosOperation({ operation });
    } catch (error) {
        throw new Error(parseApiError(error));
    }
}

// FIX: Implemented missing function generateVideo
export async function generateVideo(prompt: string, image?: { imageBytes: string, mimeType: string }): Promise<any> {
    const ai = checkApi();
    await throttleVideoGeneration();
    try {
        return await ai.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt,
            image,
            config: { numberOfVideos: 1 }
        });
    } catch (error) {
        throw new Error(parseApiError(error));
    }
}

// FIX: Implemented missing function generateVideoSummary
export async function generateVideoSummary(base64Data: string, mimeType: string): Promise<string> {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType: mimeType } },
                    { text: 'Briefly summarize what is happening in this video. Respond in a single short sentence.' }
                ]
            },
        });
        return response.text.trim();
    } catch (error) {
        throw new Error(parseApiError(error));
    }
}

// FIX: Implemented missing function generateSubtitlesFromVideo
export async function generateSubtitlesFromVideo(base64Data: string, mimeType: string, language: string): Promise<string> {
    const ai = checkApi();
    const languageInstruction = language === 'auto' ? "auto-detect the language" : `translate the subtitles to ${language}`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType: mimeType } },
                    { text: `Generate subtitles for this media. You must ${languageInstruction}. Respond ONLY with the subtitles in VTT format.` }
                ]
            },
        });
        return response.text.trim();
    } catch (error) {
        throw new Error(parseApiError(error));
    }
}

// FIX: Implemented missing function analyzeFeedback
export async function analyzeFeedback(feedback: string): Promise<string> {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Summarize the following user feedback into a single, concise sentence focusing on the main point or suggestion. Feedback: "${feedback}"`,
        });
        return response.text.trim();
    } catch (error) {
        throw new Error(parseApiError(error));
    }
}

// FIX: Implemented missing function generatePromptFromImage
export async function generatePromptFromImage(base64Data: string, mimeType: string): Promise<string> {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType: mimeType } },
                    { text: 'Describe this image for an AI image generator to recreate it as pixel art. Focus on key subjects, style, and colors. Be concise.' }
                ]
            },
        });
        return response.text.trim();
    } catch (error) {
        throw new Error(parseApiError(error));
    }
}

// FIX: Implemented missing function generatePixelArt
export async function generatePixelArt(prompt: string): Promise<string> {
    const ai = checkApi();
    await throttleImageGeneration();
    try {
        const pixelArtPrompt = `${prompt}, 16-bit pixel art style, vibrant colors, detailed`;
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: pixelArtPrompt,
            config: {
              numberOfImages: 1,
              aspectRatio: '1:1',
            },
        });
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        return `data:image/png;base64,${base64ImageBytes}`;
    } catch (error) {
        throw new Error(parseApiError(error));
    }
}

// FIX: Implemented missing function generateGifFrames
export async function generateGifFrames(prompt: string, frameCount: number): Promise<string[]> {
    const ai = checkApi();
    try {
        const descriptionPrompt = `Based on the prompt "${prompt}", generate a JSON array of ${frameCount} distinct text prompts for an image generation model to create a smooth animation sequence. Each prompt in the array should be a detailed description of a single frame. The response must be only the JSON array of strings.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: descriptionPrompt,
            config: { responseMimeType: "application/json" }
        });
        const framePrompts = safeJsonParse<string[]>(response.text);

        if (!Array.isArray(framePrompts) || framePrompts.length === 0) {
            throw new Error("Failed to generate valid frame descriptions.");
        }
        
        const framePromises = framePrompts.map(p => generatePixelArt(p));
        return Promise.all(framePromises);
    } catch (error) {
        throw new Error(parseApiError(error));
    }
}

// FIX: Implemented missing function generatePromptSuggestions
export async function generatePromptSuggestions(prompt: string): Promise<PromptSuggestion[]> {
    const ai = checkApi();
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                prompt: { type: Type.STRING },
            },
            required: ['title', 'prompt']
        }
    };
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on the user's idea "${prompt}", generate 3 alternative or more detailed prompts for an image generator. Give each a short, creative title. Respond ONLY with the JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });
        return safeJsonParse<PromptSuggestion[]>(response.text);
    } catch (error) {
        throw new Error(parseApiError(error));
    }
}

// FIX: Implemented missing function getTicTacToeMove
export async function getTicTacToeMove(board: string[][], player: 'X' | 'O'): Promise<{ row: number, col: number }> {
    const ai = checkApi();
    const schema = {
        type: Type.OBJECT,
        properties: {
            row: { type: Type.NUMBER },
            col: { type: Type.NUMBER },
        },
        required: ['row', 'col']
    };
    try {
        const boardString = board.map(row => row.map(cell => cell || '-').join('')).join('\n');
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are an expert Tic-Tac-Toe player. Your symbol is '${player}'. Given the board below, determine the best possible move to win or draw. Respond ONLY with the JSON for your move.\n\n${boardString}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });
        return safeJsonParse<{ row: number, col: number }>(response.text);
    } catch (error) {
        throw new Error(parseApiError(error));
    }
}

// FIX: Implemented missing function generateSongFromText
export async function generateSongFromText(text: string, modelVersion: preferenceService.ModelVersion): Promise<Song> {
    const ai = checkApi();
    const trackCount = modelVersion === 'v1.5' ? 5 : (modelVersion === 'v2.0-beta' ? 6 : 2);
    const length = modelVersion === 'v2.0-beta' ? 'approximately 3 minutes long' : (modelVersion === 'v1.5' ? 'long' : 'short');
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the mood and theme of this text: "${text}". Generate a ${length} 8-bit chiptune song with ${trackCount} tracks based on it. Respond ONLY with a JSON array of arrays of strings, where each string is a musical note (e.g., "C4", "G#3") or null for a rest.`,
            config: {
                responseMimeType: "application/json",
            }
        });
        return safeJsonParse<Song>(response.text);
    } catch (error) {
        throw new Error(parseApiError(error));
    }
}

// FIX: Implemented missing function enhanceImageQuality
export async function enhanceImageQuality(base64Data: string, mimeType: string): Promise<string> {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType: mimeType } },
                    { text: 'Enhance the quality of this image. Increase sharpness and clarity.' }
                ]
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (imagePart?.inlineData) {
            return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        }
        throw new Error("AI did not return an enhanced image.");
    } catch (error) {
        throw new Error(parseApiError(error));
    }
}

// FIX: Implemented missing function analyzeAudioFromMedia
export async function analyzeAudioFromMedia(base64Data: string, mimeType: string): Promise<string> {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType: mimeType } },
                    { text: 'Describe the audio in this media. What sounds do you hear? What is the mood? Is there speech or music?' }
                ]
            },
        });
        return response.text.trim();
    } catch (error) {
        throw new Error(parseApiError(error));
    }
}

// FIX: Implemented missing function generateSecret
export async function generateSecret(topic: string): Promise<string> {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are a mysterious oracle. Tell me a creative, interesting, or little-known "secret" about "${topic}". Respond in a short, mysterious paragraph.`,
        });
        return response.text.trim();
    } catch (error) {
        throw new Error(parseApiError(error));
    }
}

// FIX: Implemented missing function generateWordMatches
export async function generateWordMatches(topic: string): Promise<WordMatch[]> {
    const ai = checkApi();
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                category: { type: Type.STRING },
                match: { type: Type.STRING },
            },
            required: ['category', 'match']
        }
    };
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a list of 5 creative word associations for the topic "${topic}". Each match should have a category (like "Color", "Feeling", "Object", "Action", "Sound"). Respond ONLY with the JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });
        return safeJsonParse<WordMatch[]>(response.text);
    } catch (error) {
        throw new Error(parseApiError(error));
    }
}

// FIX: Implemented missing function correctText
export async function correctText(text: string): Promise<string> {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Correct any spelling and grammar mistakes in the following Thai text. Respond only with the corrected text.\n\nText: "${text}"`,
        });
        return response.text.trim();
    } catch (error) {
        throw new Error(parseApiError(error));
    }
}

// FIX: Implemented missing function identifyAndSearchMusic
export async function identifyAndSearchMusic(base64Data: string, mimeType: string): Promise<SearchResult> {
    const ai = checkApi();
    const prompt = `Analyze the audio in this media. Identify the song if possible (direct identification). If not, describe its characteristics and suggest similar artists (similarity identification). Provide a general overview and suggest some Google search terms. Please provide the response as a JSON object with this structure: { "identificationType": "direct" | "similarity", "title": string | null, "artist": string | null, "album": string | null, "year": string | null, "genre": string | null, "overview": string, "searchSuggestions": string[] }. Do not include a "sources" field in your JSON.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ inlineData: { data: base64Data, mimeType: mimeType } }, { text: prompt }] },
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const result = safeJsonParse<Omit<SearchResult, 'sources'>>(response.text);
        // FIX: Safely handle optional chaining to prevent runtime errors when grounding chunks are not available.
        const sources = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []).map((chunk: any) => ({
            uri: chunk.web?.uri || '',
            title: chunk.web?.title || ''
        })).filter(s => s.uri);

        return { ...result, sources };

    } catch (error) {
        throw new Error(parseApiError(error));
    }
}

// FIX: Implemented missing function evaluatePromptGuess
export async function evaluatePromptGuess(secretPrompt: string, userGuess: string): Promise<PromptEvaluation> {
    const ai = checkApi();
    const schema = {
        type: Type.OBJECT,
        properties: {
            similarity: { type: Type.NUMBER, description: 'A percentage from 0 to 100 indicating how similar the guess is to the secret prompt.' },
            feedback: { type: Type.STRING, description: 'A short, encouraging feedback sentence for the user.' },
        },
        required: ['similarity', 'feedback']
    };
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `The secret prompt was: "${secretPrompt}". The user guessed: "${userGuess}". Evaluate the similarity and provide feedback. Respond ONLY with the JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });
        return safeJsonParse<PromptEvaluation>(response.text);
    } catch (error) {
        throw new Error(parseApiError(error));
    }
}

let chatSessions = new Map<string, Chat>();

// FIX: Implemented missing function resetChatSession
export function resetChatSession() {
    chatSessions.clear();
}

// FIX: Implemented missing function sendMessageToChat
export async function sendMessageToChat(prompt: string, model: AiModel, webSearchEnabled: boolean): Promise<{ text: string, sources?: any[] }> {
    const ai = checkApi();
    if (model.id === 'local-robot') {
        return { text: "บี๊บ บู๊บ... ฉันคือหุ่นยนต์" };
    }
    try {
        let chat = chatSessions.get(model.id);
        if (!chat) {
            const chatConfig = {
                systemInstruction: model.systemInstruction,
                ...model.config
            };

            chat = ai.chats.create({
                model: model.id,
                config: chatConfig,
            });
            chatSessions.set(model.id, chat);
        }

        if (webSearchEnabled) {
            const webSearchConfig = {
                systemInstruction: model.systemInstruction,
                ...model.config,
                tools: [{ googleSearch: {} }]
            };
            const response = await ai.models.generateContent({
                model: model.id,
                contents: prompt,
                config: webSearchConfig,
            });
            // FIX: Safely handle optional chaining to prevent runtime errors when grounding chunks are not available.
            const sources = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []).map((chunk: any) => ({
                uri: chunk.web?.uri || '',
                title: chunk.web?.title || ''
            })).filter(s => s.uri);
            return { text: response.text, sources: sources };
        } else {
            const response = await chat.sendMessage({ message: prompt });
            return { text: response.text };
        }
    } catch (error) {
        throw new Error(parseApiError(error));
    }
}

// FIX: Implemented missing function chatWithFile
export async function chatWithFile(file: { base64: string; mimeType: string }, history: FileChatMessage[], prompt: string): Promise<string> {
    const ai = checkApi();
    const contents: Content[] = history.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
    contents.push({ role: 'user', parts: [{ inlineData: { data: file.base64, mimeType: file.mimeType } }, { text: prompt }] });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
        });
        return response.text;
    } catch (error) {
        throw new Error(parseApiError(error));
    }
}

// FIX: Implemented missing function generateCodeFromImage
export async function generateCodeFromImage(base64Data: string, mimeType: string): Promise<string> {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType: mimeType } },
                    { text: 'Analyze this UI mockup image and generate a single HTML file with embedded CSS that recreates it. Use placeholder text and images if necessary. The entire response must be only the HTML code, starting with <!DOCTYPE html>.' }
                ]
            },
        });
        const code = response.text.trim();
        // Ensure it's returning a full HTML document
        if (code.toLowerCase().startsWith('```html')) {
            return code.substring(7, code.length - 3).trim();
        }
        return code;
    } catch (error) {
        throw new Error(parseApiError(error));
    }
}

// FIX: Implemented missing function translateText (moved from translationService)
export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Translate the following text to ${targetLanguage}. Respond only with the translated text, without any preamble or explanation.\n\nText: "${text}"`,
            config: {
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        return response.text.trim();
    } catch (error) {
        throw new Error(parseApiError(error));
    }
};

// FIX: Implemented missing function detectAiContent
export async function detectAiContent(content: { text?: string; file?: { base64: string; mimeType: string; } }): Promise<AiDetectionResult> {
    const ai = checkApi();
    const schema = {
        type: Type.OBJECT,
        properties: {
            isAI: { type: Type.BOOLEAN },
            aiProbability: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
        },
        required: ['isAI', 'aiProbability', 'reasoning']
    };
    const parts: any[] = [];
    if (content.text) {
        parts.push({ text: `Text content: "${content.text}"` });
    }
    if (content.file) {
        parts.push({ inlineData: { data: content.file.base64, mimeType: content.file.mimeType } });
    }
    parts.push({ text: 'Analyze the provided content. Determine if it was likely generated by an AI. Provide a probability and a brief reasoning. If it is human-generated, set aiProbability to 0. Respond ONLY with the JSON.' });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });
        return safeJsonParse<AiDetectionResult>(response.text);
    } catch (error) {
        throw new Error(parseApiError(error));
    }
}

// FIX: Implemented missing function generateAppProfile
export async function generateAppProfile(appIdea: string): Promise<AppProfile> {
    const ai = checkApi();
    const schema = {
        type: Type.OBJECT,
        properties: {
            suggestedNames: { type: Type.ARRAY, items: { type: Type.STRING } },
            description: { type: Type.STRING },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            manifest: {
                type: Type.OBJECT,
                properties: {
                    short_name: { type: Type.STRING },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    display: { type: Type.STRING, enum: ['standalone', 'fullscreen', 'minimal-ui', 'browser'] },
                    background_color: { type: Type.STRING },
                    theme_color: { type: Type.STRING },
                },
                required: ['short_name', 'name', 'description', 'display', 'background_color', 'theme_color']
            }
        },
        required: ['suggestedNames', 'description', 'keywords', 'manifest']
    };
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a profile for a web application based on this idea: "${appIdea}". Include 3 suggested names, a short description, 5 relevant keywords, and a complete manifest.json object. For the manifest, use one of the suggested names and choose appropriate theme colors. Respond ONLY with the JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });
        return safeJsonParse<AppProfile>(response.text);
    } catch (error) {
        throw new Error(parseApiError(error));
    }
}

// FIX: Implemented missing function extractColorPalette
export async function extractColorPalette(base64Data: string, mimeType: string): Promise<ColorResult[]> {
    const ai = checkApi();
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                hex: { type: Type.STRING },
                name: { type: Type.STRING },
                description: { type: Type.STRING },
            },
            required: ['hex', 'name', 'description']
        }
    };
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType: mimeType } },
                    { text: 'Extract a color palette of 5 main colors from this image. For each color, provide its hex code, a creative name, and a short description of its mood. Respond ONLY with the JSON.' }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });
        return safeJsonParse<ColorResult[]>(response.text);
    } catch (error) {
        throw new Error(parseApiError(error));
    }
}