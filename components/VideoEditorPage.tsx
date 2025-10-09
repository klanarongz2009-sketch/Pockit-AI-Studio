import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as audioService from '../services/audioService';
import * as preferenceService from '../services/preferenceService';
import { 
    getVideosOperation, 
    generateVideo,
    generateVideoSummary,
    generateSubtitlesFromVideo,
    parseApiError
} from '../services/geminiService';
import { PageHeader, PageWrapper } from './PageComponents';
import { UploadIcon } from './icons/UploadIcon';
import { LoadingSpinner } from './LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { MusicNoteIcon } from './icons/MusicNoteIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { SubtitlesIcon } from './icons/SubtitlesIcon';

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
    const [subtitleLanguage, setSubtitleLanguage] = useState<string>(() => preferenceService.getPreference('videoEditorSubtitleLang', 'th-TH'));
    const [autoDetectLanguage, setAutoDetectLanguage] = useState<boolean>(() => preferenceService.getPreference('videoEditorAutoDetectLang', true));
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [subtitleVttUrl, setSubtitleVttUrl] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isAudioFile = uploadedFile?.type.startsWith('audio/') ?? false;

    useEffect(() => {
        preferenceService.setPreference('videoEditorSubtitleLang', subtitleLanguage);
    }, [subtitleLanguage]);

    useEffect(() => {
        preferenceService.setPreference('videoEditorAutoDetectLang', autoDetectLanguage);
    }, [autoDetectLanguage]);

    const resetState = (clearFile: boolean = false) => {
        setError(null);
        setIsLoading(false);
        setGeneratedVideoUrl(null);
        setSubtitleVttUrl(null);
        
        if (clearFile) {
            setUploadedFile(null);
            if (filePreview) URL.revokeObjectURL(filePreview);
            setFilePreview(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            setPrompt('');
            setAddSubs(false);
        }
    };

    const processFile = (file: File | undefined) => {
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

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        processFile(event.target.files?.[0]);
    };

    const handleUploadClick = useCallback(() => {
        playSound(audioService.playClick);
        fileInputRef.current?.click();
    }, [playSound]);
    
    const handleDragEnter = (e: React.DragEvent<HTMLElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent<HTMLElement>) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };

    const pollVideoOperation = useCallback(async (operation: any, retries = 20): Promise<void> => {
        if (retries <= 0) {
            throw new Error('การสร้างวิดีโอใช้เวลานานเกินไป โปรดลองอีกครั้ง');
        }

        const updatedOperation = await getVideosOperation(operation);
        if (updatedOperation.done) {
            if (updatedOperation.error) {
                throw new Error(String(updatedOperation.error.message));
            }
            const downloadLink = updatedOperation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
                setGeneratedVideoUrl(downloadLink);
            } else {
                 throw new Error('ไม่พบลิงก์วิดีโอในผลลัพธ์ อาจเกิดจากปัญหาความปลอดภัยหรือข้อผิดพลาดที่ไม่ทราบสาเหตุ');
            }
        } else {
            await new Promise(resolve => setTimeout(resolve, 10000));
            await pollVideoOperation(updatedOperation, retries - 1);
        }
    }, []);

    const generateSubtitles = useCallback(async (mediaFile: File): Promise<void> => {
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
            throw err;
         }
    }, [autoDetectLanguage, subtitleLanguage]);
    
    const handleGenerate = useCallback(async () => {
        if (!uploadedFile || isLoading || !isOnline) return;
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

        try {
            const promises: Promise<void>[] = [];
            if (addSubs) {
                promises.push(generateSubtitles(uploadedFile));
            }
            if (!isAudioFile && prompt.trim()) {
                const videoPromise = async () => {
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
                    await pollVideoOperation(operation);
                };
                promises.push(videoPromise());
            }
            
            await Promise.all(promises);
            playSound(audioService.playSuccess);

        } catch (err) {
            playSound(audioService.playError);
            setError(parseApiError(err));
        } finally {
            setIsLoading(false);
        }
    }, [uploadedFile, isLoading, isAudioFile, addSubs, prompt, playSound, generateSubtitles, pollVideoOperation, isOnline, resetState]);


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
    
    const canGenerate = isOnline && !isLoading && uploadedFile && ((!isAudioFile && (prompt.trim() || addSubs)) || (isAudioFile && addSubs));

    return (
        <PageWrapper className="justify-start">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*,audio/*" className="hidden" aria-hidden="true" />
            <PageHeader title="AI Video Editor (รุ่นทดลอง)" onBack={onClose} />
            <main 
                id="main-content"
                className="w-full max-w-4xl flex-grow flex flex-col items-center gap-4 font-sans"
                onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            >
                {isDragging && (
                    <div className="absolute inset-0 bg-black/80 border-4 border-dashed border-brand-yellow z-10 flex flex-col items-center justify-center pointer-events-none">
                        <UploadIcon className="w-12 h-12 text-brand-yellow" />
                        <p className="font-press-start text-xl text-brand-yellow mt-4">วางไฟล์ของคุณที่นี่</p>
                    </div>
                )}
                <div className="w-full h-auto aspect-video bg-black/50 border-4 border-brand-light flex items-center justify-center shadow-pixel" aria-live="polite">
                    {isLoading ? <LoadingSpinner text="AI กำลังตัดต่อ..." /> :
                    error ? (
                        <div role="alert" className="w-full h-full p-4 flex flex-col items-center justify-center gap-4 text-center bg-black/40 border-4 border-brand-magenta">
                            <h3 className="font-press-start text-lg text-brand-magenta">เกิดข้อผิดพลาด</h3>
                            <p className="font-sans text-sm break-words text-brand-light/90 max-w-md">{error}</p>
                        </div>
                    ) : generatedVideoUrl ? (
                        <video key={generatedVideoUrl} controls autoPlay loop className="w-full h-full object-contain" crossOrigin="anonymous">
                            <source src={`${generatedVideoUrl}&key=${process.env.API_KEY}`} type="video/mp4" />
                            {subtitleVttUrl && <track label="Subtitles" kind="subtitles" srcLang="th" src={subtitleVttUrl} default />}
                        </video>
                    ) : subtitleVttUrl && filePreview ? (
                        isAudioFile ? (
                             <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-4 bg-black/30">
                                 <MusicNoteIcon className="w-24 h-24 text-brand-cyan" />
                                 <p className="font-press-start text-sm truncate max-w-full" title={uploadedFile?.name}>{uploadedFile?.name}</p>
                                 <audio key={filePreview} controls className="w-full" src={filePreview} />
                                 <a href={subtitleVttUrl} download={`${uploadedFile?.name?.split('.').slice(0, -1).join('.') || 'subtitles'}.vtt`} className="w-full flex items-center justify-center gap-3 p-3 bg-brand-yellow text-black border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-magenta hover:text-white">
                                    <DownloadIcon className="w-5 h-5"/>
                                    <span>ดาวน์โหลดไฟล์คำบรรยาย (.vtt)</span>
                                 </a>
                            </div>
                        ) : (
                             <video key={filePreview} controls autoPlay loop className="w-full h-full object-contain" crossOrigin="anonymous">
                                <source src={filePreview} type={uploadedFile?.type} />
                                <track label="Subtitles" kind="subtitles" srcLang="th" src={subtitleVttUrl} default />
                            </video>
                        )
                    ) : filePreview && uploadedFile ? (
                        isAudioFile ? (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-4 bg-black/30">
                                <MusicNoteIcon className="w-24 h-24 text-brand-cyan" />
                                <p className="font-press-start text-sm truncate max-w-full" title={uploadedFile.name}>{uploadedFile.name}</p>
                                <audio controls className="w-full" src={filePreview} />
                            </div>
                        ) : (
                            <video src={filePreview} controls loop className="w-full h-full object-contain" />
                        )
                    ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 border-4 border-dashed border-border-primary/50 cursor-pointer hover:border-brand-yellow" onClick={handleUploadClick}>
                            <UploadIcon className="w-12 h-12 text-border-primary/70 mb-4" />
                            <p className="font-press-start text-lg">ลากและวางวิดีโอหรือเสียงที่นี่</p>
                            <p className="text-sm text-text-secondary mt-2">หรือคลิกเพื่ออัปโหลด</p>
                        </div>
                    )}
                </div>
                
                {uploadedFile && (
                <div className="w-full space-y-4">
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-black/20 border-2 border-border-primary space-y-3">
                             <div className="flex justify-between items-center">
                                <h3 className="font-press-start text-brand-cyan">แก้ไขด้วย AI <span className="text-xs text-brand-magenta">(BETA)</span></h3>
                                {isAudioFile && <span className="text-xs text-yellow-400">ใช้ได้กับวิดีโอเท่านั้น</span>}
                            </div>
                            <textarea
                                id="prompt-input"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="เช่น เปลี่ยนสไตล์เป็น 8-bit, สร้างตัวอย่าง 10 วินาที"
                                className="w-full h-20 p-2 bg-brand-light text-black rounded-none border-2 border-black focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-y disabled:bg-gray-400 disabled:cursor-not-allowed"
                                disabled={isLoading || !isOnline || isAudioFile}
                            />
                        </div>

                         <div className="p-4 bg-black/20 border-2 border-border-primary space-y-4">
                             <h3 className="font-press-start text-brand-cyan">คำบรรยายอัตโนมัติ</h3>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={addSubs} onChange={(e) => { playSound(audioService.playToggle); setAddSubs(e.target.checked); }} disabled={isLoading || !isOnline} className="w-6 h-6 accent-brand-magenta" />
                                <span className="text-sm font-press-start">สร้างคำบรรยาย</span>
                            </label>
                             <div className={`space-y-2 transition-opacity ${addSubs ? 'opacity-100' : 'opacity-50'}`}>
                                 <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={autoDetectLanguage} onChange={(e) => { playSound(audioService.playToggle); setAutoDetectLanguage(e.target.checked); }} disabled={isLoading || !isOnline || !addSubs} className="w-5 h-5 accent-brand-magenta" />
                                    <span className="text-sm">ตรวจจับภาษาอัตโนมัติ</span>
                                </label>
                                 <div className="flex flex-col gap-1">
                                      <label htmlFor="language-select" className={`text-xs font-press-start text-brand-light/70 transition-opacity ${autoDetectLanguage ? 'opacity-50' : 'opacity-100'}`}>หรือเลือกภาษา:</label>
                                      <select id="language-select" value={subtitleLanguage} onChange={(e) => setSubtitleLanguage(e.target.value)} disabled={isLoading || !isOnline || autoDetectLanguage || !addSubs} className="w-full max-w-xs p-2 bg-brand-light text-black border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed">
                                        {languages.map(lang => (<option key={lang.code} value={lang.code}>{lang.name}</option>))}
                                    </select>
                                </div>
                             </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <button onClick={handleUploadClick} disabled={isLoading} onMouseEnter={() => playSound(audioService.playHover)} title="ปุ่มลัด: Alt+U" className="text-sm underline hover:text-brand-yellow disabled:opacity-50 disabled:cursor-not-allowed">
                            แทนที่ไฟล์
                        </button>
                    </div>

                    <button onClick={handleGenerate} disabled={!canGenerate} onMouseEnter={() => playSound(audioService.playHover)} title={!isOnline ? 'ฟีเจอร์นี้ต้องใช้การเชื่อมต่ออินเทอร์เน็ต' : 'ปุ่มลัด: Ctrl+Enter'} className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed">
                        <SparklesIcon className="w-6 h-6" />
                        {isLoading ? 'กำลังประมวลผล...' : 'ประมวลผลวิดีโอ'}
                    </button>
                </div>
                )}
            </main>
        </PageWrapper>
    );
};
