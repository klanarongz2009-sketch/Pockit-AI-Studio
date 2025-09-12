



import React, { useState, useEffect, useCallback } from 'react';
import * as audioService from '../services/audioService';
import * as geminiService from '../services/geminiService';
import { PageWrapper, PageHeader } from './PageComponents';
import { LoadingSpinner } from './LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { useCredits } from '../contexts/CreditContext';

interface GuessThePromptPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

const prompts = [
    "a red car driving on the moon",
    "a robot cat playing a grand piano in a forest",
    "a giant pixel art castle floating in the clouds",
    "a knight fighting a dragon made of pizza",
    "a sad astronaut looking at Earth from a spaceship window",
    "three raccoons in a trench coat, pretending to be a human",
    "a magical library where the books fly",
    "a cyberpunk city street at night in the rain",
    "a cute dog wearing a wizard hat",
    "a serene cherry blossom tree by a river"
];

const START_COST = 5;
const GUESS_COST = 1;
const MAX_GUESSES = 3;

type GameState = 'loading' | 'playing' | 'evaluating' | 'result';

export const GuessThePromptPage: React.FC<GuessThePromptPageProps> = ({ onClose, playSound, isOnline }) => {
    const [gameState, setGameState] = useState<GameState>('loading');
    const [secretPrompt, setSecretPrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [userGuess, setUserGuess] = useState('');
    const [guessesLeft, setGuessesLeft] = useState(MAX_GUESSES);
    const [evaluation, setEvaluation] = useState<geminiService.PromptEvaluation | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { credits, spendCredits, addCredits } = useCredits();

    const startNewGame = useCallback(async () => {
        if (!isOnline) {
            setError("คุณต้องออนไลน์เพื่อเล่นเกมนี้");
            return;
        }

        if (!spendCredits(START_COST)) {
            setError(`เครดิตไม่เพียงพอ! ต้องการ ${START_COST} เครดิตเพื่อเริ่มเกม`);
            playSound(audioService.playError);
            return;
        }

        setGameState('loading');
        setError(null);
        setEvaluation(null);
        setUserGuess('');
        setGeneratedImage(null);
        setGuessesLeft(MAX_GUESSES);
        
        try {
            const prompt = prompts[Math.floor(Math.random() * prompts.length)];
            setSecretPrompt(prompt);
            const imageUrl = await geminiService.generatePixelArt(prompt);
            setGeneratedImage(imageUrl);
            setGameState('playing');
            playSound(audioService.playSuccess);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถสร้างภาพได้';
            setError(errorMessage);
            playSound(audioService.playError);
            addCredits(START_COST); // Refund
        }
    }, [isOnline, playSound, spendCredits, addCredits]);

    useEffect(() => {
        startNewGame();
    }, [startNewGame]);

    const handleGuessSubmit = useCallback(async () => {
        if (!userGuess.trim() || gameState !== 'playing' || !isOnline) return;

        if (!spendCredits(GUESS_COST)) {
            setError(`เครดิตไม่เพียงพอ! ต้องการ ${GUESS_COST} เครดิตในการเดา`);
            playSound(audioService.playError);
            return;
        }
        
        setGameState('evaluating');
        setError(null);
        playSound(audioService.playGenerate);
        
        try {
            const result = await geminiService.evaluatePromptGuess(secretPrompt, userGuess);
            setEvaluation(result);
            const creditsWon = Math.floor(result.similarity * 2);
            if (creditsWon > 0) {
                addCredits(creditsWon);
            }
            setGameState('result');
            playSound(audioService.playSuccess);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถประเมินคำทายได้';
            setError(errorMessage);
            setGameState('playing'); // Allow user to try again
            addCredits(GUESS_COST); // Refund
            playSound(audioService.playError);
        } finally {
            setGuessesLeft(prev => prev - 1);
        }
    }, [userGuess, gameState, isOnline, secretPrompt, playSound, spendCredits, addCredits]);

    const renderContent = () => {
        // FIX: Prioritize showing errors, especially those that occur during loading.
        if (error) {
            return (
                <div role="alert" className="text-center text-brand-magenta">
                    <p className="font-press-start">เกิดข้อผิดพลาด</p>
                    <p className="text-sm mt-2">{error}</p>
                </div>
            );
        }

        if (gameState === 'loading') {
            return <LoadingSpinner text="AI กำลังวาดภาพลับ..." />;
        }

        return (
            <>
                <div className="w-full h-64 sm:h-80 bg-black/50 border-4 border-brand-light flex items-center justify-center p-2 shadow-pixel mb-4">
                    {generatedImage ? <img src={generatedImage} alt="ภาพที่สร้างโดย AI" className="max-w-full max-h-full object-contain" style={{imageRendering: 'pixelated'}} /> : <LoadingSpinner />}
                </div>

                {gameState === 'result' && evaluation && (
                    <div className="w-full text-center space-y-4 animate-fadeIn">
                        <h3 className="font-press-start text-2xl text-brand-yellow">ผลลัพธ์</h3>
                        <p className="text-4xl font-press-start">{evaluation.similarity}% <span className="text-lg">ตรงกัน</span></p>
                        <p className="text-sm text-brand-light/90 italic">"{evaluation.feedback}"</p>
                        <div className="text-xs bg-black/20 p-2 border border-brand-light/50">
                            <p className="text-brand-cyan">คำสั่งลับคือ:</p>
                            <p>"{secretPrompt}"</p>
                        </div>
                         <p className="font-press-start text-brand-lime">คุณได้รับ {Math.floor(evaluation.similarity * 2)} เครดิต!</p>
                        <button onClick={startNewGame} className="w-full p-3 bg-brand-cyan text-black border-4 border-brand-light shadow-pixel font-press-start text-lg hover:bg-brand-yellow">เล่นอีกครั้ง</button>
                    </div>
                )}
                
                {(gameState === 'playing' || gameState === 'evaluating') && (
                    <div className="w-full space-y-4">
                        <p className="text-center font-press-start text-brand-cyan">คุณคิดว่าคำสั่งคืออะไร? ({guessesLeft} ครั้ง)</p>
                         <textarea
                            value={userGuess}
                            onChange={(e) => setUserGuess(e.target.value)}
                            placeholder="พิมพ์คำทายของคุณที่นี่..."
                            className="w-full h-24 p-2 bg-brand-light text-black rounded-none border-2 border-black focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-y"
                            disabled={gameState !== 'playing'}
                        />
                        <button
                            onClick={handleGuessSubmit}
                            disabled={!userGuess.trim() || gameState !== 'playing'}
                            className="w-full flex items-center justify-center gap-3 p-3 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500"
                        >
                            {gameState === 'evaluating' ? 'กำลังประเมิน...' : 'ส่งคำทาย'}
                        </button>
                    </div>
                )}
            </>
        )
    };

    return (
        <PageWrapper>
            <PageHeader title="ทายคำสั่ง AI" onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-4 font-sans">
                 {renderContent()}
            </main>
        </PageWrapper>
    );
};