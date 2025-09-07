import React from 'react';
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
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { ChatIcon } from './icons/ChatIcon';
import { GalleryIcon } from './icons/GalleryIcon';

interface GlobalLayoutProps {
    children: React.ReactNode;
    playSound: (player: () => void) => void;
    currentPage: CurrentPage;
    onSetPage: (page: CurrentPage) => void;
    isSoundOn: boolean;
    onToggleSound: () => void;
    onOpenAbout: () => void;
    onOpenChat: () => void;
    isOnline: boolean;
    isEarnCreditsModalOpen: boolean;
    setIsEarnCreditsModalOpen: (isOpen: boolean) => void;
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
        className={`flex items-center justify-center gap-2 px-2 sm:px-3 h-10 border-2 transition-all hover:-translate-y-px ${isActive ? 'bg-brand-yellow text-black border-black' : 'bg-surface-primary border-border-primary text-text-primary hover:bg-brand-cyan/20'}`}
        aria-current={isActive ? 'page' : undefined}
    >
        {icon}
        <span className="font-press-start text-xs hidden sm:inline">{label}</span>
    </button>
);

const LayoutComponent: React.FC<GlobalLayoutProps> = ({ 
    children, 
    playSound,
    currentPage,
    onSetPage,
    isSoundOn,
    onToggleSound,
    onOpenAbout,
    onOpenChat,
    isOnline,
    isEarnCreditsModalOpen,
    setIsEarnCreditsModalOpen
}) => {
    const { credits, loading: creditsLoading } = useCredits();
    const { theme, toggleTheme } = useTheme();

    return (
        <>
            <EarnCreditsModal isOpen={isEarnCreditsModalOpen} onClose={() => setIsEarnCreditsModalOpen(false)} />

            {!isOnline && (
                <div role="status" className="fixed top-16 left-0 right-0 bg-brand-magenta text-white text-center font-press-start text-xs py-1 z-40 animate-page-enter">
                    คุณกำลังออฟไลน์ ฟีเจอร์ AI ถูกปิดใช้งาน
                </div>
            )}
            
            <header role="banner" className="fixed top-0 left-0 right-0 h-16 bg-background border-b-4 border-border-primary flex items-center justify-between px-2 sm:px-4 z-50">
                <div className="flex items-center gap-2 sm:gap-4">
                     <h1 className="text-base sm:text-xl text-brand-yellow font-press-start drop-shadow-[2px_2px_0_var(--color-text-primary)] hidden sm:block">
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
                            label="แกลเลอรี"
                            icon={<GalleryIcon className="w-5 h-5" />}
                            isActive={currentPage === 'artGallery'}
                            onClick={() => onSetPage('artGallery')}
                            playSound={() => playSound(audioService.playHover)}
                        />
                        <HeaderNavButton
                            label="AI โซน"
                            icon={<GamepadIcon className="w-5 h-5" />}
                            isActive={currentPage === 'minigameHub'}
                            onClick={() => onSetPage('minigameHub')}
                            playSound={() => playSound(audioService.playHover)}
                        />
                         <button
                            onClick={onOpenChat}
                            onMouseEnter={() => playSound(audioService.playHover)}
                            className="flex items-center justify-center gap-2 px-2 sm:px-3 h-10 border-2 transition-all bg-surface-primary border-border-primary text-text-primary hover:bg-brand-cyan/20 hover:-translate-y-px"
                            aria-label="เปิด AI Chat"
                        >
                            <ChatIcon className="w-5 h-5" />
                            <span className="font-press-start text-xs hidden sm:inline">AI Chat</span>
                        </button>
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
                        className="h-10 flex items-center justify-center gap-2 px-2 sm:px-3 bg-surface-primary border-2 border-border-primary text-text-primary hover:bg-brand-yellow hover:text-text-inverted transition-all hover:-translate-y-px"
                    >
                        <CoinsIcon className="w-5 h-5 text-brand-yellow" />
                        <span className="font-press-start text-xs sm:text-sm">{creditsLoading ? '...' : credits.toFixed(0)}</span>
                        <span className="font-sans text-lg hidden sm:inline">+</span>
                    </button>
                    
                    <button
                        onClick={() => { playSound(audioService.playToggle); toggleTheme(); }}
                        onMouseEnter={() => playSound(audioService.playHover)}
                        aria-label={theme === 'dark' ? "เปลี่ยนเป็นธีมสว่าง" : "เปลี่ยนเป็นธีมมืด"}
                        className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-surface-primary border-2 border-border-primary text-text-primary hover:bg-brand-yellow hover:text-text-inverted transition-all hover:-translate-y-px"
                    >
                        {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                    </button>

                    <button
                        onClick={onOpenAbout}
                        onMouseEnter={() => playSound(audioService.playHover)}
                        aria-label="เกี่ยวกับแอปพลิเคชัน"
                        className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-surface-primary border-2 border-border-primary text-text-primary hover:bg-brand-yellow hover:text-text-inverted transition-all hover:-translate-y-px"
                    >
                        <InfoIcon className="w-5 h-5" />
                    </button>

                     <button
                        onClick={onToggleSound}
                        onMouseEnter={() => playSound(audioService.playHover)}
                        aria-label={isSoundOn ? "ปิดเสียงประกอบ" : "เปิดเสียงประกอบ"}
                        className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-surface-primary border-2 border-border-primary text-text-primary hover:bg-brand-yellow hover:text-text-inverted transition-all hover:-translate-y-px"
                    >
                        {isSoundOn ? <SpeakerOnIcon className="w-5 h-5" /> : <SpeakerOffIcon className="w-5 h-5" />}
                    </button>
                </div>
            </header>
            
            {children}
        </>
    );
};

export const GlobalLayout: React.FC<GlobalLayoutProps> = (props) => {
    return (
        <LayoutComponent {...props} />
    );
};
