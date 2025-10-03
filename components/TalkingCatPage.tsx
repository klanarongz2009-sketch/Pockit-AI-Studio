import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { PageWrapper, PageHeader } from './PageComponents';
import * as audioService from '../services/audioService';
import { LoadingSpinner } from './LoadingSpinner';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { StopIcon } from './icons/StopIcon';
import { SparklesIcon } from './icons/SparklesIcon';

// --- Gemini Live API Helper Functions ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

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

interface TalkingCatPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

interface Message {
    role: 'user' | 'cat';
    text: string;
}

let ai: GoogleGenAI | null = null;
const API_KEY = process.env.API_KEY;

if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
    console.error("Gemini API key not found. Talking Cat will not work.");
}

export const TalkingCatPage: React.FC<TalkingCatPageProps> = ({ onClose, playSound, isOnline }) => {
    const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentMicInput, setCurrentMicInput] = useState('');
    const [currentModelOutput, setCurrentModelOutput] = useState('');
    const [error, setError] = useState<string | null>(null);

    const currentMicInputRef = useRef('');
    const currentModelOutputRef = useRef('');
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioSources = useRef(new Set<AudioBufferSourceNode>());
    const nextStartTime = useRef(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, currentMicInput, currentModelOutput]);

    const stopSession = useCallback(() => {
        setConnectionState('idle');
        
        sessionPromiseRef.current?.then(session => session.close());
        sessionPromiseRef.current = null;
        
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;

        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        
        if (inputAudioContextRef.current?.state !== 'closed') inputAudioContextRef.current?.close();
        if (outputAudioContextRef.current?.state !== 'closed') {
             for (const source of audioSources.current.values()) source.stop();
             audioSources.current.clear();
             outputAudioContextRef.current?.close();
        }
        nextStartTime.current = 0;
    }, []);

    const startSession = useCallback(async () => {
        if (!ai || !isOnline) {
            setError("Talking Cat requires an internet connection.");
            return;
        }
        if (connectionState !== 'idle' && connectionState !== 'error') return;

        playSound(audioService.playClick);
        setConnectionState('connecting');
        setError(null);
        setMessages([]);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const outputNode = outputAudioContextRef.current.createGain();
            outputNode.connect(outputAudioContextRef.current.destination);

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setConnectionState('connected');
                        const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                        const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (event) => {
                            const inputData = event.inputBuffer.getChannelData(0);
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            currentMicInputRef.current += message.serverContent.inputTranscription.text;
                            setCurrentMicInput(currentMicInputRef.current);
                        }
                        if (message.serverContent?.outputTranscription) {
                            currentModelOutputRef.current += message.serverContent.outputTranscription.text;
                            setCurrentModelOutput(currentModelOutputRef.current);
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio) {
                            const outputCtx = outputAudioContextRef.current!;
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

                        if (message.serverContent?.turnComplete) {
                            if (currentMicInputRef.current.trim()) {
                                setMessages(prev => [...prev, { role: 'user', text: currentMicInputRef.current.trim() }]);
                            }
                            if (currentModelOutputRef.current.trim()) {
                                 setMessages(prev => [...prev, { role: 'cat', text: currentModelOutputRef.current.trim() }]);
                            }
                            currentMicInputRef.current = '';
                            currentModelOutputRef.current = '';
                            setCurrentMicInput('');
                            setCurrentModelOutput('');
                        }
                    },
                    onerror: (e: ErrorEvent) => { setError("A connection error occurred."); stopSession(); },
                    onclose: stopSession,
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: "You are a talking cat. You are friendly, a bit sassy, and you should always respond with cat-like mannerisms, such as purring or meowing occasionally. Keep your responses short and playful.",
                }
            });
        } catch (err) {
            setError("Could not access microphone. Please grant permission.");
            stopSession();
        }
    }, [connectionState, isOnline, playSound, stopSession]);

    useEffect(() => {
        return stopSession;
    }, [stopSession]);

    return (
        <PageWrapper>
            <PageHeader title="แมวพูดได้" onBack={onClose} />
            <main id="main-content" className="w-full max-w-2xl flex-grow flex flex-col items-center gap-4 p-2 font-sans">
                <div className="w-full flex-grow flex flex-col bg-black/40 border-4 border-brand-light shadow-pixel">
                    <div className="flex-grow p-4 overflow-y-auto space-y-4">
                        {messages.length === 0 && connectionState === 'idle' && (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <img src="/assets/cat_idle.png" alt="Pixel art cat" className="w-48 h-48" style={{ imageRendering: 'pixelated' }} />
                                <p className="font-press-start text-brand-cyan mt-4">สวัสดี, ทาส!</p>
                                <p className="text-sm text-brand-light/80">พร้อมจะคุยกับฉันรึยัง? เหมียว~</p>
                            </div>
                        )}
                        {messages.map((msg, index) => (
                             <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'cat' && <div className="w-8 h-8 flex-shrink-0 text-brand-cyan"><SparklesIcon/></div>}
                                <div className={`max-w-md p-3 text-sm rounded-lg ${msg.role === 'user' ? 'bg-brand-cyan/80 text-black' : 'bg-surface-primary text-text-primary'}`}>
                                   {msg.text}
                                </div>
                            </div>
                        ))}
                        {currentMicInput && <div className="text-right text-brand-cyan/80 italic">...{currentMicInput}</div>}
                        {currentModelOutput && <div className="text-left text-brand-light/80 italic">...{currentModelOutput}</div>}

                         <div ref={messagesEndRef} />
                    </div>
                    {error && <div role="alert" className="p-2 text-center text-sm text-brand-magenta border-t-2 border-brand-light">{error}</div>}
                    <footer className="flex-shrink-0 p-4 border-t-4 border-brand-light">
                        {connectionState === 'idle' || connectionState === 'error' ? (
                            <button onClick={startSession} disabled={!isOnline} className="w-full flex items-center justify-center gap-3 p-4 bg-brand-cyan text-black border-4 border-brand-light shadow-pixel font-press-start hover:bg-brand-yellow disabled:bg-gray-500">
                                <MicrophoneIcon className="w-6 h-6" />
                                เริ่มคุย
                            </button>
                        ) : connectionState === 'connecting' ? (
                            <div className="w-full flex items-center justify-center">
                                <LoadingSpinner text="กำลังเชื่อมต่อ..." />
                            </div>
                        ) : (
                             <button onClick={stopSession} className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel font-press-start hover:bg-red-500">
                                <StopIcon className="w-6 h-6" />
                                หยุดคุย
                            </button>
                        )}
                    </footer>
                </div>
            </main>
        </PageWrapper>
    );
};