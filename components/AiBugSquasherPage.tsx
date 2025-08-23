import React, { useState, useCallback, useEffect } from 'react';
import * as audioService from '../services/audioService';
import { correctText } from '../services/geminiService';
import { PageWrapper, PageHeader } from './PageComponents';
import { LoadingSpinner } from './LoadingSpinner';
import { BugIcon } from './icons/BugIcon';
import { useCredits } from '../contexts/CreditContext';

interface AiBugSquasherPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

export const AiBugSquasherPage: React.FC<AiBugSquasherPageProps> = ({ onClose, playSound, isOnline }) => {
    const [inputText, setInputText] = useState('');
    const [correctedText, setCorrectedText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [creditChange, setCreditChange] = useState<{ spent: number; earned: number } | null>(null);
    const { credits, spendCredits, addCredits } = useCredits();

    const handleCorrection = useCallback(async () => {
        if (!inputText.trim() || isLoading || !isOnline) return;

        const cost = inputText.length;
        if (!spendCredits(cost)) {
            setError(`เครดิตไม่เพียงพอ! ต้องการ ${cost} เครดิต แต่คุณมี ${Math.floor(credits)} เครดิต`);
            playSound(audioService.playError);
            return;
        }

        playSound(audioService.playGenerate);
        setIsLoading(true);
        setError(null);
        setCorrectedText('');
        setCreditChange(null);

        try {
            const result = await correctText(inputText);
            setCorrectedText(result);
            
            const reward = result.length;
            addCredits(reward);
            
            setCreditChange({ spent: cost, earned: reward });
            playSound(audioService.playSuccess);
        } catch (err) {
            playSound(audioService.playError);
            // Re-add credits if AI fails
            addCredits(cost);
            const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการแก้ไขข้อความ';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [inputText, isLoading, isOnline, playSound, spendCredits, addCredits, credits]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isLoading) return;
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const isCtrlCmd = isMac ? event.metaKey : event.ctrlKey;
            
            if (isCtrlCmd && event.key === 'Enter') {
                if (inputText.trim()) {
                     event.preventDefault();
                     handleCorrection();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLoading, inputText, handleCorrection]);

    return (
        <PageWrapper>
            <PageHeader title="AI แก้ไขคำผิด" onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                <p className="text-sm text-center text-brand-light/80">
                    พิมพ์ข้อความภาษาไทยที่มีคำผิด แล้วให้ AI ช่วยแก้ไขไวยากรณ์และตัวสะกดให้ถูกต้อง!
                    <br />
                    <strong className="text-brand-yellow">เสีย 1 เครดิตต่อตัวอักษรที่คุณพิมพ์, รับ 1 เครดิตต่อตัวอักษรที่ AI แก้ไข!</strong>
                </p>

                <div className="w-full flex flex-col gap-4 bg-black/40 p-4 border-4 border-brand-light shadow-pixel">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="text-input" className="text-xs font-press-start text-brand-cyan">ข้อความของคุณ:</label>
                        <textarea
                            id="text-input"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="ตัวอย่าง: คุนยาย กำลงั เดินไป ตราด"
                            className="w-full h-32 p-2 bg-brand-light text-black rounded-none border-2 border-black focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-y"
                            disabled={isLoading || !isOnline}
                        />
                    </div>
                    <button
                        onClick={handleCorrection}
                        onMouseEnter={() => playSound(audioService.playHover)}
                        disabled={!inputText.trim() || isLoading || !isOnline}
                        className="w-full flex items-center justify-center gap-3 p-3 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed"
                        title={!isOnline ? 'ฟีเจอร์นี้ต้องใช้การเชื่อมต่ออินเทอร์เน็ต' : 'ปุ่มลัด: Ctrl+Enter'}
                    >
                        <BugIcon className="w-6 h-6"/>
                        {isLoading ? 'กำลังแก้ไข...' : 'แก้ไขคำผิด'}
                    </button>
                </div>

                <div className="w-full min-h-[12rem] p-4 bg-black/50 border-4 border-brand-light flex flex-col items-center justify-center">
                    {isLoading && <LoadingSpinner text="AI กำลังตรวจสอบ..." />}
                    {error && (
                        <div role="alert" className="text-center text-brand-magenta">
                            <p className="font-press-start">เกิดข้อผิดพลาด</p>
                            <p className="text-sm mt-2">{error}</p>
                        </div>
                    )}
                    {!isLoading && !error && (
                        <>
                            {correctedText ? (
                                <div className="w-full">
                                    <h3 className="font-press-start text-brand-cyan mb-2">ข้อความที่แก้ไข:</h3>
                                    <p className="text-brand-light whitespace-pre-wrap bg-black/20 p-2 border border-brand-light/50">{correctedText}</p>
                                    {creditChange && (
                                        <p role="status" className="text-center font-press-start text-sm mt-4">
                                            <span className="text-red-400">-{creditChange.spent} เครดิต</span>, <span className="text-green-400">+{creditChange.earned} เครดิต</span>
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-brand-light/70">ผลลัพธ์จะแสดงที่นี่...</p>
                            )}
                        </>
                    )}
                </div>
            </main>
        </PageWrapper>
    );
};
