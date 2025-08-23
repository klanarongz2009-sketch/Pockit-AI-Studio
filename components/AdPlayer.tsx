import React, { useState, useEffect, useRef } from 'react';
import * as audioService from '../services/audioService';
import { PixelPotionIcon } from './icons/PixelPotionIcon';

interface AdPlayerProps {
    onComplete: () => void;
}

const AD_DURATION = 8; // seconds

export const AdPlayer: React.FC<AdPlayerProps> = ({ onComplete }) => {
    const [countdown, setCountdown] = useState(AD_DURATION);
    const [progress, setProgress] = useState(0);
    const [showSkip, setShowSkip] = useState(false);
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        intervalRef.current = window.setInterval(() => {
            setCountdown(prev => {
                const newTime = prev - 1;
                if (newTime <= 0) {
                    clearInterval(intervalRef.current!);
                    onComplete();
                    return 0;
                }
                if (AD_DURATION - newTime >= 4) {
                    setShowSkip(true);
                }
                setProgress(((AD_DURATION - newTime) / AD_DURATION) * 100);
                return newTime;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [onComplete]);

    const handleSkip = () => {
        audioService.playCloseModal();
        if (intervalRef.current) clearInterval(intervalRef.current);
        onComplete();
    };

    return (
        <div role="dialog" aria-modal="true" aria-label="โฆษณา" className="fixed inset-0 bg-gradient-to-br from-purple-800 to-indigo-900 z-[60] flex flex-col items-center justify-between p-4 font-press-start text-brand-light">
            {/* Header */}
            <div className="w-full flex justify-between items-center text-xs">
                <span>Sponsored</span>
                {showSkip ? (
                    <button onClick={handleSkip} className="px-2 py-1 bg-black/50 border border-brand-light/50 text-xs hover:bg-black/80">ข้ามโฆษณา &gt;&gt;</button>
                ) : (
                    <span className="text-brand-light/50">รางวัลใน {countdown}...</span>
                )}
            </div>
            
            {/* Ad Content */}
            <div className="flex flex-col items-center justify-center text-center -mt-10">
                <div className="animate-pulse">
                    <PixelPotionIcon className="w-32 h-32 text-brand-light drop-shadow-[0_0_10px_#ff00ff]" />
                </div>
                <h2 className="text-3xl sm:text-4xl text-brand-yellow drop-shadow-[3px_3px_0_#000] mt-4">Pixel Potion</h2>
                <p className="text-sm text-brand-cyan mt-2">ปลดปล่อยพลังสร้างสรรค์ในตัวคุณ!</p>
                <p className="font-sans text-xs max-w-xs mt-4 text-brand-light/80">ดื่มด่ำกับรสชาติ 8-bit ที่จะจุดประกายไอเดียพิกเซลอาร์ตของคุณ! มีส่วนผสมของ Neon Nectar และ Glitchberry บริสุทธิ์!</p>
            </div>
            
            {/* Footer / CTA */}
            <div className="w-full flex flex-col items-center">
                 <button 
                    onClick={handleSkip}
                    onMouseEnter={() => audioService.playHover()}
                    className="w-full max-w-md p-4 bg-brand-lime text-black border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px]"
                 >
                    รับ Pixel Potion เลย!
                 </button>
                <div className="w-full max-w-md mt-4 h-2 bg-black/50 border border-brand-light/50">
                    <div 
                        className="h-full bg-brand-yellow transition-all duration-1000 ease-linear"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};
