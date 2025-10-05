import React, { useState, useRef, useCallback } from 'react';
import * as geminiService from '../services/geminiService';
import * as audioService from '../services/audioService';
import { PageHeader, PageWrapper } from './PageComponents';
import { UploadIcon } from './icons/UploadIcon';
import { LoadingSpinner } from './LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { useCredits } from '../contexts/CreditContext';
import { CopyIcon } from './icons/CopyIcon';
import { useLanguage } from '../contexts/LanguageContext';
import { AnalyzeIcon } from './AnalyzeIcon';

interface ColorFinderPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

const CREDIT_COST = 5;

// New type for local analysis results
interface LocalColorResult {
    hex: string;
    count: number;
}

const analyzeImageLocally = (imageUrl: string): Promise<LocalColorResult[]> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error("Could not get canvas context"));
            }
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            const colorMap = new Map<string, number>();
            const PIXEL_SAMPLE_RATE = 5; // Analyze every 5th pixel

            for (let i = 0; i < data.length; i += 4 * PIXEL_SAMPLE_RATE) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
                colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
            }

            const sortedColors: LocalColorResult[] = Array.from(colorMap.entries())
                .map(([hex, count]) => ({ hex, count }))
                .sort((a, b) => b.count - a.count);

            resolve(sortedColors.slice(0, 100)); // Return top 100 unique colors
        };
        img.onerror = (err) => {
            reject(new Error("Failed to load image for local analysis."));
        };
        img.src = imageUrl;
    });
};

export const ColorFinderPage: React.FC<ColorFinderPageProps> = ({ onClose, playSound, isOnline }) => {
    const { t } = useLanguage();
    const [uploadedFile, setUploadedFile] = useState<{ file: File; base64: string; mimeType: string; } | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [palette, setPalette] = useState<(geminiService.ColorResult[] | LocalColorResult[]) | null>(null);
    const [copiedHex, setCopiedHex] = useState<string | null>(null);
    const [mode, setMode] = useState<'ai' | 'local'>('ai');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { credits, spendCredits } = useCredits();

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
        if (!uploadedFile || isLoading) return;

        resetState();
        playSound(audioService.playGenerate);
        setIsLoading(true);

        if (mode === 'ai') {
            if (!isOnline) {
                setError("AI mode requires an internet connection.");
                setIsLoading(false);
                return;
            }
            if (!spendCredits(CREDIT_COST)) {
                setError(`Not enough credits! This action requires ${CREDIT_COST} credits.`);
                playSound(audioService.playError);
                setIsLoading(false);
                return;
            }
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
        } else { // Local mode
            try {
                if (!previewUrl) throw new Error("Preview URL is not available.");
                const localColors = await analyzeImageLocally(previewUrl);
                setPalette(localColors);
                playSound(audioService.playSuccess);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred during local analysis.');
                playSound(audioService.playError);
            } finally {
                setIsLoading(false);
            }
        }
    }, [uploadedFile, isLoading, isOnline, playSound, spendCredits, credits, mode, previewUrl]);

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
                        
                        <div className="flex justify-center gap-1 p-1 bg-black/50">
                            <button
                                onClick={() => setMode('ai')}
                                className={`w-full py-2 text-xs font-press-start border-2 transition-colors ${mode === 'ai' ? 'bg-brand-yellow text-black border-black' : 'bg-surface-primary border-transparent text-text-primary hover:bg-brand-cyan/20'}`}
                            >
                                {t('colorFinder.modeAi')}
                            </button>
                            <button
                                onClick={() => setMode('local')}
                                className={`w-full py-2 text-xs font-press-start border-2 transition-colors ${mode === 'local' ? 'bg-brand-yellow text-black border-black' : 'bg-surface-primary border-transparent text-text-primary hover:bg-brand-cyan/20'}`}
                            >
                                {t('colorFinder.modeLocal')}
                            </button>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || (mode === 'ai' && !isOnline)}
                            className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            {mode === 'ai' ? <SparklesIcon className="w-6 h-6" /> : <AnalyzeIcon className="w-6 h-6" />}
                            {isLoading ? t('colorFinder.loading') : 
                                (mode === 'ai' ? `${t('colorFinder.button')} (${CREDIT_COST} เครดิต)` : t('colorFinder.buttonLocal'))}
                        </button>
                    </div>
                )}
                
                <div className="w-full min-h-[10rem] p-4 bg-black/50 border-4 border-brand-light flex flex-col items-center justify-center">
                    {isLoading && <LoadingSpinner text={mode === 'ai' ? t('colorFinder.thinking') : t('colorFinder.loading')} />}
                    {error && <div role="alert" className="text-center text-brand-magenta"><p className="font-press-start">{t('colorFinder.error')}</p><p className="text-sm mt-2">{error}</p></div>}
                    {palette && !isLoading && (
                        <div className="w-full">
                            <h3 className="text-center font-press-start text-lg text-brand-cyan mb-3">{t('colorFinder.resultsTitle')}</h3>
                            {('name' in palette[0]) ? (
                                // AI Mode Result
                                <div className="space-y-3">
                                {(palette as geminiService.ColorResult[]).map((color) => (
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
                            ) : (
                                // Local Mode Result
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-96 overflow-y-auto pr-2">
                                {(palette as LocalColorResult[]).map((color) => (
                                    <div key={color.hex} className="flex flex-col items-center gap-1 group">
                                        <div className="w-full aspect-square border-2 border-brand-light/50" style={{ backgroundColor: color.hex }}></div>
                                        <button onClick={() => handleCopy(color.hex)} className="w-full text-center group-hover:text-brand-yellow" title={`Copy ${color.hex}`}>
                                            <p className="font-mono text-[10px] truncate">{color.hex}</p>
                                        </button>
                                    </div>
                                ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </PageWrapper>
    );
};