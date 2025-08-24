import React, { useState, useCallback, useEffect } from 'react';
import * as audioService from './services/audioService';
import { PaletteIcon } from './components/icons/PaletteIcon';
import { PageWrapper } from './components/PageComponents';
import { VoiceChangerIcon } from './components/icons/VoiceChangerIcon';
import { VoiceChangerPage } from './components/VoiceChangerPage';
import { SoundLibraryPage } from './components/SoundLibraryPage';
import { SoundWaveIcon } from './components/icons/SoundWaveIcon';
import { AboutPage } from './components/AboutPage';
import { ImageGeneratorPage } from './components/ImageGeneratorPage';
import { MinigameHubPage } from './components/MinigameHubPage';
import { TextMusicIcon } from './components/icons/TextMusicIcon';
import { TextToSongPage } from './components/TextToSongPage';
import { GamepadIcon } from './components/icons/GamepadIcon';
import { Intro } from './components/Intro';
import { VideoEditorIcon } from './components/icons/VideoEditorIcon';
import { VideoEditorPage } from './components/VideoEditorPage';
import { AnalyzeIcon } from './components/icons/AnalyzeIcon';
import { AnalyzeMediaPage } from './components/AnalyzeMediaPage';
import { BookmarkIcon } from './components/icons/BookmarkIcon';
import { GlobalLayout } from './components/GlobalLayout';
import { NotificationControl } from './components/NotificationControl';
import { SpeakerOnIcon } from './components/icons/SpeakerOnIcon';
import { SpeakerOffIcon } from './components/icons/SpeakerOffIcon';
import { ImageSoundIcon } from './components/icons/ImageSoundIcon';
import { ImageToSoundPage } from './components/ImageToSoundPage';


type CurrentPage = 'main' | 'imageGenerator' | 'aiNarrator' | 'soundLibrary' | 'about' | 'minigameHub' | 'textToSong' | 'videoEditor' | 'analyzeMedia' | 'imageToSound';


// --- Feature Button ---
interface FeatureButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    playSound: (player: () => void) => void;
    pageKey: CurrentPage;
    isPinned: boolean;
    onPinToggle: (pageKey: CurrentPage) => void;
    comingSoon?: boolean;
    comingSoonText?: string;
    beta?: boolean;
}

const FeatureButton: React.FC<FeatureButtonProps> = ({ icon, label, onClick, playSound, pageKey, isPinned, onPinToggle, comingSoon = false, comingSoonText, beta = false }) => (
    <div className="relative group">
        <button
            onClick={onClick}
            onMouseEnter={() => !comingSoon && playSound(audioService.playHover)}
            disabled={comingSoon}
            className={`w-full h-full flex flex-col items-center justify-center gap-2 p-2 text-center bg-brand-cyan/20 border-4 border-brand-light shadow-pixel transition-all
                ${comingSoon 
                    ? 'cursor-not-allowed' 
                    : 'hover:bg-brand-cyan/40 active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px]'}`}
        >
            <div className={`transition-transform duration-200 ${comingSoon ? '' : 'group-hover:scale-110'}`}>{icon}</div>
            <span className="text-xs font-press-start leading-tight">{label}</span>
        </button>
        {!comingSoon && (
             <button
                onClick={(e) => {
                    e.stopPropagation(); // Prevent navigation
                    onPinToggle(pageKey);
                }}
                onMouseEnter={() => playSound(audioService.playHover)}
                aria-label={isPinned ? `นำ '${label}' ออกจากทางลัด` : `เพิ่ม '${label}' ไปยังทางลัด`}
                title={isPinned ? 'นำออกจากทางลัด' : 'เพิ่มไปยังทางลัด'}
                className="absolute top-1 right-1 p-1 bg-black/50 border border-brand-light rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            >
                <BookmarkIcon className={`w-4 h-4 transition-colors ${isPinned ? 'text-brand-yellow' : 'text-brand-light'}`} />
            </button>
        )}
        {comingSoon && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-1" aria-hidden="true">
                <p className="text-xs font-press-start text-brand-yellow drop-shadow-[2px_2px_0_#000]">เร็วๆ นี้</p>
                {comingSoonText && <p className="text-[10px] font-press-start text-brand-light/80 drop-shadow-[2px_2px_0_#000]">{comingSoonText}</p>}
            </div>
        )}
        {beta && !comingSoon && (
            <div className="absolute top-1 right-1 bg-brand-magenta text-white text-[8px] font-press-start px-1 border border-black" aria-hidden="true">ทดลอง</div>
        )}
    </div>
);


export const App: React.FC = () => {
    const [isSoundOn, setIsSoundOn] = useState(true);
    const [currentPage, setCurrentPage] = useState<CurrentPage>('main');
    const [isPlayingSong, setIsPlayingSong] = useState(false);
    const [isOnline, setIsOnline] = useState(() => navigator.onLine);
    const [showIntro, setShowIntro] = useState(!sessionStorage.getItem('introShown'));
    const [shortcuts, setShortcuts] = useState<CurrentPage[]>([]);

    const SHORTCUTS_STORAGE_KEY = 'ai-studio-shortcuts';

    // Load shortcuts from localStorage on mount
    useEffect(() => {
        try {
            const storedShortcuts = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
            if (storedShortcuts) {
                setShortcuts(JSON.parse(storedShortcuts));
            }
        } catch (e) {
            console.error("Failed to load shortcuts from localStorage", e);
        }
    }, []);

    const handlePinToggle = (pageKey: CurrentPage) => {
        playSound(audioService.playToggle);
        setShortcuts(prev => {
            const isPinned = prev.includes(pageKey);
            const newShortcuts = isPinned ? prev.filter(p => p !== pageKey) : [...prev, pageKey];
            try {
                localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(newShortcuts));
            } catch (e) {
                 console.error("Failed to save shortcuts to localStorage", e);
            }
            return newShortcuts;
        });
    };
    
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
    
    const handlePageClose = () => {
        playSound(audioService.playCloseModal);
        setCurrentPage('main');
    };

    const handleSetPage = (page: CurrentPage) => {
        playSound(audioService.playClick);
        setCurrentPage(page);
    };
    
    const handleIntroComplete = () => {
        sessionStorage.setItem('introShown', 'true');
        setShowIntro(false);
    };

    if (showIntro) {
        return <Intro onComplete={handleIntroComplete} />;
    }

    const renderCurrentPage = () => {
        switch (currentPage) {
            case 'textToSong':
                return <TextToSongPage onClose={handlePageClose} playSound={playSound} isPlayingSong={isPlayingSong} setIsPlayingSong={setIsPlayingSong} isOnline={isOnline} />;
            case 'about':
                return <AboutPage onClose={handlePageClose} playSound={playSound} isOnline={isOnline} />;
            case 'minigameHub':
                return <MinigameHubPage onClose={handlePageClose} playSound={playSound} isOnline={isOnline} />;
            case 'aiNarrator':
                return <VoiceChangerPage onClose={handlePageClose} playSound={playSound} />;
            case 'soundLibrary':
                return <SoundLibraryPage onClose={handlePageClose} playSound={playSound} isOnline={isOnline} />;
             case 'imageToSound':
                return <ImageToSoundPage onClose={handlePageClose} playSound={playSound} isOnline={isOnline} />;
            case 'imageGenerator':
                return <ImageGeneratorPage onClose={handlePageClose} playSound={playSound} isOnline={isOnline} />;
            case 'videoEditor':
                return <VideoEditorPage onClose={handlePageClose} playSound={playSound} isOnline={isOnline} />;
            case 'analyzeMedia':
                return <AnalyzeMediaPage onClose={handlePageClose} playSound={playSound} isOnline={isOnline} />;
            case 'main':
            default: {
                const features: { pageKey: CurrentPage, icon: React.ReactElement<{ className?: string }>, label: string, beta?: boolean }[] = [
                    { pageKey: 'imageGenerator', icon: <PaletteIcon className="w-10 h-10" />, label: "สร้างภาพ" },
                    { pageKey: 'videoEditor', icon: <VideoEditorIcon className="w-10 h-10" />, label: "ตัดต่อวิดีโอ", beta: true },
                    { pageKey: 'aiNarrator', icon: <VoiceChangerIcon className="w-10 h-10" />, label: "แปลงเสียง" },
                    { pageKey: 'textToSong', icon: <TextMusicIcon className="w-10 h-10" />, label: "สร้างเพลง" },
                    { pageKey: 'analyzeMedia', icon: <AnalyzeIcon className="w-10 h-10" />, label: "วิเคราะห์สื่อ", beta: true },
                    { pageKey: 'soundLibrary', icon: <SoundWaveIcon className="w-10 h-10" />, label: "คลังเสียง" },
                    { pageKey: 'imageToSound', icon: <ImageSoundIcon className="w-10 h-10" />, label: "ภาพเป็นเสียง", beta: true },
                    { pageKey: 'minigameHub', icon: <GamepadIcon className="w-10 h-10" />, label: "ฟีเจอร์เสริม" },
                ];

                return (
                    <PageWrapper className="justify-between">
                        <div/>
                        <main id="main-content" role="main" className="w-full max-w-lg flex flex-col items-center gap-6 p-4 sm:p-8">
                            <header className="text-center mb-2">
                                <h1 className="text-3xl sm:text-4xl text-brand-yellow drop-shadow-[3px_3px_0_#000]">Ai Studio แบบพกพา</h1>
                                <p className="text-sm text-brand-cyan mt-2">สตูดิโอสร้างสรรค์พลัง AI!</p>
                            </header>

                            {shortcuts.length > 0 && (
                                <section className="w-full space-y-2" aria-labelledby="shortcuts-heading">
                                    <h2 id="shortcuts-heading" className="text-sm font-press-start text-brand-cyan">ทางลัด</h2>
                                    <div className="flex gap-2 p-2 bg-black/20 border-2 border-brand-light/30 overflow-x-auto">
                                        {shortcuts.map(pageKey => {
                                            const feature = features.find(f => f.pageKey === pageKey);
                                            if (!feature) return null;
                                            return (
                                                <button
                                                    key={pageKey}
                                                    onClick={() => handleSetPage(pageKey)}
                                                    onMouseEnter={() => playSound(audioService.playHover)}
                                                    className="flex-shrink-0 w-20 h-20 flex flex-col items-center justify-center gap-1 p-1 text-center bg-brand-cyan/20 border-2 border-brand-light shadow-sm transition-all hover:bg-brand-cyan/40 active:translate-y-[1px] active:translate-x-[1px] active:shadow-none"
                                                    aria-label={feature.label}
                                                >
                                                    {React.cloneElement(feature.icon, { className: 'w-8 h-8' })}
                                                    <span className="text-[10px] font-press-start leading-tight">{feature.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                             <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2 text-brand-light text-sm">
                                {features.map(feature => (
                                    <FeatureButton
                                        key={feature.pageKey}
                                        icon={feature.icon}
                                        label={feature.label}
                                        onClick={() => handleSetPage(feature.pageKey)}
                                        playSound={playSound}
                                        pageKey={feature.pageKey}
                                        isPinned={shortcuts.includes(feature.pageKey)}
                                        onPinToggle={handlePinToggle}
                                        beta={feature.beta}
                                    />
                                ))}
                            </div>
                        </main>
                        
                        <footer className="w-full max-w-lg flex flex-col sm:flex-row items-center justify-between gap-x-4 gap-y-2 p-4 pt-0">
                           <NotificationControl playSound={playSound} />
                            <div className="flex items-center gap-x-4">
                               <div className="flex flex-col items-center sm:items-end gap-y-1">
                                    <button onClick={() => handleSetPage('about')} className="text-[10px] text-brand-light/50 hover:text-brand-yellow underline">เกี่ยวกับแอป</button>
                                    <p className="text-[10px] text-brand-light/50">ขับเคลื่อนโดย Google AI</p>
                                </div>
                                <button
                                    onClick={() => {
                                        playSound(audioService.playToggle);
                                        setIsSoundOn(!isSoundOn);
                                    }}
                                    onMouseEnter={() => playSound(audioService.playHover)}
                                    aria-label={isSoundOn ? "ปิดเสียงประกอบ" : "เปิดเสียงประกอบ"}
                                    className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-black/70 border-2 border-brand-light text-brand-light hover:bg-brand-yellow hover:text-black transition-colors"
                                >
                                    {isSoundOn ? <SpeakerOnIcon className="w-5 h-5" /> : <SpeakerOffIcon className="w-5 h-5" />}
                                </button>
                            </div>
                        </footer>
                    </PageWrapper>
                );
            }
        }
    };

    return (
        <GlobalLayout playSound={playSound}>
            {renderCurrentPage()}
        </GlobalLayout>
    );
};