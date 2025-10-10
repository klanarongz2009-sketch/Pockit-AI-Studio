import React, { useEffect } from 'react';
import * as audioService from '../services/audioService';

interface StartScreenProps {
    onStartApp: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStartApp }) => {
    
    useEffect(() => {
        // Play a short, non-repeating sound on entry
        audioService.playBootSound4();
    }, []);

    useEffect(() => {
        const handleInteraction = () => {
            onStartApp();
        };
        
        window.addEventListener('keydown', handleInteraction);
        window.addEventListener('click', handleInteraction);

        return () => {
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('click', handleInteraction);
        };
    }, [onStartApp]);

    return (
        <div className="fixed inset-0 bg-background z-[90] flex flex-col items-center justify-center font-press-start text-text-primary cursor-pointer">
            <div className="text-center animate-pulse">
                <h1 className="text-3xl sm:text-5xl text-brand-primary">AI APPS</h1>
                <p className="text-lg text-text-secondary mt-8">PRESS ANY KEY TO START</p>
            </div>
        </div>
    );
};