

import React, { useState, useEffect, useCallback } from 'react';
import * as audioService from '../services/audioService';
import { PageHeader, PageWrapper } from './PageComponents';
import { PlayIcon } from './icons/PlayIcon';
import { StopIcon } from './icons/StopIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { Modal } from './Modal';
import { useCredits } from '../contexts/CreditContext';

interface TextToSpeechPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
}

const isSpeechSynthesisSupported = !!window.speechSynthesis;

export const TextToSpeechPage: React.FC<TextToSpeechPageProps> = ({ onClose, playSound }) => {
    const [text, setText] = useState('สวัสดี! ยินดีต้อนรับสู่ Ai Studio แบบพกพา');
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
    const [pitch, setPitch] = useState(1);
    const [rate, setRate] = useState(1);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [autoDetectLang, setAutoDetectLang] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
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
                console.warn(`Speech synthesis was ${e.error}. This is expected.`);
                setIsSpeaking(false);
                return;
            }

            console.error('SpeechSynthesis Error:', e.error, e);
            let errorMessage = 'ขออภัย ไม่สามารถพูดได้ในขณะนี้';
            switch (e.error) {
                case 'language-unavailable':
                    errorMessage = 'ขออภัย ไม่รองรับภาษานี้บนอุปกรณ์ของคุณ';
                    break;
                case 'voice-unavailable':
                     errorMessage = 'ขออภัย ไม่พบเสียงที่เลือกบนอุปกรณ์ของคุณ';
                    break;
                case 'text-too-long':
                     errorMessage = 'ข้อความยาวเกินไป ไม่สามารถอ่านออกเสียงได้';
                    break;
                case 'audio-busy':
                    errorMessage = 'ระบบเสียงกำลังยุ่ง โปรดลองอีกครั้งในภายหลัง';
                    break;
                default:
                     errorMessage = `เกิดข้อผิดพลาดกับระบบเสียง (${e.error})`;
            }
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

    const handleClose = () => {
        if (isSpeechSynthesisSupported) {
            window.speechSynthesis.cancel();
        }
        onClose();
    };

    return (
        <PageWrapper>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="เหตุใดจึงดาวน์โหลดเสียงไม่ได้">
                <div className="space-y-4 text-sm font-sans">
                    <p>คุณสมบัติ 'แปลงข้อความเป็นเสียง' นี้ใช้เทคโนโลยี Web Speech API ที่มีอยู่ในเว็บเบราว์เซอร์ของคุณโดยตรง</p>
                    <p>เมื่อคุณกด 'พูด' เบราว์เซอร์จะส่งข้อความไปยังระบบปฏิบัติการ (เช่น Windows, Android, iOS) เพื่อสร้างเสียงและเล่นผ่านลำโพงของคุณ</p>
                    <p>กระบวนการนี้เกิดขึ้นภายในระบบปิดของเบราว์เซอร์และระบบปฏิบัติการ ทำให้เว็บแอปพลิเคชันไม่มีวิธีมาตรฐานในการ 'ดักจับ' หรือบันทึกเสียงที่ถูกสร้างขึ้นมาเป็นไฟล์ได้โดยตรง</p>
                    <p>เรากำลังติดตามการพัฒนาของเทคโนโลยีเว็บอย่างใกล้ชิด และจะเปิดใช้งานฟังก์ชันดาวน์โหลดทันทีที่เบราว์เซอร์มีความสามารถนี้ในอนาคต!</p>
                </div>
            </Modal>
            <PageHeader title="แปลงข้อความเป็นเสียง AI" onBack={handleClose} />
            <main id="main-content" className="w-full max-w-4xl mx-auto p-4 flex-grow overflow-y-auto flex flex-col items-center gap-6 font-sans">
                <p className="text-sm text-center text-brand-light/80">
                    พิมพ์ข้อความของคุณแล้ว AI จะอ่านให้ฟัง! <strong className="text-brand-yellow">รับ 1 เครดิตต่อ 1 ตัวอักษร!</strong>
                </p>

                {error && <div role="alert" className="w-full p-3 bg-red-800/50 border-2 border-red-500 text-center text-sm">{error}</div>}

                <div className="w-full flex flex-col gap-4 bg-black/40 p-4 border-4 border-brand-light shadow-pixel">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="ป้อนข้อความที่นี่..."
                        className="w-full h-32 p-2 bg-brand-light text-black rounded-none border-2 border-black focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-y"
                        disabled={!isSpeechSynthesisSupported || isSpeaking}
                    />
                    
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={autoDetectLang} 
                                onChange={(e) => { playSound(audioService.playToggle); setAutoDetectLang(e.target.checked); }} 
                                disabled={!isSpeechSynthesisSupported || isSpeaking}
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
                            disabled={!isSpeechSynthesisSupported || isSpeaking || autoDetectLang}
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
                            disabled={!isSpeechSynthesisSupported || isSpeaking}
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
                            disabled={!isSpeechSynthesisSupported || isSpeaking}
                        />
                    </div>

                    <div className="flex flex-col gap-4 mt-2">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleSpeak}
                                onMouseEnter={() => playSound(audioService.playHover)}
                                disabled={!text.trim() || isSpeaking || !isSpeechSynthesisSupported}
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
                                disabled={true}
                                aria-describedby="download-tts-desc"
                                className="w-full flex items-center justify-center gap-3 p-3 bg-gray-600 text-white border-4 border-brand-light shadow-pixel text-base cursor-not-allowed opacity-70"
                            >
                                <DownloadIcon className="w-5 h-5"/> ดาวน์โหลด
                            </button>
                            <div id="download-tts-desc" className="text-xs text-center text-brand-light/60 mt-2">
                               <span>(ฟังก์ชันดาวน์โหลดจะพร้อมใช้งานในอนาคต </span>
                               <button onClick={() => { playSound(audioService.playClick); setIsModalOpen(true); }} onMouseEnter={() => playSound(audioService.playHover)} className="underline hover:text-brand-yellow">เรียนรู้สาเหตุ</button>
                               <span>)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </PageWrapper>
    );
};