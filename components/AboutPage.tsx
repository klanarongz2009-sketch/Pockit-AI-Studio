import React, { useState, useCallback } from 'react';
import JSZip from 'jszip';
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
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadSource = useCallback(async () => {
        if (isDownloading) return;
        playSound(audioService.playDownload);
        setIsDownloading(true);

        const fileList = [
            'index.html', 'index.tsx', 'metadata.json', 'manifest.json', 'sw.js', 'README.md', 'App.tsx',
            'i18n/en.json', 'i18n/th.json',
            'services/aiModels.ts', 'services/assetLoader.ts', 'services/audioService.ts', 'services/galleryService.ts', 'services/geminiService.ts', 'services/notificationService.ts', 'services/preferenceService.ts', 'services/translationService.ts',
            'contexts/CreditContext.tsx', 'contexts/LanguageContext.tsx', 'contexts/ThemeContext.tsx',
            'components/AboutPage.tsx', 'components/AdPlayer.tsx', 'components/AiBugSquasherPage.tsx', 'components/AiChatPage.tsx', 'components/AiDetectorPage.tsx', 'components/AiOraclePage.tsx', 'components/AnalyzeMediaPage.tsx', 'components/AppPublisherPage.tsx', 'components/ArchivePage.tsx', 'components/ArticlePage.tsx', 'components/ArticleViewerPage.tsx', 'components/ArtGalleryPage.tsx', 'components/AsteroidShooterPage.tsx', 'components/BellIcon.tsx', 'components/BellOffIcon.tsx', 'components/BrickBreakerGame.tsx', 'components/ChiptuneCreatorPage.tsx', 'components/ColorFinderPage.tsx', 'components/FileChatPage.tsx', 'components/GlobalLayout.tsx', 'components/GuessThePromptPage.tsx', 'components/ImageDisplay.tsx', 'components/ImageGeneratorPage.tsx', 'components/ImageToCodePage.tsx', 'components/ImageToSoundPage.tsx', 'components/InstallGuidePage.tsx', 'components/Intro.tsx', 'components/JumpingGame.tsx', 'components/LoadingSpinner.tsx', 'components/LoginPage.tsx', 'components/MagicButtonPage.tsx', 'components/MediaRecorderPage.tsx', 'components/MediaToSongPage.tsx', 'components/Minigame.tsx', 'components/MinigameHubPage.tsx', 'components/MinesweeperPage.tsx', 'components/Modal.tsx', 'components/ModelInfoPage.tsx', 'components/MusicAndSoundPage.tsx', 'components/MusicMemoryGamePage.tsx', 'components/NotificationControl.tsx', 'components/OfflineAiPage.tsx', 'components/PageComponents.ts', 'components/PetGame.tsx', 'components/PixelSequencerPage.tsx', 'components/PixelSynthesizerPage.tsx', 'components/PlatformerGame.tsx', 'components/SettingsPage.tsx', 'components/SnakeGame.tsx', 'components/SongSearchPage.tsx', 'components/SpinningWheel.tsx', 'components/TextToSongPage.tsx', 'components/TextToSpeechPage.tsx', 'components/TicTacToePage.tsx', 'components/TranslatorPage.tsx', 'components/UpdateInfoPage.tsx', 'components/VideoEditorPage.tsx', 'components/VoiceChangerPage.tsx', 'components/WordMatchPage.tsx', 'components/CalculatorPage.tsx', 'components/icon.svg', 'components/AiDetectorIcon.tsx', 'components/AnalyzeIcon.tsx', 'components/ArticleIcon.tsx',
            'components/icons/ArchiveIcon.tsx', 'components/icons/AsteroidShooterIcon.tsx', 'components/icons/AudioTransformIcon.tsx', 'components/icons/AudioVisualizer.tsx', 'components/icons/BookmarkIcon.tsx', 'components/icons/BrickBreakerIcon.tsx', 'components/icons/BugIcon.tsx', 'components/icons/CalculatorIcon.tsx', 'components/icons/CalculatorPage.tsx', 'components/icons/ChatIcon.tsx', 'components/icons/CodeIcon.tsx', 'components/icons/CoinsIcon.tsx', 'components/icons/ColorPickerIcon.tsx', 'components/icons/CopyIcon.tsx', 'components/icons/CropIcon.tsx', 'components/icons/DeviceIcon.tsx', 'components/icons/DeviceDetailsPage.tsx', 'components/icons/DownloadIcon.tsx', 'components/icons/EarnCreditsModal.tsx', 'components/icons/FaceLostIcon.tsx', 'components/icons/FacePlayingIcon.tsx', 'components/icons/FaceWonIcon.tsx', 'components/icons/FeedbackIcon.tsx', 'components/icons/FileChatIcon.tsx', 'components/icons/FilmMusicIcon.tsx', 'components/icons/FlagCheekIcon.tsx', 'components/icons/GalleryIcon.tsx', 'components/icons/GamepadIcon.tsx', 'components/icons/GuessThePromptIcon.tsx', 'components/icons/HeartFilledIcon.tsx', 'components/icons/HeartIcon.tsx', 'components/icons/ImageSoundIcon.tsx', 'components/icons/InfoIcon.tsx', 'components/icons/InstallIcon.tsx', 'components/icons/JumpingIcon.tsx', 'components/icons/LinkIcon.tsx', 'components/icons/MagicButtonIcon.tsx', 'components/icons/MenuIcon.tsx', 'components/icons/MicrophoneIcon.tsx', 'components/icons/MineCheekIcon.tsx', 'components/icons/MinesweeperIcon.tsx', 'components/icons/MoonIcon.tsx', 'components/icons/MusicAndSoundIcon.tsx', 'components/icons/MusicInspectIcon.tsx', 'components/icons/MusicKeyboardIcon.tsx', 'components/icons/MusicNoteIcon.tsx', 'components/icons/OfflineAiIcon.tsx', 'components/icons/OracleIcon.tsx', 'components/icons/PaletteIcon.tsx', 'components/icons/PetIcon.tsx', 'components/icons/PlatformerIcon.tsx', 'components/icons/PlayIcon.tsx', 'components/icons/PlusSquareIcon.tsx', 'components/icons/PublishIcon.tsx', 'components/icons/RecordIcon.tsx', 'components/icons/RegenerateIcon.tsx', 'components/icons/ReverseIcon.tsx', 'components/icons/SearchIcon.tsx', 'components/icons/SearchMusicIcon.tsx', 'components/icons/SendIcon.tsx', 'components/icons/SequencerIcon.tsx', 'components/icons/SettingsIcon.tsx', 'components/icons/ShareIcon.tsx', 'components/icons/SnakeIcon.tsx', 'components/icons/SoundWaveIcon.tsx', 'components/icons/SparklesIcon.tsx', 'components/icons/SpeakerOffIcon.tsx', 'components/icons/SpeakerOnIcon.tsx', 'components/icons/SpriteSheetIcon.tsx', 'components/icons/StopIcon.tsx', 'components/icons/SubtitlesIcon.tsx', 'components/icons/SunIcon.tsx', 'components/icons/TextMusicIcon.tsx', 'components/icons/TextToSpeechIcon.tsx', 'components/icons/ThumbsDownIcon.tsx', 'components/icons/ThumbsUpIcon.tsx', 'components/icons/TicTacToeIcon.tsx', 'components/icons/TranslateIcon.tsx', 'components/icons/TrashIcon.tsx', 'components/icons/UpdateIcon.tsx', 'components/icons/UploadIcon.tsx', 'components/icons/VideoEditorIcon.tsx', 'components/icons/VoiceChangerIcon.tsx', 'components/icons/WordMatchIcon.tsx', 'components/icons/XIcon.tsx', 'VideoEditorPage.tsx', 'VoiceChangerPage.tsx'
        ];

        try {
            const zip = new JSZip();
            const fetchPromises = fileList.map(filePath =>
                fetch(`/${filePath}`)
                    .then(res => {
                        if (!res.ok) throw new Error(`Failed to fetch ${filePath}`);
                        // Handle binary files like icons if necessary, but for source code text is fine
                        return res.text();
                    })
                    .then(content => {
                        zip.file(filePath, content);
                    })
            );

            await Promise.all(fetchPromises);

            const content = await zip.generateAsync({ type: "blob" });
            
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'ai-apps-source.zip';
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error("Failed to create source code zip:", error);
            alert("Sorry, there was an error creating the download file.");
        } finally {
            setIsDownloading(false);
        }
    }, [isDownloading, playSound]);

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
                     <button onClick={handleDownloadSource} disabled={isDownloading} className="inline-block mt-2 p-2 bg-brand-yellow text-black border-2 border-black font-press-start text-xs hover:bg-brand-lime disabled:bg-gray-500 disabled:cursor-wait">
                        <InstructionStep icon={isDownloading ? <LoadingSpinner text=""/> : <DownloadIcon className="w-6 h-6" />}>
                           {isDownloading ? 'กำลังสร้าง ZIP...' : t('about.install.rom.button')}
                        </InstructionStep>
                    </button>
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