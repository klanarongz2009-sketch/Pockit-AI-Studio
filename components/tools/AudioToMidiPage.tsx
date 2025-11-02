import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PageWrapper, PageHeader } from '../PageComponents';
import * as audioService from '../../services/audioService';
import { UploadIcon } from '../icons/UploadIcon';
import { LoadingSpinner } from '../LoadingSpinner';
import { PlayIcon } from '../icons/PlayIcon';
import { StopIcon } from '../icons/StopIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import type { MidiNote } from '../../services/geminiService';

interface AudioToMidiPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
}

export const AudioToMidiPage: React.FC<AudioToMidiPageProps> = ({ onClose, playSound }) => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [processedMidi, setProcessedMidi] = useState<MidiNote[] | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const stopPlayback = useCallback(() => {
        audioService.stopMidi();
        setIsPlaying(false);
    }, []);

    useEffect(() => stopPlayback, [stopPlayback]);

    const resetState = (clearFile: boolean = false) => {
        setError(null);
        setProcessedMidi(null);
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
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const arrayBuffer = await uploadedFile.arrayBuffer();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            const midiNotes = await audioService.analyzeAudioBufferToMidi(audioBuffer);
            if(midiNotes.length === 0) {
                throw new Error("Could not detect any clear melodic notes in the audio.");
            }
            setProcessedMidi(midiNotes);
            playSound(audioService.playSuccess);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to process audio.");
            playSound(audioService.playError);
        } finally {
            setIsLoading(false);
        }
    }, [uploadedFile, isLoading, playSound, resetState]);

    const handlePlaybackToggle = useCallback(() => {
        playSound(audioService.playClick);
        if (isPlaying) {
            stopPlayback();
        } else if (processedMidi) {
            setIsPlaying(true);
            audioService.playMidi(processedMidi, () => setIsPlaying(false));
        }
    }, [isPlaying, processedMidi, playSound, stopPlayback]);
    
    const handleDownload = useCallback(async () => {
        if (!processedMidi || isDownloading) return;
        playSound(audioService.playDownload);
        setIsDownloading(true);
        try {
            const wavBlob = await audioService.exportMidiToWav(processedMidi);
            if(!wavBlob) throw new Error("Could not generate WAV file.");
            const url = URL.createObjectURL(wavBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `midi_${uploadedFile?.name.split('.').slice(0, -1).join('.')}.wav`;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create WAV file.');
            playSound(audioService.playError);
        } finally {
            setIsDownloading(false);
        }
    }, [processedMidi, isDownloading, playSound, uploadedFile?.name]);
    
    return (
        <PageWrapper>
            <input type="file" ref={fileInputRef} onChange={(e) => processFile(e.target.files?.[0])} accept="audio/*,video/*" className="hidden" />
            <PageHeader title="Audio to MIDI (Offline)" onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                <p className="text-sm text-center text-text-secondary">Upload an audio/video to analyze and convert its chords and melody into MIDI notes, without using AI (Polyphonic).</p>
                {!uploadedFile ? (
                    <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-border-primary shadow-pixel">
                        <UploadIcon className="w-6 h-6" /> Upload Media
                    </button>
                ) : (
                    <div className="w-full space-y-4">
                        <div className="bg-black/40 p-4 border-2 border-brand-light/50">
                            <audio src={previewUrl!} controls className="w-full" />
                            <button onClick={() => fileInputRef.current?.click()} className="text-sm underline hover:text-brand-yellow mt-2">Change File</button>
                        </div>
                        <button onClick={handleTransform} disabled={isLoading} className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-border-primary shadow-pixel disabled:bg-gray-500">
                            <SparklesIcon className="w-6 h-6" /> {isLoading ? 'Converting...' : 'Convert to MIDI'}
                        </button>
                    </div>
                )}
                <div className="w-full min-h-[8rem] p-4 bg-surface-1 border-4 border-border-primary flex flex-col items-center justify-center">
                    {isLoading && <LoadingSpinner text="Analyzing frequencies..." />}
                    {error && <p className="text-brand-accent">{error}</p>}
                    {processedMidi && !isLoading && (
                        <div className="w-full space-y-4">
                            <h3 className="font-press-start text-lg text-brand-cyan text-center">Result: {processedMidi.length} notes found</h3>
                            <div className="flex gap-4">
                                <button onClick={handlePlaybackToggle} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-cyan text-black border-2 border-brand-light">
                                    {isPlaying ? <StopIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>} {isPlaying ? 'Stop' : 'Play MIDI'}
                                </button>
                                <button onClick={handleDownload} disabled={isDownloading} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-yellow text-black border-2 border-brand-light disabled:bg-gray-500">
                                    <DownloadIcon className="w-5 h-5"/> {isDownloading ? '...' : 'Download (.wav)'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </PageWrapper>
    );
};
