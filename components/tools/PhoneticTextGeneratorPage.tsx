import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PageWrapper, PageHeader } from '../PageComponents';
import * as audioService from '../../services/audioService';
import { SparklesIcon } from '../icons/SparklesIcon';
import { CopyIcon } from '../icons/CopyIcon';
import type GraphemeToPhoneme from 'grapheme-to-phoneme';

interface PhoneticTextGeneratorPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
}

// Simple phonetic dictionaries for offline use (as fallback for non-English)
const thaiPhoneticDict: { [key: string]: string } = {
    'สวัสดี': 'sa-wat-dee', 'ขอบคุณ': 'khob-khun', 'ขอโทษ': 'khor-thot',
    'ใช่': 'chai', 'ไม่ใช่': 'mai-chai', 'คุณ': 'khun', 'ผม': 'phom',
    'ฉัน': 'chan', 'รัก': 'rak', 'แมว': 'maew', 'หมา': 'mah', 'กิน': 'gin',
    'นอน': 'non', 'ไป': 'pai', 'ไหน': 'nai', 'อะไร': 'a-rai',
    'เท่าไหร่': 'thao-rai', 'อร่อย': 'a-roi',
};

export const PhoneticTextGeneratorPage: React.FC<PhoneticTextGeneratorPageProps> = ({ onClose, playSound }) => {
    const [inputText, setInputText] = useState('สวัสดี hello world this is an amazing phonetic generator');
    const [outputText, setOutputText] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    // Phonetic library state
    const g2pRef = useRef<InstanceType<typeof GraphemeToPhoneme> | null>(null);
    const [isLibraryReady, setIsLibraryReady] = useState(false);
    const [libraryError, setLibraryError] = useState<string | null>(null);

    // Dynamically initialize the phonetic library on mount
    useEffect(() => {
        const initLibrary = async () => {
            try {
                const GraphemeToPhonemeModule = await import('grapheme-to-phoneme');
                const GraphemeToPhoneme = GraphemeToPhonemeModule.default;
                const g2p = new GraphemeToPhoneme();
                await g2p.init();
                g2pRef.current = g2p;
            } catch (e) {
                console.error("Failed to load phonetic library, will use fallback:", e);
                setLibraryError("English phonetic library failed to load (offline?). Using basic fallback.");
            } finally {
                setIsLibraryReady(true);
            }
        };
        initLibrary();
    }, []);

    const generatePhonetics = useCallback(async (text: string): Promise<string> => {
        const words = text.toLowerCase().split(/(\s+)/);
        const results = await Promise.all(words.map(async (word) => {
            if (word.trim() === '') return word;

            // Priority 1: Built-in library (for English)
            if (g2pRef.current && /^[a-z']+$/.test(word)) {
                try {
                    const phonemes = await g2pRef.current.toPhoneme(word);
                    return phonemes.join('-');
                } catch (e) {
                    // Fallback if library fails for a specific word
                }
            }
            
            // Priority 2: Thai fallback dictionary
            if (thaiPhoneticDict[word]) {
                return thaiPhoneticDict[word];
            }

            return word; // Return original word if no rule applies
        }));
        return results.join('');
    }, []);


    const handleGenerate = useCallback(async () => {
        if (!inputText.trim() || !isLibraryReady) return;
        playSound(audioService.playClick);
        const result = await generatePhonetics(inputText);
        setOutputText(result);
    }, [inputText, playSound, generatePhonetics, isLibraryReady]);

    const handleCopy = useCallback(() => {
        if (!outputText) return;
        navigator.clipboard.writeText(outputText);
        playSound(audioService.playSelection);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }, [outputText, playSound]);
    

    return (
        <PageWrapper>
            <PageHeader title="Phonetic Text Generator" onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                <p className="text-sm text-center text-text-secondary">
                    Uses a built-in offline library for English and a basic dictionary for Thai.
                </p>
                {libraryError && <p className="text-xs text-center text-yellow-400 bg-yellow-900/50 p-2 border border-yellow-700">{libraryError}</p>}

                <div className="w-full flex flex-col gap-4 bg-surface-1 p-4 border-4 border-border-primary shadow-pixel">
                    <label htmlFor="text-input" className="text-xs font-press-start text-brand-cyan">Your Text:</label>
                    <textarea
                        id="text-input"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Enter text here..."
                        className="w-full h-24 p-2 bg-surface-2 rounded-md resize-y"
                    />
                     <button
                        onClick={handleGenerate}
                        disabled={!inputText.trim() || !isLibraryReady}
                        className="w-full p-3 bg-brand-primary text-text-inverted rounded-md font-press-start disabled:bg-surface-2 flex items-center justify-center gap-2"
                    >
                       <SparklesIcon className="w-5 h-5" />
                       {!isLibraryReady ? 'Initializing library...' : 'Generate Phonetics'}
                    </button>
                </div>

                <div className="w-full flex flex-col gap-2">
                     <label htmlFor="output-text" className="text-xs font-press-start text-brand-cyan">Phonetic Output:</label>
                    <div className="relative w-full min-h-[8rem] p-4 bg-black/50 border-4 border-border-primary flex items-center justify-center">
                        {outputText ? (
                             <pre className="whitespace-pre-wrap text-brand-yellow text-center w-full"><code>{outputText}</code></pre>
                        ) : (
                             <p className="text-text-secondary text-sm">Results will appear here...</p>
                        )}
                        {outputText && (
                            <button onClick={handleCopy} className="absolute top-2 right-2 p-2 bg-surface-2/50 hover:bg-surface-2 rounded-md">
                                {isCopied ? <span className="text-xs text-brand-lime">Copied!</span> : <CopyIcon className="w-5 h-5" />}
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </PageWrapper>
    );
};