



import React, { useRef, useEffect } from 'react';
import * as audioService from '../../services/audioService';
import { useTheme } from '../../contexts/ThemeContext';

export const AudioVisualizer: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // FIX: Initialize useRef with null to fix "Expected 1 arguments, but got 0" error.
    const animationFrameId = useRef<number | null>(null);
    const { theme } = useTheme();

    useEffect(() => {
        const analyser = audioService.getAnalyser();
        if (!analyser) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationFrameId.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Set pixelated rendering
            ctx.imageSmoothingEnabled = false;

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;

            // Only draw the lower half of frequencies, which are more relevant to music
            for (let i = 0; i < bufferLength; i++) {
                const barHeightFraction = dataArray[i] / 255;
                const barHeight = barHeightFraction * canvas.height;
                
                if (theme === 'dark') {
                     // Colors from cyan to magenta based on height
                    const r = 255 * (1 - barHeightFraction);
                    const g = 255 * barHeightFraction;
                    const b = 255;
                    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                } else {
                     ctx.fillStyle = `rgba(30, 41, 59, ${barHeightFraction * 0.8 + 0.2})`; // Slate tones for light theme
                }
                
                // Draw pixelated bars by flooring coordinates
                ctx.fillRect(Math.floor(x), Math.floor(canvas.height - barHeight), Math.floor(barWidth), Math.floor(barHeight));
                x += barWidth + 1;
            }
        };

        draw();

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [theme]);

    return (
        <div className="w-full h-24 bg-black/30 border-2 border-brand-light/50 p-1">
            <canvas ref={canvasRef} width="320" height="100" className="w-full h-full" />
        </div>
    );
};