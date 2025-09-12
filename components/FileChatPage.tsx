import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as geminiService from '../services/geminiService';
import * as audioService from '../services/audioService';
import { PageHeader, PageWrapper } from './PageComponents';
import { UploadIcon } from './icons/UploadIcon';
import { LoadingSpinner } from './LoadingSpinner';
import { SendIcon } from './icons/SendIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { MusicNoteIcon } from './icons/MusicNoteIcon';
import { TrashIcon } from './icons/TrashIcon';
import { useCredits } from '../contexts/CreditContext';

interface FileChatPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

interface FileData {
    file: File;
    base64: string;
    previewUrl: string;
}

export const FileChatPage: React.FC<FileChatPageProps> = ({ onClose, playSound, isOnline }) => {
    const [fileData, setFileData] = useState<FileData | null>(null);
    const [messages, setMessages] = useState<geminiService.FileChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { spendCredits, credits } = useCredits();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const processFile = useCallback(async (file: File | undefined) => {
        if (!file) return;

        // Reset everything when a new file is chosen
        setFileData(null);
        setMessages([]);
        setError(null);
        setUserInput('');
        
        setIsLoading(true);
        playSound(audioService.playSelection);
        
        try {
            const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = error => reject(error);
            });
            const base64 = await toBase64(file);
            const previewUrl = URL.createObjectURL(file);

            setFileData({ file, base64, previewUrl });

        } catch (err) {
            setError(err instanceof Error ? err.message : "ไม่สามารถประมวลผลไฟล์ได้");
            playSound(audioService.playError);
        } finally {
            setIsLoading(false);
        }
    }, [playSound]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        processFile(event.target.files?.[0]);
    };

    const handleSendMessage = useCallback(async () => {
        const trimmedInput = userInput.trim();
        if (!trimmedInput || !fileData || isLoading || !isOnline) return;

        const cost = 5; // Example cost per message
        if (!spendCredits(cost)) {
            setError(`เครดิตไม่เพียงพอ! ต้องการ ${cost} เครดิต`);
            playSound(audioService.playError);
            return;
        }

        playSound(audioService.playClick);
        setError(null);
        const userMessage: geminiService.FileChatMessage = { role: 'user', text: trimmedInput };
        setMessages(prev => [...prev, userMessage]);
        setUserInput('');
        setIsLoading(true);

        try {
            const responseText = await geminiService.chatWithFile(
                { base64: fileData.base64, mimeType: fileData.file.type },
                [...messages, userMessage],
                trimmedInput
            );
            const modelMessage: geminiService.FileChatMessage = { role: 'model', text: responseText };
            setMessages(prev => [...prev, modelMessage]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสื่อสารกับ AI');
            playSound(audioService.playError);
        } finally {
            setIsLoading(false);
        }
    }, [userInput, fileData, messages, isLoading, isOnline, playSound, spendCredits, credits]);

    const handleDragEnter = (e: React.DragEvent<HTMLElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent<HTMLElement>) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (e.dataTransfer.files?.[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };
    
    return (
        <PageWrapper>
            <PageHeader title="File Q&A (PDF.AI)" onBack={onClose} />
             <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,audio/*,video/*,text/*,.pdf" className="hidden" aria-hidden="true" />
            <main 
                id="main-content"
                className="w-full max-w-4xl flex-grow flex flex-col items-center gap-4 font-sans"
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {isDragging && (
                    <div className="absolute inset-0 bg-black/80 border-4 border-dashed border-brand-yellow z-10 flex flex-col items-center justify-center pointer-events-none">
                        <UploadIcon className="w-12 h-12 text-brand-yellow" />
                        <p className="font-press-start text-xl text-brand-yellow mt-4">วางไฟล์ของคุณที่นี่</p>
                    </div>
                )}
                {!fileData && !isLoading && (
                    <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                        <p className="text-sm text-brand-light/80 mb-4">อัปโหลดไฟล์ (รูปภาพ, เสียง, วิดีโอ, ข้อความ) แล้วเริ่มถามคำถามเกี่ยวกับเนื้อหาในไฟล์นั้นได้เลย</p>
                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black">
                            <UploadIcon className="w-6 h-6" /> อัปโหลดไฟล์
                        </button>
                    </div>
                )}

                {isLoading && !fileData && <LoadingSpinner text="กำลังประมวลผลไฟล์..." />}

                {fileData && (
                    <div className="w-full h-full flex flex-col border-4 border-brand-light shadow-pixel bg-black/40">
                        <header className="flex-shrink-0 p-2 border-b-4 border-brand-light flex items-center justify-between">
                            <div className="flex items-center gap-2 overflow-hidden">
                                {fileData.file.type.startsWith('image/') && <SparklesIcon className="w-5 h-5 text-brand-cyan flex-shrink-0" />}
                                {fileData.file.type.startsWith('audio/') && <MusicNoteIcon className="w-5 h-5 text-brand-cyan flex-shrink-0" />}
                                <p className="text-xs font-press-start truncate">{fileData.file.name}</p>
                            </div>
                            <button onClick={() => processFile(undefined)} className="p-2 hover:text-brand-magenta" aria-label="Remove file">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </header>

                        <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                            <div className="w-full md:w-1/3 h-48 md:h-auto bg-black/30 p-2 flex items-center justify-center overflow-hidden border-b-2 md:border-b-0 md:border-r-2 border-brand-light">
                                {fileData.file.type.startsWith('image/') && <img src={fileData.previewUrl} className="max-w-full max-h-full object-contain" alt="File preview" />}
                                {fileData.file.type.startsWith('audio/') && <audio src={fileData.previewUrl} controls className="w-full" />}
                                {fileData.file.type.startsWith('video/') && <video src={fileData.previewUrl} controls className="max-w-full max-h-full object-contain" />}
                                {!fileData.file.type.match(/^(image|audio|video)\//) && <p className="text-sm text-center">ไม่มีตัวอย่างสำหรับไฟล์ประเภทนี้</p>}
                            </div>

                            <div className="w-full md:w-2/3 flex flex-col">
                                <main className="flex-grow p-4 overflow-y-auto">
                                     <div className="space-y-6">
                                        {messages.map((msg, index) => (
                                            <div key={index} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                                {msg.role === 'model' && <div className="flex-shrink-0 w-8 h-8 text-brand-cyan mt-1"><SparklesIcon/></div>}
                                                <div className={`max-w-xl p-3 text-sm rounded-lg ${msg.role === 'user' ? 'bg-brand-cyan/80 text-black' : 'bg-surface-primary text-text-primary'}`}>
                                                   {msg.text}
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
                                    {error && <div role="alert" className="mt-4 p-2 text-center text-sm text-brand-magenta">{error}</div>}
                                    <div ref={messagesEndRef} />
                                </main>
                                <footer className="p-2 border-t-2 border-brand-light">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={userInput}
                                            onChange={(e) => setUserInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="ถามเกี่ยวกับไฟล์นี้..."
                                            className="flex-grow p-2 bg-brand-light text-black rounded-none border-2 border-black focus:outline-none"
                                            disabled={isLoading || !isOnline}
                                        />
                                        <button onClick={handleSendMessage} disabled={!userInput.trim() || isLoading || !isOnline} className="w-12 h-10 flex-shrink-0 flex items-center justify-center bg-brand-magenta text-white border-2 border-black hover:bg-brand-yellow hover:text-black disabled:bg-gray-500">
                                            <SendIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                </footer>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </PageWrapper>
    );
};
