import React, { useState } from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { ShareIcon } from './icons/ShareIcon';
import { InstallIcon } from './icons/InstallIcon';
import { SendIcon } from './icons/SendIcon';
import { LoadingSpinner } from './LoadingSpinner';
import * as audioService from '../services/audioService';
import { analyzeFeedback } from '../services/geminiService';
import { PageHeader, PageWrapper } from './PageComponents';
import { DownloadIcon } from './icons/DownloadIcon';
import { useLanguage } from '../contexts/LanguageContext';

interface AboutPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

const Section: React.FC<{ title: string; children: React.ReactNode; id: string }> = ({ title, children, id }) => (
    <section id={id} aria-labelledby={`${id}-heading`} className="w-full bg-surface-primary p-4 border-4 border-border-secondary shadow-pixel space-y-2">
        <h3 id={`${id}-heading`} className="font-press-start text-lg text-brand-cyan">{title}</h3>
        <div className="font-sans text-sm space-y-2">{children}</div>
    </section>
);

const InstructionStep: React.FC<{ icon?: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
    <li className="flex gap-4 items-center">
        {icon && <div className="flex-shrink-0 w-8 h-8 text-brand-yellow">{icon}</div>}
        <p className="text-text-primary/90">{children}</p>
    </li>
);

const ThreeDotsIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} style={{ imageRendering: 'pixelated' }} aria-hidden="true">
        <path d="M12 10H14V14H12V10Z" />
        <path d="M12 4H14V8H12V4Z" />
        <path d="M12 16H14V20H12V16Z" />
    </svg>
);

const FeedbackSection: React.FC<{ playSound: (player: () => void) => void; isOnline: boolean; }> = ({ playSound, isOnline }) => {
    const { t } = useLanguage();
    const [feedback, setFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [wasAnalyzed, setWasAnalyzed] = useState(false);

    const handleAnalyze = async () => {
        if (!feedback.trim() || !isOnline) return;

        playSound(audioService.playClick);
        setIsSummaryLoading(true);
        setError(null);
        setSummary(null);

        try {
            const result = await analyzeFeedback(feedback);
            setSummary(result);
            setWasAnalyzed(true);
            playSound(audioService.playSuccess);
        } catch (err) {
            playSound(audioService.playError);
            const errorMessage = err instanceof Error ? err.message : 'Analysis failed.';
            setError(errorMessage);
        } finally {
            setIsSummaryLoading(false);
        }
    };

    const handleSubmit = () => {
        if (!feedback.trim() || !isOnline) return;
        playSound(audioService.playGenerate);
        setIsLoading(true);
        setError(null);
        
        setTimeout(() => {
            setIsLoading(false);
            setIsSubmitted(true);
            playSound(audioService.playSuccess);
        }, 1500);
    };

    if (isSubmitted) {
        return (
            <div className="text-center space-y-4 p-4 bg-surface-primary border-4 border-brand-lime shadow-pixel">
                <h3 className="font-press-start text-xl text-brand-lime">{t('about.feedback.success.title')}</h3>
                <p>{wasAnalyzed ? t('about.feedback.success.analyzedMessage') : t('about.feedback.success.message')}</p>
            </div>
        );
    }
    
    return (
        <>
            <p className="text-sm text-center text-text-secondary">
                {t('about.feedback.description')}
            </p>
            <div className="w-full flex flex-col gap-4 bg-surface-primary p-4 border-2 border-border-secondary shadow-pixel">
                <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder={t('about.feedback.placeholder')}
                    className="w-full h-40 p-2 bg-text-primary text-background rounded-none border-2 border-border-primary focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-y"
                    disabled={isLoading || !isOnline}
                    aria-label="Feedback input box"
                />
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handleAnalyze}
                        onMouseEnter={() => playSound(audioService.playHover)}
                        disabled={!feedback.trim() || isLoading || isSummaryLoading || !isOnline}
                        className="w-full flex items-center justify-center gap-2 p-3 bg-brand-cyan text-black border-2 border-border-primary shadow-sm transition-all hover:bg-brand-yellow disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        <SparklesIcon className="w-5 h-5" />
                        {isSummaryLoading ? t('about.feedback.analyzing') : t('about.feedback.analyze')}
                    </button>
                    <button
                        onClick={handleSubmit}
                        onMouseEnter={() => playSound(audioService.playHover)}
                        disabled={!feedback.trim() || isLoading || isSummaryLoading || !isOnline}
                        className="w-full flex items-center justify-center gap-2 p-3 bg-brand-magenta text-white border-2 border-border-primary shadow-sm transition-all hover:bg-brand-yellow hover:text-black disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        <SendIcon className="w-5 h-5" />
                        {isLoading ? t('about.feedback.submitting') : (summary ? t('about.feedback.submitToAi') : t('about.feedback.submit'))}
                    </button>
                </div>
            </div>

            {isSummaryLoading && <LoadingSpinner text="AI is reading..." />}
            
            {error && (
                <div role="alert" className="w-full p-3 text-center text-sm text-text-primary bg-brand-magenta/20 border-2 border-brand-magenta">
                    {error}
                </div>
            )}

            {summary && (
                <div aria-live="polite" className="w-full p-4 bg-black/30 border-2 border-brand-cyan/50 space-y-2">
                    <h4 className="font-press-start text-brand-cyan">{t('about.feedback.summaryTitle')}</h4>
                    <p className="text-sm">"{summary}"</p>
                </div>
            )}
        </>
    );
};


export const AboutPage: React.FC<AboutPageProps> = ({ onClose, playSound, isOnline }) => {
    const { t } = useLanguage();

    return (
        <PageWrapper>
            <PageHeader title={t('about.title')} onBack={onClose} />
            <main id="main-content" className="w-full max-w-2xl flex-grow overflow-y-auto font-sans px-2 pb-8 space-y-6">
                <Section title={t('about.welcome.title')} id="welcome">
                    <p>{t('about.welcome.content')}</p>
                </Section>

                <Section title={t('about.tips.title')} id="tips">
                    <h4 className="font-press-start text-base text-brand-yellow">{t('about.tips.shortcuts.title')}</h4>
                    <p className="text-xs text-text-secondary">{t('about.tips.shortcuts.description')}</p>
                    <ul className="list-disc list-inside text-xs space-y-1 pl-2">
                        <li><strong className="text-brand-cyan">Ctrl + Enter:</strong> {t('about.tips.shortcuts.ctrlEnter')}</li>
                        <li><strong className="text-brand-cyan">Alt + U:</strong> {t('about.tips.shortcuts.altU')}</li>
                        <li><strong className="text-brand-cyan">Alt + P:</strong> {t('about.tips.shortcuts.altP')}</li>
                        <li><strong className="text-brand-cyan">Alt + D:</strong> {t('about.tips.shortcuts.altD')}</li>
                        <li><strong className="text-brand-cyan">Alt + S:</strong> {t('about.tips.shortcuts.altS')}</li>
                        <li><strong className="text-brand-cyan">Alt + C:</strong> {t('about.tips.shortcuts.altC')}</li>
                        <li><strong className="text-brand-cyan">Alt + M:</strong> {t('about.tips.shortcuts.altM')}</li>
                        <li><strong className="text-brand-cyan">Alt + N:</strong> {t('about.tips.shortcuts.altN')}</li>
                        <li><strong className="text-brand-cyan">Escape (Esc):</strong> {t('about.tips.shortcuts.esc')}</li>
                    </ul>
                     <h4 className="font-press-start text-base text-brand-yellow pt-4">{t('about.tips.proTips.title')}</h4>
                     <ul className="list-disc list-inside text-xs space-y-1 pl-2">
                        <li>{t('about.tips.proTips.specificity')}</li>
                        <li>{t('about.tips.proTips.combine')}</li>
                     </ul>
                </Section>
                
                <Section title={t('about.install.title')} id="install-guide">
                    <p>{t('about.install.description')}</p>
                    <h4 className="font-press-start text-sm text-brand-yellow pt-2">{t('about.install.ios.title')}</h4>
                    <ol className="list-decimal list-inside text-xs space-y-1 pl-2">
                         <InstructionStep icon={<ShareIcon className="w-6 h-6" />}>
                            {t('about.install.ios.step1')}
                        </InstructionStep>
                    </ol>
                    <h4 className="font-press-start text-sm text-brand-yellow pt-2">{t('about.install.android.title')}</h4>
                    <ol className="list-decimal list-inside text-xs space-y-1 pl-2">
                        <InstructionStep icon={<ThreeDotsIcon className="w-6 h-6" />}>
                            {t('about.install.android.step1')}
                        </InstructionStep>
                    </ol>
                     <h4 className="font-press-start text-sm text-brand-yellow pt-2">{t('about.install.desktop.title')}</h4>
                    <ol className="list-decimal list-inside text-xs space-y-1 pl-2">
                        <InstructionStep icon={<InstallIcon className="w-6 h-6" />}>
                            {t('about.install.desktop.step1')}
                        </InstructionStep>
                    </ol>
                    <h4 className="font-press-start text-sm text-brand-yellow pt-2">{t('about.install.rom.title')}</h4>
                    <p className="text-xs">{t('about.install.rom.description')}</p>
                     <a href="/app-source.zip" download="ai-apps-source.zip" className="inline-block mt-2 p-2 bg-brand-yellow text-black border-2 border-black font-press-start text-xs hover:bg-brand-lime">
                        <InstructionStep icon={<DownloadIcon className="w-6 h-6" />}>
                            {t('about.install.rom.button')}
                        </InstructionStep>
                    </a>
                </Section>

                <Section title={t('about.feedback.title')} id="feedback">
                    <FeedbackSection playSound={playSound} isOnline={isOnline} />
                </Section>

                <Section title={t('about.faq.title')} id="faq">
                    <h4 className="font-bold">{t('about.faq.q1.question')}</h4>
                    <p className="text-xs text-text-secondary mb-2">{t('about.faq.q1.answer')}</p>
                     <h4 className="font-bold">{t('about.faq.q2.question')}</h4>
                    <p className="text-xs text-text-secondary mb-2">{t('about.faq.q2.answer')}</p>
                     <h4 className="font-bold">{t('about.faq.q3.question')}</h4>
                    <p className="text-xs text-text-secondary mb-2">{t('about.faq.q3.answer')}</p>
                     <h4 className="font-bold">{t('about.faq.q4.question')}</h4>
                    <p className="text-xs text-text-secondary mb-2">{t('about.faq.q4.answer')}</p>
                    <h4 className="font-bold">{t('about.faq.q5.question')}</h4>
                    <p className="text-xs text-text-secondary mb-2">{t('about.faq.q5.answer')}</p>
                    <h4 className="font-bold">{t('about.faq.q6.question')}</h4>
                    <p className="text-xs text-text-secondary mb-2">{t('about.faq.q6.answer')}</p>
                </Section>

                <Section title={t('about.disclaimer.title')} id="disclaimer">
                    <p>{t('about.disclaimer.content')}</p>
                </Section>
            </main>
        </PageWrapper>
    );
}