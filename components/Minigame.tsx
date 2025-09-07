

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as audioService from '../services/audioService';
import { ShareIcon } from './icons/ShareIcon';

type Difficulty = 'easy' | 'normal' | 'hard';

interface MinigameProps {
    playerImageUrl: string;
    obstacleImageUrl: string;
    onClose: () => void;
    playSound: (player: () => void) => void;
}

const GAME_WIDTH = 640;
const GAME_HEIGHT = 480;
const PLAYER_WIDTH = 48;
const PLAYER_HEIGHT = 48;
const OBSTACLE_WIDTH = 32;
const OBSTACLE_HEIGHT = 32;
const INITIAL_LIVES = 3;

// Updated difficulty settings for more noticeable differences and UI color
const difficultySettings = {
    easy: { playerSpeed: 9, initialObstacleSpeed: 2, spawnRateModifier: 0.035, color: '#00ff00' },
    normal: { playerSpeed: 7, initialObstacleSpeed: 3, spawnRateModifier: 0.05, color: '#ffff00' },
    hard: { playerSpeed: 5, initialObstacleSpeed: 4, spawnRateModifier: 0.07, color: '#ff00ff' },
};

export const Minigame: React.FC<MinigameProps> = ({ playerImageUrl, obstacleImageUrl, onClose, playSound }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameLoopRef = useRef<number | null>(null);

    const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameOver'>('idle');
    const [difficulty, setDifficulty] = useState<Difficulty>('normal');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [isNewHighScore, setIsNewHighScore] = useState(false);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [gameStatus, setGameStatus] = useState('ยินดีต้อนรับสู่มินิเกม');
    
    const [playerImg, setPlayerImg] = useState<HTMLImageElement | null>(null);
    const [obstacleImg, setObstacleImg] = useState<HTMLImageElement | null>(null);

    const playerRef = useRef({ x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2, y: GAME_HEIGHT - PLAYER_HEIGHT - 10 });
    const obstaclesRef = useRef<{ x: number, y: number, speed: number }[]>([]);
    const keysRef = useRef<{ [key: string]: boolean }>({});
    const touchStartRef = useRef<{ x: number, y: number } | null>(null);
    const starfieldRef = useRef<{ x: number, y: number, size: number }[]>([]);

    useEffect(() => {
        const savedHighScore = localStorage.getItem('minigame_pixelDodge_highscore');
        if (savedHighScore) {
            setHighScore(parseInt(savedHighScore, 10) || 0);
        }
    }, []);

    useEffect(() => {
        const pImg = new Image();
        pImg.crossOrigin = "anonymous";
        pImg.src = playerImageUrl;
        pImg.onload = () => setPlayerImg(pImg);

        const oImg = new Image();
        oImg.crossOrigin = "anonymous";
        oImg.src = obstacleImageUrl;
        oImg.onload = () => setObstacleImg(oImg);
    }, [playerImageUrl, obstacleImageUrl]);

    const createStars = () => {
        starfieldRef.current = Array.from({ length: 100 }, () => ({
            x: Math.random() * GAME_WIDTH,
            y: Math.random() * GAME_HEIGHT,
            size: Math.random() * 2 + 1,
        }));
    };

    const startGame = useCallback((selectedDifficulty: Difficulty) => {
        playSound(audioService.playGenerate);
        setDifficulty(selectedDifficulty);
        setScore(0);
        setLives(INITIAL_LIVES);
        playerRef.current = { x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2, y: GAME_HEIGHT - PLAYER_HEIGHT - 10 };
        obstaclesRef.current = [];
        setGameState('playing');
        setGameStatus('เริ่มเกม!');
        setIsNewHighScore(false);
    }, [playSound]);
    
    useEffect(() => {
        if (gameState === 'gameOver') {
            if (score > highScore) {
                setHighScore(score);
                localStorage.setItem('minigame_pixelDodge_highscore', String(score));
                setIsNewHighScore(true);
                playSound(audioService.playSuccess);
                setGameStatus(`คะแนนสูงสุดใหม่! ${score}`);
            } else {
                setIsNewHighScore(false);
                setGameStatus(`เกมจบแล้ว! คะแนนสุดท้ายคือ ${score}.`);
            }
        }
    }, [gameState, score, highScore, playSound]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { keysRef.current[e.key] = true; };
        const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.key] = false; };
        
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
            const SWIPE_THRESHOLD = 50; // Minimum pixels for a swipe
            const DASH_DISTANCE = 120; // How far the player moves on swipe

            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
                if (deltaX > 0) { // Swipe Right
                    playerRef.current.x = Math.min(GAME_WIDTH - PLAYER_WIDTH, playerRef.current.x + DASH_DISTANCE);
                } else { // Swipe Left
                    playerRef.current.x = Math.max(0, playerRef.current.x - DASH_DISTANCE);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        const canvas = canvasRef.current;
        if(canvas){
            canvas.addEventListener('touchstart', handleTouchStart);
            canvas.addEventListener('touchend', handleTouchEnd);
        }
        
        createStars();

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if(canvas){
                canvas.removeEventListener('touchstart', handleTouchStart);
                canvas.removeEventListener('touchend', handleTouchEnd);
            }
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        };
    }, []);


    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.imageSmoothingEnabled = false;

        // Background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // Stars
        ctx.fillStyle = '#f0f0f0';
        starfieldRef.current.forEach(star => {
            star.y += star.size * 0.2;
            if (star.y > GAME_HEIGHT) {
                star.y = 0;
                star.x = Math.random() * GAME_WIDTH;
            }
            ctx.fillRect(star.x, star.y, star.size, star.size);
        });

        if (gameState === 'idle' || gameState === 'gameOver') {
            ctx.fillStyle = 'white';
            ctx.font = '32px "Press Start 2P"';
            ctx.textAlign = 'center';

            if (gameState === 'gameOver') {
                ctx.fillStyle = '#ff00ff';
                ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120);
                if (isNewHighScore) {
                    ctx.fillStyle = '#00ff00';
                    ctx.font = '24px "Press Start 2P"';
                    ctx.fillText('คะแนนสูงสุดใหม่!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70);
                }
                ctx.fillStyle = 'white';
                ctx.font = '24px "Press Start 2P"';
                ctx.fillText(`SCORE: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30);
            } else {
                 ctx.fillText('PIXEL DODGE', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80);
            }

            ctx.font = '16px "Press Start 2P"';
            ctx.fillText('เลือกระดับความยาก', GAME_WIDTH / 2, GAME_HEIGHT / 2);
            // Difficulty buttons are rendered outside canvas
        } else if (gameState === 'playing' && playerImg && obstacleImg) {
             // Draw obstacles
            obstaclesRef.current.forEach(obs => {
                ctx.drawImage(obstacleImg, obs.x, obs.y, OBSTACLE_WIDTH, OBSTACLE_HEIGHT);
            });

            // Draw player
            ctx.drawImage(playerImg, playerRef.current.x, playerRef.current.y, PLAYER_WIDTH, PLAYER_HEIGHT);
        }
        
        // Draw UI
        // Use color based on difficulty during play, or yellow otherwise
        const uiColor = gameState === 'playing' ? difficultySettings[difficulty].color : '#ffff00';
        ctx.fillStyle = uiColor;
        ctx.font = '16px "Press Start 2P"';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${score}`, 10, 25);
        ctx.textAlign = 'center';
        ctx.fillText(`HI: ${highScore}`, GAME_WIDTH / 2, 25);
        ctx.textAlign = 'right';
        ctx.fillText(`LIVES: ${'♥'.repeat(lives)}`, GAME_WIDTH - 10, 25);
    }, [gameState, playerImg, obstacleImg, score, lives, highScore, isNewHighScore, difficulty]);
    
    const gameLoop = useCallback(() => {
        if (!canvasRef.current) return;
        
        if (gameState === 'playing' && playerImg && obstacleImg) {
            const player = playerRef.current;
            const settings = difficultySettings[difficulty];

            // Player Movement
            if (keysRef.current['ArrowLeft'] && player.x > 0) {
                player.x -= settings.playerSpeed;
            }
            if (keysRef.current['ArrowRight'] && player.x < GAME_WIDTH - PLAYER_WIDTH) {
                player.x += settings.playerSpeed;
            }


            // Update obstacles
            let scoreIncrement = 0;
            obstaclesRef.current = obstaclesRef.current.map(obs => ({ ...obs, y: obs.y + obs.speed })).filter(obs => {
                if (obs.y > GAME_HEIGHT) {
                    scoreIncrement++;
                    return false;
                }
                return true;
            });
            if(scoreIncrement > 0) {
                playSound(audioService.playScore);
                setScore(s => s + scoreIncrement);
            }

            // Spawn new obstacles
            const spawnRate = Math.max(0.01, settings.spawnRateModifier - score / 500); // Increases spawn rate with score
            if (Math.random() < spawnRate) {
                obstaclesRef.current.push({
                    x: Math.random() * (GAME_WIDTH - OBSTACLE_WIDTH),
                    y: -OBSTACLE_HEIGHT,
                    speed: Math.random() * 2 + settings.initialObstacleSpeed + score / 200, // Increases speed with score
                });
            }

            // Collision detection
            for (const obs of obstaclesRef.current) {
                if (
                    player.x < obs.x + OBSTACLE_WIDTH &&
                    player.x + PLAYER_WIDTH > obs.x &&
                    player.y < obs.y + OBSTACLE_HEIGHT &&
                    player.y + PLAYER_HEIGHT > obs.y
                ) {
                    // Collision
                    playSound(audioService.playPlayerHit);
                    obstaclesRef.current = obstaclesRef.current.filter(o => o !== obs);
                    setLives(l => {
                        const newLives = l - 1;
                        if (newLives > 0) {
                        setGameStatus(`เสียชีวิต! เหลือ ${newLives} ชีวิต`);
                        } else {
                            playSound(audioService.playGameOver);
                            setGameState('gameOver');
                            // The useEffect for gameState will handle the rest.
                        }
                        return newLives;
                    });
                    break; // only handle one collision per frame
                }
            }
        }
        
        draw();
        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }, [gameState, playerImg, obstacleImg, score, playSound, difficulty, draw]);

    useEffect(() => {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return () => {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        }
    }, [gameLoop]);

    const handleShareScore = useCallback(async () => {
        playSound(audioService.playClick);
        const text = `ฉันได้ ${score} คะแนนในเกม Pixel Dodge! มาแข่งกันมั้ย?`;
        const shareData = {
            title: 'Pixel Dodge High Score!',
            text: text,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                alert('คัดลอกคะแนนไปยังคลิปบอร์ดแล้ว!');
            } else {
                alert('เบราว์เซอร์ของคุณไม่รองรับการแชร์');
            }
        } catch (err) {
             if (err instanceof Error && err.name !== 'AbortError') {
                console.error('Error sharing score:', err);
                alert('ไม่สามารถแชร์คะแนนได้');
             }
        }
    }, [score, playSound]);

    const renderMenu = () => (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
            <div className="flex flex-col gap-4 text-center">
                 <button onClick={() => startGame('easy')} className="w-64 p-3 bg-brand-lime text-black border-4 border-brand-light shadow-pixel transition-all hover:bg-brand-yellow active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px]">
                    <span className="text-lg">ง่าย</span>
                    <span className="block text-xs font-sans mt-1">ผู้เล่นเร็ว, ศัตรูช้า</span>
                </button>
                <button onClick={() => startGame('normal')} className="w-64 p-3 bg-brand-cyan text-black border-4 border-brand-light shadow-pixel transition-all hover:bg-brand-yellow active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px]">
                    <span className="text-lg">ปกติ</span>
                    <span className="block text-xs font-sans mt-1">สมดุลและท้าทาย</span>
                </button>
                <button onClick={() => startGame('hard')} className="w-64 p-3 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px]">
                    <span className="text-lg">ยาก</span>
                    <span className="block text-xs font-sans mt-1">ผู้เล่นช้า, ศัตรูเร็ว</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col items-center justify-center bg-black/50 p-2 font-press-start w-full">
            <div className="sr-only" role="status" aria-live="assertive" aria-atomic="true">
                {gameStatus}
            </div>
            <div className="relative w-full">
                <canvas
                    ref={canvasRef}
                    width={GAME_WIDTH}
                    height={GAME_HEIGHT}
                    className="border-4 border-brand-light w-full max-w-full"
                    style={{ aspectRatio: `${GAME_WIDTH}/${GAME_HEIGHT}`}}
                    aria-label="Minigame canvas"
                />
                {(gameState === 'idle' || gameState === 'gameOver') && renderMenu()}
            </div>
            <div className="w-full flex justify-center gap-4 mt-4">
                 {gameState === 'gameOver' && (
                    <button
                        onClick={handleShareScore}
                        className="w-full max-w-xs p-3 bg-brand-cyan text-black border-4 border-brand-light shadow-pixel transition-all hover:bg-brand-yellow active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] font-press-start"
                    >
                        <div className="flex items-center justify-center gap-2">
                            <ShareIcon className="w-5 h-5" />
                            <span>แชร์คะแนน</span>
                        </div>
                    </button>
                )}
                <button
                    onClick={onClose}
                    className="w-full max-w-xs p-3 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel transition-all hover:bg-red-500 active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] font-press-start"
                >
                    ออกจากเกม
                </button>
            </div>
        </div>
    );
};