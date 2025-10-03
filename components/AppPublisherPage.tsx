import React, { useState, useCallback, useEffect } from 'react';
import * as geminiService from '../services/geminiService';
import * as audioService from '../services/audioService';
import { PageWrapper, PageHeader } from './PageComponents';
import { LoadingSpinner } from './LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { useCredits, CREDIT_COSTS } from '../contexts/CreditContext';
import { useLanguage } from '../contexts/LanguageContext';
import { CopyIcon } from './icons/CopyIcon';

interface AppPublisherPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

export const AppPublisherPage: React.FC<AppPublisherPageProps> = ({ onClose, playSound, isOnline }) => {
    const { t } = useLanguage();
    const [appIdea, setAppIdea] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<geminiService.AppProfile | null>(null);
    const [copiedItem, setCopiedItem] = useState<string | null>(null);
    const { credits, spendCredits, addCredits } = useCredits();

    const handleGenerate = useCallback(async () => {
        if (!appIdea.trim() || isLoading || !isOnline) return;

        if (!spendCredits(CREDIT_COSTS.APP_PUBLISHER)) {
            setError(`Not enough credits! This action requires ${CREDIT_COSTS.APP_PUBLISHER} credits.`);
            playSound(audioService.playError);
            return;
        }

        playSound(audioService.playGenerate);
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const profile = await geminiService.generateAppProfile(appIdea);
            setResult(profile);
            playSound(audioService.playSuccess);
        } catch (err) {
            addCredits(CREDIT_COSTS.APP_PUBLISHER); // Refund on error
            playSound(audioService.playError);
            const errorMessage = err instanceof Error ? err.message : 'Failed to generate app profile.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [appIdea, isLoading, isOnline, playSound, spendCredits, addCredits, credits]);

    const handleCopy = (text: string, itemName: string) => {
        navigator.clipboard.writeText(text);
        playSound(audioService.playSelection);
        setCopiedItem(itemName);
        setTimeout(() => setCopiedItem(null), 2000);
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isLoading) return;
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const isCtrlCmd = isMac ? event.metaKey : event.ctrlKey;
            
            if (isCtrlCmd && event.key === 'Enter') {
                event.preventDefault();
                handleGenerate();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLoading, handleGenerate]);

    return (
        <PageWrapper>
            <PageHeader title={t('appPublisher.title')} onBack={onClose} />
            <main id="main-content" className="w-full max-w-2xl flex flex-col items-center gap-6 font-sans">
                <p className="text-sm text-center text-brand-light/80">{t('appPublisher.description')}</p>

                <div className="w-full flex flex-col gap-4 bg-black/40 p-4 border-4 border-brand-light shadow-pixel">
                    <label htmlFor="app-idea-input" className="text-xs font-press-start text-brand-cyan">{t('appPublisher.inputLabel')}</label>
                    <textarea
                        id="app-idea-input"
                        value={appIdea}
                        onChange={e => setAppIdea(e.target.value)}
                        placeholder={t('appPublisher.inputPlaceholder')}
                        className="w-full h-24 p-2 bg-brand-light text-black border-2 border-black resize-y"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={!appIdea.trim() || isLoading || !isOnline}
                        className="w-full flex items-center justify-center gap-3 p-3 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black disabled:bg-gray-500"
                    >
                        <SparklesIcon className="w-5 h-5"/>
                        {isLoading ? t('appPublisher.loadingText') : `${t('appPublisher.generateButton')} (${CREDIT_COSTS.APP_PUBLISHER} ${t('appPublisher.credits')})`}
                    </button>
                </div>

                {isLoading && <LoadingSpinner text={t('appPublisher.loadingText')} />}
                {error && <div role="alert" className="w-full p-3 text-center text-sm text-brand-light bg-brand-magenta/20 border-2 border-brand-magenta">{error}</div>}
                
                {result && !isLoading && (
                    <div className="w-full space-y-4 p-4 bg-black/50 border-4 border-brand-light animate-fadeIn">
                        <h3 className="font-press-start text-lg text-brand-yellow text-center">{t('appPublisher.resultsTitle')}</h3>
                        
                        <div className="space-y-2">
                            <h4 className="font-press-start text-brand-cyan">{t('appPublisher.suggestedNames')}</h4>
                            <ul className="list-disc list-inside pl-2 text-brand-light text-sm">
                                {result.suggestedNames.map(name => <li key={name}>{name}</li>)}
                            </ul>
                        </div>
                        
                        <div className="space-y-2">
                            <h4 className="font-press-start text-brand-cyan">{t('appPublisher.appDescription')}</h4>
                            <p className="text-brand-light text-sm whitespace-pre-wrap">{result.description}</p>
                        </div>
                        
                        <div className="space-y-2">
                            <h4 className="font-press-start text-brand-cyan">{t('appPublisher.keywords')}</h4>
                            <div className="flex flex-wrap gap-2">
                                {result.keywords.map(kw => <span key={kw} className="bg-brand-cyan/20 text-brand-light text-xs px-2 py-1">{kw}</span>)}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <h4 className="font-press-start text-brand-cyan">{t('appPublisher.manifestJson')}</h4>
                                <button onClick={() => handleCopy(JSON.stringify(result.manifest, null, 2), 'manifest')} className="flex items-center gap-1 text-xs text-brand-yellow hover:underline">
                                    <CopyIcon className="w-4 h-4" />
                                    {copiedItem === 'manifest' ? t('appPublisher.copied') : t('appPublisher.copy')}
                                </button>
                            </div>
                            <pre className="bg-black text-brand-lime font-mono text-xs p-2 border border-brand-light/50 overflow-x-auto">
                                <code>{JSON.stringify(result.manifest, null, 2)}</code>
                            </pre>
                        </div>
                    </div>
                )}
            </main>
        </PageWrapper>
    );
};
