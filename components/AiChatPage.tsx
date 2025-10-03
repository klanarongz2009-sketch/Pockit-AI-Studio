
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// FIX: The 'LiveSession' type is not exported from the '@google/genai' module.
// It has been removed from the import statement to resolve the error.
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import * as geminiService from '../services/geminiService';
import * as audioService from '../services/audioService';
import * as preferenceService from '../services/preferenceService';
import { ALL_AI_MODELS, AiModel } from '../services/aiModels';
import { LoadingSpinner } from './LoadingSpinner';
import { SendIcon } from './icons/SendIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CopyIcon } from './icons/CopyIcon';
import { Modal } from './Modal';
import { SearchIcon } from './icons/SearchIcon';
import { useLanguage } from '../contexts/LanguageContext';
import { ThumbsUpIcon } from './icons/ThumbsUpIcon';
import { ThumbsDownIcon } from './icons/ThumbsDownIcon';
import { RegenerateIcon } from './icons/RegenerateIcon';
import { ModelInfoPage } from './ModelInfoPage';
import { UploadIcon } from './icons/UploadIcon';
import { XIcon } from './icons/XIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { StopIcon } from './icons/StopIcon';
import { SpeakerOnIcon } from './icons/SpeakerOnIcon';

// --- Gemini Live API Helper Functions ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
// --- End Helper Functions ---


interface AiChatPageProps {
  isOnline: boolean;
  playSound: (player: () => void) => void;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: { uri: string; title:string }[];
}

interface FileData {
    file: File;
    base64: string;
}

const ModelSelectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelect: (model: AiModel) => void;
  onLearnMore: () => void;
  models: AiModel[];
}> = ({ isOpen, onClose, onSelect, onLearnMore, models }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const { t } = useLanguage();
    const categories = useMemo(() => ['All', ...Array.from(new Set(models.map(m => m.category)))], [models]);
    const [activeCategory, setActiveCategory] = useState<'All' | AiModel['category']>('All');

    const filteredModels = useMemo(() => {
        return models
            .filter(model => activeCategory === 'All' || model.category === activeCategory)
            .filter(model => 
                model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                model.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
    }, [models, activeCategory, searchQuery]);

    const groupedModels = useMemo(() => {
        return filteredModels.reduce((acc, model) => {
            const key = model.subCategory;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(model);
            return acc;
        }, {} as Record<string, AiModel[]>);
    }, [filteredModels]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('aiChat.selectAssistant')}>
            <div className="flex flex-col h-[calc(100vh-100px)] font-sans">
                <div className="p-2 mb-4 bg-brand-cyan/10 border border-brand-cyan text-center text-xs text-brand-cyan">
                    <p className="font-press-start">New models will be added here!</p>
                    <button onClick={onLearnMore} className="text-xs underline hover:text-brand-yellow">Learn More</button>
                </div>
                <div className="relative mb-4">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
                        <SearchIcon className="w-5 h-5" />
                    </span>
                    <input
                        type="search"
                        placeholder={t('aiChat.searchAssistant')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-2 pl-10 bg-surface-primary border-2 border-border-secondary text-text-primary focus:outline-none focus:border-brand-yellow"
                    />
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat as any)}
                            className={`px-3 py-1 text-xs font-press-start border-2 transition-colors ${activeCategory === cat ? 'bg-brand-yellow text-black border-black' : 'bg-surface-primary border-border-secondary text-text-primary hover:bg-brand-cyan/20'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="flex-grow overflow-y-auto pr-2">
                    {Object.entries(groupedModels).map(([subCategory, models]) => (
                        <div key={subCategory} className="mb-4">
                            <h3 className="font-press-start text-sm text-brand-cyan mb-2">{subCategory}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {models.map(model => (
                                    <button
                                        key={model.name}
                                        onClick={() => onSelect(model)}
                                        className="w-full h-full text-left p-3 bg-surface-primary border-2 border-border-secondary hover:border-brand-yellow hover:bg-brand-cyan/10 transition-colors"
                                    >
                                        <p className="font-press-start text-xs text-brand-light">{model.name}</p>
                                        <p className="text-xs text-text-secondary mt-1">{model.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
};

let ai: GoogleGenAI | null = null;
const API_KEY = process.env.API_KEY;

if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
    console.error("Gemini API key not found. AI Chat will not work.");
}


export const AiChatPage: React.FC<AiChatPageProps> = ({ isOnline, playSound }) => {
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);
    const [isModelInfoOpen, setIsModelInfoOpen] = useState(false);
    const { t } = useLanguage();
    
    const [selectedModel, setSelectedModel] = useState<AiModel>(() => {
        const savedName = preferenceService.getPreference('defaultChatModelName', ALL_AI_MODELS[0]?.name || '');
        return ALL_AI_MODELS.find(m => m.name === savedName) || ALL_AI_MODELS[0];
    });
    
    const [fileData, setFileData] = useState<FileData | null>(null);

    const canUseWebSearch = useMemo(() => selectedModel.id !== 'local-robot' && !fileData, [selectedModel, fileData]);
    const [webSearchEnabled, setWebSearchEnabled] = useState(() => preferenceService.getPreference('defaultWebSearch', false) && canUseWebSearch);
    
    const [messages, setMessages] = useState<Message[]>([]);
    
    // --- Voice Assistant State ---
    const [liveConnectionState, setLiveConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
    const [currentMicInput, setCurrentMicInput] = useState('');
    const [currentModelOutput, setCurrentModelOutput] = useState('');

    const currentMicInputRef = useRef('');
    const currentModelOutputRef = useRef('');
    // FIX: Replaced the unexported 'LiveSession' type with 'any' to handle the session promise.
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioSources = useRef(new Set<AudioBufferSourceNode>());
    const nextStartTime = useRef(0);

    // --- Gemini Text-to-Speech State ---
    const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset chat when model changes
    useEffect(() => {
        setMessages([]);
        geminiService.resetChatSession();
        setError(null);
    }, [selectedModel]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSpeakTextWithGemini = useCallback(async (message: Message) => {
        if (!ai || !isOnline || speakingMessageId) return;

        playSound(audioService.playClick);
        setSpeakingMessageId(message.id);
        setError(null);

        const ttsOutputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const ttsInputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const ttsAudioSources = new Set<AudioBufferSourceNode>();
        let ttsNextStartTime = 0;
        // FIX: Replaced the unexported 'LiveSession' type with 'any' for the local session promise variable.
        let ttsSessionPromise: Promise<any> | null = null;
        let cleanedUp = false;

        const cleanup = () => {
            if (cleanedUp) return;
            cleanedUp = true;
            
            ttsSessionPromise?.then(s => s.close());
            
            if (ttsInputCtx.state !== 'closed') ttsInputCtx.close();
            if (ttsOutputCtx.state !== 'closed') {
                for (const source of ttsAudioSources.values()) source.stop();
                ttsAudioSources.clear();
                ttsOutputCtx.close();
            }

            setSpeakingMessageId(null);
        };

        ttsSessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    ttsSessionPromise?.then(session => {
                        const silentBuffer = ttsInputCtx.createBuffer(1, 160, 16000); // 10ms
                        const silentData = silentBuffer.getChannelData(0);
                        const pcmBlob: Blob = {
                            data: encode(new Uint8Array(new Int16Array(silentData.map(x => x * 32768)).buffer)),
                            mimeType: 'audio/pcm;rate=16000',
                        };
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                },
                onmessage: async (msg: LiveServerMessage) => {
                    const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio) {
                        ttsNextStartTime = Math.max(ttsNextStartTime, ttsOutputCtx.currentTime);
                        const audioBuffer = await decodeAudioData(decode(base64Audio), ttsOutputCtx, 24000, 1);
                        const sourceNode = ttsOutputCtx.createBufferSource();
                        sourceNode.buffer = audioBuffer;
                        sourceNode.connect(ttsOutputCtx.destination);
                        sourceNode.addEventListener('ended', () => ttsAudioSources.delete(sourceNode));
                        sourceNode.start(ttsNextStartTime);
                        ttsNextStartTime += audioBuffer.duration;
                        ttsAudioSources.add(sourceNode);
                    }
                    if (msg.serverContent?.turnComplete) {
                        const timeToWait = (ttsNextStartTime - ttsOutputCtx.currentTime) * 1000 + 200;
                        setTimeout(cleanup, Math.max(0, timeToWait));
                    }
                },
                onerror: (e: ErrorEvent) => {
                    setError(geminiService.parseApiError(e));
                    cleanup();
                },
                onclose: () => {
                    cleanup();
                },
            },
            config: {
                responseModalities: [Modality.AUDIO],
                systemInstruction: `You are a text-to-speech engine. Your only task is to read the following text aloud clearly and naturally, and then stop. Text: "${message.text}"`
            }
        });
    }, [isOnline, speakingMessageId, playSound]);

    // --- Core Chat Logic ---
    
    const handleNewChat = useCallback(() => {
        playSound(audioService.playTrash);
        geminiService.resetChatSession();
        setMessages([]);
        setError(null);
        setUserInput('');
        setFileData(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [playSound]);

    const runGemini = useCallback(async (prompt: string) => {
         if (selectedModel.id !== 'local-robot' && !isOnline) {
             setError("You must be online to use this model.");
             return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await geminiService.sendMessageToChat(
                prompt,
                selectedModel.id,
                selectedModel.systemInstruction,
                webSearchEnabled && canUseWebSearch
            );

            const modelMessage: Message = {
                id: `msg-${Date.now()}`,
                role: 'model',
                text: response.text,
                sources: response.sources
            };
            setMessages(prev => [...prev, modelMessage]);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [isOnline, selectedModel, webSearchEnabled, canUseWebSearch]);
    
    const handleSendMessage = useCallback(async () => {
        const trimmedInput = userInput.trim();
        if (!trimmedInput || isLoading) return;
        
        playSound(audioService.playClick);
        const userMessage: Message = { id: `msg-${Date.now()}`, role: 'user', text: trimmedInput };
        setMessages(prev => [...prev, userMessage]);
        setUserInput('');
        
        if (fileData) {
            setIsLoading(true);
            setError(null);
            try {
                // FIX: The stale closure that caused a type error is resolved by including `messages`
                // in the `useCallback` dependency array. This allows us to safely map over it.
                const chatHistory = messages.map(m => ({ role: m.role, text: m.text }));
                const responseText = await geminiService.chatWithFile(
                    { base64: fileData.base64, mimeType: fileData.file.type },
                    chatHistory,
                    trimmedInput
                );
                const modelMessage: Message = { id: `msg-${Date.now()}-model`, role: 'model', text: responseText };
                setMessages(prev => [...prev, modelMessage]);
            } catch(err) {
                 const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
                 setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        } else {
            await runGemini(trimmedInput);
        }
    // FIX: Add `messages` to the dependency array to prevent a stale closure,
    // ensuring the correct chat history is sent with each message. This also resolves the type error.
    }, [userInput, isLoading, playSound, runGemini, fileData, messages]);

    const handleRegenerate = useCallback(() => {
        const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user');
        if (!lastUserMessage || isLoading) return;

        playSound(audioService.playClick);
        setMessages(prev => prev.slice(-1)[0].role === 'model' ? prev.slice(0, -1) : prev);
        
        runGemini(lastUserMessage.text);
    }, [messages, isLoading, playSound, runGemini]);

    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        playSound(audioService.playSelection);
    };
    
    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        playSound(audioService.playSelection);
        setIsLoading(true);
        setError(null);
        
        try {
            const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = error => reject(error);
            });
            const base64 = await toBase64(file);
            setFileData({ file, base64 });
            setMessages([]); 
        } catch(e) {
            setError("Could not read file.");
            playSound(audioService.playError);
        } finally {
            setIsLoading(false);
        }
    }, [playSound]);

    // --- Voice Assistant Logic ---
    const stopLiveSession = useCallback(() => {
        setLiveConnectionState('idle');
        
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (inputAudioContextRef.current?.state !== 'closed') inputAudioContextRef.current?.close();
        if (outputAudioContextRef.current?.state !== 'closed') {
             for (const source of audioSources.current.values()) source.stop();
             audioSources.current.clear();
             outputAudioContextRef.current?.close();
        }
        nextStartTime.current = 0;

    }, []);

    const startLiveSession = useCallback(async () => {
        if (!ai || !isOnline) {
            setError("Voice Assistant requires an internet connection and API key.");
            return;
        }
        if (liveConnectionState !== 'idle' && liveConnectionState !== 'error') return;

        playSound(audioService.playClick);
        setLiveConnectionState('connecting');
        setError(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const outputNode = outputAudioContextRef.current.createGain();
            outputNode.connect(outputAudioContextRef.current.destination);

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setLiveConnectionState('connected');
                        const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                        const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            currentMicInputRef.current += text;
                            setCurrentMicInput(currentMicInputRef.current);
                        }
                        if (message.serverContent?.outputTranscription) {
                            const text = message.serverContent.outputTranscription.text;
                            currentModelOutputRef.current += text;
                            setCurrentModelOutput(currentModelOutputRef.current);
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio) {
                            const outputCtx = outputAudioContextRef.current!;
                            nextStartTime.current = Math.max(nextStartTime.current, outputCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                            const sourceNode = outputCtx.createBufferSource();
                            sourceNode.buffer = audioBuffer;
                            sourceNode.connect(outputNode);
                            sourceNode.addEventListener('ended', () => audioSources.current.delete(sourceNode));
                            sourceNode.start(nextStartTime.current);
                            nextStartTime.current += audioBuffer.duration;
                            audioSources.current.add(sourceNode);
                        }

                        if (message.serverContent?.turnComplete) {
                            const fullInput = currentMicInputRef.current;
                            const fullOutput = currentModelOutputRef.current;
                            currentMicInputRef.current = '';
                            currentModelOutputRef.current = '';
                            setCurrentMicInput('');
                            setCurrentModelOutput('');
                            if (fullInput.trim() || fullOutput.trim()) {
                                const newMessages: Message[] = [];
                                if (fullInput.trim()) newMessages.push({ id: `msg-${Date.now()}-user`, role: 'user', text: fullInput });
                                if (fullOutput.trim()) newMessages.push({ id: `msg-${Date.now()}-model`, role: 'model', text: fullOutput });
                                setMessages(prev => [...prev, ...newMessages]);
                            }
                        }
                    },
                    onerror: (e: ErrorEvent) => { setError(geminiService.parseApiError(e)); stopLiveSession(); },
                    onclose: () => stopLiveSession(),
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: selectedModel.systemInstruction,
                }
            });
        } catch (err) {
            setError(geminiService.parseApiError(err));
            stopLiveSession();
        }
    }, [liveConnectionState, playSound, isOnline, stopLiveSession, selectedModel.systemInstruction]);

    useEffect(() => {
        return stopLiveSession;
    }, [stopLiveSession]);
    
    const renderMessageContent = (text: string) => {
        const parts = text.split(/(```[\s\S]*?```)/g).filter(Boolean);
    
        return (
            <div className="prose prose-sm prose-invert max-w-none break-words">
                {parts.map((part, i) => {
                    if (part.startsWith('```') && part.endsWith('```')) {
                        const code = part.slice(3, -3);
                        const langMatch = code.match(/^(\w+)\n/);
                        const codeContent = langMatch ? code.substring(langMatch[0].length) : code;
                        
                        return (
                            <div key={i} className="relative group my-2">
                                <pre className="bg-black p-3 border border-brand-light/50 overflow-x-auto text-xs font-mono">
                                    <code>{codeContent.trim()}</code>
                                </pre>
                                <button
                                    onClick={() => handleCopyToClipboard(codeContent.trim())}
                                    className="absolute top-2 right-2 p-1 bg-gray-700 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label={t('aiChat.copyCode')}
                                >
                                    <CopyIcon className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    }
                    return <div key={i} dangerouslySetInnerHTML={{ __html: part.replace(/\n/g, '<br />') }} />;
                })}
            </div>
        );
    };

    if (isModelInfoOpen) {
        return <ModelInfoPage onClose={() => setIsModelInfoOpen(false)} />;
    }

    return (
        <div className="w-full h-full flex flex-col items-center px-4 font-sans">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" aria-hidden="true" />
             <ModelSelectionModal 
                isOpen={isModelModalOpen}
                onClose={() => setIsModelModalOpen(false)}
                onSelect={(model) => {
                    playSound(audioService.playClick);
                    setSelectedModel(model);
                    preferenceService.setPreference('defaultChatModelName', model.name);
                    setIsModelModalOpen(false);
                    if (model.id === 'local-robot') {
                        setWebSearchEnabled(false);
                    }
                }}
                onLearnMore={() => {
                    setIsModelModalOpen(false);
                    setIsModelInfoOpen(true);
                }}
                models={ALL_AI_MODELS}
            />

            <h1 className="text-3xl sm:text-4xl text-brand-yellow text-center drop-shadow-[3px_3px_0_#000] mb-4">{t('aiChat.title')}</h1>
            <div className="w-full max-w-3xl flex-grow flex flex-col bg-black/40 border-4 border-brand-light shadow-pixel">
                <header className="flex-shrink-0 p-2 border-b-4 border-brand-light flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsModelModalOpen(true)}
                            onMouseEnter={() => playSound(audioService.playHover)}
                            disabled={!!fileData || liveConnectionState !== 'idle'}
                            className="flex items-center gap-2 p-2 bg-surface-primary border-2 border-border-primary text-text-primary hover:bg-brand-cyan/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={fileData ? "Model selection is disabled when a file is attached" : ""}
                        >
                            <SparklesIcon className="w-4 h-4 text-brand-cyan" />
                            <span className="text-xs font-press-start truncate max-w-32 sm:max-w-xs">{fileData ? 'File Q&A' : selectedModel.name}</span>
                        </button>
                    </div>
                     <div className="flex items-center gap-4">
                        <label className={`flex items-center gap-2 cursor-pointer transition-opacity ${!canUseWebSearch ? 'opacity-50' : ''}`}>
                            <input
                                type="checkbox"
                                checked={webSearchEnabled && canUseWebSearch}
                                onChange={(e) => {
                                    if(canUseWebSearch) {
                                        playSound(audioService.playToggle);
                                        setWebSearchEnabled(e.target.checked);
                                    }
                                }}
                                className="w-4 h-4 accent-brand-magenta"
                                disabled={isLoading || !canUseWebSearch}
                                title={!canUseWebSearch ? "Web Search is not available for this model or when a file is attached" : ""}
                            />
                            <span className="text-xs font-press-start text-brand-cyan">{t('aiChat.webSearch')}</span>
                        </label>
                        <button onClick={handleNewChat} onMouseEnter={() => playSound(audioService.playHover)} disabled={isLoading} className="flex items-center gap-2 p-2 bg-brand-magenta/80 text-white border-2 border-black hover:bg-brand-magenta" aria-label={t('aiChat.newChat')}>
                            <TrashIcon className="w-4 h-4"/>
                        </button>
                    </div>
                </header>
                
                <main className="flex-grow p-4 overflow-y-auto">
                    {messages.length === 0 && !isLoading && !fileData && (
                        <div className="text-center text-brand-light/70 h-full flex flex-col justify-center items-center">
                            <SparklesIcon className="w-16 h-16 text-brand-cyan mb-4" />
                            <p className="font-press-start">{t('aiChat.startConversation')}</p>
                            <p className="text-xs mt-2">{selectedModel.description}</p>
                        </div>
                    )}

                    <div className="space-y-6">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'model' && <div className="flex-shrink-0 w-8 h-8 text-brand-cyan mt-1"><SparklesIcon/></div>}
                                <div className={`max-w-xl text-sm ${msg.role === 'user' ? 'bg-brand-cyan/80 text-black p-3 rounded-lg' : ''}`}>
                                    <div className={`${msg.role === 'model' ? 'bg-surface-primary text-text-primary p-3 rounded-lg' : ''}`}>
                                        {renderMessageContent(msg.text)}
                                    </div>
                                    {msg.sources && Array.isArray(msg.sources) && msg.sources.length > 0 && (
                                        <div className="mt-4 pt-2 border-t border-brand-light/30">
                                            <h4 className="text-xs font-bold mb-1">Sources:</h4>
                                            <ul className="text-xs space-y-1">
                                                {msg.sources.map((source, i) => (
                                                    <li key={i}>
                                                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-brand-yellow underline hover:text-brand-lime break-all">
                                                            {i+1}. {source.title}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {msg.role === 'model' && (
                                        <div className="flex items-center gap-2 mt-3">
                                            <button onClick={() => playSound(audioService.playClick)} className="p-1 text-text-secondary hover:text-brand-lime"><ThumbsUpIcon className="w-4 h-4"/></button>
                                            <button onClick={() => playSound(audioService.playClick)} className="p-1 text-text-secondary hover:text-brand-magenta"><ThumbsDownIcon className="w-4 h-4"/></button>
                                            <button onClick={() => handleCopyToClipboard(msg.text)} className="p-1 text-text-secondary hover:text-brand-yellow"><CopyIcon className="w-4 h-4"/></button>
                                            <button onClick={handleRegenerate} disabled={isLoading || !!fileData} className="p-1 text-text-secondary hover:text-brand-cyan disabled:opacity-50"><RegenerateIcon className="w-4 h-4"/></button>
                                            <button
                                                onClick={() => handleSpeakTextWithGemini(msg)}
                                                disabled={speakingMessageId !== null || liveConnectionState !== 'idle'}
                                                className="p-1 text-text-secondary hover:text-brand-yellow disabled:opacity-50 disabled:cursor-wait"
                                            >
                                                {speakingMessageId === msg.id ? (
                                                    <SpeakerOnIcon className="w-4 h-4 text-brand-lime animate-pulse" />
                                                ) : (
                                                    <SpeakerOnIcon className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {isLoading && (
                        <div className="flex gap-4 mt-6">
                            <div className="flex-shrink-0 w-8 h-8 text-brand-cyan mt-1"><SparklesIcon/></div>
                            <div className="max-w-xl p-3 text-sm bg-surface-primary text-text-primary rounded-lg">
                                <LoadingSpinner text="AI is thinking..." />
                            </div>
                        </div>
                    )}

                    {error && (
                         <div role="alert" className="w-full p-3 mt-4 text-center text-sm text-brand-light bg-brand-magenta/20 border-2 border-brand-magenta">
                            {error}
                        </div>
                     )}
                    <div ref={messagesEndRef} />
                </main>

                <footer className="flex-shrink-0 p-2 border-t-4 border-brand-light">
                    {liveConnectionState === 'connected' && (
                        <div className="p-2 mb-2 text-left text-sm border-2 border-brand-light/50 bg-black/30 animate-fadeIn">
                            {currentMicInput && <p className="text-brand-cyan truncate"><strong className="font-press-start text-xs">YOU:</strong> {currentMicInput}</p>}
                            {currentModelOutput && <p className="text-brand-light/80 truncate"><strong className="font-press-start text-xs">AI:</strong> {currentModelOutput}</p>}
                            {!currentMicInput && !currentModelOutput && <p className="text-brand-light/70 animate-pulse text-center font-press-start text-xs">LISTENING...</p>}
                        </div>
                    )}
                    {fileData && (
                        <div className="flex items-center justify-between p-2 mb-2 bg-surface-primary border-2 border-border-secondary">
                            <span className="text-xs text-text-secondary truncate">Attached: {fileData.file.name}</span>
                            <button onClick={() => setFileData(null)} className="p-1 text-text-secondary hover:text-brand-magenta"><XIcon className="w-4 h-4" /></button>
                        </div>
                    )}
                    <div className="flex items-end gap-2">
                        <button 
                            className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-surface-primary border-2 border-black hover:bg-brand-cyan/20" 
                            aria-label="Attach file"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <UploadIcon className="w-5 h-5" />
                        </button>
                        <textarea
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder={isOnline || selectedModel.id === 'local-robot' ? (fileData ? 'Ask about the file...' : t('aiChat.inputPlaceholder')) : t('aiChat.inputOffline')}
                            className="flex-grow p-2 bg-brand-light text-black rounded-none border-2 border-black focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-none leading-tight"
                            rows={1}
                            style={{ minHeight: '40px', maxHeight: '120px' }}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = `${target.scrollHeight}px`;
                            }}
                            disabled={isLoading || (!isOnline && selectedModel.id !== 'local-robot') || liveConnectionState === 'connected'}
                        />
                        <button onClick={handleSendMessage} disabled={!userInput.trim() || isLoading || (!isOnline && selectedModel.id !== 'local-robot')} className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-brand-magenta text-white border-2 border-black hover:bg-brand-yellow hover:text-black disabled:bg-gray-500 disabled:cursor-not-allowed" aria-label={t('aiChat.sendMessage')}>
                            <SendIcon className="w-5 h-5"/>
                        </button>
                         <button 
                            onClick={liveConnectionState === 'connected' ? stopLiveSession : startLiveSession}
                            disabled={!isOnline || !!fileData || isLoading || selectedModel.id === 'local-robot'}
                            className={`w-10 h-10 flex-shrink-0 flex items-center justify-center border-2 border-black transition-colors ${
                                liveConnectionState === 'connected' ? 'bg-red-500 text-white' : 'bg-brand-cyan text-black hover:bg-brand-yellow'
                            } disabled:bg-gray-500 disabled:cursor-not-allowed`}
                            aria-label={liveConnectionState === 'connected' ? "Stop voice session" : "Start voice session"}
                            title={fileData ? "Voice input disabled with file" : ""}
                        >
                            {/* FIX: Replaced `connectionState` with `liveConnectionState` to fix variable not found error. */}
                            {liveConnectionState === 'connecting' ? <div className="w-5 h-5"><LoadingSpinner text=""/></div> : liveConnectionState === 'connected' ? <StopIcon className="w-5 h-5"/> : <MicrophoneIcon className="w-5 h-5"/>}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};
