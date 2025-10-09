import React, { useState } from 'react';
import * as audioService from '../services/audioService';
import { CurrentPage } from '../App';
import { SettingsIcon } from './icons/SettingsIcon';
import { useLanguage } from '../contexts/LanguageContext';
import { UpdateInfoPage } from './UpdateInfoPage';

interface GlobalLayoutProps {
    children: React.ReactNode;
    playSound: (player: () => void) => void;
    currentPage: CurrentPage;
    onSetPage: (page: CurrentPage) => void;
    onOpenSettings: () => void;
    isOnline: boolean;
}

const LayoutComponent: React.FC<GlobalLayoutProps> = ({ 
    children, 
    playSound,
    currentPage,
    onSetPage,
    onOpenSettings,
    isOnline,
}) => {
    const { t } = useLanguage();
    const [isUpdateInfoOpen, setIsUpdateInfoOpen] = useState(false);

    return (
        <>
            {isUpdateInfoOpen && <UpdateInfoPage onClose={() => setIsUpdateInfoOpen(false)} />}
            
            {!isOnline && (
                <div role="status" className="fixed top-16 left-0 right-0 bg-brand-magenta text-white text-center font-press-start text-xs py-1 z-40 animate-page-enter">
                    {t('offline.message')}
                </div>
            )}
            
            <header role="banner" className="fixed top-0 left-0 right-0 h-16 bg-background border-b-4 border-border-primary flex items-center justify-between px-2 sm:px-4 z-30">
                <div className="flex items-center gap-2 sm:gap-4">
                     {currentPage !== 'home' ? (
                         <button
                            onClick={() => onSetPage('home')}
                            onMouseEnter={() => playSound(audioService.playHover)}
                            aria-label={t('header.back')}
                            className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-surface-primary border-2 border-border-primary text-text-primary hover:bg-brand-yellow hover:text-text-inverted transition-all hover:-translate-y-px"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6" style={{ imageRendering: 'pixelated' }}>
                                <path d="M15 11H5V13H15V16L20 12L15 8V11Z" transform="rotate(180 12.5 12)" />
                            </svg>
                        </button>
                     ) : (
                        // Placeholder to prevent layout shift on home page
                        <div className="w-10 h-10 flex-shrink-0" />
                     )}
                     <h1 className="text-base sm:text-xl text-brand-cyan font-press-start">
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