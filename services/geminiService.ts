import { GoogleGenAI, Type, Chat } from "@google/genai";

// Interfaces remain as exports for type safety across the app
export interface SongNote {
    pitch: string;
    duration: string;
}
export type Song = SongNote[][];

export interface AnimationIdea {
    title: string;
    prompt: string;
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

export interface VoicePreset {
    title: string;
    description: string;
    effect: string; 
    parameters?: {
        pitchShift?: number;
        delayTime?: number;
        delayFeedback?: number;
        radioFrequency?: number;
        clarityLevel?: number;
    }
}


export interface SoundEffectParameters {
    name: string;
    waveType: 'square' | 'sine' | 'sawtooth' | 'triangle';
    startFrequency: number;
    endFrequency: number;
    duration: number;
    volume: number;
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

export interface MidiNote {
    pitch: string;
    startTime: number; // in seconds
    duration: number; // in seconds
    velocity: number; // 0-127
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

export async function sendMessageToChat(
    message: string, 
    modelId: string, 
    systemInstruction: string, 
    webSearchEnabled: boolean
): Promise<ChatResponse> {
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
        
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
            ?.map((c: any) => ({ uri: c.web.uri, title: c.web.title }))
            .filter((s: any) => s.uri && s.title) || [];
            
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
      if (typeof jsonResponse.row === 'number' && typeof jsonResponse.col === 'number' && jsonResponse.row >= 0 && jsonResponse.row <= 2 && jsonResponse.col >= 0 && jsonResponse.col <= 2) {
          return jsonResponse;
      } else {
          throw new Error("Invalid move format from AI.");
      }
  } catch (error) {
      console.error("Error getting AI move:", error);
      throw new Error(`AI move generation failed: ${parseApiError(error)}`);
  }
}

export async function generateSongFromText(text: string, modelVersion: 'v1' | 'v1.5' | 'v2.0-beta' = 'v1'): Promise<Song> {
    const ai = checkApi();
    let contents: string;
    let systemInstruction: string;
    let description: string;

    if (modelVersion === 'v1.5') {
        contents = `Analyze the provided text deeply for its mood, rhythm, themes, and emotional journey. Compose a highly complex, extended 8-bit chiptune song with 5 distinct tracks: a main melody, a secondary harmony, a rich counter-melody, a dynamic bassline, and a percussion/noise track. The song should have a clear verse-chorus structure if applicable, be significantly longer, and reflect the nuances of the text. Text: "${text}"`;
        systemInstruction = "You are an expert chiptune music virtuoso. Create a long-form, complex 8-bit song with 5 tracks based on the provided text. Include a percussion track using low-pitched square waves for drums. The song must be at least 32 bars long and feature dynamic variations. Notes can be 'C2' through 'B7' or 'Rest'. Durations can be 'whole', 'half', 'quarter', 'eighth', or 'sixteenth'.";
        description = "An array of 5 tracks for the song.";
    } else if (modelVersion === 'v2.0-beta') {
        contents = `Analyze the provided text for its mood and themes. Compose a rich, long-form 8-bit chiptune song with 6 distinct tracks: lead melody, harmony, counter-melody, bassline, percussion, and an arpeggiated track. The song should be approximately 3 minutes long. Prioritize fast generation while maintaining high quality and musical structure. Text to interpret: "${text}"`;
        systemInstruction = "You are an expert chiptune composer optimized for speed. Create a high-quality, 6-track 8-bit song that is approximately 3 minutes long based on the text. Ensure a clear musical structure. Notes can be 'C2' through 'B7' or 'Rest'. Durations are 'whole', 'half', 'quarter', 'eighth', 'sixteenth'.";
        description = "An array of 6 tracks for a long-form song.";
    } else { // v1 - default
        contents = `Analyze the mood, rhythm, structure, and emotional arc of the following text. Compose a moderately complex, looping, 8-bit chiptune song with 3 tracks (a lead melody, a harmony/counter-melody, and a simple bassline). The song should reflect the text's content. Text: "${text}"`;
        systemInstruction = "You are a chiptune music composer. Create an 8-bit song based on the provided text. The song should have three tracks. Notes can be 'C2' through 'B7' or 'Rest'. Durations can be 'whole', 'half', 'quarter', 'eighth', 'sixteenth'. Ensure the song has a clear structure and is at least 16 bars long.";
        description = "An array of 3 tracks for the song.";
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    description: description,
                    items: {
                        type: Type.ARRAY,
                        description: "A track, which is an array of notes.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                pitch: { type: Type.STRING, description: "The note pitch (e.g., 'C4', 'G#3') or 'Rest'." },
                                duration: { type: Type.STRING, description: "The duration of the note (e.g., 'quarter', 'eighth')." }
                            },
                            required: ["pitch", "duration"]
                        }
                    }
                },
            },
        });
        const jsonResponse = safeJsonParse<Song>(response.text);
        if (jsonResponse && Array.isArray(jsonResponse) && jsonResponse.length > 0) {
            return jsonResponse;
        } else {
            throw new Error("Could not parse the song from the response.");
        }
    } catch (error) {
        console.error("Error generating song from text:", error);
        throw new Error(`ไม่สามารถสร้างเพลงได้: ${parseApiError(error)}`);
    }
}

export async function generatePixelArt(prompt: string): Promise<string> {
    const ai = checkApi();
    const enhancedPrompt = `8-bit pixel art of ${prompt}. classic 8-bit video game style, limited color palette, Commodore 64 palette, dithered shading, sharp pixels`;

    try {
        await throttleImageGeneration();
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: enhancedPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        } else {
            throw new Error("AI ไม่สามารถสร้างภาพได้ อาจเนื่องจากคำสั่งของคุณขัดต่อนโยบายความปลอดภัย โปรดลองปรับเปลี่ยนคำสั่งของคุณ");
        }
    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error(parseApiError(error));
    }
}

export async function generateVideo(prompt: string): Promise<any> {
    const ai = checkApi();
    try {
        await throttleVideoGeneration();
        const enhancedPrompt = `8-bit pixel art style video of ${prompt}. classic 8-bit video game style, limited color palette`;
        const operation = await ai.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt: enhancedPrompt,
            config: {
                numberOfVideos: 1,
            }
        });
        return operation;
    } catch (error) {
        console.error("Error starting video generation:", error);
        throw new Error(`ไม่สามารถเริ่มสร้างวิดีโอได้: ${parseApiError(error)}`);
    }
}

export async function getVideosOperation(operation: any): Promise<any> {
    const ai = checkApi();
    try {
        const updatedOperation = await ai.operations.getVideosOperation({ operation: operation });
        return updatedOperation;
    } catch (error) {
        console.error("Error polling video operation:", error);
        throw new Error(`เกิดข้อผิดพลาดขณะตรวจสอบสถานะวิดีโอ: ${parseApiError(error)}`);
    }
}

export async function generateSongFromMedia(base64Data: string, mimeType: string): Promise<Song> {
    const ai = checkApi();
    const mediaPart = { inlineData: { data: base64Data, mimeType } };
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [
                { text: "Analyze the mood, rhythm, and themes of this media. Compose a moderately complex, looping, 8-bit chiptune song with 3 tracks (lead, harmony, bassline) that reflects the media's content." },
                mediaPart
            ]},
            config: {
                systemInstruction: "You are a chiptune music composer. Create an 8-bit song based on the provided media. Notes can be 'C2' through 'B7' or 'Rest'. Durations can be 'whole', 'half', 'quarter', 'eighth', 'sixteenth'. Ensure the song has a clear structure and is at least 16 bars long.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY, description: "An array of 3 tracks for the song.",
                    items: {
                        type: Type.ARRAY, description: "A track, which is an array of notes.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                pitch: { type: Type.STRING, description: "The note pitch (e.g., 'C4', 'G#3') or 'Rest'." },
                                duration: { type: Type.STRING, description: "The duration of the note (e.g., 'quarter', 'eighth')." }
                            },
                            required: ["pitch", "duration"]
                        }
                    }
                },
            },
        });
        const jsonResponse = safeJsonParse<Song>(response.text);
        if (Array.isArray(jsonResponse) && jsonResponse.length > 0) return jsonResponse;
        throw new Error("Could not parse song from response.");
    } catch (error) {
        throw new Error(`ไม่สามารถสร้างเพลงได้: ${parseApiError(error)}`);
    }
}

export async function analyzeFeedback(feedback: string): Promise<string> {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the following user feedback and summarize the main point or suggestion in a single, concise sentence in Thai. Feedback: "${feedback}"`,
            config: {
                systemInstruction: "You are a helpful assistant that summarizes user feedback into a single, actionable sentence in Thai."
            }
        });
        return response.text.trim();
    } catch (error) {
        throw new Error(`ไม่สามารถวิเคราะห์ข้อเสนอแนะได้: ${parseApiError(error)}`);
    }
}

export async function generateVideoSummary(base64Data: string, mimeType: string): Promise<string> {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [
                { text: "Briefly describe the content of this video in one sentence." },
                { inlineData: { data: base64Data, mimeType } }
            ]},
        });
        return response.text.trim();
    } catch (error) {
        throw new Error(`ไม่สามารถสรุปวิดีโอได้: ${parseApiError(error)}`);
    }
}

export async function generateSubtitlesFromVideo(base64Data: string, mimeType: string, languageCode: string): Promise<string> {
    const ai = checkApi();
    const prompt = languageCode === 'auto'
        ? "Generate subtitles for this media in WebVTT format. Auto-detect the spoken language."
        : `Generate subtitles for this media in WebVTT format. The spoken language is ${languageCode}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [
                { text: prompt },
                { inlineData: { data: base64Data, mimeType } }
            ]},
            config: {
                systemInstruction: "You are a subtitle generation expert. Create accurate, well-timed subtitles in the WebVTT format. Do not include any text other than the VTT content.",
            }
        });
        // Basic validation for VTT format
        if (response.text.trim().startsWith("WEBVTT")) {
            return response.text.trim();
        }
        throw new Error("AI did not return valid VTT subtitles.");
    } catch (error) {
        throw new Error(`ไม่สามารถสร้างคำบรรยายได้: ${parseApiError(error)}`);
    }
}

export async function generateSoundEffectIdeas(prompt: string): Promise<SoundEffectParameters[]> {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on the user's request, generate 4 distinct 8-bit sound effect parameter sets. Request: "${prompt}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    description: "An array of 4 sound effect parameter objects.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING, description: "A descriptive name for the sound effect." },
                            waveType: { type: Type.STRING, description: "Wave type: 'square', 'sine', 'sawtooth', or 'triangle'." },
                            startFrequency: { type: Type.NUMBER, description: "Starting frequency in Hz (e.g., 800)." },
                            endFrequency: { type: Type.NUMBER, description: "Ending frequency in Hz (e.g., 200)." },
                            duration: { type: Type.NUMBER, description: "Duration in seconds (e.g., 0.2)." },
                            volume: { type: Type.NUMBER, description: "Volume from 0.0 to 1.0 (e.g., 0.3)." },
                        },
                        required: ["name", "waveType", "startFrequency", "endFrequency", "duration", "volume"]
                    }
                }
            }
        });
        const jsonResponse = safeJsonParse<SoundEffectParameters[]>(response.text);
        if (Array.isArray(jsonResponse)) return jsonResponse;
        throw new Error("Could not parse sound effects from response.");
    } catch (error) {
        throw new Error(`ไม่สามารถสร้างไอเดียเสียงได้: ${parseApiError(error)}`);
    }
}

export async function generateSecret(topic: string): Promise<string> {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Tell me an interesting, surprising, or little-known fact or story about the topic: ${topic}.`,
            config: { systemInstruction: "You are a mysterious oracle that reveals secrets and hidden knowledge. Your tone is slightly dramatic and intriguing." }
        });
        return response.text.trim();
    } catch (error) {
        throw new Error(`ไม่สามารถเปิดเผยความลับได้: ${parseApiError(error)}`);
    }
}

export async function generateWordMatches(topic: string): Promise<WordMatch[]> {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `For the word or concept "${topic}", provide creative matches for the following categories: Color, Sound, Animal, Object, and Feeling.`,
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
        throw new Error(`ไม่สามารถจับคู่คำได้: ${parseApiError(error)}`);
    }
}

export async function correctText(text: string): Promise<string> {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Correct any spelling and grammar mistakes in the following Thai text. Only return the corrected text. Text: "${text}"`,
        });
        return response.text.trim();
    } catch (error) {
        throw new Error(`ไม่สามารถแก้ไขข้อความได้: ${parseApiError(error)}`);
    }
}

export async function identifyAndSearchMusic(base64Data: string, mimeType: string): Promise<SearchResult> {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [
                { text: "Identify this music. If it's a known song, provide its title, artist, album, year, and genre. If not, describe it and suggest similar artists or genres. Provide a general overview. Suggest 3 related search queries. Ground your answer in Google Search and provide sources." },
                { inlineData: { data: base64Data, mimeType } }
            ]},
            config: { tools: [{ googleSearch: {} }] }
        });

        // This is a simplified parsing. A more robust solution would use a schema if the API supported it with grounding.
        const text = response.text;
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => ({ uri: c.web.uri, title: c.web.title })) || [];

        const directMatch = text.match(/Title:\s*(.*)\nArtist:\s*(.*)/i);
        if (directMatch) {
            return {
                identificationType: 'direct',
                title: text.match(/Title:\s*(.*)/i)?.[1].trim() || null,
                artist: text.match(/Artist:\s*(.*)/i)?.[1].trim() || null,
                album: text.match(/Album:\s*(.*)/i)?.[1].trim() || null,
                year: text.match(/Year:\s*(.*)/i)?.[1].trim() || null,
                genre: text.match(/Genre:\s*(.*)/i)?.[1].trim() || null,
                overview: text.match(/Overview:\s*([\s\S]*)/i)?.[1].trim() || text,
                searchSuggestions: text.match(/Suggestions:\s*(.*)/i)?.[1].split(',').map(s => s.trim()) || [],
                sources: sources
            };
        } else {
            return {
                identificationType: 'similarity',
                title: null, artist: null, album: null, year: null, genre: null,
                overview: text,
                searchSuggestions: text.match(/Suggestions:\s*(.*)/i)?.[1].split(',').map(s => s.trim()) || [],
                sources: sources
            };
        }
    } catch (error) {
        throw new Error(`ไม่สามารถค้นหาเพลงได้: ${parseApiError(error)}`);
    }
}

export async function generatePromptFromImage(base64: string, mimeType: string): Promise<string> {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [
                { text: "Describe this image in detail, as a prompt for an AI image generator to recreate it in a pixel art style." },
                { inlineData: { data: base64, mimeType } }
            ]}
        });
        return response.text.trim();
    } catch(error) {
        throw new Error(`ไม่สามารถวิเคราะห์รูปภาพได้: ${parseApiError(error)}`);
    }
}

export async function generateGifFrames(prompt: string, frameCount: number): Promise<string[]> {
    const ai = checkApi();
    const frames: string[] = [];
    for (let i = 0; i < frameCount; i++) {
        const framePrompt = `${prompt}, animation frame ${i + 1} of ${frameCount}`;
        const imageUrl = await generatePixelArt(framePrompt);
        frames.push(imageUrl);
    }
    return frames;
}

export async function generatePromptSuggestions(prompt: string): Promise<PromptSuggestion[]> {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on the user's prompt "${prompt}", generate 3 creative variations or additions.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING, description: "A short title for the suggestion." },
                            prompt: { type: Type.STRING, description: "The full, enhanced prompt." },
                        },
                        required: ["title", "prompt"]
                    }
                }
            }
        });
        return safeJsonParse<PromptSuggestion[]>(response.text);
    } catch (error) {
        throw new Error(`ไม่สามารถสร้างไอเดียได้: ${parseApiError(error)}`);
    }
}

export async function enhanceImageQuality(base64: string, mimeType: string): Promise<string> {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    { inlineData: { data: base64, mimeType } },
                    { text: 'Enhance the quality of this image. Upscale it, correct colors, and improve sharpness.' },
                ],
            },
        });
        const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (imagePart?.inlineData) {
            return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        }
        throw new Error("AI did not return an enhanced image.");
    } catch(error) {
        throw new Error(`ไม่สามารถปรับปรุงรูปภาพได้: ${parseApiError(error)}`);
    }
}

export async function analyzeAudioFromMedia(base64Data: string, mimeType: string): Promise<string> {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [
                { text: "Describe the audio content in this media. What sounds are present? What is the mood? Is there speech or music?" },
                { inlineData: { data: base64Data, mimeType } }
            ]},
        });
        return response.text.trim();
    } catch (error) {
        throw new Error(`ไม่สามารถวิเคราะห์เสียงได้: ${parseApiError(error)}`);
    }
}

export async function convertAudioToMidi(base64Data: string, mimeType: string): Promise<MidiNote[]> {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [
                { text: "Analyze the monophonic melody in this audio and transcribe it into MIDI notes." },
                { inlineData: { data: base64Data, mimeType } }
            ]},
            config: {
                systemInstruction: "You are an expert audio-to-MIDI transcriber. Identify the main melody and convert it to a series of MIDI notes. Ignore complex chords or background noise. Focus on the single melodic line.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    description: "An array of MIDI notes.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            pitch: { type: Type.STRING, description: "MIDI note name (e.g., 'C4')." },
                            startTime: { type: Type.NUMBER, description: "Start time in seconds." },
                            duration: { type: Type.NUMBER, description: "Duration in seconds." },
                            velocity: { type: Type.NUMBER, description: "Velocity (0-127)." }
                        },
                        required: ["pitch", "startTime", "duration", "velocity"]
                    }
                }
            }
        });
        return safeJsonParse<MidiNote[]>(response.text);
    } catch (error) {
        throw new Error(`ไม่สามารถแปลงเป็น MIDI ได้: ${parseApiError(error)}`);
    }
}

export async function generateSoundFromImage(base64Data: string, mimeType: string): Promise<SoundEffectParameters> {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [
                { text: "Analyze the mood, colors, and content of this image. Generate a single set of parameters for an 8-bit sound effect that represents the image." },
                { inlineData: { data: base64Data, mimeType } }
            ]},
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "A descriptive name for the sound effect based on the image." },
                        waveType: { type: Type.STRING, description: "Wave type: 'square', 'sine', 'sawtooth', or 'triangle'." },
                        startFrequency: { type: Type.NUMBER },
                        endFrequency: { type: Type.NUMBER },
                        duration: { type: Type.NUMBER },
                        volume: { type: Type.NUMBER, description: "Volume from 0.0 to 1.0, typically 0.3." },
                    },
                    required: ["name", "waveType", "startFrequency", "endFrequency", "duration", "volume"]
                }
            }
        });
        return safeJsonParse<SoundEffectParameters>(response.text);
    } catch (error) {
        throw new Error(`ไม่สามารถสร้างเสียงจากภาพได้: ${parseApiError(error)}`);
    }
}

export async function evaluatePromptGuess(secretPrompt: string, userGuess: string): Promise<PromptEvaluation> {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `The secret prompt was: "${secretPrompt}". The user guessed: "${userGuess}". Compare them and respond with JSON.`,
            config: {
                systemInstruction: `You are an AI prompt evaluation expert. Compare the user's guess to the secret prompt. Rate their similarity on a scale of 0 to 100, where 100 is a perfect match in concept and detail. Provide brief, encouraging feedback in Thai on why their guess was close or not. Respond only with a JSON object: {"similarity": number, "feedback": "string in Thai"}.`,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        similarity: { type: Type.NUMBER, description: "Similarity score from 0 to 100." },
                        feedback: { type: Type.STRING, description: "Brief feedback for the user in Thai." }
                    },
                    required: ["similarity", "feedback"]
                }
            }
        });
        return safeJsonParse<PromptEvaluation>(response.text);
    } catch (error) {
        throw new Error(`ไม่สามารถประเมินคำทายได้: ${parseApiError(error)}`);
    }
}

export async function generateCodeFromImage(base64: string, mimeType: string): Promise<string> {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [
                { text: "Create a complete, single-file HTML web application based on this image. The app should be visually and thematically related to the image. Embed all CSS and JavaScript within the HTML file. Use a retro, pixelated aesthetic where appropriate. The code should be functional and self-contained. Respond ONLY with the HTML code inside a markdown block." },
                { inlineData: { data: base64, mimeType } }
            ]}
        });
        
        const text = response.text;
        // Extract content from markdown code block ```html ... ```
        const match = text.match(/```(?:html)?\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
            return match[1].trim();
        }
        // Fallback for when no markdown block is returned
        return text.trim();

    } catch(error) {
        throw new Error(`ไม่สามารถสร้างโค้ดได้: ${parseApiError(error)}`);
    }
}

export async function generateCodeFromText(prompt: string): Promise<string> {
    const ai = checkApi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Create a complete, single-file HTML web application based on this prompt: "${prompt}". The app should be visually and thematically related to the prompt. Embed all CSS and JavaScript within the HTML file. Use a retro, pixelated aesthetic where appropriate. The code should be functional and self-contained. Respond ONLY with the HTML code inside a markdown block.`
        });
        
        const text = response.text;
        // Extract content from markdown code block ```html ... ```
        const match = text.match(/```(?:html)?\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
            return match[1].trim();
        }
        // Fallback for when no markdown block is returned
        return text.trim();

    } catch(error) {
        throw new Error(`ไม่สามารถสร้างโค้ดได้: ${parseApiError(error)}`);
    }
}
