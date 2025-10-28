
export interface HfChatResponse {
    generated_text: string;
}

export const isHfApiKeyAvailable = true;
const API_URL = "https://api-inference.huggingface.co/models/";

// A common function to query the inference API
async function query(model: string, data: any, isBinary: boolean = false): Promise<any> {
    const headers: HeadersInit = {};
    
    if (!isBinary) {
        headers["Content-Type"] = "application/json";
    }

    try {
        const response = await fetch(API_URL + model, {
            method: "POST",
            headers: headers,
            body: isBinary ? data : JSON.stringify(data),
            credentials: 'omit', // Prevent browser from sending cookies or auth headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Hugging Face API error for model ${model}: ${response.statusText}`;
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.error) {
                    errorMessage += ` - ${errorJson.error}`;
                }
                 if (errorJson.estimated_time) {
                    errorMessage += ` The model is currently loading, please try again in about ${Math.ceil(errorJson.estimated_time)} seconds.`
                }
            } catch (e) {
                 errorMessage += ` - ${errorText}`;
            }
             if (response.status === 503 && !errorMessage.includes('loading')) {
                 errorMessage += ' The model is likely loading. Please try again in a moment.'
             }
            throw new Error(errorMessage);
        }
        
        return response;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("An unknown network error occurred while contacting the Hugging Face API.");
    }
}


// --- Throttling for Image Generation ---
let lastHfImageGenerationTime = 0;
const MIN_HF_IMAGE_GENERATION_INTERVAL_MS = 10000; // HF can be slower, give it more time

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const throttleHfImageGeneration = async () => {
    const now = Date.now();
    const timeSinceLast = now - lastHfImageGenerationTime;
    if (timeSinceLast < MIN_HF_IMAGE_GENERATION_INTERVAL_MS) {
        const waitTime = MIN_HF_IMAGE_GENERATION_INTERVAL_MS - timeSinceLast;
        await delay(waitTime);
    }
    lastHfImageGenerationTime = Date.now();
};


// --- Text-to-Image ---
const STABLE_DIFFUSION_MODEL = "stabilityai/stable-diffusion-xl-base-1.0";

export async function generateStableDiffusionImage(prompt: string): Promise<string> {
    await throttleHfImageGeneration();
    const pixelArtPrompt = `${prompt}, 16-bit pixel art, vibrant colors, detailed, 2d game art`;

    const response = await query(STABLE_DIFFUSION_MODEL, { inputs: pixelArtPrompt });
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject('Failed to convert blob to data URL.');
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// --- Speech-to-Text ---
const WHISPER_MODEL = "openai/whisper-large-v3";

export async function transcribeAudio(audioFile: File): Promise<string> {
    const response = await query(WHISPER_MODEL, audioFile, true);
    const result = await response.json();
    
    if (result && typeof result.text === 'string') {
        return result.text;
    }
    
    throw new Error("Invalid response from transcription model. The result did not contain text.");
}

// --- Conversational Chat ---
export async function chat(model: string, user_input: string, past_user_inputs: string[], generated_responses: string[]): Promise<HfChatResponse> {
    const payload = {
        inputs: {
            past_user_inputs,
            generated_responses,
            text: user_input,
        },
        parameters: {
            repetition_penalty: 1.1,
            temperature: 0.7,
            top_p: 0.9,
            top_k: 50,
            max_new_tokens: 512,
        },
    };
    
    const response = await query(model, payload);
    return await response.json();
}
