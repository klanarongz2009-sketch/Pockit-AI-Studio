import React, { useState, useRef, useCallback } from 'react';
import * as geminiService from '../services/geminiService';
import * as audioService from '../services/audioService';
import { PageHeader, PageWrapper } from './PageComponents';
import { UploadIcon } from './icons/UploadIcon';
import { LoadingSpinner } from './LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { MusicNoteIcon } from './icons/MusicNoteIcon';
import { useCredits, CREDIT_COSTS } from '../contexts/CreditContext';

interface SongSearchPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

export const SongSearchPage: React.FC<SongSearchPageProps> = ({ onClose, playSound, isOnline }) => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<geminiService.SearchResult | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const { credits, spendCredits } = useCredits();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = (clearFile: boolean = false) => {
        setIsLoading(false);
        setError(null);
        setResult(null);
        if (clearFile) {
            setUploadedFile(null);
            if (filePreview) URL.revokeObjectURL(filePreview);
            setFilePreview(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };
    
    const processFile = (file: File | undefined) => {
        if (!file) return;

        if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
            setError(`ไฟล์ประเภท '${file.name}' ไม่รองรับ`);
            playSound(audioService.playError);
            return;
        }

        resetState(true);
        setUploadedFile(file);
        
        if (file.type.startsWith('video/')) {
            const url = URL.createObjectURL(file);
            setFilePreview(url);
        } else {
            setFilePreview(null);
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

    const handleDragEnter = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };


    const handleSearch = useCallback(async () => {
        if (!uploadedFile || isLoading || !isOnline) return;

        if (!spendCredits(CREDIT_COSTS.SONG_SEARCH)) {
            setError(`เครดิตไม่เพียงพอ! ต้องการ ${CREDIT_COSTS.SONG_SEARCH} เครดิต แต่คุณมี ${Math.floor(credits)} เครดิต`);
            playSound(audioService.playError);
            return;
        }

        resetState();
        playSound(audioService.playGenerate);
        setIsLoading(true);

        try {
            const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = error => reject(error);
            });

            const base64Data = await toBase64(uploadedFile);
            const searchResult = await geminiService.identifyAndSearchMusic(base64Data, uploadedFile.type);
            setResult(searchResult);
            playSound(audioService.playSuccess);
        } catch (err) {
            playSound(audioService.playError);
            const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [uploadedFile, isLoading, playSound, isOnline, spendCredits, credits]);
    
    return (
        <PageWrapper>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*,audio/*" className="hidden" aria-hidden="true" />
            <PageHeader title="ค้นหาเพลงและเสียงด้วย AI" onBack={onClose} />
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
                           อัปโหลดไฟล์เสียงหรือวิดีโอ (หรือลากมาวาง) แล้วให้ AI ช่วยค้นหาว่านี่คือเพลงอะไร, ใครเป็นคนร้อง, หรือเสียงนี้คล้ายกับศิลปินคนไหน!
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
                        
                        <button 
                            onClick={handleSearch} 
                            onMouseEnter={() => playSound(audioService.playHover)}
                            disabled={isLoading || !isOnline}
                            className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed"
                            title={!isOnline ? 'ฟีเจอร์นี้ต้องใช้การเชื่อมต่ออินเทอร์เน็ต' : ''}
                        >
                            <SparklesIcon className="w-6 h-6" /> {isLoading ? 'กำลังค้นหา...' : `ค้นหา (${CREDIT_COSTS.SONG_SEARCH} เครดิต)`}
                        </button>
                    </div>
                )}
                
                <div className="w-full min-h-[12rem] p-4 bg-black/50 border-4 border-brand-light flex flex-col items-center justify-center">
                    {isLoading && <LoadingSpinner text="AI กำลังฟังและค้นหา..." />}
                    {error && (
                        <div role="alert" className="text-center text-brand-magenta">
                            <p className="font-press-start">การค้นหาล้มเหลว</p>
                            <p className="text-sm mt-2">{error}</p>
                        </div>
                    )}
                    {result && !isLoading && (
                        <div className="w-full text-left space-y-6">
                            {result.identificationType === 'direct' && (
                                <div className="space-y-2">
                                    <h3 className="font-press-start text-lg text-brand-cyan mb-2">ข้อมูลที่พบ:</h3>
                                    {[
                                        { label: 'เพลง', value: result.title },
                                        { label: 'ศิลปิน', value: result.artist },
                                        { label: 'อัลบั้ม', value: result.album },
                                        { label: 'ปี', value: result.year },
                                        { label: 'แนวเพลง', value: result.genre },
                                    ].filter(d => d.value).map(detail => (
                                        <div key={detail.label} className="flex text-sm border-b border-brand-light/10 pb-1">
                                            <span className="font-press-start text-brand-cyan/80 w-1/3 truncate">{detail.label}:</span>
                                            <span className="text-brand-light w-2/3">{detail.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div>
                                <h3 className="font-press-start text-lg text-brand-cyan mb-2">ภาพรวมจาก AI:</h3>
                                <p className="text-sm whitespace-pre-wrap text-brand-light">{result.overview || 'AI ไม่ได้ให้ข้อมูลภาพรวม'}</p>
                            </div>

                             {result.searchSuggestions.length > 0 && (
                                <div>
                                    <h3 className="font-press-start text-lg text-brand-cyan mb-2">คำแนะนำการค้นหา:</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {result.searchSuggestions.map((suggestion, index) => (
                                            <a 
                                                key={index}
                                                href={`https://www.google.com/search?q=${encodeURIComponent(suggestion)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onMouseEnter={() => playSound(audioService.playHover)}
                                                className="px-3 py-1 bg-brand-cyan/20 text-brand-light text-xs font-press-start border border-brand-cyan hover:bg-brand-cyan hover:text-black transition-colors"
                                            >
                                                {suggestion}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {result.sources.length > 0 && (
                                <div>
                                    <h3 className="font-press-start text-lg text-brand-cyan mb-2">แหล่งข้อมูลอ้างอิง:</h3>
                                    <ul className="space-y-2 list-inside">
                                        {result.sources.map((source, index) => (
                                            <li key={source.uri} className="text-sm">
                                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-brand-yellow underline hover:text-brand-lime transition-colors break-all">
                                                    {index + 1}. {source.title}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </PageWrapper>
    );
};