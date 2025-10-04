import React, { useState } from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { GamepadIcon } from './icons/GamepadIcon';
import { ShareIcon } from './icons/ShareIcon';
import { InstallIcon } from './icons/InstallIcon';
import { SendIcon } from './icons/SendIcon';
import { LoadingSpinner } from './LoadingSpinner';
import * as audioService from '../services/audioService';
import { analyzeFeedback } from '../services/geminiService';
import { useCredits, CREDIT_COSTS } from '../contexts/CreditContext';
import { PageHeader, PageWrapper } from './PageComponents';

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
    // FIX: Imported useState from React.
    const [feedback, setFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [wasAnalyzed, setWasAnalyzed] = useState(false);
    const { spendCredits, credits } = useCredits();

    const handleAnalyze = async () => {
        if (!feedback.trim() || !isOnline) return;

        if (!spendCredits(CREDIT_COSTS.FEEDBACK_ANALYSIS)) {
            setError(`Not enough credits! This action requires ${CREDIT_COSTS.FEEDBACK_ANALYSIS} credits, but you have ${Math.floor(credits)}.`);
            playSound(audioService.playError);
            return;
        }

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
                <h3 className="font-press-start text-xl text-brand-lime">Thank you!</h3>
                {wasAnalyzed ? (
                    <p>Thanks for the feedback! In a full version of this application, this analyzed summary would be automatically sent to an AI Code Assistant to aid in future development.</p>
                ) : (
                    <p>We've received your feedback and will use it to improve the application!</p>
                )}
            </div>
        );
    }
    
    return (
        <>
            <p className="text-sm text-center text-text-secondary">
                We value your input! Please let us know what you think of this app or if you have any ideas for new features.
            </p>
            <div className="w-full flex flex-col gap-4 bg-surface-primary p-4 border-2 border-border-secondary shadow-pixel">
                <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Type your feedback here..."
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
                        {isSummaryLoading ? 'Analyzing...' : `Analyze with AI (${CREDIT_COSTS.FEEDBACK_ANALYSIS} Credits)`}
                    </button>
                    <button
                        onClick={handleSubmit}
                        onMouseEnter={() => playSound(audioService.playHover)}
                        disabled={!feedback.trim() || isLoading || isSummaryLoading || !isOnline}
                        className="w-full flex items-center justify-center gap-2 p-3 bg-brand-magenta text-white border-2 border-border-primary shadow-sm transition-all hover:bg-brand-yellow hover:text-black disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        <SendIcon className="w-5 h-5" />
                        {isLoading ? 'Submitting...' : (summary ? 'Submit to AI Code Assistant' : 'Submit Feedback')}
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
                    <h4 className="font-press-start text-brand-cyan">AI Summary:</h4>
                    <p className="text-sm">"{summary}"</p>
                </div>
            )}
        </>
    );
};


export const AboutPage: React.FC<AboutPageProps> = ({ onClose, playSound, isOnline }) => {

    return (
        <PageWrapper>
            <PageHeader title="About The Application" onBack={onClose} />
            <main id="main-content" className="w-full max-w-2xl flex-grow overflow-y-auto font-sans px-2 pb-8 space-y-6">
                <Section title="Welcome!" id="welcome">
                    <p>
                        Welcome to the Portable AI Studio, your digital playground! This studio is packed with creative AI tools and technical resources to assist you. Our mission is to turn your brilliant ideas into reality with AI. Powered by Google AI, let's create something amazing together!
                    </p>
                </Section>

                <Section title="AI Tips & Secrets" id="tips">
                    <h4 className="font-press-start text-base text-brand-yellow">Keyboard Shortcuts</h4>
                    <p className="text-xs text-text-secondary">Use these shortcuts to work like a pro! (Ctrl for Windows/Linux, Cmd for Mac)</p>
                    <ul className="list-disc list-inside text-xs space-y-1 pl-2">
                        <li><strong className="text-brand-cyan">Ctrl + Enter:</strong> Generate content on various pages (Image, Song, Sound FX, Video, Feedback Analysis).</li>
                        <li><strong className="text-brand-cyan">Alt + U:</strong> Open the file upload dialog (in Voice Changer, Video Editor).</li>
                        <li><strong className="text-brand-cyan">Alt + P:</strong> Play/Stop the generated audio or song.</li>
                        <li><strong className="text-brand-cyan">Alt + D:</strong> Download your creation.</li>
                        <li><strong className="text-brand-cyan">Alt + S:</strong> Get prompt suggestions from AI (in Image Generator).</li>
                        <li><strong className="text-brand-cyan">Alt + C:</strong> Clear all data on the Image Generator page.</li>
                    </ul>
                     <h4 className="font-press-start text-base text-brand-yellow pt-4">Pro-Tips</h4>
                     <ul className="list-disc list-inside text-xs space-y-1 pl-2">
                        <li><strong>Specificity is Key:</strong> When generating images, try adding details about "style" (e.g., photograph, oil painting, 8-bit) or "perspective" (e.g., wide shot, close-up) for more accurate results.</li>
                        <li><strong>Combine Powers:</strong> Create a character image -> generate a theme song from that image -> create sound effects -> you now have the core assets for a multimedia project!</li>
                     </ul>
                </Section>
                
                <Section title="Installation Guide" id="install-guide">
                    <p>
                        The 'Portable AI Studio' is a Progressive Web App (PWA), which means you can "install" it to your device's home screen like a native app! This provides quick access, a full-screen experience, and some offline capabilities.
                    </p>
                    <h4 className="font-press-start text-sm text-brand-yellow pt-2">For iPhone & iPad (Safari)</h4>
                    <ol className="list-decimal list-inside text-xs space-y-1 pl-2">
                         <InstructionStep icon={<ShareIcon className="w-6 h-6" />}>
                            Tap the <strong>"Share"</strong> button, then select <strong>"Add to Home Screen"</strong>.
                        </InstructionStep>
                    </ol>
                    <h4 className="font-press-start text-sm text-brand-yellow pt-2">For Android (Chrome)</h4>
                    <ol className="list-decimal list-inside text-xs space-y-1 pl-2">
                        <InstructionStep icon={<ThreeDotsIcon className="w-6 h-6" />}>
                            Tap the <strong>menu (three dots)</strong> and select <strong>"Install app"</strong>.
                        </InstructionStep>
                    </ol>
                     <h4 className="font-press-start text-sm text-brand-yellow pt-2">For Desktop (Chrome, Edge)</h4>
                    <ol className="list-decimal list-inside text-xs space-y-1 pl-2">
                        <InstructionStep icon={<InstallIcon className="w-6 h-6" />}>
                            Look for the <strong>Install icon</strong> in the address bar and click <strong>"Install"</strong>.
                        </InstructionStep>
                    </ol>
                </Section>

                <Section title="Feedback" id="feedback">
                    <FeedbackSection playSound={playSound} isOnline={isOnline} />
                </Section>

                <Section title="Frequently Asked Questions (FAQ)" id="faq">
                    <h4 className="font-bold">What technology powers this app?</h4>
                    <p className="text-xs text-text-secondary mb-2">The heart of this app is the Gemini API, an advanced AI model from Google. We use it to analyze, interpret, and generate creative content from your prompts, from static images to videos and sounds.</p>
                     <h4 className="font-bold">Is my data safe?</h4>
                    <p className="text-xs text-text-secondary mb-2">Absolutely. This is a demo application. No personal data, uploaded files, or generated creations are stored on any server. Everything is processed on the fly and is gone when you close the tab.</p>
                </Section>

                <Section title="Disclaimer" id="disclaimer">
                    <p>
                        AI does its best, but sometimes the generated results can be unexpected or not entirely accurate. Please use your judgment when using and sharing your creations. Have fun creating!
                    </p>
                </Section>
            </main>
        </PageWrapper>
    );
}