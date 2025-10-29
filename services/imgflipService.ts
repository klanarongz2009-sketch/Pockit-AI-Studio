export interface MemeTemplate {
    id: string;
    name: string;
    url: string;
    width: number;
    height: number;
    box_count: number;
}

const API_URL = "https://api.imgflip.com";

export async function getMemeTemplates(): Promise<MemeTemplate[]> {
    try {
        const response = await fetch(`${API_URL}/get_memes`);
        if (!response.ok) {
            throw new Error(`Imgflip API error: ${response.statusText}`);
        }
        const data = await response.json();
        if (!data.success) {
            throw new Error(`Imgflip API error: ${data.error_message}`);
        }
        return data.data.memes;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to fetch meme templates: ${error.message}`);
        }
        throw new Error("An unknown error occurred while fetching meme templates.");
    }
}

export async function createMeme(templateId: string, textInputs: string[]): Promise<string> {
    const params = new URLSearchParams();
    params.append('template_id', templateId);
    // Imgflip API has username/password as query params, which is not ideal but how their API works.
    // Using dummy credentials as per their documentation for unauthenticated requests.
    params.append('username', 'imgflip_hub'); 
    params.append('password', 'imgflip_hub');

    textInputs.forEach((text, index) => {
        if (text) { // Only add non-empty text boxes
            params.append(`boxes[${index}][text]`, text);
        }
    });

    try {
        const response = await fetch(`${API_URL}/caption_image`, {
            method: 'POST',
            body: params,
        });

        if (!response.ok) {
            throw new Error(`Imgflip API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(`Imgflip API error: ${data.error_message}`);
        }
        return data.data.url;
    } catch (error) {
         if (error instanceof Error) {
            throw new Error(`Failed to create meme: ${error.message}`);
        }
        throw new Error("An unknown error occurred while creating the meme.");
    }
}
