import React, { useState, useEffect } from 'react';
import { PageHeader, PageWrapper } from './PageComponents';
import * as audioService from '../services/audioService';
import * as preferenceService from '../services/preferenceService';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { InfoIcon } from './icons/InfoIcon';

interface SettingsPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isSoundOn: boolean;
    onToggleSound: () => void;
    musicVolume: number;
    onMusicVolumeChange: (volume: number) => void;
    aiModels: { name: string; }[];
    onOpenAbout: () => void;
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
    onOpenAbout,
    uiAnimations,
    onUiAnimationsChange,
}) => {
    const { themePreference, setThemePreference } = useTheme();
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
        if (window.confirm('คุณต้องการลบแกลเลอรีและประวัติเพลงทั้งหมดหรือไม่?')) {
            try {
                const keysToRemove = ['ai-art-gallery-artworks', 'ai-studio-song-history'];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('ai-art-gallery-comments-')) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
                alert('ลบข้อมูลเรียบร้อยแล้ว');
                window.location.reload();
            } catch (e) {
                alert('ไม่สามารถล้างข้อมูลได้');
                console.error(e);
            }
        }
    };


    const handleClearData = () => {
        playSound(audioService.playTrash);
        if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้ และจะลบเครดิต, แกลเลอรี, และการตั้งค่าทั้งหมดของคุณ')) {
            try {
                localStorage.clear();
                window.location.reload();
            } catch (e) {
                alert('ไม่สามารถล้างข้อมูลได้');
                console.error(e);
            }
        }
    };

    return (
        <PageWrapper>
            <PageHeader title="การตั้งค่า" onBack={onClose} />
            <main id="main-content" className="w-full max-w-2xl flex-grow overflow-y-auto font-sans pr-2 space-y-6">
                
                <Section title="ทั่วไป">
                     <div>
                        <label htmlFor="language-select" className="font-press-start">Language / ภาษา</label>
                        <select
                            id="language-select"
                            // value={language}
                            // onChange={(e) => setLanguage(e.target.value)}
                            disabled // Placeholder UI
                            className="w-full mt-2 p-2 bg-brand-light text-black border-2 border-black disabled:opacity-50"
                        >
                            <option value="th">ไทย</option>
                            <option value="en">English</option>
                             <option value="zh">中文 (简体)</option>
                             <option value="fr">Français</option>
                        </select>
                         <p className="text-xs text-brand-light/70 mt-1">การแปลภาษาจะพร้อมใช้งานในเวอร์ชันถัดไป</p>
                    </div>
                    <button
                        onClick={() => { playSound(audioService.playClick); onOpenAbout(); }}
                        className="w-full p-3 bg-surface-primary border-4 border-border-primary text-text-primary shadow-pixel font-press-start text-sm transition-all hover:bg-brand-cyan/20 flex items-center justify-center gap-2"
                    >
                        <InfoIcon className="w-5 h-5" />
                        <span>เกี่ยวกับแอป</span>
                    </button>
                </Section>
                
                <Section title="ธีม">
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
                                <span>{pref === 'light' ? 'สว่าง' : pref === 'dark' ? 'มืด' : 'ตามระบบ'}</span>
                            </button>
                        ))}
                    </div>
                </Section>

                <Section title="เสียง">
                    <div className="flex items-center justify-between">
                        <label className="font-press-start" htmlFor="sound-toggle-btn">เสียงประกอบ</label>
                        <button id="sound-toggle-btn" onClick={onToggleSound} className="p-2 border-2 border-border-primary">
                            {isSoundOn ? 'เปิด' : 'ปิด'}
                        </button>
                    </div>
                    <div>
                        <label htmlFor="music-volume" className="font-press-start flex justify-between">
                            <span>เพลงพื้นหลัง</span>
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

                <Section title="การแสดงผล">
                    <div className="flex items-center justify-between">
                        <label className="font-press-start" htmlFor="animations-toggle-btn">UI Animations</label>
                        <button
                            id="animations-toggle-btn"
                            onClick={() => {
                                playSound(audioService.playToggle);
                                onUiAnimationsChange(!uiAnimations);
                            }}
                            className="p-2 border-2 border-border-primary"
                        >
                            {uiAnimations ? 'เปิด' : 'ปิด'}
                        </button>
                    </div>
                </Section>
                
                <Section title="การสร้างผลงาน">
                     <div>
                        <label htmlFor="default-image-mode" className="font-press-start">โหมดสร้างภาพเริ่มต้น</label>
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
                        <label className="font-press-start">คุณภาพการสร้างภาพ</label>
                        <div className="flex gap-4 mt-2">
                            <label className="flex items-center gap-2">
                                <input type="radio" name="image-quality" value="fast" checked={imageQuality === 'fast'} onChange={() => setImageQuality('fast')} className="w-5 h-5 accent-brand-magenta" />
                                <span>รวดเร็ว</span>
                            </label>
                             <label className="flex items-center gap-2">
                                <input type="radio" name="image-quality" value="quality" checked={imageQuality === 'quality'} onChange={() => setImageQuality('quality')} className="w-5 h-5 accent-brand-magenta" />
                                <span>คุณภาพสูง</span>
                            </label>
                        </div>
                        <p className="text-xs text-brand-light/70 mt-1">หมายเหตุ: การตั้งค่านี้เป็นตัวอย่างและยังไม่มีผลต่อการสร้างภาพจริง</p>
                    </div>
                </Section>

                <Section title="AI Chat">
                     <div>
                        <label htmlFor="default-model-select" className="font-press-start">AI Chat เริ่มต้น</label>
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
                        <label className="font-press-start" htmlFor="save-history-btn">บันทึกประวัติแชท</label>
                         <button id="save-history-btn" onClick={() => setSaveChatHistory(prev => !prev)} className="p-2 border-2 border-border-primary">
                            {saveChatHistory ? 'เปิด' : 'ปิด'}
                        </button>
                    </div>
                     <p className="text-xs text-brand-light/70">หมายเหตุ: ประวัติการแชทจะถูกลบเมื่อปิดแท็บเบราว์เซอร์</p>
                </Section>
                
                 <Section title="มินิเกม">
                     <div>
                        <label htmlFor="default-minigame-difficulty" className="font-press-start">ระดับความยากเริ่มต้น</label>
                        <select
                            id="default-minigame-difficulty"
                            value={defaultMinigameDifficulty}
                            onChange={(e) => setDefaultMinigameDifficulty(e.target.value as any)}
                            className="w-full mt-2 p-2 bg-brand-light text-black border-2 border-black"
                        >
                            <option value="easy">ง่าย</option>
                            <option value="normal">ปกติ</option>
                            <option value="hard">ยาก</option>
                        </select>
                         <p className="text-xs text-brand-light/70 mt-1">มีผลกับเกมที่รองรับการปรับระดับความยาก</p>
                    </div>
                </Section>

                <Section title="การจัดการข้อมูล">
                    <button
                        onClick={handleClearArtData}
                        className="w-full p-3 bg-brand-yellow text-black border-4 border-brand-light shadow-pixel font-press-start text-sm transition-all hover:bg-yellow-500 active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px]"
                    >
                        ล้างแกลเลอรีและประวัติเพลง
                    </button>
                     <button
                        onClick={handleClearData}
                        className="w-full p-3 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel font-press-start text-sm transition-all hover:bg-red-500 active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px]"
                    >
                        ล้างข้อมูลทั้งหมด
                    </button>
                    <p className="text-xs text-brand-light/70 text-center">
                        การล้างข้อมูลทั้งหมดจะลบเครดิต, ประวัติ, รูปภาพในแกลเลอรี และการตั้งค่าทั้งหมด
                    </p>
                </Section>

            </main>
        </PageWrapper>
    );
};
