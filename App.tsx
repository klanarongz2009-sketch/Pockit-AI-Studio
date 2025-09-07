import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as audioService from './services/audioService';
import { preloadAllAssets } from './services/assetLoader';
import * as preferenceService from './services/preferenceService';
import { CreditProvider } from './contexts/CreditContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Component Imports
import { Intro } from './components/Intro';
import { AboutPage } from './components/AboutPage';
import { GlobalLayout } from './components/GlobalLayout';
import { ImageGeneratorPage } from './components/ImageGeneratorPage';
import { MinigameHubPage } from './components/MinigameHubPage';
import { AiChatPage } from './components/AiChatPage';
import { ArtGalleryPage } from './components/ArtGalleryPage';


export type CurrentPage = 'imageGenerator' | 'minigameHub' | 'artGallery';

export const App: React.FC = () => {
    const [isSoundOn, setIsSoundOn] = useState(() => preferenceService.getPreference('isSoundOn', true));
    const [currentPage, setCurrentPage] = useState<CurrentPage>('imageGenerator');
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showIntro, setShowIntro] = useState(!sessionStorage.getItem('introShown'));
    const [isAboutPageOpen, setIsAboutPageOpen] = useState(false);
    const [isEarnCreditsModalOpen, setIsEarnCreditsModalOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    
    const audioInitialized = useRef(false);

    // Effect for online/offline status
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
    
    // Effect for preloading assets and initializing audio
    useEffect(() => {
        preloadAllAssets();

        const initAudioOnce = () => {
            if (!audioInitialized.current) {
                audioInitialized.current = true;
                audioService.initAudio();
                audioService.startBackgroundMusic();
                // Set initial music volume based on saved preference
                audioService.setMusicVolume(preferenceService.getPreference('isSoundOn', true) ? 0.1 : 0);
                // Clean up listeners after first interaction
                window.removeEventListener('click', initAudioOnce);
                window.removeEventListener('keydown', initAudioOnce);
            }
        };

        window.addEventListener('click', initAudioOnce);
        window.addEventListener('keydown', initAudioOnce);

        return () => {
            window.removeEventListener('click', initAudioOnce);
            window.removeEventListener('keydown', initAudioOnce);
        };
    }, []);
    
    // Effect to toggle body class for modal pages
    useEffect(() => {
        if (isAboutPageOpen || isEarnCreditsModalOpen || isChatOpen) {
            document.body.classList.add('modal-page-active');
        } else {
            document.body.classList.remove('modal-page-active');
        }
    }, [isAboutPageOpen, isEarnCreditsModalOpen, isChatOpen]);


    const playSound = useCallback((player: () => void): void => {
        if (isSoundOn) {
            player();
        }
    }, [isSoundOn]);

    const handleSetPage = useCallback((page: CurrentPage): void => {
        playSound(audioService.playClick);
        setCurrentPage(page);
    }, [playSound]);

    const handleToggleSound = useCallback((): void => {
        playSound(audioService.playToggle);
        const newIsSoundOn = !isSoundOn;
        setIsSoundOn(newIsSoundOn);
        preferenceService.setPreference('isSoundOn', newIsSoundOn);
        audioService.setMusicVolume(newIsSoundOn ? 0.1 : 0);
    }, [isSoundOn, playSound]);

    const handleIntroComplete = useCallback((): void => {
        sessionStorage.setItem('introShown', 'true');
        setShowIntro(false);
    }, []);

    const openAboutPage = useCallback((): void => {
        playSound(audioService.playClick);
        setIsAboutPageOpen(true);
    }, [playSound]);

    const closeAboutPage = useCallback((): void => {
        playSound(audioService.playCloseModal);
        setIsAboutPageOpen(false);
    }, [playSound]);

    const openChat = useCallback((): void => {
        playSound(audioService.playClick);
        setIsChatOpen(true);
    }, [playSound]);

    const closeChat = useCallback((): void => {
        playSound(audioService.playCloseModal);
        setIsChatOpen(false);
    }, [playSound]);
    
    if (showIntro) {
        return <Intro onComplete={handleIntroComplete} />;
    }
    
    return (
      <ThemeProvider>
        <CreditProvider>
          <div className="h-screen w-screen flex flex-col bg-background text-text-primary">
            {isAboutPageOpen && (
              <AboutPage 
                  isOnline={isOnline}
                  onClose={closeAboutPage}
                  playSound={playSound}
              />
            )}

            {isChatOpen && (
              <AiChatPage
                isOnline={isOnline}
                onClose={closeChat}
                playSound={playSound}
              />
            )}
            
            {!isAboutPageOpen && !isChatOpen && (
              <GlobalLayout
                currentPage={currentPage}
                isSoundOn={isSoundOn}
                isOnline={isOnline}
                onSetPage={handleSetPage}
                onToggleSound={handleToggleSound}
                onOpenAbout={openAboutPage}
                onOpenChat={openChat}
                playSound={playSound}
                isEarnCreditsModalOpen={isEarnCreditsModalOpen}
                setIsEarnCreditsModalOpen={setIsEarnCreditsModalOpen}
              >
                  <main id="main-content" role="main" className={`flex-grow overflow-y-auto ${isOnline ? 'pt-16' : 'pt-20'}`}>
                    {currentPage === 'imageGenerator' && (
                      <ImageGeneratorPage 
                        isOnline={isOnline}
                        playSound={playSound}
                      />
                    )}
                    {currentPage === 'minigameHub' && (
                      <MinigameHubPage
                        isOnline={isOnline}
                        playSound={playSound}
                      />
                    )}
                    {currentPage === 'artGallery' && (
                        <ArtGalleryPage
                            isOnline={isOnline}
                            playSound={playSound}
                        />
                    )}
                  </main>
              </GlobalLayout>
            )}
          </div>
        </CreditProvider>
      </ThemeProvider>
    );
};
