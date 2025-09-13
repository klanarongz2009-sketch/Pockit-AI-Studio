import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
    
    const canUseWebSearch = useMemo(() => selectedModel.id !== 'local-robot', [selectedModel]);
    const [webSearchEnabled, setWebSearchEnabled] = useState(() => preferenceService.getPreference('defaultWebSearch', false) && canUseWebSearch);
    
    const [messages, setMessages] = useState<Message[]>([]);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const SAVE_HISTORY = preferenceService.getPreference('saveChatHistory', true);
    const getHistoryKey = (modelName: string) => `chat-history-${modelName.replace(/\s/g, '_')}`;

    // Load history on model change
    useEffect(() => {
        if (SAVE_HISTORY) {
            try {
                const saved = localStorage.getItem(getHistoryKey(selectedModel.name));
                setMessages(saved ? JSON.parse(saved) : []);
            } catch (e) {
                console.error("Failed to load chat history:", e);
                setMessages([]);
            }
        } else {
            setMessages([]);
        }
        geminiService.resetChatSession();
        setError(null);
    }, [selectedModel, SAVE_HISTORY]);

    // Save history on message change
    useEffect(() => {
        if (SAVE_HISTORY && messages.length > 0) {
            try {
                localStorage.setItem(getHistoryKey(selectedModel.name), JSON.stringify(messages));
            } catch (e) {
                console.error("Failed to save chat history:", e);
            }
        }
    }, [messages, selectedModel, SAVE_HISTORY]);


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);
    
    const handleNewChat = useCallback(() => {
        playSound(audioService.playTrash);
        geminiService.resetChatSession();
        setMessages([]);
        setError(null);
        setUserInput('');
        if (SAVE_HISTORY) {
            try {
                localStorage.removeItem(getHistoryKey(selectedModel.name));
            } catch (e) {
                console.error("Failed to clear chat history:", e);
            }
        }
    }, [playSound, SAVE_HISTORY, selectedModel]);

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
        
        await runGemini(trimmedInput);

    }, [userInput, isLoading, playSound, runGemini]);

    const handleRegenerate = useCallback(() => {
        const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user');
        if (!lastUserMessage || isLoading) return;

        playSound(audioService.playClick);
        // Remove the last model response if it exists
        setMessages(prev => prev.slice(-1)[0].role === 'model' ? prev.slice(0, -1) : prev);
        
        runGemini(lastUserMessage.text);
    }, [messages, isLoading, playSound, runGemini]);

    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        playSound(audioService.playSelection);
    };

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
                            className="flex items-center gap-2 p-2 bg-surface-primary border-2 border-border-primary text-text-primary hover:bg-brand-cyan/20 transition-colors"
                        >
                            <SparklesIcon className="w-4 h-4 text-brand-cyan" />
                            <span className="text-xs font-press-start truncate max-w-32 sm:max-w-xs">{selectedModel.name}</span>
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
                                title={!canUseWebSearch ? "Web Search is not available for this model" : ""}
                            />
                            <span className="text-xs font-press-start text-brand-cyan">{t('aiChat.webSearch')}</span>
                        </label>
                        <button onClick={handleNewChat} onMouseEnter={() => playSound(audioService.playHover)} disabled={isLoading} className="flex items-center gap-2 p-2 bg-brand-magenta/80 text-white border-2 border-black hover:bg-brand-magenta" aria-label={t('aiChat.newChat')}>
                            <TrashIcon className="w-4 h-4"/>
                        </button>
                    </div>
                </header>
                
                <main className="flex-grow p-4 overflow-y-auto">
                    {messages.length === 0 && !isLoading && (
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
                                    {msg.sources && msg.sources.length > 0 && (
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
                                            <button onClick={handleRegenerate} disabled={isLoading} className="p-1 text-text-secondary hover:text-brand-cyan disabled:opacity-50"><RegenerateIcon className="w-4 h-4"/></button>
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
                    <div className="flex items-end gap-2">
                        <div className="relative group">
                            <button className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-surface-primary border-2 border-black hover:bg-brand-cyan/20" aria-label="Attach file">
                                <span className="text-2xl">+</span>
                            </button>
                            <div className="absolute bottom-full mb-2 w-48 bg-surface-secondary border-2 border-border-primary shadow-lg p-2 rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none">
                                <ul className="text-sm text-text-primary">
                                    <li className="p-1 hover:bg-brand-cyan/20 cursor-pointer">Upload Audio</li>
                                    <li className="p-1 hover:bg-brand-cyan/20 cursor-pointer">Upload Video</li>
                                    <li className="p-1 hover:bg-brand-cyan/20 cursor-pointer">Upload Text</li>
                                    <li className="p-1 hover:bg-brand-cyan/20 cursor-pointer">Upload ZIP</li>
                                </ul>
                                <div className="absolute bottom-[-5px] left-4 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-border-primary"></div>
                            </div>
                        </div>
                        <textarea
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder={isOnline || selectedModel.id === 'local-robot' ? t('aiChat.inputPlaceholder') : t('aiChat.inputOffline')}
                            className="flex-grow p-2 bg-brand-light text-black rounded-none border-2 border-black focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-none leading-tight"
                            rows={1}
                            style={{ minHeight: '40px', maxHeight: '120px' }}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = `${target.scrollHeight}px`;
                            }}
                            disabled={isLoading || (!isOnline && selectedModel.id !== 'local-robot')}
                        />
                        <button onClick={handleSendMessage} disabled={!userInput.trim() || isLoading || (!isOnline && selectedModel.id !== 'local-robot')} className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-brand-magenta text-white border-2 border-black hover:bg-brand-yellow hover:text-black disabled:bg-gray-500 disabled:cursor-not-allowed" aria-label={t('aiChat.sendMessage')}>
                            <SendIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};