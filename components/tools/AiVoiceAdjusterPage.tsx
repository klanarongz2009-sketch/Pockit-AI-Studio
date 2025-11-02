import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PageWrapper, PageHeader } from '../PageComponents';
import * as audioService from '../../services/audioService';
import { UploadIcon } from '../icons/UploadIcon';
import { LoadingSpinner } from '../LoadingSpinner';
import { PlayIcon } from '../icons/PlayIcon';
import { StopIcon } from '../icons/StopIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { SparklesIcon } from '../icons/SparklesIcon';

interface AiVoiceAdjusterPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
}

export const AiVoiceAdjusterPage: React.FC<AiVoiceAdjusterPageProps> = ({ onClose, playSound }) => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [processedAudio, setProcessedAudio] = useState<AudioBuffer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [intensity, setIntensity] = useState(0.5); // 0.0 to 1.0

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

    const resetState = (clearFile: boolean = false) => {
        setError(null);
        setProcessedAudio(null);
        stopPlayback();
        if (clearFile) {
            setUploadedFile(null);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };
    
    const processFile = (file: File | undefined) => {
        if (!file || (!file.type.startsWith('audio/') && !file.type.startsWith('video/'))) {
            setError("Please select an audio or video file.");
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
            const audioBuffer = await audioService.applyAiVoiceEffect(uploadedFile, intensity);
            setProcessedAudio(audioBuffer);
            playSound(audioService.playSuccess);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to transform audio.");
            playSound(audioService.playError);
        } finally {
            setIsLoading(false);
        }
    }, [uploadedFile, isLoading, intensity, playSound, resetState]);

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
            a.download = `aivoice_${uploadedFile?.name.split('.').slice(0, -1).join('.')}.wav`;
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
        <PageWrapper>
            <input type="file" ref={fileInputRef} onChange={(e) => processFile(e.target.files?.[0])} accept="audio/*,video/*" className="hidden" />
            <PageHeader title="AI Voice Adjuster" onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                <p className="text-sm text-center text-text-secondary">Upload an audio file and use the slider to make your voice more 'AI-like', from original to fully synthetic.</p>
                {!uploadedFile ? (
                    <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-border-primary shadow-pixel">
                        <UploadIcon className="w-6 h-6" /> Upload Audio/Video
                    </button>
                ) : (
                    <div className="w-full space-y-4">
                        <div className="bg-black/40 p-4 border-2 border-brand-light/50">
                            <h3 className="font-press-start text-brand-cyan">Source Media:</h3>
                            <audio src={previewUrl!} controls className="w-full mt-2" />
                            <button onClick={() => fileInputRef.current?.click()} className="text-sm underline hover:text-brand-yellow mt-2">Change File</button>
                        </div>
                        
                        <div className="bg-black/40 p-4 border-2 border-brand-light/50 space-y-4">
                            <h3 className="font-press-start text-brand-cyan">AI-like Quality</h3>
                            <div>
                                <label htmlFor="intensity" className="text-xs font-press-start text-brand-light/80 flex justify-between">
                                    <span>Intensity</span><span>{Math.round(intensity * 100)}%</span>
                                </label>
                                <input id="intensity" type="range" min="0" max="1" step="0.05" value={intensity} onChange={e => setIntensity(Number(e.target.value))} className="w-full" disabled={isLoading} />
                            </div>
                        </div>

                        <button onClick={handleTransform} disabled={isLoading} className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-border-primary shadow-pixel disabled:bg-gray-500">
                            <SparklesIcon className="w-6 h-6" /> {isLoading ? 'Transforming...' : 'Transform Voice'}
                        </button>
                    </div>
                )}
                <div className="w-full min-h-[8rem] p-4 bg-surface-1 border-4 border-border-primary flex flex-col items-center justify-center">
                    {isLoading && <LoadingSpinner text="Transforming voice..." />}
                    {error && <p className="text-brand-accent">{error}</p>}
                    {processedAudio && !isLoading && (
                        <div className="w-full space-y-4">
                            <h3 className="font-press-start text-lg text-brand-cyan text-center">Result:</h3>
                            <div className="flex gap-4">
                                <button onClick={handlePlaybackToggle} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-cyan text-black border-2 border-brand-light">
                                    {isPlaying ? <StopIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>} {isPlaying ? 'Stop' : 'Play'}
                                </button>
                                <button onClick={handleDownload} disabled={isDownloading} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-yellow text-black border-2 border-brand-light disabled:bg-gray-500">
                                    <DownloadIcon className="w-5 h-5"/> {isDownloading ? '...' : 'Download'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </PageWrapper>
    );
};
