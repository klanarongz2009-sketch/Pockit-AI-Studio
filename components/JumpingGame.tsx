import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PageWrapper } from './PageComponents';
import * as audioService from '../services/audioService';

interface JumpingGameProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    addCredits: (amount: number) => void;
}

const GAME_WIDTH = 640;
const GAME_HEIGHT = 480;
const PLAYER_X = 60;
const PLAYER_WIDTH = 20;
const PLAYER_HEIGHT = 20;
const GRAVITY = 0.8;
const JUMP_STRENGTH = -14;
const GROUND_Y = GAME_HEIGHT - 40;
const GAME_SPEED = 5;

interface GameObject {
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'obstacle' | 'credit';
}

export const JumpingGame: React.FC<JumpingGameProps> = ({ onClose, playSound, addCredits }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameLoopRef = useRef<number | null>(null);
    const playerY = useRef(GROUND_Y - PLAYER_HEIGHT);
    const playerVelY = useRef(0);
    const objects = useRef<GameObject[]>([]);
    const frameCount = useRef(0);

    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');

    const resetGame = useCallback(() => {
        playSound(audioService.playGenerate);
        playerY.current = GROUND_Y - PLAYER_HEIGHT;
        playerVelY.current = 0;
        objects.current = [];
        frameCount.current = 0;
        setScore(0);
        setGameState('playing');
    }, [playSound]);

    const handleJump = useCallback(() => {
        if (gameState !== 'playing') {
            if (gameState === 'gameOver') resetGame();
            return;
        }
        if (playerY.current >= GROUND_Y - PLAYER_HEIGHT) {
            playerVelY.current = JUMP_STRENGTH;
            playSound(audioService.playClick);
        }
    }, [gameState, playSound, resetGame]);

    useEffect(() => {
        window.addEventListener('keydown', handleJump);
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.addEventListener('mousedown', handleJump);
            canvas.addEventListener('touchstart', handleJump);
        }
        return () => {
            window.removeEventListener('keydown', handleJump);
            if (canvas) {
                canvas.removeEventListener('mousedown', handleJump);
                canvas.removeEventListener('touchstart', handleJump);
            }
        };
    }, [handleJump]);
    
    const gameLoop = useCallback(() => {
        if (gameState !== 'playing') {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
            return;
        }

        // Update player
        playerVelY.current += GRAVITY;
        playerY.current += playerVelY.current;
        if (playerY.current > GROUND_Y - PLAYER_HEIGHT) {
            playerY.current = GROUND_Y - PLAYER_HEIGHT;
            playerVelY.current = 0;
        }
        
        // Update score
        setScore(s => s + 1);

        // Update and spawn objects
        frameCount.current++;
        if (frameCount.current % (Math.floor(Math.random() * 60) + 70) === 0) {
            const isCredit = Math.random() > 0.7;
            objects.current.push({
                x: GAME_WIDTH,
                y: isCredit ? GROUND_Y - 80 : GROUND_Y - 30,
                width: 30,
                height: 30,
                type: isCredit ? 'credit' : 'obstacle'
            });
        }
        objects.current = objects.current.filter(obj => obj.x + obj.width > 0);
        objects.current.forEach(obj => {
            obj.x -= GAME_SPEED + (score / 1000); // Speed increases over time
        });

        // Collision detection
        for (const obj of objects.current) {
            if (
                PLAYER_X < obj.x + obj.width &&
                PLAYER_X + PLAYER_WIDTH > obj.x &&
                playerY.current < obj.y + obj.height &&
                playerY.current + PLAYER_HEIGHT > obj.y
            ) {
                if (obj.type === 'obstacle') {
                    playSound(audioService.playGameOver);
                    setGameState('gameOver');
                    return;
                }
                if (obj.type === 'credit') {
                    addCredits(300);
                    playSound(audioService.playCreditAdd);
                    objects.current = objects.current.filter(o => o !== obj);
                }
            }
        }

        // Drawing
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;
        
        ctx.fillStyle = '#080c2b';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.fillStyle = '#00ffff';
        ctx.fillRect(PLAYER_X, playerY.current, PLAYER_WIDTH, PLAYER_HEIGHT);

        objects.current.forEach(obj => {
            ctx.fillStyle = obj.type === 'obstacle' ? '#ff00ff' : '#ffff00';
            ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        });

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);

        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }, [gameState, playSound, addCredits, score]);
    
    useEffect(() => {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return () => {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        };
    }, [gameLoop]);

    const drawGameOver = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;
        
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0,0,GAME_WIDTH, GAME_HEIGHT);
        ctx.font = '48px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff00ff';
        ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
        ctx.fillStyle = 'white';
        ctx.font = '24px "Press Start 2P"';
        ctx.fillText(`SCORE: ${Math.floor(score)}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
        ctx.font = '16px "Press Start 2P"';
        ctx.fillText(`Tap to Restart`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60);
    }
    
    useEffect(() => {
        if(gameState === 'gameOver') {
            drawGameOver();
        }
    }, [gameState, score]);


    return (
        <PageWrapper>
             <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
                 <header className="w-full flex items-center justify-between mb-4">
                     <button onClick={onClose} className="text-sm underline hover:text-brand-yellow transition-colors pr-4 font-sans">
                        &#x2190; กลับ
                    </button>
                    <h2 className="text-xl text-brand-yellow font-press-start">Pixel Jumper</h2>
                     <div className="text-right font-press-start text-brand-light text-base">
                        <span>Score: {Math.floor(score)}</span>
                     </div>
                </header>
                 <canvas
                    ref={canvasRef}
                    width={GAME_WIDTH}
                    height={GAME_HEIGHT}
                    className="border-4 border-brand-light w-full max-w-full bg-black cursor-pointer"
                    style={{ aspectRatio: `${GAME_WIDTH}/${GAME_HEIGHT}`}}
                    aria-label="Jumping game canvas"
                 />
                 <p className="font-sans text-sm text-brand-light/70 mt-4 text-center">Tap anywhere or press any key to jump.</p>
             </div>
        </PageWrapper>
    );
};
