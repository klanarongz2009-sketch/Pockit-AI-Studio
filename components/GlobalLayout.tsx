import React, { useState } from 'react';
import { useCredits } from '../contexts/CreditContext';
import { EarnCreditsModal } from './EarnCreditsModal';
import { CoinsIcon } from './icons/CoinsIcon';
import * as audioService from '../services/audioService';

interface GlobalLayoutProps {
    children: React.ReactNode;
    playSound: (player: () => void) => void;
}

export const GlobalLayout: React.FC<GlobalLayoutProps> = ({ children, playSound }) => {
    const { credits, loading: creditsLoading } = useCredits();
    const [isEarnCreditsModalOpen, setIsEarnCreditsModalOpen] = useState(false);

    return (
        <div className="relative h-screen w-screen bg-black">
            <EarnCreditsModal isOpen={isEarnCreditsModalOpen} onClose={() => setIsEarnCreditsModalOpen(false)} />
            
            <header className="fixed top-4 right-4 flex items-center gap-2 z-50">
                 <button
                    onClick={() => {
                        playSound(audioService.playClick);
                        setIsEarnCreditsModalOpen(true);
                    }}
                    onMouseEnter={() => playSound(audioService.playHover)}
                    aria-label="รับเครดิตเพิ่ม"
                    className="h-10 flex items-center justify-center gap-2 px-3 bg-black/70 border-2 border-brand-light text-brand-light hover:bg-brand-yellow hover:text-black transition-colors"
                >
                    <CoinsIcon className="w-5 h-5 text-brand-yellow" />
                    <span className="font-press-start text-sm">{creditsLoading ? '...' : credits.toFixed(0)}</span>
                    <span className="font-sans text-lg">+</span>
                </button>
            </header>
            
            {children}
        </div>
    );
};