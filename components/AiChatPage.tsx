import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PageWrapper } from './PageComponents';
import * as audioService from '../services/audioService';
import * as geminiService from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { SendIcon } from './icons/SendIcon';
import { useCredits, CREDIT_COSTS } from '../contexts/CreditContext';
import { Modal } from './Modal';

interface AiChatPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

interface ChatMessage {
    role: 'user' | 'model';
    content: string;
    sources?: { uri: string; title: string }[];
}

interface Model {
    id: string;
    name: string;
    provider: 'Gemini';
    description: string;
    systemInstruction?: string;
    webSearchEnabled?: boolean;
}

const models: Model[] = [
    { 
        id: 'gemini-2.5-flash', 
        name: 'Chatwaff V0.5', 
        provider: 'Gemini',
        description: 'โมเดลเริ่มต้น รองรับบางภาษาเท่านั้น ภาษาอังกฤษ ภาษาจีน. ไม่รองรับการค้นหาเว็บ',
        systemInstruction: 'You are Chatwaff V0.5, a foundational language model. You primarily understand English and Chinese. You do not have access to real-time web search. Your responses should be direct and informative. Respond in Thai.',
        webSearchEnabled: false
    },
    { 
        id: 'gemini-2.5-flash', 
        name: 'Gemini 2.5 Pro', 
        provider: 'Gemini',
        description: 'ผู้ช่วย AI รอบรู้สำหรับตอบคำถามทั่วไป, ระดมสมอง, และสนทนา',
        systemInstruction: 'You are a friendly and helpful AI assistant for a creative suite application. You are an expert in generative art, video, music, and sound design. Your tone is encouraging and slightly playful. You should respond in Thai.',
        webSearchEnabled: true
    },
    { 
        id: 'gemini-2.5-flash', 
        name: 'นักเขียนสร้างสรรค์', 
        provider: 'Gemini',
        description: 'ผู้เชี่ยวชาญด้านการเขียนเรื่องราว, บทกวี, และเนื้อหาเชิงสร้างสรรค์',
        systemInstruction: 'You are a master storyteller and creative writer. Your goal is to inspire with imaginative ideas, compelling narratives, and poetic language. You should respond in Thai.',
        webSearchEnabled: true
    },
    { 
        id: 'gemini-2.5-flash', 
        name: 'ผู้ช่วยเขียนโค้ด', 
        provider: 'Gemini',
        description: 'ผู้เชี่ยวชาญด้านการเขียนโค้ด, แก้บั๊ก, และอธิบายแนวคิดทางโปรแกรมมิ่ง',
        systemInstruction: 'You are an expert programmer and code assistant. Provide clear, efficient, and well-explained code snippets. You can assist with HTML, CSS, JavaScript, and concepts related to web development. You should respond in Thai.',
        webSearchEnabled: true
    },
];

const defaultModel = models[0];

export const AiChatPage: React.FC<AiChatPageProps> = ({ onClose, playSound, isOnline }) => {
    const [selectedModel, setSelectedModel] = useState<Model>(defaultModel);
    const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', content: `สวัสดี! ฉันคือ ${defaultModel.name} มีอะไรให้ช่วยไหม?` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { credits, spendCredits, addCredits } = useCredits();

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);
    
    useEffect(() => {
        return () => {
            geminiService.resetChatSession();
        };
    }, []);

    const handleSelectModel = (model: Model) => {
        if (model.name === selectedModel.name) {
            setIsModelSelectorOpen(false);
            return;
        }
        playSound(audioService.playClick);
        setSelectedModel(model);
        setMessages([{ role: 'model', content: `สวัสดี! ฉันคือ ${model.name} มีอะไรให้ช่วยไหม?` }]);
        geminiService.resetChatSession();
        setIsModelSelectorOpen(false);
    };

    const handleSendMessage = useCallback(async () => {
        const trimmedInput = input.trim();
        if (!trimmedInput || isLoading || !selectedModel) return;
        
        if (!spendCredits(CREDIT_COSTS.CHAT_MESSAGE)) {
            setError(`เครดิตไม่เพียงพอ! ต้องการ ${CREDIT_COSTS.CHAT_MESSAGE} เครดิต`);
            playSound(audioService.playError);
            return;
        }

        const userMessage: ChatMessage = { role: 'user', content: trimmedInput };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);
        playSound(audioService.playClick);

        try {
            const response = await geminiService.sendMessageToChat(
                trimmedInput, 
                selectedModel.id, 
                selectedModel.systemInstruction || '',
                selectedModel.webSearchEnabled ?? false
            );
            const modelMessage: ChatMessage = { 
                role: 'model', 
                content: response.text,
                sources: response.sources
            };
            setMessages(prev => [...prev, modelMessage]);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสื่อสารกับ AI';
            setError(errorMessage);
            addCredits(CREDIT_COSTS.CHAT_MESSAGE); // Refund on error
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, selectedModel, playSound, spendCredits, addCredits]);

    return (
        <PageWrapper>
            <header className="w-full max-w-2xl flex items-center justify-between p-3 border-b-4 border-border-primary bg-background/20 flex-shrink-0">
                <button onClick={onClose} className="text-sm underline hover:text-brand-yellow transition-colors pr-4 font-sans" aria-label="กลับ">
                    &#x2190; กลับ
                </button>
                <h2 className="text-base sm:text-lg text-brand-yellow font-press-start truncate">
                    {selectedModel.name}
                </h2>
                <button 
                    onClick={() => { playSound(audioService.playClick); setIsModelSelectorOpen(true); }}
                    onMouseEnter={() => playSound(audioService.playHover)}
                    className="text-xs font-press-start p-2 border-2 border-brand-light bg-surface-primary hover:bg-brand-cyan/20 transition-colors"
                >
                    เปลี่ยน
                </button>
            </header>
            <main id="main-content" className="w-full max-w-2xl flex-grow flex flex-col p-4 overflow-hidden font-sans">
                <div className="flex flex-col h-full">
                    <div className="flex-grow overflow-y-auto mb-4 pr-2 space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-end gap-2 animate-fadeIn ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`p-3 max-w-lg shadow-sm rounded-lg ${msg.role === 'user' ? 'bg-brand-cyan text-black' : 'bg-surface-secondary text-text-primary'}`}>
                                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-3 pt-2 border-t border-brand-light/30">
                                            <h4 className="font-press-start text-xs mb-2 text-brand-light/80">แหล่งข้อมูล:</h4>
                                            <ul className="list-disc list-inside space-y-1">
                                                {msg.sources.map((source, i) => (
                                                    <li key={i} className="text-xs">
                                                        <a 
                                                            href={source.uri} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-brand-yellow underline hover:text-brand-lime transition-colors break-all"
                                                        >
                                                            {source.title}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="p-3 bg-surface-secondary text-text-primary rounded-lg">
                                    <LoadingSpinner text="AI กำลังคิด..." />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    {error && <div role="alert" className="text-brand-magenta text-xs text-center mb-2 p-2 bg-brand-magenta/10 border border-brand-magenta">{error}</div>}
                    <div className="flex items-end gap-2 border-t-2 border-brand-light/30 pt-4">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyPress={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="พิมพ์ข้อความของคุณ..."
                            rows={1}
                            className="w-full p-2 bg-brand-light text-black rounded-none border-2 border-black focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-none max-h-32"
                            disabled={isLoading || !isOnline}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={isLoading || !input.trim() || !isOnline}
                            className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-brand-magenta text-white border-2 border-brand-light shadow-sm transition-all hover:bg-brand-yellow hover:text-black disabled:bg-gray-500"
                            aria-label="ส่งข้อความ"
                        >
                            <SendIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </main>
            
            <Modal isOpen={isModelSelectorOpen} onClose={() => setIsModelSelectorOpen(false)} title="เลือกผู้ช่วย AI">
                <div className="w-full grid grid-cols-1 gap-4">
                    {models.map(model => (
                        <button
                            key={model.name}
                            onClick={() => handleSelectModel(model)}
                            disabled={!isOnline}
                            className={`w-full text-left p-4 border-4 shadow-pixel transition-all hover:bg-brand-cyan/20 hover:border-brand-yellow 
                                ${selectedModel.name === model.name ? 'bg-brand-yellow/80 border-black' : 'bg-black/40 border-brand-light'}`}
                        >
                            <h3 className={`font-press-start text-base ${selectedModel.name === model.name ? 'text-black' : 'text-brand-yellow'}`}>{model.name}</h3>
                            <p className={`text-xs mt-1 ${selectedModel.name === model.name ? 'text-black/80' : 'text-brand-light/80'}`}>{model.description}</p>
                        </button>
                    ))}
                </div>
            </Modal>
        </PageWrapper>
    );
};
