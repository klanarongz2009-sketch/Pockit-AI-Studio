
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageWrapper, PageHeader } from './PageComponents';
import * as audioService from '../services/audioService';

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
        if (gameState !== 'playing') return;
        
        const revealedCount = board.flat().filter(cell => cell.isRevealed).length;
        const totalNonMines = ROWS * COLS - MINES;

        if (revealedCount === totalNonMines) {
            setGameState('won');
            playSound(audioService.playSuccess);
        }
    }, [board, gameState, playSound]);

    const renderCell = (cell: Cell, r: number, c: number) => {
        if (cell.isFlagged) {
            return '🚩';
        }
        if (!cell.isRevealed) {
            return '';
        }
        if (cell.isMine) {
            return '💣';
        }
        if (cell.adjacentMines > 0) {
            const colors = ['#00ffff', '#00ff00', '#ffff00', '#ff8800', '#ff0000', '#ff00ff', '#ffffff', '#888888'];
            return <span style={{ color: colors[cell.adjacentMines - 1] }}>{cell.adjacentMines}</span>;
        }
        return '';
    };

    const face = gameState === 'lost' ? '😵' : gameState === 'won' ? '😎' : '🙂';

    return (
        <PageWrapper>
            <PageHeader title="Minesweeper" onBack={onClose} />
            <main id="main-content" className="flex flex-col items-center gap-4 font-sans">
                <div className="p-2 bg-black/50 border-4 border-brand-light flex items-center justify-between w-full max-w-lg font-press-start">
                    <div className="bg-black text-brand-magenta p-2 text-2xl w-20 text-center">{String(MINES - flagsUsed).padStart(3, '0')}</div>
                    <button onClick={resetGame} className="text-4xl w-12 h-12 flex items-center justify-center bg-brand-yellow">{face}</button>
                    <div className="bg-black text-brand-magenta p-2 text-2xl w-20 text-center">{String(time).padStart(3, '0')}</div>
                </div>

                <div className="grid border-2 border-brand-light bg-black" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
                    {board.map((row, r) =>
                        row.map((cell, c) => (
                            <button
                                key={`${r}-${c}`}
                                onClick={() => handleCellClick(r, c)}
                                onContextMenu={(e) => handleRightClick(e, r, c)}
                                disabled={gameState !== 'playing'}
                                className={`w-6 h-6 sm:w-8 sm:h-8 border text-sm font-bold ${
                                    !cell.isRevealed
                                        ? 'border-brand-light bg-brand-light/20 hover:bg-brand-light/40'
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
