
import React, { useState, useEffect, useCallback } from 'react';
import * as audioService from '../services/audioService';
import { generateSecret } from '../services/geminiService';
import { PageWrapper, PageHeader } from './PageComponents';
import { LoadingSpinner } from './LoadingSpinner';
import { OracleIcon } from './icons/OracleIcon';

interface AiOraclePageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

export const AiOraclePage: React.FC<AiOraclePageProps> = ({ onClose, playSound, isOnline }) => {
    const [topic, setTopic] = useState('');
    const [secret, setSecret] = useState('');
    const [displayedSecret, setDisplayedSecret] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Typewriter effect
    useEffect(() => {
        if (secret) {
            setDisplayedSecret('');
            let i = 0;
            const intervalId = setInterval(() => {
                setDisplayedSecret(prev => prev + secret.charAt(i));
                i++;
                if (i >= secret.length) {
                    clearInterval(intervalId);
                }
            }, 50); // Adjust speed of typing here
            return () => clearInterval(intervalId);
        }
    }, [secret]);

    const handleRevealSecret = useCallback(async () => {
        if (!topic.trim() || isLoading || !isOnline) return;

        playSound(audioService.playGenerate);
        setIsLoading(true);
        setError(null);
        setSecret('');
        setDisplayedSecret('');

        try {
            const result = await generateSecret(topic);
            setSecret(result);
            playSound(audioService.playSuccess);
        } catch (err) {
            playSound(audioService.playError);
            const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการทำนาย';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [topic, isLoading, isOnline, playSound]);

    return (
        <PageWrapper>
            <PageHeader title="AI พยากรณ์" onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                <p className="text-sm text-center text-brand-light/80">
                    บอกหัวข้อที่คุณสงสัย แล้ว AI พยากรณ์จะเปิดเผย "ความลับ" ที่ซ่อนอยู่ให้คุณได้รับรู้...
                </p>

                <div className="w-full flex flex-col gap-4 bg-black/40 p-4 border-4 border-brand-light shadow-pixel">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="topic-input" className="text-xs font-press-start text-brand-cyan">หัวข้อที่อยากรู้:</label>
                        <textarea
                            id="topic-input"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="เช่น ดวงจันทร์, แมว, อินเทอร์เน็ต..."
                            className="w-full h-24 p-2 bg-brand-light text-black rounded-none border-2 border-black focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-y"
                            disabled={isLoading || !isOnline}
                        />
                    </div>
                    <button
                        onClick={handleRevealSecret}
                        onMouseEnter={() => playSound(audioService.playHover)}
                        disabled={!topic.trim() || isLoading || !isOnline}
                        className="w-full flex items-center justify-center gap-3 p-3 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed"
                        title={!isOnline ? 'ฟีเจอร์นี้ต้องใช้การเชื่อมต่ออินเทอร์เน็ต' : 'ปุ่มลัด: Ctrl+Enter'}
                    >
                        <OracleIcon className="w-5 h-5"/>
                        {isLoading ? 'กำลังทำนาย...' : 'เปิดเผยความลับ'}
                    </button>
                </div>

                <div className="w-full min-h-[12rem] p-4 bg-black/50 border-4 border-brand-light flex items-center justify-center">
                    {isLoading && <LoadingSpinner text="กำลังมองเข้าไปในอนาคต..." />}
                    {error && (
                        <div role="alert" className="text-center text-brand-magenta">
                            <p className="font-press-start">คำทำนายล้มเหลว</p>
                            <p className="text-sm mt-2">{error}</p>
                        </div>
                    )}
                    {!isLoading && !error && (
                        <p className="text-brand-cyan whitespace-pre-wrap w-full">
                            {displayedSecret || 'ผลลัพธ์จะปรากฏที่นี่...'}
                        </p>
                    )}
                </div>
            </main>
        </PageWrapper>
    );
};
