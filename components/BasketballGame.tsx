import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PageWrapper } from './PageComponents';
import * as audioService from '../services/audioService';

interface BasketballGameProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    addCredits: (amount: number) => void;
    playerImageUrl: string;
    hoopImageUrl: string;
}

const GAME_WIDTH = 640;
const GAME_HEIGHT = 480;
const PLAYER_X = 60;
const PLAYER_Y = 380;
const PLAYER_WIDTH = 80;
const PLAYER_HEIGHT = 80;
const BALL_RADIUS = 12;
const HOOP_Y = 120;
const HOOP_WIDTH = 80;
const HOOP_HEIGHT = 60;
const RIM_HEIGHT = 10;
const SCORE_AREA_WIDTH = 40;
const GAME_TIME = 60;
const GRAVITY = 0.4;
const AIM_ANGLE_SPEED = 1.2; // degrees per frame
const MIN_ANGLE = -80; // up
const MAX_ANGLE = -10; // forward

export const BasketballGame: React.FC<BasketballGameProps> = ({ onClose, playSound, addCredits, playerImageUrl, hoopImageUrl }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameLoopRef = useRef<number | null>(null);

    const [playerImg, setPlayerImg] = useState<HTMLImageElement | null>(null);
    const [hoopImg, setHoopImg] = useState<HTMLImageElement | null>(null);

    const [gameState, setGameState] = useState<'ready' | 'aiming' | 'shooting' | 'gameOver'>('ready');
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(GAME_TIME);
    const [angle, setAngle] = useState(MIN_ANGLE);

    const ball = useRef<{ x: number; y: number; vx: number; vy: number; visible: boolean } | null>(null);
    const hoop = useRef({ x: GAME_WIDTH - HOOP_WIDTH - 40, y: HOOP_Y, vx: 2 });
    const angleDir = useRef(1);

    const resetGame = useCallback((isRestart: boolean) => {
        if (isRestart) playSound(audioService.playGenerate);
        setGameState('ready');
        setScore(0);
        setTimeLeft(GAME_TIME);
        ball.current = null;
        hoop.current = { x: GAME_WIDTH - HOOP_WIDTH - 40, y: HOOP_Y, vx: 2 };
    }, [playSound]);
    
    useEffect(() => {
        const pImg = new Image();
        pImg.crossOrigin = "anonymous";
        pImg.src = playerImageUrl;
        pImg.onload = () => setPlayerImg(pImg);

        const hImg = new Image();
        hImg.crossOrigin = "anonymous";
        hImg.src = hoopImageUrl;
        hImg.onload = () => setHoopImg(hImg);
    }, [playerImageUrl, hoopImageUrl]);
    
    useEffect(() => {
        if (gameState === 'ready' && timeLeft === GAME_TIME) return;

        if (timeLeft <= 0 && gameState !== 'gameOver') {
            playSound(audioService.playGameOver);
            setGameState('gameOver');
        }

        const timer = setInterval(() => {
            if (gameState === 'aiming' || gameState === 'shooting' || gameState === 'ready') {
                setTimeLeft(t => (t > 0 ? t - 1 : 0));
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, gameState, playSound]);

    const shoot = () => {
        if (gameState !== 'aiming') return;
        playSound(audioService.playSwoosh);
        
        const power = 20;
        const rad = angle * (Math.PI / 180);
        ball.current = {
            x: PLAYER_X + PLAYER_WIDTH / 2,
            y: PLAYER_Y,
            vx: Math.cos(rad) * power,
            vy: Math.sin(rad) * power,
            visible: true,
        };
        setGameState('shooting');
    };

    const handleCanvasClick = () => {
        if (gameState === 'ready') setGameState('aiming');
        else if (gameState === 'aiming') shoot();
    };

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !playerImg || !hoopImg) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.imageSmoothingEnabled = false;

        // Background
        ctx.fillStyle = '#87CEEB'; // Sky blue
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.fillStyle = '#F4A460'; // Sandy brown
        ctx.fillRect(0, GAME_HEIGHT - 60, GAME_WIDTH, 60);

        // Player
        ctx.drawImage(playerImg, PLAYER_X, PLAYER_Y, PLAYER_WIDTH, PLAYER_HEIGHT);
        
        // Hoop
        ctx.drawImage(hoopImg, hoop.current.x, hoop.current.y, HOOP_WIDTH, HOOP_HEIGHT);

        // Ball
        if (ball.current?.visible) {
            ctx.fillStyle = '#FF8C00'; // Orange
            ctx.beginPath();
            ctx.arc(ball.current.x, ball.current.y, BALL_RADIUS, 0, Math.PI * 2);
            ctx.fill();
        }

        // Aiming indicator
        if (gameState === 'aiming') {
            ctx.save();
            ctx.translate(PLAYER_X + PLAYER_WIDTH / 2, PLAYER_Y);
            ctx.rotate(angle * (Math.PI / 180));
            ctx.fillStyle = 'white';
            ctx.fillRect(0, -2, 80, 4);
            ctx.restore();
        }
        
        // UI
        ctx.fillStyle = '#ffff00';
        ctx.font = '24px "Press Start 2P"';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${score}`, 10, 35);
        ctx.textAlign = 'right';
        ctx.fillText(`TIME: ${timeLeft}`, GAME_WIDTH - 10, 35);
        
        if (gameState === 'ready' && timeLeft === GAME_TIME) {
            ctx.fillStyle = 'white';
            ctx.font = '32px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText('CLICK TO START', GAME_WIDTH / 2, GAME_HEIGHT / 2);
        }
        
        if (gameState === 'gameOver') {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0,0,GAME_WIDTH, GAME_HEIGHT);
            ctx.fillStyle = '#ff00ff';
            ctx.font = '48px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2);
        }

    }, [playerImg, hoopImg, score, timeLeft, gameState, angle]);

    const gameLoop = useCallback(() => {
        if (gameState === 'aiming') {
            setAngle(a => {
                const newAngle = a + angleDir.current * AIM_ANGLE_SPEED;
                if (newAngle > MAX_ANGLE || newAngle < MIN_ANGLE) {
                    angleDir.current *= -1;
                }
                return a + angleDir.current * AIM_ANGLE_SPEED;
            });
        }
        
        // Hoop movement
        hoop.current.x += hoop.current.vx;
        if (hoop.current.x < GAME_WIDTH / 2 || hoop.current.x + HOOP_WIDTH > GAME_WIDTH) {
            hoop.current.vx *= -1;
        }

        if (gameState === 'shooting' && ball.current) {
            ball.current.vy += GRAVITY;
            ball.current.x += ball.current.vx;
            ball.current.y += ball.current.vy;
            
            // Score check
            const rimY = hoop.current.y + RIM_HEIGHT;
            const scoreXStart = hoop.current.x + (HOOP_WIDTH - SCORE_AREA_WIDTH) / 2;
            const scoreXEnd = scoreXStart + SCORE_AREA_WIDTH;

            if (
                ball.current.y > rimY &&
                ball.current.y < rimY + 10 &&
                ball.current.x > scoreXStart &&
                ball.current.x < scoreXEnd &&
                ball.current.vy > 0
            ) {
                playSound(audioService.playScore);
                setScore(s => s + 50);
                addCredits(10);
                ball.current = null;
                setGameState('ready');
            }

            // Miss check
            if (ball.current && ball.current.y > GAME_HEIGHT) {
                playSound(audioService.playMiss);
                ball.current = null;
                setGameState('ready');
            }
        }

        draw();
        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }, [gameState, draw, playSound, addCredits]);

    useEffect(() => {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return () => {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        };
    }, [gameLoop]);

    return (
        <PageWrapper>
            <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
                <header className="w-full flex items-center justify-between mb-4">
                     <button onClick={onClose} className="text-sm underline hover:text-brand-yellow transition-colors pr-4 font-sans">
                        &#x2190; กลับ
                    </button>
                    <h2 className="text-xl text-brand-yellow font-press-start">ชาร์ค ชู้ตเตอร์</h2>
                </header>
                <canvas
                    ref={canvasRef}
                    width={GAME_WIDTH}
                    height={GAME_HEIGHT}
                    className="border-4 border-brand-light w-full max-w-full bg-black cursor-pointer"
                    style={{ aspectRatio: `${GAME_WIDTH}/${GAME_HEIGHT}`}}
                    aria-label="Shark Shooter game canvas"
                    onClick={handleCanvasClick}
                />
                <div className="w-full flex justify-center gap-4 mt-4">
                    {gameState === 'gameOver' && (
                         <button onClick={() => resetGame(true)} className="w-full max-w-xs p-3 bg-brand-cyan text-black border-4 border-brand-light shadow-pixel transition-all hover:bg-brand-yellow active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] font-press-start">
                             เล่นอีกครั้ง
                         </button>
                    )}
                </div>
            </div>
        </PageWrapper>
    );
};
