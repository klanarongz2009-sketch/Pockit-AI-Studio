import React, { useState, useEffect, useRef, useCallback, FC } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, Content } from '@google/genai';
import * as geminiService from '../services/geminiService';
import * as audioService from '../services/audioService';
import { PageWrapper, PageHeader } from './PageComponents';
import { LoadingSpinner } from './LoadingSpinner';
import { ChatIcon } from './icons/ChatIcon';
import { GalleryIcon } from './icons/GalleryIcon';
import { VideoEditorIcon } from './icons/VideoEditorIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { SendIcon } from './icons/SendIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { UploadIcon } from './icons/UploadIcon';
import { StopIcon } from './icons/StopIcon';
import { TrashIcon } from './icons/TrashIcon';
import { XIcon } from './icons/XIcon';
import { RegenerateIcon } from './icons/RegenerateIcon';
// FIX: Import Message type from preferenceService to resolve namespace error.
import type { Message } from '../services/preferenceService';

// --- Live API Helper Functions ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
// --- End Helper Functions ---


interface GemAiAppsPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

type ActiveTab = 'chat' | 'image' | 'video' | 'audio';
type ImageMode = 'generate' | 'edit' | 'understand';
type VideoMode = 'textToVideo' | 'imageToVideo' | 'understand';
type ApiKeyStatus = 'unknown' | 'checking' | 'selected' | 'not_selected';

const TabButton: FC<{ active: boolean; onClick: () => void; label: string; icon: React.ReactNode; }> = ({ active, onClick, label, icon }) => (
    <button
        onClick={onClick}
        className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 border-b-4 text-xs font-press-start transition-colors ${
            active ? 'border-brand-yellow text-brand-yellow' : 'border-transparent text-text-secondary hover:text-text-primary'
        }`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const FilePreview: FC<{ file: File; onClear: () => void; }> = ({ file, onClear }) => {
    const previewUrl = React.useMemo(() => URL.createObjectURL(file), [file]);
    useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl]);

    return (
        <div className="relative group bg-black/50 p-2 border border-border-primary">
            <p className="text-xs text-text-secondary truncate mb-2">{file.name}</p>
            {file.type.startsWith('image/') && <img src={previewUrl} alt="Preview" className="max-h-24 mx-auto" />}
            {file.type.startsWith('video/') && <video src={previewUrl} className="max-h-24 mx-auto" controls />}
            {file.type.startsWith('audio/') && <audio src={previewUrl} className="w-full" controls />}
            <button onClick={onClear} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <XIcon className="w-4 h-4" />
            </button>
        </div>
    );
};


export const GemAiAppsPage: React.FC<GemAiAppsPageProps> = ({ onClose, playSound, isOnline }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
    
    // Global state
    const [globalIsLoading, setGlobalIsLoading] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);

    // Chat state
    // FIX: Use the imported Message type.
    const [chatMessages, setChatMessages] = useState<Message[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [useSearch, setUseSearch] = useState(false);
    const [useMaps, setUseMaps] = useState(false);
    const [useThinking, setUseThinking] = useState(false);

    // Image state
    const [imageMode, setImageMode] = useState<ImageMode>('generate');
    const [imagePrompt, setImagePrompt] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageResult, setImageResult] = useState<string | null>(null);
    const [imageAnalysis, setImageAnalysis] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState('1:1');

    // Video state
    const [videoMode, setVideoMode] = useState<VideoMode>('textToVideo');
    const [videoPrompt, setVideoPrompt] = useState('');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoResultUrl, setVideoResultUrl] = useState<string | null>(null);
    const [videoAnalysis, setVideoAnalysis] = useState<string | null>(null);
    const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>('unknown');

    // Audio state
    const [transcription, setTranscription] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

    // --- General ---
    const messagesEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, globalIsLoading]);

    // --- Chat Logic ---
    const handleSendMessage = useCallback(async () => {
        if (!chatInput.trim()) return;
        setGlobalIsLoading(true);
        setGlobalError(null);
        playSound(audioService.playClick);

        // FIX: Use the imported Message type.
        const newUserMessage: Message = { role: 'user', text: chatInput, id: `user-${Date.now()}`};
        setChatMessages(prev => [...prev, newUserMessage]);
        setChatInput('');

        try {
            const model = useThinking ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
            const tools: any[] = [];
            if (useSearch) tools.push({ googleSearch: {} });
            if (useMaps) tools.push({ googleMaps: {} });
            
            const config: any = {};
            if (useThinking) config.thinkingConfig = { thinkingBudget: 32768 };
            if (tools.length > 0) config.tools = tools;

            if (useMaps) {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });
                config.toolConfig = {
                    retrievalConfig: {
                        latLng: {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        }
                    }
                };
            }
            
            // FIX: Use the new generateContentWithTools function.
            const response = await geminiService.generateContentWithTools(chatInput, model, config);
            // FIX: The type 'GroundingChunk[]' is not assignable to type '{ uri: string; title: string; }[]'.
            // Map the grounding chunks to the format expected by the Message interface.
            // FIX: Add a nullish coalescing operator to prevent calling .map on a potentially undefined value.
            const sources = (response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []).map((chunk: any) => ({
                uri: chunk.web?.uri || chunk.maps?.uri || '',
                title: chunk.web?.title || chunk.maps?.title || ''
            })).filter(s => s.uri);
            // FIX: Use the imported Message type.
            const modelMessage: Message = {
                role: 'model',
                text: response.text,
                id: `model-${Date.now()}`,
                sources: sources
            };
            setChatMessages(prev => [...prev, modelMessage]);
        } catch (err) {
            setGlobalError(geminiService.parseApiError(err));
            setChatMessages(prev => prev.slice(0, -1)); // Remove user message on error
        } finally {
            setGlobalIsLoading(false);
        }
    }, [chatInput, useSearch, useMaps, useThinking, playSound]);

    // --- Image Logic ---
    const handleImageAction = useCallback(async () => {
        setGlobalIsLoading(true);
        setGlobalError(null);
        setImageResult(null);
        setImageAnalysis(null);
        playSound(audioService.playGenerate);
        
        try {
            const toBase64 = (file: File): Promise<{base64: string, mimeType: string}> => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve({ base64: (reader.result as string).split(',')[1], mimeType: file.type });
                reader.onerror = error => reject(error);
            });

            if (imageMode === 'generate') {
                // FIX: Use the new generateImageImagen function.
                const result = await geminiService.generateImageImagen(imagePrompt, aspectRatio);
                setImageResult(result);
            } else if ((imageMode === 'edit' || imageMode === 'understand') && imageFile) {
                const { base64, mimeType } = await toBase64(imageFile);
                if (imageMode === 'edit') {
                    // FIX: Use the new editImage function.
                    const result = await geminiService.editImage(base64, mimeType, imagePrompt);
                    setImageResult(result);
                } else { // understand
                    // FIX: Use the new analyzeImage function.
                    const result = await geminiService.analyzeImage(base64, mimeType, imagePrompt);
                    setImageAnalysis(result);
                }
            } else {
                throw new Error("Please provide the required inputs for the selected mode.");
            }
             playSound(audioService.playSuccess);
        } catch(err) {
            setGlobalError(geminiService.parseApiError(err));
            playSound(audioService.playError);
        } finally {
            setGlobalIsLoading(false);
        }

    }, [imageMode, imagePrompt, imageFile, aspectRatio, playSound]);

    // --- Video Logic ---
    const checkApiKey = useCallback(async () => {
        if (typeof window.aistudio?.hasSelectedApiKey !== 'function') return;
        setApiKeyStatus('checking');
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setApiKeyStatus(hasKey ? 'selected' : 'not_selected');
    }, []);

    useEffect(() => {
        if (activeTab === 'video' && apiKeyStatus === 'unknown') {
            checkApiKey();
        }
    }, [activeTab, apiKeyStatus, checkApiKey]);

    const handleVideoAction = useCallback(async () => {
        setGlobalIsLoading(true);
        setGlobalError(null);
        setVideoResultUrl(null);
        setVideoAnalysis(null);
        playSound(audioService.playGenerate);
        
        const toBase64 = (file: File): Promise<{base64: string, mimeType: string}> => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve({ base64: (reader.result as string).split(',')[1], mimeType: file.type });
            reader.onerror = error => reject(error);
        });

        try {
            if (videoMode === 'textToVideo') {
                // FIX: Use the new generateVideoVeo function.
                const resultUrl = await geminiService.generateVideoVeo(videoPrompt, videoAspectRatio, undefined);
                setVideoResultUrl(resultUrl);
            } else if (videoMode === 'imageToVideo' && videoFile) {
                const { base64, mimeType } = await toBase64(videoFile);
                // FIX: Use the new generateVideoVeo function.
                const resultUrl = await geminiService.generateVideoVeo(videoPrompt, videoAspectRatio, { imageBytes: base64, mimeType });
                setVideoResultUrl(resultUrl);
            } else if (videoMode === 'understand' && videoFile) {
                const { base64, mimeType } = await toBase64(videoFile);
                // FIX: Use the new analyzeVideoPro function.
                const result = await geminiService.analyzeVideoPro(base64, mimeType, videoPrompt);
                setVideoAnalysis(result);
            } else {
                 throw new Error("Please provide the required inputs for the selected mode.");
            }
            playSound(audioService.playSuccess);
        } catch (err) {
            const errorMessage = geminiService.parseApiError(err);
            if (errorMessage.includes("Requested entity was not found")) {
                setGlobalError("API Key error. Please re-select your key.");
                setApiKeyStatus('not_selected');
            } else {
                setGlobalError(errorMessage);
            }
            playSound(audioService.playError);
        } finally {
            setGlobalIsLoading(false);
        }

    }, [videoMode, videoPrompt, videoFile, videoAspectRatio, playSound]);

    // --- Audio Logic ---
    const stopRecording = useCallback(() => {
        setIsRecording(false);
        sessionPromiseRef.current?.then(session => session.close());
        sessionPromiseRef.current = null;
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        if (audioContextRef.current?.state !== 'closed') audioContextRef.current?.close();
    }, []);

    const startRecording = useCallback(async () => {
        if (!isOnline) { setGlobalError("Audio transcription requires an internet connection."); return; }
        setIsRecording(true);
        setTranscription('');
        setGlobalError(null);
        playSound(audioService.playClick);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            audioContextRef.current = audioContext;

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const source = audioContext.createMediaStreamSource(stream);
                        const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;
                        scriptProcessor.onaudioprocess = (event) => {
                            const inputData = event.inputBuffer.getChannelData(0);
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(audioContext.destination);
                    },
                    onmessage: (msg: LiveServerMessage) => {
                        if (msg.serverContent?.inputTranscription?.text) {
                            setTranscription(prev => prev + msg.serverContent.inputTranscription.text);
                        }
                    },
                    onerror: (e: ErrorEvent) => { setGlobalError(`Connection error: ${e.message}`); stopRecording(); },
                    onclose: () => { if(isRecording) stopRecording(); },
                },
                config: { inputAudioTranscription: {} }
            });

        } catch (err) {
            setGlobalError("Could not access microphone. Please grant permission.");
            stopRecording();
        }
    }, [isOnline, isRecording, playSound, stopRecording]);

    useEffect(() => {
        return () => stopRecording();
    }, [stopRecording]);

    const renderChatTab = () => (
        <div className="h-full flex flex-col">
             <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {chatMessages.map(msg => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && <div className="w-6 h-6 text-brand-cyan flex-shrink-0 mt-1"><SparklesIcon /></div>}
                        <div className={`max-w-xl p-3 text-sm rounded-lg ${msg.role === 'user' ? 'bg-brand-primary/80 text-black' : 'bg-surface-2'}`}>
                            <div className="whitespace-pre-wrap">{msg.text}</div>
                            {msg.sources && (
                                <div className="mt-3 pt-2 border-t border-border-primary/50">
                                    <h4 className="text-xs font-press-start mb-1">Sources:</h4>
                                    <ul className="text-xs space-y-1">
                                        {(msg.sources as any[]).map((source, i) => (
                                            <li key={i} className="truncate">
                                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-yellow">
                                                    {source.title || 'Source'}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {globalIsLoading && <div className="flex gap-3"><div className="w-6 h-6 text-brand-cyan flex-shrink-0 mt-1"><SparklesIcon /></div><LoadingSpinner text="" /></div>}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t-2 border-border-primary space-y-2">
                {globalError && <p className="text-brand-accent text-xs text-center">{globalError}</p>}
                 <div className="grid grid-cols-3 gap-2 text-xs font-press-start">
                    <label className="flex items-center gap-2 p-1 bg-surface-1 rounded-md cursor-pointer"><input type="checkbox" checked={useSearch} onChange={e => setUseSearch(e.target.checked)} className="accent-brand-primary"/>Search</label>
                    <label className="flex items-center gap-2 p-1 bg-surface-1 rounded-md cursor-pointer"><input type="checkbox" checked={useMaps} onChange={e => setUseMaps(e.target.checked)} className="accent-brand-primary"/>Maps</label>
                    <label className="flex items-center gap-2 p-1 bg-surface-1 rounded-md cursor-pointer"><input type="checkbox" checked={useThinking} onChange={e => setUseThinking(e.target.checked)} className="accent-brand-primary"/>Thinking</label>
                </div>
                <div className="flex items-center gap-2">
                    <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} placeholder="Ask anything..." className="w-full p-2 bg-surface-2 border border-border-primary rounded-md"/>
                    <button onClick={handleSendMessage} disabled={globalIsLoading || !chatInput.trim()} className="p-2 bg-brand-primary rounded-md text-text-inverted disabled:bg-surface-2"><SendIcon className="w-5 h-5"/></button>
                </div>
            </div>
        </div>
    );

    const renderImageTab = () => (
        <div className="p-4 space-y-4">
            <div className="grid grid-cols-3 gap-1 p-1 bg-surface-1 rounded-md">
                {(['generate', 'edit', 'understand'] as ImageMode[]).map(m => <button key={m} onClick={() => setImageMode(m)} className={`p-1 text-xs rounded ${imageMode === m ? 'bg-brand-primary text-text-inverted' : 'hover:bg-surface-2'}`}>{m}</button>)}
            </div>
            { (imageMode === 'edit' || imageMode === 'understand') && (
                !imageFile ? <button onClick={() => document.getElementById('image-upload')?.click()} className="w-full p-4 border-2 border-dashed border-border-primary flex flex-col items-center justify-center gap-2 text-text-secondary hover:border-brand-primary hover:text-brand-primary"><UploadIcon className="w-8 h-8"/><span>Upload Image</span></button> : <FilePreview file={imageFile} onClear={() => setImageFile(null)}/>
            )}
            <input type="file" id="image-upload" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files?.[0] || null)} />

            <textarea value={imagePrompt} onChange={e => setImagePrompt(e.target.value)} placeholder={imageMode === 'understand' ? 'Ask a question about the image...' : 'Describe the image you want...'} className="w-full h-24 p-2 bg-surface-2 rounded-md"/>
            
            {imageMode === 'generate' && (
                <div>
                    <label className="text-xs font-press-start">Aspect Ratio</label>
                    <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="w-full p-2 bg-surface-2 rounded-md mt-1">
                        {["1:1", "16:9", "9:16", "4:3", "3:4"].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
            )}

            <button onClick={handleImageAction} disabled={globalIsLoading} className="w-full p-3 bg-brand-primary text-text-inverted rounded-md font-press-start disabled:bg-surface-2">{globalIsLoading ? 'Working...' : 'Go'}</button>

            {globalError && <p className="text-brand-accent text-xs text-center">{globalError}</p>}
            {globalIsLoading ? <LoadingSpinner /> : (
                <div className="p-2 bg-surface-1 rounded-md min-h-[200px] flex items-center justify-center">
                    {imageResult ? <img src={imageResult} alt="Generated result" className="max-w-full max-h-64"/> : imageAnalysis ? <p className="text-sm whitespace-pre-wrap">{imageAnalysis}</p> : <p className="text-xs text-text-secondary">Result will appear here</p>}
                </div>
            )}
        </div>
    );
    
    const renderVideoTab = () => {
        if (apiKeyStatus !== 'selected') {
            return (
                <div className="p-4 text-center space-y-4">
                    <h3 className="font-press-start text-brand-yellow">API Key Required for Veo</h3>
                    <p className="text-xs">Video generation with Veo requires project billing to be enabled. Please select an API key from a project with billing enabled to proceed.</p>
                    <p className="text-xs">For more information, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline">billing documentation</a>.</p>
                    {apiKeyStatus === 'not_selected' && <button onClick={async () => { await window.aistudio.openSelectKey(); checkApiKey(); }} className="p-3 bg-brand-primary text-text-inverted rounded-md font-press-start">Select API Key</button>}
                    {apiKeyStatus === 'checking' && <LoadingSpinner />}
                </div>
            );
        }

        return (
            <div className="p-4 space-y-4">
                <div className="grid grid-cols-3 gap-1 p-1 bg-surface-1 rounded-md">
                    {(['textToVideo', 'imageToVideo', 'understand'] as VideoMode[]).map(m => <button key={m} onClick={() => setVideoMode(m)} className={`p-1 text-xs rounded ${videoMode === m ? 'bg-brand-primary text-text-inverted' : 'hover:bg-surface-2'}`}>{m.replace('Video', ' Video')}</button>)}
                </div>
                { (videoMode === 'imageToVideo' || videoMode === 'understand') && (
                    !videoFile ? <button onClick={() => document.getElementById('video-upload')?.click()} className="w-full p-4 border-2 border-dashed border-border-primary flex flex-col items-center justify-center gap-2 text-text-secondary hover:border-brand-primary hover:text-brand-primary"><UploadIcon className="w-8 h-8"/><span>Upload {videoMode === 'understand' ? 'Video' : 'Image'}</span></button> : <FilePreview file={videoFile} onClear={() => setVideoFile(null)}/>
                )}
                <input type="file" id="video-upload" accept={videoMode === 'understand' ? 'video/*' : 'image/*'} className="hidden" onChange={e => setVideoFile(e.target.files?.[0] || null)} />

                <textarea value={videoPrompt} onChange={e => setVideoPrompt(e.target.value)} placeholder={videoMode === 'understand' ? 'Ask a question about the video...' : 'Describe the video you want...'} className="w-full h-24 p-2 bg-surface-2 rounded-md"/>
                
                {(videoMode === 'textToVideo' || videoMode === 'imageToVideo') && (
                    <div>
                        <label className="text-xs font-press-start">Aspect Ratio</label>
                        <select value={videoAspectRatio} onChange={e => setVideoAspectRatio(e.target.value as any)} className="w-full p-2 bg-surface-2 rounded-md mt-1">
                            <option value="16:9">16:9 (Landscape)</option>
                            <option value="9:16">9:16 (Portrait)</option>
                        </select>
                    </div>
                )}
                
                <button onClick={handleVideoAction} disabled={globalIsLoading} className="w-full p-3 bg-brand-primary text-text-inverted rounded-md font-press-start disabled:bg-surface-2">{globalIsLoading ? 'Generating Video (this can take a few minutes)...' : 'Go'}</button>
                
                {globalError && <p className="text-brand-accent text-xs text-center">{globalError}</p>}
                {globalIsLoading ? <LoadingSpinner text="Generating video..." /> : (
                    <div className="p-2 bg-surface-1 rounded-md min-h-[200px] flex items-center justify-center">
                        {videoResultUrl ? <video src={`${videoResultUrl}&key=${process.env.API_KEY}`} controls autoPlay className="max-w-full max-h-64"/> : videoAnalysis ? <p className="text-sm whitespace-pre-wrap">{videoAnalysis}</p> : <p className="text-xs text-text-secondary">Result will appear here</p>}
                    </div>
                )}
            </div>
        );
    };

    const renderAudioTab = () => (
        <div className="p-4 space-y-4 flex flex-col h-full">
            <button onClick={isRecording ? stopRecording : startRecording} disabled={!isOnline} className={`w-full flex items-center justify-center gap-2 p-3 border-4 font-press-start ${isRecording ? 'bg-brand-accent text-white border-white' : 'bg-brand-primary text-text-inverted border-border-primary'}`}>
                {isRecording ? <StopIcon className="w-5 h-5"/> : <MicrophoneIcon className="w-5 h-5"/>}
                {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            <div className="flex-grow p-4 bg-surface-1 rounded-md">
                <p className="text-sm whitespace-pre-wrap">{transcription || 'Live transcription will appear here...'}</p>
                {isRecording && <span className="inline-block w-2 h-2 bg-brand-accent rounded-full animate-pulse ml-2"></span>}
            </div>
            {globalError && <p className="text-brand-accent text-xs text-center">{globalError}</p>}
        </div>
    );
    
    return (
        <PageWrapper>
            <PageHeader title="GEM AI Apps" onBack={onClose} />
            <main className="w-full flex-grow flex flex-col" style={{ height: 'calc(100% - 4rem)'}}>
                <div className="flex-shrink-0 flex justify-around bg-surface-2 border-b-2 border-border-primary">
                    <TabButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} label="Chat" icon={<ChatIcon className="w-6 h-6"/>} />
                    <TabButton active={activeTab === 'image'} onClick={() => setActiveTab('image')} label="Image" icon={<GalleryIcon className="w-6 h-6"/>} />
                    <TabButton active={activeTab === 'video'} onClick={() => setActiveTab('video')} label="Video" icon={<VideoEditorIcon className="w-6 h-6"/>} />
                    <TabButton active={activeTab === 'audio'} onClick={() => setActiveTab('audio')} label="Audio" icon={<MicrophoneIcon className="w-6 h-6"/>} />
                </div>
                <div className="flex-grow overflow-y-auto">
                    {activeTab === 'chat' && renderChatTab()}
                    {activeTab === 'image' && renderImageTab()}
                    {activeTab === 'video' && renderVideoTab()}
                    {activeTab === 'audio' && renderAudioTab()}
                </div>
            </main>
        </PageWrapper>
    );
};