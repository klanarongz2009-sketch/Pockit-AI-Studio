import React, { useState, useEffect } from 'react';
import { PageHeader, PageWrapper } from './PageComponents';
import * as audioService from '../services/audioService';
import * as preferenceService from '../services/preferenceService';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { InfoIcon } from './icons/InfoIcon';
import { AboutPage } from './AboutPage';

interface SettingsPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isSoundOn: boolean;
    onToggleSound: () => void;
    musicVolume: number;
    onMusicVolumeChange: (volume: number) => void;
    aiModels: { name: string; }[];
    uiAnimations: boolean;
    onUiAnimationsChange: (enabled: boolean) => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <section className="w-full bg-black/20 p-4 border-2 border-brand-light/30 space-y-4">
        <h3 className="font-press-start text-base sm:text-lg text-brand-cyan">{title}</h3>
        <div className="font-sans text-sm space-y-4">{children}</div>
    </section>
);

export const SettingsPage: React.FC<SettingsPageProps> = ({ 
    onClose, 
    playSound, 
    isSoundOn, 
    onToggleSound, 
    musicVolume, 
    onMusicVolumeChange,
    aiModels,
    uiAnimations,
    onUiAnimationsChange,
}) => {
    const { themePreference, setThemePreference } = useTheme();
    const [isAboutPageOpen, setIsAboutPageOpen] = useState(false);
    const [defaultChatModelName, setDefaultChatModelName] = useState(() => 
        preferenceService.getPreference('defaultChatModelName', aiModels[0]?.name || '')
    );
    const [defaultImageMode, setDefaultImageMode] = useState(() =>
        preferenceService.getPreference('imageGeneratorMode', 'image')
    );
    const [imageQuality, setImageQuality] = useState(() =>
        preferenceService.getPreference('imageGenerationQuality', 'quality')
    );
     const [saveChatHistory, setSaveChatHistory] = useState(() =>
        preferenceService.getPreference('saveChatHistory', true)
    );
    const [defaultMinigameDifficulty, setDefaultMinigameDifficulty] = useState(() =>
        preferenceService.getPreference('defaultMinigameDifficulty', 'normal')
    );


    useEffect(() => {
        preferenceService.setPreference('defaultChatModelName', defaultChatModelName);
    }, [defaultChatModelName]);

    useEffect(() => {
        preferenceService.setPreference('imageGeneratorMode', defaultImageMode);
    }, [defaultImageMode]);
    
    useEffect(() => {
        preferenceService.setPreference('imageGenerationQuality', imageQuality);
    }, [imageQuality]);
    
     useEffect(() => {
        preferenceService.setPreference('saveChatHistory', saveChatHistory);
    }, [saveChatHistory]);

    useEffect(() => {
        preferenceService.setPreference('defaultMinigameDifficulty', defaultMinigameDifficulty);
    }, [defaultMinigameDifficulty]);


    const handleClearArtData = () => {
        playSound(audioService.playTrash);
        if (window.confirm('Are you sure you want to delete your entire gallery and song history?')) {
            try {
                const keysToRemove = ['ai-art-gallery-artworks', 'ai-studio-song-history'];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('ai-art-gallery-comments-')) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
                alert('Data cleared successfully.');
                window.location.reload();
            } catch (e) {
                alert('Could not clear data.');
                console.error(e);
            }
        }
    };


    const handleClearData = () => {
        playSound(audioService.playTrash);
        if (window.confirm('Are you sure you want to clear all application data? This cannot be undone and will delete your credits, gallery, history, and all settings.')) {
            try {
                localStorage.clear();
                window.location.reload();
            } catch (e) {
                alert('Could not clear data.');
                console.error(e);
            }
        }
    };

    if (isAboutPageOpen) {
        return <AboutPage isOnline={navigator.onLine} playSound={playSound} onClose={() => setIsAboutPageOpen(false)} />;
    }

    return (
        <PageWrapper>
            <PageHeader title={"Settings"} onBack={onClose} />
            <main id="main-content" className="w-full max-w-2xl flex-grow overflow-y-auto font-sans pr-2 space-y-6">
                
                <Section title={"General"}>
                    <button
                        onClick={() => { playSound(audioService.playClick); setIsAboutPageOpen(true); }}
                        className="w-full p-3 bg-surface-primary border-4 border-border-primary text-text-primary shadow-pixel font-press-start text-sm transition-all hover:bg-brand-cyan/20 flex items-center justify-center gap-2"
                    >
                        <InfoIcon className="w-5 h-5" />
                        <span>{"About App"}</span>
                    </button>
                </Section>
                
                <Section title={"Theme"}>
                    <div className="grid grid-cols-3 gap-2">
                        {(['light', 'dark', 'system'] as const).map(pref => (
                            <button
                                key={pref}
                                onClick={() => { playSound(audioService.playClick); setThemePreference(pref); }}
                                className={`flex flex-col items-center justify-center gap-2 p-3 border-4 font-press-start text-xs ${themePreference === pref ? 'bg-brand-yellow text-black border-black' : 'bg-surface-primary border-border-primary text-text-primary hover:bg-brand-cyan/20'}`}
                            >
                                {pref === 'light' && <SunIcon className="w-6 h-6" />}
                                {pref === 'dark' && <MoonIcon className="w-6 h-6" />}
                                {pref === 'system' && <SettingsIcon className="w-6 h-6" />}
                                <span>{pref.charAt(0).toUpperCase() + pref.slice(1)}</span>
                            </button>
                        ))}
                    </div>
                </Section>

                <Section title={"Sound"}>
                    <div className="flex items-center justify-between">
                        <label className="font-press-start" htmlFor="sound-toggle-btn">{"Sound Effects"}</label>
                        <button id="sound-toggle-btn" onClick={onToggleSound} className="p-2 border-2 border-border-primary">
                            {isSoundOn ? "On" : "Off"}
                        </button>
                    </div>
                    <div>
                        <label htmlFor="music-volume" className="font-press-start flex justify-between">
                            <span>{"Background Music"}</span>
                            <span>{Math.round(musicVolume * 100)}%</span>
                        </label>
                        <input
                            id="music-volume"
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={musicVolume}
                            onChange={(e) => onMusicVolumeChange(parseFloat(e.target.value))}
                            className="w-full mt-2"
                        />
                    </div>
                </Section>

                <Section title={"Display"}>
                    <div className="flex items-center justify-between">
                        <label className="font-press-start" htmlFor="animations-toggle-btn">{"UI Animations"}</label>
                        <button
                            id="animations-toggle-btn"
                            onClick={() => {
                                playSound(audioService.playToggle);
                                onUiAnimationsChange(!uiAnimations);
                            }}
                            className="p-2 border-2 border-border-primary"
                        >
                            {uiAnimations ? "On" : "Off"}
                        </button>
                    </div>
                </Section>
                
                <Section title={"Creation"}>
                     <div>
                        <label htmlFor="default-image-mode" className="font-press-start">{"Default Image Mode"}</label>
                        <select
                            id="default-image-mode"
                            value={defaultImageMode}
                            onChange={(e) => setDefaultImageMode(e.target.value as any)}
                            className="w-full mt-2 p-2 bg-brand-light text-black border-2 border-black"
                        >
                            <option value="image">Image</option>
                            <option value="gif">GIF</option>
                            <option value="video">Video</option>
                            <option value="spritesheet">Spritesheet</option>
                        </select>
                    </div>
                     <div>
                        <label className="font-press-start">{"Image Generation Quality"}</label>
                        <div className="flex gap-4 mt-2">
                            <label className="flex items-center gap-2">
                                <input type="radio" name="image-quality" value="fast" checked={imageQuality === 'fast'} onChange={() => setImageQuality('fast')} className="w-5 h-5 accent-brand-magenta" />
                                <span>{"Fast"}</span>
                            </label>
                             <label className="flex items-center gap-2">
                                <input type="radio" name="image-quality" value="quality" checked={imageQuality === 'quality'} onChange={() => setImageQuality('quality')} className="w-5 h-5 accent-brand-magenta" />
                                <span>{"High Quality"}</span>
                            </label>
                        </div>
                        <p className="text-xs text-brand-light/70 mt-1">Note: This setting is illustrative and does not yet affect image generation.</p>
                    </div>
                </Section>

                <Section title={"AI Chat"}>
                     <div>
                        <label htmlFor="default-model-select" className="font-press-start">{"Default AI Chat"}</label>
                        <select
                            id="default-model-select"
                            value={defaultChatModelName}
                            onChange={(e) => { playSound(audioService.playSelection); setDefaultChatModelName(e.target.value); }}
                            className="w-full mt-2 p-2 bg-brand-light text-black border-2 border-black"
                        >
                            {aiModels.map(model => (
                                <option key={model.name} value={model.name}>
                                    {model.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="font-press-start" htmlFor="save-history-btn">{"Save Chat History"}</label>
                         <button id="save-history-btn" onClick={() => setSaveChatHistory(prev => !prev)} className="p-2 border-2 border-border-primary">
                            {saveChatHistory ? "On" : "Off"}
                        </button>
                    </div>
                     <p className="text-xs text-brand-light/70">Note: Chat history is cleared when the browser tab is closed.</p>
                </Section>
                
                 <Section title={"Minigames"}>
                     <div>
                        <label htmlFor="default-minigame-difficulty" className="font-press-start">{"Default Difficulty"}</label>
                        <select
                            id="default-minigame-difficulty"
                            value={defaultMinigameDifficulty}
                            onChange={(e) => setDefaultMinigameDifficulty(e.target.value as any)}
                            className="w-full mt-2 p-2 bg-brand-light text-black border-2 border-black"
                        >
                            <option value="easy">{"Easy"}</option>
                            <option value="normal">{"Normal"}</option>
                            <option value="hard">{"Hard"}</option>
                        </select>
                         <p className="text-xs text-brand-light/70 mt-1">Applies to games that support difficulty levels.</p>
                    </div>
                </Section>

                <Section title={"Data Management"}>
                    <button
                        onClick={handleClearArtData}
                        className="w-full p-3 bg-brand-yellow text-black border-4 border-brand-light shadow-pixel font-press-start text-sm transition-all hover:bg-yellow-500 active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px]"
                    >
                        {"Clear Gallery & Song History"}
                    </button>
                     <button
                        onClick={handleClearData}
                        className="w-full p-3 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel font-press-start text-sm transition-all hover:bg-red-500 active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px]"
                    >
                        {"Clear All Data"}
                    </button>
                    <p className="text-xs text-brand-light/70 text-center">
                        {"Clearing all data will remove your credits, history, gallery images, and all settings."}
                    </p>
                </Section>

            </main>
        </PageWrapper>
    );
};
