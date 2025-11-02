import React, { useState, useRef, useCallback } from 'react';
import { PageWrapper, PageHeader } from '../PageComponents';
import * as audioService from '../../services/audioService';
import { UploadIcon } from '../icons/UploadIcon';
import { LoadingSpinner } from '../LoadingSpinner';
import { AnalyzeIcon } from '../AnalyzeIcon';
import type { LocalAnalysisResult } from '../../services/audioService';

interface AudioAnalyzerPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
}

export const AudioAnalyzerPage: React.FC<AudioAnalyzerPageProps> = ({ onClose, playSound }) => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<LocalAnalysisResult | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = (clearFile: boolean = false) => {
        setError(null);
        setResult(null);
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

    const handleAnalyze = useCallback(async () => {
        if (!uploadedFile || isLoading) return;
        resetState();
        playSound(audioService.playGenerate);
        setIsLoading(true);
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const arrayBuffer = await uploadedFile.arrayBuffer();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            const analysisResult = await audioService.analyzeAudioLocally(audioBuffer);
            setResult(analysisResult);
            playSound(audioService.playSuccess);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to analyze audio.");
            playSound(audioService.playError);
        } finally {
            setIsLoading(false);
        }
    }, [uploadedFile, isLoading, playSound, resetState]);
    
    return (
        <PageWrapper>
            <input type="file" ref={fileInputRef} onChange={(e) => processFile(e.target.files?.[0])} accept="audio/*,video/*" className="hidden" />
            <PageHeader title="Audio Analyzer" onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                <p className="text-sm text-center text-text-secondary">Upload an audio/video file to analyze technical data like loudness, frequency, and duration.</p>
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
                        <button onClick={handleAnalyze} disabled={isLoading} className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-border-primary shadow-pixel disabled:bg-gray-500">
                            <AnalyzeIcon className="w-6 h-6" /> {isLoading ? 'Analyzing...' : 'Analyze Audio'}
                        </button>
                    </div>
                )}
                <div className="w-full min-h-[8rem] p-4 bg-surface-1 border-4 border-border-primary flex flex-col items-center justify-center">
                    {isLoading && <LoadingSpinner text="Analyzing audio..." />}
                    {error && <p className="text-brand-accent">{error}</p>}
                    {result && !isLoading && (
                        <div className="w-full space-y-2">
                            <h3 className="font-press-start text-lg text-brand-cyan text-center mb-4">Analysis Result</h3>
                            {Object.entries(result).map(([key, value]) => (
                                <div key={key} className="flex justify-between text-sm border-b border-brand-light/20 pb-1">
                                    <span className="font-bold text-brand-light/80 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                    <span className="font-mono text-brand-yellow">
                                        {typeof value === 'number' ? value.toFixed(2) : value}
                                        {key.includes('Loudness') ? ' dB' : key.includes('Freq') ? ' Hz' : key.includes('duration') ? ' s' : ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </PageWrapper>
    );
};
