

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as audioService from '../services/audioService';
import { 
    getVideosOperation, 
    generateVideo,
    generateVideoSummary,
    generateSubtitlesFromVideo
} from '../services/geminiService';
import { PageHeader, PageWrapper } from './PageComponents';
import { UploadIcon } from './icons/UploadIcon';
import { LoadingSpinner } from './LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { MusicNoteIcon } from './icons/MusicNoteIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { TextToSpeechIcon } from './icons/TextToSpeechIcon';
import { CropIcon } from './icons/CropIcon';

interface VideoEditorPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

const languages = [
    { name: 'ไทย', code: 'th-TH' },
    { name: 'English', code: 'en-US' },
    { name: '日本語', code: 'ja-JP' },
    { name: '한국어', code: 'ko-KR' },
    { name: '中文 (简体)', code: 'zh-CN' },
    { name: 'Français', code: 'fr-FR' },
    { name: 'Deutsch', code: 'de-DE' },
    { name: 'Español', code: 'es-ES' },
    { name: 'Português', code: 'pt-BR' },
    { name: 'Русский', code: 'ru-RU' },
    { name: 'Tiếng Việt', code: 'vi-VN' },
    { name: 'Bahasa Indonesia', code: 'id-ID' },
];

export const VideoEditorPage: React.FC<VideoEditorPageProps> = ({ onClose, playSound, isOnline }) => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [addSubs, setAddSubs] = useState(false);
    const [subtitleLanguage, setSubtitleLanguage] = useState<string>('th-TH');
    const [autoDetectLanguage, setAutoDetectLanguage] = useState<boolean>(true);


    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [subtitleVttUrl, setSubtitleVttUrl] = useState<string | null>(null);
    
    const [activeTool, setActiveTool] = useState<'edit' | 'subs' | 'crop' | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const isAudioFile = uploadedFile?.type.startsWith('audio/') ?? false;

    const resetState = (clearFile: boolean = false) => {
        setError(null);
        setIsLoading(false);
        setGeneratedVideoUrl(null);
        setSubtitleVttUrl(null);
        setPrompt('');
        setAddSubs(false);
        setActiveTool(null);
        setAutoDetectLanguage(true);
        setSubtitleLanguage('th-TH');

        if (clearFile) {
            setUploadedFile(null);
            if (filePreview) URL.revokeObjectURL(filePreview);
            setFilePreview(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
            setError('กรุณาเลือกไฟล์วิดีโอหรือไฟล์เสียง');
            return;
        }

        resetState(true);
        setUploadedFile(file);
        const url = URL.createObjectURL(file);
        setFilePreview(url);
        playSound(audioService.playSelection);
    };

    const handleUploadClick = useCallback(() => {
        playSound(audioService.playClick);
        fileInputRef.current?.click();
    }, [playSound]);

    const pollVideoOperation = useCallback(async (operation: any, retries = 20) => {
        if (retries <= 0) {
            setError('การสร้างวิดีโอใช้เวลานานเกินไป โปรดลองอีกครั้ง');
            setIsLoading(false);
            return;
        }

        try {
            const updatedOperation = await getVideosOperation(operation);
            if (updatedOperation.done) {
                const downloadLink = updatedOperation.response?.generatedVideos?.[0]?.video?.uri;
                if (downloadLink) {
                    setGeneratedVideoUrl(downloadLink);
                } else {
                     throw new Error('ไม่พบลิงก์วิดีโอในผลลัพธ์');
                }
                if (!addSubs) {
                    setIsLoading(false);
                    playSound(audioService.playSuccess);
                }
            } else {
                setTimeout(() => pollVideoOperation(updatedOperation, retries - 1), 10000);
            }
        } catch (err) {
            playSound(audioService.playError);
            const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
            setError(errorMessage);
            setIsLoading(false);
        }
    }, [addSubs, playSound]);

    const generateSubtitles = useCallback(async (mediaFile: File) => {
         try {
            const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = error => reject(error);
            });
            const base64Data = await toBase64(mediaFile);
            const languageToGenerate = autoDetectLanguage ? 'auto' : subtitleLanguage;
            const vttContent = await generateSubtitlesFromVideo(base64Data, mediaFile.type, languageToGenerate);
            const vttBlob = new Blob([vttContent], { type: 'text/vtt' });
            setSubtitleVttUrl(URL.createObjectURL(vttBlob));
         } catch(err) {
            console.error("Subtitle generation failed:", err);
            setError(prev => prev ? `${prev} (สร้างคำบรรยายล้มเหลว)` : 'สร้างคำบรรยายล้มเหลว');
         } finally {
             if (isAudioFile || !prompt.trim()) {
                setIsLoading(false);
                playSound(audioService.playSuccess);
            }
         }
    }, [isAudioFile, prompt, playSound, autoDetectLanguage, subtitleLanguage]);
    
    const handleGenerate = useCallback(async () => {
        if (!uploadedFile || isLoading || !isOnline) return;

        if(activeTool === 'crop'){
             setError("ยังไม่รองรับการครอบตัดวิดีโอ");
             return;
        }

        if (isAudioFile && !addSubs) {
            setError('สำหรับไฟล์เสียง, กรุณาเลือก "สร้างคำบรรยายอัตโนมัติ"');
            return;
        }
        if (!isAudioFile && !prompt.trim() && !addSubs) {
            setError('กรุณาป้อนคำสั่งหรือเลือกสร้างคำบรรยาย');
            return;
        }

        resetState();
        playSound(audioService.playGenerate);
        setIsLoading(true);
        setActiveTool(null);

        if (addSubs) {
            generateSubtitles(uploadedFile);
        }

        if (!isAudioFile && prompt.trim()) {
            try {
                const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve((reader.result as string).split(',')[1]);
                    reader.onerror = error => reject(error);
                });

                const base64Data = await toBase64(uploadedFile);
                const summary = await generateVideoSummary(base64Data, uploadedFile.type);
                const enhancedPrompt = `A pixel art style video, inspired by a video described as: "${summary}". The user wants to apply this edit: "${prompt}".`;
                const operation = await generateVideo(enhancedPrompt);
                pollVideoOperation(operation);
            } catch (err) {
                playSound(audioService.playError);
                const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างวิดีโอ';
                setError(errorMessage);
                setIsLoading(false);
            }
        }
    }, [uploadedFile, isLoading, isAudioFile, addSubs, prompt, playSound, generateSubtitles, pollVideoOperation, isOnline, activeTool]);


    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isLoading) return;

            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const isCtrlCmd = isMac ? event.metaKey : event.ctrlKey;

            if (isCtrlCmd && event.key === 'Enter') {
                event.preventDefault();
                handleGenerate();
            } else if (event.altKey && event.key.toLowerCase() === 'u') {
                event.preventDefault();
                handleUploadClick();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLoading, handleGenerate, handleUploadClick]);

    const renderResult = () => {
        if (isLoading) return <LoadingSpinner text="AI กำลังตัดต่อ..." />;
        if (error) return <div role="alert" className="text-center text-brand-magenta font-press-start p-4"><p>ข้อผิดพลาด</p><p className="text-xs mt-4 font-sans">{error}</p></div>;
        if (generatedVideoUrl) {
            const videoUrlWithKey = `${generatedVideoUrl}&key=${process.env.API_KEY}`;
            return (
                 <video key={generatedVideoUrl} controls autoPlay loop className="w-full h-full object-contain" crossOrigin="anonymous">
                    <source src={videoUrlWithKey} type="video/mp4" />
                    {subtitleVttUrl && <track label="Generated Subs" kind="subtitles" srcLang={subtitleLanguage.split('-')[0]} src={subtitleVttUrl} default />}
                </video>
            );
        }
        if (subtitleVttUrl && filePreview) {
             if (isAudioFile) {
                return (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-4 bg-black/30">
                         <MusicNoteIcon className="w-24 h-24 text-brand-cyan" />
                         <p className="font-press-start text-sm truncate max-w-full" title={uploadedFile?.name}>{uploadedFile?.name}</p>
                         <audio key={filePreview} controls className="w-full" src={filePreview}>
                            เบราว์เซอร์ของคุณไม่รองรับแท็กเสียง
                         </audio>
                         <a 
                             href={subtitleVttUrl} 
                             download={`${uploadedFile?.name?.split('.').slice(0, -1).join('.') || 'subtitles'}.vtt`}
                             onMouseEnter={() => playSound(audioService.playHover)}
                             className="w-full flex items-center justify-center gap-3 p-3 bg-brand-yellow text-black border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-magenta hover:text-white"
                         >
                            <DownloadIcon className="w-5 h-5"/>
                            <span>ดาวน์โหลดไฟล์คำบรรยาย (.vtt)</span>
                         </a>
                    </div>
                );
            } else {
                return (
                     <video key={filePreview} controls autoPlay loop className="w-full h-full object-contain" crossOrigin="anonymous">
                        <source src={filePreview} type={uploadedFile?.type} />
                        <track label="Generated Subs" kind="subtitles" srcLang={subtitleLanguage.split('-')[0]} src={subtitleVttUrl} default />
                    </video>
                );
            }
        }
        if (filePreview && uploadedFile) {
             if (isAudioFile) {
                 return (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-4 bg-black/30">
                        <MusicNoteIcon className="w-24 h-24 text-brand-cyan" />
                        <p className="font-press-start text-sm truncate max-w-full" title={uploadedFile.name}>{uploadedFile.name}</p>
                        <audio controls className="w-full" src={filePreview}>
                            เบราว์เซอร์ของคุณไม่รองรับแท็กเสียง
                        </audio>
                    </div>
                );
            } else {
                 return <video src={filePreview} controls loop className="w-full h-full object-contain" />;
            }
        }
         return (
            <div className="text-center space-y-4">
                <p className="text-sm text-brand-light/80">อัปโหลดวิดีโอหรือเสียงเพื่อเริ่มต้นตัดต่อ!</p>
                <button 
                    onClick={handleUploadClick} 
                    onMouseEnter={() => playSound(audioService.playHover)}
                    title="ปุ่มลัด: Alt+U"
                    className="flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px]">
                    <UploadIcon className="w-6 h-6" /> อัปโหลดไฟล์
                </button>
            </div>
        );
    }
    
    const canGenerate = isOnline && !isLoading && uploadedFile && ((!isAudioFile && (prompt.trim() || addSubs || activeTool === 'crop')) || (isAudioFile && addSubs));

    return (
        <PageWrapper>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="video/*,audio/*"
                className="hidden"
                aria-hidden="true"
            />
            <PageHeader title="AI Video Editor (รุ่นทดลอง)" onBack={onClose} />
            <main id="main-content" className="w-full max-w-6xl mx-auto p-4 flex-grow overflow-y-auto flex flex-col items-center gap-4 font-sans">
                <div className="w-full h-auto aspect-video bg-black/50 border-4 border-brand-light flex items-center justify-center shadow-pixel">
                    {renderResult()}
                </div>
                
                {uploadedFile && (
                <>
                    <div className="w-full flex flex-col gap-2">
                        {activeTool === 'edit' && !isAudioFile && (
                            <div className="p-4 bg-black/20 border-2 border-brand-light/50">
                                <label htmlFor="prompt-input" className="text-xs font-press-start text-brand-cyan">แก้ไขวิดีโอด้วย AI</label>
                                <textarea
                                    id="prompt-input"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="เช่น เปลี่ยนสไตล์เป็น 8-bit, สร้างตัวอย่าง 10 วินาที"
                                    className="w-full h-20 p-2 mt-2 bg-brand-light text-black rounded-none border-2 border-black focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-y"
                                    disabled={isLoading || !isOnline}
                                />
                            </div>
                        )}
                         {activeTool === 'subs' && (
                            <div className="p-4 bg-black/20 border-2 border-brand-light/50 space-y-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={addSubs} 
                                        onChange={(e) => { playSound(audioService.playToggle); setAddSubs(e.target.checked); }} 
                                        disabled={isLoading || !isOnline}
                                        className="w-6 h-6 accent-brand-magenta"
                                    />
                                    <span className="text-sm font-press-start">สร้างคำบรรยายอัตโนมัติ</span>
                                </label>

                                {addSubs && (
                                    <div className="pl-9 space-y-4">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={autoDetectLanguage} 
                                                onChange={(e) => { playSound(audioService.playToggle); setAutoDetectLanguage(e.target.checked); }} 
                                                disabled={isLoading || !isOnline}
                                                className="w-5 h-5 accent-brand-magenta"
                                            />
                                            <span className="text-sm">ตรวจจับภาษาอัตโนมัติ</span>
                                        </label>
                                        
                                        <div className="flex flex-col gap-2">
                                            <label htmlFor="language-select" className={`text-xs font-press-start text-brand-cyan transition-opacity ${autoDetectLanguage ? 'opacity-50' : 'opacity-100'}`}>
                                                หรือเลือกภาษา:
                                            </label>
                                            <select
                                                id="language-select"
                                                value={subtitleLanguage}
                                                onChange={(e) => { playSound(audioService.playSelection); setSubtitleLanguage(e.target.value); }}
                                                className="w-full p-2 bg-brand-light text-black border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={isLoading || !isOnline || autoDetectLanguage}
                                                aria-label="เลือกภาษาสำหรับคำบรรยาย"
                                            >
                                                {languages.map(lang => (
                                                    <option key={lang.code} value={lang.code}>
                                                        {lang.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                
                    {/* Toolbar */}
                    <div className="w-full grid grid-cols-5 gap-2 p-2 bg-black/30 border-2 border-brand-light/50">
                        <button 
                            onClick={() => { playSound(audioService.playClick); setActiveTool(t => t === 'edit' ? null : 'edit')}}
                            disabled={isAudioFile || isLoading}
                            className={`flex flex-col items-center justify-center gap-1 p-2 border-2 transition-colors ${activeTool === 'edit' ? 'bg-brand-yellow text-black border-black' : 'bg-black/50 border-brand-light hover:bg-brand-cyan/20'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <SparklesIcon className="w-6 h-6"/>
                            <span className="text-xs font-press-start">แก้ไข</span>
                        </button>
                         <button
                            onClick={() => { playSound(audioService.playClick); setActiveTool(t => t === 'subs' ? null : 'subs')}}
                            disabled={isLoading}
                             className={`flex flex-col items-center justify-center gap-1 p-2 border-2 transition-colors ${activeTool === 'subs' ? 'bg-brand-yellow text-black border-black' : 'bg-black/50 border-brand-light hover:bg-brand-cyan/20'}`}
                        >
                            <TextToSpeechIcon className="w-6 h-6"/>
                            <span className="text-xs font-press-start">คำบรรยาย</span>
                        </button>
                        <button
                            onClick={() => { playSound(audioService.playClick); setActiveTool(t => t === 'crop' ? null : 'crop')}}
                            disabled={isAudioFile || isLoading}
                            className={`flex flex-col items-center justify-center gap-1 p-2 border-2 transition-colors relative ${activeTool === 'crop' ? 'bg-brand-yellow text-black border-black' : 'bg-black/50 border-brand-light hover:bg-brand-cyan/20'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <CropIcon className="w-6 h-6"/>
                            <span className="text-xs font-press-start">ครอบตัด</span>
                             <div className="absolute -top-1 -right-1 bg-brand-magenta text-white text-[8px] font-press-start px-1 border border-black">ใหม่</div>
                        </button>
                         <button disabled={true} className="flex flex-col items-center justify-center gap-1 p-2 border-2 bg-black/50 border-brand-light opacity-50 cursor-not-allowed relative">
                            <MusicNoteIcon className="w-6 h-6"/>
                            <span className="text-xs font-press-start">เสียง</span>
                             <div className="absolute -top-1 -right-1 bg-brand-magenta text-white text-[8px] font-press-start px-1 border border-black">เร็วๆนี้</div>
                        </button>
                         <button onClick={handleUploadClick} disabled={isLoading} className="flex flex-col items-center justify-center gap-1 p-2 border-2 bg-black/50 border-brand-light hover:bg-brand-cyan/20">
                            <UploadIcon className="w-6 h-6"/>
                            <span className="text-xs font-press-start">แทนที่</span>
                        </button>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={!canGenerate}
                        onMouseEnter={() => playSound(audioService.playHover)}
                        title={!isOnline ? 'ฟีเจอร์นี้ต้องใช้การเชื่อมต่ออินเทอร์เน็ต' : 'ปุ่มลัด: Ctrl+Enter'}
                        className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        <SparklesIcon className="w-6 h-6" />
                        {isLoading ? 'กำลังสร้าง...' : 'สร้างผลลัพธ์'}
                    </button>
                </>
                )}
            </main>
        </PageWrapper>
    );
};