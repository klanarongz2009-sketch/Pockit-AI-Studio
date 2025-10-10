

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PageWrapper } from './PageComponents';
import * as audioService from '../services/audioService';

interface PlatformerGameProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
}

const GAME_WIDTH = 640;
const GAME_HEIGHT = 480;
const PLAYER_WIDTH = 20;
const PLAYER_HEIGHT = 30;
const GRAVITY = 0.6;
const JUMP_STRENGTH = -12;
const PLAYER_SPEED = 5;
const INITIAL_LIVES = 3;

interface Platform { x: number; y: number; width: number; }
interface Obstacle { x: number; y: number; }
interface Goal { x: number; y: number; }

const LEVEL_PLATFORMS: Platform[] = [
    { x: 0, y: 460, width: 200 },
    { x: 250, y: 420, width: 100 },
    { x: 400, y: 380, width: 150 },
    { x: 600, y: 440, width: 80 },
    { x: 720, y: 400, width: 120 },
    { x: 880, y: 350, width: 100 },
    { x: 1050, y: 320, width: 150 },
    { x: 1250, y: 400, width: 50 },
    { x: 1350, y: 360, width: 50 },
    { x: 1450, y: 320, width: 50 },
    { x: 1600, y: 460, width: 200 },
];

const LEVEL_OBSTACLES: Obstacle[] = [
    { x: 450, y: 360 },
    { x: 1100, y: 300 },
    { x: 1120, y: 300 },
    { x: 1650, y: 440 },
];

const LEVEL_GOAL: Goal = { x: 1750, y: 420 };
const LEVEL_WIDTH = 1800;

export const PlatformerGame: React.FC<PlatformerGameProps> = ({ onClose, playSound }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameLoopRef = useRef<number | null>(null);
    const keysRef = useRef<{ [key: string]: boolean }>({});
    const touchControlState = useRef({ left: false, right: false });
    const jumpRequested = useRef(false);

    const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [cameraX, setCameraX] = useState(0);
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    const playerPos = useRef({ x: 50, y: 400 });
    const playerVel = useRef({ x: 0, y: 0 });
    const onGround = useRef(false);
    const lastSafePos = useRef({ x: 50, y: 400 });
    
    const resetPlayer = useCallback(() => {
        playerPos.current = { ...lastSafePos.current };
        playerVel.current = { x: 0, y: 0 };
        onGround.current = false;
        
        const targetCameraX = lastSafePos.current.x - GAME_WIDTH / 2 + PLAYER_WIDTH / 2;
        setCameraX(Math.max(0, Math.min(LEVEL_WIDTH - GAME_WIDTH, targetCameraX)));

        const newLives = lives - 1;
        setLives(newLives);
        if (newLives <= 0) {
            playSound(audioService.playGameOver);
            setGameState('lost');
        }
    }, [lives, playSound]);

    const handleInput = useCallback(() => {
        let moveIntent = 0;
        // Horizontal movement
        if (keysRef.current['arrowleft'] || keysRef.current['a'] || touchControlState.current.left) {
            moveIntent = -1;
        } else if (keysRef.current['arrowright'] || keysRef.current['d'] || touchControlState.current.right) {
            moveIntent = 1;
        }
        
        playerVel.current.x = moveIntent * PLAYER_SPEED;

        // Jumping
        if ((keysRef.current['arrowup'] || keysRef.current['w'] || keysRef.current[' '] || jumpRequested.current) && onGround.current) {
            playerVel.current.y = JUMP_STRENGTH;
            onGround.current = false;
            playSound(audioService.playClick);
            jumpRequested.current = false; // consume jump request
        }
    }, [playSound]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.fillStyle = '#1a1a2e'; // Dark blue background
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.save();
        ctx.translate(-cameraX, 0);

        ctx.fillStyle = '#e0e0e0';
        LEVEL_PLATFORMS.forEach(p => {
            ctx.fillRect(p.x, p.y, p.width, GAME_HEIGHT - p.y);
        });

        ctx.fillStyle = '#ff00ff';
        LEVEL_OBSTACLES.forEach(o => {
            ctx.beginPath();
            ctx.moveTo(o.x, o.y + 20);
            ctx.lineTo(o.x + 10, o.y);
            ctx.lineTo(o.x + 20, o.y + 20);
            ctx.closePath();
            ctx.fill();
        });

        ctx.fillStyle = '#00ff00';
        ctx.fillRect(LEVEL_GOAL.x, LEVEL_GOAL.y, 10, 40);
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.moveTo(LEVEL_GOAL.x + 10, LEVEL_GOAL.y);
        ctx.lineTo(LEVEL_GOAL.x + 30, LEVEL_GOAL.y + 10);
        ctx.lineTo(LEVEL_GOAL.x + 10, LEVEL_GOAL.y + 20);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#00ffff';
        ctx.fillRect(playerPos.current.x, playerPos.current.y, PLAYER_WIDTH, PLAYER_HEIGHT);
        
        ctx.restore();

        ctx.fillStyle = '#ffff00';
        ctx.font = '16px "Press Start 2P"';
        ctx.textAlign = 'left';
        ctx.fillText(`LIVES: ${'♥'.repeat(Math.max(0, lives))}`, 10, 25);
    }, [cameraX, lives]);

    const gameLoop = useCallback(() => {
        if (gameState !== 'playing') {
            draw();
            gameLoopRef.current = requestAnimationFrame(gameLoop);
            return;
        }

        handleInput();

        playerVel.current.y += GRAVITY;
        playerPos.current.x += playerVel.current.x;
        playerPos.current.y += playerVel.current.y;
        onGround.current = false;

        LEVEL_PLATFORMS.forEach(p => {
            if (
                playerPos.current.x + PLAYER_WIDTH > p.x &&
                playerPos.current.x < p.x + p.width &&
                playerPos.current.y + PLAYER_HEIGHT >= p.y &&
                playerPos.current.y + PLAYER_HEIGHT <= p.y + playerVel.current.y + 1 
            ) {
                playerPos.current.y = p.y - PLAYER_HEIGHT;
                playerVel.current.y = 0;
                onGround.current = true;
                lastSafePos.current = { x: p.x + 10, y: p.y - PLAYER_HEIGHT };
            }
        });

        LEVEL_OBSTACLES.forEach(o => {
            if (
                playerPos.current.x < o.x + 20 &&
                playerPos.current.x + PLAYER_WIDTH > o.x &&
                playerPos.current.y < o.y + 20 &&
                playerPos.current.y + PLAYER_HEIGHT > o.y
            ) {
                playSound(audioService.playPlayerHit);
                resetPlayer();
            }
        });

        if (
            playerPos.current.x + PLAYER_WIDTH > LEVEL_GOAL.x &&
            playerPos.current.x < LEVEL_GOAL.x + 10 &&
            playerPos.current.y + PLAYER_HEIGHT > LEVEL_GOAL.y
        ) {
            playSound(audioService.playSuccess);
            setGameState('won');
        }

        if (playerPos.current.y > GAME_HEIGHT) {
            playSound(audioService.playPlayerHit);
            resetPlayer();
        }
        
        if (playerPos.current.x < 0) playerPos.current.x = 0;
        if (playerPos.current.x + PLAYER_WIDTH > LEVEL_WIDTH) playerPos.current.x = LEVEL_WIDTH - PLAYER_WIDTH;

        const targetCameraX = playerPos.current.x - GAME_WIDTH / 2 + PLAYER_WIDTH / 2;
        setCameraX(camX => {
            const newCamX = camX + (targetCameraX - camX) * 0.1;
            return Math.max(0, Math.min(LEVEL_WIDTH - GAME_WIDTH, newCamX));
        });

        draw();
        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }, [gameState, draw, handleInput, resetPlayer, playSound]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = true; };
        const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = false; };
        
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        
        setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useEffect(() => {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return () => {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        };
    }, [gameLoop]);

    const handleRestart = () => {
        playSound(audioService.playGenerate);
        setLives(INITIAL_LIVES);
        setGameState('playing');
        playerPos.current = { x: 50, y: 400 };
        lastSafePos.current = { x: 50, y: 400 };
        playerVel.current = { x: 0, y: 0 };
        onGround.current = false;
        setCameraX(0);
    };

    const handleButtonPress = (action: 'LEFT' | 'RIGHT' | 'JUMP') => {
        if (action === 'LEFT') touchControlState.current.left = true;
        if (action === 'RIGHT') touchControlState.current.right = true;
        if (action === 'JUMP') jumpRequested.current = true;
    };

    const handleButtonRelease = (action: 'LEFT' | 'RIGHT') => {
        if (action === 'LEFT') touchControlState.current.left = false;
        if (action === 'RIGHT') touchControlState.current.right = false;
    };

    return (
        <PageWrapper>
             <div className="w-full h-full flex flex-col bg-black">
                 <header className="w-full flex items-center justify-between p-2 flex-shrink-0 z-10">
                     <button onClick={onClose} className="text-sm underline hover:text-brand-yellow transition-colors pr-4 font-sans">
                        &#x2190; Back
                    </button>
                    <h2 className="text-xl text-brand-yellow font-press-start">Platformer</h2>
                </header>
                 <main className="relative flex-grow w-full h-full">
                    <canvas
                        ref={canvasRef}
                        width={GAME_WIDTH}
                        height={GAME_HEIGHT}
                        className="w-full h-full object-contain"
                        style={{ imageRendering: 'pixelated' }}
                        aria-label="Platformer game canvas"
                    />
                    {gameState !== 'playing' && (
                         <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-6 z-20">
                            <h2 className={`font-press-start text-5xl text-center ${gameState === 'won' ? 'text-brand-lime' : 'text-brand-magenta'}`}>
                                {gameState === 'won' ? 'YOU WIN!' : 'GAME OVER'}
                            </h2>
                            <button onClick={handleRestart} className="w-full max-w-xs p-3 bg-brand-cyan text-black border-4 border-brand-light shadow-pixel transition-all hover:bg-brand-yellow active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] font-press-start">
                                {gameState === 'lost' ? 'Try Again' : 'Play Again'}
                            </button>
                        </div>
                    )}
                    {isTouchDevice && (
                        <>
                            <div className="absolute bottom-5 left-5 grid grid-cols-3 grid-rows-3 w-36 h-36 select-none z-10">
                                <div className="col-start-2 row-start-1">
                                    <button
                                        onTouchStart={() => handleButtonPress('JUMP')}
                                        onMouseDown={(e) => { e.preventDefault(); handleButtonPress('JUMP'); }}
                                        onContextMenu={(e) => e.preventDefault()}
                                        className="w-full h-full bg-brand-light/20 flex items-center justify-center text-3xl text-white active:bg-brand-light/40"
                                        aria-label="Jump"
                                    >
                                        ▲
                                    </button>
                                </div>
                                <div className="col-start-1 row-start-2">
                                    <button
                                        onTouchStart={() => handleButtonPress('LEFT')}
                                        onTouchEnd={() => handleButtonRelease('LEFT')}
                                        onMouseDown={(e) => { e.preventDefault(); handleButtonPress('LEFT'); }}
                                        onMouseUp={(e) => { e.preventDefault(); handleButtonRelease('LEFT'); }}
                                        onMouseLeave={(e) => { e.preventDefault(); handleButtonRelease('LEFT'); }}
                                        onContextMenu={(e) => e.preventDefault()}
                                        className="w-full h-full bg-brand-light/20 flex items-center justify-center text-3xl text-white active:bg-brand-light/40"
                                        aria-label="Move Left"
                                    >
                                        ◀
                                    </button>
                                </div>
                                <div className="col-start-3 row-start-2">
                                     <button
                                        onTouchStart={() => handleButtonPress('RIGHT')}
                                        onTouchEnd={() => handleButtonRelease('RIGHT')}
                                        onMouseDown={(e) => { e.preventDefault(); handleButtonPress('RIGHT'); }}
                                        onMouseUp={(e) => { e.preventDefault(); handleButtonRelease('RIGHT'); }}
                                        onMouseLeave={(e) => { e.preventDefault(); handleButtonRelease('RIGHT'); }}
                                        onContextMenu={(e) => e.preventDefault()}
                                        className="w-full h-full bg-brand-light/20 flex items-center justify-center text-3xl text-white active:bg-brand-light/40"
                                        aria-label="Move Right"
                                    >
                                        ▶
                                    </button>
                                </div>
                                 <div className="col-start-2 row-start-3">
                                    <button
                                        onContextMenu={(e) => e.preventDefault()}
                                        className="w-full h-full bg-brand-light/10 opacity-50 flex items-center justify-center text-3xl text-white"
                                        aria-label="Down (no action)"
                                        disabled
                                    >
                                        ▼
                                    </button>
                                </div>
                            </div>

                            <div className="absolute bottom-5 right-5 z-10">
                                <button
                                    onTouchStart={() => handleButtonPress('JUMP')}
                                    onMouseDown={(e) => { e.preventDefault(); handleButtonPress('JUMP'); }}
                                    onContextMenu={(e) => e.preventDefault()}
                                    className="w-24 h-24 bg-brand-light/20 rounded-full flex items-center justify-center text-5xl text-white active:bg-brand-light/40 select-none"
                                    aria-label="Jump"
                                >
                                    ↑
                                </button>
                            </div>
                        </>
                    )}
                </main>
             </div>
        </PageWrapper>
    );
};