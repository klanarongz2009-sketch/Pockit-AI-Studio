
import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as audioService from './services/audioService';
import { preloadAllAssets } from './services/assetLoader';
import * as preferenceService from './services/preferenceService';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
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
import { CreditCenterPage } from './components/CreditCenterPage';
import { LoadingSpinner } from './components/LoadingSpinner';


export type CurrentPage = 'home' | 'minigameHub' | 'aiChat' | 'article' | 'offlineAi';
type AppState = 'intro' | 'startScreen' | 'mainApp';

const MainApp: React.FC = () => {
    const { isThemeLoaded } = useTheme();
    const { isLoaded: isLangLoaded } = useLanguage();

    const [isSoundOn, setIsSoundOn] = useState(true);
    const [uiAnimations, setUiAnimations] = useState(true);
    const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
    
    const [currentPage, setCurrentPage] = useState<CurrentPage>('home');
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [appState, setAppState] = useState<AppState>('intro');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCreditCenterOpen, setIsCreditCenterOpen] = useState(false);
    
    const audioInitialized = useRef(false);

    useEffect(() => {
        const loadPrefs = async () => {
            const [soundPref, animPref] = await Promise.all([
                preferenceService.getPreference('isSoundOn', true),
                preferenceService.getPreference('uiAnimations', true)
            ]);
            setIsSoundOn(soundPref);
            setUiAnimations(animPref);
            setIsLoadingPrefs(false);
        };
        loadPrefs();
    }, []);

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
                if (await audioService.initAudio()) {
                    audioService.startBackgroundMusic(currentPage);
                    audioService.setMusicVolume(isSoundOn ? 0.5 : 0);
                }
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
        if (isSettingsOpen || isCreditCenterOpen) {
            document.body.classList.add('modal-page-active');
        } else {
            document.body.classList.remove('modal-page-active');
        }
    }, [isSettingsOpen, isCreditCenterOpen]);

    // Effect for UI animations
    useEffect(() => {
        if (!isLoadingPrefs) {
            document.body.classList.toggle('animations-disabled', !uiAnimations);
        }
    }, [uiAnimations, isLoadingPrefs]);

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

    const handleToggleSound = useCallback(async (): Promise<void> => {
        const newIsSoundOn = !isSoundOn;
        playSound(audioService.playToggle);
        setIsSoundOn(newIsSoundOn);
        await preferenceService.setPreference('isSoundOn', newIsSoundOn);
        audioService.setMusicVolume(newIsSoundOn ? 0.5 : 0);
    }, [isSoundOn, playSound]);
    
    const handleUiAnimationsChange = useCallback(async (enabled: boolean) => {
        setUiAnimations(enabled);
        await preferenceService.setPreference('uiAnimations', enabled);
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
    
    const openCreditCenter = useCallback((): void => {
        playSound(audioService.playClick);
        setIsCreditCenterOpen(true);
    }, [playSound]);

    const closeCreditCenter = useCallback((): void => {
        playSound(audioService.playCloseModal);
        setIsCreditCenterOpen(false);
    }, [playSound]);
    
    if (!isThemeLoaded || !isLangLoaded || isLoadingPrefs) {
        return (
            <div className="fixed inset-0 bg-background z-[200] flex items-center justify-center">
                <LoadingSpinner text="Connecting to Cloud..." />
            </div>
        );
    }

    if (appState === 'intro') {
        return <Intro onSequenceComplete={handleIntroSequenceComplete} />;
    }

    if (appState === 'startScreen') {
        return (
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
        );
    }
    

    return (
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

          {isCreditCenterOpen && (
            <CreditCenterPage
                onClose={closeCreditCenter}
                playSound={playSound}
            />
          )}
          
          {!isSettingsOpen && !isCreditCenterOpen && (
            <GlobalLayout
              currentPage={currentPage}
              isOnline={isOnline}
              onSetPage={handleSetPage}
              playSound={playSound}
              onOpenCreditCenter={openCreditCenter}
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
    );
};

export const App: React.FC = () => (
    <LanguageProvider>
        <ThemeProvider>
            <MainApp />
        </ThemeProvider>
    </LanguageProvider>
);
