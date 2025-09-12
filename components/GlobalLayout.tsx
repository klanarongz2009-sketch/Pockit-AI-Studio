import React from 'react';
import { useCredits } from '../contexts/CreditContext';
import { CoinsIcon } from './icons/CoinsIcon';
import * as audioService from '../services/audioService';
import { CurrentPage } from '../App';
import { PaletteIcon } from './icons/PaletteIcon';
import { GamepadIcon } from './icons/GamepadIcon';
import { ChatIcon } from './icons/ChatIcon';
import { GalleryIcon } from './icons/GalleryIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { MenuIcon } from './icons/MenuIcon'; // New Icon

interface GlobalLayoutProps {
    children: React.ReactNode;
    playSound: (player: () => void) => void;
    currentPage: CurrentPage;
    onSetPage: (page: CurrentPage) => void;
    onOpenSettings: () => void;
    isOnline: boolean;
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
}

const SidebarNavButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
    playSound: () => void;
}> = ({ label, icon, isActive, onClick, playSound }) => (
    <button
        onClick={onClick}
        onMouseEnter={playSound}
        className={`flex items-center w-full gap-4 px-4 py-3 text-lg transition-colors ${isActive ? 'bg-brand-yellow text-black' : 'text-text-primary hover:bg-brand-cyan/20'}`}
        aria-current={isActive ? 'page' : undefined}
    >
        {icon}
        <span className="font-press-start">{label}</span>
    </button>
);

const LayoutComponent: React.FC<GlobalLayoutProps> = ({ 
    children, 
    playSound,
    currentPage,
    onSetPage,
    onOpenSettings,
    isOnline,
    isSidebarOpen,
    onToggleSidebar
}) => {
    const { credits, loading: creditsLoading } = useCredits();

    return (
        <>
            {/* Sidebar Overlay */}
            <div 
                className={`sidebar-overlay fixed inset-0 bg-black/60 z-40 ${isSidebarOpen ? 'open' : ''}`}
                onClick={onToggleSidebar}
                aria-hidden="true"
            />
            
            {/* Sidebar */}
            <aside className={`sidebar fixed top-0 left-0 h-full w-64 bg-background border-r-4 border-border-primary flex flex-col z-50 ${isSidebarOpen ? 'open' : ''}`}>
                <header className="flex items-center justify-between p-4 border-b-4 border-border-primary">
                     <h1 className="text-xl text-brand-yellow font-press-start drop-shadow-[2px_2px_0_var(--color-text-primary)]">
                        เมนู
                    </h1>
                </header>
                <nav className="flex-grow py-4" aria-label="การนำทางหลัก">
                    <SidebarNavButton
                        label="สร้างภาพ"
                        icon={<PaletteIcon className="w-6 h-6" />}
                        isActive={currentPage === 'imageGenerator'}
                        onClick={() => onSetPage('imageGenerator')}
                        playSound={() => playSound(audioService.playHover)}
                    />
                    <SidebarNavButton
                        label="แกลเลอรี"
                        icon={<GalleryIcon className="w-6 h-6" />}
                        isActive={currentPage === 'artGallery'}
                        onClick={() => onSetPage('artGallery')}
                        playSound={() => playSound(audioService.playHover)}
                    />
                    <SidebarNavButton
                        label="AI โซน"
                        icon={<GamepadIcon className="w-6 h-6" />}
                        isActive={currentPage === 'minigameHub'}
                        onClick={() => onSetPage('minigameHub')}
                        playSound={() => playSound(audioService.playHover)}
                    />
                     <SidebarNavButton
                        label="AI Chat"
                        icon={<ChatIcon className="w-6 h-6" />}
                        isActive={currentPage === 'aiChat'}
                        onClick={() => onSetPage('aiChat')}
                        playSound={() => playSound(audioService.playHover)}
                    />
                </nav>
            </aside>

            {!isOnline && (
                <div role="status" className="fixed top-16 left-0 right-0 bg-brand-magenta text-white text-center font-press-start text-xs py-1 z-40 animate-page-enter">
                    คุณกำลังออฟไลน์ ฟีเจอร์ AI ถูกปิดใช้งาน
                </div>
            )}
            
            <header role="banner" className="fixed top-0 left-0 right-0 h-16 bg-background border-b-4 border-border-primary flex items-center justify-between px-2 sm:px-4 z-30">
                <div className="flex items-center gap-2 sm:gap-4">
                     <button
                        onClick={onToggleSidebar}
                        onMouseEnter={() => playSound(audioService.playHover)}
                        aria-label="เปิดเมนู"
                        aria-expanded={isSidebarOpen}
                        className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-surface-primary border-2 border-border-primary text-text-primary hover:bg-brand-yellow hover:text-text-inverted transition-all hover:-translate-y-px"
                    >
                        <MenuIcon className="w-5 h-5" />
                    </button>
                     <h1 className="text-base sm:text-xl text-brand-yellow font-press-start drop-shadow-[2px_2px_0_var(--color-text-primary)]">
                        จักรวาล AI
                    </h1>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                     <button
                        aria-label={`เครดิตปัจจุบัน: ${creditsLoading ? '...' : credits.toFixed(0)}`}
                        className="h-10 flex items-center justify-center gap-2 px-2 sm:px-3 bg-surface-primary border-2 border-border-primary text-text-primary"
                    >
                        <CoinsIcon className="w-5 h-5 text-brand-yellow" />
                        <span className="font-press-start text-xs sm:text-sm">{creditsLoading ? '...' : credits.toFixed(0)}</span>
                    </button>
                    
                     <button
                        onClick={onOpenSettings}
                        onMouseEnter={() => playSound(audioService.playHover)}
                        aria-label="การตั้งค่า"
                        className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-surface-primary border-2 border-border-primary text-text-primary hover:bg-brand-yellow hover:text-text-inverted transition-all hover:-translate-y-px"
                    >
                        <SettingsIcon className="w-5 h-5" />
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