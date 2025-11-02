import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PageWrapper, PageHeader } from '../PageComponents';
import * as audioService from '../../services/audioService';
import { SparklesIcon } from '../icons/SparklesIcon';
import { DownloadIcon } from '../icons/DownloadIcon';

interface TextToArtPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
}

// Simple Mulberry32 PRNG
const mulberry32 = (seed: number) => {
    return () => {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

// Simple string hash function
const xfnv1a = (str: string): number => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    }
    return h;
};

export const TextToArtPage: React.FC<TextToArtPageProps> = ({ onClose, playSound }) => {
    const [text, setText] = useState('Hello, generative world!');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const generateArt = useCallback(() => {
        if (!text.trim()) return;
        playSound(audioService.playGenerate);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const seed = xfnv1a(text);
        const rand = mulberry32(seed);

        ctx.fillStyle = `hsl(${Math.floor(rand() * 360)}, 20%, 10%)`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const shapeCount = 30 + Math.floor(rand() * 50);
        for(let i=0; i < shapeCount; i++) {
            const x = rand() * canvas.width;
            const y = rand() * canvas.height;
            const size = 10 + rand() * 80;
            const hue = 180 + Math.floor(rand() * 120);
            const saturation = 50 + Math.floor(rand() * 50);
            const lightness = 40 + Math.floor(rand() * 40);
            const alpha = 0.3 + rand() * 0.5;

            ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
            ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness + 10}%, ${alpha + 0.2})`;
            ctx.lineWidth = 2;

            if (rand() > 0.5) { // Circle
                ctx.beginPath();
                ctx.arc(x, y, size/2, 0, Math.PI * 2);
                ctx.fill();
                if (rand() > 0.7) ctx.stroke();
            } else { // Rectangle
                ctx.fillRect(x - size / 2, y - size / 2, size, size);
                if (rand() > 0.7) ctx.strokeRect(x - size / 2, y - size / 2, size, size);
            }
        }
    }, [text, playSound]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        // Draw initial placeholder state
        ctx.fillStyle = '#111827'; // var(--color-bg)
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#9ca3af'; // var(--color-text-secondary)
        ctx.textAlign = 'center';
        ctx.font = '16px Inter, sans-serif';
        ctx.fillText('Art will be generated here', canvas.width / 2, canvas.height / 2);
    }, []);

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        playSound(audioService.playDownload);
        const link = document.createElement('a');
        link.download = 'generative-art.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    return (
        <PageWrapper>
            <PageHeader title="Text to Generative Art" onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                <p className="text-sm text-center text-text-secondary">Create unique, abstract generative art from any text you provide. No AI involved.</p>

                <div className="w-full p-4 bg-surface-1 border-4 border-border-primary space-y-4">
                     <textarea value={text} onChange={e => setText(e.target.value)} className="w-full h-24 p-2 bg-surface-2 rounded-md resize-y" />
                    <button onClick={generateArt} disabled={!text.trim()} className="w-full p-3 bg-brand-primary text-text-inverted rounded-md font-press-start disabled:bg-surface-2">
                       <SparklesIcon className="w-5 h-5 inline-block mr-2" />
                       Generate
                    </button>
                </div>
                
                <div className="w-full aspect-square bg-black border-4 border-border-primary p-1">
                    <canvas ref={canvasRef} width="400" height="400" className="w-full h-full" />
                </div>
                
                <button onClick={handleDownload} className="w-full p-3 bg-brand-yellow text-black rounded-md font-press-start flex items-center justify-center gap-2">
                    <DownloadIcon className="w-5 h-5" />
                    Download
                </button>
            </main>
        </PageWrapper>
    );
};