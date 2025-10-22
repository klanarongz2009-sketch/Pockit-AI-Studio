import React, { useState, useCallback } from 'react';
import * as huggingFaceService from '../services/huggingFaceService';
import * as audioService from '../services/audioService';
import { PageWrapper, PageHeader } from './PageComponents';
// FIX: Corrected the import from ImageDisplay to OutputDisplay.
import { OutputDisplay } from './ImageDisplay';
import { SparklesIcon } from './icons/SparklesIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { TrashIcon } from './icons/TrashIcon';
import { HuggingFaceIcon } from './icons/HuggingFaceIcon';

interface HuggingFaceImagePageProps {
  onClose: () => void;
  playSound: (player: () => void) => void;
  isOnline: boolean;
}

export const HuggingFaceImagePage: React.FC<HuggingFaceImagePageProps> = ({ onClose, playSound, isOnline }) => {
    const [prompt, setPrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const handleClear = useCallback(() => {
        playSound(audioService.playSwoosh);
        setPrompt('');
        setError(null);
        setGeneratedImage(null);
    }, [playSound]);

    const handleDownload = useCallback(() => {
        if (!generatedImage) return;
        playSound(audioService.playDownload);
        
        const a = document.createElement('a');
        a.href = generatedImage;
        a.download = 'hf-stable-diffusion.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }, [generatedImage, playSound]);


    const handleGenerate = useCallback(async () => {
        if (!prompt.trim() || isLoading || !isOnline) return;

        playSound(audioService.playGenerate);
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const image = await huggingFaceService.generateStableDiffusionImage(prompt);
            setGeneratedImage(image);
            playSound(audioService.playSuccess);
        } catch (err) {
            playSound(audioService.playError);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [prompt, isLoading, isOnline, playSound]);

    return (
        <PageWrapper>
            <PageHeader title="HF Image Generation" onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-4 font-sans">
                 <p className="text-sm text-center text-brand-light/80 flex items-center gap-2">
                    Powered by <HuggingFaceIcon className="w-5 h-5 inline-block" /> Stable Diffusion
                </p>
                <OutputDisplay
                    isLoading={isLoading}
                    error={error}
                    generatedImage={generatedImage}
                    generatedFrames={null}
                    generatedVideoUrl={null}
                    generatedCode={null}
                    prompt={prompt}
                    generationMode={'image'}
                    fps={12}
                    loadingText={'Generating with Stable Diffusion...'}
                    currentFrame={0}
                />
                
                <div className="w-full grid grid-cols-2 gap-2 font-press-start text-xs">
                    <button
                        onClick={handleDownload}
                        disabled={!generatedImage}
                        className="flex items-center justify-center gap-2 p-2 bg-brand-yellow text-black border-2 border-brand-light shadow-sm hover:bg-brand-magenta hover:text-white disabled:bg-gray-500 disabled:cursor-not-allowed">
                        <DownloadIcon className="w-4 h-4" /> Download
                    </button>
                     <button
                        onClick={handleClear}
                        className="flex items-center justify-center gap-2 p-2 bg-brand-magenta text-white border-2 border-brand-light shadow-sm hover:bg-red-500">
                        <TrashIcon className="w-4 h-4" /> Clear
                    </button>
                </div>

                <div className="w-full flex flex-col gap-4 bg-black/40 p-4 border-4 border-brand-light shadow-pixel">
                    <div className="flex items-start gap-2">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="A cat in a spacesuit..."
                            className="flex-grow h-24 p-2 bg-brand-light text-black rounded-none border-2 border-black focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-y font-sans"
                            disabled={isLoading}
                        />
                         <button
                            onClick={handleGenerate}
                            disabled={!prompt.trim() || isLoading || !isOnline}
                            className="w-24 h-24 flex-shrink-0 flex flex-col items-center justify-center gap-1 p-2 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed font-press-start"
                        >
                            <SparklesIcon className="w-8 h-8"/>
                            <span className="text-sm">Generate</span>
                        </button>
                    </div>
                </div>
            </main>
        </PageWrapper>
    );
};
