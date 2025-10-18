import React, { useState, useRef, useCallback } from 'react';
import * as geminiService from '../services/geminiService';
import * as audioService from '../services/audioService';
import { PageHeader, PageWrapper } from './PageComponents';
import { UploadIcon } from './icons/UploadIcon';
import { LoadingSpinner } from './LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { MusicNoteIcon } from './icons/MusicNoteIcon';
import { SoundWaveIcon } from './icons/SoundWaveIcon';
import { PaletteIcon } from './icons/PaletteIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface AnalyzeMediaPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

type AnalysisTool = 'scene' | 'enhance' | 'compress' | 'audio';
type AnalysisResult = { type: 'text'; content: string } | { type: 'image'; content: string, originalSize: number, newSize: number } | null;

export const AnalyzeMediaPage: React.FC<AnalyzeMediaPageProps> = ({ onClose, playSound, isOnline }) => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingText, setLoadingText] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState<AnalysisTool | null>(null);
    const [result, setResult] = useState<AnalysisResult>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    // Compression settings
    const [compressQuality, setCompressQuality] = useState(0.8);
    const [compressMaxSize, setCompressMaxSize] = useState(1024);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const isVideo = uploadedFile?.type.startsWith('video/') ?? false;
    const isImage = uploadedFile?.type.startsWith('image/') ?? false;
    const isAudio = uploadedFile?.type.startsWith('audio/') ?? false;

    const resetState = (clearFile: boolean = false) => {
        setIsLoading(false);
        setError(null);
        setActiveTool(null);
        setResult(null);
        setLoadingText('');
        if (clearFile) {
            setUploadedFile(null);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };
    
    const processFile = (file: File | undefined) => {
         if (!file) return;

        if (!file.type.startsWith('video/') && !file.type.startsWith('image/') && !file.type.startsWith('audio/')) {
            setError('กรุณาเลือกไฟล์วิดีโอ, รูปภาพ, หรือไฟล์เสียง');
            return;
        }
        resetState(true);
        setUploadedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        playSound(audioService.playSelection);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        processFile(event.target.files?.[0]);
    };

    const handleUploadClick = useCallback(() => {
        playSound(audioService.playClick);
        fileInputRef.current?.click();
    }, [playSound]);

    const runTool = async (tool: AnalysisTool) => {
        if (!uploadedFile || !isOnline) return;
        
        resetState();
        setActiveTool(tool);
        setIsLoading(true);
        playSound(audioService.playGenerate);
        
        try {
            const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = error => reject(error);
            });

            const base64Data = await toBase64(uploadedFile);

            switch(tool) {
                case 'scene':
                    setLoadingText('กำลังวิเคราะห์ฉาก...');
                    const description = isVideo
                        ? await geminiService.generateVideoSummary(base64Data, uploadedFile.type)
                        : await geminiService.generatePromptFromImage(base64Data, uploadedFile.type);
                    setResult({ type: 'text', content: description });
                    break;
                case 'enhance':
                    setLoadingText('กำลังปรับปรุงคุณภาพ...');
                    const enhancedImage = await geminiService.enhanceImageQuality(base64Data, uploadedFile.type);
                    setResult({ type: 'image', content: enhancedImage, originalSize: 0, newSize: 0 }); // Size info not available here
                    break;
                case 'compress':
                     setLoadingText('กำลังบีบอัดไฟล์...');
                     const compressedDataUrl = await new Promise<string>((resolve, reject) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const ratio = Math.min(compressMaxSize / img.width, compressMaxSize / img.height, 1);
                            canvas.width = img.width * ratio;
                            canvas.height = img.height * ratio;
                            const ctx = canvas.getContext('2d');
                            if (!ctx) return reject('ไม่สามารถสร้าง canvas ได้');
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                            resolve(canvas.toDataURL('image/jpeg', compressQuality));
                        };
                        img.onerror = reject;
                        img.src = previewUrl!;
                     });
                     const newSize = atob(compressedDataUrl.split(',')[1]).length;
                     setResult({ type: 'image', content: compressedDataUrl, originalSize: uploadedFile.size, newSize });
                    break;
                case 'audio':
                    setLoadingText('กำลังวิเคราะห์เสียง...');
                    const audioDesc = await geminiService.analyzeAudioFromMedia(base64Data, uploadedFile.type);
                    setResult({ type: 'text', content: audioDesc });
                    break;
            }
             playSound(audioService.playSuccess);
        } catch (err) {
            playSound(audioService.playError);
            setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด');
        } finally {
            setIsLoading(false);
        }
    };

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
    
    const ToolButton: React.FC<{
        label: string;
        icon: React.ReactNode;
        tool: AnalysisTool;
        disabled?: boolean;
        comingSoon?: boolean;
    }> = ({ label, icon, tool, disabled, comingSoon }) => (
        <div className="relative">
             <button
                onClick={() => runTool(tool)}
                disabled={disabled || isLoading || comingSoon}
                className={`w-full h-full flex flex-col items-center justify-center gap-1 p-2 border-2 transition-colors ${activeTool === tool ? 'bg-brand-yellow text-black border-black' : 'bg-black/50 border-brand-light hover:bg-brand-cyan/20'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                {icon}
                <span className="text-[10px] font-press-start">{label}</span>
            </button>
             {comingSoon && (
                <div className="absolute -top-1 -right-1 bg-brand-magenta text-white text-[8px] font-press-start px-1 border border-black">เร็วๆนี้</div>
            )}
        </div>
    );

    return (
        <PageWrapper className="justify-start">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*,image/*,audio/*" className="hidden" aria-hidden="true" />
            <PageHeader title="AI Media Analyzer" onBack={onClose} />
            <main 
                id="main-content" 
                className="w-full max-w-2xl flex-grow flex flex-col items-center gap-4 font-sans relative"
                onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            >
                {isDragging && (
                    <div className="absolute inset-0 bg-black/80 border-4 border-dashed border-brand-yellow z-10 flex flex-col items-center justify-center pointer-events-none">
                        <UploadIcon className="w-12 h-12 text-brand-yellow" />
                        <p className="font-press-start text-xl text-brand-yellow mt-4">วางไฟล์ที่นี่</p>
                    </div>
                )}
                <div className="w-full h-auto aspect-video bg-black/50 border-4 border-brand-light flex items-center justify-center shadow-pixel p-2">
                    {!uploadedFile ? (
                        <div className="text-center space-y-4">
                            <p className="text-sm text-brand-light/80">อัปโหลดรูปภาพ, วิดีโอ, หรือเสียงเพื่อเริ่มต้น</p>
                            <button onClick={handleUploadClick} className="flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px]">
                                <UploadIcon className="w-6 h-6" /> อัปโหลดไฟล์
                            </button>
                        </div>
                    ) : isVideo ? (
                        <video src={previewUrl!} controls loop className="w-full h-full object-contain" />
                    ) : isAudio ? (
                        <div className="text-center space-y-4 flex flex-col items-center justify-center w-full">
                            <MusicNoteIcon className="w-24 h-24 text-brand-cyan" />
                            <p className="font-press-start text-sm truncate max-w-full" title={uploadedFile.name}>{uploadedFile.name}</p>
                            <audio src={previewUrl!} controls className="w-full max-w-md" />
                        </div>
                    ) : (
                        <img src={previewUrl!} alt="Preview" className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                    )}
                </div>
                
                {uploadedFile && (
                    <>
                        <div className="w-full grid grid-cols-3 sm:grid-cols-5 gap-2 p-2 bg-black/30 border-2 border-brand-light/50">
                            <ToolButton label="วิเคราะห์ฉาก" icon={<PaletteIcon className="w-6 h-6" />} tool="scene" disabled={isAudio} />
                            <ToolButton label="ปรับปรุงคุณภาพ" icon={<SparklesIcon className="w-6 h-6" />} tool="enhance" disabled={!isImage} />
                            <ToolButton label="บีบอัดไฟล์" icon={<DownloadIcon className="w-6 h-6" />} tool="compress" disabled={!isImage} />
                            <ToolButton label="วิเคราะห์เสียง" icon={<SoundWaveIcon className="w-6 h-6" />} tool="audio" disabled={!isVideo && !isAudio} />
                            <ToolButton label="ปรับปรุงวิดีโอ" icon={<SparklesIcon className="w-6 h-6" />} tool="enhance" disabled={true} comingSoon={true} />
                        </div>

                        {activeTool === 'compress' && (
                             <div className="w-full p-4 bg-black/20 border-2 border-brand-light/50 space-y-4">
                                <h3 className="font-press-start text-sm text-brand-cyan">ตั้งค่าการบีบอัด (JPEG)</h3>
                                <div>
                                    <label htmlFor="quality" className="text-xs">คุณภาพ: {Math.round(compressQuality * 100)}%</label>
                                    <input type="range" id="quality" min="0.1" max="1" step="0.05" value={compressQuality} onChange={e => setCompressQuality(Number(e.target.value))} className="w-full" />
                                </div>
                                 <div>
                                    <label htmlFor="size" className="text-xs">ขนาดสูงสุด: {compressMaxSize}px</label>
                                    <input type="range" id="size" min="128" max="2048" step="128" value={compressMaxSize} onChange={e => setCompressMaxSize(Number(e.target.value))} className="w-full" />
                                </div>
                            </div>
                        )}
                        
                        <div className="w-full min-h-[10rem] p-4 bg-black/50 border-4 border-brand-light flex items-center justify-center">
                            {isLoading && <LoadingSpinner text={loadingText} />}
                            {error && <div role="alert" className="text-center text-brand-magenta"><p className="font-press-start">ข้อผิดพลาด</p><p className="text-sm mt-2">{error}</p></div>}
                            {result && !isLoading && (
                                <div className="w-full h-full">
                                    {result.type === 'text' && <p className="text-sm whitespace-pre-wrap">{result.content}</p>}
                                    {result.type === 'image' && (
                                        <div className="flex flex-col items-center gap-4">
                                            <img src={result.content} alt="ผลลัพธ์จากการวิเคราะห์" className="max-w-full max-h-60 object-contain" style={{ imageRendering: 'pixelated' }} />
                                            {result.originalSize > 0 && (
                                                 <p className="text-xs font-press-start text-brand-cyan">
                                                    ขนาดเดิม: {(result.originalSize / 1024).toFixed(1)} KB &rarr; ขนาดใหม่: {(result.newSize / 1024).toFixed(1)} KB
                                                 </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </PageWrapper>
    );
};