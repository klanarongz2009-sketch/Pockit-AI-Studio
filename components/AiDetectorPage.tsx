
import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as geminiService from '../services/geminiService';
import * as audioService from '../services/audioService';
import { PageHeader, PageWrapper } from './PageComponents';
import { UploadIcon } from './icons/UploadIcon';
import { LoadingSpinner } from './LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { AiDetectorIcon } from './icons/AiDetectorIcon';

interface AiDetectorPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

interface FileData {
    file: File;
    base64: string;
    previewUrl: string;
}

export const AiDetectorPage: React.FC<AiDetectorPageProps> = ({ onClose, playSound, isOnline }) => {
    const [inputText, setInputText] = useState('');
    const [fileData, setFileData] = useState<FileData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<geminiService.AiDetectionResult | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const resetState = useCallback((clearAll: boolean = false) => {
        setIsLoading(false);
        setError(null);
        setResult(null);
        if (clearAll) {
            setInputText('');
            setFileData(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }, []);

    const processFile = useCallback(async (file: File | undefined) => {
        if (!file) return;
        resetState(true);
        setIsLoading(true);
        playSound(audioService.playSelection);
        try {
            const toBase64 = (f: File): Promise<string> => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(f);
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = error => reject(error);
            });
            const base64 = await toBase64(file);
            const previewUrl = URL.createObjectURL(file);
            setFileData({ file, base64, previewUrl });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not process file.");
            playSound(audioService.playError);
        } finally {
            setIsLoading(false);
        }
    }, [playSound, resetState]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        processFile(event.target.files?.[0]);
    };

    const handleAnalyze = useCallback(async () => {
        if ((!inputText.trim() && !fileData) || isLoading || !isOnline) return;

        resetState(false);
        playSound(audioService.playGenerate);
        setIsLoading(true);

        try {
            const contentToAnalyze: { text?: string; file?: { base64: string; mimeType: string } } = {};
            if (inputText.trim()) {
                contentToAnalyze.text = inputText;
            } else if (fileData) {
                contentToAnalyze.file = { base64: fileData.base64, mimeType: fileData.file.type };
            }
            
            const analysisResult = await geminiService.detectAiContent(contentToAnalyze);
            setResult(analysisResult);
            playSound(audioService.playSuccess);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during analysis.');
            playSound(audioService.playError);
        } finally {
            setIsLoading(false);
        }
    }, [inputText, fileData, isLoading, isOnline, playSound]);
    
    const handleDragEnter = (e: React.DragEvent<HTMLElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent<HTMLElement>) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (e.dataTransfer.files?.[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };
    
    return (
        <PageWrapper>
            <PageHeader title="AI Content Detector" onBack={onClose} />
             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" aria-hidden="true" />
            <main 
                id="main-content"
                className="w-full max-w-2xl flex flex-col items-center gap-4 font-sans relative"
                onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            >
                {isDragging && (
                    <div className="absolute inset-0 bg-black/80 border-4 border-dashed border-brand-yellow z-10 flex flex-col items-center justify-center pointer-events-none">
                        <UploadIcon className="w-12 h-12 text-brand-yellow" />
                        <p className="font-press-start text-xl text-brand-yellow mt-4">Drop your file here</p>
                    </div>
                )}

                <p className="text-sm text-center text-brand-light/80">
                    Paste text or upload a file (image, audio, video) to check if it's human or AI-generated.
                </p>

                <div className="w-full flex flex-col gap-4 bg-black/40 p-4 border-4 border-brand-light shadow-pixel">
                     <textarea
                        value={inputText}
                        onChange={(e) => { setInputText(e.target.value); if(fileData) setFileData(null); }}
                        placeholder="Paste text here to analyze..."
                        className="w-full h-32 p-2 bg-brand-light text-black border-2 border-black resize-y"
                        disabled={isLoading || !!fileData}
                    />
                    <div className="flex items-center gap-2">
                        <hr className="flex-grow border-brand-light/50" />
                        <span className="text-xs text-brand-light/80">OR</span>
                        <hr className="flex-grow border-brand-light/50" />
                    </div>
                    
                    {!fileData ? (
                        <button onClick={() => fileInputRef.current?.click()} disabled={isLoading || !!inputText.trim()} className="w-full p-3 bg-surface-primary border-2 border-border-secondary flex items-center justify-center gap-2 hover:bg-brand-cyan/20 disabled:opacity-50">
                            <UploadIcon className="w-5 h-5" /> Upload File
                        </button>
                    ) : (
                         <div className="p-2 bg-black/50 border border-brand-light/50">
                             <p className="text-xs truncate">{fileData.file.name}</p>
                             {fileData.file.type.startsWith('image/') && <img src={fileData.previewUrl} className="max-h-24 mx-auto my-2"/>}
                             {fileData.file.type.startsWith('video/') && <video ref={videoRef} src={fileData.previewUrl} className="max-h-24 mx-auto my-2" controls/>}
                             {fileData.file.type.startsWith('audio/') && <audio src={fileData.previewUrl} className="w-full my-2" controls/>}
                         </div>
                    )}
                    
                    <button onClick={handleAnalyze} disabled={(!inputText.trim() && !fileData) || isLoading || !isOnline} className="w-full flex items-center justify-center gap-3 p-3 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black disabled:bg-gray-500">
                        <SparklesIcon className="w-6 h-6" />
                        Analyze Content
                    </button>
                </div>

                 <div className="w-full min-h-[10rem] p-4 bg-black/50 border-4 border-brand-light flex flex-col items-center justify-center">
                    {isLoading && <LoadingSpinner text="AI is analyzing..." />}
                    {error && <div role="alert" className="text-center text-brand-magenta"><p className="font-press-start">Error</p><p className="text-sm mt-2">{error}</p></div>}
                    {result && !isLoading && (
                        <div className="w-full text-center space-y-3">
                            <h3 className={`font-press-start text-3xl ${result.isAI ? 'text-brand-magenta' : 'text-brand-lime'}`}>
                                {result.isAI ? 'AI Generated' : 'Human Generated'}
                            </h3>
                            {result.isAI && <p className="font-press-start text-lg text-brand-light">{result.aiProbability}% Probability</p>}
                            <div className="text-sm bg-black/20 p-2 border border-brand-light/50">
                                <p className="font-press-start text-xs text-brand-cyan mb-1">AI Reasoning:</p>
                                <p className="italic text-brand-light/90">"{result.reasoning}"</p>
                            </div>
                        </div>
                    )}
                 </div>
            </main>
        </PageWrapper>
    );
};
