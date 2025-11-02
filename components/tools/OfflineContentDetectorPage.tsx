import React, { useState, useRef, useCallback } from 'react';
import { PageWrapper, PageHeader } from '../PageComponents';
import * as audioService from '../../services/audioService';
import { UploadIcon } from '../icons/UploadIcon';
import { LoadingSpinner } from '../LoadingSpinner';
import { SparklesIcon } from '../icons/SparklesIcon';

interface OfflineContentDetectorPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
}

interface HeuristicResult {
    likelihood: number; // 0-100
    details: string[];
}

// Simple text analysis heuristics
const analyzeTextHeuristics = (text: string): HeuristicResult => {
    const details: string[] = [];
    let score = 50; // Start neutral

    const words = text.toLowerCase().split(/\s+/).filter(Boolean);
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    // Repetition
    const uniqueWords = new Set(words);
    const repetitionRatio = words.length > 0 ? uniqueWords.size / words.length : 1;
    if (repetitionRatio < 0.5) {
        score += 20;
        details.push(`High word repetition (Ratio: ${repetitionRatio.toFixed(2)}).`);
    } else {
        score -= 10;
        details.push(`Low word repetition (Ratio: ${repetitionRatio.toFixed(2)}).`);
    }

    // Sentence length variance
    if (sentences.length > 1) {
        const lengths = sentences.map(s => s.split(' ').length);
        const avg = lengths.reduce((a, b) => a + b) / lengths.length;
        const variance = lengths.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / lengths.length;
        if (variance < 5) {
            score += 25;
            details.push(`Low sentence length variance (${variance.toFixed(2)}), suggesting uniform structure.`);
        } else {
            score -= 15;
            details.push(`High sentence length variance (${variance.toFixed(2)}), suggesting more natural structure.`);
        }
    } else {
        details.push("Not enough sentences to analyze variance.");
    }

    return {
        likelihood: Math.max(0, Math.min(100, score)),
        details
    };
};


export const OfflineContentDetectorPage: React.FC<OfflineContentDetectorPageProps> = ({ onClose, playSound }) => {
    const [mode, setMode] = useState<'text' | 'file'>('text');
    const [inputText, setInputText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<HeuristicResult | null>(null);

    const handleAnalyze = () => {
        if ((mode === 'text' && !inputText.trim()) || (mode === 'file' && !file)) return;
        setIsLoading(true);
        setResult(null);
        playSound(audioService.playGenerate);
        
        setTimeout(() => {
            if (mode === 'text') {
                setResult(analyzeTextHeuristics(inputText));
            } else {
                setResult({
                    likelihood: 30, // Default for files as we can't do much
                    details: [
                        `File Name: ${file?.name}`,
                        `File Size: ${(file?.size || 0) / 1024} KB`,
                        "Heuristic Check: File analysis is a placeholder. AI-generated images often lack detailed metadata compared to camera photos.",
                        "This simplified check assumes a lower AI likelihood for any uploaded file."
                    ]
                });
            }
            setIsLoading(false);
        }, 1500); // Simulate analysis
    };
    
    return (
        <PageWrapper>
            <PageHeader title="Offline Content Detector" onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                <p className="text-sm text-center text-text-secondary">Analyze content for signs of AI generation using simple, offline heuristics (not actual AI).</p>

                <div className="w-full flex justify-center gap-1 p-1 bg-surface-2 rounded-md">
                    <button onClick={() => setMode('text')} className={`flex-1 p-2 text-xs font-press-start rounded ${mode === 'text' ? 'bg-brand-primary text-text-inverted' : ''}`}>Text</button>
                    <button onClick={() => setMode('file')} className={`flex-1 p-2 text-xs font-press-start rounded ${mode === 'file' ? 'bg-brand-primary text-text-inverted' : ''}`}>File</button>
                </div>
                
                <div className="w-full p-4 bg-surface-1 border-4 border-border-primary space-y-4">
                    {mode === 'text' ? (
                        <textarea value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Paste text here..." className="w-full h-40 p-2 bg-surface-2 rounded-md" />
                    ) : (
                        file ? (
                            <div className="text-center p-2 bg-surface-2 rounded-md">
                                <p>{file.name}</p>
                                <button onClick={() => setFile(null)} className="text-xs text-brand-accent mt-2">Clear</button>
                            </div>
                        ) : (
                            <button onClick={() => document.getElementById('detector-upload')?.click()} className="w-full p-4 border-2 border-dashed border-border-primary flex flex-col items-center justify-center gap-2">
                                <UploadIcon className="w-8 h-8"/>
                                <span>Upload File</span>
                            </button>
                        )
                    )}
                     <input type="file" id="detector-upload" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />

                    <button onClick={handleAnalyze} disabled={isLoading || (mode === 'text' ? !inputText.trim() : !file)} className="w-full p-3 bg-brand-primary text-text-inverted rounded-md font-press-start disabled:bg-surface-2">
                       <SparklesIcon className="w-5 h-5 inline-block mr-2" />
                       {isLoading ? 'Analyzing...' : 'Analyze'}
                    </button>
                </div>
                
                <div className="w-full min-h-[10rem] p-4 bg-surface-1 border-4 border-border-primary flex flex-col items-center justify-center">
                    {isLoading && <LoadingSpinner />}
                    {result && (
                        <div className="w-full space-y-3">
                            <h3 className="font-press-start text-lg text-center">Heuristic Analysis Result</h3>
                            <p className={`text-2xl font-press-start text-center ${result.likelihood > 60 ? 'text-brand-accent' : 'text-brand-secondary'}`}>
                                {result.likelihood}% AI Likelihood
                            </p>
                            <div className="text-xs space-y-1 bg-black/20 p-2 border border-border-primary/50">
                                <p className="font-bold text-brand-cyan">Details:</p>
                                <ul className="list-disc list-inside">
                                    {result.details.map((d, i) => <li key={i}>{d}</li>)}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </PageWrapper>
    );
};
