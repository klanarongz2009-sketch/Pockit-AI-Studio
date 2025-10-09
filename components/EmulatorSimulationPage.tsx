import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PageWrapper } from './PageComponents';
import * as audioService from '../services/audioService';
import { SnakeGame } from './SnakeGame';
import { TicTacToePage } from './TicTacToePage';
import { useLanguage } from '../contexts/LanguageContext';

interface EmulatorSimulationPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

type Game = 'snake' | 'tictactoe';

const PROGRAMS: { name: string; game: Game; description: string }[] = [
    { name: 'snake.exe', game: 'snake', description: 'Classic snake game' },
    { name: 'tictactoe.exe', game: 'tictactoe', description: 'Play against a friend or AI' },
];

export const EmulatorSimulationPage: React.FC<EmulatorSimulationPageProps> = ({ onClose, playSound, isOnline }) => {
    const { t } = useLanguage();
    const [mode, setMode] = useState<'cli' | 'game'>('cli');
    const [activeGame, setActiveGame] = useState<Game | null>(null);
    const [history, setHistory] = useState<string[]>(['AI APP 1.0 (AiApp1.0)', 'Welcome. Type "help" for a list of commands.']);
    const [input, setInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const terminalEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (mode === 'cli') {
            inputRef.current?.focus();
            terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [history, mode]);

    const processCommand = (command: string) => {
        const [cmd, ...args] = command.toLowerCase().trim().split(' ');
        const newHistory = [...history, `> ${command}`];

        switch (cmd) {
            case 'help':
                newHistory.push('Available commands:', '  help        - Show this message', '  sysinfo     - Display system information', '  list        - List available programs', '  run [prog]  - Run a program (e.g., run snake.exe)', '  clear       - Clear the screen', '  exit        - Close the emulator');
                break;
            case 'sysinfo':
                newHistory.push('System: AI APP 1.0 (AiApp1.0)', 'CPU: Gemini Core @ 2.5 Flash', 'RAM: 128KB', `Network: ${isOnline ? 'Connected' : 'Disconnected'}`);
                break;
            case 'list':
                newHistory.push('Available programs:');
                PROGRAMS.forEach(p => newHistory.push(`  ${p.name.padEnd(15)} - ${p.description}`));
                break;
            case 'run':
                const progName = args[0] || '';
                const prog = PROGRAMS.find(p => p.name === progName);
                if (prog) {
                    newHistory.push(`Launching ${prog.name}...`);
                    setHistory(newHistory);
                    setTimeout(() => {
                        setMode('game');
                        setActiveGame(prog.game);
                    }, 300);
                } else {
                    newHistory.push(`Error: Program "${progName}" not found.`);
                }
                break;
            case 'clear':
                setHistory([]);
                return; // Return early to prevent adding command to history
            case 'exit':
                onClose();
                return;
            default:
                if (command.trim()) {
                    newHistory.push(`Error: Command not found: "${command}"`);
                }
                break;
        }
        setHistory(newHistory);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            playSound(audioService.playSelection);
            processCommand(input);
            setInput('');
        }
    };

    const handleGameClose = () => {
        playSound(audioService.playCloseModal);
        setHistory(prev => [...prev, ' ', 'Program terminated. Welcome back to AiApp1.0.']);
        setMode('cli');
        setActiveGame(null);
    };

    if (mode === 'game') {
        if (activeGame === 'snake') {
            return <SnakeGame onClose={handleGameClose} playSound={playSound} />;
        }
        if (activeGame === 'tictactoe') {
            return <TicTacToePage onClose={handleGameClose} playSound={playSound} isOnline={isOnline} />;
        }
    }

    return (
        <PageWrapper className="!p-0 font-mono">
            <div className="w-full h-full bg-background text-text-secondary text-sm p-2 flex flex-col" onClick={() => inputRef.current?.focus()}>
                <div className="relative flex-grow overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                    {history.map((line, index) => (
                        <div key={index} className="whitespace-pre-wrap">{line}</div>
                    ))}
                    <div ref={terminalEndRef} />
                </div>
                <div className="flex-shrink-0 flex items-center">
                    <span className="text-brand-cyan">&gt;</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="bg-transparent text-text-primary w-full focus:outline-none pl-2"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck="false"
                        aria-label="Command line input"
                    />
                </div>
            </div>
        </PageWrapper>
    );
};
