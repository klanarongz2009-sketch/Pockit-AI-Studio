import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Song } from '../services/geminiService';
import { generateSongFromText } from '../services/geminiService';
import * as audioService from '../services/audioService';
import * as preferenceService from '../services/preferenceService';
import { PageHeader, PageWrapper } from './PageComponents';
import { LoadingSpinner } from './LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { PlayIcon } from './icons/PlayIcon';
import { StopIcon } from './icons/StopIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { TrashIcon } from './icons/TrashIcon';
import { useCredits } from '../contexts/CreditContext';
import { showNotification } from '../services/notificationService';
import { AudioVisualizer } from './AudioVisualizer';
import type { HistoryItem, ModelVersion } from '../services/preferenceService';

interface TextToSongPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isPlayingSong: boolean;
    setIsPlayingSong: React.Dispatch<React.SetStateAction<boolean>>;
    isOnline: boolean;
}

const thinkingMessages = [
    "กำลังวิเคราะห์อารมณ์...",
    "ตีความจังหวะและโครงสร้าง...",
    "กำลังประพันธ์ทำนองหลัก...",
    "เพิ่มเสียงประสาน...",
    "เรียบเรียงเบสไลน์...",
    "สร้างแทร็กกลอง 8-bit...",
    "ตรวจสอบความเข้ากันของดนตรี...",
    "ขั้นตอนสุดท้าย, กำลังรวมเพลง..."
];

export const TextToSongPage: React.FC<TextToSongPageProps> = ({
    onClose,
    playSound,
    isPlayingSong,
    setIsPlayingSong,
    isOnline,
}) => {
    const [inputText, setInputText] = useState<string>('');
    const [generatedSong, setGeneratedSong] = useState<Song | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [modelVersion, setModelVersion] = useState<ModelVersion>(() => preferenceService.getPreference('textToSongModel', 'v1'));
    const [thinkingMessage, setThinkingMessage] = useState<string>(thinkingMessages[0]);
    
    const [history, setHistory] = useState<HistoryItem[]>(() => preferenceService.getPreference('songHistory', []));
    const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
    const { credits, spendCredits } = useCredits();
    const cancellationRequested = useRef(false);

    useEffect(() => {
        preferenceService.setPreference('textToSongModel', modelVersion);
    }, [modelVersion]);

    useEffect(() => {
        let interval: number;
        if (isLoading) {
            let messageIndex = 0;
            interval = window.setInterval(() => {
                messageIndex = (messageIndex + 1) % thinkingMessages.length;
                setThinkingMessage(thinkingMessages[messageIndex]);
            }, 2000);
        }
        return () => {
            if (interval) clearInterval(interval);
        }
    }, [isLoading]);
    
    const handleCancel = useCallback(() => {
        playSound(audioService.playCloseModal);
        cancellationRequested.current = true;
        setIsLoading(false); 
        setError("การสร้างเพลงถูกยกเลิกโดยผู้ใช้");
    }, [playSound]);

    const handleGenerateSong = useCallback(async () => {
        if (!inputText.trim() || isLoading || !isOnline) return;

        if (modelVersion === 'v2.0-beta') {
            if (!spendCredits(10)) {
                setError(`เครดิตไม่เพียงพอ! ต้องการ 10 เครดิต แต่คุณมี ${credits.toFixed(2)} เครดิต`);
                playSound(audioService.playError);
                return;
            }
        }

        cancellationRequested.current = false;
        playSound(audioService.playGenerate);
        setIsLoading(true);
        setError(null);
        setGeneratedSong(null);
        setThinkingMessage(thinkingMessages[0]);

        try {
            const song = await generateSongFromText(inputText, modelVersion);
            
            if (cancellationRequested.current) return;

            if (modelVersion === 'v1.5') {
                const cost = song.flat().length;
                if (!spendCredits(cost)) {
                    setError(`เครดิตไม่เพียงพอสำหรับเพลงนี้! ต้องการ ${cost} เครดิต (1 ต่อโน้ต) แต่คุณมีไม่พอ เครดิตของคุณอาจติดลบ`);
                    playSound(audioService.playError);
                }
            }

            setGeneratedSong(song);
            
            const newHistoryItem: HistoryItem = {
                id: `song-${Date.now()}`,
                text: inputText,
                song: song,
                timestamp: Date.now(),
                modelVersion: modelVersion,
            };
            setHistory(prev => {
                const newHistory = [newHistoryItem, ...prev];
                preferenceService.setPreference('songHistory', newHistory);
                return newHistory;
            });

            playSound(audioService.playSuccess);
            
            showNotification("🎵 เพลงของคุณพร้อมแล้ว!", {
                body: `เพลงจากข้อความ "${inputText.substring(0, 30)}..." สร้างเสร็จแล้ว`,
            });

        } catch (err) {
            if (cancellationRequested.current) return;
            playSound(audioService.playError);
            const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [inputText, isLoading, playSound, isOnline, modelVersion, credits, spendCredits]);

    const handlePlaybackToggle = useCallback((song: Song | null, songId: string) => {
        if (currentlyPlayingId === songId) {
            audioService.stopSong();
            setIsPlayingSong(false);
            setCurrentlyPlayingId(null);
        } else if (song) {
            playSound(audioService.playClick);
            setIsPlayingSong(true);
            setCurrentlyPlayingId(songId);
            audioService.playSong(song, 140, () => {
                setIsPlayingSong(false);
                setCurrentlyPlayingId(null);
            });
        }
    }, [currentlyPlayingId, playSound, setIsPlayingSong]);

    const handleDownloadSong = useCallback(async (songToDownload: Song | null, textForFilename: string) => {
        if (!songToDownload || isDownloading) return;
    
        playSound(audioService.playDownload);
        setIsDownloading(true);
        setError(null);
    
        try {
            const wavBlob = await audioService.exportSongToWav(songToDownload, 140);
            if (wavBlob) {
                const url = URL.createObjectURL(wavBlob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                const fileName = (textForFilename.slice(0, 20).replace(/[\\/:*?"<>|]/g, '').replace(/\s/g, '_') || 'generated-song').trim();
                a.download = `${fileName}-8bit.wav`;
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                throw new Error("ไม่สามารถสร้างไฟล์ WAV ได้");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่คาดคิดระหว่างการดาวน์โหลด");
            playSound(audioService.playError);
        } finally {
            setIsDownloading(false);
        }
    }, [isDownloading, playSound]);
    
    const handleDeleteHistoryItem = (idToDelete: string) => {
        playSound(audioService.playTrash);
        if (currentlyPlayingId === idToDelete) {
            audioService.stopSong();
            setIsPlayingSong(false);
            setCurrentlyPlayingId(null);
        }
        setHistory(prev => {
            const newHistory = prev.filter(item => item.id !== idToDelete);
            preferenceService.setPreference('songHistory', newHistory);
            return newHistory;
        });
    };

    const handleClose = () => {
        audioService.stopSong();
        setIsPlayingSong(false);
        onClose();
    }
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isLoading || isDownloading) return;
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const isCtrlCmd = isMac ? event.metaKey : event.ctrlKey;
            if (isCtrlCmd && event.key === 'Enter') {
                event.preventDefault();
                handleGenerateSong();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLoading, isDownloading, handleGenerateSong]);

    return (
        <PageWrapper>
            <PageHeader title="แปลงข้อความเป็นเพลง" onBack={handleClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                <p className="text-sm text-center text-brand-light/80">
                    พิมพ์เรื่องราว, บทกวี, หรือเนื้อเพลงของคุณ แล้วให้ AI แปลงตัวอักษรให้กลายเป็นเพลง 8-bit สุดสร้างสรรค์!
                </p>

                 <div className="w-full flex flex-col gap-4 bg-black/40 p-4 border-4 border-brand-light shadow-pixel">
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="เริ่มต้นพิมพ์เรื่องราวของคุณที่นี่..."
                        className="w-full h-40 p-2 bg-brand-light text-black rounded-none border-2 border-black focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-y"
                        disabled={isLoading || !isOnline}
                        aria-label="ช่องใส่ข้อความสำหรับสร้างเพลง"
                    />

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-press-start text-brand-cyan">เวอร์ชันโมเดล</label>
                        <div className="flex flex-col gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="model-version"
                                    value="v1"
                                    checked={modelVersion === 'v1'}
                                    onChange={() => { playSound(audioService.playToggle); setModelVersion('v1'); }}
                                    className="w-5 h-5 accent-brand-magenta"
                                    disabled={isLoading}
                                />
                                <div className="font-sans">
                                    <span className="text-sm">V1 (มาตรฐาน) - <span className="text-brand-lime">ฟรี</span></span>
                                    <p className="text-xs text-brand-light/70">คุณภาพดี, สร้างเร็ว, เหมาะสำหรับเพลงสั้นๆ</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="model-version"
                                    value="v1.5"
                                    checked={modelVersion === 'v1.5'}
                                    onChange={() => { playSound(audioService.playToggle); setModelVersion('v1.5'); }}
                                    className="w-5 h-5 accent-brand-magenta"
                                    disabled={isLoading}
                                />
                                <div className="font-sans">
                                    <span className="text-sm">V1.5 (ขั้นสูง) - <span className="text-brand-yellow">1 เครดิต/โน้ต</span></span>
                                    <p className="text-xs text-brand-light/70">เพลงยาวขึ้น, มีเครื่องดนตรี 5 ชิ้น</p>
                                </div>
                            </label>
                             <label className="flex items-center gap-2 cursor-pointer relative">
                                <input
                                    type="radio"
                                    name="model-version"
                                    value="v2.0-beta"
                                    checked={modelVersion === 'v2.0-beta'}
                                    onChange={() => { playSound(audioService.playToggle); setModelVersion('v2.0-beta'); }}
                                    className="w-5 h-5 accent-brand-magenta"
                                    disabled={isLoading}
                                />
                                <div className="font-sans">
                                    <span className="text-sm">V2.0 Beta - <span className="text-brand-yellow">10 เครดิต</span></span>
                                    <p className="text-xs text-brand-light/70">สร้างเร็วพิเศษ, ความยาวประมาณ 3 นาที, 6 แทร็ก</p>
                                </div>
                                <div className="absolute top-0 right-0 bg-brand-magenta text-white text-[8px] font-press-start px-1 border border-black" aria-hidden="true">ทดลอง</div>
                            </label>
                        </div>
                    </div>
                    
                    {isLoading ? (
                         <div className="w-full text-center space-y-2 py-4">
                            <LoadingSpinner text={thinkingMessage} />
                            <p className="text-xs text-brand-yellow">
                                AI กำลังประพันธ์เพลง... กรุณาอย่าปิดแท็บนี้
                                <br />
                                คุณจะได้รับการแจ้งเตือนเมื่อเพลงเสร็จสมบูรณ์
                            </p>
                            <button
                                onClick={handleCancel}
                                onMouseEnter={() => playSound(audioService.playHover)}
                                className="mt-2 w-full max-w-xs p-2 bg-brand-magenta text-white border-2 border-brand-light shadow-sm transition-all hover:bg-red-500 active:shadow-none"
                            >
                                ยกเลิกการสร้าง
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={handleGenerateSong} 
                            onMouseEnter={() => playSound(audioService.playHover)}
                            disabled={!inputText.trim() || isLoading || !isOnline}
                            className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed"
                            title={!isOnline ? 'ฟีเจอร์นี้ต้องใช้การเชื่อมต่ออินเทอร์เน็ต' : 'ปุ่มลัด: Ctrl+Enter'}
                        >
                            <SparklesIcon className="w-6 h-6" /> สร้างเพลง
                        </button>
                    )}
                 </div>
                
                <div className="w-full my-2">
                    <AudioVisualizer />
                </div>

                {error && (
                     <div role="alert" className="w-full p-4 space-y-3 text-center bg-black/40 border-4 border-brand-magenta">
                        <h3 className="text-lg font-press-start text-brand-magenta">เกิดข้อผิดพลาด</h3>
                        <p className="font-sans text-sm break-words text-brand-light/90 max-w-md mx-auto">
                            {error}
                        </p>
                        <button
                            onClick={handleGenerateSong}
                            onMouseEnter={() => playSound(audioService.playHover)}
                            className="w-full max-w-xs mt-2 flex items-center justify-center gap-3 p-3 bg-brand-cyan text-black border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px]"
                        >
                            ลองอีกครั้ง
                        </button>
                    </div>
                )}

                {generatedSong && !isLoading && (
                     <div className="space-y-4 text-center w-full py-4 bg-black/40 border-2 border-brand-cyan">
                        <h3 className="text-lg font-press-start text-brand-cyan">เพลงล่าสุดที่สร้าง:</h3>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
                             <button 
                                onClick={() => handlePlaybackToggle(generatedSong, 'main')} 
                                onMouseEnter={() => playSound(audioService.playHover)}
                                aria-label={isPlayingSong && currentlyPlayingId === 'main' ? "หยุดเพลง" : "เล่นเพลง"}
                                className="w-full sm:w-48 flex items-center justify-center gap-3 p-3 bg-brand-cyan text-black border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px]">
                                {isPlayingSong && currentlyPlayingId === 'main' ? <StopIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                                <span>{isPlayingSong && currentlyPlayingId === 'main' ? 'หยุด' : 'เล่นเพลง'}</span>
                            </button>
                             <button 
                                onClick={() => handleDownloadSong(generatedSong, inputText)} 
                                onMouseEnter={() => playSound(audioService.playHover)}
                                disabled={isDownloading} 
                                aria-label="ดาวน์โหลดเพลงเป็นไฟล์ WAV" 
                                className="w-full sm:w-48 flex items-center justify-center gap-3 p-3 bg-brand-yellow text-black border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-magenta hover:text-white active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed">
                                <DownloadIcon className="w-6 h-6" />
                                <span>{isDownloading ? 'กำลังสร้าง...' : 'ดาวน์โหลด'}</span>
                            </button>
                        </div>
                    </div>
                )}

                {history.length > 0 && (
                    <div className="w-full space-y-4 mt-8">
                        <h3 className="text-lg font-press-start text-brand-cyan text-center">ประวัติเพลงที่สร้าง</h3>
                        <ul className="space-y-3 max-h-96 overflow-y-auto pr-2 border-t-2 border-brand-light/30 pt-4">
                            {history.map(item => (
                                <li key={item.id} className="bg-black/30 border-2 border-brand-light/50 p-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs text-brand-light/70">
                                                {new Date(item.timestamp).toLocaleString('th-TH')} - {item.modelVersion.toUpperCase()}
                                            </p>
                                            <p className="text-sm mt-1" title={item.text}>"{item.text}"</p>
                                        </div>
                                        <button onClick={() => handleDeleteHistoryItem(item.id)} onMouseEnter={() => playSound(audioService.playHover)} className="p-2 text-brand-light hover:text-brand-magenta transition-colors" aria-label={`ลบเพลง "${item.text}"`}>
                                            <TrashIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        <button 
                                            onClick={() => handlePlaybackToggle(item.song, item.id)} 
                                            onMouseEnter={() => playSound(audioService.playHover)}
                                            className="flex-1 flex items-center justify-center gap-2 p-2 bg-brand-cyan/20 text-brand-light border-2 border-brand-light shadow-sm hover:bg-brand-cyan hover:text-black transition-all">
                                            { isPlayingSong && currentlyPlayingId === item.id ? <StopIcon className="w-4 h-4"/> : <PlayIcon className="w-4 h-4"/> }
                                            <span className="text-xs">{ isPlayingSong && currentlyPlayingId === item.id ? 'หยุด' : 'เล่น' }</span>
                                        </button>
                                        <button 
                                            onClick={() => handleDownloadSong(item.song, item.text)} 
                                            onMouseEnter={() => playSound(audioService.playHover)}
                                            disabled={isDownloading}
                                            aria-label={`ดาวน์โหลดเพลง "${item.text}"`}
                                            className="flex-1 flex items-center justify-center gap-2 p-2 bg-brand-yellow/80 text-black border-2 border-brand-light shadow-sm hover:bg-brand-yellow transition-all">
                                            <DownloadIcon className="w-4 h-4"/>
                                            <span className="text-xs">{ isDownloading ? '...' : 'ดาวน์โหลด' }</span>
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </main>
        </PageWrapper>
    );
};