


import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import * as audioService from '../services/audioService';
import { PageHeader, PageWrapper } from './PageComponents';
import { PlayIcon } from './icons/PlayIcon';
import { StopIcon } from './icons/StopIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { LoadingSpinner } from './LoadingSpinner';
import { useCredits } from '../contexts/CreditContext';

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

interface TextToSpeechPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
}

const isLiveApiSupported = !!(window.AudioContext || (window as any).webkitAudioContext);

const PREBUILT_VOICES = [
    { id: 'Zephyr', name: 'Zephyr (Friendly)' },
    { id: 'Puck', name: 'Puck (Playful)' },
    { id: 'Charon', name: 'Charon (Deep)' },
    { id: 'Kore', name: 'Kore (Calm)' },
    { id: 'Fenrir', name: 'Fenrir (Assertive)' },
];

let ai: GoogleGenAI | null = null;
const API_KEY = process.env.API_KEY;

if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
    console.error("Gemini API key not found. Text-to-Speech will not work.");
}


export const TextToSpeechPage: React.FC<TextToSpeechPageProps> = ({ onClose, playSound }) => {
    const [text, setText] = useState('สวัสดี! ยินดีต้อนรับสู่จักรวาล AI สร้างสรรค์');
    const [selectedVoice, setSelectedVoice] = useState(PREBUILT_VOICES[0].id);
    const [ttsState, setTtsState] = useState<'idle' | 'connecting' | 'speaking'>('idle');
    const [error, setError] = useState<string | null>(null);
    const { addCredits } = useCredits();

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const audioSources = useRef(new Set<AudioBufferSourceNode>());
    const nextStartTime = useRef(0);

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
        if (!isLiveApiSupported) {
            setError("ขออภัย เบราว์เซอร์ของคุณไม่รองรับเทคโนโลยีเสียงที่จำเป็นสำหรับฟีเจอร์นี้");
        }
        return () => {
            handleStop();
        };
    }, [handleStop]);


    const handleSpeak = useCallback(async () => {
        const trimmedText = text.trim();
        if (!trimmedText || ttsState !== 'idle' || !isLiveApiSupported || !ai) return;
        
        const creditsToAdd = trimmedText.length;
        // FIX: addCredits is now async
        await addCredits(creditsToAdd);
        
        playSound(audioService.playClick);
        setError(null);
        setTtsState('connecting');

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
                        session.sendRealtimeInput({ text: trimmedText });
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
                    setError(`เกิดข้อผิดพลาดกับ Live API: ${e.message}`);
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

    }, [text, ttsState, selectedVoice, handleStop, playSound, addCredits]);

    const handleClose = () => {
        handleStop();
        onClose();
    };

    return (
        <PageWrapper>
            <PageHeader title="แปลงข้อความเป็นเสียง AI" onBack={handleClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                <p className="text-sm text-center text-brand-light/80">
                    พิมพ์ข้อความของคุณแล้ว AI จะอ่านให้ฟังด้วยเสียงที่เป็นธรรมชาติ! (ขับเคลื่อนโดย Gemini Live API)
                </p>

                {error && <div role="alert" className="w-full p-3 bg-brand-magenta/20 border-2 border-brand-magenta text-center text-sm text-brand-light">{error}</div>}

                <div className="w-full flex flex-col gap-4 bg-black/40 p-4 border-4 border-brand-light shadow-pixel">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="ป้อนข้อความที่นี่..."
                        className="w-full h-32 p-2 bg-brand-light text-black rounded-none border-2 border-black focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-y"
                        disabled={!isLiveApiSupported || ttsState !== 'idle'}
                    />
                    
                    <div className="flex flex-col gap-2">
                        <label htmlFor="voice-select" className="text-xs font-press-start text-brand-cyan">เลือกเสียง:</label>
                        <select
                            id="voice-select"
                            value={selectedVoice}
                            onChange={(e) => { playSound(audioService.playSelection); setSelectedVoice(e.target.value); }}
                            className="w-full p-2 bg-brand-light text-black border-2 border-black"
                            disabled={!isLiveApiSupported || ttsState !== 'idle'}
                        >
                            {PREBUILT_VOICES.map(voice => (
                                <option key={voice.id} value={voice.id}>
                                    {voice.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-4 mt-2">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleSpeak}
                                disabled={!text.trim() || ttsState !== 'idle' || !isLiveApiSupported}
                                className="w-full flex items-center justify-center gap-3 p-3 bg-brand-lime text-black border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                {ttsState === 'connecting' ? <LoadingSpinner text="" /> : <PlayIcon className="w-5 h-5"/>}
                                {ttsState === 'connecting' ? 'กำลังเชื่อมต่อ...' : 'พูด'}
                            </button>
                            <button
                                onClick={handleStop}
                                onMouseEnter={() => playSound(audioService.playHover)}
                                disabled={ttsState === 'idle'}
                                className="w-full flex items-center justify-center gap-3 p-3 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                <StopIcon className="w-5 h-5"/> หยุด
                            </button>
                        </div>
                        <div>
                            <button
                                disabled={true}
                                className="w-full flex items-center justify-center gap-3 p-3 bg-gray-500 text-black border-4 border-brand-light shadow-pixel text-base cursor-not-allowed"
                            >
                                <DownloadIcon className="w-5 h-5"/>
                                ดาวน์โหลด
                            </button>
                             <p className="text-xs text-center text-brand-light/60 mt-2">
                                (การดาวน์โหลดไม่รองรับในเวอร์ชันสาธิตนี้)
                             </p>
                        </div>
                    </div>
                </div>
            </main>
        </PageWrapper>
    );
};