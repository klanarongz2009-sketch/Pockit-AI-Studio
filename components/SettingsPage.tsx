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

const SettingToggle: React.FC<{ label: string; description?: string; isChecked: boolean; onToggle: () => void; }> = ({ label, description, isChecked, onToggle }) => (
    <div className="flex items-center justify-between">
        <div>
            <label className="font-press-start" htmlFor={`toggle-${label}`}>{label}</label>
            {description && <p className="text-xs text-brand-light/70">{description}</p>}
        </div>
        <button id={`toggle-${label}`} onClick={onToggle} className="p-2 border-2 border-border-primary w-20 text-center">
            {isChecked ? 'เปิด' : 'ปิด'}
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
    const { language, setLanguage, t } = useLanguage();
    const [isAboutPageOpen, setIsAboutPageOpen] = useState(false);
    const [isModelInfoOpen, setIsModelInfoOpen] = useState(false);

    // --- State for all new preferences ---
    const [highContrast, setHighContrast] = useState(() => preferenceService.getPreference('highContrastMode', false));
    const [chatFontSize, setChatFontSize] = useState(() => preferenceService.getPreference('chatFontSize', 'medium'));
    const [autoPlaySounds, setAutoPlaySounds] = useState(() => preferenceService.getPreference('autoPlaySounds', true));
    const [defaultImageMode, setDefaultImageMode] = useState(() => preferenceService.getPreference('imageGeneratorMode', 'image'));
    const [imageQuality, setImageQuality] = useState(() => preferenceService.getPreference('imageGenerationQuality', 'quality'));
    const [autoSaveToGallery, setAutoSaveToGallery] = useState(() => preferenceService.getPreference('autoSaveToGallery', false));
    const [defaultChatModelName, setDefaultChatModelName] = useState(() => preferenceService.getPreference('defaultChatModelName', aiModels[0]?.name || ''));
    const [saveChatHistory, setSaveChatHistory] = useState(() => preferenceService.getPreference('saveChatHistory', true));
    const [defaultWebSearch, setDefaultWebSearch] = useState(() => preferenceService.getPreference('defaultWebSearch', false));
    const [defaultMinigameDifficulty, setDefaultMinigameDifficulty] = useState(() => preferenceService.getPreference('defaultMinigameDifficulty', 'normal'));
    const [confirmCreditSpend, setConfirmCreditSpend] = useState(() => preferenceService.getPreference('confirmCreditSpend', false));

    // --- Effects to save preferences and apply side-effects ---
    useEffect(() => {
        preferenceService.setPreference('highContrastMode', highContrast);
        document.body.classList.toggle('theme-high-contrast', highContrast);
    }, [highContrast]);

    useEffect(() => { preferenceService.setPreference('chatFontSize', chatFontSize); }, [chatFontSize]);
    useEffect(() => { preferenceService.setPreference('autoPlaySounds', autoPlaySounds); }, [autoPlaySounds]);
    useEffect(() => { preferenceService.setPreference('imageGeneratorMode', defaultImageMode); }, [defaultImageMode]);
    useEffect(() => { preferenceService.setPreference('imageGenerationQuality', imageQuality); }, [imageQuality]);
    useEffect(() => { preferenceService.setPreference('autoSaveToGallery', autoSaveToGallery); }, [autoSaveToGallery]);
    useEffect(() => { preferenceService.setPreference('defaultChatModelName', defaultChatModelName); }, [defaultChatModelName]);
    useEffect(() => { preferenceService.setPreference('saveChatHistory', saveChatHistory); }, [saveChatHistory]);
    useEffect(() => { preferenceService.setPreference('defaultWebSearch', defaultWebSearch); }, [defaultWebSearch]);
    useEffect(() => { preferenceService.setPreference('defaultMinigameDifficulty', defaultMinigameDifficulty); }, [defaultMinigameDifficulty]);
    useEffect(() => { preferenceService.setPreference('confirmCreditSpend', confirmCreditSpend); }, [confirmCreditSpend]);
    
    const handleClearData = () => {
        playSound(audioService.playTrash);
        if (window.confirm('Are you sure you want to clear all application data stored in your browser and reset the app? This cannot be undone.')) {
            try {
                localStorage.clear();
                sessionStorage.clear();
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
                        <select
                            value={language}
                            onChange={(e) => { playSound(audioService.playClick); setLanguage(e.target.value as any); }}
                            className="w-full mt-2 p-2 bg-brand-light text-black border-2 border-black font-sans"
                        >
                            <option value="th">{t('settings.langTh')}</option>
                            <option value="en">{t('settings.langEn')}</option>
                            <option value="ja">{t('settings.langJa')}</option>
                            <option value="fr">{t('settings.langFr')}</option>
                        </select>
                    </div>
                    <SettingToggle label={t('settings.uiAnimations')} isChecked={uiAnimations} onToggle={() => { playSound(audioService.playToggle); onUiAnimationsChange(!uiAnimations); }} />
                    <SettingToggle label="High Contrast" isChecked={highContrast} onToggle={() => { playSound(audioService.playToggle); setHighContrast(p => !p); }} />
                </Section>
                
                <Section title={t('settings.sound')}>
                    <SettingToggle label={t('settings.soundEffects')} isChecked={isSoundOn} onToggle={onToggleSound} />
                    <SettingToggle label="Autoplay Sounds" description="Automatically play generated sounds and music." isChecked={autoPlaySounds} onToggle={() => { playSound(audioService.playToggle); setAutoPlaySounds(p => !p); }} />
                </Section>

                <Section title={t('settings.creation')}>
                     <div>
                        <label htmlFor="default-image-mode" className="font-press-start">{t('settings.defaultImageMode')}</label>
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
                        <label className="font-press-start">{t('settings.imageQuality')}</label>
                        <div className="flex gap-4 mt-2">
                            <label className="flex items-center gap-2">
                                <input type="radio" name="image-quality" value="fast" checked={imageQuality === 'fast'} onChange={() => setImageQuality('fast')} className="w-5 h-5 accent-brand-magenta" />
                                <span>{t('settings.qualityFast')}</span>
                            </label>
                             <label className="flex items-center gap-2">
                                <input type="radio" name="image-quality" value="quality" checked={imageQuality === 'quality'} onChange={() => setImageQuality('quality')} className="w-5 h-5 accent-brand-magenta" />
                                <span>{t('settings.qualityHigh')}</span>
                            </label>
                        </div>
                    </div>
                    <SettingToggle label="Auto-save to Gallery" description="Automatically save generated images to your gallery." isChecked={autoSaveToGallery} onToggle={() => { playSound(audioService.playToggle); setAutoSaveToGallery(p => !p); }} />
                </Section>

                <Section title={t('aiChat.title')}>
                     <div>
                        <label htmlFor="default-model-select" className="font-press-start">{t('settings.defaultAiChat')}</label>
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
                        <button onClick={() => setIsModelInfoOpen(true)} className="text-xs text-brand-cyan underline mt-2">Learn more about models</button>
                    </div>
                    <SettingToggle label={t('settings.saveChatHistory')} description="Save chat history in your browser." isChecked={saveChatHistory} onToggle={() => { playSound(audioService.playToggle); setSaveChatHistory(p => !p); }} />
                    <SettingToggle label="Enable Web Search" description="Enable web search by default for compatible models." isChecked={defaultWebSearch} onToggle={() => { playSound(audioService.playToggle); setDefaultWebSearch(p => !p); }} />
                </Section>
                
                 <Section title={t('settings.minigames')}>
                     <div>
                        <label htmlFor="default-minigame-difficulty" className="font-press-start">{t('settings.defaultDifficulty')}</label>
                        <select
                            id="default-minigame-difficulty"
                            value={defaultMinigameDifficulty}
                            onChange={(e) => setDefaultMinigameDifficulty(e.target.value as any)}
                            className="w-full mt-2 p-2 bg-brand-light text-black border-2 border-black"
                        >
                            <option value="easy">{t('settings.difficultyEasy')}</option>
                            <option value="normal">{t('settings.difficultyNormal')}</option>
                            <option value="hard">{t('settings.difficultyHard')}</option>
                        </select>
                         <p className="text-xs text-brand-light/70 mt-1">Applies to games that support difficulty levels.</p>
                    </div>
                </Section>
                
                <Section title="Data Management">
                    <SettingToggle label="Confirm Credit Spend" description="Show a confirmation dialog before spending credits." isChecked={confirmCreditSpend} onToggle={() => { playSound(audioService.playToggle); setConfirmCreditSpend(p => !p); }} />
                    <button onClick={handleClearData} className="w-full p-3 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel font-press-start text-sm hover:bg-red-500">
                        Reset App & Clear Stored Data
                    </button>
                    <p className="text-xs text-brand-light/70 text-center">
                        This clears any data saved by the app in your browser (from previous versions) and reloads the page to its original state.
                    </p>
                </Section>

                <footer className="text-center text-xs text-brand-light/50 py-4 font-sans">
                    Version: 2.54.179810000
                </footer>
            </main>
        </PageWrapper>
    );
};