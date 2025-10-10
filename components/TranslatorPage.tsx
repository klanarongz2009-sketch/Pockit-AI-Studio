import React, { useState, useCallback, useEffect } from 'react';
import * as audioService from '../services/audioService';
import * as geminiService from '../services/geminiService';
import { PageWrapper, PageHeader } from './PageComponents';
import { LoadingSpinner } from './LoadingSpinner';
import { TranslateIcon } from './icons/TranslateIcon';
import { useCredits } from '../contexts/CreditContext';
import { useLanguage } from '../contexts/LanguageContext';
import { CopyIcon } from './icons/CopyIcon';
import { SpeakerOnIcon } from './icons/SpeakerOnIcon';

interface TranslatorPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

const languages = [
    { code: 'auto', name: 'Auto-detect' },
    { code: 'en', name: 'English' },
    { code: 'th', name: 'Thai' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'es', name: 'Spanish' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'vi', name: 'Vietnamese' },
];

export const TranslatorPage: React.FC<TranslatorPageProps> = ({ onClose, playSound, isOnline }) => {
    const { t } = useLanguage();
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [sourceLang, setSourceLang] = useState('auto');
    const [targetLang, setTargetLang] = useState('en');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { credits, spendCredits } = useCredits();

    const handleTranslate = useCallback(async () => {
        if (!inputText.trim() || isLoading || !isOnline) return;

        const cost = Math.ceil(inputText.length / 10);
        if (!spendCredits(cost)) {
            setError(`${t('translator.notEnoughCredits')} ${cost} ${t('translator.credits')}`);
            playSound(audioService.playError);
            return;
        }

        playSound(audioService.playGenerate);
        setIsLoading(true);
        setError(null);
        setOutputText('');

        try {
            const target = languages.find(l => l.code === targetLang)?.name;
            const result = await geminiService.translateText(inputText, target || 'English');
            setOutputText(result);
            playSound(audioService.playSuccess);
        } catch (err) {
            playSound(audioService.playError);
            const errorMessage = err instanceof Error ? err.message : 'Translation failed.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [inputText, isLoading, isOnline, targetLang, playSound, spendCredits, t, credits]);
    
    const handleSwapLanguages = () => {
        if (sourceLang === 'auto' || sourceLang === targetLang) return;
        playSound(audioService.playToggle);
        const currentSource = sourceLang;
        setSourceLang(targetLang);
        setTargetLang(currentSource);
        setInputText(outputText);
        setOutputText(inputText);
    };
    
    const handleCopyToClipboard = (text: string) => {
        if(!text) return;
        navigator.clipboard.writeText(text);
        playSound(audioService.playSelection);
    };

    return (
        <PageWrapper>
            <PageHeader title={t('translator.title')} onBack={onClose} />
            <main id="main-content" className="w-full max-w-2xl flex flex-col items-center gap-4 font-sans">
                <p className="text-sm text-center text-brand-light/80">{t('translator.description')}</p>
                {error && <div role="alert" className="w-full p-3 bg-brand-magenta/20 border-2 border-brand-magenta text-center text-sm text-brand-light">{error}</div>}

                <div className="w-full grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                    {/* Source Language */}
                    <div className="w-full flex flex-col gap-2">
                         <div className="flex justify-between items-center">
                             <label htmlFor="source-lang" className="font-press-start text-xs text-brand-cyan">{t('translator.from')}</label>
                             <select id="source-lang" value={sourceLang} onChange={e => setSourceLang(e.target.value)} className="p-1 bg-surface-primary border border-border-secondary text-xs">
                                {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                            </select>
                        </div>
                        <div className="relative">
                            <textarea
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                placeholder={t('translator.inputText')}
                                className="w-full h-40 p-2 bg-brand-light text-black border-2 border-black resize-y"
                                disabled={isLoading}
                            />
                             <div className="absolute bottom-2 right-2 flex gap-1">
                                <button onClick={() => handleCopyToClipboard(inputText)} className="p-1 bg-black/20 text-white rounded hover:bg-black/40"><CopyIcon className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                    {/* Swap */}
                    <button onClick={handleSwapLanguages} disabled={sourceLang === 'auto' || sourceLang === targetLang} className="p-2 border-2 border-border-secondary rounded-full disabled:opacity-50 md:rotate-90">
                       &#x21C4;
                       <span className="sr-only">{t('translator.swap')}</span>
                    </button>
                    {/* Target Language */}
                    <div className="w-full flex flex-col gap-2">
                         <div className="flex justify-between items-center">
                             <label htmlFor="target-lang" className="font-press-start text-xs text-brand-cyan">{t('translator.to')}</label>
                             <select id="target-lang" value={targetLang} onChange={e => setTargetLang(e.target.value)} className="p-1 bg-surface-primary border border-border-secondary text-xs">
                                {languages.filter(l => l.code !== 'auto').map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                            </select>
                        </div>
                        <div className="relative">
                            <textarea
                                value={outputText}
                                readOnly
                                placeholder={t('translator.outputText')}
                                className="w-full h-40 p-2 bg-black/50 text-brand-light border-2 border-border-secondary resize-y"
                            />
                            <div className="absolute bottom-2 right-2 flex gap-1">
                                <button onClick={() => handleCopyToClipboard(outputText)} className="p-1 bg-black/20 text-white rounded hover:bg-black/40"><CopyIcon className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleTranslate}
                    disabled={!inputText.trim() || isLoading || !isOnline}
                    className="w-full flex items-center justify-center gap-3 p-3 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black disabled:bg-gray-500"
                >
                    {isLoading ? <LoadingSpinner text="" /> : <TranslateIcon className="w-5 h-5" />}
                    <span>{isLoading ? t('translator.translating') : `${t('translator.translate')} (${Math.ceil(inputText.length / 10)} ${t('translator.credits')})`}</span>
                </button>
            </main>
        </PageWrapper>
    );
};