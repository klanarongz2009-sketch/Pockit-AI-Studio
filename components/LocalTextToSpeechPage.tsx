import React, { useState, useEffect, useCallback } from 'react';
import { PageWrapper, PageHeader } from './PageComponents';
import * as audioService from '../services/audioService';
import { PlayIcon } from './icons/PlayIcon';
import { StopIcon } from './icons/StopIcon';

interface LocalTextToSpeechPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
}

export const LocalTextToSpeechPage: React.FC<LocalTextToSpeechPageProps> = ({ onClose, playSound }) => {
    const [text, setText] = useState('Hello world! This is a test of the local text-to-speech engine in your browser.');
    const [isSupported, setIsSupported] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
    const [rate, setRate] = useState(1);
    const [pitch, setPitch] = useState(1);
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    useEffect(() => {
        if ('speechSynthesis' in window) {
            setIsSupported(true);
            const getVoices = () => {
                const availableVoices = window.speechSynthesis.getVoices();
                setVoices(availableVoices);
                if (availableVoices.length > 0) {
                    setSelectedVoiceURI(availableVoices.find(v => v.default)?.voiceURI || availableVoices[0].voiceURI);
                }
            };
            // Voices may load asynchronously
            window.speechSynthesis.onvoiceschanged = getVoices;
            getVoices();
        }
    }, []);

    const handleSpeak = useCallback(() => {
        if (!text.trim() || isSpeaking) return;
        playSound(audioService.playClick);
        window.speechSynthesis.cancel(); // Clear queue
        const utterance = new SpeechSynthesisUtterance(text);
        const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    }, [text, isSpeaking, selectedVoiceURI, voices, rate, pitch, playSound]);

    const handleStop = useCallback(() => {
        playSound(audioService.playClick);
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }, [playSound]);
    
    return (
        <PageWrapper>
            <PageHeader title="Local Text to Speech" onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                <p className="text-sm text-center text-text-secondary">Uses your browser's built-in voice synthesis to read text aloud. No internet or credits needed.</p>
                {!isSupported && <p className="text-brand-accent">Sorry, your browser does not support this feature.</p>}
                
                <div className="w-full flex flex-col gap-4 bg-black/40 p-4 border-4 border-border-primary shadow-pixel">
                    <textarea value={text} onChange={e => setText(e.target.value)} className="w-full h-32 p-2 bg-surface-1 text-text-primary border-2 border-border-primary" disabled={!isSupported || isSpeaking} />
                    
                    <div className="space-y-2">
                        <label className="text-xs font-press-start">Voice:</label>
                        <select value={selectedVoiceURI} onChange={e => setSelectedVoiceURI(e.target.value)} className="w-full p-2 bg-surface-1 border-2 border-border-primary" disabled={!isSupported || isSpeaking}>
                            {voices.map(voice => (
                                <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} ({voice.lang})</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                         <label className="text-xs font-press-start flex justify-between"><span>Rate:</span> <span>{rate.toFixed(1)}</span></label>
                        <input type="range" min="0.5" max="2" step="0.1" value={rate} onChange={e => setRate(parseFloat(e.target.value))} className="w-full" disabled={!isSupported || isSpeaking} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-press-start flex justify-between"><span>Pitch:</span> <span>{pitch.toFixed(1)}</span></label>
                        <input type="range" min="0" max="2" step="0.1" value={pitch} onChange={e => setPitch(parseFloat(e.target.value))} className="w-full" disabled={!isSupported || isSpeaking} />
                    </div>
                    
                    <div className="flex gap-4 mt-2">
                        <button onClick={handleSpeak} disabled={!isSupported || !text.trim() || isSpeaking} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-primary text-text-inverted border-2 border-transparent disabled:bg-surface-2">
                            <PlayIcon className="w-5 h-5" /> Speak
                        </button>
                        <button onClick={handleStop} disabled={!isSpeaking} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-accent text-white border-2 border-transparent disabled:bg-surface-2">
                            <StopIcon className="w-5 h-5" /> Stop
                        </button>
                    </div>
                </div>
            </main>
        </PageWrapper>
    );
};
