import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as geminiService from '../services/geminiService';
import * as audioService from '../services/audioService';
import * as preferenceService from '../services/preferenceService';
import { OutputDisplay } from './ImageDisplay';
import { SparklesIcon } from './icons/SparklesIcon';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { TrashIcon } from './icons/TrashIcon';
import { Minigame } from './Minigame';
import { PlusSquareIcon } from './icons/PlusSquareIcon';
import { useCredits } from '../contexts/CreditContext';
import { LinkIcon } from './icons/LinkIcon';
import { ShareIcon } from './icons/ShareIcon';
import * as galleryService from '../services/galleryService';
import { GalleryIcon } from './icons/GalleryIcon';

type GenerationMode = 'image' | 'gif' | 'video' | 'spritesheet';
type GameAssetState = { player: string | null; obstacle: string | null; };
type UploadedImageData = { base64: string; mimeType: string; };

const videoLoadingMessages = [
    "กำลังเรนเดอร์โลกพิกเซล...",
    "AI กำลังวาดทุกพิกเซล...",
    "เกือบเสร็จแล้ว! กำลังประกอบฉาก...",
    "การสร้างวิดีโออาจใช้เวลาสักครู่...",
    "ขอบคุณที่อดทนรอ!",
];

export const ImageGeneratorPage: React.FC<{
  playSound: (player: () => void) => void;
  isOnline: boolean;
}> = ({ playSound, isOnline }) => {
    const [prompt, setPrompt] = useState<string>('');
    const [basePrompt, setBasePrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [generatedFrames, setGeneratedFrames] = useState<string[] | null>(null);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [uploadedImageData, setUploadedImageData] = useState<UploadedImageData | null>(null);
    const [generationMode, setGenerationMode] = useState<GenerationMode>(() => preferenceService.getPreference('imageGeneratorMode', 'image'));
    const [fps, setFps] = useState(() => preferenceService.getPreference('imageGeneratorFps', 12));
    const [frameCount, setFrameCount] = useState(() => preferenceService.getPreference('imageGeneratorFrameCount', 8));
    const [loadingText, setLoadingText] = useState('กำลังสร้าง...');
    const [currentFrame, setCurrentFrame] = useState(0);
    const [isSaved, setIsSaved] = useState(false);

    const [isGameMode, setIsGameMode] = useState(false);
    const [gameAssets, setGameAssets] = useState<GameAssetState>({ player: null, obstacle: null });
    const [suggestions, setSuggestions] = useState<geminiService.PromptSuggestion[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const frameIntervalRef = useRef<number | null>(null);
    const { credits, spendCredits } = useCredits();

    // Save preferences when they change
    useEffect(() => {
        preferenceService.setPreference('imageGeneratorMode', generationMode);
    }, [generationMode]);
    useEffect(() => {
        preferenceService.setPreference('imageGeneratorFps', fps);
    }, [fps]);
    useEffect(() => {
        preferenceService.setPreference('imageGeneratorFrameCount', frameCount);
    }, [frameCount]);

    const stopFrameAnimation = () => {
        if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
        }
    };

    useEffect(() => {
        stopFrameAnimation();
        if (generationMode === 'gif' && generatedFrames && generatedFrames.length > 0) {
            frameIntervalRef.current = window.setInterval(() => {
                setCurrentFrame(prev => (prev + 1) % generatedFrames.length);
            }, 1000 / fps);
        }
        return stopFrameAnimation;
    }, [generationMode, generatedFrames, fps]);

    const handleClear = useCallback(() => {
        playSound(audioService.playSwoosh);
        setPrompt('');
        setBasePrompt('');
        setError(null);
        setGeneratedImage(null);
        setGeneratedFrames(null);
        setGeneratedVideoUrl(null);
        setGeneratedCode(null);
        setUploadedImageData(null);
        setIsGameMode(false);
        setGameAssets({ player: null, obstacle: null });
        setSuggestions([]);
        setIsSaved(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [playSound]);

    const handleUploadClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !isOnline) return;

        handleClear();
        playSound(audioService.playGenerate);
        setIsLoading(true);
        setLoadingText('กำลังวิเคราะห์ภาพ...');

        try {
            const toBase64 = (file: File): Promise<UploadedImageData> =>
                new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve({ base64: (reader.result as string).split(',')[1], mimeType: file.type });
                    reader.onerror = error => reject(error);
                });
            
            const imageData = await toBase64(file);
            setUploadedImageData(imageData);
            const imageUrl = `data:${imageData.mimeType};base64,${imageData.base64}`;
            setGeneratedImage(imageUrl); // Show the uploaded image
            const newPrompt = await geminiService.generatePromptFromImage(imageData.base64, imageData.mimeType);
            setPrompt(newPrompt);
            playSound(audioService.playSuccess);
        } catch (err) {
            playSound(audioService.playError);
            setError(geminiService.parseApiError(err));
        } finally {
            setIsLoading(false);
        }
    }, [handleClear, playSound, isOnline]);
    
    const handleUrlClick = useCallback(async () => {
        if (isLoading || !isOnline) return;
        playSound(audioService.playClick);
        const url = window.prompt("Please enter the image URL:");

        if (!url) {
            return; // User cancelled
        }
        
        // Basic validation for common image extensions
        if (!/\.(jpeg|jpg|gif|png|webp)$/i.test(url)) {
            setError("Invalid URL. Please provide a direct link to a JPG, PNG, GIF, or WEBP image.");
            playSound(audioService.playError);
            return;
        }

        handleClear();
        setIsLoading(true);
        setLoadingText('Fetching image from URL...');

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch image. Status: ${response.status}`);
            }
            
            const blob = await response.blob();
            
            if (!blob.type.startsWith('image/')) {
                throw new Error(`URL did not point to an image file. Mime type: ${blob.type}.`);
            }

            const toBase64 = (blob: Blob): Promise<UploadedImageData> =>
                new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onload = () => resolve({ base64: (reader.result as string).split(',')[1], mimeType: blob.type });
                    reader.onerror = error => reject(error);
                });

            const imageData = await toBase64(blob);
            setUploadedImageData(imageData);
            const imageUrl = `data:${imageData.mimeType};base64,${imageData.base64}`;
            setGeneratedImage(imageUrl);
            
            setLoadingText('Analyzing image...');
            const newPrompt = await geminiService.generatePromptFromImage(imageData.base64, imageData.mimeType);
            setPrompt(newPrompt);
            playSound(audioService.playSuccess);

        } catch (err) {
            playSound(audioService.playError);
            let message = geminiService.parseApiError(err);
             if (message.toLowerCase().includes('failed to fetch')) {
                message = "Failed to fetch image. This may be due to a network issue or security restrictions (CORS) on the source website. Try a different image host.";
            }
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, isOnline, playSound, handleClear]);

    const pollVideoOperation = useCallback(async (operation: any, retries = 20) => {
        if (retries <= 0) {
            throw new Error('การสร้างวิดีโอใช้เวลานานเกินไป โปรดลองอีกครั้ง');
        }

        const updatedOperation = await geminiService.getVideosOperation(operation);
        if (updatedOperation.done) {
            if (updatedOperation.error) {
                // Propagate the actual error message from the operation
                throw new Error(updatedOperation.error.message);
            }
            const downloadLink = updatedOperation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
                setGeneratedVideoUrl(downloadLink);
                // Success: This is the only place we stop loading for video.
                setIsLoading(false);
                playSound(audioService.playSuccess);
            } else {
                // This case can happen for safety blocks or other silent failures.
                throw new Error("ไม่พบวิดีโอในผลลัพธ์ อาจเป็นเพราะคำสั่งถูกบล็อกเนื่องจากนโยบายความปลอดภัย");
            }
        } else {
            // Not done yet, poll again recursively.
            await new Promise(resolve => setTimeout(resolve, 10000));
            await pollVideoOperation(updatedOperation, retries - 1);
        }
    }, [playSound]);
    
    const combineFramesToSpritesheet = useCallback(async (frames: string[]): Promise<string> => {
        if (frames.length === 0) return '';
        const images = await Promise.all(frames.map(src => {
            return new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });
        }));
        
        const canvas = document.createElement('canvas');
        const { width, height } = images[0];
        canvas.width = width * images.length;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';
        
        images.forEach((img, i) => {
            ctx.drawImage(img, i * width, 0, width, height);
        });
        
        return canvas.toDataURL('image/png');
    }, []);

    const handleGenerate = useCallback(async () => {
        const currentPrompt = prompt.trim();
        if (!currentPrompt || isLoading || !isOnline) return;
        
        // Check for special "Code" command
        if (currentPrompt.toLowerCase() === 'code') {
            if (!uploadedImageData) {
                setError('กรุณาอัปโหลดรูปภาพก่อนใช้คำสั่ง "Code"');
                playSound(audioService.playError);
                return;
            }

            if (!spendCredits(50)) { // Cost for code generation
                 setError(`เครดิตไม่เพียงพอ! ต้องการ 50 เครดิต แต่คุณมี ${Math.floor(credits)} เครดิต`);
                 playSound(audioService.playError);
                 return;
            }

            setIsLoading(true);
            setLoadingText('AI กำลังเขียนโค้ด...');
            setError(null);
            setGeneratedCode(null);
            playSound(audioService.playGenerate);

            try {
                const code = await geminiService.generateCodeFromImage(uploadedImageData.base64, uploadedImageData.mimeType);
                setGeneratedCode(code);
                playSound(audioService.playSuccess);
            } catch (err) {
                 playSound(audioService.playError);
                 setError(geminiService.parseApiError(err));
            } finally {
                setIsLoading(false);
            }
            return;
        }

        const gameTrigger = "มาเล่นกัน";
        const isGameRequest = currentPrompt.endsWith(gameTrigger);
        let cost = 0;

        if (isGameRequest) {
            cost = 2 * 10; // 2 assets (player, obstacle) * 10 credits
        } else {
            switch (generationMode) {
                case 'image':
                    cost = 10;
                    break;
                case 'gif':
                    cost = frameCount * 2; // 2 credits per frame
                    break;
                case 'video':
                    cost = currentPrompt.length;
                    break;
                case 'spritesheet':
                    cost = 300;
                    break;
            }
        }
        
        if (!spendCredits(cost)) {
            setError(`เครดิตไม่เพียงพอ! ต้องการ ${cost} เครดิต แต่คุณมี ${Math.floor(credits)} เครดิต`);
            playSound(audioService.playError);
            return;
        }

        handleClear();
        setPrompt(currentPrompt); // Keep the prompt in the input
        playSound(audioService.playGenerate);
        setIsLoading(true);

        if (isGameRequest) {
            const baseGamePrompt = currentPrompt.replace(gameTrigger, '').trim();
            setBasePrompt(baseGamePrompt);
            setIsGameMode(true);
            setLoadingText('กำลังสร้างมินิเกม...');
            try {
                const [player, obstacle] = await Promise.all([
                    geminiService.generatePixelArt(`a hero character for a game, based on: ${baseGamePrompt}`),
                    geminiService.generatePixelArt(`an obstacle or enemy for a game, based on: ${baseGamePrompt}`)
                ]);
                setGameAssets({ player, obstacle });
                playSound(audioService.playSuccess);
            } catch (err) {
                playSound(audioService.playError);
                setError(geminiService.parseApiError(err));
                setIsGameMode(false);
            } finally {
                setIsLoading(false);
            }
            return;
        }

        try {
            switch (generationMode) {
                case 'image':
                    setLoadingText('กำลังสร้างภาพ...');
                    const imageUrl = await geminiService.generatePixelArt(currentPrompt);
                    setGeneratedImage(imageUrl);
                    playSound(audioService.playCameraShutter);
                    break;
                case 'gif':
                case 'spritesheet':
                    setLoadingText(generationMode === 'gif' ? `กำลังสร้าง GIF (${cost} เครดิต)...` : `กำลังสร้างสไปรต์ชีต (${cost} เครดิต)...`);
                    const frames = await geminiService.generateGifFrames(currentPrompt, frameCount);
                    setGeneratedFrames(frames);
                    if (generationMode === 'spritesheet') {
                        const sheet = await combineFramesToSpritesheet(frames);
                        setGeneratedImage(sheet);
                    }
                    playSound(audioService.playSuccess);
                    break;
                case 'video':
                    setLoadingText('กำลังสร้างวิดีโอ...');
                    const operation = await geminiService.generateVideo(currentPrompt);
                    await pollVideoOperation(operation);
                    break;
            }
            // For non-video ops, stop loading on success. Video is handled in poller.
            if (generationMode !== 'video') {
                setIsLoading(false);
            }
        } catch (err) {
            playSound(audioService.playError);
            setError(geminiService.parseApiError(err));
            setIsLoading(false); // Stop loading on ANY error
        }
    }, [prompt, isLoading, isOnline, playSound, generationMode, frameCount, handleClear, pollVideoOperation, combineFramesToSpritesheet, spendCredits, credits, uploadedImageData]);

    const hasContent = generatedImage || (generatedFrames && generatedFrames.length > 0) || generatedVideoUrl || generatedCode;

    const handleDownload = useCallback(async () => {
        playSound(audioService.playDownload);
        let url: string | null = null;
        let filename = 'pixel-art';

        if (generatedCode) {
            const blob = new Blob([generatedCode], { type: 'text/html' });
            url = URL.createObjectURL(blob);
            filename = `${prompt.slice(0, 20).replace(/\s/g, '_') || 'ai-app'}.html`;
        } else if (generatedVideoUrl) {
            url = `${generatedVideoUrl}&key=${process.env.API_KEY}`;
            filename = `${prompt.slice(0, 20)}.mp4`;
             // For videos, we fetch the blob because the URL might be temporary
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                url = URL.createObjectURL(blob);
            } catch(e) {
                console.error("Failed to fetch video blob, falling back to direct link", e);
                // Fallback to direct link, might not work in all browsers
            }
        } else if (generationMode === 'spritesheet' && generatedImage) {
            url = generatedImage;
            filename = `${prompt.slice(0, 20)}-spritesheet.png`;
        } else if (generationMode === 'gif' && generatedFrames && generatedFrames.length > 0) {
            // For GIFs, we can't download them directly. Let's download the spritesheet instead.
            url = await combineFramesToSpritesheet(generatedFrames);
            filename = `${prompt.slice(0, 20)}-spritesheet.png`;
        } else if (generatedImage) {
            url = generatedImage;
            filename = `${prompt.slice(0, 20)}.png`;
        }

        if (url) {
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            if (url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
            }
        }
    }, [playSound, generatedImage, generatedFrames, generatedVideoUrl, generatedCode, generationMode, prompt, combineFramesToSpritesheet]);
    
    const handleShare = useCallback(async () => {
        if (!hasContent) return;
        playSound(audioService.playClick);

        const text = `ดูผลงานศิลปะที่ฉันสร้างด้วยจักรวาล AI สร้างสรรค์! คำสั่ง: "${prompt}"`;
        
        if (generationMode === 'video' && generatedVideoUrl) {
             if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'วิดีโอจาก AI',
                        text: `ดูวิดีโอที่ฉันสร้างด้วย AI! คำสั่ง: "${prompt}"`,
                        url: window.location.href
                    });
                } catch(err) {
                    if (err instanceof Error && err.name !== 'AbortError') {
                         console.error('Share failed:', err);
                         alert('ไม่สามารถแชร์ได้');
                    }
                }
            } else {
                 alert('เบราว์เซอร์นี้ไม่รองรับการแชร์ กรุณาดาวน์โหลดแล้วแชร์ด้วยตนเอง');
            }
            return;
        }

        let dataUrl: string | null = null;
        let fileName = 'ai-art.png';

        if (generationMode === 'spritesheet' && generatedImage) {
            dataUrl = generatedImage;
            fileName = 'ai-spritesheet.png';
        } else if (generationMode === 'gif' && generatedFrames && generatedFrames.length > 0) {
            dataUrl = await combineFramesToSpritesheet(generatedFrames);
            fileName = 'ai-animation-sheet.png';
        } else if (generatedImage) {
            dataUrl = generatedImage;
        }

        if (!dataUrl) return;

        try {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File([blob], fileName, { type: blob.type });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'ผลงานจาก AI',
                    text: text,
                });
            } else {
                alert('เบราว์เซอร์นี้ไม่รองรับการแชร์ไฟล์ กรุณาดาวน์โหลดแล้วแชร์ด้วยตนเอง');
            }
        } catch (err) {
            if (err instanceof Error && err.name !== 'AbortError') {
                 console.error('Share failed:', err);
                 alert('ไม่สามารถแชร์ได้');
            }
        }
    }, [hasContent, playSound, generatedImage, generatedFrames, generatedVideoUrl, generationMode, prompt, combineFramesToSpritesheet]);

    const handleGetSuggestions = useCallback(async () => {
        if (!prompt.trim() || !isOnline) return;
        playSound(audioService.playClick);
        try {
            const results = await geminiService.generatePromptSuggestions(prompt);
            setSuggestions(results);
        } catch (err) {
            setError(geminiService.parseApiError(err));
        }
    }, [prompt, isOnline, playSound]);

    const handleSaveToGallery = useCallback(() => {
        if (!generatedImage || !prompt || isSaved) return;
        try {
            galleryService.addArtwork(generatedImage, prompt);
            playSound(audioService.playSuccess);
            setIsSaved(true);
        } catch(e) {
            playSound(audioService.playError);
            setError(e instanceof Error ? e.message : 'ไม่สามารถบันทึกลงแกลเลอรีได้');
        }
    }, [generatedImage, prompt, isSaved, playSound]);

    if (isGameMode && gameAssets.player && gameAssets.obstacle) {
        return <Minigame playerImageUrl={gameAssets.player} obstacleImageUrl={gameAssets.obstacle} onClose={() => setIsGameMode(false)} playSound={playSound} />;
    }

    const canSave = (generationMode === 'image' || generationMode === 'spritesheet') && generatedImage;

    return (
        <div className="w-full h-full flex flex-col items-center px-4">
             <h1 className="text-3xl sm:text-4xl text-brand-yellow text-center drop-shadow-[3px_3px_0_#000] mb-6">เครื่องมือสร้างภาพ AI</h1>
             <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Left Column: Controls */}
                <div className="w-full flex flex-col gap-4">
                    <div className="w-full flex flex-col gap-4 bg-black/40 p-4 border-4 border-brand-light shadow-pixel font-sans">
                        {/* Prompt */}
                        <div className="flex flex-col gap-2">
                            <label htmlFor="prompt-input" className="text-xs font-press-start text-brand-cyan">คำสั่ง (Prompt)</label>
                            <textarea
                                id="prompt-input"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="เช่น อัศวินขี่ไดโนเสาร์ในอวกาศ หรืออัปโหลดภาพแล้วพิมพ์ 'Code' เพื่อให้ AI เขียนโค้ด"
                                className="w-full h-24 p-2 bg-brand-light text-black rounded-none border-2 border-black focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-y"
                                disabled={isLoading || !isOnline}
                            />
                        </div>
                        {/* Suggestions */}
                        {suggestions.length > 0 && (
                             <div className="space-y-2">
                                <h3 className="text-xs font-press-start text-brand-cyan">ไอเดีย:</h3>
                                <div className="flex flex-wrap gap-2">
                                    {suggestions.map((s, i) => (
                                        <button key={i} onClick={() => { playSound(audioService.playSelection); setPrompt(s.prompt); setSuggestions([]); }}
                                            className="px-2 py-1 bg-brand-cyan/20 text-brand-light text-xs font-press-start border border-brand-cyan hover:bg-brand-cyan hover:text-black transition-colors">
                                            {s.title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Generation Mode */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                           {['image', 'gif', 'video', 'spritesheet'].map(mode => (
                               <label key={mode} className="flex items-center gap-2 cursor-pointer">
                                   <input type="radio" name="generationMode" value={mode} checked={generationMode === mode}
                                       onChange={() => { playSound(audioService.playToggle); setGenerationMode(mode as GenerationMode); }}
                                       disabled={isLoading || !isOnline} className="w-4 h-4 accent-brand-magenta" />
                                   <span>{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
                               </label>
                           ))}
                        </div>
                        {/* GIF/Spritesheet Settings */}
                        {(generationMode === 'gif' || generationMode === 'spritesheet') && (
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                 <div className="flex flex-col gap-2">
                                    <label htmlFor="fps-slider" className="text-xs font-press-start text-brand-cyan/80">FPS: {fps}</label>
                                    <input id="fps-slider" type="range" min="1" max="24" value={fps} onChange={(e) => { playSound(audioService.playSliderChange); setFps(Number(e.target.value)); }} disabled={isLoading || !isOnline} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="frames-slider" className="text-xs font-press-start text-brand-cyan/80">Frames: {frameCount}</label>
                                    <input id="frames-slider" type="range" min="4" max="16" step="2" value={frameCount} onChange={(e) => { playSound(audioService.playSliderChange); setFrameCount(Number(e.target.value)); }} disabled={isLoading || !isOnline} />
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Main Action Buttons */}
                    <div className="flex gap-2">
                         <button onClick={handleGenerate} disabled={!prompt.trim() || isLoading || !isOnline} onMouseEnter={() => playSound(audioService.playHover)} className="flex-grow flex items-center justify-center gap-2 p-3 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed">
                            <SparklesIcon className="w-5 h-5" />
                            <span className="font-press-start">{isLoading ? loadingText : 'สร้าง'}</span>
                         </button>
                          <button onClick={handleGetSuggestions} disabled={!prompt.trim() || isLoading || !isOnline} onMouseEnter={() => playSound(audioService.playHover)} title="รับไอเดีย (Alt+S)" aria-label="รับไอเดีย" className="w-14 h-14 flex-shrink-0 flex items-center justify-center bg-brand-cyan text-black border-4 border-brand-light shadow-pixel transition-all hover:bg-brand-yellow active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed">
                            <PlusSquareIcon className="w-6 h-6" />
                         </button>
                     </div>
                    {/* Secondary Action Buttons */}
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
                        <button onClick={handleUploadClick} disabled={isLoading || !isOnline} onMouseEnter={() => playSound(audioService.playHover)} className="lg:col-span-2 flex items-center justify-center gap-2 p-2 bg-black/50 border-2 border-brand-light shadow-sm transition-all hover:bg-brand-cyan/20 disabled:opacity-50 subtle-interactive">
                            <UploadIcon className="w-5 h-5 text-brand-cyan" /> <span className="text-xs font-press-start">จากภาพ</span>
                        </button>
                        <button onClick={handleUrlClick} disabled={isLoading || !isOnline} onMouseEnter={() => playSound(audioService.playHover)} className="lg:col-span-2 flex items-center justify-center gap-2 p-2 bg-black/50 border-2 border-brand-light shadow-sm transition-all hover:bg-brand-cyan/20 disabled:opacity-50 subtle-interactive">
                            <LinkIcon className="w-5 h-5 text-brand-cyan" /> <span className="text-xs font-press-start">จาก URL</span>
                        </button>
                        <button onClick={handleDownload} disabled={isLoading || !hasContent} onMouseEnter={() => playSound(audioService.playHover)} className="flex items-center justify-center gap-2 p-2 bg-black/50 border-2 border-brand-light shadow-sm transition-all hover:bg-brand-cyan/20 disabled:opacity-50 subtle-interactive">
                            <DownloadIcon className="w-5 h-5 text-brand-cyan" />
                        </button>
                         <button onClick={handleShare} disabled={isLoading || !hasContent} onMouseEnter={() => playSound(audioService.playHover)} className="flex items-center justify-center gap-2 p-2 bg-black/50 border-2 border-brand-light shadow-sm transition-all hover:bg-brand-cyan/20 disabled:opacity-50 subtle-interactive">
                            <ShareIcon className="w-5 h-5 text-brand-cyan" />
                        </button>
                        <button onClick={handleSaveToGallery} disabled={isLoading || !canSave || isSaved} onMouseEnter={() => playSound(audioService.playHover)} className="flex items-center justify-center gap-2 p-2 bg-black/50 border-2 border-brand-light shadow-sm transition-all hover:bg-brand-cyan/20 disabled:opacity-50 subtle-interactive">
                            <GalleryIcon className="w-5 h-5 text-brand-cyan" />
                        </button>
                         <button onClick={handleClear} disabled={isLoading} onMouseEnter={() => playSound(audioService.playHover)} className="flex items-center justify-center gap-2 p-2 bg-black/50 border-2 border-brand-light shadow-sm transition-all hover:bg-brand-cyan/20 disabled:opacity-50 subtle-interactive">
                            <TrashIcon className="w-5 h-5 text-brand-cyan" />
                        </button>
                    </div>
                </div>

                {/* Right Column: Output */}
                <div className="w-full">
                     <OutputDisplay 
                        isLoading={isLoading}
                        error={error}
                        generatedImage={generatedImage}
                        generatedFrames={generatedFrames}
                        generatedVideoUrl={generatedVideoUrl}
                        generatedCode={generatedCode}
                        prompt={prompt}
                        generationMode={generationMode}
                        fps={fps}
                        loadingText={loadingText}
                        videoLoadingMessages={videoLoadingMessages}
                        currentFrame={currentFrame}
                    />
                </div>
             </div>
             <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" aria-hidden="true" />
        </div>
    );
};
