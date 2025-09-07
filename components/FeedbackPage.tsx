




import React, { useState } from 'react';
import * as audioService from '../services/audioService';
import { analyzeFeedback } from '../services/geminiService';
import { PageHeader, PageWrapper } from './PageComponents';
import { LoadingSpinner } from './LoadingSpinner';
import { SendIcon } from './icons/SendIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { useCredits, CREDIT_COSTS } from '../contexts/CreditContext';

interface FeedbackPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

export const FeedbackPage: React.FC<FeedbackPageProps> = ({ onClose, playSound, isOnline }) => {
    const [feedback, setFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [wasAnalyzed, setWasAnalyzed] = useState(false);
    const { spendCredits, credits } = useCredits();

    const handleAnalyze = async () => {
        if (!feedback.trim() || !isOnline) return;

        if (!spendCredits(CREDIT_COSTS.FEEDBACK_ANALYSIS)) {
            setError(`เครดิตไม่เพียงพอ! ต้องการ ${CREDIT_COSTS.FEEDBACK_ANALYSIS} เครดิต แต่คุณมี ${Math.floor(credits)} เครดิต`);
            playSound(audioService.playError);
            return;
        }

        playSound(audioService.playClick);
        setIsSummaryLoading(true);
        setError(null);
        setSummary(null);

        try {
            const result = await analyzeFeedback(feedback);
            setSummary(result);
            setWasAnalyzed(true);
            playSound(audioService.playSuccess);
        } catch (err) {
            playSound(audioService.playError);
            const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการวิเคราะห์';
            setError(errorMessage);
        } finally {
            setIsSummaryLoading(false);
        }
    };

    const handleSubmit = () => {
        if (!feedback.trim() || !isOnline) return;
        // This is a demo app, so we don't actually send the feedback anywhere.
        // We just show a success message.
        playSound(audioService.playGenerate);
        setIsLoading(true);
        setError(null);
        
        setTimeout(() => {
            setIsLoading(false);
            setIsSubmitted(true);
            playSound(audioService.playSuccess);
        }, 1500);
    };

    return (
        <PageWrapper>
            <PageHeader title="ข้อเสนอแนะ" onBack={onClose} />
            <main className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                {isSubmitted ? (
                    <div className="text-center space-y-4 p-4 bg-black/40 border-4 border-brand-lime shadow-pixel">
                        <h3 className="font-press-start text-xl text-brand-lime">ขอบคุณ!</h3>
                        {wasAnalyzed ? (
                            <p>ขอบคุณสำหรับข้อเสนอแนะ! ในแอปพลิเคชันเวอร์ชันเต็ม ข้อความที่ผ่านการวิเคราะห์นี้จะถูกส่งไปยัง AI Code Assistant โดยอัตโนมัติเพื่อช่วยในการพัฒนาต่อไป</p>
                        ) : (
                            <p>เราได้รับข้อเสนอแนะของคุณแล้ว และจะนำไปใช้เพื่อปรับปรุงแอปพลิเคชันต่อไป!</p>
                        )}
                        <button
                            onClick={onClose}
                            onMouseEnter={() => playSound(audioService.playHover)}
                            className="w-full mt-4 flex items-center justify-center gap-3 p-3 bg-brand-cyan text-black border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px]"
                        >
                            กลับสู่หน้าหลัก
                        </button>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-center text-brand-light/80">
                            เราให้ความสำคัญกับความคิดเห็นของคุณ! โปรดบอกเราว่าคุณคิดอย่างไรกับแอปนี้ หรือมีไอเดียอะไรอยากจะแนะนำ
                        </p>
                        <div className="w-full flex flex-col gap-4 bg-black/40 p-4 border-4 border-brand-light shadow-pixel">
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="พิมพ์ความคิดเห็นของคุณที่นี่..."
                                className="w-full h-40 p-2 bg-brand-light text-black rounded-none border-2 border-black focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-y"
                                disabled={isLoading || !isOnline}
                                aria-label="ช่องใส่ข้อเสนอแนะ"
                            />
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={handleAnalyze}
                                    onMouseEnter={() => playSound(audioService.playHover)}
                                    disabled={!feedback.trim() || isLoading || isSummaryLoading || !isOnline}
                                    className="w-full flex items-center justify-center gap-2 p-3 bg-brand-cyan text-black border-4 border-brand-light shadow-pixel transition-all hover:bg-brand-yellow active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed"
                                >
                                    <SparklesIcon className="w-5 h-5" />
                                    {isSummaryLoading ? 'กำลังวิเคราะห์...' : `วิเคราะห์ด้วย AI (${CREDIT_COSTS.FEEDBACK_ANALYSIS} เครดิต)`}
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    onMouseEnter={() => playSound(audioService.playHover)}
                                    disabled={!feedback.trim() || isLoading || isSummaryLoading || !isOnline}
                                    className="w-full flex items-center justify-center gap-2 p-3 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed"
                                >
                                    <SendIcon className="w-5 h-5" />
                                    {isLoading ? 'กำลังส่ง...' : (summary ? 'ส่งให้ AI Code Assistant' : 'ส่งข้อเสนอแนะ')}
                                </button>
                            </div>
                        </div>

                        {isSummaryLoading && <LoadingSpinner text="AI กำลังอ่าน..." />}
                        
                        {error && (
                            <div role="alert" className="w-full p-3 text-center text-sm text-brand-light bg-brand-magenta/20 border-2 border-brand-magenta">
                                {error}
                            </div>
                        )}

                        {summary && (
                            <div aria-live="polite" className="w-full p-4 bg-black/30 border-2 border-brand-cyan/50 space-y-2">
                                <h4 className="font-press-start text-brand-cyan">AI สรุปว่า:</h4>
                                <p className="text-sm">"{summary}"</p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </PageWrapper>
    );
};