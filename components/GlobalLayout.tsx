

import React, { useState } from 'react';
import * as audioService from '../services/audioService';
import { CurrentPage } from '../App';
import { PaletteIcon } from './icons/PaletteIcon';
import { GamepadIcon } from './icons/GamepadIcon';
import { ChatIcon } from './icons/ChatIcon';
import { GalleryIcon } from './icons/GalleryIcon';
import { ArticleIcon } from './ArticleIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { MenuIcon } from './icons/MenuIcon';
import { useLanguage } from '../contexts/LanguageContext';
import { UpdateIcon } from './icons/UpdateIcon';
import { UpdateInfoPage } from './UpdateInfoPage';
import { OfflineAiIcon } from './icons/OfflineAiIcon';

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
    const { t } = useLanguage();
    const [isUpdateInfoOpen, setIsUpdateInfoOpen] = useState(false);

    return (
        <>
            {isUpdateInfoOpen && <UpdateInfoPage onClose={() => setIsUpdateInfoOpen(false)} />}
            
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
                        {t('header.menu')}
                    </h1>
                </header>
                <nav className="flex-grow py-4" aria-label="การนำทางหลัก">
                    <SidebarNavButton
                        label={t('sidebar.aiZone')}
                        icon={<GamepadIcon className="w-6 h-6" />}
                        isActive={currentPage === 'minigameHub'}
                        onClick={() => onSetPage('minigameHub')}
                        playSound={() => playSound(audioService.playHover)}
                    />
                     <SidebarNavButton
                        label={t('sidebar.aiChat')}
                        icon={<ChatIcon className="w-6 h-6" />}
                        isActive={currentPage === 'aiChat'}
                        onClick={() => onSetPage('aiChat')}
                        playSound={() => playSound(audioService.playHover)}
                    />
                    <SidebarNavButton
                        label={t('sidebar.offlineAi')}
                        icon={<OfflineAiIcon className="w-6 h-6" />}
                        isActive={currentPage === 'offlineAi'}
                        onClick={() => onSetPage('offlineAi')}
                        playSound={() => playSound(audioService.playHover)}
                    />
                    <SidebarNavButton
                        label={t('sidebar.article')}
                        icon={<ArticleIcon className="w-6 h-6" />}
                        isActive={currentPage === 'article'}
                        onClick={() => onSetPage('article')}
                        playSound={() => playSound(audioService.playHover)}
                    />
                </nav>
                 <footer className="p-2 border-t-2 border-border-primary">
                    <button
                        onClick={() => setIsUpdateInfoOpen(true)}
                        className="flex items-center w-full gap-2 px-2 py-2 text-xs text-left text-text-secondary hover:text-brand-yellow transition-colors"
                    >
                        <UpdateIcon className="w-4 h-4" />
                        <span className="font-press-start">{t('sidebar.updateInfo')}</span>
                    </button>
                </footer>
            </aside>

            {!isOnline && (
                <div role="status" className="fixed top-16 left-0 right-0 bg-brand-magenta text-white text-center font-press-start text-xs py-1 z-40 animate-page-enter">
                    {t('offline.message')}
                </div>
            )}
            
            <header role="banner" className="fixed top-0 left-0 right-0 h-16 bg-background border-b-4 border-border-primary flex items-center justify-between px-2 sm:px-4 z-30">
                <div className="flex items-center gap-2 sm:gap-4">
                     <button
                        onClick={onToggleSidebar}
                        onMouseEnter={() => playSound(audioService.playHover)}
                        aria-label={t('header.menu')}
                        aria-expanded={isSidebarOpen}
                        className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-surface-primary border-2 border-border-primary text-text-primary hover:bg-brand-yellow hover:text-text-inverted transition-all hover:-translate-y-px"
                    >
                        <MenuIcon className="w-5 h-5" />
                    </button>
                     <h1 className="text-base sm:text-xl text-brand-yellow font-press-start drop-shadow-[2px_2px_0_var(--color-text-primary)]">
                        {t('header.title')}
                    </h1>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                     <button
                        onClick={onOpenSettings}
                        onMouseEnter={() => playSound(audioService.playHover)}
                        aria-label={t('header.settings')}
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