const API_URL = "https://api.openai.com/v1/chat/completions";
const API_KEY = process.env.OPENAI_API_KEY;

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export async function chat(model: string, messages: Message[]): Promise<string> {
    if (!API_KEY) {
        throw new Error("OpenAI API key not found. Please set the OPENAI_API_KEY environment variable.");
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
        }
        
        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (typeof content !== 'string') {
            throw new Error("Invalid response format from OpenAI API.");
        }
        
        return content;

    } catch (error) {
        if (error instanceof Error) {
            // Prepend a more user-friendly message for common network errors
            if (error.message.includes('Failed to fetch')) {
                 throw new Error(`Network error: Could not connect to OpenAI API. Please check your internet connection.`);
            }
            throw error;
        }
        throw new Error("An unknown error occurred while contacting the OpenAI API.");
    }
}
