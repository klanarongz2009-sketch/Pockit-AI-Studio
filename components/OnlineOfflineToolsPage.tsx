import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as audioService from '../services/audioService';
import { LoadingSpinner } from './LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { PlayIcon } from './icons/PlayIcon';
import { StopIcon } from './icons/StopIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { SoundEffectParameters, MidiNote } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import { CopyIcon } from './icons/CopyIcon';
import { AudioVisualizer } from './icons/AudioVisualizer';
import { AudioTransformIcon } from './icons/AudioTransformIcon';
import { ImageSoundIcon } from './icons/ImageSoundIcon';
import { ReverseIcon } from './icons/ReverseIcon';
import { MusicKeyboardIcon } from './icons/MusicKeyboardIcon';
import { SoundWaveIcon } from './icons/SoundWaveIcon';
import type { LocalAnalysisResult } from '../services/audioService';
import { PageWrapper, PageHeader } from './PageComponents';
import { AiDetectorIcon } from './AiDetectorIcon';
import { VoiceChangerIcon } from './icons/VoiceChangerIcon';
import { useCredits } from '../contexts/CreditContext';
import { AudioToImageIcon } from './icons/AudioToImageIcon';
import { TextToSpeechIcon } from './icons/TextToSpeechIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { AudioToImagePage } from './AudioToImagePage';
import { LocalTextToSpeechPage } from './LocalTextToSpeechPage';
import { LocalSpeechToTextPage } from './LocalSpeechToTextPage';

// New Imports for Online Tools
import { WeatherTool } from './tools/WeatherTool';
import { CurrencyConverterTool } from './tools/CurrencyConverterTool';
import { QrCodeGeneratorTool } from './tools/QrCodeGeneratorTool';
import { WeatherIcon } from './icons/WeatherIcon';
import { CurrencyIcon } from './icons/CurrencyIcon';
import { QrCodeIcon } from './icons/QrCodeIcon';

// This file is now a hub for both Online and Offline non-AI tools.

interface OnlineOfflineToolsPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
}

type ActiveTab = 'offline' | 'online';
type ActiveOfflineTool = 'hub' | 'chiptune' | 'reverser' | 'midi' | 'analyzer' | 'imagelab' | 'detector' | 'texttoart' | 'voiceadjuster' | 'audioToImage' | 'localtts' | 'localsst';
type ActiveOnlineTool = 'hub' | 'weather' | 'currency' | 'qr';

const ToolButton: React.FC<{ icon: React.ReactNode; title: string; description: string; onClick?: () => void; disabled?: boolean; beta?: boolean; }> = ({ icon, title, description, onClick, disabled, beta }) => (
    <div className="relative group h-full">
        <button
            onClick={onClick}
            disabled={disabled}
            className="w-full h-full flex items-start text-left gap-4 p-4 bg-black/40 border-4 border-brand-light shadow-pixel transition-all hover:bg-brand-cyan/20 hover:border-brand-yellow hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_#f0f0f0] active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Open ${title}`}
        >
            <div className="flex-shrink-0 w-16 h-16 text-brand-cyan">{icon}</div>
            <div className="font-sans">
                <h3 className="font-press-start text-base md:text-lg text-brand-yellow">{title}</h3>
                <p className="text-xs text-brand-light/80 mt-1">{description}</p>
            </div>
        </button>
         {beta && (
            <div className="absolute top-2 right-2 bg-brand-magenta text-white text-[8px] font-press-start px-1 border border-black pointer-events-none" aria-hidden="true">BETA</div>
        )}
    </div>
);

export const OnlineOfflineToolsPage: React.FC<OnlineOfflineToolsPageProps> = ({ onClose, playSound }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<ActiveTab>('offline');
    const [activeOfflineTool, setActiveOfflineTool] = useState<ActiveOfflineTool>('hub');
    const [activeOnlineTool, setActiveOnlineTool] = useState<ActiveOnlineTool>('hub');
    const { addCredits } = useCredits();
    const isOnline = navigator.onLine;

    const handleLaunchOffline = (tool: ActiveOfflineTool) => {
        playSound(audioService.playClick);
        setActiveOfflineTool(tool);
    };

    const handleLaunchOnline = (tool: ActiveOnlineTool) => {
        playSound(audioService.playClick);
        setActiveOnlineTool(tool);
    };

    const commonOfflineProps = {
        playSound,
        t,
        onClose: () => setActiveOfflineTool('hub'),
        addCredits,
    };
    
    const commonOnlineProps = {
        playSound,
        onClose: () => setActiveOnlineTool('hub'),
    };

    // --- Render specific tool pages ---
    if (activeOfflineTool === 'audioToImage') return <AudioToImagePage onClose={() => setActiveOfflineTool('hub')} playSound={playSound} />;
    if (activeOfflineTool === 'localtts') return <LocalTextToSpeechPage onClose={() => setActiveOfflineTool('hub')} playSound={playSound} />;
    if (activeOfflineTool === 'localsst') return <LocalSpeechToTextPage onClose={() => setActiveOfflineTool('hub')} playSound={playSound} />;
    
    if (activeOnlineTool === 'weather') return <WeatherTool {...commonOnlineProps} />;
    if (activeOnlineTool === 'currency') return <CurrencyConverterTool {...commonOnlineProps} />;
    if (activeOnlineTool === 'qr') return <QrCodeGeneratorTool {...commonOnlineProps} />;

    const offlineTools = [
        { id: 'chiptune', icon: <AudioTransformIcon />, nameKey: 'offlineAiPage.hub.chiptune.name', descKey: 'offlineAiPage.hub.chiptune.description' },
        { id: 'reverser', icon: <ReverseIcon />, nameKey: 'offlineAiPage.hub.reverser.name', descKey: 'offlineAiPage.hub.reverser.description' },
        { id: 'midi', icon: <MusicKeyboardIcon />, nameKey: 'offlineAiPage.hub.midi.name', descKey: 'offlineAiPage.hub.midi.description', beta: true },
        { id: 'analyzer', icon: <SoundWaveIcon />, nameKey: 'offlineAiPage.hub.analyzer.name', descKey: 'offlineAiPage.hub.analyzer.description' },
        { id: 'imagelab', icon: <ImageSoundIcon />, nameKey: 'offlineAiPage.imageLab.title', descKey: 'offlineAiPage.imageLab.description' },
        { id: 'detector', icon: <AiDetectorIcon />, nameKey: 'offlineAiPage.hub.detector.name', descKey: 'offlineAiPage.hub.detector.description' },
        { id: 'texttoart', icon: <SparklesIcon />, nameKey: 'offlineAiPage.hub.textToImage.name', descKey: 'offlineAiPage.hub.textToImage.description' },
        { id: 'voiceadjuster', icon: <VoiceChangerIcon />, nameKey: 'offlineAiPage.aiVoiceAdjuster.title', descKey: 'offlineAiPage.aiVoiceAdjuster.description', beta: true },
        { id: 'audioToImage', icon: <AudioToImageIcon />, nameKey: 'offlineAiPage.hub.audioToImage.name', descKey: 'offlineAiPage.hub.audioToImage.description' },
        { id: 'localtts', icon: <TextToSpeechIcon />, nameKey: 'offlineAiPage.hub.localtts.name', descKey: 'offlineAiPage.hub.localtts.description' },
        { id: 'localsst', icon: <MicrophoneIcon />, nameKey: 'offlineAiPage.hub.localsst.name', descKey: 'offlineAiPage.hub.localsst.description' },
    ];
    
    const onlineTools = [
        { id: 'weather', icon: <WeatherIcon />, title: 'Weather Forecast', description: 'Get the current weather for any city in the world.' },
        { id: 'currency', icon: <CurrencyIcon />, title: 'Currency Converter', description: 'Convert between over 150 currencies with live exchange rates.' },
        { id: 'qr', icon: <QrCodeIcon />, title: 'QR Code Generator', description: 'Create a QR code from any text or URL instantly.' },
    ];

    return (
        <PageWrapper>
            <PageHeader title="Online/Offline Tools" onBack={onClose} />
            <main id="main-content" className="w-full max-w-4xl flex-grow flex flex-col px-2 pb-8">
                <div className="flex-shrink-0 w-full mb-6 flex justify-center gap-2 font-press-start">
                    <button onClick={() => setActiveTab('offline')} className={`px-6 py-3 border-4 ${activeTab === 'offline' ? 'bg-brand-yellow text-black border-black' : 'bg-surface-primary border-border-primary'}`}>
                        Offline Tools
                    </button>
                    <button onClick={() => setActiveTab('online')} className={`px-6 py-3 border-4 ${activeTab === 'online' ? 'bg-brand-yellow text-black border-black' : 'bg-surface-primary border-border-primary'}`}>
                        Online Tools
                    </button>
                </div>
                
                {activeTab === 'offline' && (
                    <div className="space-y-6 animate-fadeIn">
                        <p className="text-center font-sans text-sm text-text-secondary">{t('offlineAiPage.description')}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {offlineTools.map(tool => (
                                <ToolButton 
                                    key={tool.id}
                                    icon={tool.icon}
                                    title={t(tool.nameKey)}
                                    description={t(tool.descKey)}
                                    onClick={() => handleLaunchOffline(tool.id as ActiveOfflineTool)}
                                    beta={tool.beta}
                                />
                            ))}
                        </div>
                    </div>
                )}
                
                {activeTab === 'online' && (
                    <div className="space-y-6 animate-fadeIn">
                        <p className="text-center font-sans text-sm text-text-secondary">
                            Useful online utilities that require an internet connection but don't use generative AI.
                        </p>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {onlineTools.map(tool => (
                                <ToolButton 
                                    key={tool.id}
                                    icon={tool.icon}
                                    title={tool.title}
                                    description={tool.description}
                                    onClick={() => handleLaunchOnline(tool.id as ActiveOnlineTool)}
                                    disabled={!isOnline}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </PageWrapper>
    );
};