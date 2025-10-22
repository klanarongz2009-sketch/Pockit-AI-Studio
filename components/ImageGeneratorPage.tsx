import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as geminiService from '../services/geminiService';
import * as huggingFaceService from '../services/huggingFaceService';
import * as audioService from '../services/audioService';
import * as preferenceService from '../services/preferenceService';
import { OutputDisplay } from './ImageDisplay';
import { SparklesIcon } from './icons/SparklesIcon';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { TrashIcon } from './icons/TrashIcon';
import { Minigame } from './Minigame';
import { PlusSquareIcon } from './icons/PlusSquareIcon';
import { LinkIcon } from './icons/LinkIcon';
import { ShareIcon } from './icons/ShareIcon';
import * as galleryService from '../services/galleryService';
import { GalleryIcon } from './icons/GalleryIcon';
import { useLanguage } from '../contexts/LanguageContext';
import { HuggingFaceIcon } from './icons/HuggingFaceIcon';

type GenerationMode = 'image' | 'gif' | 'video' | 'spritesheet';
type GenerationEngine = 'gemini' | 'huggingface';
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
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [generatedFrames, setGeneratedFrames] = useState<string[] | null>(null);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [uploadedImageData, setUploadedImageData] = useState<UploadedImageData | null>(null);
    const [loadingText, setLoadingText] = useState('กำลังสร้าง...');
    const [currentFrame, setCurrentFrame] = useState(0);
    const [isSaved, setIsSaved] = useState(false);

    // Preferences with async loading
    const [generationMode, setGenerationMode] = useState<GenerationMode>('image');
    const [engine, setEngine] = useState<GenerationEngine>('gemini');
    const [fps, setFps] = useState(12);
    const [frameCount, setFrameCount] = useState(8);

    const [isGameMode, setIsGameMode] = useState(false);
    const [gameAssets, setGameAssets] = useState<GameAssetState>({ player: null, obstacle: null });
    const [suggestions, setSuggestions] = useState<geminiService.PromptSuggestion[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const frameIntervalRef = useRef<number | null>(null);
    const { t } = useLanguage();

    useEffect(() => {
        const loadPrefs = async () => {
            const [mode, savedFps, savedFrameCount, savedEngine] = await Promise.all([
                preferenceService.getPreference('imageGeneratorMode', 'image'),
                preferenceService.getPreference('imageGeneratorFps', 12),
                preferenceService.getPreference('imageGeneratorFrameCount', 8),
                preferenceService.getPreference('imageGeneratorEngine', 'gemini'),
            ]);
            setGenerationMode(mode);
            setFps(savedFps);
            setFrameCount(savedFrameCount);
            setEngine(savedEngine as GenerationEngine);
        };
        loadPrefs();
    }, []);

    const handleSetGenerationMode = (mode: GenerationMode) => {
        setGenerationMode(mode);
        preferenceService.setPreference('imageGeneratorMode', mode);
    };
    const handleSetEngine = (newEngine: GenerationEngine) => {
        setEngine(newEngine);
        preferenceService.setPreference('imageGeneratorEngine', newEngine);
    };
    const handleSetFps = (newFps: number) => {
        setFps(newFps);
        preferenceService.setPreference('imageGeneratorFps', newFps);
    };
    const handleSetFrameCount = (newFrameCount: number) => {
        setFrameCount(newFrameCount);
        preferenceService.setPreference('imageGeneratorFrameCount', newFrameCount);
    };


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
                message = "Could not fetch image from URL. It may be protected by CORS policy. Please try a different image or download it first.";
            }
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [handleClear, isLoading, isOnline, playSound]);

    const handleDownload = useCallback(() => {
        if (!generatedImage && !generatedFrames && !generatedVideoUrl && !generatedCode) return;
        playSound(audioService.playDownload);

        let url, filename;
        if (generatedCode) {
            const blob = new Blob([generatedCode], { type: 'text/html' });
            url = URL.createObjectURL(blob);
            filename = 'ui-component.html';
        } else if (generatedVideoUrl) {
            url = `${generatedVideoUrl}&key=${process.env.API_KEY}`;
            filename = 'ai-video.mp4';
            window.open(url, '_blank');
            return;
        } else if (generatedFrames && generatedFrames.length > 0) {
            url = generatedFrames[currentFrame];
            filename = 'ai-frame.png';
        } else {
            url = generatedImage!;
            filename = 'ai-pixel-art.png';
        }
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (generatedCode) {
            URL.revokeObjectURL(url);
        }
    }, [generatedImage, generatedFrames, generatedVideoUrl, generatedCode, currentFrame, playSound]);

    const handleSaveToGallery = useCallback(() => {
        if (!generatedImage || isSaved) return;
        try {
            galleryService.addArtwork(generatedImage, prompt);
            playSound(audioService.playSuccess);
            setIsSaved(true);
        } catch (error) {
            setError("Failed to save to gallery. Storage might be full.");
            playSound(audioService.playError);
        }
    }, [generatedImage, prompt, isSaved, playSound]);

    const handleShare = useCallback(async () => {
        if (!generatedImage) return;
        try {
            const response = await fetch(generatedImage);
            const blob = await response.blob();
            const file = new File([blob], "ai-pixel-art.png", { type: "image/png" });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'AI Pixel Art',
                    text: `Generated from prompt: ${prompt}`,
                    files: [file],
                });
            } else {
                alert("Sharing is not supported on your browser, or you're in an insecure context (not HTTPS).");
            }
        } catch (error) {
            console.error("Share failed:", error);
            alert("Could not share the image.");
        }
    }, [generatedImage, prompt]);

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim() || isLoading || !isOnline) return;

        playSound(audioService.playGenerate);
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        setGeneratedFrames(null);
        setGeneratedVideoUrl(null);
        setGeneratedCode(null);
        setSuggestions([]);
        setIsSaved(false);

        try {
            if (engine === 'huggingface') {
                if (generationMode !== 'image') {
                    throw new Error("Hugging Face engine currently only supports 'Image' mode.");
                }
                setLoadingText('Generating with Stable Diffusion...');
                const image = await huggingFaceService.generateStableDiffusionImage(prompt);
                setGeneratedImage(image);
            } else { // Gemini Engine
                if (generationMode === 'gif') {
                    setLoadingText('Generating frame descriptions...');
                    const frames = await geminiService.generateGifFrames(prompt, frameCount);
                    setGeneratedFrames(frames);
                } else if (generationMode === 'video') {
                     setLoadingText(videoLoadingMessages[0]);
                     let operation = await geminiService.generateVideo(prompt);
                     while (!operation.done) {
                        await new Promise(resolve => setTimeout(resolve, 10000));
                        operation = await geminiService.getVideosOperation(operation);
                     }
                     const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
                     if (downloadLink) {
                        setGeneratedVideoUrl(downloadLink);
                     } else {
                        throw new Error("Video generation succeeded but no download link was provided.");
                     }
                } else if (generationMode === 'spritesheet') {
                    setLoadingText('Generating spritesheet...');
                    const spriteSheetPrompt = `Create a 4x4 spritesheet for a video game character based on: "${prompt}". The background must be transparent.`;
                    const image = await geminiService.generatePixelArt(spriteSheetPrompt);
                    setGeneratedImage(image);
                } else {
                    setLoadingText('Generating image...');
                    const image = await geminiService.generatePixelArt(prompt);
                    setGeneratedImage(image);
                }
            }
            playSound(audioService.playSuccess);
        } catch (err) {
            playSound(audioService.playError);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [prompt, isLoading, isOnline, playSound, generationMode, frameCount, engine]);
    
    const handleGameAssetGeneration = useCallback(async () => {
        if (isLoading || !isOnline) return;
        playSound(audioService.playGenerate);
        setIsLoading(true);
        setLoadingText('Generating game assets...');
        setError(null);
        try {
            const playerPrompt = `pixel art video game player character, full body, facing right, white background`;
            const obstaclePrompt = `pixel art video game obstacle or enemy, white background`;
            const [playerAsset, obstacleAsset] = await Promise.all([
                geminiService.generatePixelArt(playerPrompt),
                geminiService.generatePixelArt(obstaclePrompt)
            ]);
            setGameAssets({ player: playerAsset, obstacle: obstacleAsset });
            setIsGameMode(true);
            playSound(audioService.playSuccess);
        } catch (err) {
            setError(geminiService.parseApiError(err));
            playSound(audioService.playError);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, isOnline, playSound]);

    const handleGetSuggestions = useCallback(async () => {
        if (!prompt.trim() || isLoading || !isOnline) return;
        playSound(audioService.playClick);
        setLoadingText('Getting suggestions...');
        setIsLoading(true);
        try {
            const result = await geminiService.generatePromptSuggestions(prompt);
            setSuggestions(result);
            playSound(audioService.playSuccess);
        } catch (err) {
            setError(geminiService.parseApiError(err));
            playSound(audioService.playError);
        } finally {
            setIsLoading(false);
        }
    }, [prompt, isLoading, isOnline, playSound]);

    if (isGameMode && gameAssets.player && gameAssets.obstacle) {
        return (
            <Minigame
                playerImageUrl={gameAssets.player}
                obstacleImageUrl={gameAssets.obstacle}
                onClose={() => setIsGameMode(false)}
                playSound={playSound}
            />
        );
    }

    const isHfDisabled = engine === 'huggingface' && generationMode !== 'image';

    return (
        <div className="w-full h-full flex flex-col items-center px-4">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                aria-hidden="true"
            />
            <div className="w-full max-w-lg flex flex-col items-center gap-4">
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
                
                <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 font-press-start text-xs">
                    <button
                        onClick={handleDownload}
                        disabled={!generatedImage && !generatedFrames && !generatedVideoUrl && !generatedCode}
                        className="flex items-center justify-center gap-2 p-2 bg-brand-yellow text-black border-2 border-brand-light shadow-sm hover:bg-brand-magenta hover:text-white disabled:bg-gray-500 disabled:cursor-not-allowed">
                        <DownloadIcon className="w-4 h-4" /> {t('imageGenerator.download')}
                    </button>
                    <button
                        onClick={handleSaveToGallery}
                        disabled={!generatedImage || isSaved || generationMode !== 'image'}
                        className="flex items-center justify-center gap-2 p-2 bg-brand-yellow text-black border-2 border-brand-light shadow-sm hover:bg-brand-magenta hover:text-white disabled:bg-gray-500 disabled:cursor-not-allowed">
                        <GalleryIcon className="w-4 h-4" /> {isSaved ? t('imageGenerator.saved') : t('imageGenerator.save')}
                    </button>
                    <button
                        onClick={handleShare}
                        disabled={!generatedImage}
                        className="flex items-center justify-center gap-2 p-2 bg-brand-yellow text-black border-2 border-brand-light shadow-sm hover:bg-brand-magenta hover:text-white disabled:bg-gray-500 disabled:cursor-not-allowed">
                        <ShareIcon className="w-4 h-4" /> {t('imageGenerator.share')}
                    </button>
                     <button
                        onClick={handleClear}
                        className="flex items-center justify-center gap-2 p-2 bg-brand-magenta text-white border-2 border-brand-light shadow-sm hover:bg-red-500">
                        <TrashIcon className="w-4 h-4" /> {t('imageGenerator.clear')}
                    </button>
                </div>

                <div className="w-full flex flex-col gap-4 bg-black/40 p-4 border-4 border-brand-light shadow-pixel">
                    <div className="flex items-start gap-2">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={t('imageGenerator.promptPlaceholder')}
                            className="flex-grow h-24 p-2 bg-brand-light text-black rounded-none border-2 border-black focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-y font-sans"
                            disabled={isLoading}
                        />
                         <button
                            onClick={handleGenerate}
                            disabled={!prompt.trim() || isLoading || !isOnline || isHfDisabled}
                            className="w-24 h-24 flex-shrink-0 flex flex-col items-center justify-center gap-1 p-2 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed font-press-start"
                        >
                            <SparklesIcon className="w-8 h-8"/>
                            <span className="text-sm">{t('imageGenerator.generate')}</span>
                        </button>
                    </div>

                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-press-start">
                         <button onClick={handleUploadClick} disabled={isLoading || !isOnline} className="flex items-center justify-center gap-1 p-2 bg-brand-cyan/80 text-black border-2 border-brand-light shadow-sm hover:bg-brand-cyan disabled:bg-gray-400">
                            <UploadIcon className="w-4 h-4"/> {t('imageGenerator.upload')}
                        </button>
                         <button onClick={handleUrlClick} disabled={isLoading || !isOnline} className="flex items-center justify-center gap-1 p-2 bg-brand-cyan/80 text-black border-2 border-brand-light shadow-sm hover:bg-brand-cyan disabled:bg-gray-400">
                            <LinkIcon className="w-4 h-4"/> {t('imageGenerator.fromUrl')}
                        </button>
                        <button onClick={handleGetSuggestions} disabled={!prompt.trim() || isLoading || !isOnline || engine === 'huggingface'} className="flex items-center justify-center gap-1 p-2 bg-brand-cyan/80 text-black border-2 border-brand-light shadow-sm hover:bg-brand-cyan disabled:bg-gray-400">
                            <SparklesIcon className="w-4 h-4"/> {t('imageGenerator.suggestions')}
                        </button>
                        <button onClick={handleGameAssetGeneration} disabled={isLoading || !isOnline || engine === 'huggingface'} className="flex items-center justify-center gap-1 p-2 bg-brand-cyan/80 text-black border-2 border-brand-light shadow-sm hover:bg-brand-cyan disabled:bg-gray-400">
                            <PlusSquareIcon className="w-4 h-4"/> {t('imageGenerator.createAssets')}
                        </button>
                    </div>
                </div>
                
                {suggestions.length > 0 && !isLoading && (
                    <div className="w-full space-y-2">
                        <h3 className="font-press-start text-sm text-brand-cyan">{t('imageGenerator.aiSuggestions')}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setPrompt(s.prompt); playSound(audioService.playClick); }}
                                    className="p-2 text-left bg-black/30 border-2 border-brand-light/50 hover:border-brand-yellow transition-colors"
                                >
                                    <p className="font-press-start text-xs text-brand-yellow truncate">{s.title}</p>
                                    <p className="font-sans text-xs text-brand-light/80 mt-1 line-clamp-2">{s.prompt}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                 <div className="w-full flex flex-col gap-4 bg-black/40 p-4 border-4 border-brand-light shadow-pixel">
                    <div className="flex justify-center gap-1 p-1 bg-black/50">
                        {(['gemini', 'huggingface'] as GenerationEngine[]).map(e => (
                             <button
                                key={e}
                                onClick={() => handleSetEngine(e)}
                                className={`w-full py-2 text-xs font-press-start border-2 transition-colors flex items-center justify-center gap-2 ${engine === e ? 'bg-brand-yellow text-black border-black' : 'bg-surface-primary border-transparent text-text-primary hover:bg-brand-cyan/20'}`}
                            >
                                {e === 'gemini' ? <SparklesIcon className="w-4 h-4" /> : <HuggingFaceIcon className="w-4 h-4" />}
                                <span>{e === 'gemini' ? 'Gemini' : 'Stable Diffusion'}</span>
                            </button>
                        ))}
                    </div>
                    <div className="flex justify-center gap-1 p-1 bg-black/50">
                        {(['image', 'gif', 'video', 'spritesheet'] as GenerationMode[]).map(mode => (
                             <button
                                key={mode}
                                onClick={() => handleSetGenerationMode(mode)}
                                className={`w-full py-2 text-xs font-press-start border-2 transition-colors ${generationMode === mode ? 'bg-brand-yellow text-black border-black' : 'bg-surface-primary border-transparent text-text-primary hover:bg-brand-cyan/20'} ${engine === 'huggingface' && mode !== 'image' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={engine === 'huggingface' && mode !== 'image'}
                                title={engine === 'huggingface' && mode !== 'image' ? 'Only available with Gemini engine' : ''}
                            >
                                {t(`imageGenerator.modes.${mode}`)}
                            </button>
                        ))}
                    </div>
                    {(generationMode === 'gif' || generationMode === 'video') && (
                        <div className="flex flex-col sm:flex-row gap-4 items-center font-sans">
                            <div className="flex-1 w-full">
                                <label htmlFor="fps-slider" className="text-xs font-press-start text-brand-light/80 flex justify-between">
                                    <span>{t('imageGenerator.fps')}</span>
                                    <span>{fps}</span>
                                </label>
                                <input id="fps-slider" type="range" min="1" max="24" value={fps} onChange={e => handleSetFps(Number(e.target.value))} className="w-full" />
                            </div>
                             <div className="flex-1 w-full">
                                <label htmlFor="frames-slider" className="text-xs font-press-start text-brand-light/80 flex justify-between">
                                    <span>{t('imageGenerator.frameCount')}</span>
                                    <span>{frameCount}</span>
                                </label>
                                <input id="frames-slider" type="range" min="4" max="16" step="2" value={frameCount} onChange={e => handleSetFrameCount(Number(e.target.value))} className="w-full" />
                            </div>
                        </div>
                    )}
                 </div>
            </div>
        </div>
    );
};