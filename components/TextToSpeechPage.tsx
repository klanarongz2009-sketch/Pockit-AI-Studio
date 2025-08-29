

import React, { useState, useEffect, useCallback } from 'react';
import * as audioService from '../services/audioService';
import { PageHeader, PageWrapper } from './PageComponents';
import { PlayIcon } from './icons/PlayIcon';
import { StopIcon } from './icons/StopIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { useCredits } from '../contexts/CreditContext';

interface TextToSpeechPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
}

const isSpeechSynthesisSupported = !!window.speechSynthesis;
const isGetDisplayMediaSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);

export const TextToSpeechPage: React.FC<TextToSpeechPageProps> = ({ onClose, playSound }) => {
    const [text, setText] = useState('สวัสดี! ยินดีต้อนรับสู่ Ai Studio แบบพกพา');
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
    const [pitch, setPitch] = useState(1);
    const [rate, setRate] = useState(1);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [autoDetectLang, setAutoDetectLang] = useState(true);
    const { addCredits } = useCredits();

    const populateVoiceList = useCallback(() => {
        const newVoices = window.speechSynthesis.getVoices();
        if (newVoices.length === 0) return;
        setVoices(newVoices);
        // Set default voice to the first Thai voice found, or the first available voice
        const defaultVoice = newVoices.find(v => v.lang.startsWith('th')) || newVoices[0];
        if (defaultVoice) {
            setSelectedVoiceURI(defaultVoice.voiceURI);
        }
    }, []);

    useEffect(() => {
        if (!isSpeechSynthesisSupported) {
            setError("ขออภัย เบราว์เซอร์ของคุณไม่รองรับการแปลงข้อความเป็นเสียง");
            return;
        }
        
        populateVoiceList();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = populateVoiceList;
        }

        return () => {
            if (isSpeechSynthesisSupported) {
                window.speechSynthesis.cancel();
            }
        };
    }, [populateVoiceList]);

    const handleSpeak = () => {
        const trimmedText = text.trim();
        if (!trimmedText || isSpeaking) return;
        
        addCredits(trimmedText.length); // Add credits based on character count
        playSound(audioService.playClick);
        setError(null);
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(trimmedText);
        
        if (!autoDetectLang) {
            const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
                utterance.lang = selectedVoice.lang;
            }
        }
        // If autoDetectLang is true, we don't set voice or lang, letting the browser decide.

        utterance.pitch = pitch;
        utterance.rate = rate;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
            if (e.error === 'canceled' || e.error === 'interrupted') {
                setIsSpeaking(false);
                return;
            }

            console.error('SpeechSynthesis Error:', e);
            let errorMessage = `เกิดข้อผิดพลาดกับระบบเสียง (${e.error})`;
            setError(errorMessage);
            setIsSpeaking(false);
        };
        
        window.speechSynthesis.speak(utterance);
    };

    const handleStop = () => {
        playSound(audioService.playClick);
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    };

    const handleDownload = async () => {
        const trimmedText = text.trim();
        if (!trimmedText || isSpeaking || isDownloading) return;

        if (!isGetDisplayMediaSupported) {
            setError("เบราว์เซอร์ของคุณไม่รองรับการบันทึกเสียงเพื่อดาวน์โหลด");
            return;
        }

        playSound(audioService.playClick);
        setError(null);
        setIsDownloading(true);

        try {
            setError('โปรดเลือกแท็บนี้และเปิด "แชร์เสียงของแท็บ" เพื่อบันทึก');

            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
            });

            setError(null); // Clear instruction message

            const [audioTrack] = stream.getAudioTracks();
            if (!audioTrack) {
                stream.getTracks().forEach(track => track.stop());
                throw new Error("ไม่พบแทร็กเสียง โปรดตรวจสอบว่าคุณได้แชร์เสียงของแท็บแล้ว");
            }

            const audioStream = new MediaStream([audioTrack]);
            const recorder = new MediaRecorder(audioStream);
            const chunks: Blob[] = [];

            recorder.ondataavailable = (event) => chunks.push(event.data);
            
            const downloadPromise = new Promise<void>((resolve, reject) => {
                recorder.onstop = () => {
                    try {
                        const mimeType = recorder.mimeType || 'audio/webm';
                        const blob = new Blob(chunks, { type: mimeType });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `speech.webm`;
                        document.body.appendChild(a);
                        a.click();
                        URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                };
            
                const utterance = new SpeechSynthesisUtterance(trimmedText);
                if (!autoDetectLang) {
                    const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
                    if (selectedVoice) utterance.voice = selectedVoice;
                }
                utterance.pitch = pitch;
                utterance.rate = rate;

                utterance.onend = () => {
                    setTimeout(() => {
                        if (recorder.state === "recording") recorder.stop();
                        stream.getTracks().forEach(track => track.stop());
                    }, 200);
                };
                utterance.onerror = (e) => {
                     if (recorder.state === "recording") recorder.stop();
                     stream.getTracks().forEach(track => track.stop());
                     reject(new Error(`Speech synthesis error: ${e.error}`));
                };
                
                recorder.start();
                window.speechSynthesis.speak(utterance);
            });
            
            await downloadPromise;

        } catch (err) {
            playSound(audioService.playError);
            const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกเสียง';
            setError(msg.includes('Permission denied') ? 'คุณต้องอนุญาตให้แชร์เสียงของแท็บเพื่อดาวน์โหลด' : msg);
        } finally {
            setIsDownloading(false);
        }
    };


    const handleClose = () => {
        if (isSpeechSynthesisSupported) {
            window.speechSynthesis.cancel();
        }
        onClose();
    };

    return (
        <PageWrapper>
            <PageHeader title="แปลงข้อความเป็นเสียง AI" onBack={handleClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                <p className="text-sm text-center text-brand-light/80">
                    พิมพ์ข้อความของคุณแล้ว AI จะอ่านให้ฟัง! <strong className="text-brand-yellow">โบนัสสนุกๆ: รับ 1 เครดิตสำหรับทุกตัวอักษรที่ AI อ่าน!</strong>
                </p>

                {error && <div role="alert" className="w-full p-3 bg-red-800/50 border-2 border-red-500 text-center text-sm">{error}</div>}

                <div className="w-full flex flex-col gap-4 bg-black/40 p-4 border-4 border-brand-light shadow-pixel">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="ป้อนข้อความที่นี่..."
                        className="w-full h-32 p-2 bg-brand-light text-black rounded-none border-2 border-black focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-y"
                        disabled={!isSpeechSynthesisSupported || isSpeaking || isDownloading}
                    />
                    
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={autoDetectLang} 
                                onChange={(e) => { playSound(audioService.playToggle); setAutoDetectLang(e.target.checked); }} 
                                disabled={!isSpeechSynthesisSupported || isSpeaking || isDownloading}
                                className="w-5 h-5 accent-brand-magenta"
                            />
                            <span className="text-sm">ตรวจจับภาษาอัตโนมัติ</span>
                        </label>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="voice-select" className={`text-xs font-press-start text-brand-cyan transition-opacity ${autoDetectLang ? 'opacity-50' : 'opacity-100'}`}>เลือกเสียง:</label>
                        <select
                            id="voice-select"
                            value={selectedVoiceURI}
                            onChange={(e) => { playSound(audioService.playSelection); setSelectedVoiceURI(e.target.value); }}
                            className="w-full p-2 bg-brand-light text-black border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!isSpeechSynthesisSupported || isSpeaking || isDownloading || autoDetectLang}
                        >
                            {voices.length > 0 ? voices.map(voice => (
                                <option key={voice.voiceURI} value={voice.voiceURI}>
                                    {`${voice.name} (${voice.lang})`}
                                </option>
                            )) : <option>กำลังโหลดเสียง...</option>}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="rate-slider" className="text-xs font-press-start text-brand-cyan">ความเร็ว: {rate.toFixed(1)}x</label>
                        <input
                            id="rate-slider"
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={rate}
                            onChange={(e) => { playSound(audioService.playSliderChange); setRate(parseFloat(e.target.value)); }}
                            disabled={!isSpeechSynthesisSupported || isSpeaking || isDownloading}
                        />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <label htmlFor="pitch-slider" className="text-xs font-press-start text-brand-cyan">ระดับเสียง: {pitch.toFixed(1)}</label>
                         <input
                            id="pitch-slider"
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={pitch}
                            onChange={(e) => { playSound(audioService.playSliderChange); setPitch(parseFloat(e.target.value)); }}
                            disabled={!isSpeechSynthesisSupported || isSpeaking || isDownloading}
                        />
                    </div>

                    <div className="flex flex-col gap-4 mt-2">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleSpeak}
                                onMouseEnter={() => playSound(audioService.playHover)}
                                disabled={!text.trim() || isSpeaking || isDownloading || !isSpeechSynthesisSupported}
                                className="w-full flex items-center justify-center gap-3 p-3 bg-brand-lime text-black border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                <PlayIcon className="w-5 h-5"/> พูด
                            </button>
                            <button
                                onClick={handleStop}
                                onMouseEnter={() => playSound(audioService.playHover)}
                                disabled={!isSpeaking}
                                className="w-full flex items-center justify-center gap-3 p-3 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                <StopIcon className="w-5 h-5"/> หยุด
                            </button>
                        </div>
                        <div>
                            <button
                                onClick={handleDownload}
                                disabled={!text.trim() || isSpeaking || isDownloading || !isSpeechSynthesisSupported || !isGetDisplayMediaSupported}
                                className="w-full flex items-center justify-center gap-3 p-3 bg-brand-yellow text-black border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-magenta hover:text-white disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                <DownloadIcon className="w-5 h-5"/>
                                {isDownloading ? 'กำลังบันทึก...' : 'ดาวน์โหลด'}
                            </button>
                             {!isGetDisplayMediaSupported && (
                                 <p className="text-xs text-center text-brand-light/60 mt-2">
                                     (การดาวน์โหลดไม่รองรับในเบราว์เซอร์นี้)
                                 </p>
                             )}
                        </div>
                    </div>
                </div>
            </main>
        </PageWrapper>
    );
};