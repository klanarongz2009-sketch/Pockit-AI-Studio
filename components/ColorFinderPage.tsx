
import React, { useState, useRef, useCallback } from 'react';
import * as geminiService from '../services/geminiService';
import * as audioService from '../services/audioService';
import { PageHeader, PageWrapper } from './PageComponents';
import { UploadIcon } from './icons/UploadIcon';
import { LoadingSpinner } from './LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { CopyIcon } from './icons/CopyIcon';
import { useLanguage } from '../contexts/LanguageContext';

interface ColorFinderPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

export const ColorFinderPage: React.FC<ColorFinderPageProps> = ({ onClose, playSound, isOnline }) => {
    const { t } = useLanguage();
    const [uploadedFile, setUploadedFile] = useState<{ file: File; base64: string; mimeType: string; } | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [palette, setPalette] = useState<geminiService.ColorResult[] | null>(null);
    const [copiedHex, setCopiedHex] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = (clearFile: boolean = false) => {
        setIsLoading(false);
        setError(null);
        setPalette(null);
        if (clearFile) {
            setUploadedFile(null);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) {
            setError("Please select an image file.");
            return;
        }
        resetState(true);
        playSound(audioService.playSelection);
        try {
            const toBase64 = (f: File): Promise<string> => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(f);
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

    const handleGenerate = useCallback(async () => {
        if (!uploadedFile || isLoading || !isOnline) return;

        resetState();
        
        playSound(audioService.playGenerate);
        setIsLoading(true);

        try {
            const colors = await geminiService.extractColorPalette(uploadedFile.base64, uploadedFile.mimeType);
            setPalette(colors);
            playSound(audioService.playSuccess);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            playSound(audioService.playError);
        } finally {
            setIsLoading(false);
        }
    }, [uploadedFile, isLoading, isOnline, playSound]);

    const handleCopy = (hex: string) => {
        navigator.clipboard.writeText(hex);
        playSound(audioService.playSelection);
        setCopiedHex(hex);
        setTimeout(() => setCopiedHex(null), 1500);
    };

    return (
        <PageWrapper>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" aria-hidden="true" />
            <PageHeader title={t('colorFinder.title')} onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                <p className="text-sm text-center text-brand-light/80">
                    {t('colorFinder.description')}
                </p>

                <div className="w-full h-auto aspect-square bg-black/50 border-4 border-brand-light flex items-center justify-center shadow-pixel p-2">
                    {!uploadedFile ? (
                        <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center gap-3 p-4 text-white transition-opacity hover:opacity-80">
                            <UploadIcon className="w-12 h-12" />
                            <span className="font-press-start">{t('colorFinder.upload')}</span>
                        </button>
                    ) : (
                        <img src={previewUrl!} alt="Preview" className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                    )}
                </div>

                {uploadedFile && (
                    <div className="w-full space-y-4">
                        <button onClick={() => fileInputRef.current?.click()} onMouseEnter={() => playSound(audioService.playHover)} className="text-sm underline hover:text-brand-yellow transition-colors">{t('colorFinder.changeImage')}</button>
                        
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !isOnline}
                            className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            <SparklesIcon className="w-6 h-6" />
                            {isLoading ? t('colorFinder.loading') : t('colorFinder.button')}
                        </button>
                    </div>
                )}
                
                <div className="w-full min-h-[10rem] p-4 bg-black/50 border-4 border-brand-light flex flex-col items-center justify-center">
                    {isLoading && <LoadingSpinner text={t('colorFinder.thinking')} />}
                    {error && <div role="alert" className="text-center text-brand-magenta"><p className="font-press-start">{t('colorFinder.error')}</p><p className="text-sm mt-2">{error}</p></div>}
                    {palette && !isLoading && (
                        <div className="w-full">
                            <h3 className="text-center font-press-start text-lg text-brand-cyan mb-3">{t('colorFinder.resultsTitle')}</h3>
                            <div className="space-y-3">
                            {palette.map((color) => (
                                <div key={color.hex} className="flex items-center gap-3 p-2 bg-black/30 border border-brand-light/30">
                                    <div className="w-10 h-10 flex-shrink-0 border-2 border-brand-light" style={{ backgroundColor: color.hex }}></div>
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2">
                                            <span className="font-press-start text-sm text-brand-yellow">{color.name}</span>
                                            <span className="font-mono text-xs text-brand-light/70">{color.hex}</span>
                                            <button onClick={() => handleCopy(color.hex)} className="text-brand-light hover:text-brand-yellow" title={`Copy ${color.hex}`}>
                                                {copiedHex === color.hex ? <span className="text-xs text-brand-lime">{t('colorFinder.copied')}</span> : <CopyIcon className="w-4 h-4"/>}
                                            </button>
                                        </div>
                                        <p className="text-xs text-brand-light/80 mt-1">{color.description}</p>
                                    </div>
                                </div>
                            ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </PageWrapper>
    );
};
