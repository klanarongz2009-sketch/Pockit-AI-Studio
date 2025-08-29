
import React, { useState } from 'react';
import { useCredits } from '../contexts/CreditContext';
import { EarnCreditsModal } from './EarnCreditsModal';
import { CoinsIcon } from './icons/CoinsIcon';
import * as audioService from '../services/audioService';
import { CurrentPage } from '../App';
import { PaletteIcon } from './icons/PaletteIcon';
import { GamepadIcon } from './icons/GamepadIcon';
import { SpeakerOnIcon } from './icons/SpeakerOnIcon';
import { SpeakerOffIcon } from './icons/SpeakerOffIcon';
import { InfoIcon } from './icons/InfoIcon';

interface GlobalLayoutProps {
    children: React.ReactNode;
    playSound: (player: () => void) => void;
    currentPage: CurrentPage;
    onSetPage: (page: CurrentPage) => void;
    isSoundOn: boolean;
    onToggleSound: () => void;
    onOpenAbout: () => void;
}

const HeaderNavButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
    playSound: () => void;
}> = ({ label, icon, isActive, onClick, playSound }) => (
    <button
        onClick={onClick}
        onMouseEnter={playSound}
        className={`flex items-center justify-center gap-2 px-2 sm:px-3 h-10 border-2 transition-colors ${isActive ? 'bg-brand-yellow text-black border-black' : 'bg-black/50 border-brand-light text-brand-light hover:bg-brand-cyan/20'}`}
        aria-current={isActive ? 'page' : undefined}
    >
        {icon}
        <span className="font-press-start text-xs hidden sm:inline">{label}</span>
    </button>
);

export const GlobalLayout: React.FC<GlobalLayoutProps> = ({ 
    children, 
    playSound,
    currentPage,
    onSetPage,
    isSoundOn,
    onToggleSound,
    onOpenAbout
}) => {
    const { credits, loading: creditsLoading } = useCredits();
    const [isEarnCreditsModalOpen, setIsEarnCreditsModalOpen] = useState(false);

    return (
        <>
            <EarnCreditsModal isOpen={isEarnCreditsModalOpen} onClose={() => setIsEarnCreditsModalOpen(false)} />
            
            <header role="banner" className="fixed top-0 left-0 right-0 h-16 bg-black border-b-4 border-brand-light flex items-center justify-between px-2 sm:px-4 z-50">
                <div className="flex items-center gap-2 sm:gap-4">
                     <h1 className="text-base sm:text-xl text-brand-yellow font-press-start drop-shadow-[2px_2px_0_#000] hidden sm:block">
                        จักรวาล AI
                    </h1>
                    <nav className="flex items-center gap-1 sm:gap-2" aria-label="การนำทางหลัก">
                        <HeaderNavButton
                            label="สร้างภาพ"
                            icon={<PaletteIcon className="w-5 h-5" />}
                            isActive={currentPage === 'imageGenerator'}
                            onClick={() => onSetPage('imageGenerator')}
                            playSound={() => playSound(audioService.playHover)}
                        />
                        <HeaderNavButton
                            label="AI โซน"
                            icon={<GamepadIcon className="w-5 h-5" />}
                            isActive={currentPage === 'minigameHub'}
                            onClick={() => onSetPage('minigameHub')}
                            playSound={() => playSound(audioService.playHover)}
                        />
                    </nav>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                     <button
                        onClick={() => {
                            playSound(audioService.playClick);
                            setIsEarnCreditsModalOpen(true);
                        }}
                        onMouseEnter={() => playSound(audioService.playHover)}
                        aria-label="รับเครดิตเพิ่ม"
                        className="h-10 flex items-center justify-center gap-2 px-2 sm:px-3 bg-black/70 border-2 border-brand-light text-brand-light hover:bg-brand-yellow hover:text-black transition-colors"
                    >
                        <CoinsIcon className="w-5 h-5 text-brand-yellow" />
                        <span className="font-press-start text-xs sm:text-sm">{creditsLoading ? '...' : credits.toFixed(0)}</span>
                        <span className="font-sans text-lg hidden sm:inline">+</span>
                    </button>

                    <button
                        onClick={onOpenAbout}
                        onMouseEnter={() => playSound(audioService.playHover)}
                        aria-label="เกี่ยวกับแอปพลิเคชัน"
                        className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-black/70 border-2 border-brand-light text-brand-light hover:bg-brand-yellow hover:text-black transition-colors"
                    >
                        <InfoIcon className="w-5 h-5" />
                    </button>

                     <button
                        onClick={onToggleSound}
                        onMouseEnter={() => playSound(audioService.playHover)}
                        aria-label={isSoundOn ? "ปิดเสียงประกอบ" : "เปิดเสียงประกอบ"}
                        className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-black/70 border-2 border-brand-light text-brand-light hover:bg-brand-yellow hover:text-black transition-colors"
                    >
                        {isSoundOn ? <SpeakerOnIcon className="w-5 h-5" /> : <SpeakerOffIcon className="w-5 h-5" />}
                    </button>
                </div>
            </header>
            
            {children}
        </>
    );
};