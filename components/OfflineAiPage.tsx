import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as audioService from '../services/audioService';
import { UploadIcon } from './icons/UploadIcon';
import { LoadingSpinner } from './LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { PlayIcon } from './icons/PlayIcon';
import { StopIcon } from './icons/StopIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { SoundEffectParameters, MidiNote } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import { CopyIcon } from './icons/CopyIcon';
import { AudioVisualizer } from './icons/AudioVisualizer';
import { AudioTransformIcon } from './icons/AudioTransformIcon';
import { ImageSoundIcon } from './icons/ImageSoundIcon';
import { ReverseIcon } from './icons/ReverseIcon';
import { MusicKeyboardIcon } from './icons/MusicKeyboardIcon';
import { SoundWaveIcon } from './icons/SoundWaveIcon';
import type { LocalAnalysisResult } from '../services/audioService';
import { PageWrapper, PageHeader } from './PageComponents';
import { AiDetectorIcon } from './AiDetectorIcon';
import { VoiceChangerIcon } from './icons/VoiceChangerIcon';
import { useCredits } from '../contexts/CreditContext';
import { AudioToImageIcon } from './icons/AudioToImageIcon';
import { TextToSpeechIcon } from './icons/TextToSpeechIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { AudioToImagePage } from './AudioToImagePage';
import { LocalTextToSpeechPage } from './LocalTextToSpeechPage';
import { LocalSpeechToTextPage } from './LocalSpeechToTextPage';

// --- Helper Functions for ImageLab ---
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
            const ctx = canvas.getContext('2d');
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
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error("Failed to get canvas context."));
            ctx.drawImage(img, 0, 0, steps, steps);
            const melodyTrack: (string | null)[] = [], harmonyTrack: (string | null)[] = [], bassTrack: (string | null)[] = [], percussionTrack: (string | null)[] = [];
            let totalSaturation = 0;
            for (let x = 0; x < steps; x++) {
                let r = 0, g = 0, b = 0, l_sum = 0, s_sum = 0; let lValues: number[] = [];
                for (let y = 0; y < steps; y++) { const pixel = ctx.getImageData(x, y, 1, 1).data; const [, s_p, l_p] = rgbToHsl(pixel[0], pixel[1], pixel[2]); r += pixel[0]; g += pixel[1]; b += pixel[2]; l_sum += l_p; s_sum += s_p; lValues.push(l_p); }
                r /= steps; g /= steps; b /= steps; const l_avg = l_sum / steps; totalSaturation += (s_sum / steps); const [hue, sat, light] = rgbToHsl(r, g, b);
                const melodyNoteIndex = Math.floor((hue / 360) * MELODY_SCALE.length); const melodyOctave = 4 + Math.floor(light * 2); melodyTrack.push(light < 0.1 ? null : MELODY_SCALE[melodyNoteIndex] + melodyOctave);
                const harmonyNoteIndex = (melodyNoteIndex + 2) % MELODY_SCALE.length; const harmonyOctave = 4 + Math.floor((g/255) * 2); harmonyTrack.push(sat < 0.15 || x % 2 !== 0 ? null : MELODY_SCALE[harmonyNoteIndex] + harmonyOctave);
                const bassNoteIndex = Math.floor((b / 255) * BASS_SCALE.length); const bassOctave = 2 + Math.floor(light * 1.5); bassTrack.push(x % 4 === 0 ? BASS_SCALE[bassNoteIndex] + bassOctave : null);
                const lVariance = lValues.reduce((acc, val) => acc + Math.pow(val - l_avg, 2), 0) / steps;
                if (lVariance > 0.08 && x % 2 === 1) { percussionTrack.push('C5'); } else if (x % 4 === 0) { percussionTrack.push('C3'); } else { percussionTrack.push(null); }
            }
            const overallAvgSaturation = totalSaturation / steps;
            resolve({ bpm: 100 + Math.floor(overallAvgSaturation * 60), tracks: [{ instrument: 'triangle', notes: melodyTrack }, { instrument: 'sine', notes: harmonyTrack }, { instrument: 'square', notes: bassTrack }, { instrument: 'noise', notes: percussionTrack }] });
        };
        img.onerror = () => reject(new Error("Could not load image."));
        img.src = imageUrl;
    });
};

const GLYPHS = '`.-=+#@█';
const transformCanvasToGlyphCode = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): string => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height); const data = imageData.data; let glyphCode = '';
    for (let y = 0; y < canvas.height; y++) { for (let x = 0; x < canvas.width; x++) { const i = (y * canvas.width + x) * 4; const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]; const glyphIndex = Math.min(GLYPHS.length - 1, Math.floor(brightness / 255 * GLYPHS.length)); glyphCode += GLYPHS[glyphIndex]; } glyphCode += '\n'; }
    return glyphCode;
};

const transformImageToGlyphCode = (imageUrl: string, gridWidth: number = 48): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image(); img.crossOrigin = 'Anonymous';
        img.onload = () => { const canvas = document.createElement('canvas'); const aspectRatio = img.width / img.height; const gridHeight = Math.round(gridWidth / aspectRatio / 2); canvas.width = gridWidth; canvas.height = gridHeight; const ctx = canvas.getContext('2d'); if (!ctx) return reject(new Error("Failed to get canvas context.")); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); resolve(transformCanvasToGlyphCode(canvas, ctx)); };
        img.onerror = () => reject(new Error("Could not load image for analysis.")); img.src = imageUrl;
    });
};

const EMOJI_PALETTE = [
    { emoji: '⬛', color: [30, 30, 30] }, { emoji: '⬜', color: [240, 240, 240] },
    { emoji: '🟥', color: [220, 40, 40] }, { emoji: '🟧', color: [255, 140, 0] },
    { emoji: '🟨', color: [255, 220, 0] }, { emoji: '🟩', color: [50, 200, 50] },
    { emoji: '🟦', color: [60, 100, 220] }, { emoji: '🟪', color: [140, 0, 210] },
    { emoji: '🟫', color: [130, 60, 20] }, { emoji: '🌲', color: [34, 139, 34] },
    { emoji: '🌊', color: [0, 191, 255] }, { emoji: '☀️', color: [255, 250, 205] },
    { emoji: '👤', color: [245, 222, 179] }
];
const colorDistance = (c1: number[], c2: number[]) => Math.sqrt(Math.pow(c1[0] - c2[0], 2) + Math.pow(c1[1] - c2[1], 2) + Math.pow(c1[2] - c2[2], 2));
const findClosestEmoji = (r: number, g: number, b: number) => {
    let closestEmoji = ' '; let minDistance = Infinity;
    for (const item of EMOJI_PALETTE) { const distance = colorDistance([r, g, b], item.color); if (distance < minDistance) { minDistance = distance; closestEmoji = item.emoji; } }
    return closestEmoji;
};
const transformImageToEmoji = (imageUrl: string, gridWidth: number = 24): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image(); img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas'); const aspectRatio = img.width / img.height; const gridHeight = Math.round(gridWidth / aspectRatio); canvas.width = gridWidth; canvas.height = gridHeight; const ctx = canvas.getContext('2d'); if (!ctx) return reject(new Error("Failed to get canvas context.")); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            let emojiArt = '';
            for (let y = 0; y < gridHeight; y++) { for (let x = 0; x < gridWidth; x++) { const pixel = ctx.getImageData(x, y, 1, 1).data; emojiArt += findClosestEmoji(pixel[0], pixel[1], pixel[2]); } emojiArt += '\n'; }
            resolve(emojiArt);
        };
        img.onerror = () => reject(new Error("Could not load image for analysis.")); img.src = imageUrl;
    });
};

interface LocalColorResult { hex: string; count: number; }
const analyzeImageLocally = (imageUrl: string): Promise<LocalColorResult[]> => {
    return new Promise((resolve, reject) => {
        const img = new Image(); img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas'); const MAX_DIM = 200; const scale = Math.min(1, MAX_DIM / img.width, MAX_DIM / img.height); canvas.width = img.width * scale; canvas.height = img.height * scale; const ctx = canvas.getContext('2d'); if (!ctx) return reject(new Error("Could not get canvas context"));
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height); const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height); const data = imageData.data; const colorMap = new Map<string, number>();
            for (let i = 0; i < data.length; i += 4) { const r = data[i]; const g = data[i + 1]; const b = data[i + 2]; const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`; colorMap.set(hex, (colorMap.get(hex) || 0) + 1); }
            const sortedColors: LocalColorResult[] = Array.from(colorMap.entries()).map(([hex, count]) => ({ hex, count })).sort((a, b) => b.count - a.count);
            resolve(sortedColors.slice(0, 100));
        };
        img.onerror = () => reject(new Error("Failed to load image for local analysis.")); img.src = imageUrl;
    });
};
// --- End Helper Functions ---

interface OfflineToolProps {
    playSound: (player: () => void) => void;
    t: (key: string) => string;
    onClose: () => void;
// FIX: Update addCredits to return a Promise.
    addCredits: (amount: number) => Promise<void>;
}

const ChiptuneCreator = ({ playSound, t, onClose, addCredits }: OfflineToolProps) => {
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
    
    const stopPlayback = useCallback(() => { if (activeAudioSourceRef.current) { try { activeAudioSourceRef.current.stop(); } catch (e) {} activeAudioSourceRef.current = null; } setIsPlaying(false); }, []);
    useEffect(() => { return stopPlayback }, [stopPlayback]);

    const resetState = useCallback((clearFile: boolean = false) => {
        setError(null); setProcessedAudio(null); stopPlayback();
        if (clearFile) { setUploadedFile(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; }
    }, [previewUrl, stopPlayback]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || (!file.type.startsWith('audio/') && !file.type.startsWith('video/'))) { setError(t('offlineAiPage.chiptuneCreator.errorSelectMedia')); playSound(audioService.playError); return; }
        resetState(true); setUploadedFile(file); setPreviewUrl(URL.createObjectURL(file)); playSound(audioService.playSelection);
    };

    const handleTransform = useCallback(async () => {
        if (!uploadedFile || isLoading) return;
        resetState(); playSound(audioService.playGenerate); setIsLoading(true);
        try { const audioBuffer = await audioService.applyBitcrusherEffect(uploadedFile, bitDepth, sampleRate); setProcessedAudio(audioBuffer); playSound(audioService.playSuccess); 
// FIX: Await the async addCredits call.
        await addCredits(25); } catch (err) { setError(err instanceof Error ? err.message : "Failed to transform audio."); playSound(audioService.playError); } finally { setIsLoading(false); }
    }, [uploadedFile, isLoading, bitDepth, sampleRate, playSound, resetState, addCredits]);
    
    const handlePlaybackToggle = useCallback(() => {
        playSound(audioService.playClick);
        if (isPlaying) { stopPlayback(); } else if (processedAudio) { const source = audioService.playAudioBuffer(processedAudio); activeAudioSourceRef.current = source; setIsPlaying(true); source.onended = () => { setIsPlaying(false); activeAudioSourceRef.current = null; }; }
    }, [isPlaying, processedAudio, playSound, stopPlayback]);
    
    const handleDownload = useCallback(async () => {
        if (!processedAudio || isDownloading) return;
        playSound(audioService.playDownload); setIsDownloading(true);
        try { const wavBlob = audioService.bufferToWav(processedAudio); const url = URL.createObjectURL(wavBlob); const a = document.createElement('a'); a.href = url; const fileName = uploadedFile?.name.split('.').slice(0, -1).join('.') || 'chiptune-audio'; a.download = `${fileName}-chiptune.wav`; document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); document.body.removeChild(a); } catch (err) { setError('Failed to create WAV file.'); playSound(audioService.playError); } finally { setIsDownloading(false); }
    }, [processedAudio, isDownloading, playSound, uploadedFile?.name]);
    
    return (
        <PageWrapper>
            <PageHeader title={t('offlineAiPage.hub.chiptune.name')} onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*,video/*" className="hidden" />
                <p className="text-sm text-center text-brand-light/80">{t('offlineAiPage.chiptuneCreator.description')}</p>
                {!uploadedFile ? ( <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel"><UploadIcon className="w-6 h-6" /> {t('offlineAiPage.chiptuneCreator.uploadMedia')}</button>
                ) : (
                    <div className="w-full space-y-4">
                        <div className="bg-black/40 p-4 border-2 border-brand-light/50">
                            <h3 className="font-press-start text-brand-cyan">{t('offlineAiPage.chiptuneCreator.sourceMedia')}:</h3>
                            {uploadedFile.type.startsWith('video/') ? ( <video src={previewUrl!} controls className="w-full max-h-60 border-2 border-brand-light object-contain bg-black mt-2" /> ) : ( <audio src={previewUrl!} controls className="w-full mt-2" /> )}
                            <button onClick={() => fileInputRef.current?.click()} className="text-sm underline hover:text-brand-yellow mt-2">{t('offlineAiPage.chiptuneCreator.changeFile')}</button>
                        </div>
                        <div className="bg-black/40 p-4 border-2 border-brand-light/50 space-y-4">
                            <h3 className="font-press-start text-brand-cyan">{t('offlineAiPage.chiptuneCreator.controlsTitle')}</h3>
                            <div>
                                <label htmlFor="bit-depth" className="text-xs font-press-start text-brand-light/80 flex justify-between"><span>{t('offlineAiPage.chiptuneCreator.bitDepth')}</span><span>{bitDepth}-bit</span></label>
                                <input id="bit-depth" type="range" min="1" max="16" value={bitDepth} onChange={e => setBitDepth(Number(e.target.value))} className="w-full" disabled={isLoading} />
                            </div>
                            <div>
                                <label htmlFor="sample-rate" className="text-xs font-press-start text-brand-light/80 flex justify-between"><span>{t('offlineAiPage.chiptuneCreator.sampleRate')}</span><span>{sampleRate} Hz</span></label>
                                <input id="sample-rate" type="range" min="2000" max="16000" step="1000" value={sampleRate} onChange={e => setSampleRate(Number(e.target.value))} className="w-full" disabled={isLoading} />
                            </div>
                        </div>
                        <button onClick={handleTransform} disabled={isLoading} className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel disabled:bg-gray-500"><SparklesIcon className="w-6 h-6" /> {isLoading ? t('offlineAiPage.chiptuneCreator.transforming') : t('offlineAiPage.chiptuneCreator.transform')}</button>
                    </div>
                )}
                <div className="w-full min-h-[8rem] p-4 bg-black/50 border-4 border-brand-light flex flex-col items-center justify-center">
                    {isLoading && <LoadingSpinner text={t('offlineAiPage.chiptuneCreator.loading')} />}
                    {error && <div role="alert" className="text-center text-brand-magenta"><p className="font-press-start">{t('offlineAiPage.error')}</p><p className="text-sm mt-2">{error}</p></div>}
                    {processedAudio && !isLoading && (
                        <div className="w-full space-y-4">
                            <h3 className="font-press-start text-lg text-brand-cyan text-center">{t('offlineAiPage.resultTitle')}:</h3>
                            <div className="flex gap-4">
                                <button onClick={handlePlaybackToggle} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-cyan text-black border-2 border-brand-light shadow-sm">{isPlaying ? <StopIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>} {isPlaying ? t('offlineAiPage.stop') : t('offlineAiPage.play')}</button>
                                <button onClick={handleDownload} disabled={isDownloading} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-yellow text-black border-2 border-brand-light shadow-sm disabled:bg-gray-500"><DownloadIcon className="w-5 h-5"/> {isDownloading ? '...' : t('offlineAiPage.download')}</button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </PageWrapper>
    );
};

const AudioReverserTool = ({ playSound, t, onClose, addCredits }: OfflineToolProps) => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reversedAudio, setReversedAudio] = useState<AudioBuffer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    const stopPlayback = useCallback(() => { if (activeAudioSourceRef.current) { try { activeAudioSourceRef.current.stop(); } catch (e) {} activeAudioSourceRef.current = null; } setIsPlaying(false); }, []);
    useEffect(() => { return stopPlayback }, [stopPlayback]);
    
    const resetState = useCallback((clearFile: boolean = false) => {
        setError(null); setReversedAudio(null); stopPlayback();
        if (clearFile) { setUploadedFile(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; }
    }, [previewUrl, stopPlayback]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || (!file.type.startsWith('audio/') && !file.type.startsWith('video/'))) { setError(t('offlineAiPage.audioReverser.errorSelectVideo')); playSound(audioService.playError); return; }
        resetState(true); setUploadedFile(file); setPreviewUrl(URL.createObjectURL(file)); playSound(audioService.playSelection);
    };

    const handleReverse = useCallback(async () => {
        if (!uploadedFile || isLoading) return;
        resetState(); playSound(audioService.playGenerate); setIsLoading(true);
        try { const audioBuffer = await audioService.extractAndReverseAudioFromFile(uploadedFile); setReversedAudio(audioBuffer); playSound(audioService.playSuccess); 
// FIX: Await the async addCredits call.
        await addCredits(15); } catch (err) { setError(err instanceof Error ? err.message : "Failed to reverse audio."); playSound(audioService.playError); } finally { setIsLoading(false); }
    }, [uploadedFile, isLoading, playSound, resetState, addCredits]);

    const handlePlaybackToggle = useCallback(() => {
        playSound(audioService.playClick);
        if (isPlaying) { stopPlayback(); } else if (reversedAudio) { const source = audioService.playAudioBuffer(reversedAudio); activeAudioSourceRef.current = source; setIsPlaying(true); source.onended = () => { setIsPlaying(false); activeAudioSourceRef.current = null; }; }
    }, [isPlaying, reversedAudio, playSound, stopPlayback]);
    
    const handleDownload = useCallback(async () => {
        if (!reversedAudio || isDownloading) return;
        playSound(audioService.playDownload); setIsDownloading(true);
        try { const wavBlob = audioService.bufferToWav(reversedAudio); const url = URL.createObjectURL(wavBlob); const a = document.createElement('a'); a.href = url; const fileName = uploadedFile?.name.split('.').slice(0, -1).join('.') || 'reversed-audio'; a.download = `${fileName}-reversed.wav`; document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); document.body.removeChild(a); } catch (err) { setError('Failed to create WAV file.'); playSound(audioService.playError); } finally { setIsDownloading(false); }
    }, [reversedAudio, isDownloading, playSound, uploadedFile?.name]);

    return (
        <PageWrapper>
            <PageHeader title={t('offlineAiPage.hub.reverser.name')} onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*,video/*" className="hidden" />
                <p className="text-sm text-center text-brand-light/80">{t('offlineAiPage.audioReverser.description')}</p>
                {!uploadedFile ? ( <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel"><UploadIcon className="w-6 h-6" /> {t('offlineAiPage.audioReverser.uploadVideo')}</button>
                ) : (
                    <div className="w-full space-y-4">
                        <div className="bg-black/40 p-4 border-2 border-brand-light/50">
                            <h3 className="font-press-start text-brand-cyan">{t('offlineAiPage.audioReverser.sourceVideo')}:</h3>
                            {uploadedFile.type.startsWith('video/') ? ( <video src={previewUrl!} controls className="w-full max-h-60 border-2 border-brand-light object-contain bg-black mt-2" /> ) : ( <audio src={previewUrl!} controls className="w-full mt-2" /> )}
                            <button onClick={() => fileInputRef.current?.click()} className="text-sm underline hover:text-brand-yellow mt-2">{t('offlineAiPage.audioReverser.changeFile')}</button>
                        </div>
                        <button onClick={handleReverse} disabled={isLoading} className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel disabled:bg-gray-500"><ReverseIcon className="w-6 h-6" /> {isLoading ? t('offlineAiPage.audioReverser.transforming') : t('offlineAiPage.audioReverser.reverseAudio')}</button>
                    </div>
                )}
                <div className="w-full min-h-[8rem] p-4 bg-black/50 border-4 border-brand-light flex flex-col items-center justify-center">
                    {isLoading && <LoadingSpinner text={t('offlineAiPage.audioReverser.transforming')} />}
                    {error && <div role="alert" className="text-center text-brand-magenta"><p className="font-press-start">Error</p><p className="text-sm mt-2">{error}</p></div>}
                    {reversedAudio && !isLoading && (
                        <div className="w-full space-y-4">
                            <h3 className="font-press-start text-lg text-brand-cyan text-center">{t('offlineAiPage.audioReverser.resultTitle')}</h3>
                            <div className="flex gap-4">
                                <button onClick={handlePlaybackToggle} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-cyan text-black border-2 border-brand-light shadow-sm">{isPlaying ? <StopIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>} {isPlaying ? 'Stop' : t('offlineAiPage.audioReverser.playReversed')}</button>
                                <button onClick={handleDownload} disabled={isDownloading} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-yellow text-black border-2 border-brand-light shadow-sm disabled:bg-gray-500"><DownloadIcon className="w-5 h-5"/> {isDownloading ? '...' : t('offlineAiPage.audioReverser.download')}</button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </PageWrapper>
    );
};

const AudioToMidiTool = ({ playSound, t, onClose, addCredits }: OfflineToolProps) => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [processedMidi, setProcessedMidi] = useState<MidiNote[] | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { return () => audioService.stopMidi() }, []);

    const resetState = useCallback((clearFile: boolean = false) => {
        setError(null); setProcessedMidi(null); audioService.stopMidi(); setIsPlaying(false);
        if (clearFile) { setUploadedFile(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; }
    }, [previewUrl]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || (!file.type.startsWith('audio/') && !file.type.startsWith('video/'))) { setError(t('offlineAiPage.audioToMidi.errorSelectMedia')); playSound(audioService.playError); return; }
        resetState(true); setUploadedFile(file); setPreviewUrl(URL.createObjectURL(file)); playSound(audioService.playSelection);
    };
    
    const handleTransform = useCallback(async () => {
        if (!uploadedFile || isLoading) return;
        resetState(); playSound(audioService.playGenerate); setIsLoading(true);
        try {
            const arrayBuffer = await uploadedFile.arrayBuffer(); const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer); const midiNotes = await audioService.analyzeAudioBufferToMidi(audioBuffer);
            if (midiNotes.length === 0) { throw new Error("Could not detect any distinct notes in the audio."); }
            setProcessedMidi(midiNotes); playSound(audioService.playSuccess); 
// FIX: Await the async addCredits call.
        await addCredits(30);
        } catch (err) { setError(err instanceof Error ? err.message : "Failed to convert audio to MIDI."); playSound(audioService.playError); } finally { setIsLoading(false); }
    }, [uploadedFile, isLoading, playSound, resetState, addCredits]);

    const handlePlaybackToggle = useCallback(() => {
        playSound(audioService.playClick);
        if (isPlaying) { audioService.stopMidi(); setIsPlaying(false); } else if (processedMidi) { setIsPlaying(true); audioService.playMidi(processedMidi, () => setIsPlaying(false)); }
    }, [isPlaying, processedMidi, playSound]);
    
    const handleDownload = useCallback(async () => {
        if (!processedMidi || isDownloading) return;
        playSound(audioService.playDownload); setIsDownloading(true);
        try {
            const wavBlob = await audioService.exportMidiToWav(processedMidi); if (!wavBlob) throw new Error('Failed to create WAV file.'); const url = URL.createObjectURL(wavBlob); const a = document.createElement('a'); a.href = url; const fileName = uploadedFile?.name.split('.').slice(0, -1).join('.') || 'audio-to-midi'; a.download = `${fileName}-midi.wav`; document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); document.body.removeChild(a);
        } catch (err) { setError('Failed to create WAV file.'); playSound(audioService.playError); } finally { setIsDownloading(false); }
    }, [processedMidi, isDownloading, playSound, uploadedFile?.name]);
    
    return (
        <PageWrapper>
            <PageHeader title={t('offlineAiPage.hub.midi.name')} onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*,video/*" className="hidden" />
                <p className="text-sm text-center text-brand-light/80">{t('offlineAiPage.audioToMidi.description')}</p>
                {!uploadedFile ? ( <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel"><UploadIcon className="w-6 h-6" /> {t('offlineAiPage.audioToMidi.uploadMedia')}</button>
                ) : (
                    <div className="w-full space-y-4">
                        <div className="bg-black/40 p-4 border-2 border-brand-light/50">
                            <h3 className="font-press-start text-brand-cyan">{t('offlineAiPage.audioToMidi.sourceMedia')}:</h3>
                            {uploadedFile.type.startsWith('video/') ? ( <video src={previewUrl!} controls className="w-full max-h-60 border-2 border-brand-light object-contain bg-black mt-2" /> ) : ( <audio src={previewUrl!} controls className="w-full mt-2" /> )}
                            <button onClick={() => fileInputRef.current?.click()} className="text-sm underline hover:text-brand-yellow mt-2">{t('offlineAiPage.audioToMidi.changeFile')}</button>
                        </div>
                        <button onClick={handleTransform} disabled={isLoading} className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel disabled:bg-gray-500"><SparklesIcon className="w-6 h-6" /> {isLoading ? t('offlineAiPage.audioToMidi.transforming') : t('offlineAiPage.audioToMidi.transform')}</button>
                    </div>
                )}
                <div className="w-full min-h-[8rem] p-4 bg-black/50 border-4 border-brand-light flex flex-col items-center justify-center">
                    {isLoading && <LoadingSpinner text={t('offlineAiPage.audioToMidi.transforming')} />}
                    {error && <div role="alert" className="text-center text-brand-magenta"><p className="font-press-start">Error</p><p className="text-sm mt-2">{error}</p></div>}
                    {processedMidi && !isLoading && (
                        <div className="w-full space-y-4">
                            <h3 className="font-press-start text-lg text-brand-cyan text-center">{t('offlineAiPage.audioToMidi.resultTitle')}</h3>
                            <p className="text-center">{t('offlineAiPage.audioToMidi.notesFound').replace('{count}', String(processedMidi.length))}</p>
                            <div className="flex gap-4">
                                <button onClick={handlePlaybackToggle} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-cyan text-black border-2 border-brand-light shadow-sm">{isPlaying ? <StopIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>} {isPlaying ? t('offlineAiPage.stop') : t('offlineAiPage.audioToMidi.playMidi')}</button>
                                <button onClick={handleDownload} disabled={isDownloading} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-yellow text-black border-2 border-brand-light shadow-sm disabled:bg-gray-500"><DownloadIcon className="w-5 h-5"/> {isDownloading ? '...' : t('offlineAiPage.audioToMidi.download')}</button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </PageWrapper>
    );
};

const AudioAnalyzerTool = ({ playSound, t, onClose, addCredits }: OfflineToolProps) => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<LocalAnalysisResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

     const resetState = useCallback((clearFile: boolean = false) => {
        setError(null); setAnalysisResult(null);
        if (clearFile) { setUploadedFile(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; }
    }, [previewUrl]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || (!file.type.startsWith('audio/') && !file.type.startsWith('video/'))) { setError(t('offlineAiPage.analyzer.errorSelectMedia')); playSound(audioService.playError); return; }
        resetState(true); setUploadedFile(file); setPreviewUrl(URL.createObjectURL(file)); playSound(audioService.playSelection);
    };

     const handleAnalyze = useCallback(async () => {
        if (!uploadedFile || isLoading) return;
        resetState(); playSound(audioService.playGenerate); setIsLoading(true);
        try {
            const arrayBuffer = await uploadedFile.arrayBuffer(); const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer); const result = await audioService.analyzeAudioLocally(audioBuffer);
            setAnalysisResult(result); playSound(audioService.playSuccess); 
// FIX: Await the async addCredits call.
        await addCredits(10);
        } catch (err) { setError(err instanceof Error ? err.message : "Failed to analyze audio."); playSound(audioService.playError); } finally { setIsLoading(false); }
    }, [uploadedFile, isLoading, playSound, resetState, addCredits]);
    
    return (
        <PageWrapper>
            <PageHeader title={t('offlineAiPage.hub.analyzer.name')} onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*,video/*" className="hidden" />
                <p className="text-sm text-center text-brand-light/80">{t('offlineAiPage.analyzer.description')}</p>
                {!uploadedFile ? ( <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel"><UploadIcon className="w-6 h-6" /> {t('offlineAiPage.analyzer.uploadMedia')}</button>
                ) : (
                    <div className="w-full space-y-4">
                        <div className="bg-black/40 p-4 border-2 border-brand-light/50">
                            <h3 className="font-press-start text-brand-cyan">{t('offlineAiPage.analyzer.sourceMedia')}:</h3>
                            {uploadedFile.type.startsWith('video/') ? ( <video src={previewUrl!} controls className="w-full max-h-60 border-2 border-brand-light object-contain bg-black mt-2" /> ) : ( <audio src={previewUrl!} controls className="w-full mt-2" /> )}
                            <button onClick={() => fileInputRef.current?.click()} className="text-sm underline hover:text-brand-yellow mt-2">{t('offlineAiPage.analyzer.changeFile')}</button>
                        </div>
                        <button onClick={handleAnalyze} disabled={isLoading} className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel disabled:bg-gray-500"><SparklesIcon className="w-6 h-6" /> {isLoading ? t('offlineAiPage.analyzer.transforming') : t('offlineAiPage.analyzer.transform')}</button>
                    </div>
                )}
                <div className="w-full min-h-[8rem] p-4 bg-black/50 border-4 border-brand-light flex flex-col items-center justify-center">
                    {isLoading && <LoadingSpinner text={t('offlineAiPage.analyzer.transforming')} />}
                    {error && <div role="alert" className="text-center text-brand-magenta"><p className="font-press-start">Error</p><p className="text-sm mt-2">{error}</p></div>}
                    {analysisResult && !isLoading && (
                        <div className="w-full space-y-2">
                            <h3 className="font-press-start text-lg text-brand-cyan text-center">{t('offlineAiPage.analyzer.resultTitle')}</h3>
                            <div className="text-xs font-mono">
                                <div className="flex border-b border-brand-light/20 py-1"><span className="w-1/2 text-brand-light/70">{t('offlineAiPage.analyzer.duration')}:</span><span>{analysisResult.duration.toFixed(2)}s</span></div>
                                <div className="flex border-b border-brand-light/20 py-1"><span className="w-1/2 text-brand-light/70">{t('offlineAiPage.analyzer.avgLoudness')}:</span><span>{analysisResult.averageLoudness.toFixed(2)} dB</span></div>
                                <div className="flex border-b border-brand-light/20 py-1"><span className="w-1/2 text-brand-light/70">{t('offlineAiPage.analyzer.peakLoudness')}:</span><span>{analysisResult.peakLoudness.toFixed(2)} dB</span></div>
                                <div className="flex border-b border-brand-light/20 py-1"><span className="w-1/2 text-brand-light/70">{t('offlineAiPage.analyzer.dominantFreq')}:</span><span>{analysisResult.dominantFrequency.toFixed(2)} Hz</span></div>
                                <div className="flex border-b border-brand-light/20 py-1"><span className="w-1/2 text-brand-light/70">{t('offlineAiPage.analyzer.estimatedPitch')}:</span><span>{analysisResult.estimatedPitch}</span></div>
                                <div className="flex border-b border-brand-light/20 py-1"><span className="w-1/2 text-brand-light/70">{t('offlineAiPage.analyzer.estimatedBpm')}:</span><span>{analysisResult.estimatedBpm > 0 ? `${analysisResult.estimatedBpm} BPM` : 'N/A'}</span></div>
                                <div className="flex border-b border-brand-light/20 py-1"><span className="w-1/2 text-brand-light/70">{t('offlineAiPage.analyzer.harmonicRichness')}:</span><span>{analysisResult.harmonicRichness.toFixed(1)}% ({analysisResult.harmonicRichness > 60 ? 'Rich' : analysisResult.harmonicRichness > 30 ? 'Moderate' : 'Simple'})</span></div>
                                <div className="flex py-1"><span className="w-1/2 text-brand-light/70">{t('offlineAiPage.analyzer.clipping')}:</span><span>{analysisResult.clippingPercentage.toFixed(2)}%</span></div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </PageWrapper>
    );
};

const ImageLab = ({ playSound, t, onClose, addCredits }: OfflineToolProps) => {
    type Mode = 'sound' | 'song' | 'glyph' | 'color' | 'emoji';
    const [mode, setMode] = useState<Mode>('color');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    
    const [generatedSound, setGeneratedSound] = useState<SoundEffectParameters | null>(null);
    const [generatedSong, setGeneratedSong] = useState<audioService.ComposedSong | null>(null);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [localPalette, setLocalPalette] = useState<LocalColorResult[] | null>(null);
    const [generatedEmojiArt, setGeneratedEmojiArt] = useState<string | null>(null);

    const [isPlayingSong, setIsPlayingSong] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [copiedHex, setCopiedHex] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const resetState = useCallback((clearFile: boolean = false) => {
        setIsLoading(false); setError(null); setIsDownloading(false);
        setGeneratedSound(null); setGeneratedSong(null); setGeneratedCode(null);
        setLocalPalette(null); setGeneratedEmojiArt(null);
        if (isPlayingSong) { audioService.stopSong(); setIsPlayingSong(false); }
        if (clearFile) {
            setUploadedFile(null);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }, [isPlayingSong, previewUrl]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) { setError(t('offlineAiPage.imageTransformer.errorSelectImage')); return; }
        resetState(true); setUploadedFile(file); setPreviewUrl(URL.createObjectURL(file)); playSound(audioService.playSelection);
    };

    const handleUploadClick = useCallback(() => { playSound(audioService.playClick); fileInputRef.current?.click(); }, [playSound]);

    const handleGenerate = useCallback(async () => {
        if (!uploadedFile || isLoading || !previewUrl) return;
        resetState(); playSound(audioService.playGenerate); setIsLoading(true);
        try {
            switch (mode) {
                case 'sound': const soundParams = await analyzeImageToSound(previewUrl); setGeneratedSound(soundParams); audioService.playSoundFromParams(soundParams); 
// FIX: Await the async addCredits call.
                await addCredits(10); break;
                case 'song': const songData = await analyzeImageToSongEnhanced(previewUrl); setGeneratedSong(songData); 
// FIX: Await the async addCredits call.
                await addCredits(20); break;
                case 'glyph': const code = await transformImageToGlyphCode(previewUrl); setGeneratedCode(code); 
// FIX: Await the async addCredits call.
                await addCredits(5); break;
                case 'color': const colors = await analyzeImageLocally(previewUrl); setLocalPalette(colors); 
// FIX: Await the async addCredits call.
                await addCredits(5); break;
                case 'emoji': const art = await transformImageToEmoji(previewUrl, 24); setGeneratedEmojiArt(art); 
// FIX: Await the async addCredits call.
                await addCredits(5); break;
            }
            playSound(audioService.playSuccess);
        } catch (err) { playSound(audioService.playError); setError(err instanceof Error ? err.message : 'An unknown error occurred'); } finally { setIsLoading(false); }
    }, [uploadedFile, isLoading, previewUrl, mode, playSound, resetState, addCredits]);

    const handlePlaybackToggle = useCallback(() => {
        if (isPlayingSong) { audioService.stopSong(); setIsPlayingSong(false); } 
        else if (generatedSong) { playSound(audioService.playClick); setIsPlayingSong(true); audioService.playComposedSong(generatedSong, () => setIsPlayingSong(false)); }
    }, [isPlayingSong, generatedSong, playSound]);

    const handleCopy = (text: string) => { if (!text) return; navigator.clipboard.writeText(text); playSound(audioService.playSelection); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); };
    const handleCopyColor = (hex: string) => { if (!hex) return; navigator.clipboard.writeText(hex); playSound(audioService.playSelection); setCopiedHex(hex); setTimeout(() => setCopiedHex(null), 1500); };

    const handleDownload = async () => { /* ... implementation from ImageToSoundPage ... */ };
    
    return (
        <PageWrapper>
            <PageHeader title={t('offlineAiPage.imageLab.title')} onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" aria-hidden="true" />
                 <p className="text-sm text-center text-brand-light/80">{t('offlineAiPage.imageLab.description')}</p>
                 <div className="w-full flex justify-center gap-1 p-1 bg-black/50 flex-wrap">
                    {(['color', 'sound', 'song', 'glyph', 'emoji'] as Mode[]).map(m => (
                        <button key={m} onClick={() => { playSound(audioService.playToggle); setMode(m); resetState(); }} className={`flex-1 min-w-[90px] py-2 px-1 text-xs font-press-start border-2 transition-colors ${mode === m ? 'bg-brand-yellow text-black border-black' : 'bg-surface-primary border-transparent text-text-primary hover:bg-brand-cyan/20'}`}>
                            {t(`offlineAiPage.imageTransformer.mode${m.charAt(0).toUpperCase() + m.slice(1)}`)}
                        </button>
                    ))}
                 </div>
                 <div className="w-full h-auto aspect-square bg-black/50 border-4 border-brand-light flex items-center justify-center shadow-pixel p-2">
                    {!uploadedFile ? ( <button onClick={handleUploadClick} className="flex flex-col items-center justify-center gap-3 p-4 text-white transition-opacity hover:opacity-80"><UploadIcon className="w-12 h-12" /><span className="font-press-start">{t('offlineAiPage.imageTransformer.uploadImage')}</span></button>
                    ) : ( <img src={previewUrl!} alt="Preview" className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} /> )}
                 </div>
                 {uploadedFile && (
                    <div className="w-full space-y-4">
                        <button onClick={handleUploadClick} onMouseEnter={() => playSound(audioService.playHover)} className="text-sm underline hover:text-brand-yellow transition-colors">{t('offlineAiPage.imageTransformer.changeImage')}</button>
                        <button onClick={handleGenerate} disabled={isLoading} className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed">
                            <SparklesIcon className="w-6 h-6" />{isLoading ? t('offlineAiPage.imageTransformer.loading') : t('offlineAiPage.imageTransformer.button')}
                        </button>
                    </div>
                 )}
                 <div className="w-full min-h-[8rem] p-4 bg-black/50 border-4 border-brand-light flex flex-col items-center justify-center">
                    {isLoading && <LoadingSpinner text={t('offlineAiPage.imageTransformer.thinking')} />}
                    {error && <div role="alert" className="w-full p-4 text-center"><h3 className="font-press-start text-lg text-brand-magenta">{t('offlineAiPage.error')}</h3><p className="font-sans text-xs mt-2 break-words text-brand-light/70">{error}</p></div>}
                    
                    {generatedSound && !isLoading && mode === 'sound' && ( <div className="w-full space-y-4 text-center"><h3 className="font-press-start text-lg text-brand-cyan">{t('offlineAiPage.imageTransformer.soundSuccess')}</h3><div className="flex gap-4"><button onClick={() => audioService.playSoundFromParams(generatedSound)} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-cyan text-black border-2 border-brand-light shadow-sm hover:bg-brand-yellow"><PlayIcon className="w-5 h-5"/>{t('offlineAiPage.imageTransformer.playAgain')}</button><button onClick={handleDownload} disabled={isDownloading} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-yellow text-black border-2 border-brand-light shadow-sm hover:bg-brand-magenta hover:text-white disabled:bg-gray-500"><DownloadIcon className="w-5 h-5"/>{isDownloading ? '...' : t('offlineAiPage.download')}</button></div></div> )}
                    {generatedSong && !isLoading && mode === 'song' && ( <div className="w-full space-y-4 text-center"><h3 className="font-press-start text-lg text-brand-cyan">{t('offlineAiPage.imageTransformer.songSuccess')}</h3><AudioVisualizer /><div className="flex gap-4"><button onClick={handlePlaybackToggle} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-cyan text-black border-2 border-brand-light shadow-sm hover:bg-brand-yellow">{isPlayingSong ? <StopIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>}{isPlayingSong ? t('offlineAiPage.stop') : t('offlineAiPage.imageTransformer.playSong')}</button><button onClick={handleDownload} disabled={isDownloading} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-yellow text-black border-2 border-brand-light shadow-sm hover:bg-brand-magenta hover:text-white disabled:bg-gray-500"><DownloadIcon className="w-5 h-5"/>{isDownloading ? '...' : t('offlineAiPage.download')}</button></div></div> )}
                    {generatedCode && !isLoading && mode === 'glyph' && ( <div className="w-full relative"><h3 className="text-center font-press-start text-lg text-brand-cyan mb-3">{t('offlineAiPage.imageTransformer.glyphResult')}</h3><pre className="bg-black text-brand-lime font-mono text-[10px] leading-tight p-2 border border-brand-light/50 overflow-x-auto whitespace-pre"><code>{generatedCode}</code></pre><div className="flex gap-2 mt-2"><button onClick={() => handleCopy(generatedCode)} className="flex-1 flex items-center justify-center gap-2 p-2 bg-brand-cyan text-black border-2 border-black">{isCopied ? t('offlineAiPage.imageTransformer.copied') : t('offlineAiPage.imageTransformer.copy')}</button><button onClick={handleDownload} disabled={isDownloading} className="flex-1 flex items-center justify-center gap-2 p-2 bg-brand-yellow text-black border-2 border-black">{isDownloading ? '...' : t('offlineAiPage.download')}</button></div></div> )}
                    {generatedEmojiArt && !isLoading && mode === 'emoji' && ( <div className="w-full relative"><h3 className="text-center font-press-start text-lg text-brand-cyan mb-3">{t('offlineAiPage.imageTransformer.emojiResult')}</h3><pre className="bg-black text-lg p-2 border border-brand-light/50 overflow-x-auto whitespace-pre leading-tight"><code>{generatedEmojiArt}</code></pre><div className="flex gap-2 mt-2"><button onClick={() => handleCopy(generatedEmojiArt)} className="flex-1 flex items-center justify-center gap-2 p-2 bg-brand-cyan text-black border-2 border-black">{isCopied ? t('offlineAiPage.imageTransformer.copied') : t('offlineAiPage.imageTransformer.copy')}</button><button onClick={handleDownload} disabled={isDownloading} className="flex-1 flex items-center justify-center gap-2 p-2 bg-brand-yellow text-black border-2 border-black">{isDownloading ? '...' : t('offlineAiPage.download')}</button></div></div> )}
                    {localPalette && !isLoading && mode === 'color' && ( <div className="w-full"><h3 className="text-center font-press-start text-lg text-brand-cyan mb-3">{t('offlineAiPage.imageTransformer.colorResult')}</h3><div className="grid grid-cols-5 sm:grid-cols-8 gap-2 max-h-80 overflow-y-auto pr-2">{(localPalette as LocalColorResult[]).map((color) => (<div key={color.hex} className="flex flex-col items-center gap-1 group"><div className="w-full aspect-square border-2 border-brand-light/50" style={{ backgroundColor: color.hex }}></div><button onClick={() => handleCopyColor(color.hex)} className="w-full text-center group-hover:text-brand-yellow" title={`Copy ${color.hex}`}><p className="font-mono text-[10px] truncate">{copiedHex === color.hex ? t('offlineAiPage.imageTransformer.copied') : color.hex}</p></button></div>))}</div></div>)}
                 </div>
            </main>
        </PageWrapper>
    );
};

const ContentDetectorTool = ({ playSound, t, onClose, addCredits }: OfflineToolProps) => {
    const [inputText, setInputText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState<{ aiLikelihood: number, humanLikeness: number, details: { label: string, value: string }[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if(selectedFile) { setFile(selectedFile); setInputText(''); setResult(null); }
    };

    const handleAnalyze = () => {
        if (!inputText && !file) return;
        setIsLoading(true); playSound(audioService.playGenerate); setResult(null);
        setTimeout(async () => {
            let aiLikelihood = 0; let humanLikeness = 100; const details: { label: string, value: string }[] = [];
            if (inputText) {
                const words = inputText.trim().split(/\s+/).filter(w => w.length > 0);
                const sentences = inputText.trim().split(/[.!?]+/).filter(s => s.length > 0);
                const wordCount = words.length;
                const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
                const repetition = wordCount > 0 ? (1 - (uniqueWords / wordCount)) * 100 : 0;
                const avgSentenceLength = wordCount > 0 && sentences.length > 0 ? wordCount / sentences.length : 0;
                
                aiLikelihood += repetition * 1.5;
                if (avgSentenceLength > 15 && avgSentenceLength < 25) aiLikelihood += 20;
                humanLikeness = 100 - (repetition * 1.2);

                details.push({ label: t('offlineAiPage.detector.textComplexity'), value: `${avgSentenceLength.toFixed(1)} words/sentence` });
                details.push({ label: t('offlineAiPage.detector.textRepetition'), value: `${repetition.toFixed(1)}%` });
            } else if (file) {
                 aiLikelihood = Math.random() * 40;
                 humanLikeness = 60 + Math.random() * 40;
                 details.push({label: 'File Type', value: file.type});
                 if (file.type.startsWith('image/')) details.push({label: t('offlineAiPage.detector.imageMetadata'), value: 'Minimal (Heuristic)'});
                 if (file.type.startsWith('audio/')) {
                     details.push({label: t('offlineAiPage.detector.audioClipping'), value: `${(Math.random() * 2).toFixed(2)}%`});
                     details.push({label: t('offlineAiPage.detector.audioDynamics'), value: `${(Math.random() * 10 + 5).toFixed(1)} dB`});
                 }
            }
            setResult({ aiLikelihood: Math.min(99, aiLikelihood), humanLikeness: Math.max(1, humanLikeness), details });
            setIsLoading(false); playSound(audioService.playSuccess); 
// FIX: Await the async addCredits call.
        await addCredits(5);
        }, 1500);
    };

    return (
        <PageWrapper>
             <PageHeader title={t('offlineAiPage.hub.detector.name')} onBack={onClose} />
             <main className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                 <p className="text-sm text-center text-brand-light/80">{t('offlineAiPage.detector.description')}</p>
                 <div className="w-full flex flex-col gap-4 bg-black/40 p-4 border-4 border-brand-light shadow-pixel">
                    <textarea value={inputText} onChange={(e) => { setInputText(e.target.value); if(file) setFile(null); setResult(null); }} placeholder={t('offlineAiPage.detector.pasteText')} className="w-full h-32 p-2 bg-brand-light text-black resize-y" disabled={isLoading || !!file} />
                    <div className="flex items-center gap-2"><hr className="flex-grow border-brand-light/50" /><span className="text-xs text-brand-light/80">OR</span><hr className="flex-grow border-brand-light/50" /></div>
                    {!file ? ( <button onClick={() => fileInputRef.current?.click()} disabled={isLoading || !!inputText.trim()} className="w-full p-3 bg-surface-primary border-2 border-border-secondary flex items-center justify-center gap-2 hover:bg-brand-cyan/20 disabled:opacity-50"><UploadIcon className="w-5 h-5" /> {t('offlineAiPage.detector.upload')}</button>
                    ) : ( <div className="p-2 bg-black/50 border border-brand-light/50"><p className="text-xs truncate">{file.name}</p><button onClick={() => { setFile(null); setResult(null); }} className="text-xs underline hover:text-brand-yellow mt-1">{t('offlineAiPage.detector.changeFile')}</button></div>)}
                    <button onClick={handleAnalyze} disabled={(!inputText.trim() && !file) || isLoading} className="w-full flex items-center justify-center gap-3 p-3 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel disabled:bg-gray-500"><SparklesIcon className="w-6 h-6" /> {isLoading ? t('offlineAiPage.detector.analyzing') : t('offlineAiPage.detector.analyze')}</button>
                 </div>
                 <div className="w-full min-h-[10rem] p-4 bg-black/50 border-4 border-brand-light flex flex-col items-center justify-center">
                    {isLoading && <LoadingSpinner text={t('offlineAiPage.detector.analyzing')} />}
                    {result && (
                        <div className="w-full text-center space-y-3">
                            <h3 className="font-press-start text-lg text-brand-cyan">{t('offlineAiPage.detector.resultTitle')}</h3>
                            <div className="space-y-2"><label className="text-xs font-press-start">{t('offlineAiPage.detector.aiLikelihood')}</label><div className="w-full bg-black/50 h-6 border-2 border-brand-light"><div className="h-full bg-brand-magenta" style={{width: `${result.aiLikelihood}%`}}></div></div><span className="text-sm font-press-start">{result.aiLikelihood.toFixed(0)}%</span></div>
                            <div className="space-y-2"><label className="text-xs font-press-start">{t('offlineAiPage.detector.humanLikeness')}</label><div className="w-full bg-black/50 h-6 border-2 border-brand-light"><div className="h-full bg-brand-lime" style={{width: `${result.humanLikeness}%`}}></div></div><span className="text-sm font-press-start">{result.humanLikeness.toFixed(0)}%</span></div>
                            <div className="text-left text-xs bg-black/20 p-2 border border-brand-light/50 mt-4"><p className="font-press-start text-brand-cyan mb-1">{t('offlineAiPage.detector.analysisDetails')}</p>{result.details.map(d => <div key={d.label}>{d.label}: {d.value}</div>)}</div>
                        </div>
                    )}
                 </div>
             </main>
        </PageWrapper>
    );
};

const TextToArtTool = ({ playSound, t, onClose, addCredits }: OfflineToolProps) => {
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleGenerate = () => {
        if (!text.trim()) return;
        setIsLoading(true); playSound(audioService.playGenerate); setGeneratedImage(null);
        setTimeout(async () => {
            const canvas = canvasRef.current;
            if (!canvas) { setIsLoading(false); return; }
            const ctx = canvas.getContext('2d');
            if (!ctx) { setIsLoading(false); return; }
            
            const seed = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const rng = (s: number) => () => { s = Math.sin(s) * 10000; return s - Math.floor(s); };
            const random = rng(seed);

            ctx.fillStyle = `hsl(${random() * 360}, 20%, 10%)`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const shapes = Math.floor(random() * 50) + 20;
            for (let i = 0; i < shapes; i++) {
                ctx.fillStyle = `hsla(${random() * 360}, ${50 + random() * 50}%, ${40 + random() * 40}%, ${0.2 + random() * 0.5})`;
                const x = random() * canvas.width;
                const y = random() * canvas.height;
                const size = random() * 100 + 10;
                if (random() > 0.5) {
                    ctx.fillRect(x - size/2, y - size/2, size, size);
                } else {
                    ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2); ctx.fill();
                }
            }
            setGeneratedImage(canvas.toDataURL('image/png'));
            setIsLoading(false); playSound(audioService.playSuccess); 
// FIX: Await the async addCredits call.
        await addCredits(5);
        }, 500);
    };

    const handleDownload = () => { if(!generatedImage) return; playSound(audioService.playDownload); const a = document.createElement('a'); a.href = generatedImage; a.download = 'generative-art.png'; a.click(); };

    return (
        <PageWrapper>
             <PageHeader title={t('offlineAiPage.hub.textToImage.name')} onBack={onClose} />
             <main className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                <canvas ref={canvasRef} width="512" height="512" className="hidden"></canvas>
                <p className="text-sm text-center text-brand-light/80">{t('offlineAiPage.textToImage.description')}</p>
                <div className="w-full flex flex-col gap-4 bg-black/40 p-4 border-4 border-brand-light shadow-pixel">
                    <label htmlFor="text-seed" className="text-xs font-press-start text-brand-cyan">{t('offlineAiPage.textToImage.inputLabel')}</label>
                    <input type="text" id="text-seed" value={text} onChange={e => setText(e.target.value)} placeholder={t('offlineAiPage.textToImage.inputPlaceholder')} className="w-full p-2 bg-brand-light text-black" disabled={isLoading} />
                    <button onClick={handleGenerate} disabled={!text.trim() || isLoading} className="w-full flex items-center justify-center gap-3 p-3 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel disabled:bg-gray-500"><SparklesIcon className="w-6 h-6" />{isLoading ? t('offlineAiPage.textToImage.generating') : t('offlineAiPage.textToImage.generate')}</button>
                </div>
                 <div className="w-full min-h-[10rem] p-4 bg-black/50 border-4 border-brand-light flex flex-col items-center justify-center">
                    {isLoading && <LoadingSpinner text={t('offlineAiPage.textToImage.generating')} />}
                    {generatedImage && !isLoading && (
                        <div className="w-full space-y-4">
                            <img src={generatedImage} alt="Generated abstract art" className="w-full aspect-square object-contain border-2 border-brand-light" />
                            <button onClick={handleDownload} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-yellow text-black border-2 border-brand-light shadow-sm"><DownloadIcon className="w-5 h-5"/>{t('offlineAiPage.textToImage.download')}</button>
                        </div>
                    )}
                 </div>
             </main>
        </PageWrapper>
    );
};

const AiVoiceAdjuster = ({ playSound, t, onClose, addCredits }: OfflineToolProps) => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [processedAudio, setProcessedAudio] = useState<AudioBuffer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [intensity, setIntensity] = useState(50);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    const stopPlayback = useCallback(() => { if (activeAudioSourceRef.current) { try { activeAudioSourceRef.current.stop(); } catch (e) {} activeAudioSourceRef.current = null; } setIsPlaying(false); }, []);
    useEffect(() => { return stopPlayback; }, [stopPlayback]);
    
    const resetState = useCallback((clearFile: boolean = false) => {
        setError(null); setProcessedAudio(null); stopPlayback();
        if (clearFile) { setUploadedFile(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; }
    }, [previewUrl, stopPlayback]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || (!file.type.startsWith('audio/') && !file.type.startsWith('video/'))) { setError(t('offlineAiPage.aiVoiceAdjuster.errorSelectMedia')); playSound(audioService.playError); return; }
        resetState(true); setUploadedFile(file); setPreviewUrl(URL.createObjectURL(file)); playSound(audioService.playSelection);
    };

    const handleTransform = useCallback(async () => {
        if (!uploadedFile || isLoading) return;
        resetState(); playSound(audioService.playGenerate); setIsLoading(true);
        try {
            const audioBuffer = await audioService.applyAiVoiceEffect(uploadedFile, intensity / 100);
            setProcessedAudio(audioBuffer);
            playSound(audioService.playSuccess);
            
// FIX: Await the async addCredits call.
        await addCredits(15);
        } catch (err) { setError(err instanceof Error ? err.message : "Failed to transform audio."); playSound(audioService.playError); } finally { setIsLoading(false); }
    }, [uploadedFile, isLoading, intensity, playSound, resetState, addCredits]);

    const handlePlaybackToggle = useCallback(() => {
        playSound(audioService.playClick);
        if (isPlaying) { stopPlayback(); } else if (processedAudio) { const source = audioService.playAudioBuffer(processedAudio); activeAudioSourceRef.current = source; setIsPlaying(true); source.onended = () => { setIsPlaying(false); activeAudioSourceRef.current = null; }; }
    }, [isPlaying, processedAudio, playSound, stopPlayback]);

    const handleDownload = useCallback(async () => {
        if (!processedAudio || isDownloading) return;
        playSound(audioService.playDownload); setIsDownloading(true);
        try {
            const wavBlob = audioService.bufferToWav(processedAudio); const url = URL.createObjectURL(wavBlob); const a = document.createElement('a'); a.href = url; const fileName = uploadedFile?.name.split('.').slice(0, -1).join('.') || 'ai-voice'; a.download = `${fileName}-aivoice.wav`; document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); document.body.removeChild(a);
        } catch (err) { setError('Failed to create WAV file.'); playSound(audioService.playError); } finally { setIsDownloading(false); }
    }, [processedAudio, isDownloading, playSound, uploadedFile?.name]);
    
    return (
        <PageWrapper>
            <PageHeader title={t('offlineAiPage.aiVoiceAdjuster.title')} onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*,video/*" className="hidden" />
                <p className="text-sm text-center text-brand-light/80">{t('offlineAiPage.aiVoiceAdjuster.description')}</p>
                {!uploadedFile ? (
                    <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel"><UploadIcon className="w-6 h-6" /> {t('offlineAiPage.aiVoiceAdjuster.uploadMedia')}</button>
                ) : (
                    <div className="w-full space-y-4">
                        <div className="bg-black/40 p-4 border-2 border-brand-light/50">
                            <h3 className="font-press-start text-brand-cyan">{t('offlineAiPage.aiVoiceAdjuster.sourceMedia')}:</h3>
                            {uploadedFile.type.startsWith('video/') ? ( <video src={previewUrl!} controls className="w-full max-h-60 border-2 border-brand-light object-contain bg-black mt-2" />
                            ) : ( <audio src={previewUrl!} controls className="w-full mt-2" /> )}
                            <button onClick={() => fileInputRef.current?.click()} className="text-sm underline hover:text-brand-yellow mt-2">{t('offlineAiPage.aiVoiceAdjuster.changeFile')}</button>
                        </div>
                        <div className="bg-black/40 p-4 border-2 border-brand-light/50 space-y-4">
                            <h3 className="font-press-start text-brand-cyan">{t('offlineAiPage.aiVoiceAdjuster.controlsTitle')}</h3>
                            <div>
                                <label htmlFor="intensity-slider" className="text-xs font-press-start text-brand-light/80 flex justify-between"><span>{t('offlineAiPage.aiVoiceAdjuster.intensity')}</span><span>{intensity}%</span></label>
                                <input id="intensity-slider" type="range" min="0" max="100" value={intensity} onChange={e => setIntensity(Number(e.target.value))} className="w-full" disabled={isLoading} />
                            </div>
                        </div>
                        <button onClick={handleTransform} disabled={isLoading} className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel disabled:bg-gray-500"><SparklesIcon className="w-6 h-6" /> {isLoading ? t('offlineAiPage.aiVoiceAdjuster.transforming') : t('offlineAiPage.aiVoiceAdjuster.transform')}</button>
                    </div>
                )}
                 <div className="w-full min-h-[8rem] p-4 bg-black/50 border-4 border-brand-light flex flex-col items-center justify-center">
                    {isLoading && <LoadingSpinner text={t('offlineAiPage.aiVoiceAdjuster.transforming')} />}
                    {error && <div role="alert" className="text-center text-brand-magenta"><p className="font-press-start">Error</p><p className="text-sm mt-2">{error}</p></div>}
                    {processedAudio && !isLoading && (
                        <div className="w-full space-y-4">
                             <h3 className="font-press-start text-lg text-brand-cyan text-center">{t('offlineAiPage.aiVoiceAdjuster.resultTitle')}</h3>
                             <div className="flex gap-4">
                                <button onClick={handlePlaybackToggle} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-cyan text-black border-2 border-brand-light shadow-sm">{isPlaying ? <StopIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>} {isPlaying ? t('offlineAiPage.stop') : t('offlineAiPage.play')}</button>
                                <button onClick={handleDownload} disabled={isDownloading} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-yellow text-black border-2 border-brand-light shadow-sm disabled:bg-gray-500"><DownloadIcon className="w-5 h-5"/> {isDownloading ? '...' : t('offlineAiPage.download')}</button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </PageWrapper>
    );
};

// FIX: Add and export the OfflineAiPage component.
interface OfflineAiPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
}

type ActiveTool = 'hub' | 'chiptune' | 'reverser' | 'midi' | 'analyzer' | 'imagelab' | 'detector' | 'texttoart' | 'voiceadjuster' | 'audioToImage' | 'localtts' | 'localsst';

const ToolButton: React.FC<{ icon: React.ReactNode; title: string; description: string; onClick?: () => void; disabled?: boolean; beta?: boolean; }> = ({ icon, title, description, onClick, disabled, beta }) => (
    <div className="relative group h-full">
        <button
            onClick={onClick}
            disabled={disabled}
            className="w-full h-full flex items-start text-left gap-4 p-4 bg-black/40 border-4 border-brand-light shadow-pixel transition-all hover:bg-brand-cyan/20 hover:border-brand-yellow hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_#f0f0f0] active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Open ${title}`}
        >
            <div className="flex-shrink-0 w-16 h-16 text-brand-cyan">{icon}</div>
            <div className="font-sans">
                <h3 className="font-press-start text-base md:text-lg text-brand-yellow">{title}</h3>
                <p className="text-xs text-brand-light/80 mt-1">{description}</p>
            </div>
        </button>
         {beta && (
            <div className="absolute top-2 right-2 bg-brand-magenta text-white text-[8px] font-press-start px-1 border border-black pointer-events-none" aria-hidden="true">BETA</div>
        )}
    </div>
);

export const OfflineAiPage: React.FC<OfflineAiPageProps> = ({ onClose, playSound }) => {
    const { t } = useLanguage();
    const [activeTool, setActiveTool] = useState<ActiveTool>('hub');
    const { addCredits } = useCredits();

    const handleLaunch = (tool: ActiveTool) => {
        playSound(audioService.playClick);
        setActiveTool(tool);
    };
    
    const commonProps = {
        playSound,
        t,
        onClose: () => setActiveTool('hub'),
        addCredits,
    };

    if (activeTool === 'chiptune') return <ChiptuneCreator {...commonProps} />;
    if (activeTool === 'reverser') return <AudioReverserTool {...commonProps} />;
    if (activeTool === 'midi') return <AudioToMidiTool {...commonProps} />;
    if (activeTool === 'analyzer') return <AudioAnalyzerTool {...commonProps} />;
    if (activeTool === 'imagelab') return <ImageLab {...commonProps} />;
    if (activeTool === 'detector') return <ContentDetectorTool {...commonProps} />;
    if (activeTool === 'texttoart') return <TextToArtTool {...commonProps} />;
    if (activeTool === 'voiceadjuster') return <AiVoiceAdjuster {...commonProps} />;
    if (activeTool === 'audioToImage') return <AudioToImagePage onClose={() => setActiveTool('hub')} playSound={playSound} />;
    if (activeTool === 'localtts') return <LocalTextToSpeechPage onClose={() => setActiveTool('hub')} playSound={playSound} />;
    if (activeTool === 'localsst') return <LocalSpeechToTextPage onClose={() => setActiveTool('hub')} playSound={playSound} />;


    const tools = [
        { id: 'chiptune', icon: <AudioTransformIcon />, nameKey: 'offlineAiPage.hub.chiptune.name', descKey: 'offlineAiPage.hub.chiptune.description' },
        { id: 'reverser', icon: <ReverseIcon />, nameKey: 'offlineAiPage.hub.reverser.name', descKey: 'offlineAiPage.hub.reverser.description' },
        { id: 'midi', icon: <MusicKeyboardIcon />, nameKey: 'offlineAiPage.hub.midi.name', descKey: 'offlineAiPage.hub.midi.description', beta: true },
        { id: 'analyzer', icon: <SoundWaveIcon />, nameKey: 'offlineAiPage.hub.analyzer.name', descKey: 'offlineAiPage.hub.analyzer.description' },
        { id: 'imagelab', icon: <ImageSoundIcon />, nameKey: 'offlineAiPage.imageLab.title', descKey: 'offlineAiPage.imageLab.description' },
        { id: 'detector', icon: <AiDetectorIcon />, nameKey: 'offlineAiPage.hub.detector.name', descKey: 'offlineAiPage.hub.detector.description' },
        { id: 'texttoart', icon: <SparklesIcon />, nameKey: 'offlineAiPage.hub.textToImage.name', descKey: 'offlineAiPage.hub.textToImage.description' },
        { id: 'voiceadjuster', icon: <VoiceChangerIcon />, nameKey: 'offlineAiPage.aiVoiceAdjuster.title', descKey: 'offlineAiPage.aiVoiceAdjuster.description', beta: true },
        { id: 'audioToImage', icon: <AudioToImageIcon />, nameKey: 'offlineAiPage.hub.audioToImage.name', descKey: 'offlineAiPage.hub.audioToImage.description' },
        { id: 'localtts', icon: <TextToSpeechIcon />, nameKey: 'offlineAiPage.hub.localtts.name', descKey: 'offlineAiPage.hub.localtts.description' },
        { id: 'localsst', icon: <MicrophoneIcon />, nameKey: 'offlineAiPage.hub.localsst.name', descKey: 'offlineAiPage.hub.localsst.description' },
    ];

    return (
        <PageWrapper>
            <PageHeader title={t('offlineAiPage.title')} onBack={onClose} />
            <main id="main-content" className="w-full max-w-4xl flex-grow overflow-y-auto px-2 pb-8 space-y-6">
                <p className="text-center font-sans text-sm text-text-secondary">{t('offlineAiPage.hub.description')}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tools.map(tool => (
                        <ToolButton 
                            key={tool.id}
                            icon={tool.icon}
                            title={t(tool.nameKey)}
                            description={t(tool.descKey)}
                            onClick={() => handleLaunch(tool.id as ActiveTool)}
                            beta={tool.beta}
                        />
                    ))}
                </div>
            </main>
        </PageWrapper>
    );
};
