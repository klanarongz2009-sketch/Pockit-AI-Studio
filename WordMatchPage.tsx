


import React, { useState, useCallback, useEffect } from 'react';
import * as audioService from '../services/audioService';
import { generateWordMatches, WordMatch } from '../services/geminiService';
import { PageWrapper, PageHeader } from './PageComponents';
import { LoadingSpinner } from './LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { useCredits } from '../contexts/CreditContext';
import { WordMatchIcon } from './icons/WordMatchIcon';

interface WordMatchPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

export const WordMatchPage: React.FC<WordMatchPageProps> = ({ onClose, playSound, isOnline }) => {
    const [topic, setTopic] = useState('');
    const [matches, setMatches] = useState<WordMatch[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const { addCredits } = useCredits();

    const handleGenerate = useCallback(async () => {
        if (!topic.trim() || isLoading || !isOnline) return;

        playSound(audioService.playGenerate);
        setIsLoading(true);
        setError(null);
        setMatches([]);
        setSuccessMessage(null);

        try {
            const result = await generateWordMatches(topic);
            setMatches(result);
            // FIX: addCredits is now async
            await addCredits(10000);
            setSuccessMessage("จับคู่สำเร็จ! คุณได้รับ 10,000 เครดิต!");
            playSound(audioService.playSuccess);
        } catch (err) {
            playSound(audioService.playError);
            const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการจับคู่คำ';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [topic, isLoading, isOnline, playSound, addCredits]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isLoading) return;

            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const isCtrlCmd = isMac ? event.metaKey : event.ctrlKey;
            
            if (isCtrlCmd && event.key === 'Enter') {
                if (topic.trim()) {
                     event.preventDefault();
                     handleGenerate();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLoading, topic, handleGenerate]);


    return (
        <PageWrapper>
            <PageHeader title="AI จับคู่คำ" onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                <p className="text-sm text-center text-brand-light/80">
                    ป้อนคำหรือแนวคิด แล้ว AI จะสร้างการจับคู่ที่สร้างสรรค์ให้คุณ <strong className="text-brand-yellow">พร้อมรับ 10,000 เครดิตฟรี!</strong>
                </p>

                <div className="w-full flex flex-col gap-4 bg-black/40 p-4 border-4 border-brand-light shadow-pixel">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="topic-input" className="text-xs font-press-start text-brand-cyan">คำหรือแนวคิดของคุณ:</label>
                        <input
                            id="topic-input"
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="เช่น ความรัก, แมว, จักรวาล..."
                            className="w-full p-2 bg-brand-light text-black rounded-none border-2 border-black focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                            disabled={isLoading || !isOnline}
                        />
                    </div>
                    <button
                        onClick={handleGenerate}
                        onMouseEnter={() => playSound(audioService.playHover)}
                        disabled={!topic.trim() || isLoading || !isOnline}
                        className="w-full flex items-center justify-center gap-3 p-3 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed"
                        title={!isOnline ? 'ฟีเจอร์นี้ต้องใช้การเชื่อมต่ออินเทอร์เน็ต' : 'ปุ่มลัด: Ctrl+Enter'}
                    >
                        <WordMatchIcon className="w-5 h-5"/>
                        {isLoading ? 'กำลังค้นหา...' : 'จับคู่คำ'}
                    </button>
                </div>

                <div className="w-full min-h-[12rem] p-4 bg-black/50 border-4 border-brand-light flex flex-col items-center justify-center">
                    {isLoading && <LoadingSpinner text="AI กำลังเชื่อมโยงแนวคิด..." />}
                    {error && (
                        <div role="alert" className="text-center text-brand-magenta">
                            <p className="font-press-start">การจับคู่ล้มเหลว</p>
                            <p className="text-sm mt-2">{error}</p>
                        </div>
                    )}
                    {!isLoading && !error && matches.length > 0 && (
                         <div className="w-full space-y-3">
                            {successMessage && <p role="status" className="text-center font-press-start text-lg text-brand-lime mb-4">{successMessage}</p>}
                            <ul className="space-y-2">
                                {matches.map((item, index) => (
                                    <li key={index} className="flex text-sm border-b border-brand-light/20 pb-1">
                                        <span className="font-press-start text-brand-cyan w-2/5 truncate">{item.category}:</span>
                                        <span className="text-brand-light w-3/5">{item.match}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                     {!isLoading && !error && matches.length === 0 && (
                        <p className="text-brand-light/70">ผลลัพธ์การจับคู่จะปรากฏที่นี่...</p>
                    )}
                </div>
            </main>
        </PageWrapper>
    );
};