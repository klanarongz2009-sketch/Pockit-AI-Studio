import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PageWrapper, PageHeader } from './PageComponents';
import * as audioService from '../services/audioService';
import { useCredits } from '../contexts/CreditContext';

const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];

// Tailwind CSS classes for colors
const noteColors: { [key: string]: string } = {
    'C4': 'bg-[#ff6b6b]', // red
    'D4': 'bg-[#ffa07a]', // lightsalmon
    'E4': 'bg-[#ffd700]', // gold
    'F4': 'bg-[#98fb98]', // palegreen
    'G4': 'bg-[#add8e6]', // lightblue
    'A4': 'bg-[#87cefa]', // lightskyblue
    'B4': 'bg-[#dda0dd]', // plum
    'C5': 'bg-[#f08080]'  // lightcoral
};
const activeNoteColors: { [key: string]: string } = {
    'C4': 'bg-[#ff4757]',
    'D4': 'bg-[#ff7f50]',
    'E4': 'bg-[#ffc300]',
    'F4': 'bg-[#7bed9f]',
    'G4': 'bg-[#54a0ff]',
    'A4': 'bg-[#2e86de]',
    'B4': 'bg-[#c56cf0]',
    'C5': 'bg-[#ff6348]'
};


type GameState = 'idle' | 'showingSequence' | 'playerTurn' | 'gameOver';

export const MusicMemoryGamePage: React.FC<{
    onClose: () => void;
    playSound: (player: () => void) => void;
}> = ({ onClose, playSound }) => {
    const [sequence, setSequence] = useState<string[]>([]);
    const [playerSequence, setPlayerSequence] = useState<string[]>([]);
    const [gameState, setGameState] = useState<GameState>('idle');
    const [activeNote, setActiveNote] = useState<string | null>(null);
    const [level, setLevel] = useState(0);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [isSuccess, setIsSuccess] = useState(false);
    const { addCredits } = useCredits();
    
    const timeoutRef = useRef<number | null>(null);

    const playNote = (note: string, duration = 300) => {
        const freq = audioService.NOTE_FREQUENCIES[note];
        if (freq) {
            audioService.playMusicalNote(freq, 'sine', duration / 1000);
            setActiveNote(note);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = window.setTimeout(() => setActiveNote(null), duration);
        }
    };

    const showSequence = useCallback(async () => {
        setGameState('showingSequence');
        // Speed up the sequence as the level increases
        const delay = Math.max(200, 600 - sequence.length * 20);
        for (let i = 0; i < sequence.length; i++) {
            // Use a slightly longer delay before the first note
            await new Promise(resolve => setTimeout(resolve, i === 0 ? delay + 200 : delay));
            playNote(sequence[i], delay - 50);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        setGameState('playerTurn');
    }, [sequence]);

    const startNextLevel = useCallback(() => {
        playSound(audioService.playGenerate);
        const nextNote = notes[Math.floor(Math.random() * notes.length)];
        setSequence(prev => [...prev, nextNote]);
        setPlayerSequence([]);
        setLevel(prev => prev + 1);
    }, [playSound]);
    
    useEffect(() => {
        if (sequence.length > 0 && gameState === 'idle') {
             showSequence();
        }
    }, [sequence, gameState, showSequence]);
    
    const handlePlayerNotePress = (note: string) => {
        if (gameState !== 'playerTurn') return;

        playNote(note);
        const newPlayerSequence = [...playerSequence, note];
        setPlayerSequence(newPlayerSequence);

        if (sequence[newPlayerSequence.length - 1] !== note) {
            playSound(audioService.playError);
            setGameState('gameOver');
            if (score > highScore) {
                setHighScore(score);
            }
            return;
        } else {
             playSound(audioService.playSelection);
        }

        if (newPlayerSequence.length === sequence.length) {
            const pointsEarned = level * 10;
            setScore(prev => prev + pointsEarned);
            addCredits(level * 5);
            
            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 500);

            setGameState('idle');
            setTimeout(() => {
                startNextLevel();
            }, 1200);
        }
    };

    const getStatusMessage = () => {
        switch (gameState) {
            case 'idle':
                if (level === 0) return 'กด "เริ่ม" เพื่อท้าทาย';
                return `ยอดเยี่ยม! +${level*10} คะแนน`;
            case 'showingSequence': return 'AI กำลังเล่น...';
            case 'playerTurn': return 'ตาของคุณ!';
            case 'gameOver': return 'เกมจบแล้ว!';
            default: return '';
        }
    };
    
    const handleRestart = () => {
        setGameState('idle');
        setSequence([]);
        setPlayerSequence([]);
        setLevel(0);
        setScore(0);
        setTimeout(() => startNextLevel(), 100);
    };

    return (
        <PageWrapper>
            <PageHeader title="นักสืบเสียงดนตรี" onBack={onClose} />
            <main id="main-content" className="w-full max-w-2xl flex-grow flex flex-col items-center justify-center gap-6 p-4">
                <div className="w-full grid grid-cols-3 items-center font-press-start text-brand-light text-center">
                    <span>ระดับ: {level > 0 ? level : '-'}</span>
                    <span className="text-lg text-brand-yellow">คะแนน: {score}</span>
                    <span>สูงสุด: {highScore}</span>
                </div>
                
                <div 
                    aria-live="polite"
                    className="h-8 text-center font-press-start text-brand-yellow text-lg"
                >
                    {getStatusMessage()}
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 w-full max-w-xl">
                    {notes.map(note => {
                        const baseColor = noteColors[note as keyof typeof noteColors] || 'bg-gray-500';
                        const activeColor = activeNoteColors[note as keyof typeof noteColors] || 'bg-gray-400';
                        const color = activeNote === note ? activeColor : baseColor;
                        return (
                            <button
                                key={note}
                                onClick={() => handlePlayerNotePress(note)}
                                disabled={gameState !== 'playerTurn'}
                                className={`w-full aspect-square border-4 border-brand-light shadow-pixel transition-all disabled:opacity-50 disabled:cursor-not-allowed ${color} ${activeNote === note ? 'scale-110' : 'hover:brightness-125'} ${isSuccess ? 'animate-pulse' : ''}`}
                                aria-label={`เล่นโน้ต ${note}`}
                            >
                                <span className="font-press-start text-black text-opacity-70 text-lg pointer-events-none">
                                    {note.slice(0, -1)}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {gameState === 'idle' && level === 0 && (
                    <button
                        onClick={startNextLevel}
                        className="w-full max-w-xs mt-4 p-3 bg-brand-cyan text-black border-4 border-brand-light shadow-pixel font-press-start text-lg hover:bg-brand-yellow"
                    >
                        เริ่มเกม
                    </button>
                )}
                 {gameState === 'gameOver' && (
                    <div className="text-center space-y-4 mt-4 animate-fadeIn">
                        <p className="font-press-start text-xl text-brand-magenta">
                            จบเกม!
                        </p>
                        <p className="font-press-start text-lg">
                            คะแนนสุดท้าย: <span className="text-brand-yellow">{score}</span>
                        </p>
                        {score > highScore && <p className="font-press-start text-brand-lime">คะแนนสูงสุดใหม่!</p>}
                        <button
                            onClick={handleRestart}
                            className="w-full max-w-xs p-3 bg-brand-cyan text-black border-4 border-brand-light shadow-pixel font-press-start text-lg hover:bg-brand-yellow"
                        >
                            เล่นอีกครั้ง
                        </button>
                    </div>
                )}
            </main>
        </PageWrapper>
    );
};
