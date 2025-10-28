import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PageWrapper, PageHeader } from './PageComponents';
import * as audioService from '../services/audioService';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { StopIcon } from './icons/StopIcon';
import { CopyIcon } from './icons/CopyIcon';

interface LocalSpeechToTextPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
}

// FIX: Cast window to `any` to access non-standard SpeechRecognition properties.
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const LocalSpeechToTextPage: React.FC<LocalSpeechToTextPageProps> = ({ onClose, playSound }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(!!SpeechRecognition);
    // FIX: Use `any` for the ref type because SpeechRecognition is not a standard TS type.
    const recognitionRef = useRef<any | null>(null);

    const handleListen = useCallback(() => {
        if (isListening || !isSupported) return;
        playSound(audioService.playClick);
        
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US'; // Default, can be changed

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => {
            setIsListening(false);
            if(recognitionRef.current) recognitionRef.current = null;
        };
        recognition.onerror = () => setIsListening(false);

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                 setTranscript(prev => prev.trim() + ' ' + finalTranscript);
            }
        };
        
        recognition.start();

    }, [isListening, isSupported, playSound]);

    const handleStop = useCallback(() => {
        if (!isListening || !recognitionRef.current) return;
        playSound(audioService.playClick);
        recognitionRef.current.stop();
        setIsListening(false);
    }, [isListening, playSound]);
    
    useEffect(() => {
        // Ensure recognition stops when component unmounts
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const handleCopy = () => {
        if(!transcript) return;
        navigator.clipboard.writeText(transcript.trim());
        playSound(audioService.playSelection);
    };

    return (
        <PageWrapper>
            <PageHeader title="Local Speech to Text" onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                 <p className="text-sm text-center text-text-secondary">Uses your browser's built-in speech recognition. Works best on Chrome. No internet or credits needed.</p>
                {!isSupported && <p className="text-brand-accent">Sorry, your browser does not support this feature.</p>}
                
                <div className="w-full flex gap-4">
                    <button onClick={handleListen} disabled={isListening || !isSupported} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-primary text-text-inverted border-2 border-transparent disabled:bg-surface-2">
                        <MicrophoneIcon className="w-5 h-5" /> Start Listening
                    </button>
                    <button onClick={handleStop} disabled={!isListening} className="w-full flex items-center justify-center gap-2 p-3 bg-brand-accent text-white border-2 border-transparent disabled:bg-surface-2">
                        <StopIcon className="w-5 h-5" /> Stop
                    </button>
                </div>

                <div className="w-full relative">
                     <textarea
                        value={transcript}
                        readOnly
                        placeholder="Your transcribed text will appear here..."
                        className="w-full h-64 p-2 bg-surface-1 text-text-primary border-2 border-border-primary"
                    />
                    <button onClick={handleCopy} className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-md hover:bg-black/80" title="Copy Text">
                        <CopyIcon className="w-5 h-5" />
                    </button>
                </div>
            </main>
        </PageWrapper>
    );
};