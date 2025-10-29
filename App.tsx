import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as audioService from './services/audioService';
import { preloadAllAssets } from './services/assetLoader';
import * as preferenceService from './services/preferenceService';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { CreditProvider } from './contexts/CreditContext';

// Component Imports
import { Intro } from './components/Intro';
import { GlobalLayout } from './components/GlobalLayout';
import { HomePage } from './components/HomePage';
import { MinigameHubPage } from './components/MinigameHubPage';
import { AiChatPage } from './components/AiChatPage';
import { ArtGalleryPage } from './components/ArtGalleryPage';
import { SettingsPage } from './components/SettingsPage';
import { ALL_AI_MODELS } from './services/aiModels';
import { ArticlePage } from './components/ArticlePage';
import { OnlineOfflineToolsPage } from './components/OnlineOfflineToolsPage';
import { CreditCenterPage } from './components/CreditCenterPage';
import { LoadingSpinner } from './components/LoadingSpinner';
import { StartScreen } from './components/StartScreen';
import { GemAiAppsPage } from './components/GemAiAppsPage';
import { ThirdPartyZonePage } from './components/ThirdPartyZonePage';


export type CurrentPage = 'home' | 'minigameHub' | 'aiChat' | 'article' | 'onlineOfflineTools' | 'thirdPartyZone' | 'gemAiApps';
type AppState = 'start' | 'intro' | 'mainApp';

const MainApp: React.FC = () => {
    const { isThemeLoaded } = useTheme();
    const { isLoaded: isLangLoaded } = useLanguage();

    const [isSoundOn, setIsSoundOn] = useState(true);
    const [uiAnimations, setUiAnimations] = useState(true);
    const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
    
    const [currentPage, setCurrentPage] = useState<CurrentPage>('home');
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [appState, setAppState] = useState<AppState>('start');
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
        preloadAllAssets();
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
    
    const handleStartApp = useCallback(async () => {
        if (appState !== 'start') return; // Prevent multiple calls
        if (!audioInitialized.current) {
            audioInitialized.current = true;
            if (await audioService.initAudio()) {
                const soundPref = await preferenceService.getPreference('isSoundOn', true);
                audioService.startBackgroundMusic(currentPage);
                audioService.setMusicVolume(soundPref ? 0.5 : 0);
            }
        }
        setAppState('intro');
    }, [appState, currentPage]);

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
        setAppState('mainApp');
    }, []);

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

    if (appState === 'start') {
        return <StartScreen onStartApp={handleStartApp} />;
    }

    if (appState === 'intro') {
        return <Intro onSequenceComplete={handleIntroSequenceComplete} />;
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
                  {currentPage === 'gemAiApps' && (
                    <GemAiAppsPage
                      onClose={() => handleSetPage('home')}
                      playSound={playSound}
                      isOnline={isOnline}
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
                  {currentPage === 'onlineOfflineTools' && (
                      <OnlineOfflineToolsPage
                          playSound={playSound}
                          onClose={() => handleSetPage('home')}
                      />
                  )}
                   {currentPage === 'thirdPartyZone' && (
                      <ThirdPartyZonePage
                          isOnline={isOnline}
                          playSound={playSound}
                          onClose={() => handleSetPage('home')}
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