import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as audioService from '../services/audioService';
import * as preferenceService from '../services/preferenceService';
import { UploadIcon } from './icons/UploadIcon';
import { LoadingSpinner } from './LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { PlayIcon } from './icons/PlayIcon';
import { StopIcon } from './icons/StopIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { SoundEffectParameters } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import { CopyIcon } from './icons/CopyIcon';
import { AudioVisualizer } from './icons/AudioVisualizer';
import { AudioTransformIcon } from './icons/AudioTransformIcon';
import { ImageSoundIcon } from './icons/ImageSoundIcon';
import { ReverseIcon } from './icons/ReverseIcon';

// --- Helper Functions from ImageToSoundPage ---
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s, l];
}

const analyzeImageToSound = (imageUrl: string): Promise<SoundEffectParameters> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 100;
            const scale = Math.min(1, MAX_WIDTH / img.width);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return reject(new Error("Failed to get canvas context."));
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            let totalR = 0, totalG = 0, totalB = 0;
            for (let i = 0; i < data.length; i += 4) {
                totalR += data[i]; totalG += data[i + 1]; totalB += data[i + 2];
            }
            const avgR = totalR / (data.length / 4);
            const avgG = totalG / (data.length / 4);
            const avgB = totalB / (data.length / 4);
            const [h, s, l] = rgbToHsl(avgR, avgG, avgB);
            let type: SoundEffectParameters['type'] = h < 90 ? 'square' : h < 180 ? 'sawtooth' : h < 270 ? 'sine' : 'triangle';
            const baseFreq = 200 + (l * 800);
            const freqSweep = s * baseFreq;
            resolve({
                name: 'Image Sound', type,
                startFreq: Math.max(100, baseFreq - (freqSweep / 2)),
                endFreq: baseFreq + (freqSweep / 2),
                duration: 0.1 + (s * 0.4),
                volume: 0.1 + (l * 0.3)
            });
        };
        img.onerror = () => reject(new Error("Could not load image."));
        img.src = imageUrl;
    });
};

const MELODY_SCALE = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const BASS_SCALE = ['C', 'F', 'G'];

const analyzeImageToSongEnhanced = (imageUrl: string, steps: number = 32): Promise<audioService.ComposedSong> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = steps;
            canvas.height = steps;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return reject(new Error("Failed to get canvas context."));
            ctx.drawImage(img, 0, 0, steps, steps);

            const melodyTrack: (string | null)[] = [];
            const harmonyTrack: (string | null)[] = [];
            const bassTrack: (string | null)[] = [];
            const percussionTrack: (string | null)[] = [];
            
            let totalSaturation = 0;

            for (let x = 0; x < steps; x++) {
                let r = 0, g = 0, b = 0, l_sum = 0, s_sum = 0;
                let lValues: number[] = [];
                for (let y = 0; y < steps; y++) {
                    const pixel = ctx.getImageData(x, y, 1, 1).data;
                    const [, s_p, l_p] = rgbToHsl(pixel[0], pixel[1], pixel[2]);
                    r += pixel[0]; g += pixel[1]; b += pixel[2];
                    l_sum += l_p; s_sum += s_p;
                    lValues.push(l_p);
                }
                r /= steps; g /= steps; b /= steps; 
                const l_avg = l_sum / steps;
                totalSaturation += (s_sum / steps);

                const [hue, sat, light] = rgbToHsl(r, g, b);
                
                const melodyNoteIndex = Math.floor((hue / 360) * MELODY_SCALE.length);
                const melodyOctave = 4 + Math.floor(light * 2); 
                melodyTrack.push(light < 0.1 ? null : MELODY_SCALE[melodyNoteIndex] + melodyOctave);
                
                const harmonyNoteIndex = (melodyNoteIndex + 2) % MELODY_SCALE.length; // A third above
                const harmonyOctave = 4 + Math.floor((g/255) * 2);
                harmonyTrack.push(sat < 0.15 || x % 2 !== 0 ? null : MELODY_SCALE[harmonyNoteIndex] + harmonyOctave);

                const bassNoteIndex = Math.floor((b / 255) * BASS_SCALE.length);
                const bassOctave = 2 + Math.floor(light * 1.5);
                bassTrack.push(x % 4 === 0 ? BASS_SCALE[bassNoteIndex] + bassOctave : null);

                const lVariance = lValues.reduce((acc, val) => acc + Math.pow(val - l_avg, 2), 0) / steps;
                if (lVariance > 0.08 && x % 2 === 1) { // High contrast -> snare
                    percussionTrack.push('C5'); // Placeholder for snare
                } else if (x % 4 === 0) { // On the beat -> kick
                    percussionTrack.push('C3'); // Placeholder for kick
                } else {
                    percussionTrack.push(null);
                }
            }
            
            const overallAvgSaturation = totalSaturation / steps;

            resolve({
                bpm: 100 + Math.floor(overallAvgSaturation * 60),
                tracks: [
                    { instrument: 'triangle', notes: melodyTrack },
                    { instrument: 'sine', notes: harmonyTrack },
                    { instrument: 'square', notes: bassTrack },
                    { instrument: 'noise', notes: percussionTrack },
                ]
            });
        };
        img.onerror = () => reject(new Error("Could not load image."));
        img.src = imageUrl;
    });
};

const GLYPHS = '`.-=+#@█';
const transformCanvasToGlyphCode = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): string => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let glyphCode = '';
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const i = (y * canvas.width + x) * 4;
            const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const glyphIndex = Math.min(GLYPHS.length - 1, Math.floor(brightness / 255 * GLYPHS.length));
            glyphCode += GLYPHS[glyphIndex];
        }
        glyphCode += '\n';
    }
    return glyphCode;
};

const transformImageToGlyphCode = (imageUrl: string, gridWidth: number = 48): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const aspectRatio = img.width / img.height;
            const gridHeight = Math.round(gridWidth / aspectRatio / 2); // Characters are taller than they are wide
            
            canvas.width = gridWidth;
            canvas.height = gridHeight;

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return reject(new Error("Failed to get canvas context."));

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(transformCanvasToGlyphCode(canvas, ctx));
        };
        img.onerror = () => reject(new Error("Could not load image for analysis."));
        img.src = imageUrl;
    });
};

const EMOJI_PALETTE = [
    { emoji: '⬛', color: [30, 30, 30] }, { emoji: '⬜', color: [240, 240, 240] },
    { emoji: '🟥', color: [220, 40, 40] }, { emoji: '🟧', color: [255, 140, 0] },
    { emoji: '🟨', color: [255, 220, 0] }, { emoji: '🟩', color: [50, 200, 50] },
    { emoji: '🟦', color: [60, 100, 220] }, { emoji: '🟪', color: [140, 0, 210] },
    { emoji: '🟫', color: [130, 60, 20] }, { emoji: '🌲', color: [34, 139, 34] },
    { emoji: '🌊', color: [0, 191, 255] }, { emoji: '☀️', color: [255, 250, 205] },
    { emoji: '👤', color: [245, 222, 179] } // Wheat for skin
];

const colorDistance = (c1: number[], c2: number[]) => Math.sqrt(Math.pow(c1[0] - c2[0], 2) + Math.pow(c1[1] - c2[1], 2) + Math.pow(c1[2] - c2[2], 2));

const findClosestEmoji = (r: number, g: number, b: number) => {
    let closestEmoji = ' ';
    let minDistance = Infinity;
    for (const item of EMOJI_PALETTE) {
        const distance = colorDistance([r, g, b], item.color);
        if (distance < minDistance) {
            minDistance = distance;
            closestEmoji = item.emoji;
        }
    }
    return closestEmoji;
};

const transformImageToEmoji = (imageUrl: string, gridWidth: number = 24): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const aspectRatio = img.width / img.height;
            const gridHeight = Math.round(gridWidth / aspectRatio);
            canvas.width = gridWidth;
            canvas.height = gridHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return reject(new Error("Failed to get canvas context."));
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            let emojiArt = '';
            for (let y = 0; y < gridHeight; y++) {
                for (let x = 0; x < gridWidth; x++) {
                    const pixel = ctx.getImageData(x, y, 1, 1).data;
                    emojiArt += findClosestEmoji(pixel[0], pixel[1], pixel[2]);
                }
                emojiArt += '\n';
            }
            resolve(emojiArt);
        };
        img.onerror = () => reject(new Error("Could not load image for analysis."));
        img.src = imageUrl;
    });
};

interface LocalColorResult { hex: string; count: number; }
const analyzeImageLocally = (imageUrl: string): Promise<LocalColorResult[]> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_DIM = 200;
            const scale = Math.min(1, MAX_DIM / img.width, MAX_DIM / img.height);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return reject(new Error("Could not get canvas context"));
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const colorMap = new Map<string, number>();
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i]; const g = data[i + 1]; const b = data[i + 2];
                const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
                colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
            }
            const sortedColors: LocalColorResult[] = Array.from(colorMap.entries())
                .map(([hex, count]) => ({ hex, count }))
                .sort((a, b) => b.count - a.count);
            resolve(sortedColors.slice(0, 100));
        };
        img.onerror = () => reject(new Error("Failed to load image for local analysis."));
        img.src = imageUrl;
    });
};

const ChiptuneCreator = ({ playSound, t }: { playSound: (player: () => void) => void; t: (key: string) => string; }) => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [processedAudio, setProcessedAudio] = useState<AudioBuffer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [bitDepth, setBitDepth] = useState(8);
    const [sampleRate, setSampleRate] = useState(8000);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    
    const stopPlayback = useCallback(() => {
        if (activeAudioSourceRef.current) {
            try { activeAudioSourceRef.current.stop(); } catch (e) {}
            activeAudioSourceRef.current = null;
        }
        setIsPlaying(false);
    }, []);

    useEffect(() => stopPlayback, [stopPlayback]);

    const resetState = useCallback((clearFile: boolean = false) => {
        setError(null);
        setProcessedAudio(null);
        stopPlayback();
        if (clearFile) {
            setUploadedFile(null);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }, [previewUrl, stopPlayback]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || (!file.type.startsWith('audio/') && !file.type.startsWith('video/'))) {
            setError(t('offlineAiPage.chiptuneCreator.errorSelectMedia'));
            playSound(audioService.playError);
            return;
        }
        resetState(true);
        setUploadedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        playSound(audioService.playSelection);
    };

    const handleTransform = useCallback(async () => {
        if (!uploadedFile || isLoading) return;
        resetState();
        playSound(audioService.playGenerate);
        setIsLoading(true);
        try {
            const audioBuffer = await audioService.applyBitcrusherEffect(uploadedFile, bitDepth, sampleRate);
            setProcessedAudio(audioBuffer);
            playSound(audioService.playSuccess);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to transform audio.");
            playSound(audioService.playError);
        } finally {
            setIsLoading(false);
        }
    }, [uploadedFile, isLoading, bitDepth, sampleRate, playSound, resetState]);
    
    const handlePlaybackToggle = useCallback(() => {
        playSound(audioService.playClick);
        if (isPlaying) {
            stopPlayback();
        } else if (processedAudio) {
            const source = audioService.playAudioBuffer(processedAudio);
            activeAudioSourceRef.current = source;
            setIsPlaying(true);
            source.onended = () => {
                setIsPlaying(false);
                activeAudioSourceRef.current = null;
            };
        }
    }, [isPlaying, processedAudio, playSound, stopPlayback]);
    
    const handleDownload = useCallback(async () => {
        if (!processedAudio || isDownloading) return;
        playSound(audioService.playDownload);
        setIsDownloading(true);
        try {
            const wavBlob = audioService.bufferToWav(processedAudio);
            const url = URL.createObjectURL(wavBlob);
            const a = document.createElement('a');
            a.href = url;
            const fileName = uploadedFile?.name.split('.').slice(0, -1).join('.') || 'chiptune-audio';
            a.download = `${fileName}-chiptune.wav`;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError('Failed to create WAV file.');
            playSound(audioService.playError);
        } finally {
            setIsDownloading(false);
        }
    }, [processedAudio, isDownloading, playSound, uploadedFile?.name]);
    
    return (
        <>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*,video/*" className="hidden" />
            <p className="text-sm text-center text-brand-light/80">{t('offlineAiPage.chiptuneCreator.description')}</p>
            {!uploadedFile ? (
                <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel">
                    <UploadIcon className="w-6 h-6" /> {t('offlineAiPage.chiptuneCreator.uploadMedia')}
                </button>
            ) : (
                <div className="w-full space-y-4">
                    <div className="bg-black/40 p-4 border-2 border-brand-light/50">
                        <h3 className="font-press-start text-brand-cyan">{t('offlineAiPage.chiptuneCreator.sourceMedia')}:</h3>
                        {uploadedFile.type.startsWith('video/') ? (
                            <video src={previewUrl!} controls className="w-full max-h-60 border-2 border-brand-light object-contain bg-black mt-2" />
                        ) : (
                            <audio src={previewUrl!} controls className="w-full mt-2" />
                        )}
                        <button onClick={() => fileInputRef.current?.click()} className="text-sm underline hover:text-brand-yellow mt-2">{t('offlineAiPage.chiptuneCreator.changeFile')}</button>
                    </div>
                    
                    <div className="bg-black/40 p-4 border-2 border-brand-light/50 space-y-4">
                        <h3 className="font-press-start text-brand-cyan">Chiptune Controls</h3>
                        <div>
                            <label htmlFor="bit-depth" className="text-xs font-press-start text-brand-light/80 flex justify-between">
                                <span>Bit Depth</span><span>{bitDepth}-bit</span>
                            </label>
                            <input id="bit-depth" type="range" min="1" max="16" value={bitDepth} onChange={e => setBitDepth(Number(e.target.value))} className="w-full" disabled={isLoading} />
                        </div>
                        <div>
                            <label htmlFor="sample-rate" className="text-xs font-press-start text-brand-light/80 flex justify-between">
                                <span>Sample Rate</span><span>{sampleRate} Hz</span>
                            </label>
                            <input id="sample-rate" type="range" min="2000" max="16000" step="1000" value={sampleRate} onChange={e => setSampleRate(Number(e.target.value))} className="w-full" disabled={isLoading} />
                        </div>
                    </div>

                    <button onClick={handleTransform} disabled={isLoading} className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel disabled:bg-gray-500">
                        <SparklesIcon className="w-6 h-6" /> {isLoading ? 'Transforming...' : 'Transform to Chiptune'}
                    </button>
                </div>
            )}

            <div className="w-full min-h-[8rem] p-4 bg-black/50 border-4 border-brand-light flex flex-col items-center justify-center">
                {isLoading && <LoadingSpinner text="Crunching bits..." />}
                {error && <div role="alert" className="text-center text-brand-magenta"><p className="font-press-start">Error</p><p className="text-sm mt-2">{error}</p></div>}
                {processedAudio && !isLoading && (
                    <div className="w-full space-y-4">
                        <h3 className="font-press-start text-lg text-brand-cyan text-center">Result:</h3>
                        <div className="flex gap-4">
                            <button onClick={handlePlaybackToggle} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-cyan text-black border-2 border-brand-light shadow-sm">
                                {isPlaying ? <StopIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>} {isPlaying ? 'Stop' : 'Play'}
                            </button>
                            <button onClick={handleDownload} disabled={isDownloading} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-yellow text-black border-2 border-brand-light shadow-sm disabled:bg-gray-500">
                                <DownloadIcon className="w-5 h-5"/> {isDownloading ? '...' : 'Download'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

const AudioReverserTool = ({ playSound, t }: { playSound: (player: () => void) => void; t: (key: string) => string; }) => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reversedAudio, setReversedAudio] = useState<AudioBuffer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    const stopPlayback = useCallback(() => {
        if (activeAudioSourceRef.current) {
            try { activeAudioSourceRef.current.stop(); } catch (e) {}
            activeAudioSourceRef.current = null;
        }
        setIsPlaying(false);
    }, []);

    useEffect(() => stopPlayback, [stopPlayback]);
    
    const resetState = useCallback((clearFile: boolean = false) => {
        setError(null);
        setReversedAudio(null);
        stopPlayback();
        if (clearFile) {
            setUploadedFile(null);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }, [previewUrl, stopPlayback]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || (!file.type.startsWith('audio/') && !file.type.startsWith('video/'))) {
            setError(t('offlineAiPage.audioReverser.errorSelectVideo'));
            playSound(audioService.playError);
            return;
        }
        resetState(true);
        setUploadedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        playSound(audioService.playSelection);
    };

    const handleReverse = useCallback(async () => {
        if (!uploadedFile || isLoading) return;
        resetState();
        playSound(audioService.playGenerate);
        setIsLoading(true);
        try {
            const audioBuffer = await audioService.extractAndReverseAudioFromFile(uploadedFile);
            setReversedAudio(audioBuffer);
            playSound(audioService.playSuccess);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to reverse audio.");
            playSound(audioService.playError);
        } finally {
            setIsLoading(false);
        }
    }, [uploadedFile, isLoading, playSound, resetState]);

    const handlePlaybackToggle = useCallback(() => {
        playSound(audioService.playClick);
        if (isPlaying) {
            stopPlayback();
        } else if (reversedAudio) {
            const source = audioService.playAudioBuffer(reversedAudio);
            activeAudioSourceRef.current = source;
            setIsPlaying(true);
            source.onended = () => {
                setIsPlaying(false);
                activeAudioSourceRef.current = null;
            };
        }
    }, [isPlaying, reversedAudio, playSound, stopPlayback]);
    
    const handleDownload = useCallback(async () => {
        if (!reversedAudio || isDownloading) return;
        playSound(audioService.playDownload);
        setIsDownloading(true);
        try {
            const wavBlob = audioService.bufferToWav(reversedAudio);
            const url = URL.createObjectURL(wavBlob);
            const a = document.createElement('a');
            a.href = url;
            const fileName = uploadedFile?.name.split('.').slice(0, -1).join('.') || 'reversed-audio';
            a.download = `${fileName}-reversed.wav`;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError('Failed to create WAV file.');
            playSound(audioService.playError);
        } finally {
            setIsDownloading(false);
        }
    }, [reversedAudio, isDownloading, playSound, uploadedFile?.name]);

    return (
        <>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*,video/*" className="hidden" />
            <p className="text-sm text-center text-brand-light/80">{t('offlineAiPage.audioReverser.description')}</p>
            {!uploadedFile ? (
                <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel">
                    <UploadIcon className="w-6 h-6" /> {t('offlineAiPage.audioReverser.uploadVideo')}
                </button>
            ) : (
                <div className="w-full space-y-4">
                    <div className="bg-black/40 p-4 border-2 border-brand-light/50">
                        <h3 className="font-press-start text-brand-cyan">{t('offlineAiPage.audioReverser.sourceVideo')}:</h3>
                        {uploadedFile.type.startsWith('video/') ? (
                            <video src={previewUrl!} controls className="w-full max-h-60 border-2 border-brand-light object-contain bg-black mt-2" />
                        ) : (
                            <audio src={previewUrl!} controls className="w-full mt-2" />
                        )}
                        <button onClick={() => fileInputRef.current?.click()} className="text-sm underline hover:text-brand-yellow mt-2">{t('offlineAiPage.audioReverser.changeFile')}</button>
                    </div>
                    <button onClick={handleReverse} disabled={isLoading} className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel disabled:bg-gray-500">
                        <ReverseIcon className="w-6 h-6" /> {isLoading ? t('offlineAiPage.audioReverser.transforming') : t('offlineAiPage.audioReverser.reverseAudio')}
                    </button>
                </div>
            )}
            <div className="w-full min-h-[8rem] p-4 bg-black/50 border-4 border-brand-light flex flex-col items-center justify-center">
                {isLoading && <LoadingSpinner text={t('offlineAiPage.audioReverser.transforming')} />}
                {error && <div role="alert" className="text-center text-brand-magenta"><p className="font-press-start">Error</p><p className="text-sm mt-2">{error}</p></div>}
                {reversedAudio && !isLoading && (
                    <div className="w-full space-y-4">
                        <h3 className="font-press-start text-lg text-brand-cyan text-center">{t('offlineAiPage.audioReverser.resultTitle')}</h3>
                        <div className="flex gap-4">
                            <button onClick={handlePlaybackToggle} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-cyan text-black border-2 border-brand-light shadow-sm">
                                {isPlaying ? <StopIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>} {isPlaying ? t('offlineAiPage.audioReverser.stop') : t('offlineAiPage.audioReverser.playReversed')}
                            </button>
                            <button onClick={handleDownload} disabled={isDownloading} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-yellow text-black border-2 border-brand-light shadow-sm disabled:bg-gray-500">
                                <DownloadIcon className="w-5 h-5"/> {isDownloading ? '...' : t('offlineAiPage.audioReverser.download')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

// Component for Image Transformation Tools
const ImageTransformerTool = ({ playSound, t }: { playSound: (player: () => void) => void; t: (key: string) => string; }) => {
    const [mode, setMode] = useState<ImageMode>('sound');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    
    // Results states
    const [generatedSound, setGeneratedSound] = useState<SoundEffectParameters | null>(null);
    const [generatedSong, setGeneratedSong] = useState<audioService.ComposedSong | null>(null);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [localPalette, setLocalPalette] = useState<LocalColorResult[] | null>(null);
    const [generatedEmojiArt, setGeneratedEmojiArt] = useState<string | null>(null);
    const [generatedVideoFrames, setGeneratedVideoFrames] = useState<string[] | null>(null);
    const [generatedVideoSong, setGeneratedVideoSong] = useState<audioService.ComposedSong | null>(null);
    const [isPlayingVideoFrames, setIsPlayingVideoFrames] = useState(false);
    const [currentVideoFrame, setCurrentVideoFrame] = useState(0);

    const [isPlayingSong, setIsPlayingSong] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [copiedHex, setCopiedHex] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoFrameIntervalRef = useRef<number | null>(null);

    const resetState = (clearFile: boolean = false) => {
        setIsLoading(false);
        setError(null);
        setIsDownloading(false);
        setGeneratedSound(null);
        setGeneratedSong(null);
        setGeneratedCode(null);
        setLocalPalette(null);
        setGeneratedEmojiArt(null);
        setGeneratedVideoFrames(null);
        setGeneratedVideoSong(null);
        setIsPlayingVideoFrames(false);
        if (isPlayingSong) {
            audioService.stopSong();
            setIsPlayingSong(false);
        }
        if (clearFile) {
            setUploadedFile(null);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const isVideoMode = mode === 'videoCode';
        if (isVideoMode && !file.type.startsWith('video/')) {
            setError("กรุณาเลือกไฟล์วิดีโอสำหรับโหมดนี้");
            return;
        }
        if (!isVideoMode && !file.type.startsWith('image/')) {
            setError("กรุณาเลือกไฟล์รูปภาพสำหรับโหมดนี้");
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
        if (!uploadedFile || isLoading || !previewUrl) return;

        resetState();
        playSound(audioService.playGenerate);
        setIsLoading(true);

        try {
            switch (mode) {
                case 'sound':
                    const soundParams = await analyzeImageToSound(previewUrl);
                    setGeneratedSound(soundParams);
                    if (preferenceService.getPreference('autoPlaySounds', true)) {
                        audioService.playSoundFromParams(soundParams);
                    }
                    break;
                case 'song':
                    const songData = await analyzeImageToSongEnhanced(previewUrl);
                    setGeneratedSong(songData);
                    break;
                case 'glyph':
                    const code = await transformImageToGlyphCode(previewUrl);
                    setGeneratedCode(code);
                    break;
                case 'color':
                    const colors = await analyzeImageLocally(previewUrl);
                    setLocalPalette(colors);
                    break;
                case 'emoji':
                    const art = await transformImageToEmoji(previewUrl, 24);
                    setGeneratedEmojiArt(art);
                    break;
                case 'videoCode':
                    const video = document.createElement('video');
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });
                    if (!ctx) throw new Error("Could not get canvas context");
                    
                    const frames: string[] = [];
                    const melodyTrack: (string | null)[] = [];
                    const bassTrack: (string | null)[] = [];
                    const percussionTrack: (string | null)[] = [];
                    const videoScale = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

                    const FPS = 10;
                    video.muted = true;
                    video.src = previewUrl;

                    video.onloadedmetadata = () => {
                        const aspectRatio = video.videoWidth / video.videoHeight;
                        canvas.width = 48; // Glyph code width
                        canvas.height = Math.round(canvas.width / aspectRatio / 2);
                        video.play();
                        
                        let frameCounter = 0;
                        const intervalId = setInterval(() => {
                            if (video.paused || video.ended) return;
                            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                            frames.push(transformCanvasToGlyphCode(canvas, ctx));

                            // Audio generation for frame
                            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            const data = imageData.data;
                            let totalR = 0, totalG = 0, totalB = 0;
                            const pixelCount = data.length / 4;
                            for (let i = 0; i < data.length; i += 4) {
                                totalR += data[i]; totalG += data[i+1]; totalB += data[i+2];
                            }
                            const avgR = totalR / pixelCount;
                            const avgG = totalG / pixelCount;
                            const avgB = totalB / pixelCount;
                            const [h, s, l] = rgbToHsl(avgR, avgG, avgB);

                            const noteIndex = Math.floor((h / 360) * videoScale.length);
                            const octave = 3 + Math.floor(l * 2);
                            melodyTrack.push((l < 0.1 || s < 0.1) ? null : videoScale[noteIndex] + octave);

                            const bassOctave = 2 + Math.floor((avgB / 255));
                            bassTrack.push(frameCounter % 4 === 0 ? 'C' + bassOctave : null);

                            if (frameCounter % 4 === 0) percussionTrack.push('C3');
                            else if (frameCounter % 4 === 2) percussionTrack.push('C5');
                            else percussionTrack.push(null);
                            
                            frameCounter++;
                        }, 1000 / FPS);
                        
                        video.onended = () => {
                            clearInterval(intervalId);
                            setGeneratedVideoFrames(frames);

                            const bpm = 150; // Sync with 10fps
                            const song: audioService.ComposedSong = {
                                bpm,
                                tracks: [
                                    { instrument: 'sine', notes: melodyTrack },
                                    { instrument: 'square', notes: bassTrack },
                                    { instrument: 'noise', notes: percussionTrack },
                                ]
                            };
                            setGeneratedVideoSong(song);

                            setIsLoading(false);
                            playSound(audioService.playSuccess);
                        };
                    };
                    video.onerror = () => {
                        setIsLoading(false);
                        setError("Could not load video file.");
                    };
                    break;
            }
            if (mode !== 'videoCode') {
                playSound(audioService.playSuccess);
            }
        } catch (err) {
            playSound(audioService.playError);
            setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด');
        } finally {
            if (mode !== 'videoCode') {
                setIsLoading(false);
            }
        }
    }, [uploadedFile, isLoading, previewUrl, mode, playSound]);
    
    // ... all the handlers and JSX from ImageToSoundPage ...
    const handleVideoCodePlaybackToggle = useCallback(() => {
        if (isPlayingVideoFrames) {
            setIsPlayingVideoFrames(false);
            audioService.stopSong();
            setIsPlayingSong(false);
        } else if (generatedVideoFrames && generatedVideoSong) {
            playSound(audioService.playClick);
            setIsPlayingVideoFrames(true);
            setIsPlayingSong(true);
            audioService.playComposedSong(generatedVideoSong, () => {
                setIsPlayingVideoFrames(false);
                setIsPlayingSong(false);
            });
        }
    }, [isPlayingVideoFrames, generatedVideoFrames, generatedVideoSong, playSound]);
    
    useEffect(() => {
        if (isPlayingVideoFrames && generatedVideoFrames && generatedVideoFrames.length > 0) {
            videoFrameIntervalRef.current = window.setInterval(() => {
                setCurrentVideoFrame(prev => (prev + 1) % generatedVideoFrames.length);
            }, 100); // 10 FPS
        } else {
            if (videoFrameIntervalRef.current) clearInterval(videoFrameIntervalRef.current);
            setCurrentVideoFrame(0);
        }
        return () => {
            if (videoFrameIntervalRef.current) clearInterval(videoFrameIntervalRef.current);
        };
    }, [isPlayingVideoFrames, generatedVideoFrames]);

    const handlePlaybackToggle = useCallback(() => {
        if (isPlayingSong) {
            audioService.stopSong();
            setIsPlayingSong(false);
        } else if (generatedSong) {
            playSound(audioService.playClick);
            setIsPlayingSong(true);
            audioService.playComposedSong(generatedSong, () => setIsPlayingSong(false));
        }
    }, [isPlayingSong, generatedSong, playSound]);

    const handleCopy = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        playSound(audioService.playSelection);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleCopyColor = (hex: string) => {
        if (!hex) return;
        navigator.clipboard.writeText(hex);
        playSound(audioService.playSelection);
        setCopiedHex(hex);
        setTimeout(() => setCopiedHex(null), 1500);
    };
    
    const handleDownload = async () => {
        if (isDownloading) return;
        
        let blob: Blob | null = null;
        let extension = '';
        
        if (mode === 'sound' && generatedSound) {
            blob = await audioService.exportSoundEffectToWav(generatedSound);
            extension = 'wav';
        } else if (mode === 'song' && generatedSong) {
            blob = await audioService.exportComposedSongToWav(generatedSong);
            extension = 'wav';
        } else if ((mode === 'glyph' && generatedCode) || (mode === 'emoji' && generatedEmojiArt)) {
            blob = new Blob([generatedCode || generatedEmojiArt || ''], { type: 'text/plain' });
            extension = 'txt';
        } else if (mode === 'videoCode' && generatedVideoFrames) {
            const content = generatedVideoFrames.join('\n\n---FRAME---\n\n');
            blob = new Blob([content], { type: 'text/plain' });
            extension = 'txt';
        }

        if (blob) {
            playSound(audioService.playDownload);
            setIsDownloading(true);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const fileName = uploadedFile?.name.split('.').slice(0, -1).join('_') || `generated_${mode}`;
            a.download = `${fileName}.${extension}`;
            a.href = url;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setIsDownloading(false);
        }
    };
    
    return (
        <>
            <input 
                key={mode}
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept={mode === 'videoCode' ? 'video/*' : 'image/*'} 
                className="hidden" 
                aria-hidden="true" 
            />
             <p className="text-sm text-center text-brand-light/80">{t('offlineAiPage.imageTransformer.description')}</p>
            
            <div className="w-full flex justify-center gap-1 p-1 bg-black/50 flex-wrap">
                {(['sound', 'song', 'glyph', 'color', 'emoji', 'videoCode'] as ImageMode[]).map(m => (
                    <button
                        key={m}
                        onClick={() => { playSound(audioService.playToggle); setMode(m); resetState(true); }}
                        className={`flex-1 min-w-[90px] py-2 px-1 text-xs font-press-start border-2 transition-colors ${mode === m ? 'bg-brand-yellow text-black border-black' : 'bg-surface-primary border-transparent text-text-primary hover:bg-brand-cyan/20'}`}
                    >
                        {t(`offlineAiPage.imageTransformer.mode${m.charAt(0).toUpperCase() + m.slice(1)}`)}
                    </button>
                ))}
            </div>

            <div className="w-full h-auto aspect-square bg-black/50 border-4 border-brand-light flex items-center justify-center shadow-pixel p-2">
                {!uploadedFile ? (
                     <button onClick={handleUploadClick} className="flex flex-col items-center justify-center gap-3 p-4 text-white transition-opacity hover:opacity-80">
                        <UploadIcon className="w-12 h-12" />
                        <span className="font-press-start">{mode === 'videoCode' ? 'อัปโหลดวิดีโอ' : 'อัปโหลดรูปภาพ'}</span>
                    </button>
                ) : mode === 'videoCode' ? (
                    <video src={previewUrl!} controls className="w-full h-full object-contain" />
                ) : (
                    <img src={previewUrl!} alt="Preview" className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                )}
            </div>

            {uploadedFile && (
                <div className="w-full space-y-4">
                    <button onClick={handleUploadClick} onMouseEnter={() => playSound(audioService.playHover)} className="text-sm underline hover:text-brand-yellow transition-colors">{mode === 'videoCode' ? 'เปลี่ยนวิดีโอ' : 'เปลี่ยนรูปภาพ'}</button>
                    <button 
                        onClick={handleGenerate} 
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        <SparklesIcon className="w-6 h-6" />
                        {isLoading ? 'กำลังสร้าง...' : 'สร้างสรรค์'}
                    </button>
                </div>
            )}
            
            <div className="w-full min-h-[8rem] p-4 bg-black/50 border-4 border-brand-light flex flex-col items-center justify-center">
                {isLoading && <LoadingSpinner text={mode === 'videoCode' ? 'กำลังประมวลผลวิดีโอ...' : 'กำลังวิเคราะห์ภาพ...'} />}
                {error && <div role="alert" className="w-full p-4 text-center"><h3 className="font-press-start text-lg text-brand-magenta">เกิดข้อผิดพลาด</h3><p className="font-sans text-xs mt-2 break-words text-brand-light/70">{error}</p></div>}
                
                {/* Result Displays */}
                {generatedSound && !isLoading && mode === 'sound' && (
                    <div className="w-full space-y-4 text-center">
                        <h3 className="font-press-start text-lg text-brand-cyan">สร้างเสียงสำเร็จ!</h3>
                         <div className="flex gap-4">
                             <button onClick={() => audioService.playSoundFromParams(generatedSound)} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-cyan text-black border-2 border-brand-light shadow-sm hover:bg-brand-yellow"><PlayIcon className="w-5 h-5"/> เล่นอีกครั้ง</button>
                             <button onClick={handleDownload} disabled={isDownloading} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-yellow text-black border-2 border-brand-light shadow-sm hover:bg-brand-magenta hover:text-white disabled:bg-gray-500"><DownloadIcon className="w-5 h-5"/>{isDownloading ? '...' : 'ดาวน์โหลด'}</button>
                         </div>
                    </div>
                )}
                {generatedSong && !isLoading && mode === 'song' && (
                    <div className="w-full space-y-4 text-center">
                        <h3 className="font-press-start text-lg text-brand-cyan">สร้างเพลงสำเร็จ!</h3>
                        <AudioVisualizer />
                        <div className="flex gap-4">
                            <button onClick={handlePlaybackToggle} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-cyan text-black border-2 border-brand-light shadow-sm hover:bg-brand-yellow">{isPlayingSong ? <StopIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>}{isPlayingSong ? 'หยุด' : 'เล่นเพลง'}</button>
                            <button onClick={handleDownload} disabled={isDownloading} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-yellow text-black border-2 border-brand-light shadow-sm hover:bg-brand-magenta hover:text-white disabled:bg-gray-500"><DownloadIcon className="w-5 h-5"/>{isDownloading ? '...' : 'ดาวน์โหลด'}</button>
                        </div>
                    </div>
                )}
                {generatedCode && !isLoading && mode === 'glyph' && (
                    <div className="w-full relative">
                        <h3 className="text-center font-press-start text-lg text-brand-cyan mb-3">Glyph Code ที่สร้างขึ้น</h3>
                        <pre className="bg-black text-brand-lime font-mono text-[10px] leading-tight p-2 border border-brand-light/50 overflow-x-auto whitespace-pre"><code>{generatedCode}</code></pre>
                         <div className="flex gap-2 mt-2">
                            <button onClick={() => handleCopy(generatedCode)} className="flex-1 flex items-center justify-center gap-2 p-2 bg-brand-cyan text-black border-2 border-black">{isCopied ? 'คัดลอกแล้ว!' : 'คัดลอก'}</button>
                            <button onClick={handleDownload} disabled={isDownloading} className="flex-1 flex items-center justify-center gap-2 p-2 bg-brand-yellow text-black border-2 border-black">{isDownloading ? '...' : 'ดาวน์โหลด'}</button>
                        </div>
                    </div>
                )}
                 {generatedEmojiArt && !isLoading && mode === 'emoji' && (
                    <div className="w-full relative">
                        <h3 className="text-center font-press-start text-lg text-brand-cyan mb-3">Emoji Art ที่สร้างขึ้น</h3>
                        <pre className="bg-black text-lg p-2 border border-brand-light/50 overflow-x-auto whitespace-pre leading-tight"><code>{generatedEmojiArt}</code></pre>
                         <div className="flex gap-2 mt-2">
                            <button onClick={() => handleCopy(generatedEmojiArt)} className="flex-1 flex items-center justify-center gap-2 p-2 bg-brand-cyan text-black border-2 border-black">{isCopied ? 'คัดลอกแล้ว!' : 'คัดลอก'}</button>
                            <button onClick={handleDownload} disabled={isDownloading} className="flex-1 flex items-center justify-center gap-2 p-2 bg-brand-yellow text-black border-2 border-black">{isDownloading ? '...' : 'ดาวน์โหลด'}</button>
                        </div>
                    </div>
                )}
                 {generatedVideoFrames && !isLoading && mode === 'videoCode' && (
                    <div className="w-full relative">
                        <h3 className="text-center font-press-start text-lg text-brand-cyan mb-3">Video Code Animation</h3>
                         {isPlayingSong && <AudioVisualizer />}
                        <pre className="bg-black text-brand-lime font-mono text-[10px] leading-tight p-2 border border-brand-light/50 overflow-hidden whitespace-pre"><code>{generatedVideoFrames[currentVideoFrame]}</code></pre>
                         <div className="flex gap-2 mt-2">
                            <button onClick={handleVideoCodePlaybackToggle} className="flex-1 flex items-center justify-center gap-2 p-2 bg-brand-cyan text-black border-2 border-black">
                                {isPlayingVideoFrames ? <StopIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>}
                                {isPlayingVideoFrames ? 'หยุด' : 'เล่น'}
                            </button>
                            <button onClick={handleDownload} disabled={isDownloading} className="flex-1 flex items-center justify-center gap-2 p-2 bg-brand-yellow text-black border-2 border-black">{isDownloading ? '...' : 'ดาวน์โหลด'}</button>
                        </div>
                    </div>
                )}
                {localPalette && !isLoading && mode === 'color' && (
                     <div className="w-full">
                        <h3 className="text-center font-press-start text-lg text-brand-cyan mb-3">สีที่พบในภาพ</h3>
                        <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 max-h-80 overflow-y-auto pr-2">
                            {(localPalette as LocalColorResult[]).map((color) => (
                                <div key={color.hex} className="flex flex-col items-center gap-1 group">
                                    <div className="w-full aspect-square border-2 border-brand-light/50" style={{ backgroundColor: color.hex }}></div>
                                    <button onClick={() => handleCopyColor(color.hex)} className="w-full text-center group-hover:text-brand-yellow" title={`Copy ${color.hex}`}>
                                        <p className="font-mono text-[10px] truncate">{copiedHex === color.hex ? 'คัดลอกแล้ว!' : color.hex}</p>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};


interface OfflineAiPageProps {
    playSound: (player: () => void) => void;
}

type ActiveTab = 'audio' | 'image' | 'reverser';
type ImageMode = 'sound' | 'song' | 'glyph' | 'color' | 'emoji' | 'videoCode';

export const OfflineAiPage: React.FC<OfflineAiPageProps> = ({ playSound }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<ActiveTab>('audio');

    return (
        <div className="w-full h-full flex flex-col items-center px-4">
             <h1 className="text-3xl sm:text-4xl text-brand-yellow text-center drop-shadow-[3px_3px_0_#000] mb-2">{t('offlineAiPage.title')}</h1>
             <p className="text-sm text-center text-brand-light/80 mb-6">{t('offlineAiPage.description')}</p>
            
            <div className="w-full max-w-lg mb-4 flex justify-center gap-1 p-1 bg-black/50">
                <button onClick={() => { playSound(audioService.playClick); setActiveTab('audio'); }} className={`flex items-center justify-center gap-2 flex-1 py-2 px-1 text-xs font-press-start border-2 transition-colors ${activeTab === 'audio' ? 'bg-brand-yellow text-black border-black' : 'bg-surface-primary border-transparent text-text-primary hover:bg-brand-cyan/20'}`}>
                   <AudioTransformIcon className="w-5 h-5" /> {t('offlineAiPage.tabAudio')}
                </button>
                <button onClick={() => { playSound(audioService.playClick); setActiveTab('image'); }} className={`flex items-center justify-center gap-2 flex-1 py-2 px-1 text-xs font-press-start border-2 transition-colors ${activeTab === 'image' ? 'bg-brand-yellow text-black border-black' : 'bg-surface-primary border-transparent text-text-primary hover:bg-brand-cyan/20'}`}>
                   <ImageSoundIcon className="w-5 h-5" /> {t('offlineAiPage.tabImage')}
                </button>
                 <button onClick={() => { playSound(audioService.playClick); setActiveTab('reverser'); }} className={`flex items-center justify-center gap-2 flex-1 py-2 px-1 text-xs font-press-start border-2 transition-colors ${activeTab === 'reverser' ? 'bg-brand-yellow text-black border-black' : 'bg-surface-primary border-transparent text-text-primary hover:bg-brand-cyan/20'}`}>
                   <ReverseIcon className="w-5 h-5" /> {t('offlineAiPage.tabReverser')}
                </button>
            </div>

            <div className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                {activeTab === 'audio' && (
                    <ChiptuneCreator playSound={playSound} t={t} />
                )}
                {activeTab === 'image' && (
                    <ImageTransformerTool playSound={playSound} t={t} />
                )}
                 {activeTab === 'reverser' && (
                    <AudioReverserTool playSound={playSound} t={t} />
                )}
            </div>
        </div>
    );
};