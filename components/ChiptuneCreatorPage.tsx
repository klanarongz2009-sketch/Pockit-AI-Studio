import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as audioService from '../services/audioService';
import { PageHeader, PageWrapper } from './PageComponents';
import { UploadIcon } from './icons/UploadIcon';
import { LoadingSpinner } from './LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { PlayIcon } from './icons/PlayIcon';
import { StopIcon } from './icons/StopIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { useLanguage } from '../contexts/LanguageContext';

interface ChiptuneCreatorPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
}

export const ChiptuneCreatorPage: React.FC<ChiptuneCreatorPageProps> = ({ onClose, playSound }) => {
    const { t } = useLanguage();
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [processedAudio, setProcessedAudio] = useState<AudioBuffer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Effect parameters
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

    useEffect(() => {
        return stopPlayback; // Cleanup on unmount
    }, [stopPlayback]);
    
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
            setError(t('chiptuneCreator.errorSelectMedia'));
            playSound(audioService.playError);
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
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*,video/*" className="hidden" />
            <PageHeader title={t('chiptuneCreator.title')} onBack={onClose} />
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
                        <p className="font-press-start text-xl text-brand-yellow mt-4">Drop your file here</p>
                    </div>
                )}
                <p className="text-sm text-center text-brand-light/80">
                    {t('chiptuneCreator.description')}
                </p>

                {!uploadedFile ? (
                    <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel">
                        <UploadIcon className="w-6 h-6" /> {t('chiptuneCreator.uploadMedia')}
                    </button>
                ) : (
                    <div className="w-full space-y-4">
                        <div className="bg-black/40 p-4 border-2 border-brand-light/50">
                            <h3 className="font-press-start text-brand-cyan">{t('chiptuneCreator.sourceMedia')}:</h3>
                            {uploadedFile.type.startsWith('video/') ? (
                                <video src={previewUrl!} controls className="w-full max-h-60 border-2 border-brand-light object-contain bg-black mt-2" />
                            ) : (
                                <audio src={previewUrl!} controls className="w-full mt-2" />
                            )}
                            <button onClick={() => fileInputRef.current?.click()} className="text-sm underline hover:text-brand-yellow mt-2">{t('chiptuneCreator.changeFile')}</button>
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
            </main>
        </PageWrapper>
    );
};