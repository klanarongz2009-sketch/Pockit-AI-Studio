import React, { useState, useRef, useCallback } from 'react';
import * as geminiService from '../services/geminiService';
import * as audioService from '../services/audioService';
import { PageHeader, PageWrapper } from './PageComponents';
import { UploadIcon } from './icons/UploadIcon';
import { LoadingSpinner } from './LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { useCredits } from '../contexts/CreditContext';

interface ImageToCodePageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

const GENERATION_COST = 50;

export const ImageToCodePage: React.FC<ImageToCodePageProps> = ({ onClose, playSound, isOnline }) => {
    const [uploadedFile, setUploadedFile] = useState<{ file: File; base64: string; mimeType: string; } | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { credits, spendCredits } = useCredits();

    const resetState = (clearFile: boolean = false) => {
        setIsLoading(false);
        setError(null);
        setGeneratedCode(null);
        if (clearFile) {
            setUploadedFile(null);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const processFile = async (file: File | undefined) => {
        if (!file || !file.type.startsWith('image/')) {
            setError("Please select an image file.");
            return;
        }
        resetState(true);
        playSound(audioService.playSelection);
        try {
            const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = error => reject(error);
            });
            const base64 = await toBase64(file);
            setUploadedFile({ file, base64, mimeType: file.type });
            setPreviewUrl(URL.createObjectURL(file));
        } catch (err) {
            setError("Failed to process the file.");
            playSound(audioService.playError);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        processFile(event.target.files?.[0]);
    };

    const handleUploadClick = useCallback(() => {
        playSound(audioService.playClick);
        fileInputRef.current?.click();
    }, [playSound]);

    const handleGenerate = useCallback(async () => {
        if (!uploadedFile || isLoading || !isOnline) return;

        if (!spendCredits(GENERATION_COST)) {
            setError(`Not enough credits! This action requires ${GENERATION_COST} credits.`);
            playSound(audioService.playError);
            return;
        }

        resetState();
        playSound(audioService.playGenerate);
        setIsLoading(true);

        try {
            const code = await geminiService.generateCodeFromImage(uploadedFile.base64, uploadedFile.mimeType);
            setGeneratedCode(code);
            playSound(audioService.playSuccess);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during code generation.');
            playSound(audioService.playError);
        } finally {
            setIsLoading(false);
        }
    }, [uploadedFile, isLoading, isOnline, playSound, spendCredits, credits]);

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
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" aria-hidden="true" />
            <PageHeader title="Image to Code" onBack={onClose} />
            <main 
                id="main-content" 
                className="w-full max-w-4xl flex-grow flex flex-col md:flex-row items-stretch gap-6 font-sans p-2 relative"
                onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            >
                {isDragging && (
                    <div className="absolute inset-0 bg-black/80 border-4 border-dashed border-brand-yellow z-10 flex flex-col items-center justify-center pointer-events-none">
                        <UploadIcon className="w-12 h-12 text-brand-yellow" />
                        <p className="font-press-start text-xl text-brand-yellow mt-4">Drop your image here</p>
                    </div>
                )}
                {/* Left Panel: Upload & Controls */}
                <div className="w-full md:w-1/3 flex flex-col gap-4">
                    <div className="flex-grow aspect-square bg-black/50 border-4 border-brand-light flex items-center justify-center shadow-pixel p-2">
                        {!uploadedFile ? (
                            <button onClick={handleUploadClick} className="flex flex-col items-center justify-center gap-3 p-4 text-white transition-opacity hover:opacity-80">
                                <UploadIcon className="w-12 h-12" />
                                <span className="font-press-start">Upload Image</span>
                            </button>
                        ) : (
                            <img src={previewUrl!} alt="Preview" className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                        )}
                    </div>
                    {uploadedFile && (
                        <div className="flex-shrink-0 space-y-2">
                             <button onClick={handleUploadClick} onMouseEnter={() => playSound(audioService.playHover)} className="text-sm underline hover:text-brand-yellow transition-colors">Change Image</button>
                             <button 
                                onClick={handleGenerate} 
                                disabled={isLoading || !isOnline}
                                className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                <SparklesIcon className="w-6 h-6" />
                                {isLoading ? 'Writing Code...' : `Generate Code (${GENERATION_COST} Credits)`}
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Panel: Output */}
                <div className="w-full md:w-2/3 flex-grow flex flex-col gap-4">
                     <div className="w-full flex-grow bg-black/50 border-4 border-brand-light flex flex-col items-center justify-center shadow-pixel">
                        {isLoading && <LoadingSpinner text="AI is analyzing the layout..." />}
                        {error && (
                            <div role="alert" className="text-center text-brand-magenta p-4">
                                <p className="font-press-start">Error</p>
                                <p className="text-sm mt-2">{error}</p>
                            </div>
                        )}
                        {generatedCode ? (
                            <iframe 
                                srcDoc={generatedCode} 
                                title="Code Preview" 
                                className="w-full h-full border-0 bg-white" 
                                sandbox="allow-scripts"
                            />
                        ) : (
                            !isLoading && !error && <p className="text-brand-light/70">Code preview will appear here...</p>
                        )}
                    </div>
                    {generatedCode && (
                         <div className="flex-shrink-0">
                            <h3 className="font-press-start text-sm text-brand-cyan mb-2">Generated Code:</h3>
                            <textarea
                                value={generatedCode}
                                readOnly
                                className="w-full h-32 p-2 bg-black text-brand-lime font-mono text-xs border border-brand-light/50"
                                aria-label="Generated Code"
                            />
                        </div>
                    )}
                </div>
            </main>
        </PageWrapper>
    );
};