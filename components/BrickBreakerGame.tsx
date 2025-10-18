

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PageWrapper } from './PageComponents';
import * as audioService from '../services/audioService';
import { useCredits } from '../contexts/CreditContext';

interface BrickBreakerGameProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
}

const GAME_WIDTH = 640;
const GAME_HEIGHT = 480;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 15;
const BALL_RADIUS = 8;
const BRICK_COLS = 10;
const BRICK_ROWS = 5;
const BRICK_WIDTH = GAME_WIDTH / BRICK_COLS;
const BRICK_HEIGHT = 20;
const BRICK_GAP = 2;

export const BrickBreakerGame: React.FC<BrickBreakerGameProps> = ({ onClose, playSound }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameLoopRef = useRef<number | null>(null);

    const [paddleX, setPaddleX] = useState(GAME_WIDTH / 2 - PADDLE_WIDTH / 2);
    const [ball, setBall] = useState({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 50, dx: 4, dy: -4 });
    const [bricks, setBricks] = useState<any[]>([]);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [isNewHighScore, setIsNewHighScore] = useState(false);
    const [lives, setLives] = useState(3);
    const [gameState, setGameState] = useState<'playing' | 'gameOver' | 'win'>('playing');
    const { addCredits } = useCredits();

    const createBricks = useCallback(() => {
        const newBricks = [];
        for (let r = 0; r < BRICK_ROWS; r++) {
            for (let c = 0; c < BRICK_COLS; c++) {
                newBricks.push({
                    x: c * BRICK_WIDTH + BRICK_GAP,
                    y: r * BRICK_HEIGHT + BRICK_GAP + 50,
                    width: BRICK_WIDTH - BRICK_GAP * 2,
                    height: BRICK_HEIGHT - BRICK_GAP * 2,
                    visible: true,
                });
            }
        }
        setBricks(newBricks);
    }, []);

    useEffect(() => {
        createBricks();
    }, [createBricks]);
    
    useEffect(() => {
        if (gameState === 'gameOver' || gameState === 'win') {
            if (score > highScore) {
                setHighScore(score);
                setIsNewHighScore(true);
                playSound(audioService.playSuccess);
            } else {
                setIsNewHighScore(false);
            }
        }
    }, [gameState, score, highScore, playSound]);

    const resetBall = useCallback(() => {
        setBall({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 50, dx: 4, dy: -4 });
        setPaddleX(GAME_WIDTH / 2 - PADDLE_WIDTH / 2);
    }, []);
    
    const handleMouseMove = (e: MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        let relativeX = e.clientX - rect.left;
        if (relativeX > 0 && relativeX < GAME_WIDTH) {
            setPaddleX(Math.min(relativeX - PADDLE_WIDTH / 2, GAME_WIDTH - PADDLE_WIDTH));
        }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        if (e.touches[0]) {
            let relativeX = e.touches[0].clientX - rect.left;
            if (relativeX > 0 && relativeX < GAME_WIDTH) {
                setPaddleX(Math.min(relativeX - PADDLE_WIDTH / 2, GAME_WIDTH - PADDLE_WIDTH));
            }
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        window.addEventListener('mousemove', handleMouseMove);
        canvas?.addEventListener('touchmove', handleTouchMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            canvas?.removeEventListener('touchmove', handleTouchMove);
        };
    }, []);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // Paddle
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(paddleX, GAME_HEIGHT - PADDLE_HEIGHT - 10, PADDLE_WIDTH, PADDLE_HEIGHT);

        // Ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = '#ffff00';
        ctx.fill();
        ctx.closePath();

        // Bricks
        const brickColors = ['#ff00ff', '#ff0088', '#ff8800', '#ffff00', '#88ff00'];
        bricks.forEach((brick, index) => {
            if (brick.visible) {
                ctx.fillStyle = brickColors[Math.floor(index / BRICK_COLS)];
                ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
            }
        });
        
        if (gameState !== 'playing') {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0,0,GAME_WIDTH, GAME_HEIGHT);
            ctx.font = '48px "Press Start 2P"';
            ctx.textAlign = 'center';
            if (gameState === 'gameOver') {
                ctx.fillStyle = '#ff00ff';
                ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
            } else if (gameState === 'win') {
                ctx.fillStyle = '#00ff00';
                ctx.fillText('YOU WIN!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
            }

            if (isNewHighScore) {
                ctx.fillStyle = '#00ff00';
                ctx.font = '24px "Press Start 2P"';
                ctx.fillText('NEW HIGH SCORE!', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
            }

            ctx.fillStyle = 'white';
            ctx.font = '24px "Press Start 2P"';
            ctx.fillText(`SCORE: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
        }

    }, [ball, paddleX, bricks, gameState, isNewHighScore, score]);

    const gameLoop = useCallback(() => {
        if (gameState !== 'playing') {
             draw();
             return;
        }

        let newBall = { ...ball };
        newBall.x += newBall.dx;
        newBall.y += newBall.dy;
        
        // Wall collision
        if (newBall.x + BALL_RADIUS > GAME_WIDTH || newBall.x - BALL_RADIUS < 0) {
            newBall.dx *= -1;
            playSound(audioService.playWallHit);
        }
        if (newBall.y - BALL_RADIUS < 0) {
            newBall.dy *= -1;
            playSound(audioService.playWallHit);
        }

        // Paddle collision
        if (
            newBall.y + BALL_RADIUS > GAME_HEIGHT - PADDLE_HEIGHT - 10 &&
            newBall.x > paddleX &&
            newBall.x < paddleX + PADDLE_WIDTH
        ) {
            newBall.dy *= -1;
            playSound(audioService.playPaddleHit);
        }

        // Brick collision
        let allBricksBroken = true;
        const newBricks = bricks.map(brick => {
            if (brick.visible) {
                 allBricksBroken = false;
                if (
                    newBall.x > brick.x &&
                    newBall.x < brick.x + brick.width &&
                    newBall.y > brick.y &&
                    newBall.y < brick.y + brick.height
                ) {
                    newBall.dy *= -1;
                    playSound(audioService.playBrickHit);
                    setScore(s => s + 1);
                    addCredits(1);
                    return { ...brick, visible: false };
                }
            }
            return brick;
        });
        setBricks(newBricks);

        if (allBricksBroken) {
            playSound(audioService.playSuccess);
            setGameState('win');
        }

        // Miss
        if (newBall.y + BALL_RADIUS > GAME_HEIGHT) {
            const newLives = lives - 1;
            setLives(newLives);
            if (newLives > 0) {
                playSound(audioService.playMiss);
                resetBall();
            } else {
                playSound(audioService.playGameOver);
                setGameState('gameOver');
            }
        } else {
            setBall(newBall);
        }

        draw();
        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }, [ball, bricks, lives, paddleX, gameState, playSound, resetBall, draw, addCredits]);

    useEffect(() => {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return () => {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        };
    }, [gameLoop]);

    const handleRestart = () => {
        playSound(audioService.playGenerate);
        setGameState('playing');
        setScore(0);
        setLives(3);
        createBricks();
        resetBall();
        setIsNewHighScore(false);
    };

    return (
        <PageWrapper>
            <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
                <header className="w-full flex items-center justify-between mb-4">
                    <button onClick={onClose} className="text-sm underline hover:text-brand-yellow transition-colors pr-4 font-sans">
                        &#x2190; Back
                    </button>
                    <h2 className="text-xl text-brand-yellow font-press-start">Brick Breaker</h2>
                    <div className="text-right font-press-start text-brand-light text-base">
                        <span className="mr-4">HIGH SCORE: {highScore}</span>
                        <span className="mr-4">SCORE: {score}</span>
                        <span>LIVES: {'♥'.repeat(lives)}</span>
                    </div>
                </header>
                <canvas
                    ref={canvasRef}
                    width={GAME_WIDTH}
                    height={GAME_HEIGHT}
                    className="border-4 border-brand-light w-full max-w-full bg-black cursor-none"
                    style={{ aspectRatio: `${GAME_WIDTH}/${GAME_HEIGHT}` }}
                    aria-label="Brick Breaker game canvas"
                />
                <div className="w-full flex justify-center gap-4 mt-4">
                    {gameState !== 'playing' && (
                         <button onClick={handleRestart} className="w-full max-w-xs p-3 bg-brand-cyan text-black border-4 border-brand-light shadow-pixel transition-all hover:bg-brand-yellow active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] font-press-start">
                             Play Again
                         </button>
                    )}
                </div>
            </div>
        </PageWrapper>
    );
};