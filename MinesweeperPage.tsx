


import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageWrapper, PageHeader } from './PageComponents';
import * as audioService from '../services/audioService';
import { MineCheekIcon } from './icons/MineCheekIcon';
import { FlagCheekIcon } from './icons/FlagCheekIcon';
import { FacePlayingIcon } from './icons/FacePlayingIcon';
import { FaceWonIcon } from './icons/FaceWonIcon';
import { FaceLostIcon } from './icons/FaceLostIcon';
import { useCredits } from '../contexts/CreditContext';


interface MinesweeperPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
}

const ROWS = 16;
const COLS = 16;
const MINES = 40;

interface Cell {
    isMine: boolean;
    isRevealed: boolean;
    isFlagged: boolean;
    adjacentMines: number;
}

type Board = Cell[][];
type GameState = 'playing' | 'won' | 'lost';

export const MinesweeperPage: React.FC<MinesweeperPageProps> = ({ onClose, playSound }) => {
    const [board, setBoard] = useState<Board>([]);
    const [gameState, setGameState] = useState<GameState>('playing');
    const [flagsUsed, setFlagsUsed] = useState(0);
    const [time, setTime] = useState(0);
    const { addCredits } = useCredits();

    const createBoard = useCallback((): Board => {
        // 1. Create empty board
        const newBoard: Board = Array(ROWS).fill(null).map(() => Array(COLS).fill(null).map(() => ({
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            adjacentMines: 0,
        })));

        // 2. Place mines
        let minesPlaced = 0;
        while (minesPlaced < MINES) {
            const row = Math.floor(Math.random() * ROWS);
            const col = Math.floor(Math.random() * COLS);
            if (!newBoard[row][col].isMine) {
                newBoard[row][col].isMine = true;
                minesPlaced++;
            }
        }

        // 3. Calculate adjacent mines
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (newBoard[r][c].isMine) continue;
                let count = 0;
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        const newR = r + i;
                        const newC = c + j;
                        if (newR >= 0 && newR < ROWS && newC >= 0 && newC < COLS && newBoard[newR][newC].isMine) {
                            count++;
                        }
                    }
                }
                newBoard[r][c].adjacentMines = count;
            }
        }
        return newBoard;
    }, []);

    const resetGame = useCallback(() => {
        playSound(audioService.playGenerate);
        setBoard(createBoard());
        setGameState('playing');
        setFlagsUsed(0);
        setTime(0);
    }, [createBoard, playSound]);

    useEffect(() => {
        resetGame();
    }, [resetGame]);
    
    useEffect(() => {
        let timer: number;
        if (gameState === 'playing' && time < 999) {
            timer = window.setInterval(() => {
                setTime(t => t + 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [gameState, time]);

    const revealCell = (r: number, c: number) => {
        const newBoard = board.map(row => row.map(cell => ({ ...cell })));
        
        const stack: [number, number][] = [[r, c]];
        const visited = new Set<string>();

        while (stack.length > 0) {
            const [row, col] = stack.pop()!;
            const cellKey = `${row},${col}`;
            
            if (row < 0 || row >= ROWS || col < 0 || col >= COLS || visited.has(cellKey) || newBoard[row][col].isFlagged) {
                continue;
            }
            
            visited.add(cellKey);
            const cell = newBoard[row][col];
            cell.isRevealed = true;

            if (cell.adjacentMines === 0 && !cell.isMine) {
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        stack.push([row + i, col + j]);
                    }
                }
            }
        }
        setBoard(newBoard);
    };

    const handleCellClick = (r: number, c: number) => {
        if (gameState !== 'playing' || board[r][c].isRevealed || board[r][c].isFlagged) return;

        playSound(audioService.playClick);

        if (board[r][c].isMine) {
            const newBoard = board.map(row => row.map(cell => ({ ...cell, isRevealed: cell.isMine })));
            setBoard(newBoard);
            setGameState('lost');
            playSound(audioService.playGameOver);
            return;
        }

        revealCell(r, c);
    };

    const handleRightClick = (e: React.MouseEvent, r: number, c: number) => {
        e.preventDefault();
        if (gameState !== 'playing' || board[r][c].isRevealed) return;

        playSound(audioService.playToggle);
        const newBoard = [...board];
        const cell = newBoard[r][c];
        
        if (cell.isFlagged) {
            cell.isFlagged = false;
            setFlagsUsed(f => f - 1);
        } else if (flagsUsed < MINES) {
            cell.isFlagged = true;
            setFlagsUsed(f => f + 1);
        }
        setBoard(newBoard);
    };
    
    useEffect(() => {
        // FIX: Wrap logic in an async function to handle async addCredits.
        const checkWinCondition = async () => {
            if (gameState !== 'playing' || board.length === 0) return;
            
            const revealedCount = board.flat().filter(cell => cell.isRevealed).length;
            const totalNonMines = ROWS * COLS - MINES;

            if (revealedCount === totalNonMines) {
                setGameState('won');
                playSound(audioService.playSuccess);
                await addCredits(1);
            }
        };
        checkWinCondition();
    }, [board, gameState, playSound, addCredits]);

    const renderCell = (cell: Cell, r: number, c: number) => {
        if (cell.isFlagged) {
            return <FlagCheekIcon className="w-4 h-4 sm:w-5 sm:h-5 mx-auto"/>;
        }
        if (!cell.isRevealed) {
            return '';
        }
        if (cell.isMine) {
            return <MineCheekIcon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto"/>;
        }
        if (cell.adjacentMines > 0) {
            const colors = ['#00ffff', '#00ff00', '#ffff00', '#ff8800', '#ff0000', '#ff00ff', '#ffffff', '#888888'];
            return <span style={{ color: colors[cell.adjacentMines - 1] }}>{cell.adjacentMines}</span>;
        }
        return '';
    };

    const face = gameState === 'lost' ? <FaceLostIcon /> : gameState === 'won' ? <FaceWonIcon /> : <FacePlayingIcon />;

    return (
        <PageWrapper>
            <PageHeader title="Minesweeper" onBack={onClose} />
            <main id="main-content" className="flex flex-col items-center gap-4 font-sans">
                <div className="p-2 bg-black/50 border-4 border-brand-light flex items-center justify-between w-full max-w-lg font-press-start">
                    <div className="bg-black text-brand-magenta p-2 text-2xl w-20 text-center">{String(MINES - flagsUsed).padStart(3, '0')}</div>
                    <button onClick={resetGame} className="w-12 h-12 flex items-center justify-center bg-brand-yellow text-4xl">
                        <div className="w-10 h-10">{face}</div>
                    </button>
                    <div className="bg-black text-brand-magenta p-2 text-2xl w-20 text-center">{String(time).padStart(3, '0')}</div>
                </div>

                <div 
                  className="grid border-2 border-brand-light"
                  style={{ 
                    gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                    backgroundColor: '#777',
                    backgroundImage: `url("data:image/svg+xml,%3csvg width='30' height='30' viewBox='0 0 10 10' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='rgba(255, 255, 255, 0.1)'%3e%3cpath d='M2 3h1v1H2z M7 3h1v1H7z M3 6h4v1H3z'/%3e%3c/g%3e%3c/svg%3e")`
                  }}
                >
                    {board.map((row, r) =>
                        row.map((cell, c) => (
                            <button
                                key={`${r}-${c}`}
                                onClick={() => handleCellClick(r, c)}
                                onContextMenu={(e) => handleRightClick(e, r, c)}
                                disabled={gameState !== 'playing'}
                                className={`w-6 h-6 sm:w-8 sm:h-8 border text-sm font-bold flex items-center justify-center ${
                                    !cell.isRevealed
                                        ? 'border-t-white/50 border-l-white/50 border-b-black/50 border-r-black/50 bg-brand-light/20 hover:bg-brand-light/40'
                                        : 'border-brand-light/30 bg-black/30'
                                }`}
                                aria-label={`Cell at row ${r}, column ${c}`}
                            >
                                {renderCell(cell, r, c)}
                            </button>
                        ))
                    )}
                </div>
                 {gameState !== 'playing' && (
                    <div className="font-press-start text-center text-2xl mt-4">
                        <p className={gameState === 'won' ? 'text-brand-lime' : 'text-brand-magenta'}>
                            {gameState === 'won' ? 'You Win!' : 'Game Over!'}
                        </p>
                    </div>
                )}
            </main>
        </PageWrapper>
    );
};