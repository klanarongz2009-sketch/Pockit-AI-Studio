import React, { useState, useCallback } from 'react';
import * as audioService from '../services/audioService';
import { PageHeader, PageWrapper } from './PageComponents';
import { DownloadIcon } from './icons/DownloadIcon';
import { LoadingSpinner } from './LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';

interface MediaObject {
    url: string;
    type: string;
    fileName: string;
}

interface UrlDownloaderPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
}

export const UrlDownloaderPage: React.FC<UrlDownloaderPageProps> = ({ onClose, playSound }) => {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<React.ReactNode | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('ป้อน URL เพื่อเริ่มต้น');
    const [media, setMedia] = useState<MediaObject | null>(null);

    const resetState = () => {
        setIsLoading(false);
        setError(null);
        setStatusMessage('ป้อน URL เพื่อเริ่มต้น');
        setMedia(null);
    };

    const handleFetch = useCallback(() => {
        if (!url.trim()) {
            setError('กรุณาป้อน URL');
            return;
        }
        let validUrl: URL;
        try {
            validUrl = new URL(url);
        } catch (_) {
            setError('URL ไม่ถูกต้อง');
            return;
        }

        resetState();
        playSound(audioService.playGenerate);
        setIsLoading(true);
        setStatusMessage("กำลังโหลดตัวอย่าง...");

        const pathnameParts = validUrl.pathname.split('/');
        const fileName = decodeURIComponent(pathnameParts[pathnameParts.length - 1] || 'downloaded-file');
        
        const extension = (fileName.split('.').pop() || '').toLowerCase();
        let type = 'application/octet-stream';

        const videoExtensions = ['mp4', 'webm', 'mov', 'ogv', 'm4v'];
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
        const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'flac'];
        
        if (videoExtensions.includes(extension)) {
            type = 'video/mp4';
        } else if (imageExtensions.includes(extension)) {
            type = 'image/png';
        } else if (audioExtensions.includes(extension)) {
            type = 'audio/mpeg';
        }
        
        setMedia({
            url: validUrl.toString(),
            type: type,
            fileName: fileName
        });
    }, [url, playSound]);
    
    const handleMediaError = useCallback(() => {
        playSound(audioService.playError);
        setIsLoading(false);
        setMedia(null);
        setError(
            <>
                <p>ไม่สามารถแสดงตัวอย่างได้ (อาจเกิดจากข้อจำกัด CORS ของเซิร์ฟเวอร์)</p>
                <p className="mt-2 text-xs">
                    คุณสามารถลองดาวน์โหลดด้วยตนเอง: <br />
                    <a href={url} download={url.split('/').pop() || 'downloaded-file'} target="_blank" rel="noopener noreferrer" className="underline text-brand-yellow hover:text-brand-cyan">
                        คลิกขวาที่นี่แล้วเลือก "บันทึก​ลิงก์​เป็น..."
                    </a>
                </p>
            </>
        );
    }, [playSound, url]);

    const handleMediaLoad = useCallback(() => {
        setIsLoading(false);
        setError(null);
        playSound(audioService.playSuccess);
    }, [playSound]);

    const renderMedia = () => {
        if (!media) {
            return <p className="text-brand-light/70">{statusMessage}</p>;
        }
        
        if (media.type.startsWith('video/')) {
            return <video src={media.url} controls autoPlay loop className="w-full h-full object-contain" onLoadedData={handleMediaLoad} onError={handleMediaError} crossOrigin="anonymous" />;
        }
        if (media.type.startsWith('image/')) {
            return <img src={media.url} alt={media.fileName} className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} onLoad={handleMediaLoad} onError={handleMediaError} crossOrigin="anonymous" />;
        }
        if (media.type.startsWith('audio/')) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-4">
                    <p className="text-brand-light mb-4 truncate max-w-full">{media.fileName}</p>
                    <audio src={media.url} controls autoPlay className="w-full" onLoadedData={handleMediaLoad} onError={handleMediaError} crossOrigin="anonymous" />
                </div>
            );
        }

        // Trigger error for unknown types as we can't preview them.
        handleMediaError();
        return null;
    };

    return (
        <PageWrapper>
            <PageHeader title="ดาวน์โหลดจาก URL" onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                <div className="w-full h-auto aspect-video bg-black/50 border-4 border-brand-light flex items-center justify-center shadow-pixel p-2">
                    {isLoading ? <LoadingSpinner text={statusMessage} /> : renderMedia()}
                </div>

                <div className="w-full flex flex-col gap-4 bg-black/40 p-4 border-4 border-brand-light shadow-pixel">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="url-input" className="text-xs font-press-start text-brand-cyan">URL</label>
                        <input id="url-input" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="w-full p-2 bg-brand-light text-black rounded-none border-2 border-black focus:outline-none focus:ring-2 focus:ring-brand-yellow" disabled={isLoading} />
                    </div>
                    {error && <div role="alert" className="p-3 bg-red-800/50 border-2 border-red-500 text-center text-sm">{error}</div>}
                    <button onClick={handleFetch} onMouseEnter={() => playSound(audioService.playHover)} disabled={!url.trim() || isLoading} className="w-full flex items-center justify-center gap-3 p-3 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed">
                        <SparklesIcon className="w-5 h-5"/>
                        {isLoading ? 'กำลังโหลด...' : 'ดึงข้อมูล'}
                    </button>
                    {media && !isLoading && !error && (
                         <a href={media.url} download={media.fileName} onMouseEnter={() => playSound(audioService.playHover)} className="w-full flex items-center justify-center gap-3 p-3 bg-brand-lime text-black border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px]">
                            <DownloadIcon className="w-5 h-5"/>
                            ดาวน์โหลด
                        </a>
                    )}
                </div>
            </main>
        </PageWrapper>
    );
};
