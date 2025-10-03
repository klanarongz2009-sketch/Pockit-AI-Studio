import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader, PageWrapper } from './PageComponents';
import * as audioService from '../services/audioService';

interface MagicButtonPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    addCredits: (amount: number) => void;
}

export const MagicButtonPage: React.FC<MagicButtonPageProps> = ({ onClose, playSound, addCredits }) => {
    const [pressCount, setPressCount] = useState(0);

    const handlePress = useCallback(() => {
        addCredits(1);
        setPressCount(prevCount => prevCount + 1);
    }, [addCredits]);

    return (
        <PageWrapper className="justify-start">
            <PageHeader title="ปุ่มมหัศจรรย์" onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex-grow flex flex-col items-center justify-center gap-12 p-4">
                <button
                    onClick={handlePress}
                    onMouseEnter={() => playSound(audioService.playHover)}
                    aria-label="กดปุ่มมหัศจรรย์"
                    className="w-48 h-48 bg-brand-magenta border-8 border-brand-light shadow-pixel transition-all hover:bg-pink-500 active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] focus:outline-none focus:ring-4 focus:ring-brand-yellow focus:ring-offset-4 focus:ring-offset-black"
                >
                    <span className="font-press-start text-4xl text-white drop-shadow-[3px_3px_0_#000]">
                        กด!
                    </span>
                </button>
                <div className="text-center">
                    <p 
                        className="text-xl text-brand-cyan"
                        aria-live="polite"
                    >
                        คุณกดปุ่มไปแล้ว
                        <br />
                        <span className="text-4xl text-brand-yellow">{pressCount.toLocaleString('th-TH')}</span>
                        <br />
                        ครั้ง
                    </p>
                    <p className="font-sans text-sm text-brand-light/80 mt-2">
                        และได้รับ <strong className="text-brand-yellow">{pressCount.toLocaleString('th-TH')}</strong> เครดิต!
                    </p>
                </div>
            </main>
        </PageWrapper>
    );
};
