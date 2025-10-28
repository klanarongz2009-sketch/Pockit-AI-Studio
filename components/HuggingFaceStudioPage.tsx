import React, { useState, useMemo } from 'react';
import * as audioService from '../services/audioService';
import { useLanguage } from '../contexts/LanguageContext';
import { HuggingFaceIcon } from './icons/HuggingFaceIcon';
import { ImageSoundIcon } from './icons/ImageSoundIcon';
import { AudioTranscriptionIcon } from './icons/AudioTranscriptionIcon';
import { ChatIcon } from './icons/ChatIcon';
import { HuggingFaceImagePage } from './HuggingFaceImagePage';
import { SpeechToTextPage } from './SpeechToTextPage';
import { HuggingFaceChatPage } from './HuggingFaceChatPage';
import { isHfApiKeyAvailable } from '../services/huggingFaceService';


interface HuggingFaceStudioPageProps {
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

type ActiveTool = 'hub' | 'image' | 'speechToText' | 'chat';

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


export const HuggingFaceStudioPage: React.FC<HuggingFaceStudioPageProps> = ({ playSound, isOnline }) => {
    const [activeTool, setActiveTool] = useState<ActiveTool>('hub');
    const { t } = useLanguage();
    
    const handleLaunchTool = (tool: ActiveTool) => {
        playSound(audioService.playClick);
        setActiveTool(tool);
    };
    
    const tools = useMemo(() => {
        const unavailableMessage = "Feature unavailable: Hugging Face API Key is not configured.";
        return [
            { 
                id: 'image',
                icon: <ImageSoundIcon className="w-16 h-16" />, 
                title: "Image Generation", 
                description: isHfApiKeyAvailable ? "Create images from text prompts using the Stable Diffusion model." : unavailableMessage, 
                onClick: () => handleLaunchTool('image'), 
                disabled: !isOnline || !isHfApiKeyAvailable, 
                beta: true 
            },
            { 
                id: 'speechToText',
                icon: <AudioTranscriptionIcon className="w-16 h-16" />, 
                title: "Speech-to-Text", 
                description: isHfApiKeyAvailable ? "Upload an audio file and transcribe it to text using the Whisper model." : unavailableMessage, 
                onClick: () => handleLaunchTool('speechToText'), 
                disabled: !isOnline || !isHfApiKeyAvailable, 
                beta: true 
            },
            { 
                id: 'chat',
                icon: <ChatIcon className="w-16 h-16" />, 
                title: "AI Chat", 
                description: isHfApiKeyAvailable ? "Chat with popular open-source models like Mistral and Llama 3." : unavailableMessage, 
                onClick: () => handleLaunchTool('chat'), 
                disabled: !isOnline || !isHfApiKeyAvailable, 
                beta: true 
            },
        ];
    }, [isOnline, t]);

    if (activeTool === 'image') {
        return <HuggingFaceImagePage onClose={() => setActiveTool('hub')} playSound={playSound} isOnline={isOnline} />;
    }
    if (activeTool === 'speechToText') {
        return <SpeechToTextPage onClose={() => setActiveTool('hub')} playSound={playSound} isOnline={isOnline} />;
    }
    if (activeTool === 'chat') {
        return <HuggingFaceChatPage onClose={() => setActiveTool('hub')} playSound={playSound} isOnline={isOnline} />;
    }

    return (
        <div className="w-full h-full flex flex-col items-center px-4">
            <h1 className="text-3xl sm:text-4xl text-brand-yellow text-center mb-6 flex items-center gap-4">
                <HuggingFaceIcon className="w-10 h-10" /> Hugging Face Studio
            </h1>
            
            <p className="text-sm text-center text-brand-light/80 mb-6 max-w-2xl">
                Explore a suite of tools powered by popular open-source models from the Hugging Face community.
            </p>

            <div className="w-full max-w-4xl flex-grow font-sans">
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tools.map(tool => <ToolButton key={tool.id} {...tool} />)}
                </section>
            </div>
        </div>
    );
};