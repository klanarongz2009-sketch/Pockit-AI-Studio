

import React, { useState, useEffect, useCallback } from 'react';
import { PageWrapper } from './PageComponents';
import * as audioService from '../services/audioService';
import * as preferenceService from '../services/preferenceService';
import { getTicTacToeMove } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { useCredits } from '../contexts/CreditContext';

interface TicTacToePageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

type Player = 'X' | 'O';
type Winner = Player | 'Draw' | null;
type GameMode = 'ai' | 'player';
type Difficulty = 'easy' | 'hard';

const initialBoard = () => Array(3).fill(null).map(() => Array(3).fill(''));

const checkWinner = (board: string[][]): Winner => {
    const lines = [
        // Rows
        [board[0][0], board[0][1], board[0][2]],
        [board[1][0], board[1][1], board[1][2]],
        [board[2][0], board[2][1], board[2][2]],
        // Columns
        [board[0][0], board[1][0], board[2][0]],
        [board[0][1], board[1][1], board[2][1]],
        [board[0][2], board[1][2], board[2][2]],
        // Diagonals
        [board[0][0], board[1][1], board[2][2]],
        [board[0][2], board[1][1], board[2][0]],
    ];

    for (const line of lines) {
        if (line[0] && line[0] === line[1] && line[1] === line[2]) {
            return line[0] as Winner;
        }
    }

    if (board.flat().every(cell => cell !== '')) {
        return 'Draw';
    }

    return null;
};


export const TicTacToePage: React.FC<TicTacToePageProps> = ({ onClose, playSound, isOnline }) => {
    const [board, setBoard] = useState<string[][]>(initialBoard());
    const [turn, setTurn] = useState<Player>('X');
    const [winner, setWinner] = useState<Winner>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameMode, setGameMode] = useState<GameMode>('ai');
    const [difficulty, setDifficulty] = useState<Difficulty>(() => preferenceService.getPreference('defaultMinigameDifficulty', 'hard') as Difficulty);
    const { addCredits } = useCredits();

    const player: Player = 'X';
    const ai: Player = 'O';

    const startGame = (mode: GameMode, diff: Difficulty) => {
        setGameMode(mode);
        setDifficulty(diff);
        setGameStarted(true);
        resetGame();
    };

    const resetGame = useCallback(() => {
        playSound(audioService.playGenerate);
        setBoard(initialBoard());
        setTurn('X');
        setWinner(null);
        setIsAiThinking(false);
        setError(null);
    }, [playSound]);

    const handleAiMove = useCallback(async (currentBoard: string[][]) => {
        setIsAiThinking(true);
        setError(null);
        
        const makeRandomMove = (): { row: number, col: number } | null => {
            const emptyCells: { row: number, col: number }[] = [];
            currentBoard.forEach((row, rIdx) => {
                row.forEach((cell, cIdx) => {
                    if (cell === '') emptyCells.push({ row: rIdx, col: cIdx });
                });
            });
            if (emptyCells.length > 0) {
                return emptyCells[Math.floor(Math.random() * emptyCells.length)];
            }
            return null;
        };

        let move: { row: number, col: number } | null = null;

        try {
            if (difficulty === 'easy') {
                move = makeRandomMove();
            } else {
                 move = await getTicTacToeMove(currentBoard, ai);
            }
            
            if (!move || currentBoard[move.row][move.col] !== '') {
                console.warn("AI returned an invalid move. Falling back to random.");
                move = makeRandomMove();
            }
        } catch (err) {
            console.error("AI move failed, falling back to random move.", err);
            move = makeRandomMove();
        } finally {
            if (move) {
                const newBoard = currentBoard.map(row => [...row]);
                newBoard[move.row][move.col] = ai;
                playSound(audioService.playSelection);
                setBoard(newBoard);

                const gameWinner = checkWinner(newBoard);
                if (gameWinner) {
                    setWinner(gameWinner);
                    if (gameWinner === ai) {
                        playSound(audioService.playError);
                        addCredits(100); // AI WINS
                    } else if (gameWinner === 'Draw') {
                        playSound(audioService.playToggle);
                    }
                } else {
                    setTurn(player);
                }
            } else {
                 setError("AI could not make a move.");
            }
            setIsAiThinking(false);
        }
    }, [ai, player, playSound, difficulty, addCredits]);

    const handlePlayerMove = (row: number, col: number) => {
        if (board[row][col] !== '' || winner || isAiThinking) return;
        if (gameMode === 'ai' && turn !== player) return;

        const currentPlayer = turn;
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = currentPlayer;
        playSound(audioService.playClick);
        setBoard(newBoard);

        const gameWinner = checkWinner(newBoard);
        if (gameWinner) {
            setWinner(gameWinner);
            if (gameWinner === player) {
                playSound(audioService.playSuccess);
                addCredits(490); // HUMAN WINS
            } else if (gameWinner === 'Draw') {
                playSound(audioService.playToggle);
            }
        } else {
            const nextTurn = currentPlayer === 'X' ? 'O' : 'X';
            setTurn(nextTurn);
            if (gameMode === 'ai' && nextTurn === ai) {
                handleAiMove(newBoard);
            }
        }
    };
    
    const getStatusMessage = () => {
        if (winner) {
            if (winner === 'Draw') return "เสมอ!";
            if (winner === player) return `คุณชนะ! (+490 เครดิต)`;
            if (winner === ai) return `AI ชนะ! (+100 เครดิต)`;
            return `ผู้ชนะคือ ${winner}!`;
        }
        if (isAiThinking) return "AI กำลังคิด...";
        if (gameMode === 'player') return `ตาของผู้เล่น ${turn}`;
        if (turn === player) return "ตาของคุณ (X)";
        return "ตาของ AI (O)";
    };

    if (!gameStarted) {
        return (
             <PageWrapper>
                <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center">
                     <header className="w-full flex items-center justify-between mb-8">
                        <button onClick={onClose} className="text-sm underline hover:text-brand-yellow transition-colors pr-4 font-sans">
                            &#x2190; กลับ
                        </button>
                        <h2 className="text-xl text-brand-yellow font-press-start">OX อัจฉริยะ</h2>
                    </header>
                    <div className="space-y-4 w-full">
                        <h3 className="font-press-start text-brand-cyan">เลือกโหมด</h3>
                        <button onClick={() => setGameMode('ai')} className={`w-full p-3 border-4 font-press-start ${gameMode === 'ai' ? 'bg-brand-yellow text-black border-black' : 'bg-brand-cyan/20 text-white border-brand-light'}`}>เล่นกับ AI</button>
                        <button onClick={() => setGameMode('player')} className={`w-full p-3 border-4 font-press-start ${gameMode === 'player' ? 'bg-brand-yellow text-black border-black' : 'bg-brand-cyan/20 text-white border-brand-light'}`}>เล่น 2 คน</button>
                    </div>

                    {gameMode === 'ai' && (
                         <div className="space-y-4 w-full mt-8">
                            <h3 className="font-press-start text-brand-cyan">เลือกระดับความยาก</h3>
                            <button onClick={() => setDifficulty('easy')} className={`w-full p-3 border-4 font-press-start ${difficulty === 'easy' ? 'bg-brand-yellow text-black border-black' : 'bg-brand-lime/80 text-black border-brand-light'}`}>ง่าย</button>
                            <button onClick={() => setDifficulty('hard')} className={`w-full p-3 border-4 font-press-start ${difficulty === 'hard' ? 'bg-brand-yellow text-black border-black' : 'bg-brand-magenta/80 text-white border-brand-light'}`}>ยาก</button>
                        </div>
                    )}

                    <button onClick={() => startGame(gameMode, difficulty)} className="w-full mt-12 p-4 bg-brand-cyan text-black border-4 border-brand-light shadow-pixel font-press-start text-lg hover:bg-brand-yellow">เริ่มเกม</button>
                </div>
            </PageWrapper>
        )
    }

    return (
        <PageWrapper>
            <div className="w-full max-w-sm mx-auto flex flex-col items-center">
                <header className="w-full flex items-center justify-between mb-4">
                     <button onClick={() => setGameStarted(false)} className="text-sm underline hover:text-brand-yellow transition-colors pr-4 font-sans">
                        &#x2190; กลับ
                    </button>
                    <h2 className="text-xl text-brand-yellow font-press-start">OX อัจฉริยะ</h2>
                </header>
                
                <div 
                    role="status" 
                    className="h-8 mb-4 text-center font-press-start text-brand-light flex items-center justify-center"
                >
                    {isAiThinking && !winner ? (
                        <div className="scale-75"><LoadingSpinner text="AI กำลังคิด..." /></div>
                    ) : (
                        getStatusMessage()
                    )}
                </div>

                <div className="grid grid-cols-3 gap-2 bg-brand-light p-2 shadow-pixel">
                    {board.map((row, rowIndex) =>
                        row.map((cell, colIndex) => (
                            <button
                                key={`${rowIndex}-${colIndex}`}
                                onClick={() => handlePlayerMove(rowIndex, colIndex)}
                                disabled={!!cell || !!winner || isAiThinking || (gameMode === 'ai' && turn !== player)}
                                className="w-24 h-24 bg-black flex items-center justify-center text-5xl font-press-start transition-all hover:bg-gray-800 disabled:cursor-not-allowed"
                                aria-label={`ช่อง ${rowIndex + 1}, ${colIndex + 1}: ${cell || 'ว่าง'}`}
                            >
                                <span className={cell === 'X' ? 'text-brand-cyan animate-piece-appear' : 'text-brand-yellow animate-piece-appear'}>
                                    {cell}
                                </span>
                            </button>
                        ))
                    )}
                </div>
                 
                 {error && (
                    <div role="alert" className="mt-4 p-2 text-center text-sm text-brand-light bg-brand-magenta/20 border-2 border-brand-magenta w-full">
                        {error}
                    </div>
                 )}

                {(winner || gameMode === 'player') && (
                    <button
                        onClick={resetGame}
                        className="w-full mt-6 p-3 bg-brand-cyan text-black border-4 border-brand-light shadow-pixel transition-all font-press-start hover:bg-brand-yellow active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px]"
                    >
                        {winner ? 'เล่นอีกครั้ง' : 'เริ่มใหม่'}
                    </button>
                )}
            </div>
        </PageWrapper>
    );
};