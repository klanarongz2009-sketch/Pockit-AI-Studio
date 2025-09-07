


import React, { useState, useEffect, useCallback } from 'react';
import * as audioService from '../services/audioService';
import { PageHeader, PageWrapper } from './PageComponents';
import { LoadingSpinner } from './LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { PlayIcon } from './icons/PlayIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { generateSoundEffectIdeas, SoundEffectParameters } from '../services/geminiService';
import { useCredits, CREDIT_COSTS } from '../contexts/CreditContext';

interface SoundLibraryPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

export const SoundLibraryPage: React.FC<SoundLibraryPageProps> = ({ onClose, playSound, isOnline }) => {
    const [prompt, setPrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedSounds, setGeneratedSounds] = useState<SoundEffectParameters[]>([]);
    const { credits, spendCredits } = useCredits();

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim() || isLoading || !isOnline) return;

        if (!spendCredits(CREDIT_COSTS.SOUND_EFFECT_IDEAS)) {
            setError(`เครดิตไม่เพียงพอ! ต้องการ ${CREDIT_COSTS.SOUND_EFFECT_IDEAS} เครดิต แต่คุณมี ${credits.toFixed(0)} เครดิต`);
            playSound(audioService.playError);
            return;
        }

        playSound(audioService.playGenerate);
        setIsLoading(true);
        setError(null);
        setGeneratedSounds([]);

        try {
            const sounds = await generateSoundEffectIdeas(prompt);
             if (sounds.length === 0) {
                throw new Error("AI ไม่สามารถสร้างไอเดียได้ในขณะนี้ โปรดลองใช้คำอธิบายอื่น");
            }
            setGeneratedSounds(sounds);
            playSound(audioService.playSuccess);
        } catch (err) {
            playSound(audioService.playError);
            const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างเสียง';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [prompt, isLoading, playSound, isOnline, spendCredits, credits]);

    const handlePlaySound = (params: SoundEffectParameters) => {
        audioService.playSoundFromParams(params);
    };

    const handleDownloadSound = useCallback(async (params: SoundEffectParameters) => {
        if (isDownloading) return;
    
        playSound(audioService.playDownload);
        setIsDownloading(true);
        setError(null);
    
        try {
            const wavBlob = await audioService.exportSoundEffectToWav(params);
            if (wavBlob) {
                const url = URL.createObjectURL(wavBlob);
                const a = document.createElement('a');
                a.href = url;
                const fileName = params.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'sound-effect';
                a.download = `${fileName}.wav`;
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                throw new Error("ไม่สามารถสร้างไฟล์ WAV ได้");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการดาวน์โหลด");
            playSound(audioService.playError);
        } finally {
            setIsDownloading(false);
        }
    }, [isDownloading, playSound]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isLoading) return;

            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const isCtrlCmd = isMac ? event.metaKey : event.ctrlKey;
            
            // Allow Ctrl+Enter in textarea to submit
            if (isCtrlCmd && event.key === 'Enter') {
                if (document.activeElement?.tagName === 'TEXTAREA' || prompt.trim()) {
                     event.preventDefault();
                     handleGenerate();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLoading, prompt, handleGenerate]);

    return (
        <PageWrapper>
            <PageHeader title="คลังเสียง 8-Bit" onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                <div className="w-full text-center space-y-4">
                    <p className="text-sm text-brand-light/80">
                        อธิบายเสียง 8-bit ที่คุณต้องการ แล้วให้ AI สร้างสรรค์เสียงประกอบที่เป็นเอกลักษณ์สำหรับโปรเจกต์ของคุณ!
                    </p>
                </div>

                <div className="w-full flex flex-col gap-4 bg-black/40 p-4 border-4 border-brand-light shadow-pixel">
                    <div className="flex flex-col gap-2">
                         <label htmlFor="sound-prompt" className="text-xs font-press-start text-brand-cyan">อธิบายเสียงของคุณ</label>
                        <textarea
                            id="sound-prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="เช่น เสียงกระโดด, เสียงยิงเลเซอร์, เสียงเก็บเหรียญ"
                            className="w-full h-24 p-2 bg-brand-light text-black rounded-none border-2 border-black focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-y"
                            aria-label="ช่องใสคำอธิบายเสียง"
                            disabled={isLoading || !isOnline}
                        />
                    </div>
                    <button
                        onClick={handleGenerate}
                        onMouseEnter={() => playSound(audioService.playHover)}
                        disabled={!prompt.trim() || isLoading || !isOnline}
                        className="w-full flex items-center justify-center gap-3 p-3 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed"
                        title={!isOnline ? 'ฟีเจอร์นี้ต้องใช้การเชื่อมต่ออินเทอร์เน็ต' : 'ปุ่มลัด: Ctrl+Enter'}
                    >
                        <SparklesIcon className="w-5 h-5"/>
                        {isLoading ? 'กำลังสร้างเสียง...' : `สร้างเสียง (${CREDIT_COSTS.SOUND_EFFECT_IDEAS} เครดิต)`}
                    </button>
                </div>
                
                {isLoading && (
                    <div className="py-8">
                        <LoadingSpinner text="AI กำลังสังเคราะห์เสียง..." />
                    </div>
                )}

                {error && (
                     <div role="alert" className="w-full p-4 space-y-3 text-center bg-black/40 border-4 border-brand-magenta">
                        <h3 className="text-lg font-press-start text-brand-magenta">เกิดข้อผิดพลาด</h3>
                        <p className="font-sans text-sm break-words text-brand-light/90 max-w-md mx-auto">
                            {error}
                        </p>
                        <button
                            onClick={handleGenerate}
                            onMouseEnter={() => playSound(audioService.playHover)}
                            className="w-full max-w-xs mt-2 flex items-center justify-center gap-3 p-3 bg-brand-cyan text-black border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px]"
                        >
                            ลองอีกครั้ง
                        </button>
                    </div>
                )}

                {generatedSounds.length > 0 && !isLoading && (
                    <div className="w-full space-y-4">
                        <h3 className="text-lg font-press-start text-brand-cyan text-center">เสียงที่สร้างโดย AI</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {generatedSounds.map((sound, index) => (
                                <div key={index} className="flex items-center gap-2 p-3 bg-black/30 border-2 border-brand-light/50">
                                    <span className="flex-grow text-sm font-press-start text-brand-light truncate" title={sound.name}>
                                        {sound.name}
                                    </span>
                                    <button
                                        onClick={() => handlePlaySound(sound)}
                                        onMouseEnter={() => playSound(audioService.playHover)}
                                        aria-label={`เล่นเสียง ${sound.name}`}
                                        className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-brand-cyan text-black border-2 border-brand-light shadow-sm transition-all hover:bg-brand-yellow active:shadow-none"
                                    >
                                        <PlayIcon className="w-6 h-6"/>
                                    </button>
                                     <button
                                        onClick={() => handleDownloadSound(sound)}
                                        onMouseEnter={() => playSound(audioService.playHover)}
                                        disabled={isDownloading}
                                        aria-label={`ดาวน์โหลดเสียง ${sound.name}`}
                                        className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-brand-yellow text-black border-2 border-brand-light shadow-sm transition-all hover:bg-brand-magenta hover:text-white active:shadow-none disabled:bg-gray-500 disabled:cursor-not-allowed"
                                    >
                                        <DownloadIcon className="w-6 h-6"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </PageWrapper>
    );
};