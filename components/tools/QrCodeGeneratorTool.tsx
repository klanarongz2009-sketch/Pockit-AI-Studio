import React, { useState, useCallback } from 'react';
import { PageHeader, PageWrapper } from '../PageComponents';
import * as audioService from '../../services/audioService';
import { DownloadIcon } from '../icons/DownloadIcon';

interface QrCodeGeneratorToolProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
}

const API_URL = "https://api.qrserver.com/v1/create-qr-code/";

export const QrCodeGeneratorTool: React.FC<QrCodeGeneratorToolProps> = ({ onClose, playSound }) => {
    const [text, setText] = useState('https://ai.google.dev');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [size, setSize] = useState(200);

    const handleGenerate = useCallback(() => {
        if (!text.trim()) return;
        playSound(audioService.playGenerate);
        const url = `${API_URL}?size=${size}x${size}&data=${encodeURIComponent(text)}`;
        setQrCodeUrl(url);
    }, [text, size, playSound]);

    const handleDownload = () => {
        if (!qrCodeUrl) return;
        playSound(audioService.playDownload);
        const a = document.createElement('a');
        a.href = qrCodeUrl;
        a.download = 'qrcode.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <PageWrapper>
            <PageHeader title="QR Code Generator" onBack={onClose} />
            <main className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                <p className="text-sm text-center text-text-secondary">
                    Enter any text or URL to generate a QR code.
                </p>

                <div className="w-full p-4 bg-surface-1 border-4 border-border-primary space-y-4">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Enter text or URL..."
                        className="w-full h-24 p-2 bg-surface-2 rounded-md resize-y"
                    />
                    <div>
                        <label className="text-xs font-press-start flex justify-between">
                            <span>Size</span>
                            <span>{size}px</span>
                        </label>
                        <input type="range" min="100" max="500" step="50" value={size} onChange={e => setSize(Number(e.target.value))} className="w-full" />
                    </div>
                    <button onClick={handleGenerate} disabled={!text.trim()} className="w-full p-3 bg-brand-primary text-text-inverted rounded-md font-press-start disabled:bg-surface-2">
                        Generate
                    </button>
                </div>
                
                <div className="w-full p-4 bg-surface-1 border-4 border-border-primary flex flex-col items-center justify-center gap-4">
                    {qrCodeUrl ? (
                        <>
                            <img src={qrCodeUrl} alt="Generated QR Code" width={size} height={size} style={{ imageRendering: 'pixelated' }} />
                            <button onClick={handleDownload} className="w-full flex items-center justify-center gap-2 p-2 bg-brand-yellow text-black rounded-md font-press-start">
                                <DownloadIcon className="w-5 h-5" /> Download
                            </button>
                        </>
                    ) : (
                        <p className="text-text-secondary">QR code will appear here</p>
                    )}
                </div>
            </main>
        </PageWrapper>
    );
};