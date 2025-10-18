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
import { ModelInfoPage } from './ModelInfoPage';
import { useLanguage } from '../contexts/LanguageContext';
import { LoadingSpinner } from './LoadingSpinner';

interface SettingsPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isSoundOn: boolean;
    onToggleSound: () => void;
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

const SettingToggle: React.FC<{ label: string; description?: string; isChecked: boolean; onToggle: () => void; disabled?: boolean; }> = ({ label, description, isChecked, onToggle, disabled }) => (
    <div className="flex items-center justify-between">
        <div>
            <label className="font-press-start" htmlFor={`toggle-${label}`}>{label}</label>
            {description && <p className="text-xs text-brand-light/70">{description}</p>}
        </div>
        <button id={`toggle-${label}`} onClick={onToggle} disabled={disabled} className="p-2 border-2 border-border-primary w-20 text-center disabled:opacity-50">
            {isChecked ? 'ON' : 'OFF'}
        </button>
    </div>
);

export const SettingsPage: React.FC<SettingsPageProps> = ({ 
    onClose, 
    playSound, 
    isSoundOn, 
    onToggleSound, 
    aiModels,
    uiAnimations,
    onUiAnimationsChange,
}) => {
    const { themePreference, setThemePreference } = useTheme();
    const { t } = useLanguage();
    const [isAboutPageOpen, setIsAboutPageOpen] = useState(false);
    const [isModelInfoOpen, setIsModelInfoOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // --- State for all new preferences ---
    // FIX: Initialize all states with default non-promise values.
    const [highContrast, setHighContrast] = useState(false);
    const [chatFontSize, setChatFontSize] = useState<preferenceService.Preferences['chatFontSize']>('medium');
    const [autoPlaySounds, setAutoPlaySounds] = useState(true);
    const [defaultImageMode, setDefaultImageMode] = useState<preferenceService.Preferences['imageGeneratorMode']>('image');
    const [imageQuality, setImageQuality] = useState<preferenceService.Preferences['imageGenerationQuality']>('quality');
    const [autoSaveToGallery, setAutoSaveToGallery] = useState(false);
    const [defaultChatModelName, setDefaultChatModelName] = useState(aiModels[0]?.name || '');
    const [saveChatHistory, setSaveChatHistory] = useState(true);
    const [defaultWebSearch, setDefaultWebSearch] = useState(false);
    const [defaultMinigameDifficulty, setDefaultMinigameDifficulty] = useState<preferenceService.Preferences['defaultMinigameDifficulty']>('normal');
    const [confirmCreditSpend, setConfirmCreditSpend] = useState(false);
    const [defaultTtsVoice, setDefaultTtsVoice] = useState<preferenceService.Preferences['textToSpeechVoiceName']>('Zephyr');

    // FIX: Load all preferences asynchronously in a useEffect.
    useEffect(() => {
        const loadSettings = async () => {
            setIsLoading(true);
            const [
                hc, font, autoPlay, imgMode, imgQual, autoSave, chatModel, saveHistory,
                webSearch, difficulty, confirmSpend, ttsVoice
            ] = await Promise.all([
                preferenceService.getPreference('highContrastMode', false),
                preferenceService.getPreference('chatFontSize', 'medium'),
                preferenceService.getPreference('autoPlaySounds', true),
                preferenceService.getPreference('imageGeneratorMode', 'image'),
                preferenceService.getPreference('imageGenerationQuality', 'quality'),
                preferenceService.getPreference('autoSaveToGallery', false),
                preferenceService.getPreference('defaultChatModelName', aiModels[0]?.name || ''),
                preferenceService.getPreference('saveChatHistory', true),
                preferenceService.getPreference('defaultWebSearch', false),
                preferenceService.getPreference('defaultMinigameDifficulty', 'normal'),
                preferenceService.getPreference('confirmCreditSpend', false),
                preferenceService.getPreference('textToSpeechVoiceName', 'Zephyr')
            ]);
            setHighContrast(hc); setChatFontSize(font); setAutoPlaySounds(autoPlay);
            setDefaultImageMode(imgMode); setImageQuality(imgQual); setAutoSaveToGallery(autoSave);
            setDefaultChatModelName(chatModel); setSaveChatHistory(saveHistory); setDefaultWebSearch(webSearch);
            setDefaultMinigameDifficulty(difficulty); setConfirmCreditSpend(confirmSpend); setDefaultTtsVoice(ttsVoice);
            setIsLoading(false);
        };
        loadSettings();
    }, [aiModels]);
    
    // --- Handlers to save preferences ---
    const handleToggle = async (
        key: keyof preferenceService.Preferences,
        setter: React.Dispatch<React.SetStateAction<boolean>>,
        currentValue: boolean
    ) => {
        playSound(audioService.playToggle);
        const newValue = !currentValue;
        setter(newValue);
        await preferenceService.setPreference(key as any, newValue);
    };

    const handleSelect = async (
        key: keyof preferenceService.Preferences,
        value: any,
        setter: React.Dispatch<React.SetStateAction<any>>
    ) => {
        playSound(audioService.playClick);
        setter(value);
        await preferenceService.setPreference(key as any, value);
    };
    
    useEffect(() => {
        document.body.classList.toggle('theme-high-contrast', highContrast);
    }, [highContrast]);

    const handleClearData = async () => {
        playSound(audioService.playTrash);
        if (window.confirm('Are you sure you want to clear all application data from the cloud and reset the app? This cannot be undone.')) {
            try {
                await preferenceService.clearAllPreferences();
                alert('All stored data has been cleared. The app will now reload to its default state.');
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
    
    if (isModelInfoOpen) {
        return <ModelInfoPage onClose={() => setIsModelInfoOpen(false)} />;
    }

    if (isLoading) {
         return (
            <PageWrapper>
                <PageHeader title={t('settings.title')} onBack={onClose} />
                <main className="w-full max-w-2xl flex-grow flex items-center justify-center">
                    <LoadingSpinner text="Loading Settings..." />
                </main>
            </PageWrapper>
        );
    }
    
    return (
        <PageWrapper>
            <PageHeader title={t('settings.title')} onBack={onClose} />
            <main id="main-content" className="w-full max-w-2xl flex-grow overflow-y-auto font-sans pr-2 space-y-6">
                
                <Section title={t('settings.general')}>
                    <button
                        onClick={() => { playSound(audioService.playClick); setIsAboutPageOpen(true); }}
                        className="w-full p-3 bg-surface-primary border-4 border-border-primary text-text-primary shadow-pixel font-press-start text-sm transition-all hover:bg-brand-cyan/20 flex items-center justify-center gap-2"
                    >
                        <InfoIcon className="w-5 h-5" />
                        <span>{t('settings.aboutApp')}</span>
                    </button>
                </Section>

                <Section title={t('settings.display')}>
                     <div>
                        <label className="font-press-start">{t('settings.theme')}</label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {(['light', 'dark', 'system'] as const).map(pref => (
                                <button
                                    key={pref}
                                    onClick={() => { playSound(audioService.playClick); setThemePreference(pref); }}
                                    className={`flex flex-col items-center justify-center gap-2 p-3 border-4 font-press-start text-xs ${themePreference === pref ? 'bg-brand-yellow text-black border-black' : 'bg-surface-primary border-border-primary text-text-primary hover:bg-brand-cyan/20'}`}
                                >
                                    {pref === 'light' && <SunIcon className="w-6 h-6" />}
                                    {pref === 'dark' && <MoonIcon className="w-6 h-6" />}
                                    {pref === 'system' && <SettingsIcon className="w-6 h-6" />}
                                    <span>{t(`settings.theme${pref.charAt(0).toUpperCase() + pref.slice(1)}`)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label className="font-press-start">{t('settings.language')}</label>
                        <div className="w-full mt-2 p-2 bg-surface-primary border-2 border-border-secondary text-text-secondary font-sans">
                            {t('settings.langEn')} (auto-detected)
                        </div>
                    </div>
                    {/* FIX: Correctly call onUiAnimationsChange with the new value */}
                    <SettingToggle label={t('settings.uiAnimations')} isChecked={uiAnimations} onToggle={() => { playSound(audioService.playToggle); onUiAnimationsChange(!uiAnimations); }} />
                    <SettingToggle label="High Contrast" isChecked={highContrast} onToggle={() => handleToggle('highContrastMode', !highContrast, setHighContrast as any)} />
                </Section>
                
                <Section title={t('settings.sound')}>
                    <SettingToggle label={t('settings.soundEffects')} isChecked={isSoundOn} onToggle={onToggleSound} />
                    <SettingToggle label="Autoplay Sounds" description="Automatically play generated sounds and music." isChecked={autoPlaySounds} onToggle={() => handleToggle('autoPlaySounds', !autoPlaySounds, setAutoPlaySounds as any)} />
                    <div>
                        <label htmlFor="tts-voice-select" className="font-press-start">AI Voice for Read Aloud</label>
                        <select
                            id="tts-voice-select"
                            value={defaultTtsVoice}
                            onChange={(e) => handleSelect('textToSpeechVoiceName', e.target.value as any, setDefaultTtsVoice)}
                            className="w-full mt-2 p-2 bg-brand-light text-black border-2 border-black font-sans"
                        >
                            <option value="Zephyr">Zephyr (Friendly)</option>
                            <option value="Puck">Puck (Playful)</option>
                            <option value="Charon">Charon (Deep)</option>
                            <option value="Kore">Kore (Calm)</option>
                            <option value="Fenrir">Fenrir (Assertive)</option>
                        </select>
                    </div>
                </Section>

                <Section title={t('settings.creation')}>
                     <div>
                        <label htmlFor="default-image-mode" className="font-press-start">{t('settings.defaultImageMode')}</label>
                        <select
                            id="default-image-mode"
                            value={defaultImageMode}
                            onChange={(e) => handleSelect('imageGeneratorMode', e.target.value as any, setDefaultImageMode)}
                            className="w-full mt-2 p-2 bg-brand-light text-black border-2 border-black"
                        >
                            <option value="image">Image</option>
                            <option value="gif">GIF</option>
                            <option value="video">Video