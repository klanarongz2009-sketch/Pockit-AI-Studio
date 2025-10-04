import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { PageWrapper, PageHeader } from './PageComponents';
import { useLanguage } from '../contexts/LanguageContext';
import type { Article } from './ArticlePage';
import * as audioService from '../services/audioService';
import { SpeakerOnIcon } from './icons/SpeakerOnIcon';
import { StopIcon } from './icons/StopIcon';
import { LoadingSpinner } from './LoadingSpinner';

// --- Gemini Live API Helper Functions ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
// --- End Helper Functions ---

let ai: GoogleGenAI | null = null;
const API_KEY = process.env.API_KEY;

if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
    console.error("Gemini API key not found. Text-to-Speech will not work.");
}


interface ArticleViewerPageProps {
    article: Article;
    onClose: () => void;
    playSound: (player: () => void) => void;
}

export const ArticleViewerPage: React.FC<ArticleViewerPageProps> = ({ article, onClose, playSound }) => {
    const { t } = useLanguage();
    const [ttsState, setTtsState] = useState<'idle' | 'connecting' | 'speaking'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const audioSources = useRef(new Set<AudioBufferSourceNode>());
    const nextStartTime = useRef(0);
    
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleStop = useCallback(() => {
        sessionPromiseRef.current?.then(session => session.close());
        sessionPromiseRef.current = null;
        
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            for (const source of audioSources.current.values()) {
                try { source.stop(); } catch(e) {}
            }
            audioSources.current.clear();
            outputAudioContextRef.current.close();
        }
        nextStartTime.current = 0;
        setTtsState('idle');
    }, []);

    useEffect(() => {
        return () => {
            handleStop();
        };
    }, [handleStop]);

    const handleSpeak = useCallback(async () => {
        if (!ai || ttsState !== 'idle' || !isOnline) return;
        
        playSound(audioService.playClick);
        setError(null);
        setTtsState('connecting');

        const textToSpeak = t(article.contentKey);
        const selectedVoice = article.voice;

        try {
            const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            outputAudioContextRef.current = outputCtx;
            const outputNode = outputCtx.createGain();
            outputNode.connect(outputCtx.destination);
            
            audioSources.current.clear();
            nextStartTime.current = 0;

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setTtsState('speaking');
                        sessionPromiseRef.current?.then(session => {
                            session.sendRealtimeInput({ text: textToSpeak });
                        });
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio) {
                            nextStartTime.current = Math.max(nextStartTime.current, outputCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                            const sourceNode = outputCtx.createBufferSource();
                            sourceNode.buffer = audioBuffer;
                            sourceNode.connect(outputNode);
                            sourceNode.addEventListener('ended', () => audioSources.current.delete(sourceNode));
                            sourceNode.start(nextStartTime.current);
                            nextStartTime.current += audioBuffer.duration;
                            audioSources.current.add(sourceNode);
                        }
                        if (msg.serverContent?.turnComplete) {
                            const timeToWait = (nextStartTime.current - outputCtx.currentTime) * 1000 + 300;
                            setTimeout(handleStop, Math.max(0, timeToWait));
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        setError(`Error with Live API: ${e.message}`);
                        handleStop();
                    },
                    onclose: () => {
                        if (ttsState !== 'idle') {
                            setTtsState('idle');
                        }
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } }
                    },
                    systemInstruction: "You are a text-to-speech engine. Your only task is to read the user's text aloud clearly and naturally, and then end the conversation."
                }
            });
        } catch (err) {
            setError(`Could not prepare audio: ${err instanceof Error ? err.message : 'Unknown error'}`);
            setTtsState('idle');
            playSound(audioService.playError);
        }
    }, [article, ttsState, playSound, handleStop, t, isOnline]);
    
    const handleButtonClick = () => {
        if (ttsState !== 'idle') {
            playSound(audioService.playCloseModal);
            handleStop();
        } else {
            handleSpeak();
        }
    };

    let buttonContent;
    if (ttsState === 'connecting') {
        buttonContent = <><LoadingSpinner text="" /><span>{t('articleViewer.connecting')}</span></>;
    } else if (ttsState === 'speaking') {
        buttonContent = <><StopIcon className="w-5 h-5" /><span>{t('articleViewer.stop')}</span></>;
    } else {
        buttonContent = <><SpeakerOnIcon className="w-5 h-5" /><span>{t('articleViewer.readAloud')}</span></>;
    }

    return (
        <PageWrapper>
            <PageHeader title={t(article.titleKey)} onBack={onClose} />
            <main id="main-content" className="w-full max-w-2xl flex-grow overflow-y-auto font-sans pr-2 pb-8 space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div className="text-xs text-brand-light/70">
                        by <span>{article.author}</span>
                    </div>
                    <button
                        onClick={handleButtonClick}
                        disabled={!isOnline && ttsState === 'idle'}
                        className="flex items-center gap-2 p-2 bg-brand-cyan text-black border-2 border-brand-light shadow-sm hover:bg-brand-yellow font-press-start text-xs disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {buttonContent}
                    </button>
                </div>
                {error && <div className="text-red-400 text-sm" role="alert">{error}</div>}
                <div className="text-text-primary whitespace-pre-line leading-relaxed border-t-2 border-brand-light/20 pt-4 mt-4">
                    {t(article.contentKey)}
                </div>
            </main>
        </PageWrapper>
    );
};