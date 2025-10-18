import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
// FIX: Changed import type to regular import.
import { Message } from '../services/preferenceService';

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

    const categories = useMemo(() => {
        // FIX: Add guard to ensure 'models' is an array before calling .map()
        if (!Array.isArray(models)) {
            return ['All'];
        }
        // FIX: Add type assertion to resolve potential type inference issue.
        const uniqueCategories = new Set((models as AiModel[]).map(m => m.category));
        return ['All', ...Array.from(uniqueCategories)];
    }, [models]);
    const [activeCategory, setActiveCategory] = useState<'All' | AiModel['category']>('All');

    const filteredModels = useMemo(() => {
        // FIX: Add guard to ensure 'models' is an array before calling .filter()
        if (!Array.isArray(models)) {
            return [];
        }
        // FIX: Add type assertion to resolve potential type inference issue.
        return (models as AiModel[])
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
    const [saveChatHistory, setSaveChatHistory] = useState(() => preferenceService.getPreference('saveChatHistory', true));
    
    // --- Voice Assistant State ---
    const [liveConnectionState, setLiveConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
    const [currentMicInput, setCurrentMicInput] = useState('');
    const [currentModelOutput, setCurrentModelOutput] = useState('');

    const currentMicInputRef = useRef('');
    const currentModelOutputRef = useRef('');
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioSources = useRef(new Set<AudioBufferSourceNode>());
    const nextStartTime = useRef(0);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading, currentMicInput, currentModelOutput]);

    useEffect(() => {
        if (saveChatHistory) {
            const savedHistory = preferenceService.getPreference('chatHistory', {})[selectedModel.id];
            // FIX: Ensure that savedHistory is an array before setting it to state.
            // This prevents runtime errors if localStorage data is corrupted or in an old format.
            if (savedHistory && Array.isArray(savedHistory)) {
                setMessages(savedHistory);
            } else {
                setMessages([]);
            }
        } else {
            setMessages([]);
        }
    }, [selectedModel, saveChatHistory]);

    useEffect(() => {
        if (saveChatHistory && messages.length > 0) {
            const allHistory = preferenceService.getPreference('chatHistory', {});
            allHistory[selectedModel.id] = messages;
            preferenceService.setPreference('chatHistory', allHistory);
        }
    }, [messages, selectedModel, saveChatHistory]);

    const handleNewChat = useCallback(() => {
        playSound(audioService.playTrash);
        geminiService.resetChatSession();
        setMessages([]);
        setUserInput('');
        setError(null);
        setFileData(null);
        if (saveChatHistory) {
            const allHistory = preferenceService.getPreference('chatHistory', {});
            delete allHistory[selectedModel.id];
            preferenceService.setPreference('chatHistory', allHistory);
        }
    }, [playSound, saveChatHistory, selectedModel.id]);
    
    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!event.altKey) return;
            
            switch(event.key.toLowerCase()) {
                case 'm':
                    event.preventDefault();
                    setIsModelModalOpen(true);
                    break;
                case 'n':
                    event.preventDefault();
                    handleNewChat();
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleNewChat]);


    const handleSendMessage = useCallback(async (messageText?: string, messageHistory?: Message[]) => {
        const textToSend = (messageText || userInput).trim();
        const history = messageHistory || messages;

        if ((!textToSend && !fileData) || isLoading || !isOnline) return;
    
        playSound(audioService.playClick);
        setError(null);
    
        if (!messageText) {
            const userMessage: Message = { id: `msg_${Date.now()}`, role: 'user', text: textToSend };
            setMessages(prev => [...prev, userMessage]);
            setUserInput('');
        }
    
        setIsLoading(true);
    
        if (webSearchEnabled || fileData) {
            // Non-streaming for web search or file chat
            try {
                if (fileData) {
                    const responseText = await geminiService.chatWithFile(
                        { base64: fileData.base64, mimeType: fileData.file.type },
                        history.filter(m => m.role !== 'user' || m.text).map(m => ({ role: m.role, text: m.text })),
                        textToSend
                    );
                    const modelMessage: Message = { id: `msg_${Date.now()}_model`, role: 'model', text: responseText };
                    setMessages(prev => [...prev, modelMessage]);
                    setFileData(null);
                } else {
                    const response = await geminiService.sendMessageToChat(textToSend, selectedModel, webSearchEnabled);
                    const modelMessage: Message = { id: `msg_${Date.now()}_model`, role: 'model', text: response.text, sources: response.sources };
                    setMessages(prev => [...prev, modelMessage]);
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
                setError(errorMessage);
                setMessages(prev => prev.slice(0, -1)); // Remove user's message on error
            } finally {
                setIsLoading(false);
            }
        } else {
            // Streaming for regular chat
            try {
                const modelMessageId = `msg_${Date.now()}_model`;
                setMessages(prev => [...prev, { id: modelMessageId, role: 'model', text: '' }]);
    
                const stream = await geminiService.sendMessageToChatStream(textToSend, selectedModel);
                
                let accumulatedText = "";
                for await (const chunk of stream) {
                    accumulatedText += chunk.text;
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.id === modelMessageId ? { ...msg, text: accumulatedText } : msg
                        )
                    );
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
                setError(errorMessage);
                // Remove the user message and the model placeholder
                setMessages(prev => prev.slice(0, -2));
            } finally {
                setIsLoading(false);
            }
        }
    }, [userInput, fileData, isLoading, isOnline, playSound, selectedModel, webSearchEnabled, messages]);

    const handleRegenerate = useCallback(async () => {
        const lastUserMessage = messages.filter(m => m.role === 'user').pop();
        if (!lastUserMessage || isLoading) return;
        
        // FIX: Replace findLastIndex with a manual loop for broader browser compatibility.
        let lastModelMessageIndex = -1;
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'model') {
                lastModelMessageIndex = i;
                break;
            }
        }
        
        if (lastModelMessageIndex === -1) return;
        
        const newMessages = messages.slice(0, lastModelMessageIndex);
        setMessages(newMessages);
        
        handleSendMessage(lastUserMessage.text, newMessages);
    }, [messages, isLoading, handleSendMessage]);

    const handleSelectModel = (model: AiModel) => {
        // Do not clear chat history. The useEffect will load the new model's history.
        geminiService.resetChatSession();
        setSelectedModel(model);
        setIsModelModalOpen(false);
        playSound(audioService.playSuccess);
    };

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        playSound(audioService.playSelection);
        handleNewChat();
        
        try {
            const toBase64 = (f: File): Promise<string> => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(f);
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = error => reject(error);
            });
            const base64 = await toBase64(file);
            setFileData({ file, base64 });
        } catch (err) {
            setError("Failed to load file.");
        }
    }, [handleNewChat, playSound]);

    const stopVoiceSession = useCallback(() => {
        setLiveConnectionState('idle');
        
        sessionPromiseRef.current?.then(session => session.close());
        sessionPromiseRef.current = null;
        
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;

        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        
        if (inputAudioContextRef.current?.state !== 'closed') inputAudioContextRef.current?.close();
        if (outputAudioContextRef.current?.state !== 'closed') {
             for (const source of audioSources.current.values()) source.stop();
             audioSources.current.clear();
             outputAudioContextRef.current?.close();
        }
        nextStartTime.current = 0;
    }, []);

    const startVoiceSession = useCallback(async () => {
        if (!ai || !isOnline || (liveConnectionState !== 'idle' && liveConnectionState !== 'error')) return;

        playSound(audioService.playClick);
        handleNewChat();
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

                        scriptProcessor.onaudioprocess = (event) => {
                            const inputData = event.inputBuffer.getChannelData(0);
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
                            currentMicInputRef.current += message.serverContent.inputTranscription.text;
                            setCurrentMicInput(currentMicInputRef.current);
                        }
                        if (message.serverContent?.outputTranscription) {
                            currentModelOutputRef.current += message.serverContent.outputTranscription.text;
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
                            if (currentMicInputRef.current.trim()) {
                                setMessages(prev => [...prev, { id: `msg_${Date.now()}_user`, role: 'user', text: currentMicInputRef.current.trim() }]);
                            }
                            if (currentModelOutputRef.current.trim()) {
                                 setMessages(prev => [...prev, { id: `msg_${Date.now()}_model`, role: 'model', text: currentModelOutputRef.current.trim() }]);
                            }
                            currentMicInputRef.current = '';
                            currentModelOutputRef.current = '';
                            setCurrentMicInput('');
                            setCurrentModelOutput('');
                        }
                    },
                    onerror: (e: ErrorEvent) => { setError("A connection error occurred."); stopVoiceSession(); },
                    onclose: stopVoiceSession,
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: selectedModel.systemInstruction,
                }
            });
        } catch (err) {
            setError("Could not access microphone. Please grant permission.");
            stopVoiceSession();
        }
    }, [liveConnectionState, isOnline, playSound, handleNewChat, stopVoiceSession, selectedModel]);
    
    useEffect(() => {
        return stopVoiceSession;
    }, [stopVoiceSession]);

    return (
        <div className="w-full h-full flex flex-col items-center bg-black/40">
            <ModelSelectionModal
                isOpen={isModelModalOpen}
                onClose={() => setIsModelModalOpen(false)}
                onSelect={handleSelectModel}
                onLearnMore={() => {
                    setIsModelModalOpen(false);
                    setIsModelInfoOpen(true);
                }}
                models={ALL_AI_MODELS}
            />
            {isModelInfoOpen && <ModelInfoPage onClose={() => setIsModelInfoOpen(false)} />}
            
            {/* Main Chat Area */}
            <main className="w-full max-w-4xl flex-grow overflow-y-auto px-4 pt-4 pb-2">
                {messages.length === 0 && !isLoading && !fileData && liveConnectionState === 'idle' && (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <button
                            onClick={() => setIsModelModalOpen(true)}
                            onMouseEnter={() => playSound(audioService.playHover)}
                            className="p-4 bg-surface-primary border-4 border-border-primary shadow-pixel hover:bg-brand-cyan/20"
                        >
                            <SparklesIcon className="w-16 h-16 text-brand-cyan mb-4 mx-auto" />
                            <h2 className="font-press-start text-lg text-brand-yellow">{selectedModel.name}</h2>
                            <p className="font-sans text-xs text-text-secondary mt-1">{t('aiChat.selectAssistant')}</p>
                        </button>
                    </div>
                )}
                <div className="space-y-6">
                    {messages.map((msg, index) => (
                        <div key={msg.id || index} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && <div className="flex-shrink-0 w-8 h-8 text-brand-cyan mt-1"><SparklesIcon/></div>}
                            <div className={`max-w-xl p-3 text-sm rounded-lg ${msg.role === 'user' ? 'bg-brand-cyan/80 text-black' : 'bg-surface-primary text-text-primary'}`}>
                               <div className="whitespace-pre-wrap font-sans leading-relaxed">{msg.text}</div>
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-4 border-t-2 border-brand-light/20 pt-2">
                                        <h4 className="font-press-start text-xs text-brand-cyan mb-1">Sources:</h4>
                                        <ul className="text-xs space-y-1 list-disc list-inside">
                                            {msg.sources.map((source, i) => (
                                                <li key={i}><a href={source.uri} target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-yellow">{source.title || source.uri}</a></li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {msg.role === 'model' && (
                                    <div className="flex items-center gap-2 mt-2 -ml-1">
                                        <button className="p-1 hover:text-brand-yellow"><CopyIcon className="w-4 h-4" /></button>
                                        <button className="p-1 hover:text-brand-yellow"><ThumbsUpIcon className="w-4 h-4" /></button>
                                        <button className="p-1 hover:text-brand-yellow"><ThumbsDownIcon className="w-4 h-4" /></button>
                                        {index === messages.length - 1 && <button onClick={handleRegenerate} className="p-1 hover:text-brand-yellow"><RegenerateIcon className="w-4 h-4" /></button>}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {currentMicInput && <div className="text-right text-brand-cyan/80 italic animate-pulse">...{currentMicInput}</div>}
                    {currentModelOutput && <div className="text-left text-brand-light/80 italic animate-pulse">...{currentModelOutput}</div>}

                </div>
                {isLoading && messages[messages.length -1]?.role !== 'model' && (
                    <div className="flex gap-4 mt-6">
                        <div className="flex-shrink-0 w-8 h-8 text-brand-cyan mt-1"><SparklesIcon/></div>
                        <div className="p-3"><LoadingSpinner text="" /></div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>

            {/* Input Footer */}
            <footer className="w-full max-w-4xl flex-shrink-0 p-4 space-y-3 bg-background border-t-2 border-border-secondary">
                {error && <div role="alert" className="text-center text-xs text-brand-magenta">{error}</div>}
                {fileData && (
                     <div className="flex items-center gap-2 p-2 bg-black/50 border border-brand-light/50">
                        <SparklesIcon className="w-5 h-5 text-brand-cyan" />
                        <span className="flex-grow text-xs truncate">{fileData.file.name}</span>
                        <button onClick={() => setFileData(null)}><XIcon className="w-5 h-5 hover:text-brand-magenta" /></button>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <button onClick={handleNewChat} onMouseEnter={() => playSound(audioService.playHover)} className="p-3 border-2 border-border-primary text-text-primary hover:bg-brand-magenta/80" title={`${t('aiChat.newChat')} (Alt+N)`}>
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder={isLoading ? "AI is thinking..." : (liveConnectionState === 'connected' ? 'Listening...' : t('aiChat.inputPlaceholder'))}
                            className="w-full p-3 pr-24 bg-surface-primary border-2 border-border-primary text-text-primary focus:outline-none focus:border-brand-yellow font-sans disabled:bg-gray-800"
                            disabled={isLoading || !isOnline || liveConnectionState === 'connected'}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <button onClick={() => fileInputRef.current?.click()} onMouseEnter={() => playSound(audioService.playHover)} className="p-2 hover:text-brand-yellow disabled:opacity-50" disabled={isLoading || liveConnectionState !== 'idle'}>
                                <UploadIcon className="w-5 h-5"/>
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                             <button onClick={() => handleSendMessage()} disabled={(!userInput.trim() && !fileData) || isLoading || !isOnline || liveConnectionState !== 'idle'} className="p-2 hover:text-brand-yellow disabled:opacity-50">
                                <SendIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>
                    {liveConnectionState === 'idle' || liveConnectionState === 'error' ? (
                        <button onClick={startVoiceSession} disabled={!isOnline || isLoading} className="p-3 border-2 border-border-primary text-text-primary hover:bg-brand-cyan hover:text-black" title={`${t('aiChat.voice')} Chat`}>
                            <MicrophoneIcon className="w-5 h-5"/>
                        </button>
                    ) : (
                        <button onClick={stopVoiceSession} className="p-3 border-2 border-brand-magenta text-brand-magenta bg-brand-magenta/20 animate-pulse" title="Stop Voice Chat">
                            <StopIcon className="w-5 h-5"/>
                        </button>
                    )}
                </div>
                 <div className="flex items-center justify-between text-xs font-press-start">
                    {canUseWebSearch ? (
                        <label className="flex items-center gap-2 cursor-pointer text-brand-light/70 hover:text-brand-light">
                            <input type="checkbox" checked={webSearchEnabled} onChange={(e) => setWebSearchEnabled(e.target.checked)} className="w-4 h-4 accent-brand-magenta" />
                            {t('aiChat.webSearch')}
                        </label>
                    ) : <div/>}
                    <button onClick={() => setIsModelModalOpen(true)} title="Select AI Model (Alt+M)" className="text-brand-light/70 hover:text-brand-yellow truncate max-w-[50%]">{selectedModel.name}</button>
                </div>
            </footer>
        </div>
    );
};