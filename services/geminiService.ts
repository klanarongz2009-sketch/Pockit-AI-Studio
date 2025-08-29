
import { GoogleGenAI, Type, Chat } from "@google/genai";

const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
    console.error("Gemini API key not found. Please set the API_KEY environment variable.");
}

export const parseApiError = (error: unknown): string => {
    // If the "error" is a response object with promptFeedback, it's a safety block.
    if (typeof error === 'object' && error !== null && 'promptFeedback' in error) {
        const feedback = (error as any).promptFeedback;
        if (feedback?.blockReason) {
            return `คำสั่งของคุณถูกบล็อกเนื่องจากนโยบายความปลอดภัย: ${feedback.blockReasonMessage || feedback.blockReason}`;
        }
    }

    let message = 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
    let details: any = {};

    if (error instanceof Error) {
        message = error.message;
        try {
            // Sometimes the error message is a JSON string from the API
            const parsed = JSON.parse(message);
            details = parsed.error || parsed;
            message = details.message || message;
        } catch (e) {
            // Not JSON, use the message as is
        }
    } else if (typeof error === 'object' && error !== null) {
        // Common structure for Google API errors
        details = (error as any).error || (error as any).response?.data?.error || error;
        message = details.message || String(error);
    } else {
        message = String(error);
    }

    const status = details?.status || '';
    const lowerCaseMessage = message.toLowerCase();

    if (status === 'RESOURCE_EXHAUSTED' || lowerCaseMessage.includes('quota') || lowerCaseMessage.includes('rate limit')) {
        return 'คุณใช้งานเกินโควต้าแล้ว โปรดรอสักครู่แล้วลองอีกครั้ง หรือตรวจสอบแผนการใช้งานของคุณใน Google AI Studio';
    }
    if (status === 'PERMISSION_DENIED' || lowerCaseMessage.includes('api key not valid')) {
        return 'API Key ไม่ถูกต้องหรือไม่มีสิทธิ์เข้าถึง โปรดตรวจสอบการตั้งค่า';
    }
    if (status === 'INVALID_ARGUMENT') {
        return `คำขอไม่ถูกต้อง: ${message}. โปรดตรวจสอบว่าข้อมูลที่ส่งถูกต้อง`;
    }
    if (lowerCaseMessage.includes('service is currently unavailable') || (details.code && details.code >= 500)) {
        return 'บริการไม่พร้อมใช้งานชั่วคราว โปรดลองอีกครั้งในภายหลัง';
    }
    if (lowerCaseMessage.includes('safety policy') || lowerCaseMessage.includes('blocked') || lowerCaseMessage.includes('safety threshold')) {
        return `คำสั่งของคุณอาจขัดต่อนโยบายความปลอดภัยและถูกบล็อก โปรดลองปรับเปลี่ยนคำสั่ง`;
    }
    if (lowerCaseMessage.includes('failed to fetch')) {
        return 'เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณแล้วลองอีกครั้ง';
    }
    
    // Clean up generic prefixes from the SDK
    if (message.startsWith('Error: ')) message = message.substring(7);
    if (message.startsWith('[GoogleGenerativeAI Error]: ')) message = message.substring(28);

    return `เกิดข้อผิดพลาด: ${message}`;
};


const delay = (ms: number) => new Promise(res => setTimeout(res, ms));


// --- Throttling for Image Generation ---
let lastImageGenerationTime = 0;
// Imagen models on the free tier have a low RPM limit (e.g., 5 RPM).
// 15 seconds allows for 4 RPM, which is a safer value to avoid rate limiting.
const MIN_IMAGE_GENERATION_INTERVAL_MS = 15000;

/**
 * Ensures that image generation requests are spaced out to avoid hitting API rate limits.
 */
const throttleImageGeneration = async () => {
    const now = Date.now();
    const timeSinceLast = now - lastImageGenerationTime;
    if (timeSinceLast < MIN_IMAGE_GENERATION_INTERVAL_MS) {
        const waitTime = MIN_IMAGE_GENERATION_INTERVAL_MS - timeSinceLast;
        await delay(waitTime);
    }
    lastImageGenerationTime = Date.now();
};

// --- Throttling for Video Generation ---
let lastVideoGenerationTime = 0;
// Video models have very strict rate limits, often less than 1 RPM on free tiers.
// We'll set a conservative delay to avoid hitting the quota.
const MIN_VIDEO_GENERATION_INTERVAL_MS = 120000; // Increased to 120 seconds

/**
 * Ensures that video generation requests are spaced out to avoid hitting API rate limits.
 */
const throttleVideoGeneration = async () => {
    const now = Date.now();
    const timeSinceLast = now - lastVideoGenerationTime;
    if (timeSinceLast < MIN_VIDEO_GENERATION_INTERVAL_MS) {
        const waitTime = MIN_VIDEO_GENERATION_INTERVAL_MS - timeSinceLast;
        await delay(waitTime);
    }
    lastVideoGenerationTime = Date.now();
};

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

export const getTicTacToeMove = async (board: string[][], aiPlayer: 'X' | 'O'): Promise<{row: number, col: number}> => {
    if (!ai) {
        throw new Error("ไม่ได้กำหนดค่า API_KEY ไม่สามารถเรียกใช้ Gemini API ได้");
    }
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

        if (response.promptFeedback?.blockReason) {
            throw new Error(`คำสั่งถูกบล็อกเนื่องจากนโยบายความปลอดภัย: ${response.promptFeedback.blockReasonMessage || response.promptFeedback.blockReason}`);
        }

        const jsonResponse = JSON.parse(response.text);
        if (typeof jsonResponse.row === 'number' && typeof jsonResponse.col === 'number' && jsonResponse.row >= 0 && jsonResponse.row <= 2 && jsonResponse.col >= 0 && jsonResponse.col <= 2) {
            return jsonResponse;
        } else {
            throw new Error("Invalid move format from AI.");
        }
    } catch (error) {
        console.error("Error getting AI move:", error);
        throw new Error(`AI move generation failed: ${parseApiError(error)}`);
    }
};

export const generateSongFromText = async (text: string, modelVersion: 'v1' | 'v1.5' | 'v2.0-beta' = 'v1'): Promise<Song> => {
     if (!ai) {
        throw new Error("ไม่ได้กำหนดค่า API_KEY ไม่สามารถเรียกใช้ Gemini API ได้");
    }

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
                                pitch: {
                                    type: Type.STRING,
                                    description: "The note pitch (e.g., 'C4', 'G#3') or 'Rest'."
                                },
                                duration: {
                                    type: Type.STRING,
                                    description: "The duration of the note (e.g., 'quarter', 'eighth')."
                                }
                            },
                            required: ["pitch", "duration"]
                        }
                    }
                },
            },
        });

        if (response.promptFeedback?.blockReason) {
            throw new Error(`คำสั่งถูกบล็อกเนื่องจากนโยบายความปลอดภัย: ${response.promptFeedback.blockReasonMessage || response.promptFeedback.blockReason}`);
        }

        const jsonResponse = JSON.parse(response.text);
        if (jsonResponse && Array.isArray(jsonResponse) && jsonResponse.length > 0) {
            return jsonResponse as Song;
        } else {
            throw new Error("Could not parse the song from the response.");
        }
    } catch (error) {
        console.error("Error generating song from text:", error);
        throw new Error(`ไม่สามารถสร้างเพลงได้: ${parseApiError(error)}`);
    }
};

export const generateSongFromMedia = async (base64Data: string, mimeType: string): Promise<Song> => {
    if (!ai) {
        throw new Error("ไม่ได้กำหนดค่า API_KEY ไม่สามารถเรียกใช้ Gemini API ได้");
    }

    const mediaPart = {
        inlineData: {
            data: base64Data,
            mimeType: mimeType,
        },
    };

    const textPart = {
        text: "Analyze the mood, rhythm, and emotional arc of the provided media (video or audio). Based on this analysis, compose a moderately complex, looping, 8-bit chiptune song with 3 tracks (lead melody, harmony/counter-melody, and a simple bassline). The song should reflect the media's content.",
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [mediaPart, textPart] },
            config: {
                systemInstruction: "You are a chiptune music composer. Create an 8-bit song based on the provided media. The song should have three tracks. Notes can be 'C2' through 'B7' or 'Rest'. Durations can be 'whole', 'half', 'quarter', 'eighth', or 'sixteenth'. Ensure the song has a clear structure and is at least 16 bars long.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    description: "An array of 3 tracks for the song.",
                    items: {
                        type: Type.ARRAY,
                        description: "A track, which is an array of notes.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                pitch: {
                                    type: Type.STRING,
                                    description: "The note pitch (e.g., 'C4', 'G#3') or 'Rest'."
                                },
                                duration: {
                                    type: Type.STRING,
                                    description: "The duration of the note (e.g., 'quarter', 'eighth')."
                                }
                            },
                            required: ["pitch", "duration"]
                        }
                    }
                },
            },
        });

        if (response.promptFeedback?.blockReason) {
            throw new Error(`คำสั่งถูกบล็อกเนื่องจากนโยบายความปลอดภัย: ${response.promptFeedback.blockReasonMessage || response.promptFeedback.blockReason}`);
        }

        const jsonResponse = JSON.parse(response.text);
        if (jsonResponse && Array.isArray(jsonResponse) && jsonResponse.length > 0) {
            return jsonResponse as Song;
        } else {
            throw new Error("Could not parse the song from the response.");
        }
    } catch (error) {
        console.error("Error generating song from media:", error);
        throw new Error(`ไม่สามารถสร้างเพลงได้: ${parseApiError(error)}`);
    }
};

export const analyzeFeedback = async (feedbackText: string): Promise<string> => {
    if (!ai) {
        throw new Error("ไม่ได้กำหนดค่า API_KEY ไม่สามารถเรียกใช้ Gemini API ได้");
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Please analyze the following user feedback for our pixel art generator app. Summarize the main points in a concise, neutral, and easy-to-understand way in Thai. Feedback: "${feedbackText}"`,
            config: {
                systemInstruction: "You are a helpful assistant who analyzes user feedback. Your goal is to summarize the user's intent clearly and concisely in Thai.",
            },
        });
        if (response.promptFeedback?.blockReason) {
            throw new Error(`คำสั่งถูกบล็อกเนื่องจากนโยบายความปลอดภัย: ${response.promptFeedback.blockReasonMessage || response.promptFeedback.blockReason}`);
        }
        return response.text;
    } catch (error) {
        console.error("Error analyzing feedback:", error);
        throw new Error(`ไม่สามารถวิเคราะห์ข้อเสนอแนะได้: ${parseApiError(error)}`);
    }
};

export const generateAnimationIdeas = async (baseIdea: string): Promise<AnimationIdea[]> => {
    if (!ai) {
        throw new Error("ไม่ได้กำหนดค่า API_KEY ไม่สามารถเรียกใช้ Gemini API ได้");
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `The user wants to animate a character or scene based on this idea: "${baseIdea}". Provide 3 creative and simple animation ideas suitable for a short, looping GIF.`,
            config: {
                systemInstruction: "You are a creative assistant specializing in animation concepts for pixel art. Provide diverse, simple, and clear animation ideas. Each idea should have a title and a descriptive prompt.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        ideas: {
                            type: Type.ARRAY,
                            description: "A list of 3 animation ideas.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: {
                                        type: Type.STRING,
                                        description: "A short title for the animation idea (e.g., 'Walking Cycle', 'Casting a Spell')."
                                    },
                                    prompt: {
                                        type: Type.STRING,
                                        description: "A descriptive prompt for the animation."
                                    }
                                },
                                required: ["title", "prompt"]
                            }
                        }
                    },
                    required: ["ideas"]
                },
            },
        });

        if (response.promptFeedback?.blockReason) {
            throw new Error(`คำสั่งถูกบล็อกเนื่องจากนโยบายความปลอดภัย: ${response.promptFeedback.blockReasonMessage || response.promptFeedback.blockReason}`);
        }

        const jsonResponse = JSON.parse(response.text);
        if (jsonResponse.ideas && Array.isArray(jsonResponse.ideas)) {
            return jsonResponse.ideas;
        } else {
            throw new Error("Could not parse animation ideas from the response.");
        }
    } catch (error) {
        console.error("Error generating animation ideas:", error);
        throw new Error(`ไม่สามารถสร้างไอเดียแอนิเมชันได้: ${parseApiError(error)}`);
    }
};

export const generatePromptFromImage = async (base64Data: string, mimeType: string): Promise<string> => {
    if (!ai) {
        throw new Error("ไม่ได้กำหนดค่า API_KEY ไม่สามารถเรียกใช้ Gemini API ได้");
    }
    
    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: mimeType,
        },
    };

    const textPart = {
        text: "อธิบายภาพนี้อย่างละเอียดเพื่อใช้เป็นคำสั่งในการสร้างภาพพิกเซลอาร์ต ทำให้คำอธิบายมีความสร้างสรรค์และมีรายละเอียดที่ชัดเจน",
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });
        if (response.promptFeedback?.blockReason) {
            throw new Error(`คำสั่งถูกบล็อกเนื่องจากนโยบายความปลอดภัย: ${response.promptFeedback.blockReasonMessage || response.promptFeedback.blockReason}`);
        }
        return response.text;
    } catch (error) {
        console.error("Error generating prompt from image:", error);
        throw new Error(`ไม่สามารถสร้างคำสั่งจากภาพได้: ${parseApiError(error)}`);
    }
};


export const generatePixelArt = async (prompt: string): Promise<string> => {
    if (!ai) {
        throw new Error("ไม่ได้กำหนดค่า API_KEY ไม่สามารถเรียกใช้ Gemini API ได้");
    }
    
    // Enhance the prompt for better pixel art results
    const enhancedPrompt = `8-bit pixel art of ${prompt}. classic 8-bit video game style, limited color palette, Commodore 64 palette, dithered shading, sharp pixels`;

    try {
        await throttleImageGeneration();
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
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
};

export const enhanceImageQuality = async (base64String: string, mimeType: string): Promise<string> => {
    if (!ai) {
        throw new Error("ไม่ได้กำหนดค่า API_KEY ไม่สามารถเรียกใช้ Gemini API ได้");
    }
    
    let description = '';
    try {
        description = await generatePromptFromImage(base64String, mimeType);
    } catch (error) {
        console.error("Error generating prompt for enhancement:", error);
        throw new Error(`ไม่สามารถวิเคราะห์ภาพเพื่อปรับปรุงได้: ${parseApiError(error)}`);
    }

    const enhancedPrompt = `A 4K, ultra high-resolution, masterpiece, detailed 8-bit pixel art of: ${description}. Focus on vibrant colors, sharp pixels, and intricate details.`;

    try {
        const imageUrl = await generatePixelArt(enhancedPrompt);
        return imageUrl;
    } catch (error) {
        console.error("Error enhancing image quality:", error);
        if (error instanceof Error) {
            throw new Error(`ไม่สามารถปรับปรุงคุณภาพภาพได้: ${error.message}`);
        }
        throw new Error("เกิดข้อผิดพลาดที่ไม่คาดคิดขณะปรับปรุงคุณภาพภาพ");
    }
};

export const generateGifFrames = async (prompt: string, frameCount: number): Promise<string[]> => {
    if (!ai) {
        throw new Error("ไม่ได้กำหนดค่า API_KEY ไม่สามารถเรียกใช้ Gemini API ได้");
    }

    let framePrompts: string[] = [];

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Based on the user prompt, create a list of ${frameCount} sequential scene descriptions for generating frames of a short, looping pixel art GIF animation. The user's prompt is: "${prompt}". The descriptions should create a simple, looping animation.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        prompts: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING,
                                description: "A single, detailed prompt for one animation frame."
                            }
                        }
                    }
                },
            },
        });
        
        if (response.promptFeedback?.blockReason) {
            throw new Error(`คำสั่งถูกบล็อกเนื่องจากนโยบายความปลอดภัย: ${response.promptFeedback.blockReasonMessage || response.promptFeedback.blockReason}`);
        }

        const jsonResponse = JSON.parse(response.text);
        if (jsonResponse.prompts && Array.isArray(jsonResponse.prompts) && jsonResponse.prompts.length > 0) {
            framePrompts = jsonResponse.prompts;
        } else {
            throw new Error("Could not parse frame prompts from Gemini response.");
        }
    } catch (error) {
        console.error("Error generating frame prompts, falling back to simpler prompts:", error);
        framePrompts = Array.from({ length: frameCount }, (_, i) => `${prompt}, frame ${i + 1} of a sequence`);
    }

    if (framePrompts.length === 0) {
         framePrompts = Array.from({ length: frameCount }, (_, i) => `${prompt}, frame ${i + 1} of a sequence`);
    }

    try {
        const base64Images: string[] = [];
        for (const framePrompt of framePrompts) {
            const imageUrl = await generatePixelArt(framePrompt);
            base64Images.push(imageUrl);
        }
        return base64Images;
    } catch (error) {
        console.error("Error generating GIF frames:", error);
        if (error instanceof Error) {
            // The error.message will be pre-formatted by the 'parseApiError' in generatePixelArt
            throw new Error(`สร้างเฟรม GIF ไม่สำเร็จ: ${error.message}`);
        }
        throw new Error("เกิดข้อผิดพลาดที่ไม่คาดคิดขณะสร้างเฟรม GIF");
    }
};

export const generateVideo = async (prompt: string): Promise<any> => {
    if (!ai) {
        throw new Error("ไม่ได้กำหนดค่า API_KEY ไม่สามารถเรียกใช้ Gemini API ได้");
    }

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
};

export const animateImage = async (base64Data: string, mimeType: string, prompt: string): Promise<any> => {
    if (!ai) {
        throw new Error("ไม่ได้กำหนดค่า API_KEY ไม่สามารถเรียกใช้ Gemini API ได้");
    }
    const base64String = base64Data.split(',')[1];

    try {
        await throttleVideoGeneration();
        const enhancedPrompt = `Animate this image in an 8-bit pixel art style. ${prompt}.`;
        const operation = await ai.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt: enhancedPrompt,
            image: {
                imageBytes: base64String,
                mimeType: mimeType,
            },
            config: {
                numberOfVideos: 1
            }
        });
        return operation;
    } catch (error) {
        console.error("Error starting image animation:", error);
        throw new Error(`ไม่สามารถเริ่มสร้างแอนิเมชันได้: ${parseApiError(error)}`);
    }
};

export const getVideosOperation = async (operation: any): Promise<any> => {
     if (!ai) {
        throw new Error("ไม่ได้กำหนดค่า API_KEY ไม่สามารถเรียกใช้ Gemini API ได้");
    }
    try {
        const updatedOperation = await ai.operations.getVideosOperation({ operation: operation });
        return updatedOperation;
    } catch (error) {
        console.error("Error polling video operation:", error);
        throw new Error(`เกิดข้อผิดพลาดขณะตรวจสอบสถานะวิดีโอ: ${parseApiError(error)}`);
    }
};

export const generatePromptSuggestions = async (basePrompt: string): Promise<PromptSuggestion[]> => {
    if (!ai) {
        throw new Error("ไม่ได้กำหนดค่า API_KEY ไม่สามารถเรียกใช้ Gemini API ได้");
    }
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Based on the user's idea "${basePrompt}", suggest 3 creative and diverse prompts for generating pixel art.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestions: {
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
                    },
                    required: ["suggestions"]
                },
            },
        });
        if (response.promptFeedback?.blockReason) {
            throw new Error(`คำสั่งถูกบล็อกเนื่องจากนโยบายความปลอดภัย: ${response.promptFeedback.blockReasonMessage || response.promptFeedback.blockReason}`);
        }
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse.suggestions || [];
    } catch (error) {
        console.error("Error generating prompt suggestions:", error);
        throw new Error(`ไม่สามารถสร้างคำแนะนำได้: ${parseApiError(error)}`);
    }
};

export const enhancePrompt = async (prompt: string): Promise<PromptEnhancement[]> => {
     if (!ai) {
        throw new Error("ไม่ได้กำหนดค่า API_KEY ไม่สามารถเรียกใช้ Gemini API ได้");
    }
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Take the user's pixel art prompt "${prompt}" and enhance it. Provide 3 variations with more detail, specific art styles (like "ZX Spectrum", "NES palette"), and creative elements.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        enhancements: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    prompt: { type: Type.STRING }
                                },
                                required: ["title", "description", "prompt"]
                            }
                        }
                    },
                    required: ["enhancements"]
                },
            },
        });
        if (response.promptFeedback?.blockReason) {
            throw new Error(`คำสั่งถูกบล็อกเนื่องจากนโยบายความปลอดภัย: ${response.promptFeedback.blockReasonMessage || response.promptFeedback.blockReason}`);
        }
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse.enhancements || [];
    } catch (error) {
        console.error("Error enhancing prompt:", error);
        throw new Error(`ไม่สามารถปรับปรุงคำสั่งได้: ${parseApiError(error)}`);
    }
};

export const generateWordMatches = async (text: string): Promise<WordMatch[]> => {
    if (!ai) {
        throw new Error("ไม่ได้กำหนดค่า API_KEY ไม่สามารถเรียกใช้ Gemini API ได้");
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Based on the user's input "${text}", generate a list of 5 diverse and creative matches. Each match should have a category and a corresponding word or phrase.`,
            config: {
                systemInstruction: "You are a creative AI specializing in word associations and conceptual connections. Your task is to generate a list of creative matches for a given word or phrase. Respond only in Thai. The categories must be diverse and insightful.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    description: "A list of 5 word matches.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            category: { 
                                type: Type.STRING, 
                                description: "The category of the match (e.g., คำตรงข้าม, สี, ความรู้สึก)." 
                            },
                            match: { 
                                type: Type.STRING, 
                                description: "The matching word or phrase." 
                            }
                        },
                        required: ["category", "match"]
                    }
                }
            },
        });

        if (response.promptFeedback?.blockReason) {
            throw new Error(`คำสั่งถูกบล็อกเนื่องจากนโยบายความปลอดภัย: ${response.promptFeedback.blockReasonMessage || response.promptFeedback.blockReason}`);
        }

        const jsonResponse = JSON.parse(response.text);
        if (jsonResponse && Array.isArray(jsonResponse)) {
            return jsonResponse as WordMatch[];
        } else {
            throw new Error("Could not parse word matches from the response.");
        }
    } catch (error) {
        console.error("Error generating word matches:", error);
        throw new Error(`ไม่สามารถจับคู่คำได้: ${parseApiError(error)}`);
    }
};

export const generateSecret = async (topic: string): Promise<string> => {
    if (!ai) {
        throw new Error("ไม่ได้กำหนดค่า API_KEY ไม่สามารถเรียกใช้ Gemini API ได้");
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `The user wants to know a secret about "${topic}". Generate a creative, interesting, and plausible-sounding fictional secret or piece of lore about this topic. The secret should be mysterious and sound profound.`,
            config: {
                systemInstruction: "You are a mystical AI oracle that speaks in Thai. You reveal fictional, profound-sounding secrets about any topic given to you. Your tone is mysterious and wise.",
            },
        });
        if (response.promptFeedback?.blockReason) {
            throw new Error(`คำสั่งถูกบล็อกเนื่องจากนโยบายความปลอดภัย: ${response.promptFeedback.blockReasonMessage || response.promptFeedback.blockReason}`);
        }
        return response.text;
    } catch (error) {
        console.error("Error generating secret:", error);
        throw new Error(`ไม่สามารถเปิดเผยความลับได้: ${parseApiError(error)}`);
    }
};

export const generateScriptFromMedia = async (base64Data: string, mimeType: string, scriptStyle: string): Promise<string> => {
    if (!ai) {
        throw new Error("ไม่ได้กำหนดค่า API_KEY ไม่สามารถเรียกใช้ Gemini API ได้");
    }

    const mediaPart = {
        inlineData: {
            data: base64Data,
            mimeType: mimeType,
        },
    };

    const promptText = `Analyze the provided media (it could be video or audio). Based on its content, mood, and any audible dialogue, write a script in the style of a "${scriptStyle}". The script should include scene descriptions, character actions, and dialogue.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [mediaPart, { text: promptText }] },
            config: {
                systemInstruction: "You are a creative AI scriptwriter. Your task is to generate a script based on media input and a specified style.",
            },
        });
        if (response.promptFeedback?.blockReason) {
            throw new Error(`คำสั่งถูกบล็อกเนื่องจากนโยบายความปลอดภัย: ${response.promptFeedback.blockReasonMessage || response.promptFeedback.blockReason}`);
        }
        return response.text;
    } catch (error) {
        console.error("Error generating script from media:", error);
        throw new Error(`ไม่สามารถสร้างสคริปต์ได้: ${parseApiError(error)}`);
    }
};

export const generateVideoSummary = async (base64Data: string, mimeType: string): Promise<string> => {
    if (!ai) {
        throw new Error("ไม่ได้กำหนดค่า API_KEY ไม่สามารถเรียกใช้ Gemini API ได้");
    }

    const videoPart = {
        inlineData: {
            data: base64Data,
            mimeType: mimeType,
        },
    };

    const textPart = {
        text: "Describe this video in detail, focusing on the main subjects, actions, and overall mood. This description will be used to generate a new pixel art video.",
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [videoPart, textPart] },
        });
        if (response.promptFeedback?.blockReason) {
            throw new Error(`คำสั่งถูกบล็อกเนื่องจากนโยบายความปลอดภัย: ${response.promptFeedback.blockReasonMessage || response.promptFeedback.blockReason}`);
        }
        return response.text;
    } catch (error) {
        console.error("Error generating summary from video:", error);
        throw new Error(`ไม่สามารถวิเคราะห์วิดีโอได้: ${parseApiError(error)}`);
    }
};

export const generateVoicePresets = async (baseIdea: string): Promise<VoicePreset[]> => {
    if (!ai) {
        throw new Error("ไม่ได้กำหนดค่า API_KEY ไม่สามารถเรียกใช้ Gemini API ได้");
    }

    const availableEffects = [
        'robot', 'pitch-shift', 'echo', 'old-radio', 'clarity-adjust',
        '8-bit-classic', 'telephone', 'reverse', 'muffled', 'underwater'
    ].join(', ');

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Based on the user's idea for a voice: "${baseIdea}", suggest 3 creative presets. For each, provide an effect and appropriate parameters.`,
            config: {
                systemInstruction: `You are a creative sound designer. Your task is to suggest voice effect presets. For each preset, provide a creative title, a short description, the single most fitting 'effect' name from this list: ${availableEffects}, and an optional 'parameters' object with suitable values for that effect. Respond only in Thai.
- For 'pitch-shift', suggest a 'pitchShift' value between -12 (low) and 12 (high).
- For 'echo', suggest 'delayTime' (0.1-1.0s) and 'delayFeedback' (0.1-0.7).
- For 'old-radio', suggest 'radioFrequency' (500-4000Hz).
- For 'clarity-adjust', suggest a 'clarityLevel' between -10 (muffled) and 10 (crisp).
- For other effects, the 'parameters' object can be omitted.`,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        presets: {
                            type: Type.ARRAY,
                            description: "A list of 3 voice presets.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING, description: "A creative title for the voice idea." },
                                    description: { type: Type.STRING, description: "A brief, creative description of the voice." },
                                    effect: { type: Type.STRING, description: `The exact effect name from the list: ${availableEffects}` },
                                    parameters: {
                                        type: Type.OBJECT,
                                        description: "Optional parameters for the selected effect.",
                                        properties: {
                                            pitchShift: { type: Type.NUMBER },
                                            delayTime: { type: Type.NUMBER },
                                            delayFeedback: { type: Type.NUMBER },
                                            radioFrequency: { type: Type.NUMBER },
                                            clarityLevel: { type: Type.NUMBER }
                                        }
                                    }
                                },
                                required: ["title", "description", "effect"]
                            }
                        }
                    },
                    required: ["presets"]
                },
            },
        });

        if (response.promptFeedback?.blockReason) {
            throw new Error(`คำสั่งถูกบล็อกเนื่องจากนโยบายความปลอดภัย: ${response.promptFeedback.blockReasonMessage || response.promptFeedback.blockReason}`);
        }

        const jsonResponse = JSON.parse(response.text);
        if (jsonResponse.presets && Array.isArray(jsonResponse.presets)) {
            const validEffects = availableEffects.split(', ');
            return jsonResponse.presets.filter((preset: VoicePreset) => validEffects.includes(preset.effect));
        } else {
            throw new Error("Could not parse voice presets from the response.");
        }
    } catch (error) {
        console.error("Error generating voice presets:", error);
        throw new Error(`ไม่สามารถสร้างไอเดียเสียงได้: ${parseApiError(error)}`);
    }
};


export const generateSoundEffectIdeas = async (prompt: string): Promise<SoundEffectParameters[]> => {
    if (!ai) {
        throw new Error("ไม่ได้กำหนดค่า API_KEY ไม่สามารถเรียกใช้ Gemini API ได้");
    }
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `The user wants an 8-bit sound effect described as: "${prompt}". Generate 5 diverse variations of parameters for this sound.`,
            config: {
                systemInstruction: "You are an 8-bit sound effect synthesizer. Your task is to generate parameters for the Web Audio API to create classic video game sounds. Keep durations short (usually under 0.5 seconds). For waveType, 'square' is the most common for 8-bit sounds.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        sounds: {
                            type: Type.ARRAY,
                            description: "A list of 5 sound effect parameter variations.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING, description: "A short, descriptive name for the sound effect (e.g., 'Jump', 'Laser Blast')." },
                                    waveType: { type: Type.STRING, description: "Must be one of: 'square', 'sine', 'sawtooth', 'triangle'." },
                                    startFrequency: { type: Type.INTEGER, description: "Starting pitch in Hz (100-2000)." },
                                    endFrequency: { type: Type.INTEGER, description: "Ending pitch in Hz. Same as start for no pitch slide." },
                                    duration: { type: Type.NUMBER, description: "Total duration in seconds (0.05 to 1.0)." },
                                    volume: { type: Type.NUMBER, description: "Overall volume (0.1 to 0.8)." }
                                },
                                required: ["name", "waveType", "startFrequency", "endFrequency", "duration", "volume"]
                            }
                        }
                    },
                    required: ["sounds"]
                },
            },
        });

        if (response.promptFeedback?.blockReason) {
            throw new Error(`คำสั่งถูกบล็อกเนื่องจากนโยบายความปลอดภัย: ${response.promptFeedback.blockReasonMessage || response.promptFeedback.blockReason}`);
        }

        const jsonResponse = JSON.parse(response.text);
        if (jsonResponse.sounds && Array.isArray(jsonResponse.sounds)) {
            // Basic validation
            const validWaveTypes = ['square', 'sine', 'sawtooth', 'triangle'];
            return jsonResponse.sounds.filter((sound: SoundEffectParameters) => 
                validWaveTypes.includes(sound.waveType) &&
                sound.duration > 0 && sound.duration < 5 &&
                sound.volume > 0 && sound.volume <= 1
            );
        } else {
            throw new Error("Could not parse sound effect ideas from the response.");
        }
    } catch (error) {
        console.error("Error generating sound effect ideas:", error);
        throw new Error(`ไม่สามารถสร้างไอเดียเสียงได้: ${parseApiError(error)}`);
    }
};

export const generateSoundFromImage = async (base64Data: string, mimeType: string): Promise<SoundEffectParameters> => {
    if (!ai) {
        throw new Error("ไม่ได้กำหนดค่า API_KEY ไม่สามารถเรียกใช้ Gemini API ได้");
    }

    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: mimeType,
        },
    };

    const textPart = {
        text: "Analyze the provided image for its mood, subject, colors, and any implied action. Based on this analysis, generate parameters for a single, fitting 8-bit sound effect. Describe the sound with a short name.",
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [imagePart, textPart] },
            config: {
                systemInstruction: "You are an expert 8-bit sound designer. Your task is to generate parameters for the Web Audio API to create classic video game sounds based on an image. For waveType, choose from 'square', 'sine', 'sawtooth', or 'triangle'.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "A short, descriptive name for the sound effect (e.g., 'Mystic Chime', 'Robot Step')." },
                        waveType: { type: Type.STRING, description: "Must be one of: 'square', 'sine', 'sawtooth', 'triangle'." },
                        startFrequency: { type: Type.INTEGER, description: "Starting pitch in Hz (100-2000)." },
                        endFrequency: { type: Type.INTEGER, description: "Ending pitch in Hz. Same as start for no pitch slide." },
                        duration: { type: Type.NUMBER, description: "Total duration in seconds (0.05 to 1.5)." },
                        volume: { type: Type.NUMBER, description: "Overall volume (0.1 to 0.8)." }
                    },
                    required: ["name", "waveType", "startFrequency", "endFrequency", "duration", "volume"]
                },
            },
        });

        if (response.promptFeedback?.blockReason) {
            throw new Error(`คำสั่งถูกบล็อกเนื่องจากนโยบายความปลอดภัย: ${response.promptFeedback.blockReasonMessage || response.promptFeedback.blockReason}`);
        }

        const jsonResponse = JSON.parse(response.text);
        const validWaveTypes = ['square', 'sine', 'sawtooth', 'triangle'];
        if (jsonResponse && validWaveTypes.includes(jsonResponse.waveType)) {
            return jsonResponse as SoundEffectParameters;
        } else {
            throw new Error("ไม่สามารถแยกวิเคราะห์เอฟเฟกต์เสียงที่ถูกต้องจากการตอบสนองได้");
        }
    } catch (error) {
        console.error("Error generating sound from image:", error);
        throw new Error(`ไม่สามารถสร้างเสียงได้: ${parseApiError(error)}`);
    }
};


export const generateSubtitlesFromVideo = async (base64Data: string, mimeType: string, language: string): Promise<string> => {
    if (!ai) {
        throw new Error("ไม่ได้กำหนดค่า API_KEY ไม่สามารถเรียกใช้ Gemini API ได้");
    }

    const mediaPart = {
        inlineData: {
            data: base64Data,
            mimeType: mimeType,
        },
    };

    let transcriptionInstruction: string;
    if (language && language !== 'auto') {
        transcriptionInstruction = `Transcribe all spoken words in this media. The spoken language is ${language}.`;
    } else {
        transcriptionInstruction = 'First, automatically detect the spoken language in this media. Then, transcribe all spoken words.';
    }

    const promptText = `
        ${transcriptionInstruction}
        - The output must be in WebVTT format.
        - Start timestamps from 00:00:00.000.
        - Create cues for logical phrases or sentences.
        - Ensure correct VTT header.
        - If there is no speech, return only the VTT header and a comment indicating no speech was found.

        Example:
        WEBVTT

        00:00:01.000 --> 00:00:04.500
        This is the first sentence of the transcription.

        00:00:05.100 --> 00:00:08.250
        And this is the second part of the speech.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [mediaPart, { text: promptText }] },
            config: {
                systemInstruction: "You are an expert video transcriber. Your task is to generate accurate subtitles in the WebVTT format.",
            },
        });
        
        if (response.promptFeedback?.blockReason) {
            throw new Error(`คำสั่งถูกบล็อกเนื่องจากนโยบายความปลอดภัย: ${response.promptFeedback.blockReasonMessage || response.promptFeedback.blockReason}`);
        }

        const text = response.text.trim();
        if (text.startsWith('WEBVTT')) {
            return text;
        } else {
            if (text.includes('-->')) {
                return 'WEBVTT\n\n' + text;
            }
            throw new Error("The AI did not return a valid WebVTT format.");
        }
    } catch (error) {
        console.error("Error generating subtitles from media:", error);
        throw new Error(`ไม่สามารถสร้างคำบรรยายได้: ${parseApiError(error)}`);
    }
};

export const analyzeAudioFromMedia = async (base64Data: string, mimeType: string): Promise<string> => {
    if (!ai) {
        throw new Error("ไม่ได้กำหนดค่า API_KEY ไม่สามารถเรียกใช้ Gemini API ได้");
    }

    const mediaPart = {
        inlineData: {
            data: base64Data,
            mimeType: mimeType,
        },
    };

    const textPart = {
        text: "Analyze the audio track of this media file. Describe all sounds you hear, including any spoken dialogue (and transcribe it if present), musical elements (like genre, mood, and instrumentation), and ambient sound effects. Provide a comprehensive summary of the audio landscape.",
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [mediaPart, textPart] },
            config: {
                systemInstruction: "You are an expert audio analyst. Your task is to listen to the audio from a media file (which could be audio or video) and provide a detailed breakdown of its components in clear, descriptive Thai.",
            },
        });
        if (response.promptFeedback?.blockReason) {
            throw new Error(`คำสั่งถูกบล็อกเนื่องจากนโยบายความปลอดภัย: ${response.promptFeedback.blockReasonMessage || response.promptFeedback.blockReason}`);
        }
        return response.text;
    } catch (error) {
        console.error("Error analyzing audio from media:", error);
        throw new Error(`ไม่สามารถวิเคราะห์เสียงได้: ${parseApiError(error)}`);
    }
};

export const correctText = async (text: string): Promise<string> => {
    if (!ai) {
        throw new Error("ไม่ได้กำหนดค่า API_KEY ไม่สามารถเรียกใช้ Gemini API ได้");
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Please correct the following Thai text for grammar, spelling, typos, and replace any nonsensical words with appropriate ones. Text: "${text}"`,
            config: {
                systemInstruction: "You are an expert Thai language proofreader. Your task is to correct the provided text. Return only the fully corrected text without any preamble, explanation, or markdown formatting.",
            },
        });
        if (response.promptFeedback?.blockReason) {
            throw new Error(`คำสั่งถูกบล็อกเนื่องจากนโยบายความปลอดภัย: ${response.promptFeedback.blockReasonMessage || response.promptFeedback.blockReason}`);
        }
        return response.text.trim();
    } catch (error) {
        console.error("Error correcting text:", error);
        throw new Error(`ไม่สามารถแก้ไขข้อความได้: ${parseApiError(error)}`);
    }
};

export const identifyAndSearchMusic = async (base64Data: string, mimeType: string): Promise<SearchResult> => {
    if (!ai) {
        throw new Error("ไม่ได้กำหนดค่า API_KEY ไม่สามารถเรียกใช้ Gemini API ได้");
    }

    const mediaPart = {
        inlineData: {
            data: base64Data,
            mimeType: mimeType,
        },
    };

    const textPart = {
        text: `You are a world-class media analysis expert. Your task is to analyze the provided audio and respond in Thai. Your response MUST be a single JSON object.

**Process:**

1.  **Analyze Audio:** Listen to the audio clip carefully. The audio could be a song, spoken words, a sound effect, or rhythmic sounds like tapping or knocking.
2.  **Identify or Describe:**
    *   **If you can identify the specific song/media:** Set \`identificationType\` to "direct". Fill in as many details as possible: \`title\`, \`artist\`, \`album\`, \`year\`, and \`genre\`. Write a concise \`overview\`.
    *   **If you cannot identify it directly:** Set \`identificationType\` to "similarity". Do NOT state that you cannot identify it. Instead, provide a detailed description in the \`overview\` field (e.g., genre, mood, instrumentation, similar artists, or describing the sound like 'fast rhythmic knocking on wood'). Leave other fields like \`title\`, \`artist\`, \`album\`, and \`year\` as null.
3.  **Generate Search Suggestions:** Create an array of 4 relevant and interesting Google search queries related to the identified or described media. Put these in the \`searchSuggestions\` field.

**JSON Output Format:**

{
  "identificationType": "direct" | "similarity",
  "title": "string | null",
  "artist": "string | null",
  "album": "string | null",
  "year": "string | null",
  "genre": "string | null",
  "overview": "string",
  "searchSuggestions": ["string", "string", "string", "string"]
}

**Constraint:** Your final output MUST be only the JSON object. Do not add any other text, markdown, or explanations.`,
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [mediaPart, textPart] },
            config: {
                systemInstruction: "You are a media identification expert. Your goal is to identify content and return a JSON object plus web sources. Respond in Thai.",
                tools: [{ googleSearch: {} }],
            },
        });
        
        if (response.promptFeedback?.blockReason) {
            throw new Error(`คำสั่งถูกบล็อกเนื่องจากนโยบายความปลอดภัย: ${response.promptFeedback.blockReasonMessage || response.promptFeedback.blockReason}`);
        }

        let parsedResult: Partial<SearchResult> = {};
        const rawText = response.text.trim();
        
        try {
            // The model may return markdown with a JSON block. Extract it.
            const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
            const match = rawText.match(jsonRegex);

            let jsonString: string | null = null;
            if (match && match[1]) {
                jsonString = match[1];
            } else {
                // If no markdown block, try to find a raw JSON object
                const jsonStart = rawText.indexOf('{');
                const jsonEnd = rawText.lastIndexOf('}');
                if (jsonStart !== -1 && jsonEnd > jsonStart) {
                    jsonString = rawText.substring(jsonStart, jsonEnd + 1);
                }
            }

            if (jsonString) {
                parsedResult = JSON.parse(jsonString);
            } else {
                console.warn("Could not find a JSON block in the response. Using raw text as overview.");
                parsedResult = { identificationType: 'similarity', overview: rawText };
            }
        } catch (e) {
            console.error("Failed to parse JSON from Gemini response. Raw text:", rawText);
            parsedResult = { identificationType: 'similarity', overview: rawText };
        }
        
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = groundingChunks
            .map((chunk: any) => chunk?.web)
            .filter((web: any) => web?.uri && web?.title)
            .slice(0, 8); 

        if (!parsedResult.overview && sources.length === 0) {
            throw new Error("AI ไม่สามารถระบุสื่อหรือค้นหาแหล่งข้อมูลใดๆ ได้");
        }

        return { 
            identificationType: parsedResult.identificationType || 'similarity',
            title: parsedResult.title || null,
            artist: parsedResult.artist || null,
            album: parsedResult.album || null,
            year: parsedResult.year || null,
            genre: parsedResult.genre || null,
            overview: parsedResult.overview || '',
            searchSuggestions: parsedResult.searchSuggestions || [],
            sources 
        };

    } catch (error) {
        console.error("Error identifying music:", error);
        throw new Error(`ไม่สามารถค้นหาเพลงได้: ${parseApiError(error)}`);
    }
};

export const convertAudioToMidi = async (base64Data: string, mimeType: string): Promise<MidiNote[]> => {
    if (!ai) {
        throw new Error("ไม่ได้กำหนดค่า API_KEY ไม่สามารถเรียกใช้ Gemini API ได้");
    }

    const mediaPart = {
        inlineData: {
            data: base64Data,
            mimeType: mimeType,
        },
    };

    const textPart = {
        text: "Analyze the provided audio clip, which may contain singing, musical instruments, or both. Transcribe the primary melodic line into a series of musical notes. For each note, provide its pitch name (e.g., 'C4', 'F#5'), its start time in seconds from the beginning, its duration in seconds, and its velocity (loudness) from 0 to 127. If you cannot detect a clear melody, return an empty array.",
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [mediaPart, textPart] },
            config: {
                systemInstruction: "You are an expert audio analysis AI that transcribes melodies to a structured JSON format. Focus on the most prominent melody. The output must only be the JSON array.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    description: "An array of transcribed musical notes.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            pitch: {
                                type: Type.STRING,
                                description: "The note pitch (e.g., 'C4', 'G#3') or 'Rest'."
                            },
                            startTime: {
                                type: Type.NUMBER,
                                description: "The start time of the note in seconds."
                            },
                            duration: {
                                type: Type.NUMBER,
                                description: "The duration of the note in seconds."
                            },
                            velocity: {
                                type: Type.INTEGER,
                                description: "The note's velocity (loudness), from 0 to 127."
                            }
                        },
                        required: ["pitch", "startTime", "duration", "velocity"]
                    }
                },
            },
        });

        if (response.promptFeedback?.blockReason) {
            throw new Error(`คำสั่งถูกบล็อกเนื่องจากนโยบายความปลอดภัย: ${response.promptFeedback.blockReasonMessage || response.promptFeedback.blockReason}`);
        }

        const jsonResponse = JSON.parse(response.text);
        if (jsonResponse && Array.isArray(jsonResponse)) {
            return jsonResponse as MidiNote[];
        } else {
            throw new Error("Could not parse MIDI notes from the response.");
        }
    } catch (error) {
        console.error("Error converting audio to MIDI:", error);
        throw new Error(`ไม่สามารถแปลงเสียงเป็น MIDI ได้: ${parseApiError(error)}`);
    }
};
