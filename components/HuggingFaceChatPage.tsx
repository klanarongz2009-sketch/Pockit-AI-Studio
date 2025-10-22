import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as huggingFaceService from '../services/huggingFaceService';
import { ALL_HF_MODELS, HfModel } from '../services/hfModels';
import * as audioService from '../services/audioService';
import { PageWrapper, PageHeader } from './PageComponents';
import { LoadingSpinner } from './LoadingSpinner';
import { SendIcon } from './icons/SendIcon';
import { HuggingFaceIcon } from './icons/HuggingFaceIcon';
import { TrashIcon } from './icons/TrashIcon';
import { Modal } from './Modal';
import { SearchIcon } from './icons/SearchIcon';

interface HuggingFaceChatPageProps {
  isOnline: boolean;
  playSound: (player: () => void) => void;
  onClose: () => void;
}

interface Message {
    role: 'user' | 'model';
    text: string;
}

const HfModelSelectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelect: (model: HfModel) => void;
  models: HfModel[];
}> = ({ isOpen, onClose, onSelect, models }) => {
    const [searchQuery, setSearchQuery] = useState('');

    // FIX: Explicitly type 'categories' as string[] to resolve a type inference issue where it was being inferred as 'unknown'.
    const categories: string[] = useMemo(() => {
        // FIX: Add guard to ensure 'models' is an array before calling .map()
        if (!Array.isArray(models)) {
            return ['All'];
        }
        const uniqueCategories = new Set(models.map(m => m.category));
        return ['All', ...Array.from(uniqueCategories)];
    }, [models]);
    const [activeCategory, setActiveCategory] = useState<'All' | HfModel['category']>('All');

    const filteredModels = useMemo(() => {
        // FIX: Add guard to ensure `models` is an array before calling .filter() to prevent runtime errors.
        if (!Array.isArray(models)) {
            return [];
        }
        return models
            .filter(model => activeCategory === 'All' || model.category === activeCategory)
            .filter(model => 
                model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                model.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
    }, [models, activeCategory, searchQuery]);
    
    const groupedModels = useMemo(() => {
        return filteredModels.reduce((acc, model) => {
            const key = model.category;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(model);
            return acc;
        }, {} as Record<string, HfModel[]>);
    }, [filteredModels]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select Hugging Face Assistant">
            <div className="flex flex-col h-[calc(100vh-100px)] font-sans">
                <div className="relative mb-4">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
                        <SearchIcon className="w-5 h-5" />
                    </span>
                    <input
                        type="search"
                        placeholder="Search assistants..."
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
                    {Object.entries(groupedModels).map(([category, models]) => (
                        <div key={category} className="mb-4">
                            <h3 className="font-press-start text-sm text-brand-cyan mb-2">{category}</h3>
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


export const HuggingFaceChatPage: React.FC<HuggingFaceChatPageProps> = ({ isOnline, playSound, onClose }) => {
    const [userInput, setUserInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<HfModel>(ALL_HF_MODELS[0]);
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);
    
    const handleNewChat = useCallback(() => {
        playSound(audioService.playTrash);
        setMessages([]);
        setUserInput('');
        setError(null);
    }, [playSound]);

    const handleSendMessage = useCallback(async () => {
        const textToSend = userInput.trim();
        if (!textToSend || isLoading || !isOnline) return;
    
        playSound(audioService.playClick);
        setError(null);
    
        const newMessages: Message[] = [...messages, { role: 'user', text: textToSend }];
        setMessages(newMessages);
        setUserInput('');
        setIsLoading(true);
    
        try {
            const past_user_inputs = newMessages.filter(m => m.role === 'user').map(m => m.text);
            const generated_responses = newMessages.filter(m => m.role === 'model').map(m => m.text);

            // Remove the latest user input as it's the current one
            past_user_inputs.pop();

            const response = await huggingFaceService.chat(selectedModel.id, textToSend, past_user_inputs, generated_responses);
            
            const modelMessage: Message = { role: 'model', text: response.generated_text };
            setMessages(prev => [...prev, modelMessage]);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
            setMessages(prev => prev.slice(0, -1)); 
        } finally {
            setIsLoading(false);
        }
    }, [userInput, isLoading, isOnline, playSound, selectedModel, messages]);
    
    const handleSelectModel = (model: HfModel) => {
        handleNewChat();
        setSelectedModel(model);
        setIsModelModalOpen(false);
        playSound(audioService.playSuccess);
    };

    return (
        <PageWrapper>
            <PageHeader title="Hugging Face Chat" onBack={onClose} />
            <HfModelSelectionModal
                isOpen={isModelModalOpen}
                onClose={() => setIsModelModalOpen(false)}
                onSelect={handleSelectModel}
                models={ALL_HF_MODELS}
            />
             <main className="w-full max-w-4xl flex-grow flex flex-col items-center bg-black/40 p-2 border-4 border-brand-light shadow-pixel">
                <div className="w-full flex-grow overflow-y-auto px-4 pt-4 pb-2">
                    {messages.length === 0 && !isLoading && (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <button
                                onClick={() => setIsModelModalOpen(true)}
                                onMouseEnter={() => playSound(audioService.playHover)}
                                className="p-4 bg-surface-primary border-4 border-border-primary shadow-pixel hover:bg-brand-cyan/20"
                            >
                                <HuggingFaceIcon className="w-16 h-16 text-brand-cyan mb-4 mx-auto" />
                                <h2 className="font-press-start text-lg text-brand-yellow">{selectedModel.name}</h2>
                                <p className="font-sans text-xs text-text-secondary mt-1 max-w-xs">{selectedModel.description}</p>
                                <p className="font-sans text-xs text-brand-cyan underline mt-2">Change Model</p>
                            </button>
                        </div>
                    )}
                    <div className="space-y-6">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'model' && <div className="flex-shrink-0 w-8 h-8 text-brand-cyan mt-1"><HuggingFaceIcon/></div>}
                                <div className={`max-w-xl p-3 text-sm rounded-lg ${msg.role === 'user' ? 'bg-brand-cyan/80 text-black' : 'bg-surface-primary text-text-primary'}`}>
                                   <div className="whitespace-pre-wrap font-sans leading-relaxed">{msg.text}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {isLoading && (
                        <div className="flex gap-4 mt-6">
                            <div className="flex-shrink-0 w-8 h-8 text-brand-cyan mt-1"><HuggingFaceIcon/></div>
                            <div className="p-3"><LoadingSpinner text="" /></div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <footer className="w-full flex-shrink-0 p-2 space-y-3">
                    {error && <div role="alert" className="text-center text-xs text-brand-magenta">{error}</div>}
                    <div className="flex items-center gap-2">
                        <button onClick={handleNewChat} onMouseEnter={() => playSound(audioService.playHover)} className="p-3 border-2 border-border-primary text-text-primary hover:bg-brand-magenta/80" title="New Chat">
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                        <div className="relative flex-grow">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder={isLoading ? "AI is thinking..." : `Chat with ${selectedModel.name}...`}
                                className="w-full p-3 pr-12 bg-surface-primary border-2 border-border-primary text-text-primary focus:outline-none focus:border-brand-yellow font-sans disabled:bg-gray-800"
                                disabled={isLoading || !isOnline}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                 <button onClick={handleSendMessage} disabled={!userInput.trim() || isLoading || !isOnline} className="p-2 hover:text-brand-yellow disabled:opacity-50">
                                    <SendIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                    </div>
                     <div className="flex items-center justify-center text-xs font-press-start">
                        <label className="text-brand-light/70 mr-2">Model:</label>
                        <button onClick={() => setIsModelModalOpen(true)} className="bg-surface-primary text-brand-yellow p-1 underline hover:text-brand-lime">
                            {selectedModel.name}
                        </button>
                    </div>
                </footer>
            </main>
        </PageWrapper>
    );
};
