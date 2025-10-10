import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as audioService from './services/audioService';
import { preloadAllAssets } from './services/assetLoader';
import * as preferenceService from './services/preferenceService';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { CreditProvider } from './contexts/CreditContext';

// Component Imports
import { Intro } from './components/Intro';
import { StartScreen } from './components/StartScreen';
import { GlobalLayout } from './components/GlobalLayout';
import { HomePage } from './components/HomePage';
import { MinigameHubPage } from './components/MinigameHubPage';
import { AiChatPage } from './components/AiChatPage';
import { ArtGalleryPage } from './components/ArtGalleryPage';
import { SettingsPage } from './components/SettingsPage';
import { ALL_AI_MODELS } from './services/aiModels';
import { ArticlePage } from './components/ArticlePage';
import { OfflineAiPage } from './components/OfflineAiPage';


export type CurrentPage = 'home' | 'minigameHub' | 'aiChat' | 'article' | 'offlineAi';
type AppState = 'intro' | 'startScreen' | 'mainApp';

export const App: React.FC = () => {
    const [isSoundOn, setIsSoundOn] = useState(() => preferenceService.getPreference('isSoundOn', true));
    const [currentPage, setCurrentPage] = useState<CurrentPage>('home');
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [appState, setAppState] = useState<AppState>('intro');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [uiAnimations, setUiAnimations] = useState(() => preferenceService.getPreference('uiAnimations', true));
    
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

        const initAudioOnce = async () => {
            if (!audioInitialized.current) {
                audioInitialized.current = true;
                const success = await audioService.initAudio();
                if (success) {
                    audioService.startBackgroundMusic(currentPage);
                    // Set initial music volume based on saved preference, using a fixed volume level
                    audioService.setMusicVolume(isSoundOn ? 0.5 : 0);
                }
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
    }, [isSoundOn, currentPage]);
    
    // Effect to toggle body class for modal pages
    useEffect(() => {
        if (isSettingsOpen) {
            document.body.classList.add('modal-page-active');
        } else {
            document.body.classList.remove('modal-page-active');
        }
    }, [isSettingsOpen]);

    // Effect for UI animations
    useEffect(() => {
        document.body.classList.toggle('animations-disabled', !uiAnimations);
    }, [uiAnimations]);

    // Effect for changing background music on page change
    useEffect(() => {
        if (audioInitialized.current && isSoundOn) {
            audioService.changeBackgroundMusic(currentPage);
        }
    }, [currentPage, isSoundOn]);


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
        const newIsSoundOn = !isSoundOn;
        playSound(audioService.playToggle);
        setIsSoundOn(newIsSoundOn);
        preferenceService.setPreference('isSoundOn', newIsSoundOn);
        audioService.setMusicVolume(newIsSoundOn ? 0.5 : 0);
    }, [isSoundOn, playSound]);
    
    const handleUiAnimationsChange = useCallback((enabled: boolean) => {
        setUiAnimations(enabled);
        preferenceService.setPreference('uiAnimations', enabled);
    }, []);

    const handleIntroSequenceComplete = useCallback((): void => {
        setAppState('startScreen');
    }, []);

    const handleStartApp = useCallback((): void => {
        playSound(audioService.playSuccess);
        setAppState('mainApp');
    }, [playSound]);

    const openSettingsPage = useCallback((): void => {
        playSound(audioService.playClick);
        setIsSettingsOpen(true);
    }, [playSound]);

    const closeSettingsPage = useCallback((): void => {
        playSound(audioService.playCloseModal);
        setIsSettingsOpen(false);
    }, [playSound]);
    
    if (appState === 'intro') {
        return <Intro onSequenceComplete={handleIntroSequenceComplete} />;
    }

    if (appState === 'startScreen') {
        return (
            <LanguageProvider>
                <ThemeProvider>
                    <div className="h-screen w-screen flex flex-col bg-background text-text-primary">
                        {isSettingsOpen && (
                            <SettingsPage
                                onClose={closeSettingsPage}
                                playSound={playSound}
                                isSoundOn={isSoundOn}
                                onToggleSound={handleToggleSound}
                                uiAnimations={uiAnimations}
                                onUiAnimationsChange={handleUiAnimationsChange}
                                aiModels={ALL_AI_MODELS}
                            />
                        )}
                        <StartScreen onStartApp={handleStartApp} />
                    </div>
                </ThemeProvider>
            </LanguageProvider>
        );
    }
    

    return (
      <LanguageProvider>
        <ThemeProvider>
          <CreditProvider>
            <div className="h-screen w-screen flex flex-col bg-background text-text-primary">
              {isSettingsOpen && (
                <SettingsPage 
                  onClose={closeSettingsPage} 
                  playSound={playSound}
                  isSoundOn={isSoundOn}
                  onToggleSound={handleToggleSound}
                  uiAnimations={uiAnimations}
                  onUiAnimationsChange={handleUiAnimationsChange}
                  aiModels={ALL_AI_MODELS}
                />
              )}
              
              {!isSettingsOpen && (
                <GlobalLayout
                  currentPage={currentPage}
                  isOnline={isOnline}
                  onSetPage={handleSetPage}
                  playSound={playSound}
                >
                    <main id="main-content" role="main" className={`flex-grow overflow-y-auto ${isOnline ? 'pt-16' : 'pt-20'}`}>
                      {currentPage === 'home' && (
                        <HomePage
                          onSetPage={handleSetPage}
                          onOpenSettings={openSettingsPage}
                        />
                      )}
                      {currentPage === 'minigameHub' && (
                        <MinigameHubPage
                          isOnline={isOnline}
                          playSound={playSound}
                        />
                      )}
                      {currentPage === 'aiChat' && (
                          <AiChatPage
                              isOnline={isOnline}
                              playSound={playSound}
                          />
                      )}
                      {currentPage === 'offlineAi' && (
                          <OfflineAiPage
                              playSound={playSound}
                          />
                      )}
                      {currentPage === 'article' && (
                          <ArticlePage
                              playSound={playSound}
                          />
                      )}
                    </main>
                </GlobalLayout>
              )}
            </div>
          </CreditProvider>
        </ThemeProvider>
      </LanguageProvider>
    );
};