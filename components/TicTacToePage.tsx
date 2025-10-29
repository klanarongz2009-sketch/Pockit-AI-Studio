import React, { useState, useEffect, useCallback } from 'react';
import { PageWrapper, PageHeader } from './PageComponents';
import * as audioService from '../services/audioService';
import * as geminiService from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { useCredits } from '../contexts/CreditContext';

interface TicTacToePageProps {
  onClose: () => void;
  playSound: (player: () => void) => void;
  isOnline: boolean;
}

const initialBoard = () => Array(3).fill(null).map(() => Array(3).fill(''));
const checkWinner = (board: string[][]): string | null => {
    // Check rows and columns
    for (let i = 0; i < 3; i++) {
        if (board[i][0] && board[i][0] === board[i][1] && board[i][0] === board[i][2]) return board[i][0];
        if (board[0][i] && board[0][i] === board[1][i] && board[0][i] === board[2][i]) return board[0][i];
    }
    // Check diagonals
    if (board[0][0] && board[0][0] === board[1][1] && board[0][0] === board[2][2]) return board[0][0];
    if (board[0][2] && board[0][2] === board[1][1] && board[0][2] === board[2][0]) return board[0][2];
    // Check for tie
    if (board.flat().every(cell => cell)) return 'Tie';
    return null;
};

export const TicTacToePage: React.FC<TicTacToePageProps> = ({ onClose, playSound, isOnline }) => {
    const [board, setBoard] = useState(initialBoard);
    const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
    const [winner, setWinner] = useState<string | null>(null);
    const [isAiTurn, setIsAiTurn] = useState(false);
    const [gameMode, setGameMode] = useState<'ai' | 'player'>('ai'); // 'ai' vs player, 'player' vs player
    const [error, setError] = useState<string | null>(null);
    const { addCredits } = useCredits();

    useEffect(() => {
        const handleWin = async () => {
            if (winner) {
                if (winner === 'X') {
                    await addCredits(32);
                } else if (winner === 'O') {
                    await addCredits(20);
                }
                // No credits for a Tie
            }
        };
        handleWin();
    }, [winner, addCredits]);

    const handleCellClick = async (row: number, col: number) => {
        if (board[row][col] || winner || isAiTurn) return;

        playSound(audioService.playClick);
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = currentPlayer;
        setBoard(newBoard);

        const newWinner = checkWinner(newBoard);
        if (newWinner) {
            setWinner(newWinner);
            playSound(newWinner === 'Tie' ? audioService.playMiss : audioService.playSuccess);
        } else {
            const nextPlayer = currentPlayer === 'X' ? 'O' : 'X';
            setCurrentPlayer(nextPlayer);
            if (gameMode === 'ai' && nextPlayer === 'O') {
                setIsAiTurn(true);
            }
        }
    };

    const aiMove = useCallback(async () => {
        if (!isOnline) {
            setError('AI move requires an internet connection.');
            setIsAiTurn(false);
            return;
        }

        try {
            const move = await geminiService.getTicTacToeMove(board, 'O');
            if (board[move.row][move.col] === '') {
                playSound(audioService.playGenerate);
                const newBoard = board.map(r => [...r]);
                newBoard[move.row][move.col] = 'O';
                setBoard(newBoard);

                const newWinner = checkWinner(newBoard);
                if (newWinner) {
                    setWinner(newWinner);
                    playSound(newWinner === 'Tie' ? audioService.playMiss : audioService.playSuccess);
                } else {
                    setCurrentPlayer('X');
                }
            } else {
                // AI made an invalid move, let's try again or handle it. For now, just log and let user play.
                console.error("AI made an invalid move.");
                setCurrentPlayer('X');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'AI failed to make a move.');
            playSound(audioService.playError);
        } finally {
            setIsAiTurn(false);
        }
    }, [board, isOnline, playSound]);

    useEffect(() => {
        if (isAiTurn && !winner) {
            aiMove();
        }
    }, [isAiTurn, winner, aiMove]);

    const handleReset = () => {
        playSound(audioService.playGenerate);
        setBoard(initialBoard());
        setCurrentPlayer('X');
        setWinner(null);
        setIsAiTurn(false);
        setError(null);
    };

    const handleModeChange = (mode: 'ai' | 'player') => {
        playSound(audioService.playClick);
        setGameMode(mode);
        handleReset();
    };


    return (
        <PageWrapper>
            <PageHeader title="Smart Tic-Tac-Toe" onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-6 font-sans">
                <div className="flex gap-4">
                    <button onClick={() => handleModeChange('ai')} className={`px-4 py-2 border-2 ${gameMode === 'ai' ? 'bg-brand-yellow text-black' : 'bg-surface-primary'}`}>VS AI</button>
                    <button onClick={() => handleModeChange('player')} className={`px-4 py-2 border-2 ${gameMode === 'player' ? 'bg-brand-yellow text-black' : 'bg-surface-primary'}`}>2 Players</button>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-brand-light p-2 border-4 border-brand-light shadow-pixel">
                    {board.map((row, rowIndex) =>
                        row.map((cell, colIndex) => (
                            <button
                                key={`${rowIndex}-${colIndex}`}
                                onClick={() => handleCellClick(rowIndex, colIndex)}
                                className="w-24 h-24 bg-background text-6xl font-press-start flex items-center justify-center"
                                disabled={!!winner || isAiTurn}
                                aria-label={`Cell ${rowIndex}, ${colIndex}, value ${cell || 'empty'}`}
                            >
                                {cell === 'X' && <span className="text-brand-cyan">X</span>}
                                {cell === 'O' && <span className="text-brand-magenta">O</span>}
                            </button>
                        ))
                    )}
                </div>

                <div className="h-20 text-center">
                    {error && <p className="text-brand-magenta">{error}</p>}
                    {isAiTurn && <LoadingSpinner text="AI is thinking..." />}
                    {winner && (
                        <div className="animate-fadeIn space-y-4">
                            <p className="font-press-start text-2xl text-brand-yellow">
                                {winner === 'Tie' ? 'It\'s a Tie!' : `${winner} Wins!`}
                            </p>
                            <button onClick={handleReset} className="p-2 bg-brand-cyan text-black border-2 border-black font-press-start">Play Again</button>
                        </div>
                    )}
                    {!winner && !isAiTurn && (
                         <p className="font-press-start text-lg text-brand-light">
                            {currentPlayer}'s Turn
                        </p>
                    )}
                </div>
            </main>
        </PageWrapper>
    );
};