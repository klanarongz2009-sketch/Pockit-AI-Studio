const API_URL = "https://api.assemblyai.com/v2";
const API_KEY = process.env.ASSEMBLYAI_API_KEY;

interface UploadResponse {
    upload_url: string;
    id: string; // This is the transcript ID
}

interface TranscriptResponse {
    id: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    text: string | null;
    error?: string;
}

async function query(endpoint: string, options: RequestInit = {}): Promise<any> {
     if (!API_KEY) {
        throw new Error("AssemblyAI API key not found. Please set the ASSEMBLYAI_API_KEY environment variable.");
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            'authorization': API_KEY,
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`AssemblyAI API Error: ${errorData.error || response.statusText}`);
    }

    return response.json();
}

export async function uploadFile(file: File): Promise<UploadResponse> {
    const uploadResponse = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
            'authorization': API_KEY,
            'Content-Type': file.type,
        },
        body: file,
    });
    const uploadData = await uploadResponse.json();
    if (!uploadData.upload_url) {
        throw new Error('Failed to get an upload URL from AssemblyAI.');
    }

    const transcriptResponse = await query('/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_url: uploadData.upload_url }),
    });

    return transcriptResponse;
}

export async function getTranscript(transcriptId: string): Promise<TranscriptResponse> {
    return query(`/transcript/${transcriptId}`);
}
