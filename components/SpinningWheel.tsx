import React, { useState, useCallback } from 'react';
import { useCredits, CREDIT_COSTS } from '../contexts/CreditContext';
import * as audioService from '../services/audioService';

const segments = [
    { label: '10', value: 10, color: '#4ade80' },    // green-400
    { label: 'Try Again', value: 0, color: '#71717a' }, // zinc-500
    { label: '50', value: 50, color: '#38bdf8' },    // lightBlue-400
    { label: '1', value: 1, color: '#facc15' },      // yellow-400
    { label: '100', value: 100, color: '#f472b6' },   // pink-400
    { label: '5', value: 5, color: '#fb923c' },      // orange-400
    { label: 'JACKPOT', value: 500, color: '#e879f9' }, // fuchsia-400
    { label: '25', value: 25, color: '#60a5fa' },    // blue-400
];

const segmentAngle = 360 / segments.length;

export const SpinningWheel: React.FC = () => {
    const { credits, spendCredits, addCredits } = useCredits();
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [result, setResult] = useState<number | null>(null);

    const handleSpin = useCallback(() => {
        if (isSpinning || credits < CREDIT_COSTS.SPIN_WHEEL) {
            if (credits < CREDIT_COSTS.SPIN_WHEEL) {
                audioService.playError();
            }
            return;
        }

        spendCredits(CREDIT_COSTS.SPIN_WHEEL);
        setIsSpinning(true);
        setResult(null);
        audioService.playWheelSpin();

        const randomSpins = Math.floor(Math.random() * 5) + 5; // 5 to 9 full spins
        const winningSegmentIndex = Math.floor(Math.random() * segments.length);
        const randomOffset = (Math.random() * segmentAngle) - (segmentAngle / 2); // To land inside the segment
        const finalRotation = (randomSpins * 360) + (winningSegmentIndex * -segmentAngle) - randomOffset;

        setRotation(finalRotation);

        setTimeout(() => {
            setIsSpinning(false);
            const prize = segments[winningSegmentIndex].value;
            setResult(prize);
            if (prize > 0) {
                addCredits(prize);
                audioService.playWheelWin();
            } else {
                audioService.playMiss();
            }
        }, 5000); // Must match CSS transition duration

    }, [isSpinning, credits, spendCredits, addCredits]);

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative w-64 h-64">
                <div
                    className="absolute w-full h-full rounded-full border-4 border-brand-light shadow-pixel transition-transform duration-[5000ms] ease-out"
                    style={{ transform: `rotate(${rotation}deg)` }}
                >
                    {segments.map((segment, index) => (
                        <div
                            key={index}
                            className="absolute w-1/2 h-1/2 origin-bottom-right"
                            style={{
                                transform: `rotate(${index * segmentAngle}deg)`,
                                clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
                            }}
                        >
                            <div
                                className="absolute w-full h-full flex items-start justify-center"
                                style={{
                                    backgroundColor: segment.color,
                                    transform: 'rotate(22.5deg) skewY(-45deg) scale(1.414)',
                                    transformOrigin: 'top left',
                                }}
                            >
                                <span className="text-black font-press-start text-xs mt-3 -rotate-45">
                                    {segment.label}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0 h-0 border-x-8 border-x-transparent border-t-[16px] border-t-brand-yellow z-10" />
            </div>

            <button
                onClick={handleSpin}
                disabled={isSpinning || credits < CREDIT_COSTS.SPIN_WHEEL}
                className="w-full max-w-xs p-3 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base font-press-start transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                {isSpinning ? 'กำลังหมุน...' : `หมุนวงล้อ (${CREDIT_COSTS.SPIN_WHEEL} เครดิต)`}
            </button>
            {result !== null && (
                <p className="font-press-start text-lg text-brand-lime animate-ping-once" role="status">
                    {result > 0 ? `คุณได้รับ ${result} เครดิต!` : 'โชคไม่ดี! ลองอีกครั้ง!'}
                </p>
            )}
        </div>
    );
};