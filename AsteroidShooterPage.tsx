


import React, { useEffect, useRef } from 'react';
import * as preferenceService from '../services/preferenceService';

interface AsteroidShooterPageProps {
    onClose: () => void;
    addCredits: (amount: number) => Promise<void>;
}

export const AsteroidShooterPage: React.FC<AsteroidShooterPageProps> = ({ onClose, addCredits }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scoreDisplayRef = useRef<HTMLSpanElement>(null);
    const livesDisplayRef = useRef<HTMLSpanElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const overlayTitleRef = useRef<HTMLHeadingElement>(null);
    const overlayMessageRef = useRef<HTMLParagraphElement>(null);
    const startButtonRef = useRef<HTMLButtonElement>(null);

    const btnLeftRef = useRef<HTMLButtonElement>(null);
    const btnRightRef = useRef<HTMLButtonElement>(null);
    const btnThrustRef = useRef<HTMLButtonElement>(null);
    const btnShootRef = useRef<HTMLButtonElement>(null);

    const gameInitialized = useRef(false);

    useEffect(() => {
        if (gameInitialized.current) return;
        gameInitialized.current = true;

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        const scoreDisplay = scoreDisplayRef.current!;
        const livesDisplay = livesDisplayRef.current!;
        const overlay = overlayRef.current!;
        const overlayTitle = overlayTitleRef.current!;
        const overlayMessage = overlayMessageRef.current!;
        const startButton = startButtonRef.current!;
        
        const SHIP_SIZE = 30;
        const LASER_MAX_LIFESPAN = 45;
        const SHIP_THRUST = 0.05;
        const SHIP_FRICTION = 0.99;
        const SHIP_ROTATION_SPEED = 0.05;
        const ASTEROID_SPEED_MULTIPLIER = 1.2;
        const ASTEROID_MAX_SIDES = 15;
        const ASTEROID_MIN_SIDES = 8;
        const ASTEROID_JAG_FACTOR = 0.4;
        const SIZE_LARGE = 100;
        const SIZE_MEDIUM = 40;
        const SIZE_SMALL = 20;

        let ship: Ship;
        let asteroids: Asteroid[] = [];
        let lasers: Laser[] = [];
        let score = 0;
        let lives = 3;
        let level = 0;
        let gameOver = true;
        let controls = { thrust: false, turnLeft: false, turnRight: false, shoot: false, canShoot: true };
        let frameCount = 0;
        let animationFrameId: number;

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        function playSound(freq: number, duration: number, type: OscillatorType, volume = 0.5) {
            if (audioContext.state === 'suspended') { audioContext.resume(); }
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.type = type;
            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
            gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.start();
            setTimeout(() => {
                oscillator.stop();
                oscillator.disconnect();
                gainNode.disconnect();
            }, duration * 1000);
        }

        const playLaser = () => playSound(500, 0.1, 'sawtooth', 0.1);
        const playExplosion = () => playSound(100, 0.5, 'square', 0.2);
        const playThrust = () => { if (controls.thrust) playSound(600, 0.05, 'triangle', 0.05); };

        function getSafeSpawn(min: number, max: number, safeRadius: number) {
            let pos;
            const center = (min + max) / 2;
            do { pos = Math.random() * (max - min) + min; } while (Math.abs(pos - center) < safeRadius);
            return pos;
        }

        function dist(x1: number, y1: number, x2: number, y2: number) {
            return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        }

        class Ship {
            x: number; y: number; radius: number; angle: number; vx: number; vy: number; exploding: boolean; explosionTime: number;
            constructor() {
                this.x = canvas.width / 2; this.y = canvas.height / 2; this.radius = SHIP_SIZE / 2; this.angle = Math.PI / 2; this.vx = 0; this.vy = 0; this.exploding = false; this.explosionTime = 0;
            }
            draw() {
                ctx.strokeStyle = this.exploding ? '#ff0000' : '#00ffaa'; ctx.lineWidth = 2; ctx.shadowBlur = 10; ctx.shadowColor = this.exploding ? '#ff0000' : '#00ffaa';
                if (this.exploding) {
                    const maxRadius = 50; const currentRadius = maxRadius * (this.explosionTime / 60); ctx.beginPath(); ctx.arc(this.x, this.y, currentRadius, 0, 2 * Math.PI); ctx.stroke(); this.explosionTime++; if (this.explosionTime > 60) { this.reset(); } return;
                }
                ctx.beginPath();
                ctx.moveTo(this.x + this.radius * 1.5 * Math.cos(this.angle), this.y - this.radius * 1.5 * Math.sin(this.angle));
                ctx.lineTo(this.x - this.radius * Math.cos(this.angle + Math.PI * 5 / 6), this.y + this.radius * Math.sin(this.angle + Math.PI * 5 / 6));
                ctx.lineTo(this.x - this.radius * Math.cos(this.angle - Math.PI * 5 / 6), this.y + this.radius * Math.sin(this.angle - Math.PI * 5 / 6));
                ctx.closePath(); ctx.stroke();
                if (controls.thrust) {
                    ctx.fillStyle = '#ff9900'; ctx.shadowColor = '#ff9900'; ctx.beginPath();
                    ctx.moveTo(this.x - this.radius * Math.cos(this.angle + Math.PI * 5 / 6), this.y + this.radius * Math.sin(this.angle + Math.PI * 5 / 6));
                    ctx.lineTo(this.x - this.radius * 2 * Math.cos(this.angle + Math.PI), this.y + this.radius * 2 * Math.sin(this.angle + Math.PI));
                    ctx.lineTo(this.x - this.radius * Math.cos(this.angle - Math.PI * 5 / 6), this.y + this.radius * Math.sin(this.angle - Math.PI * 5 / 6));
                    ctx.closePath(); ctx.fill(); playThrust();
                }
                ctx.shadowBlur = 0;
            }
            move() {
                if (controls.turnLeft) this.angle += SHIP_ROTATION_SPEED;
                if (controls.turnRight) this.angle -= SHIP_ROTATION_SPEED;
                if (controls.thrust) { this.vx += SHIP_THRUST * Math.cos(this.angle); this.vy -= SHIP_THRUST * Math.sin(this.angle); }
                this.vx *= SHIP_FRICTION; this.vy *= SHIP_FRICTION; this.x += this.vx; this.y -= this.vy;
                if (this.x < 0) this.x = canvas.width; if (this.x > canvas.width) this.x = 0; if (this.y < 0) this.y = canvas.height; if (this.y > canvas.height) this.y = 0;
            }
            shoot() { if (this.exploding || !controls.canShoot) return; lasers.push(new Laser(this.x, this.y, this.angle)); playLaser(); controls.canShoot = false; }
            explode() {
                if (this.exploding) return; this.exploding = true; this.explosionTime = 0; this.vx = 0; this.vy = 0; lives--; livesDisplay.textContent = String(lives); playExplosion(); if (lives <= 0) { endGame(); }
            }
            reset() { this.x = canvas.width / 2; this.y = canvas.height / 2; this.angle = Math.PI / 2; this.vx = 0; this.vy = 0; this.exploding = false; }
        }

        class Laser {
            x: number; y: number; vx: number; vy: number; lifespan: number; radius: number;
            constructor(x: number, y: number, angle: number) {
                this.x = x + SHIP_SIZE * Math.cos(angle) * 0.75; this.y = y - SHIP_SIZE * Math.sin(angle) * 0.75; this.vx = 8 * Math.cos(angle) + ship.vx; this.vy = 8 * Math.sin(angle) - ship.vy; this.lifespan = 0; this.radius = 2;
            }
            draw() { ctx.fillStyle = '#ff0077'; ctx.shadowBlur = 8; ctx.shadowColor = '#ff0077'; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; }
            move() { this.x += this.vx; this.y -= this.vy; this.lifespan++; }
            isDead() { return this.lifespan > LASER_MAX_LIFESPAN || this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height; }
        }

        class Asteroid {
            x: number; y: number; radius: number; type: string; vx: number; vy: number; angle: number; rotationSpeed: number; sides: number; offsets: number[];
            constructor(x: number, y: number, radius: number, type = 'large') {
                this.x = x; this.y = y; this.radius = radius; this.type = type; this.vx = (Math.random() * ASTEROID_SPEED_MULTIPLIER * 2 - ASTEROID_SPEED_MULTIPLIER); this.vy = (Math.random() * ASTEROID_SPEED_MULTIPLIER * 2 - ASTEROID_SPEED_MULTIPLIER); this.angle = Math.random() * Math.PI * 2; this.rotationSpeed = Math.random() * 0.02 - 0.01; this.sides = Math.floor(Math.random() * (ASTEROID_MAX_SIDES - ASTEROID_MIN_SIDES + 1)) + ASTEROID_MIN_SIDES; this.offsets = []; for (let i = 0; i < this.sides; i++) { this.offsets.push(Math.random() * ASTEROID_JAG_FACTOR * 2 + (1 - ASTEROID_JAG_FACTOR)); }
            }
            draw() {
                ctx.strokeStyle = '#cccccc'; ctx.lineWidth = 2; ctx.shadowBlur = 5; ctx.shadowColor = '#cccccc'; ctx.beginPath();
                for (let i = 0; i < this.sides; i++) {
                    const angle = this.angle + (i * Math.PI * 2 / this.sides); const r = this.radius * this.offsets[i]; const x = this.x + r * Math.cos(angle); const y = this.y + r * Math.sin(angle);
                    if (i === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
                }
                ctx.closePath(); ctx.stroke(); ctx.shadowBlur = 0;
            }
            move() {
                this.x += this.vx; this.y += this.vy; this.angle += this.rotationSpeed;
                if (this.x < -this.radius) this.x = canvas.width + this.radius; if (this.x > canvas.width + this.radius) this.x = -this.radius; if (this.y < -this.radius) this.y = canvas.height + this.radius; if (this.y > canvas.height + this.radius) this.y = -this.radius;
            }
            split() {
                const newAsteroids = [];
                if (this.type === 'large') { for (let i = 0; i < 3; i++) newAsteroids.push(new Asteroid(this.x, this.y, SIZE_MEDIUM, 'medium')); score += 20; }
                else if (this.type === 'medium') { for (let i = 0; i < 3; i++) newAsteroids.push(new Asteroid(this.x, this.y, SIZE_SMALL, 'small')); score += 50; }
                else { score += 100; }
                return newAsteroids;
            }
        }
        
        function createAsteroids() { asteroids = []; level++; const numAsteroids = 2 + level; for (let i = 0; i < numAsteroids; i++) { let x = getSafeSpawn(0, canvas.width, 150); let y = getSafeSpawn(0, canvas.height, 150); asteroids.push(new Asteroid(x, y, SIZE_LARGE, 'large')); } }
        function moveObjects() { ship.move(); lasers.forEach(laser => laser.move()); asteroids.forEach(asteroid => asteroid.move()); }
        function checkCollisions() {
            if (ship.exploding) return;
            for (let i = lasers.length - 1; i >= 0; i--) {
                const laser = lasers[i];
                for (let j = asteroids.length - 1; j >= 0; j--) {
                    const asteroid = asteroids[j];
                    if (dist(laser.x, laser.y, asteroid.x, asteroid.y) < asteroid.radius) {
                        lasers.splice(i, 1); playExplosion(); const newAsteroids = asteroid.split(); asteroids.splice(j, 1); asteroids.push(...newAsteroids); break;
                    }
                }
            }
            for (let i = asteroids.length - 1; i >= 0; i--) { const asteroid = asteroids[i]; if (dist(ship.x, ship.y, asteroid.x, asteroid.y) < ship.radius * 1.5 + asteroid.radius * 0.7) { ship.explode(); return; } }
        }
        function drawObjects() { ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; ctx.fillRect(0, 0, canvas.width, canvas.height); asteroids.forEach(asteroid => asteroid.draw()); lasers.forEach(laser => laser.draw()); ship.draw(); lasers = lasers.filter(laser => !laser.isDead()); }
        function update() {
            if (gameOver) return;
            moveObjects(); checkCollisions();
            if (controls.shoot && controls.canShoot) ship.shoot();
            if (!controls.shoot && !controls.canShoot && frameCount % 10 === 0) controls.canShoot = true;
            drawObjects();
            if (asteroids.length === 0) nextLevel();
            scoreDisplay.textContent = String(score); livesDisplay.textContent = String(lives); frameCount++; animationFrameId = requestAnimationFrame(update);
        }
        function nextLevel() { ship.reset(); createAsteroids(); overlayTitle.textContent = `LEVEL ${level} CLEARED!`; overlayMessage.innerHTML = `Get ready for the next wave of ${2 + level} asteroids!`; startButton.textContent = "CONTINUE"; overlay.classList.remove('hidden'); gameOver = true; }
        function startGame() {
            if (!gameOver && lives > 0) return;
            score = 0; lives = 3; level = 0; gameOver = false; ship = new Ship(); lasers = []; createAsteroids(); overlay.classList.add('hidden'); animationFrameId = requestAnimationFrame(update);
        }
        async function endGame() {
            gameOver = true;
            
            let highScore = await preferenceService.getPreference('asteroidShooterHighScore', 0);
            if (score > highScore) {
                highScore = score;
                await preferenceService.setPreference('asteroidShooterHighScore', score);
                // FIX: `addCredits` is now async.
                await addCredits(score);
                overlayTitle.textContent = "NEW HIGH SCORE!";
                overlayMessage.innerHTML = `Final Score: <span class="text-xl text-yellow-400">${score}</span><br>You earned ${score} credits!`;
            } else {
                const consolationCredits = Math.floor(score / 10);
                // FIX: `addCredits` is now async.
                await addCredits(consolationCredits);
                overlayTitle.textContent = "GAME OVER";
                overlayMessage.innerHTML = `Final Score: <span class="text-xl text-yellow-400">${score}</span><br>You earned ${consolationCredits} credits. Better luck next time, pilot!`;
            }

            startButton.textContent = "RETRY";
            overlay.classList.remove('hidden');
        }

        const keydownHandler = (e: KeyboardEvent) => { if (e.key === 'ArrowUp' || e.key === 'w') controls.thrust = true; if (e.key === 'ArrowLeft' || e.key === 'a') controls.turnLeft = true; if (e.key === 'ArrowRight' || e.key === 'd') controls.turnRight = true; if (e.key === ' ' && !gameOver) controls.shoot = true; };
        const keyupHandler = (e: KeyboardEvent) => { if (e.key === 'ArrowUp' || e.key === 'w') controls.thrust = false; if (e.key === 'ArrowLeft' || e.key === 'a') controls.turnLeft = false; if (e.key === 'ArrowRight' || e.key === 'd') controls.turnRight = false; if (e.key === ' ') controls.shoot = false; };
        document.addEventListener('keydown', keydownHandler);
        document.addEventListener('keyup', keyupHandler);

        const btnThrust = btnThrustRef.current!; const btnLeft = btnLeftRef.current!; const btnRight = btnRightRef.current!; const btnShoot = btnShootRef.current!;
        const buttonListeners: { btn: HTMLButtonElement, start: (e: Event) => void, end: (e: Event) => void }[] = [];
        
        function handlePress(btn: HTMLButtonElement, action: keyof typeof controls, isContinuous: boolean) {
            const start = (e: Event) => { e.preventDefault(); btn.classList.add('active'); if (isContinuous) (controls as any)[action] = true; else { (controls as any)[action] = true; if (action === 'shoot' && !controls.canShoot) controls.shoot = false; } };
            const end = (e: Event) => { e.preventDefault(); btn.classList.remove('active'); if (isContinuous) (controls as any)[action] = false; else { (controls as any)[action] = false; if (action === 'shoot') controls.canShoot = true; } };
            btn.addEventListener('mousedown', start); btn.addEventListener('touchstart', start, { passive: false }); btn.addEventListener('mouseup', end); btn.addEventListener('touchend', end); btn.addEventListener('touchcancel', end);
            buttonListeners.push({ btn, start, end });
        }
        if (btnThrust && btnLeft && btnRight && btnShoot) {
            handlePress(btnThrust, 'thrust', true); handlePress(btnLeft, 'turnLeft', true); handlePress(btnRight, 'turnRight', true); handlePress(btnShoot, 'shoot', false);
        }

        startButton.addEventListener('click', startGame);

        function resizeCanvas() {
            const container = canvas.parentElement!;
            const maxWidth = window.innerWidth * 0.95; const maxHeight = window.innerHeight * 0.75; const aspectRatio = 4 / 3; let width, height;
            if (maxWidth / aspectRatio > maxHeight) { height = maxHeight; width = height * aspectRatio; } else { width = maxWidth; height = width / aspectRatio; }
            canvas.width = 800;
            canvas.height = 600;
            container.style.width = `${width}px`; container.style.height = `${height}px`; canvas.style.width = '100%'; canvas.style.height = '100%';
            if (ship) drawObjects(); else { ship = new Ship(); drawObjects(); }
        }

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        return () => {
            cancelAnimationFrame(animationFrameId);
            document.removeEventListener('keydown', keydownHandler);
            document.removeEventListener('keyup', keyupHandler);
            window.removeEventListener('resize', resizeCanvas);
            buttonListeners.forEach(({ btn, start, end }) => {
                btn.removeEventListener('mousedown', start);
                btn.removeEventListener('touchstart', start);
                btn.removeEventListener('mouseup', end);
                btn.removeEventListener('touchend', end);
                btn.removeEventListener('touchcancel', end);
            });
            startButton?.removeEventListener('click', startGame);
            gameOver = true;
        };
    }, [addCredits]);

    return (
        <div className="fixed inset-0 bg-[#0d1117] z-50 flex flex-col items-center justify-center font-['Orbitron',_sans-serif]">
            <style>{`
                .asteroid-game-container { display: flex; flex-direction: column; align-items: center; border: 4px solid #00f0ff; box-shadow: 0 0 20px #00f0ff, 0 0 40px #00a0ff; border-radius: 12px; overflow: hidden; background: #000; position: relative; }
                .asteroid-game-ui { display: flex; justify-content: space-between; width: 100%; padding: 10px 15px; background-color: rgba(0, 0, 0, 0.5); font-size: 1.1rem; border-bottom: 2px solid #00f0ff; }
                .asteroid-game-stat { color: #00ffaa; text-shadow: 0 0 5px #00ffaa; }
                .asteroid-game-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.9); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; z-index: 10; border-radius: 8px; }
                .asteroid-game-overlay.hidden { display: none; }
                .asteroid-game-overlay h1 { font-size: 2rem; color: #ff0077; text-shadow: 0 0 10px #ff0077; }
                .asteroid-game-overlay p { font-size: 1rem; color: #fff; margin-bottom: 20px; }
                #startButton { background-color: #00ffaa; color: #000; padding: 12px 30px; border-radius: 8px; font-size: 1.5rem; font-weight: bold; cursor: pointer; box-shadow: 0 0 15px #00ffaa; transition: all 0.2s; }
                #startButton:hover { background-color: #fff; box-shadow: 0 0 20px #fff, 0 0 30px #00ffaa; }
                #asteroid-controls { display: flex; justify-content: center; gap: 10px; width: 95%; max-width: 800px; margin-top: 15px; padding: 10px; }
                .ctrl-btn { background-color: #005691; color: #fff; padding: 15px 20px; border: 3px solid #00f0ff; border-radius: 50%; font-size: 1.2rem; cursor: pointer; user-select: none; transition: all 0.1s; box-shadow: 0 0 10px #00f0ff; touch-action: manipulation; font-family: 'Orbitron', sans-serif; min-width: 60px; min-height: 60px; display: flex; align-items: center; justify-content: center; text-shadow: 0 0 5px #fff; }
                .ctrl-btn:active, .ctrl-btn.active { background-color: #00f0ff; color: #000; box-shadow: 0 0 20px #fff, 0 0 40px #00f0ff; transform: scale(0.95); }
            `}</style>
             <button onClick={onClose} className="absolute top-2 right-2 z-20 text-white bg-black/50 p-2 rounded-full font-sans hover:bg-red-500">Close</button>
            <div className="asteroid-game-container">
                 <div ref={overlayRef} className="asteroid-game-overlay">
                    <h1 ref={overlayTitleRef}>ASTEROID SHOOTER</h1>
                    <p ref={overlayMessageRef}>A classic arcade experience.<br />Shoot the asteroids before they hit you!</p>
                    <button ref={startButtonRef} id="startButton">START GAME</button>
                </div>
                <div className="asteroid-game-ui">
                    <span className="asteroid-game-stat">SCORE: <span ref={scoreDisplayRef}>0</span></span>
                    <span className="asteroid-game-stat">LIVES: <span ref={livesDisplayRef}>3</span></span>
                </div>
                <canvas ref={canvasRef} style={{ cursor: 'crosshair', background: 'rgba(0,0,0,0.8)' }}></canvas>
            </div>
            <div id="asteroid-controls" className="md:hidden">
                <div className="flex-1 flex justify-start gap-2">
                    <button ref={btnLeftRef} className="ctrl-btn">&lt;</button>
                    <button ref={btnRightRef} className="ctrl-btn">&gt;</button>
                </div>
                <div className="flex-1 flex justify-center gap-2">
                    <button ref={btnThrustRef} className="ctrl-btn">▲</button>
                </div>
                <div className="flex-1 flex justify-end gap-2">
                    <button ref={btnShootRef} className="ctrl-btn">🔥</button>
                </div>
            </div>
        </div>
    );
};