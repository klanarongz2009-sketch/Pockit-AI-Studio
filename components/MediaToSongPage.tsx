import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Song } from '../services/geminiService';
import { generateSongFromMedia } from '../services/geminiService';
import * as audioService from '../services/audioService';
import { PageHeader, PageWrapper } from './PageComponents';
import { UploadIcon } from './icons/UploadIcon';
import { LoadingSpinner } from './LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { PlayIcon } from './icons/PlayIcon';
import { StopIcon } from './icons/StopIcon';
import { MusicNoteIcon } from './icons/MusicNoteIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { AudioVisualizer } from './icons/AudioVisualizer';

interface MediaToSongPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isPlayingSong: boolean;
    setIsPlayingSong: React.Dispatch<React.SetStateAction<boolean>>;
    isOnline: boolean;
}

export const MediaToSongPage: React.FC<MediaToSongPageProps> = ({
    onClose,
    playSound,
    isPlayingSong,
    setIsPlayingSong,
    isOnline,
}) => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [generatedSong, setGeneratedSong] = useState<Song | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setUploadedFile(null);
        setFilePreview(null);
        setGeneratedSong(null);
        setError(null);
        setIsLoading(false);
        setIsDownloading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    
    const processFile = (file: File | undefined) => {
        if (!file) return;

        resetState();
        setUploadedFile(file);
        
        if (file.type.startsWith('video/')) {
            const url = URL.createObjectURL(file);
            setFilePreview(url);
        } else {
            setFilePreview(null); // No preview for audio, just show icon
        }
        playSound(audioService.playSelection);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        processFile(event.target.files?.[0]);
    };

    const handleUploadClick = () => {
        playSound(audioService.playClick);
        fileInputRef.current?.click();
    };

    const handleGenerateSong = useCallback(async () => {
        if (!uploadedFile || isLoading || !isOnline) return;

        playSound(audioService.playGenerate);
        setIsLoading(true);
        setError(null);
        setGeneratedSong(null);

        try {
            const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = error => reject(error);
            });

            const base64Data = await toBase64(uploadedFile);
            const song = await generateSongFromMedia(base64Data, uploadedFile.type);
            
            setGeneratedSong(song);
            playSound(audioService.playSuccess);

        } catch (err) {
            playSound(audioService.playError);
            const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [uploadedFile, isLoading, playSound, isOnline]);

    const handlePlaybackToggle = useCallback(() => {
        if (isPlayingSong) {
            audioService.stopSong();
            setIsPlayingSong(false);
        } else if (generatedSong) {
            playSound(audioService.playClick);
            setIsPlayingSong(true);
            audioService.playSong(generatedSong, 140, () => {
                setIsPlayingSong(false);
            });
        }
    }, [isPlayingSong, generatedSong, playSound, setIsPlayingSong]);

    const handleDownloadSong = useCallback(async () => {
        if (!generatedSong || isDownloading) return;
    
        playSound(audioService.playDownload);
        setIsDownloading(true);
        setError(null);
    
        try {
            const wavBlob = await audioService.exportSongToWav(generatedSong, 140);
            if (wavBlob) {
                const url = URL.createObjectURL(wavBlob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                const fileName = uploadedFile?.name.split('.').slice(0, -1).join('.') || 'generated-song';
                a.download = `${fileName}-8bit.wav`;
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                throw new Error("ไม่สามารถสร้างไฟล์ WAV ได้");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่คาดคิดระหว่างการดาวน์โหลด");
            playSound(audioService.playError);
        } finally {
            setIsDownloading(false);
        }
    }, [generatedSong, isDownloading, playSound, uploadedFile?.name]);
    
    const handleClose = () => {
        audioService.stopSong();
        setIsPlayingSong(false);
        onClose();
    }
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isLoading || isDownloading) return;

            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const isCtrlCmd = isMac ? event.metaKey : event.ctrlKey;

            if (isCtrlCmd && event.key === 'Enter') {
                event.preventDefault();
                if(uploadedFile && !generatedSong) handleGenerateSong();
            } else if (event.altKey) {
                switch(event.key.toLowerCase()){
                    case 'p':
                        if (generatedSong) {
                            event.preventDefault();
                            handlePlaybackToggle();
                        }
                        break;
                    case 'd':
                        if (generatedSong) {
                            event.preventDefault();
                            handleDownloadSong();
                        }
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLoading, isDownloading, uploadedFile, generatedSong, handleGenerateSong, handlePlaybackToggle, handleDownloadSong]);

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
            <PageHeader title="แปลงสื่อเป็นเพลง" onBack={handleClose} />
            <main 
                id="main-content" 
                className="w-full max-w-lg flex flex-col items-center gap-6 font-sans relative"
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {isDragging && (
                    <div className="absolute inset-0 bg-black/80 border-4 border-dashed border-brand-yellow z-10 flex flex-col items-center justify-center pointer-events-none">
                        <UploadIcon className="w-12 h-12 text-brand-yellow" />
                        <p className="font-press-start text-xl text-brand-yellow mt-4">วางไฟล์ที่นี่</p>
                    </div>
                )}
                {!uploadedFile && (
                    <div className="text-center space-y-4">
                        <p className="text-sm text-brand-light/80">
                            เปลี่ยนวิดีโอหรือเสียงโปรดของคุณให้เป็นเพลง 8-bit สุดเจ๋ง! แค่อัปโหลดไฟล์ แล้วปล่อยให้ AI ของเราสร้างสรรค์ซาวด์แทร็กย้อนยุคให้คุณโดยเฉพาะ!
                        </p>
                        <button 
                            onClick={handleUploadClick} 
                            onMouseEnter={() => playSound(audioService.playHover)}
                            className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px]">
                            <UploadIcon className="w-6 h-6" /> อัปโหลดไฟล์
                        </button>
                    </div>
                )}

                {uploadedFile && (
                    <div className="w-full space-y-4">
                        <div className="bg-black/40 border-2 border-brand-light/50 p-4 space-y-3">
                            <h3 className="font-press-start text-brand-cyan">ไฟล์ที่เลือก:</h3>
                             {filePreview ? (
                                <video src={filePreview} controls className="w-full max-h-60 border-2 border-brand-light object-contain bg-black" aria-label={`วิดีโอตัวอย่างของ ${uploadedFile.name}`} />
                            ) : (
                                <div className="flex items-center gap-3 p-3 bg-black/30">
                                    <MusicNoteIcon className="w-8 h-8 text-brand-cyan flex-shrink-0" />
                                    <p className="truncate text-sm">{uploadedFile.name}</p>
                                </div>
                            )}
                            <button onClick={handleUploadClick} onMouseEnter={() => playSound(audioService.playHover)} className="text-sm underline hover:text-brand-yellow transition-colors">เปลี่ยนไฟล์อื่น</button>
                        </div>

                        {!generatedSong && !isLoading && !error && (
                            <button 
                                onClick={handleGenerateSong} 
                                onMouseEnter={() => playSound(audioService.playHover)}
                                disabled={isLoading || !isOnline}
                                className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed"
                                title={!isOnline ? 'ฟีเจอร์นี้ต้องใช้การเชื่อมต่ออินเทอร์เน็ต' : 'ปุ่มลัด: Ctrl+Enter'}
                            >
                                <SparklesIcon className="w-6 h-6" /> สร้างเพลง
                            </button>
                        )}

                        {isLoading && <div className="py-8"><LoadingSpinner text="กำลังประพันธ์เพลง..." /></div>}
                        
                        {error && (
                             <div role="alert" className="w-full p-4 space-y-3 text-center bg-black/40 border-4 border-brand-magenta">
                                <h3 className="text-lg font-press-start text-brand-magenta">เกิดข้อผิดพลาด</h3>
                                <p className="font-sans text-sm break-words text-brand-light/90 max-w-md mx-auto">
                                    {error}
                                </p>
                                <button
                                    onClick={handleGenerateSong}
                                    onMouseEnter={() => playSound(audioService.playHover)}
                                    className="w-full max-w-xs mt-2 flex items-center justify-center gap-3 p-3 bg-brand-cyan text-black border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px]"
                                >
                                    ลองอีกครั้ง
                                </button>
                            </div>
                        )}

                        {generatedSong && (
                            <div className="w-full space-y-4">
                                <AudioVisualizer />
                                <div className="space-y-4 text-center w-full py-4 bg-black/40 border-2 border-brand-cyan">
                                    <h3 className="text-lg font-press-start text-brand-cyan">สร้างเพลงสำเร็จ!</h3>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
                                        <button 
                                            onClick={handlePlaybackToggle} 
                                            onMouseEnter={() => playSound(audioService.playHover)}
                                            aria-label={isPlayingSong ? "หยุดเพลง" : "เล่นเพลง"}
                                            title="ปุ่มลัด: Alt+P"
                                            className="w-full sm:w-48 flex items-center justify-center gap-3 p-3 bg-brand-cyan text-black border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px]">
                                            {isPlayingSong ? <StopIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                                            <span>{isPlayingSong ? 'หยุด' : 'เล่นเพลง'}</span>
                                        </button>
                                        <button 
                                            onClick={handleDownloadSong} 
                                            onMouseEnter={() => playSound(audioService.playHover)}
                                            disabled={isDownloading} 
                                            aria-label="ดาวน์โหลดเพลงเป็นไฟล์ WAV" 
                                            title="ปุ่มลัด: Alt+D"
                                            className="w-full sm:w-48 flex items-center justify-center gap-3 p-3 bg-brand-yellow text-black border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-magenta hover:text-white active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed">
                                            <DownloadIcon className="w-6 h-6" />
                                            <span>{isDownloading ? 'กำลังสร้าง...' : 'ดาวน์โหลด'}</span>
                                        </button>
                                    </div>
                                </div>
                             </div>
                        )}
                    </div>
                )}
            </main>
        </PageWrapper>
    );
};