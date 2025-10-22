export interface HfModel {
    id: string; // The Hugging Face model ID
    name: string; // Display name for the model
    description: string;
    category: 'General Purpose' | 'Creative' | 'Technical' | 'Experimental';
}
  
  export const ALL_HF_MODELS: HfModel[] = [
    { 
        id: 'mistralai/Mistral-7B-Instruct-v0.2',
        name: 'Pockit ai',
        description: 'Pockit1.0 (Experimental): A friendly and helpful assistant that combines knowledge from various types of models (text, image, and more) to provide comprehensive answers.',
        category: 'Experimental',
    },
    { 
        id: 'mistralai/Mistral-7B-Instruct-v0.2', 
        name: 'Mistral 7B', 
        description: 'A powerful and efficient model, great for general conversation and instruction following.', 
        category: 'General Purpose', 
    },
    { 
        id: 'meta-llama/Meta-Llama-3-8B-Instruct', 
        name: 'Llama 3 8B', 
        description: 'Meta\'s latest generation small model, highly capable for a wide range of tasks.', 
        category: 'General Purpose', 
    },
     { 
        id: 'google/gemma-1.1-7b-it', 
        name: 'Gemma 1.1 7B', 
        description: 'Google\'s powerful open model, based on the same research as Gemini.', 
        category: 'Technical', 
    },
    {
        id: 'HuggingFaceH4/zephyr-7b-beta',
        name: 'Zephyr 7B',
        description: 'A fine-tuned version of Mistral, optimized for chat and helpfulness.',
        category: 'General Purpose',
    },
  ];