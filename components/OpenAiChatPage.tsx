import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as openAiService from '../services/openAiService';
import * as audioService from '../services/audioService';
import { PageWrapper, PageHeader } from './PageComponents';
import { LoadingSpinner } from './LoadingSpinner';
import { SendIcon } from './icons/SendIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { TrashIcon } from './icons/TrashIcon';

interface OpenAiChatPageProps {
  isOnline: boolean;
  playSound: (player: () => void) => void;
  onClose: () => void;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export const OpenAiChatPage: React.FC<OpenAiChatPageProps> = ({ isOnline, playSound, onClose }) => {
    const [userInput, setUserInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [model, setModel] = useState('gpt-4o');

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
    
        const newMessages: Message[] = [...messages, { role: 'user', content: textToSend }];
        setMessages(newMessages);
        setUserInput('');
        setIsLoading(true);
    
        try {
            const response = await openAiService.chat(model, newMessages);
            const modelMessage: Message = { role: 'assistant', content: response };
            setMessages(prev => [...prev, modelMessage]);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
            setMessages(prev => prev.slice(0, -1)); 
        } finally {
            setIsLoading(false);
        }
    }, [userInput, isLoading, isOnline, playSound, model, messages]);
    
    return (
        <PageWrapper>
            <PageHeader title="OpenAI Chat" onBack={onClose} />
             <main className="w-full max-w-4xl flex-grow flex flex-col items-center bg-black/40 p-2 border-4 border-brand-light shadow-pixel">
                <div className="w-full flex-grow overflow-y-auto px-4 pt-4 pb-2">
                    {messages.length === 0 && !isLoading && (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <SparklesIcon className="w-16 h-16 text-brand-cyan mb-4 mx-auto" />
                            <h2 className="font-press-start text-lg text-brand-yellow">Chat with {model}</h2>
                            <p className="font-sans text-xs text-text-secondary mt-1">Start by typing a message below.</p>
                        </div>
                    )}
                    <div className="space-y-6">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'assistant' && <div className="flex-shrink-0 w-8 h-8 text-brand-cyan mt-1"><SparklesIcon/></div>}
                                <div className={`max-w-xl p-3 text-sm rounded-lg ${msg.role === 'user' ? 'bg-brand-cyan/80 text-black' : 'bg-surface-primary text-text-primary'}`}>
                                   <div className="whitespace-pre-wrap font-sans leading-relaxed">{msg.content}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {isLoading && (
                        <div className="flex gap-4 mt-6">
                            <div className="flex-shrink-0 w-8 h-8 text-brand-cyan mt-1"><SparklesIcon/></div>
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
                                placeholder={isLoading ? "AI is thinking..." : `Chat with ${model}...`}
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
                </footer>
            </main>
        </PageWrapper>
    );
};