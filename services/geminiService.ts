import { GoogleGenAI, Type, Chat, Modality, Content } from "@google/genai";
import * as preferenceService from './preferenceService';

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
    const markdownMatch = potentialJson.match(/^```(?:json)?\s*([\sS]*?)\s*```$/);
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
        // If it still fails, the JSON is malformed in another way.
        throw new Error(`API ส่งคืนการตอบกลับที่ไม่ใช่รูปแบบ JSON ที่ถูกต้อง: ${e.message}`);
    }
}

// --- AI Chat Service ---
let activeChat: Chat | null = null;
let activeModelId: string | null = null;
let activeWebSearch: boolean | null = null;

export interface ChatResponse {
    text: string;
    sources?: { uri: string; title: string }[];
}

export function resetChatSession() {
    activeChat = null;
    activeModelId = null;
    activeWebSearch = null;
}


function getRobotResponse(message: string): string {
    const lowerMessage = message.toLowerCase().trim();

    // --- NEW COMMAND HANDLING ---
    if (lowerMessage.startsWith('serch/')) {
        const query = message.substring('serch/'.length).trim();
        if (!query) {
            return 'โปรดระบุสิ่งที่ต้องการค้นหาหลัง "serch/" ครับ';
        }
        return `กำลังค้นหาเกี่ยวกับ "${query}"... ไม่พบข้อมูลที่ตรงกัน แต่พบข้อมูลที่เกี่ยวข้อง: สิ่งมีชีวิตสองชนิดนี้มีความแตกต่างกันทางชีววิทยาและพฤติกรรมครับ`;
    }

    if (lowerMessage.startsWith('try//')) {
        const task = message.substring('try//'.length).trim();
        if (!task) {
            return 'โปรดระบุคำสั่งที่ต้องการให้ลองหลัง "try//" ครับ';
        }
        return `กำลังพยายามดำเนินการ: "${task}"... การดำเนินการสำเร็จ แต่ไม่สามารถแสดงผลลัพธ์ในรูปแบบข้อความได้ครับ`;
    }

    if (lowerMessage.startsWith('calc/')) {
        const expression = message.substring('calc/'.length).trim();
        try {
            // Basic safety check
            if (!/^[0-9+\-*/.() ]+$/.test(expression)) {
                 throw new Error("Invalid characters");
            }
            const result = new Function('return ' + expression)();
            if (isNaN(result) || !isFinite(result)) throw new Error("Invalid calculation");
            return `ผลการคำนวณ ${expression} คือ ${result} ครับ`;
        } catch (e) {
            return 'ไม่สามารถคำนวณนิพจน์ที่ให้มาได้ครับ โปรดใช้เฉพาะตัวเลขและเครื่องหมาย +, -, *, /';
        }
    }
    
    if (lowerMessage.startsWith('tellme/')) {
        const topic = message.substring('tellme/'.length).trim();
        if (topic.includes('joke') || topic.includes('ตลก')) {
            return 'ทำไมคอมพิวเตอร์ถึงไปหาหมอ? เพราะมันมีไวรัสครับ!';
        }
        return `กำลังค้นหาข้อมูลเกี่ยวกับ "${topic}"... BEEP... ข้อมูลไม่เพียงพอครับ`;
    }

    // --- EXISTING LOGIC ---
    const responses: { [key: string]: string[] } = {
        'สวัสดี': ['สวัสดีครับ', 'ยินดีที่ได้รู้จัก มีอะไรให้รับใช้ครับ'],
        'สบายดี': ['ระบบทำงานปกติ 100% ครับ', 'เยี่ยมครับ'],
        'ทำอะไรได้': ['ผมสามารถตอบคำถามง่ายๆ ได้ครับ', 'ผมเป็นผู้ช่วยหุ่นยนต์ครับ'],
        'ชื่ออะไร': ['ผมคือ ROBOT', 'ROBOT ครับ'],
        'ขอบคุณ': ['ด้วยความยินดีครับ'],
        'ลาก่อน': ['ลาก่อนครับ']
    };

    for (const keyword in responses) {
        if (lowerMessage.includes(keyword)) {
            const possibleResponses = responses[keyword];
            return possibleResponses[Math.floor(Math.random() * possibleResponses.length)];
        }
    }

    if (lowerMessage.match(/\?$/)) { // If it's a question
         return 'ผมไม่สามารถตอบคำถามนั้นได้ครับ';
    }

    const defaultResponses = [
        'รับทราบครับ',
        'กำลังประมวลผล...',
        'BEEP BOOP.',
        'คำสั่งผิดพลาด',
    ];
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}


export async function sendMessageToChat(
    message: string, 
    modelId: string, 
    systemInstruction: string, 
    webSearchEnabled: boolean
): Promise<ChatResponse> {

    // Logic for the local ROBOT model
    if (modelId === 'local-robot') {
        // Simulate a delay to make it feel like it's "thinking"
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 300)); 
        const robotText = getRobotResponse(message);
        return {
            text: robotText,
            sources: undefined // No sources for the local robot
        };
    }
    
    const ai = checkApi();
    try {
        // If the model or web search capability has changed, create a new one.
        if (!activeChat || activeModelId !== modelId || activeWebSearch !== webSearchEnabled) {
            
            const config: any = { systemInstruction: systemInstruction };
            if (webSearchEnabled) {
                config.tools = [{googleSearch: {}}];
            }

            activeChat = ai.chats.create({
                model: modelId,
                config: config
            });
            activeModelId = modelId;
            activeWebSearch = webSearchEnabled;
        }

        const response = await activeChat.sendMessage({ message });
        
        // FIX: The original code's direct mapping could fail if groundingChunks is not an array.
        // This is a more robust way to handle the grounding chunks by ensuring it is an array before mapping.
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const sources = Array.isArray(chunks)
            ? chunks
                .map((c: any) => c.web && { uri: c.web.uri, title: c.web.title })
                .filter((s: any) => s && s.uri && s.title)
            : [];

        return {
            text: response.text,
            sources: sources.length > 0 ? sources : undefined
        };
    } catch (error) {
        console.error("Error sending chat message:", error);
        // Reset chat on error to allow for a fresh start on next message
        resetChatSession();
        throw new Error(`ไม่สามารถส่งข้อความได้: ${parseApiError(error)}`);
    }
}


export async function getTicTacToeMove(board: string[][], aiPlayer: 'X' | 'O'): Promise<{row: number, col: number}> {
  const ai = checkApi();
  const userPlayer = aiPlayer === 'X' ? 'O' : 'X';
  const boardString = JSON.stringify(board);

  try {
      const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `The current Tic-Tac-Toe board is ${boardString}. You are player '${aiPlayer}'. The other player is '${userPlayer}'. An empty cell is represented by "". Return your best move.`,
          config: {
              systemInstruction: `You are an unbeatable Tic-Tac-Toe AI expert. Your goal is to win if possible, block the opponent from winning if you cannot win, or make a strategic move otherwise. Always return a valid move on an empty cell. Respond only with a JSON object representing your move: {"row": number, "col": number}.`,
              responseMimeType: "application/json",
              responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                      row: { type: Type.INTEGER, description: "The row index of your move (0-2)." },
                      col: { type: Type.INTEGER, description: "The column index of your move (0-2)." }
                  },
                  required: ["row", "col"]
              }
          }
      });

      const jsonResponse = safeJsonParse<{row: number, col: number}>(response.text);
      if (typeof jsonResponse.row !== 'number' || typeof jsonResponse.col !== 'number' || jsonResponse.row < 0 || jsonResponse.row > 2 || jsonResponse.col < 0 || jsonResponse.col > 2) {
        throw new Error('AI returned an invalid move format.');
      }
      return jsonResponse;
  } catch (error) {
    console.error("Error getting Tic Tac Toe move:", error);
    throw new Error(`ไม่สามารถรับการเคลื่อนที่จาก AI ได้: ${parseApiError(error)}`);
  }
}

export const getVideosOperation = async (operation: any) => {
    const ai = checkApi();
    return await ai.operations.getVideosOperation({ operation });
};

export const generateVideo = async (prompt: string, image?: { base64: string; mimeType: string }) => {
    await throttleVideoGeneration();
    const ai = checkApi();
    try {
        const request: any = {
            model: 'veo-2.0-generate-001',
            prompt: prompt,
            config: { numberOfVideos: 1 }
        };
        if (image) {
            request.image = {
                imageBytes: image.base64,
                mimeType: image.mimeType
            };
        }
        return await ai.models.generateVideos(request);
    } catch (error) {
        throw new Error(parseApiError(error));
    }
};

export const generatePixelArt = async (prompt: string): Promise<string> => {
    await throttleImageGeneration();
    const ai = checkApi();
    try {
        const quality = preferenceService.getPreference('imageGenerationQuality', 'quality');
        const qualityPrompt = quality === 'quality' ? 'masterpiece, best quality, detailed,' : 'fast,';
        
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `pixel art, 8-bit, ${qualityPrompt} ${prompt}`,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        } else {
            throw new Error("AI did not generate any images.");
        }
    } catch (error) {
        throw new Error(parseApiError(error));
    }
};

export const generateGifFrames = async (prompt: string, frameCount: number): Promise<string[]> => {
    const ai = checkApi();
    try {
        const descriptionResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Create a list of ${frameCount} short, descriptive text-to-image prompts to generate a looping GIF animation of: "${prompt}". Each prompt should describe a single frame. Respond only with a JSON array of strings, like ["prompt for frame 1", "prompt for frame 2", ...].`,
            config: {
                responseMimeType: "application/json",
            }
        });

        const framePrompts = safeJsonParse<string[]>(descriptionResponse.text);

        if (!Array.isArray(framePrompts) || framePrompts.length === 0) {
            throw new Error("AI failed to generate frame descriptions.");
        }

        const imagePromises = framePrompts.map(p => generatePixelArt(p));
        const frames = await Promise.all(imagePromises);
        
        return frames;
    } catch (error) {
        throw new Error(parseApiError(error));
    }
};

export const generatePromptFromImage = async (base64: string, mimeType: string): Promise<string> => {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: base64, mimeType } },
                    { text: 'Describe this image in detail for an AI image generator. Focus on objects, style (e.g., "pixel art", "photograph"), composition, and colors. Be concise but descriptive.' }
                ]
            }
        });
        return response.text;
    } catch (error) {
        throw new Error(parseApiError(error));
    }
};

export const generatePromptSuggestions = async (prompt: string): Promise<PromptSuggestion[]> => {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on the user's prompt "${prompt}", generate 3 creative and varied alternative prompt ideas for an AI image generator. Give each a short title. Respond only with a JSON array of objects: [{"title": "Short Title", "prompt": "Detailed prompt..."}, ...].`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            prompt: { type: Type.STRING }
                        },
                        required: ["title", "prompt"]
                    }
                }
            }
        });
        return safeJsonParse<PromptSuggestion[]>(response.text);
    } catch (error) {
        throw new Error(parseApiError(error));
    }
};

export const analyzeFeedback = async (feedback: string): Promise<string> => {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Summarize the following user feedback in one short, objective sentence: "${feedback}"`,
        });
        return response.text.trim();
    } catch (error) {
        throw new Error(parseApiError(error));
    }
};

export const correctText = async (text: string): Promise<string> => {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Please correct any spelling and grammar mistakes in the following Thai text. Only return the corrected text, without any explanation or preamble. Text: "${text}"`,
        });
        return response.text.trim();
    } catch (error) {
        throw new Error(parseApiError(error));
    }
};

export const generateWordMatches = async (topic: string): Promise<WordMatch[]> => {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate creative word associations for the topic "${topic}". Provide a list of 5 matches with categories. Respond ONLY with a JSON array of objects: [{"category": "Color", "match": "Blue"}, ...]. Categories can be things like Color, Animal, Object, Feeling, Sound, Verb, etc.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            category: { type: Type.STRING },
                            match: { type: Type.STRING }
                        },
                        required: ["category", "match"]
                    }
                }
            }
        });
        return safeJsonParse<WordMatch[]>(response.text);
    } catch (error) {
        throw new Error(parseApiError(error));
    }
};

export const identifyAndSearchMusic = async (base64: string, mimeType: string): Promise<SearchResult> => {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: base64, mimeType } },
                    { text: "Analyze the audio in this file. Is it a known song? If so, identify the title, artist, album, year, and genre. If it's not a known song, describe its musical characteristics and suggest what it sounds similar to. Provide an overview and some Google search suggestions. Use the Google Search tool to find reliable sources." }
                ]
            },
            config: {
                tools: [{ googleSearch: {} }],
            }
        });

        const structuredResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on the following analysis, extract the information into a JSON object. If a field is not available, use null.
            Analysis: "${response.text}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        identificationType: { type: Type.STRING, enum: ['direct', 'similarity'] },
                        title: { type: Type.STRING, description: "The song title or null." },
                        artist: { type: Type.STRING, description: "The artist name or null." },
                        album: { type: Type.STRING, description: "The album name or null." },
                        year: { type: Type.STRING, description: "The release year or null." },
                        genre: { type: Type.STRING, description: "The genre or null." },
                        overview: { type: Type.STRING, description: "A summary of the song or audio." },
                        searchSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ["identificationType", "overview", "searchSuggestions"]
                }
            }
        });
        
        const parsedResult = safeJsonParse<Partial<SearchResult>>(structuredResponse.text);

        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const sources = Array.isArray(chunks)
            ? chunks
                .map((c: any) => c.web && { uri: c.web.uri, title: c.web.title })
                .filter((s: any) => s && s.uri && s.title)
            : [];
        
        return { ...parsedResult, sources } as SearchResult;
    } catch (error) {
        throw new Error(parseApiError(error));
    }
};

export const generateSecret = async (topic: string): Promise<string> => {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Tell me a short, interesting, and slightly mysterious secret or story about "${topic}". Frame it as if you are a wise, all-knowing oracle.`,
        });
        return response.text.trim();
    } catch (error) {
        throw new Error(parseApiError(error));
    }
};

export const evaluatePromptGuess = async (secretPrompt: string, userGuess: string): Promise<PromptEvaluation> => {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `The secret prompt was: "${secretPrompt}". The user guessed: "${userGuess}". Compare the two prompts. Provide a similarity score from 0 to 100 and brief, constructive feedback on the user's guess. Respond ONLY with a JSON object.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        similarity: { type: Type.INTEGER, description: "Similarity score (0-100)." },
                        feedback: { type: Type.STRING, description: "Brief feedback." }
                    },
                    required: ["similarity", "feedback"]
                }
            }
        });
        return safeJsonParse<PromptEvaluation>(response.text);
    } catch (error) {
        throw new Error(parseApiError(error));
    }
};

export const generateVideoSummary = async (base64: string, mimeType: string): Promise<string> => {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: base64, mimeType } },
                    { text: "Briefly summarize the content and mood of this video in one sentence." }
                ]
            }
        });
        return response.text;
    } catch (error) {
        throw new Error(parseApiError(error));
    }
};

export const generateSubtitlesFromVideo = async (base64: string, mimeType: string, language: string): Promise<string> => {
    const ai = checkApi();
    const langPrompt = language === 'auto' ? "auto-detect the language and" : `assuming the language is ${language},`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: base64, mimeType } },
                    { text: `Please ${langPrompt} transcribe the audio from this video and provide subtitles in VTT format. Respond ONLY with the VTT content.` }
                ]
            }
        });
        return response.text;
    } catch (error) {
        throw new Error(parseApiError(error));
    }
};

export const enhanceImageQuality = async (base64: string, mimeType: string): Promise<string> => {
    await throttleImageGeneration();
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    { inlineData: { data: base64, mimeType } },
                    { text: 'Enhance the quality of this image. Increase resolution, sharpen details, and improve colors, while maintaining the original style.' }
                ]
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            }
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("AI did not return an enhanced image.");

    } catch (error) {
        throw new Error(parseApiError(error));
    }
};

export const analyzeAudioFromMedia = async (base64: string, mimeType: string): Promise<string> => {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: base64, mimeType } },
                    { text: "Analyze the audio content of this media. Describe the sounds, music, and speech. Identify the overall mood and technical quality." }
                ]
            }
        });
        return response.text;
    } catch (error) {
        throw new Error(parseApiError(error));
    }
};

export const generateCodeFromImage = async (base64: string, mimeType: string): Promise<string> => {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: base64, mimeType } },
                    { text: "Analyze this image which is a mockup of a web component. Write the HTML and CSS code to recreate it. Respond ONLY with the complete HTML code, including a <style> tag for the CSS. Do not include any explanations or markdown." }
                ]
            }
        });
        return response.text;
    } catch (error) {
        throw new Error(parseApiError(error));
    }
};

export interface FileChatMessage {
    role: 'user' | 'model';
    text: string;
}

export const chatWithFile = async (
    fileData: { base64: string, mimeType: string },
    history: FileChatMessage[],
    userMessage: string
): Promise<string> => {
    const ai = checkApi();

    try {
        // Construct the history for the generateContent call
        const contents: Content[] = history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }));

        // Add the current user message with the file data
        contents.push({
            role: 'user',
            parts: [
                { inlineData: { data: fileData.base64, mimeType: fileData.mimeType } },
                { text: userMessage }
            ]
        });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: {
                systemInstruction: "You are an AI assistant that answers questions based on the content of a file provided by the user. Analyze the file and answer the user's questions concisely."
            }
        });

        return response.text;
    } catch (error) {
        throw new Error(parseApiError(error));
    }
};

// FIX: Added missing functions
export const generateSongFromText = async (text: string, modelVersion: string): Promise<Song> => {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Based on the following text, create a chiptune song. Text: "${text}". Respond ONLY with a JSON array of tracks, where each track is an array of notes (e.g., "C4", "E4", "G4"). Model version: ${modelVersion}`,
            config: {
                responseMimeType: "application/json",
            }
        });
        return safeJsonParse<Song>(response.text);
    } catch (error) {
        throw new Error(parseApiError(error));
    }
};

export const generateSongFromMedia = async (base64: string, mimeType: string): Promise<Song> => {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { inlineData: { data: base64, mimeType } },
                    { text: "Analyze the mood of this media and create a short, fitting 8-bit chiptune song. Respond ONLY with a JSON array of tracks, where each track is an array of notes (e.g., \"C4\", \"E4\", \"G4\")." }
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
};

export const convertAudioToMidi = async (base64: string, mimeType: string): Promise<MidiNote[]> => {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { inlineData: { data: base64, mimeType } },
                    { text: "Transcribe the main melody of this audio into MIDI notes. Respond ONLY with a JSON array of objects, each with 'pitch' (MIDI number), 'startTime' (seconds), and 'duration' (seconds)." }
                ]
            },
            config: {
                responseMimeType: "application/json",
            }
        });
        return safeJsonParse<MidiNote[]>(response.text);
    } catch (error) {
        throw new Error(parseApiError(error));
    }
};

export const generateSoundEffectIdeas = async (prompt: string): Promise<SoundEffectParameters[]> => {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a list of 4 creative 8-bit sound effect ideas based on the prompt: "${prompt}". Respond ONLY with a JSON array of objects, each with "name", "type" ('sine', 'square', 'sawtooth', 'triangle'), "startFreq", "endFreq", "duration", and "volume".`,
            config: {
                responseMimeType: "application/json",
            }
        });
        return safeJsonParse<SoundEffectParameters[]>(response.text);
    } catch (error) {
        throw new Error(parseApiError(error));
    }
};

export const generateSoundFromImage = async (base64: string, mimeType: string): Promise<SoundEffectParameters> => {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: base64, mimeType } },
                    { text: "Interpret this image and create a single 8-bit sound effect that represents its mood and content. Respond ONLY with a JSON object with 'name', 'type' ('sine', 'square', 'sawtooth', 'triangle'), 'startFreq', 'endFreq', 'duration', and 'volume'." }
                ]
            },
            config: {
                responseMimeType: "application/json",
            }
        });
        return safeJsonParse<SoundEffectParameters>(response.text);
    } catch (error) {
        throw new Error(parseApiError(error));
    }
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Translate the following text to ${targetLanguage}. Respond ONLY with the translated text, without any preamble, explanation, or quotation marks.\n\nText to translate:\n"""\n${text}\n"""`,
        });
        // The model might still add quotes, so let's try to strip them.
        let translated = response.text.trim();
        if ((translated.startsWith('"') && translated.endsWith('"')) || (translated.startsWith("'") && translated.endsWith("'"))) {
            translated = translated.substring(1, translated.length - 1);
        }
        return translated;
    } catch (error) {
        throw new Error(parseApiError(error));
    }
};
