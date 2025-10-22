import React, { useState, useRef, useCallback } from 'react';
import { PageHeader, PageWrapper } from './PageComponents';
import { UploadIcon } from './icons/UploadIcon';
import { LoadingSpinner } from './LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { CopyIcon } from './icons/CopyIcon';
import * as audioService from '../services/audioService';
import * as huggingFaceService from '../services/huggingFaceService';
import { HuggingFaceIcon } from './icons/HuggingFaceIcon';

interface SpeechToTextPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

export const SpeechToTextPage: React.FC<SpeechToTextPageProps> = ({ onClose, playSound, isOnline }) => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [transcribedText, setTranscribedText] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = (clearFile: boolean = false) => {
        setIsLoading(false);
        setError(null);
        setTranscribedText(null);
        if (clearFile) {
            setUploadedFile(null);
            if (filePreview) URL.revokeObjectURL(filePreview);
            setFilePreview(null);
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
        setFilePreview(URL.createObjectURL(file));
        playSound(audioService.playSelection);
    };

    const handleTranscribe = useCallback(async () => {
        if (!uploadedFile || isLoading || !isOnline) return;
        resetState();
        playSound(audioService.playGenerate);
        setIsLoading(true);

        try {
            const text = await huggingFaceService.transcribeAudio(uploadedFile);
            setTranscribedText(text);
            playSound(audioService.playSuccess);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during transcription.');
            playSound(audioService.playError);
        } finally {
            setIsLoading(false);
        }
    }, [uploadedFile, isLoading, isOnline, playSound, resetState]);

    const handleCopy = () => {
        if (!transcribedText) return;
        navigator.clipboard.writeText(transcribedText);
        playSound(audioService.playSelection);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    // Drag and drop handlers
    const handleDragEnter = (e: React.DragEvent<HTMLElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent<HTMLElement>) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    };
    
    return (
        <PageWrapper>
            <input type="file" ref={fileInputRef} onChange={(e) => processFile(e.target.files?.[0])} accept="audio/*,video/*" className="hidden" aria-hidden="true" />
            <PageHeader title="Speech-to-Text (Whisper)" onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-6 font-sans" onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                {isDragging && (
                    <div className="absolute inset-0 bg-black/80 border-4 border-dashed border-brand-yellow z-10 flex flex-col items-center justify-center pointer-events-none">
                        <UploadIcon className="w-12 h-12 text-brand-yellow" />
                        <p className="font-press-start text-xl text-brand-yellow mt-4">Drop your audio/video file</p>
                    </div>
                )}
                <p className="text-sm text-center text-brand-light/80 flex items-center gap-2">
                    Powered by <HuggingFaceIcon className="w-5 h-5 inline-block" /> Hugging Face Whisper
                </p>
                {!uploadedFile ? (
                    <div className="text-center p-4">
                        <p className="text-sm text-brand-light/80 mb-4">
                            Upload an audio or video file and let the AI transcribe the speech into text.
                        </p>
                        <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black">
                            <UploadIcon className="w-6 h-6" /> Upload File
                        </button>
                    </div>
                ) : (
                    <div className="w-full space-y-4">
                        <div className="bg-black/40 p-4 border-2 border-brand-light/50">
                            {uploadedFile.type.startsWith('video/') ? (
                                <video src={filePreview!} controls className="w-full max-h-48 border-2 border-brand-light object-contain bg-black" />
                            ) : (
                                <audio src={filePreview!} controls className="w-full" />
                            )}
                            <button onClick={() => fileInputRef.current?.click()} className="text-sm underline hover:text-brand-yellow mt-2">Change File</button>
                        </div>
                        <button onClick={handleTranscribe} disabled={isLoading || !isOnline} className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel disabled:bg-gray-500">
                            <SparklesIcon className="w-6 h-6" /> {isLoading ? 'Transcribing...' : 'Transcribe Audio'}
                        </button>
                    </div>
                )}
                <div className="w-full min-h-[10rem] p-4 bg-black/50 border-4 border-brand-light flex flex-col items-center justify-center">
                    {isLoading && <LoadingSpinner text="AI is listening..." />}
                    {error && <div role="alert" className="text-center text-brand-magenta"><p className="font-press-start">Error</p><p className="text-sm mt-2">{error}</p></div>}
                    {transcribedText !== null && !isLoading && (
                        <div className="w-full space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="font-press-start text-lg text-brand-cyan">Transcription:</h3>
                                <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-brand-yellow hover:underline">
                                    <CopyIcon className="w-4 h-4" /> {isCopied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            <textarea
                                readOnly
                                value={transcribedText}
                                className="w-full h-48 p-2 bg-black text-brand-light font-sans text-sm border border-brand-light/50"
                            />
                        </div>
                    )}
                </div>
            </main>
        </PageWrapper>
    );
};