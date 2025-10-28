import React, { useState, useRef, useCallback } from 'react';
import { PageWrapper, PageHeader } from './PageComponents';
import * as audioService from '../services/audioService';
import { UploadIcon } from './icons/UploadIcon';
import { LoadingSpinner } from './LoadingSpinner';
import { DownloadIcon } from './icons/DownloadIcon';

interface AudioToImagePageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
}

export const AudioToImagePage: React.FC<AudioToImagePageProps> = ({ onClose, playSound }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [waveformImage, setWaveformImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = useCallback(async (selectedFile: File | undefined) => {
        if (!selectedFile) return;
        if (!selectedFile.type.startsWith('audio/')) {
            setError('Please select an audio file.');
            playSound(audioService.playError);
            return;
        }
        
        setError(null);
        setWaveformImage(null);
        setFile(selectedFile);
        setIsLoading(true);
        playSound(audioService.playGenerate);

        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            const imageUrl = await audioService.createWaveformImage(audioBuffer);
            setWaveformImage(imageUrl);
            playSound(audioService.playSuccess);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process audio file.');
            playSound(audioService.playError);
        } finally {
            setIsLoading(false);
        }
    }, [playSound]);

    const handleDownload = () => {
        if (!waveformImage || !file) return;
        playSound(audioService.playDownload);
        const a = document.createElement('a');
        a.href = waveformImage;
        a.download = `${file.name.split('.').slice(0, -1).join('.')}_waveform.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <PageWrapper>
            <PageHeader title="Audio to Waveform" onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                <input type="file" ref={fileInputRef} onChange={(e) => processFile(e.target.files?.[0])} accept="audio/*" className="hidden" />
                <p className="text-sm text-center text-text-secondary">Upload an audio file to generate a visual waveform image. This process happens entirely in your browser.</p>
                
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-border-primary shadow-pixel text-base"
                >
                    <UploadIcon className="w-6 h-6" /> {file ? 'Change Audio File' : 'Upload Audio File'}
                </button>

                {file && <p className="text-sm text-brand-cyan">Selected: {file.name}</p>}

                <div className="w-full h-64 bg-surface-1 border-4 border-border-primary flex items-center justify-center p-2">
                    {isLoading ? <LoadingSpinner text="Generating Waveform..." /> :
                     error ? <div className="text-center text-brand-accent p-4">{error}</div> :
                     waveformImage ? <img src={waveformImage} alt="Audio waveform" className="w-full h-full object-contain" /> :
                     <p className="text-text-secondary">Your waveform will appear here</p>
                    }
                </div>

                {waveformImage && !isLoading && (
                    <button onClick={handleDownload} className="w-full flex items-center justify-center gap-3 p-4 bg-brand-yellow text-black border-4 border-border-primary shadow-pixel text-base">
                        <DownloadIcon className="w-6 h-6" /> Download Image
                    </button>
                )}
            </main>
        </PageWrapper>
    );
};
