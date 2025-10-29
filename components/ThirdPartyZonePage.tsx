import React, { useState, useMemo } from 'react';
import * as audioService from '../services/audioService';
import { PageWrapper, PageHeader } from './PageComponents';
import { ChatIcon } from './icons/ChatIcon';
import { GalleryIcon } from './icons/GalleryIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { MemeGeneratorPage } from './MemeGeneratorPage';
import { AssemblyAiSpeechToTextPage } from './AssemblyAiSpeechToTextPage';
import { OpenAiChatPage } from './OpenAiChatPage';


interface ThirdPartyZonePageProps {
    playSound: (player: () => void) => void;
    isOnline: boolean;
    // FIX: Add onClose to the props interface.
    onClose: () => void;
}

type ActiveTool = 'hub' | 'meme' | 's2t' | 'chat';

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


export const ThirdPartyZonePage: React.FC<ThirdPartyZonePageProps> = ({ playSound, isOnline, onClose }) => {
    const [activeTool, setActiveTool] = useState<ActiveTool>('hub');
    
    const handleLaunchTool = (tool: ActiveTool) => {
        playSound(audioService.playClick);
        setActiveTool(tool);
    };
    
    const tools = useMemo(() => [
        { 
            id: 'chat',
            icon: <ChatIcon className="w-16 h-16" />, 
            title: "OpenAI Chat", 
            description: "Chat with powerful models from OpenAI like GPT-4o. Requires an OpenAI API Key.",
            onClick: () => handleLaunchTool('chat'), 
            disabled: !isOnline, 
            beta: true 
        },
        { 
            id: 'meme',
            icon: <GalleryIcon className="w-16 h-16" />, 
            title: "Meme Generator", 
            description: "Create memes using popular templates from the Imgflip API. Fun and fast.",
            onClick: () => handleLaunchTool('meme'), 
            disabled: !isOnline, 
        },
        { 
            id: 's2t',
            icon: <MicrophoneIcon className="w-16 h-16" />, 
            title: "Speech-to-Text", 
            description: "Transcribe audio files with high accuracy using the AssemblyAI API. Requires an AssemblyAI API Key.",
            onClick: () => handleLaunchTool('s2t'), 
            disabled: !isOnline, 
            beta: true 
        },
    ], [isOnline]);

    if (activeTool === 'chat') {
        return <OpenAiChatPage onClose={() => setActiveTool('hub')} playSound={playSound} isOnline={isOnline} />;
    }
    if (activeTool === 'meme') {
        return <MemeGeneratorPage onClose={() => setActiveTool('hub')} playSound={playSound} isOnline={isOnline} />;
    }
    if (activeTool === 's2t') {
        return <AssemblyAiSpeechToTextPage onClose={() => setActiveTool('hub')} playSound={playSound} isOnline={isOnline} />;
    }

    return (
        <PageWrapper>
             <PageHeader title="3rd Party AI Zone" onBack={onClose} />
             <main id="main-content" className="w-full max-w-4xl flex-grow flex flex-col items-center gap-6 font-sans">
                <p className="text-sm text-center text-brand-light/80 max-w-2xl">
                    Explore a suite of tools powered by other leading APIs from around the web. Note: These tools may require their own separate API keys to function.
                </p>
                <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tools.map(tool => <ToolButton key={tool.id} {...tool} />)}
                </section>
            </main>
        </PageWrapper>
    );
};