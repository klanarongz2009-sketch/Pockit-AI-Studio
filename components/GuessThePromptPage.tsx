
import React, { useState, useEffect, useCallback } from 'react';
import * as audioService from '../services/audioService';
import * as geminiService from '../services/geminiService';
import { PageWrapper, PageHeader } from './PageComponents';
import { LoadingSpinner } from './LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';

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

    const startNewGame = useCallback(async () => {
        if (!isOnline) {
            setError("You must be online to play this game.");
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
            const errorMessage = err instanceof Error ? err.message : 'Could not generate an image.';
            setError(errorMessage);
            playSound(audioService.playError);
        }
    }, [isOnline, playSound]);

    useEffect(() => {
        startNewGame();
    }, [startNewGame]);

    const handleGuessSubmit = useCallback(async () => {
        if (!userGuess.trim() || gameState !== 'playing' || !isOnline) return;

        setGameState('evaluating');
        setError(null);
        playSound(audioService.playGenerate);
        
        try {
            const result = await geminiService.evaluatePromptGuess(secretPrompt, userGuess);
            setEvaluation(result);
            setGameState('result');
            playSound(audioService.playSuccess);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Could not evaluate guess.';
            setError(errorMessage);
            setGameState('playing'); // Allow user to try again
            playSound(audioService.playError);
        } finally {
            setGuessesLeft(prev => prev - 1);
        }
    }, [userGuess, gameState, isOnline, secretPrompt, playSound]);

    const renderContent = () => {
        if (error) {
            return (
                <div role="alert" className="text-center text-brand-magenta space-y-4">
                    <p className="font-press-start">An Error Occurred</p>
                    <p className="text-sm mt-2">{error}</p>
                    <button 
                        onClick={startNewGame} 
                        className="w-full max-w-xs mt-2 p-3 bg-brand-cyan text-black border-4 border-brand-light shadow-pixel font-press-start hover:bg-brand-yellow"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        if (gameState === 'loading') {
            return <LoadingSpinner text="AI is painting a secret image..." />;
        }

        return (
            <>
                <div className="w-full h-64 sm:h-80 bg-black/50 border-4 border-brand-light flex items-center justify-center p-2 shadow-pixel mb-4">
                    {generatedImage ? <img src={generatedImage} alt="AI generated art" className="max-w-full max-h-full object-contain" style={{imageRendering: 'pixelated'}} /> : <LoadingSpinner />}
                </div>

                {gameState === 'result' && evaluation && (
                    <div className="w-full text-center space-y-4 animate-fadeIn">
                        <h3 className="font-press-start text-2xl text-brand-yellow">Result</h3>
                        <p className="text-4xl font-press-start">{evaluation.similarity}% <span className="text-lg">Match</span></p>
                        <p className="text-sm text-brand-light/90 italic">"{evaluation.feedback}"</p>
                        <div className="text-xs bg-black/20 p-2 border border-brand-light/50">
                            <p className="text-brand-cyan">The secret prompt was:</p>
                            <p>"{secretPrompt}"</p>
                        </div>
                        <button onClick={startNewGame} className="w-full p-3 bg-brand-cyan text-black border-4 border-brand-light shadow-pixel font-press-start text-lg hover:bg-brand-yellow">Play Again</button>
                    </div>
                )}
                
                {(gameState === 'playing' || gameState === 'evaluating') && (
                    <div className="w-full space-y-4">
                        <p className="text-center font-press-start text-brand-cyan">What was the prompt? ({guessesLeft} guesses left)</p>
                         <textarea
                            value={userGuess}
                            onChange={(e) => setUserGuess(e.target.value)}
                            placeholder="Type your guess here..."
                            className="w-full h-24 p-2 bg-brand-light text-black rounded-none border-2 border-black focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-y"
                            disabled={gameState !== 'playing'}
                        />
                        <button
                            onClick={handleGuessSubmit}
                            disabled={!userGuess.trim() || gameState !== 'playing'}
                            className="w-full flex items-center justify-center gap-3 p-3 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500"
                        >
                            {gameState === 'evaluating' ? 'Evaluating...' : 'Submit Guess'}
                        </button>
                    </div>
                )}
            </>
        )
    };

    return (
        <PageWrapper>
            <PageHeader title="Guess The Prompt" onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center gap-4 font-sans">
                 {renderContent()}
            </main>
        </PageWrapper>
    );
};
