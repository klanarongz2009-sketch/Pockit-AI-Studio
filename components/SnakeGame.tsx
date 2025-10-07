
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PageWrapper } from './PageComponents';
import * as audioService from '../services/audioService';
import * as preferenceService from '../services/preferenceService';

interface SnakeGameProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
}

const GAME_WIDTH = 640;
const GAME_HEIGHT = 480;
const GRID_SIZE = 20;
const ROWS = GAME_HEIGHT / GRID_SIZE;
const COLS = GAME_WIDTH / GRID_SIZE;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export const SnakeGame: React.FC<SnakeGameProps> = ({ onClose, playSound }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameLoopRef = useRef<number | null>(null);
    
    const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
    const [food, setFood] = useState({ x: 15, y: 15 });
    const directionRef = useRef<Direction>('RIGHT');
    const nextDirectionRef = useRef<Direction>('RIGHT');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [isNewHighScore, setIsNewHighScore] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const touchStartRef = useRef<{ x: number, y: number } | null>(null);

    const generateFood = useCallback((snakeBody: { x: number, y: number }[]) => {
        let newFoodPos;
        do {
            newFoodPos = {
                x: Math.floor(Math.random() * COLS),
                y: Math.floor(Math.random() * ROWS),
            };
        } while (snakeBody.some(segment => segment.x === newFoodPos.x && segment.y === newFoodPos.y));
        setFood(newFoodPos);
    }, []);

    const resetGame = useCallback(() => {
        playSound(audioService.playGenerate);
        setSnake([{ x: 10, y: 10 }]);
        generateFood([{ x: 10, y: 10 }]);
        directionRef.current = 'RIGHT';
        nextDirectionRef.current = 'RIGHT';
        setScore(0);
        setIsGameOver(false);
        setGameStarted(true);
        setIsNewHighScore(false);
    }, [playSound, generateFood]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const key = e.key;
        const currentDirection = directionRef.current;
        let nextDirection = nextDirectionRef.current;

        if ((key === 'ArrowUp' || key.toLowerCase() === 'w') && currentDirection !== 'DOWN') nextDirection = 'UP';
        else if ((key === 'ArrowDown' || key.toLowerCase() === 's') && currentDirection !== 'UP') nextDirection = 'DOWN';
        else if ((key === 'ArrowLeft' || key.toLowerCase() === 'a') && currentDirection !== 'RIGHT') nextDirection = 'LEFT';
        else if ((key === 'ArrowRight' || key.toLowerCase() === 'd') && currentDirection !== 'LEFT') nextDirection = 'RIGHT';
        
        nextDirectionRef.current = nextDirection;
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (!touchStartRef.current || e.changedTouches.length === 0) return;

            const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
            const touchStart = touchStartRef.current;
            touchStartRef.current = null;

            const deltaX = touchEnd.x - touchStart.x;
            const deltaY = touchEnd.y - touchStart.y;
            const SWIPE_THRESHOLD = 30;

            if (Math.abs(deltaX) > Math.abs(deltaY)) { // Horizontal swipe
                if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
                    if (deltaX > 0 && directionRef.current !== 'LEFT') {
                        nextDirectionRef.current = 'RIGHT';
                    } else if (deltaX < 0 && directionRef.current !== 'RIGHT') {
                        nextDirectionRef.current = 'LEFT';
                    }
                }
            } else { // Vertical swipe
                if (Math.abs(deltaY) > SWIPE_THRESHOLD) {
                    if (deltaY > 0 && directionRef.current !== 'UP') {
                        nextDirectionRef.current = 'DOWN';
                    } else if (deltaY < 0 && directionRef.current !== 'DOWN') {
                        nextDirectionRef.current = 'UP';
                    }
                }
            }
        };

        const canvas = canvasRef.current;
        if (canvas) {
            canvas.addEventListener('touchstart', handleTouchStart);
            canvas.addEventListener('touchend', handleTouchEnd);
        }
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (canvas) {
                canvas.removeEventListener('touchstart', handleTouchStart);
                canvas.removeEventListener('touchend', handleTouchEnd);
            }
        };
    }, [handleKeyDown]);
    
    useEffect(() => {
        if (isGameOver) {
            if (score > highScore) {
                setHighScore(score);
                setIsNewHighScore(true);
                playSound(audioService.playSuccess);
            } else {
                setIsNewHighScore(false);
            }
        }
    }, [isGameOver, score, highScore, playSound]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        if (!gameStarted) {
            ctx.fillStyle = 'white';
            ctx.font = '32px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText('SNAKE GAME', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
            return;
        }

        if (isGameOver) {
            ctx.fillStyle = '#ff00ff';
            ctx.font = '48px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);

            if (isNewHighScore) {
                ctx.fillStyle = '#00ff00';
                ctx.font = '24px "Press Start 2P"';
                ctx.fillText('คะแนนสูงสุดใหม่!', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
            }

            ctx.fillStyle = 'white';
            ctx.font = '24px "Press Start 2P"';
            ctx.fillText(`SCORE: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
            return;
        }

        // Draw snake
        snake.forEach((segment, index) => {
            ctx.fillStyle = index === 0 ? '#00ff00' : '#00cc00'; // Head is brighter
            ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);
        });

        // Draw food
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    }, [snake, food, isGameOver, score, gameStarted, isNewHighScore]);

    const gameLoop = useCallback(() => {
        if (isGameOver || !gameStarted) {
            draw();
            return;
        }
        
        directionRef.current = nextDirectionRef.current;
        const newSnake = [...snake];
        const head = { ...newSnake[0] };

        switch (directionRef.current) {
            case 'UP': head.y -= 1; break;
            case 'DOWN': head.y += 1; break;
            case 'LEFT': head.x -= 1; break;
            case 'RIGHT': head.x += 1; break;
        }

        // Wall collision
        if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
            playSound(audioService.playGameOver);
            setIsGameOver(true);
            return;
        }

        // Self collision
        for (let i = 1; i < newSnake.length; i++) {
            if (head.x === newSnake[i].x && head.y === newSnake[i].y) {
                playSound(audioService.playGameOver);
                setIsGameOver(true);
                return;
            }
        }

        newSnake.unshift(head);

        // Food collision
        if (head.x === food.x && head.y === food.y) {
            setScore(s => s + 10);
            playSound(audioService.playScore);
            generateFood(newSnake);
        } else {
            newSnake.pop();
        }

        setSnake(newSnake);
        draw();
    }, [snake, food, isGameOver, gameStarted, playSound, generateFood, draw]);
    
    useEffect(() => {
        if (gameStarted && !isGameOver) {
            const difficulty = preferenceService.getPreference('defaultMinigameDifficulty', 'normal');
            const baseSpeed = { easy: 200, normal: 150, hard: 100 }[difficulty];
            const speed = Math.max(50, baseSpeed - (score * 0.5)); // Speed increases with score
            gameLoopRef.current = window.setInterval(gameLoop, speed);
        } else {
            if (gameLoopRef.current) clearInterval(gameLoopRef.current);
            draw(); // Draw final state
        }
        return () => {
            if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        };
    }, [gameLoop, gameStarted, isGameOver, score, draw]);
    

    return (
        <PageWrapper>
             <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
                 <header className="w-full flex items-center justify-between mb-4">
                     <button onClick={onClose} className="text-sm underline hover:text-brand-yellow transition-colors pr-4 font-sans">
                        &#x2190; กลับ
                    </button>
                    <h2 className="text-xl text-brand-yellow font-press-start">เกมงู</h2>
                     <div className="text-right font-press-start text-brand-light text-base">
                        <span className="mr-4">คะแนนสูงสุด: {highScore}</span>
                        <span>คะแนน: {score}</span>
                     </div>
                </header>
                 <canvas
                    ref={canvasRef}
                    width={GAME_WIDTH}
                    height={GAME_HEIGHT}
                    className="border-4 border-brand-light w-full max-w-full bg-black"
                    style={{ aspectRatio: `${GAME_WIDTH}/${GAME_HEIGHT}`}}
                    aria-label="Snake game canvas"
                 />
                 <div className="w-full flex justify-center gap-4 mt-4">
                    {(!gameStarted || isGameOver) && (
                         <button onClick={resetGame} className="w-full max-w-xs p-3 bg-brand-cyan text-black border-4 border-brand-light shadow-pixel transition-all hover:bg-brand-yellow active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] font-press-start">
                             {isGameOver ? 'เล่นอีกครั้ง' : 'เริ่มเกม'}
                         </button>
                    )}
                 </div>
             </div>
        </PageWrapper>
    );
};
