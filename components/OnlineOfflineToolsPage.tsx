import React, { useState } from 'react';
import * as audioService from '../services/audioService';
import { PageWrapper, PageHeader } from './PageComponents';

// Online Tools
import { WeatherTool } from './tools/WeatherTool';
import { CurrencyConverterTool } from './tools/CurrencyConverterTool';
import { QrCodeGeneratorTool } from './tools/QrCodeGeneratorTool';
import { WeatherIcon } from './icons/WeatherIcon';
import { CurrencyIcon } from './icons/CurrencyIcon';
import { QrCodeIcon } from './icons/QrCodeIcon';
import { PhoneticIcon } from './icons/PhoneticIcon';

// Offline Tools
import { ChiptuneCreatorPage } from './ChiptuneCreatorPage';
import { ImageToSoundPage } from './ImageToSoundPage';
import { AudioToImagePage } from './AudioToImagePage';
import { LocalTextToSpeechPage } from './LocalTextToSpeechPage';
import { LocalSpeechToTextPage } from './LocalSpeechToTextPage';
import { PixelSequencerPage } from './PixelSequencerPage';
import { PixelSynthesizerPage } from './PixelSynthesizerPage';
import { AudioReverserPage } from './tools/AudioReverserPage';
import { AudioToMidiPage } from './tools/AudioToMidiPage';
import { AudioAnalyzerPage } from './tools/AudioAnalyzerPage';
import { AiVoiceAdjusterPage } from './tools/AiVoiceAdjusterPage';
import { OfflineContentDetectorPage } from './tools/OfflineContentDetectorPage';
import { TextToArtPage } from './tools/TextToArtPage';
import { PhoneticTextGeneratorPage } from './tools/PhoneticTextGeneratorPage';
import { AudioTransformIcon } from './icons/AudioTransformIcon';
import { ImageSoundIcon } from './icons/ImageSoundIcon';
import { AudioToImageIcon } from './icons/AudioToImageIcon';
import { TextToSpeechIcon } from './icons/TextToSpeechIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { SequencerIcon } from './icons/SequencerIcon';
import { MusicKeyboardIcon } from './icons/MusicKeyboardIcon';
import { ReverseIcon } from './icons/ReverseIcon';
import { MusicInspectIcon } from './icons/MusicInspectIcon';
import { AnalyzeIcon } from './AnalyzeIcon';
import { VoiceChangerIcon } from './icons/VoiceChangerIcon';
import { AiDetectorIcon } from './AiDetectorIcon';
import { PaletteIcon } from './icons/PaletteIcon';


interface OnlineOfflineToolsPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
}

type ActiveTab = 'online' | 'offline';
type ActiveOnlineTool = 'hub' | 'weather' | 'currency' | 'qr';
type ActiveOfflineTool = 'hub' | 'chiptune' | 'imageToSound' | 'audioToImage' | 'localTts' | 'localStt' | 'sequencer' | 'synthesizer' | 'reverser' | 'midi' | 'analyzer' | 'aiVoice' | 'detector' | 'textToArt' | 'phonetic';


const ToolButton: React.FC<{ icon: React.ReactNode; title: string; description: string; onClick?: () => void; disabled?: boolean; }> = ({ icon, title, description, onClick, disabled }) => (
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
    </div>
);

export const OnlineOfflineToolsPage: React.FC<OnlineOfflineToolsPageProps> = ({ onClose, playSound }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('online');
    const [activeOnlineTool, setActiveOnlineTool] = useState<ActiveOnlineTool>('hub');
    const [activeOfflineTool, setActiveOfflineTool] = useState<ActiveOfflineTool>('hub');
    const isOnline = navigator.onLine;

    const handleLaunchOnline = (tool: ActiveOnlineTool) => {
        playSound(audioService.playClick);
        setActiveOnlineTool(tool);
    };

    const handleLaunchOffline = (tool: ActiveOfflineTool) => {
        playSound(audioService.playClick);
        setActiveOfflineTool(tool);
    };

    const commonOnlineProps = {
        playSound,
        onClose: () => setActiveOnlineTool('hub'),
    };
    
    const commonOfflineProps = {
        playSound,
        onClose: () => setActiveOfflineTool('hub'),
    };

    // --- Render Active Tools ---
    if (activeOnlineTool === 'weather') return <WeatherTool {...commonOnlineProps} />;
    if (activeOnlineTool === 'currency') return <CurrencyConverterTool {...commonOnlineProps} />;
    if (activeOnlineTool === 'qr') return <QrCodeGeneratorTool {...commonOnlineProps} />;


    if (activeOfflineTool === 'chiptune') return <ChiptuneCreatorPage {...commonOfflineProps} />;
    if (activeOfflineTool === 'imageToSound') return <ImageToSoundPage {...commonOfflineProps} />;
    if (activeOfflineTool === 'audioToImage') return <AudioToImagePage {...commonOfflineProps} />;
    if (activeOfflineTool === 'localTts') return <LocalTextToSpeechPage {...commonOfflineProps} />;
    if (activeOfflineTool === 'localStt') return <LocalSpeechToTextPage {...commonOfflineProps} />;
    if (activeOfflineTool === 'sequencer') return <PixelSequencerPage {...commonOfflineProps} />;
    if (activeOfflineTool === 'synthesizer') return <PixelSynthesizerPage {...commonOfflineProps} />;
    if (activeOfflineTool === 'reverser') return <AudioReverserPage {...commonOfflineProps} />;
    if (activeOfflineTool === 'midi') return <AudioToMidiPage {...commonOfflineProps} />;
    if (activeOfflineTool === 'analyzer') return <AudioAnalyzerPage {...commonOfflineProps} />;
    if (activeOfflineTool === 'aiVoice') return <AiVoiceAdjusterPage {...commonOfflineProps} />;
    if (activeOfflineTool === 'detector') return <OfflineContentDetectorPage {...commonOfflineProps} />;
    if (activeOfflineTool === 'textToArt') return <TextToArtPage {...commonOfflineProps} />;
    if (activeOfflineTool === 'phonetic') return <PhoneticTextGeneratorPage {...commonOfflineProps} />;


    const onlineTools = [
        { id: 'weather', icon: <WeatherIcon className="w-16 h-16"/>, title: 'Weather Forecast', description: 'Get the current weather for any city in the world.' },
        { id: 'currency', icon: <CurrencyIcon className="w-16 h-16"/>, title: 'Currency Converter', description: 'Convert between over 150 currencies with live exchange rates.' },
        { id: 'qr', icon: <QrCodeIcon className="w-16 h-16"/>, title: 'QR Code Generator', description: 'Create a QR code from any text or URL instantly.' },
    ];
    
    const offlineTools = [
        { id: 'phonetic', icon: <PhoneticIcon className="w-16 h-16"/>, title: 'Phonetic Text Generator', description: 'Generates a simple, readable phonetic script for text. Works offline.' },
        { id: 'imageToSound', icon: <ImageSoundIcon  className="w-16 h-16"/>, title: 'Image Lab', description: 'Generate sound, music, and art from images without AI.' },
        { id: 'chiptune', icon: <AudioTransformIcon  className="w-16 h-16"/>, title: 'Chiptune Creator', description: 'Transform any audio into a retro 8-bit chiptune sound.' },
        { id: 'reverser', icon: <ReverseIcon className="w-16 h-16"/>, title: 'Audio Reverser', description: 'Play audio backwards for cool effects.' },
        { id: 'midi', icon: <MusicInspectIcon className="w-16 h-16"/>, title: 'Audio to MIDI', description: 'Convert melodies from audio to MIDI notes.' },
        { id: 'analyzer', icon: <AnalyzeIcon className="w-16 h-16"/>, title: 'Audio Analyzer', description: 'Get technical details about your audio.' },
        { id: 'aiVoice', icon: <VoiceChangerIcon className="w-16 h-16"/>, title: 'AI Voice Adjuster', description: 'Adjust your voice to sound like an AI from 0 to 100%.' },
        { id: 'detector', icon: <AiDetectorIcon className="w-16 h-16"/>, title: 'Content Detector', description: 'Heuristically check for AI-generated content.' },
        { id: 'textToArt', icon: <PaletteIcon className="w-16 h-16"/>, title: 'Text to Art', description: 'Create procedural generative art from text.' },
        { id: 'sequencer', icon: <SequencerIcon className="w-16 h-16"/>, title: 'Pixel Sequencer', description: 'Compose 8-bit melodies with a powerful step sequencer.' },
        { id: 'synthesizer', icon: <MusicKeyboardIcon className="w-16 h-16"/>, title: 'Pixel Synthesizer', description: 'Play with an 8-bit synthesizer keyboard.' },
        { id: 'audioToImage', icon: <AudioToImageIcon  className="w-16 h-16"/>, title: 'Audio to Waveform', description: 'Visualize any audio file as a waveform image.' },
        { id: 'localTts', icon: <TextToSpeechIcon  className="w-16 h-16"/>, title: 'Local Text-to-Speech', description: 'Uses your browser\'s built-in voice to read text aloud.' },
        { id: 'localStt', icon: <MicrophoneIcon  className="w-16 h-16"/>, title: 'Local Speech-to-Text', description: 'Uses your browser\'s recognition to transcribe your speech.' },
    ];

    return (
        <PageWrapper>
            <PageHeader title="Online/Offline Tools" onBack={onClose} />
            <main id="main-content" className="w-full max-w-4xl flex-grow flex flex-col px-2 pb-8">
                <div className="flex-shrink-0 w-full flex justify-center border-b-4 border-border-primary mb-6">
                    <button onClick={() => setActiveTab('online')} className={`px-6 py-3 font-press-start text-sm border-b-4 ${activeTab === 'online' ? 'border-brand-yellow text-brand-yellow' : 'border-transparent text-text-secondary'}`}>Online</button>
                    <button onClick={() => setActiveTab('offline')} className={`px-6 py-3 font-press-start text-sm border-b-4 ${activeTab === 'offline' ? 'border-brand-yellow text-brand-yellow' : 'border-transparent text-text-secondary'}`}>Offline</button>
                </div>

                {activeTab === 'online' && (
                    <div className="space-y-6 animate-fadeIn">
                        <p className="text-center font-sans text-sm text-text-secondary">
                            Useful online utilities that require an internet connection. Some use AI and may have a small credit cost.
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
                
                 {activeTab === 'offline' && (
                    <div className="space-y-6 animate-fadeIn">
                        <p className="text-center font-sans text-sm text-text-secondary">
                            Creative tools that run entirely in your browser. No internet or credits needed!
                        </p>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {offlineTools.map(tool => (
                                <ToolButton 
                                    key={tool.id}
                                    icon={tool.icon}
                                    title={tool.title}
                                    description={tool.description}
                                    onClick={() => handleLaunchOffline(tool.id as ActiveOfflineTool)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </PageWrapper>
    );
};