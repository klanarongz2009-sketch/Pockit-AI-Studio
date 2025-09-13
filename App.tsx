import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as audioService from './services/audioService';
import { preloadAllAssets } from './services/assetLoader';
import * as preferenceService from './services/preferenceService';
import { CreditProvider } from './contexts/CreditContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Component Imports
import { Intro } from './components/Intro';
import { GlobalLayout } from './components/GlobalLayout';
import { ImageGeneratorPage } from './components/ImageGeneratorPage';
import { MinigameHubPage } from './components/MinigameHubPage';
import { AiChatPage } from './components/AiChatPage';
import { ArtGalleryPage } from './components/ArtGalleryPage';
import { SettingsPage } from './components/SettingsPage';
import { ALL_AI_MODELS } from './services/aiModels';


export type CurrentPage = 'imageGenerator' | 'minigameHub' | 'artGallery' | 'aiChat';

export const App: React.FC = () => {
    const [isSoundOn, setIsSoundOn] = useState(() => preferenceService.getPreference('isSoundOn', true));
    const [musicVolume, setMusicVolume] = useState(() => preferenceService.getPreference('musicVolume', 0.1));
    const [currentPage, setCurrentPage] = useState<CurrentPage>('imageGenerator');
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showIntro, setShowIntro] = useState(!sessionStorage.getItem('introShown'));
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

        const initAudioOnce = () => {
            if (!audioInitialized.current) {
                audioInitialized.current = true;
                audioService.initAudio();
                audioService.startBackgroundMusic();
                // Set initial music volume based on saved preference
                audioService.setMusicVolume(isSoundOn ? musicVolume : 0);
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
    }, [isSoundOn, musicVolume]);
    
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


    const playSound = useCallback((player: () => void): void => {
        if (isSoundOn) {
            player();
        }
    }, [isSoundOn]);

    const handleSetPage = useCallback((page: CurrentPage): void => {
        playSound(audioService.playClick);
        setCurrentPage(page);
        setIsSidebarOpen(false); // Close sidebar on navigation
    }, [playSound]);

    const handleToggleSound = useCallback((): void => {
        const newIsSoundOn = !isSoundOn;
        playSound(audioService.playToggle);
        setIsSoundOn(newIsSoundOn);
        preferenceService.setPreference('isSoundOn', newIsSoundOn);
        audioService.setMusicVolume(newIsSoundOn ? musicVolume : 0);
    }, [isSoundOn, playSound, musicVolume]);

    const handleMusicVolumeChange = useCallback((volume: number) => {
        setMusicVolume(volume);
        preferenceService.setPreference('musicVolume', volume);
        if (isSoundOn) {
            audioService.setMusicVolume(volume);
        }
    }, [isSoundOn]);
    
    const handleUiAnimationsChange = useCallback((enabled: boolean) => {
        setUiAnimations(enabled);
        preferenceService.setPreference('uiAnimations', enabled);
    }, []);

    const handleIntroComplete = useCallback((): void => {
        sessionStorage.setItem('introShown', 'true');
        setShowIntro(false);
    }, []);

    const openSettingsPage = useCallback((): void => {
        playSound(audioService.playClick);
        setIsSettingsOpen(true);
    }, [playSound]);

    const closeSettingsPage = useCallback((): void => {
        playSound(audioService.playCloseModal);
        setIsSettingsOpen(false);
    }, [playSound]);
    
    if (showIntro) {
        return <Intro onComplete={handleIntroComplete} />;
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
                  musicVolume={musicVolume}
                  onMusicVolumeChange={handleMusicVolumeChange}
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
                  onOpenSettings={openSettingsPage}
                  playSound={playSound}
                  isSidebarOpen={isSidebarOpen}
                  onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
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
                      {currentPage === 'aiChat' && (
                          <AiChatPage
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
      </LanguageProvider>
    );
};