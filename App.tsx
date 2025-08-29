
import React, { useState, useCallback, useEffect } from 'react';
import * as audioService from './services/audioService';
import { ImageGeneratorPage } from './components/ImageGeneratorPage';
import { MinigameHubPage } from './components/MinigameHubPage';
import { Intro } from './components/Intro';
import { GlobalLayout } from './components/GlobalLayout';
import { AboutPage } from './components/AboutPage';

export type CurrentPage = 'imageGenerator' | 'minigameHub';

export const App: React.FC = () => {
    const [isSoundOn, setIsSoundOn] = useState(true);
    const [currentPage, setCurrentPage] = useState<CurrentPage>('imageGenerator');
    const [isOnline, setIsOnline] = useState(() => navigator.onLine);
    const [showIntro, setShowIntro] = useState(!sessionStorage.getItem('introShown'));
    const [isAboutPageOpen, setIsAboutPageOpen] = useState(false);

    // Online/Offline status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const playSound = useCallback((player: () => void) => {
        if (isSoundOn) {
            player();
        }
    }, [isSoundOn]);
    
    // Initialize audio on first user interaction and start background music
    useEffect(() => {
        const init = () => {
            audioService.initAudio();
            audioService.startBackgroundMusic();
            window.removeEventListener('click', init);
            window.removeEventListener('keydown', init);
        };
        window.addEventListener('click', init);
        window.addEventListener('keydown', init);
        return () => {
            window.removeEventListener('click', init);
            window.removeEventListener('keydown', init);
        };
    }, []);

    // Control background music volume
    useEffect(() => {
        audioService.setMusicVolume(isSoundOn ? 0.1 : 0);
    }, [isSoundOn]);
    
    const handleSetPage = (page: CurrentPage) => {
        playSound(audioService.playClick);
        setCurrentPage(page);
    };
    
    const handleToggleSound = () => {
        playSound(audioService.playToggle);
        setIsSoundOn(prev => !prev);
    };

    const handleIntroComplete = () => {
        sessionStorage.setItem('introShown', 'true');
        setShowIntro(false);
    };

    if (showIntro) {
        return <Intro onComplete={handleIntroComplete} />;
    }

    if (isAboutPageOpen) {
        return (
            <AboutPage 
                onClose={() => {
                    playSound(audioService.playCloseModal);
                    setIsAboutPageOpen(false);
                }}
                playSound={playSound}
                isOnline={isOnline}
            />
        );
    }

    const renderCurrentPage = () => {
        switch (currentPage) {
            case 'minigameHub':
                return <MinigameHubPage playSound={playSound} isOnline={isOnline} />;
            case 'imageGenerator':
            default:
                return <ImageGeneratorPage playSound={playSound} isOnline={isOnline} />;
        }
    };

    return (
        <GlobalLayout
            playSound={playSound}
            currentPage={currentPage}
            onSetPage={handleSetPage}
            isSoundOn={isSoundOn}
            onToggleSound={handleToggleSound}
            onOpenAbout={() => {
                playSound(audioService.playClick);
                setIsAboutPageOpen(true);
            }}
        >
            <div className="h-screen w-screen flex flex-col bg-black text-brand-light">
                <main id="main-content" role="main" className="flex-grow overflow-y-auto pt-16"> {/* Padding for header */}
                    {renderCurrentPage()}
                </main>
            </div>
        </GlobalLayout>
    );
};