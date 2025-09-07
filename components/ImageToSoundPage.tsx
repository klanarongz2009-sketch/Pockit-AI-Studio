
import React, { useState, useRef, useCallback } from 'react';
import * as geminiService from '../services/geminiService';
import * as audioService from '../services/audioService';
import { PageHeader, PageWrapper } from './PageComponents';
import { UploadIcon } from './icons/UploadIcon';
import { LoadingSpinner } from './LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { PlayIcon } from './icons/PlayIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { useCredits, CREDIT_COSTS } from '../contexts/CreditContext';

interface ImageToSoundPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

export const ImageToSoundPage: React.FC<ImageToSoundPageProps> = ({ onClose, playSound, isOnline }) => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedSound, setGeneratedSound] = useState<geminiService.SoundEffectParameters | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { credits, spendCredits } = useCredits();

    const resetState = (clearFile: boolean = false) => {
        setIsLoading(false);
        setError(null);
        setGeneratedSound(null);
        setIsDownloading(false);
        if (clearFile) {
            setUploadedFile(null);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) {
            setError("กรุณาเลือกไฟล์รูปภาพ");
            return;
        }
        resetState(true);
        setUploadedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        playSound(audioService.playSelection);
    };

    const handleUploadClick = useCallback(() => {
        playSound(audioService.playClick);
        fileInputRef.current?.click();
    }, [playSound]);

    const handleGenerate = useCallback(async () => {
        if (!uploadedFile || isLoading || !isOnline) return;

        if (!spendCredits(CREDIT_COSTS.IMAGE_TO_SOUND)) {
            setError(`เครดิตไม่เพียงพอ! ต้องการ ${CREDIT_COSTS.IMAGE_TO_SOUND} เครดิต แต่คุณมี ${credits.toFixed(0)} เครดิต`);
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
            const soundParams = await geminiService.generateSoundFromImage(base64Data, uploadedFile.type);
            setGeneratedSound(soundParams);
            playSound(audioService.playSuccess);
            audioService.playSoundFromParams(soundParams); // Auto-play
        } catch (err) {
            playSound(audioService.playError);
            const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [uploadedFile, isLoading, playSound, isOnline, spendCredits, credits]);
    
    const handlePlaySound = () => {
        if (generatedSound) {
            audioService.playSoundFromParams(generatedSound);
        }
    };

    const handleDownloadSound = useCallback(async () => {
        if (!generatedSound || isDownloading) return;

        playSound(audioService.playDownload);
        setIsDownloading(true);
        try {
            const wavBlob = await audioService.exportSoundEffectToWav(generatedSound);
            if (wavBlob) {
                const url = URL.createObjectURL(wavBlob);
                const a = document.createElement('a');
                a.href = url;
                const fileName = uploadedFile?.name.split('.').slice(0, -1).join('_') || 'sound_from_image';
                a.download = `${fileName}.wav`;
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                throw new Error("ไม่สามารถสร้างไฟล์ WAV ได้");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการดาวน์โหลด");
            playSound(audioService.playError);
        } finally {
            setIsDownloading(false);
        }
    }, [isDownloading, playSound, generatedSound, uploadedFile]);


    return (
        <PageWrapper>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" aria-hidden="true" />
            <PageHeader title="ภาพเป็นเสียง" onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                <p className="text-sm text-center text-brand-light/80">
                    อัปโหลดภาพ แล้วให้ AI ตีความอารมณ์และองค์ประกอบเพื่อสร้างสรรค์เสียงประกอบ 8-bit ที่ไม่เหมือนใคร!
                </p>

                <div className="w-full h-auto aspect-square bg-black/50 border-4 border-brand-light flex items-center justify-center shadow-pixel p-2">
                    {!uploadedFile ? (
                         <button onClick={handleUploadClick} className="flex flex-col items-center justify-center gap-3 p-4 text-white transition-opacity hover:opacity-80">
                            <UploadIcon className="w-12 h-12" />
                            <span className="font-press-start">อัปโหลดรูปภาพ</span>
                        </button>
                    ) : (
                        <img src={previewUrl!} alt="Preview" className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                    )}
                </div>

                {uploadedFile && (
                    <div className="w-full space-y-4">
                        <button onClick={handleUploadClick} onMouseEnter={() => playSound(audioService.playHover)} className="text-sm underline hover:text-brand-yellow transition-colors">เปลี่ยนรูปภาพ</button>
                        
                        <button 
                            onClick={handleGenerate} 
                            disabled={isLoading || !isOnline}
                            className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            <SparklesIcon className="w-6 h-6" />
                            {isLoading ? 'กำลังสร้างเสียง...' : `สร้างเสียง (${CREDIT_COSTS.IMAGE_TO_SOUND} เครดิต)`}
                        </button>
                    </div>
                )}
                
                <div className="w-full min-h-[8rem] p-4 bg-black/50 border-4 border-brand-light flex flex-col items-center justify-center">
                    {isLoading && <LoadingSpinner text="AI กำลังตีความภาพ..." />}
                    {error && (
                        <div role="alert" className="w-full p-4 space-y-3 text-center">
                            <h3 className="font-press-start text-lg text-brand-magenta">เกิดข้อผิดพลาด</h3>
                            <p className="font-sans text-sm break-words text-brand-light/90">
                                เรากำลังตรวจสอบและแก้ไขปัญหานี้อยู่ ขออภัยในความไม่สะดวก
                            </p>
                            <p className="font-sans text-xs break-words text-brand-light/70 mt-2 p-2 bg-black/30 border border-brand-light/50 max-h-24 overflow-y-auto">
                                {error}
                            </p>
                        </div>
                    )}
                    {generatedSound && !isLoading && (
                        <div className="w-full space-y-4">
                            <h3 className="text-center font-press-start text-lg text-brand-cyan">สร้างเสียงสำเร็จ!</h3>
                             <p className="text-center text-sm">AI สร้างเสียง: <span className="text-brand-yellow">{generatedSound.name}</span></p>
                             <div className="flex gap-4">
                                 <button
                                    onClick={handlePlaySound}
                                    onMouseEnter={() => playSound(audioService.playHover)}
                                    className="w-full flex items-center justify-center gap-2 p-3 bg-brand-cyan text-black border-2 border-brand-light shadow-sm hover:bg-brand-yellow"
                                >
                                    <PlayIcon className="w-5 h-5"/>
                                    เล่นอีกครั้ง
                                </button>
                                 <button
                                    onClick={handleDownloadSound}
                                    disabled={isDownloading}
                                    onMouseEnter={() => playSound(audioService.playHover)}
                                    className="w-full flex items-center justify-center gap-2 p-3 bg-brand-yellow text-black border-2 border-brand-light shadow-sm hover:bg-brand-magenta hover:text-white disabled:bg-gray-500"
                                >
                                    <DownloadIcon className="w-5 h-5"/>
                                    {isDownloading ? 'กำลังสร้าง...' : 'ดาวน์โหลด'}
                                </button>
                             </div>
                        </div>
                    )}
                </div>
            </main>
        </PageWrapper>
    );
};