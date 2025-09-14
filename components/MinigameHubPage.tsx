import React, { useState, useMemo, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import * as audioService from '../services/audioService';
import { TicTacToePage } from './TicTacToePage';
import { TicTacToeIcon } from './icons/TicTacToeIcon';
import { SnakeIcon } from './icons/SnakeIcon';
import { SnakeGame } from './SnakeGame';
import { PlatformerIcon } from './icons/PlatformerIcon';
import { PlatformerGame } from './PlatformerGame';
import { useCredits } from '../contexts/CreditContext';
import { BrickBreakerIcon } from './icons/BrickBreakerIcon';
import { BrickBreakerGame } from './BrickBreakerGame';
import { CalculatorIcon } from './icons/CalculatorIcon';
import { CalculatorPage } from './CalculatorPage';
import { OracleIcon } from './icons/OracleIcon';
import { AiOraclePage } from './AiOraclePage';
import { WordMatchIcon } from './icons/WordMatchIcon';
import { WordMatchPage } from './WordMatchPage';
import { BugIcon } from './icons/BugIcon';
import { AiBugSquasherPage } from './AiBugSquasherPage';
import { SearchMusicIcon } from './icons/SearchMusicIcon';
import { SongSearchPage } from './SongSearchPage';
import { MagicButtonIcon } from './icons/MagicButtonIcon';
import { MagicButtonPage } from './MagicButtonPage';
import { VideoEditorPage } from './VideoEditorPage';
import { AnalyzeIcon } from './icons/AnalyzeIcon';
import { VideoEditorIcon } from './icons/VideoEditorIcon';
import { SearchIcon } from './icons/SearchIcon';
import { GuessThePromptIcon } from './icons/GuessThePromptIcon';
import { GuessThePromptPage } from './GuessThePromptPage';
import { PetIcon } from './icons/PetIcon';
import { MusicInspectIcon } from './icons/MusicInspectIcon';
import { MusicMemoryGamePage } from './MusicMemoryGamePage';
import { FileChatIcon } from './icons/FileChatIcon';
import { FileChatPage } from './FileChatPage';
import { AnalyzeMediaPage } from './AnalyzeMediaPage';
import { CodeIcon } from './icons/CodeIcon';
import { RecordIcon } from './icons/RecordIcon';
import { ImageToCodePage } from './ImageToCodePage';
import { MediaRecorderPage } from './MediaRecorderPage';
import { TextToSpeechPage } from './TextToSpeechPage';
import { TextToSpeechIcon } from './icons/TextToSpeechIcon';

interface MinigameHubPageProps {
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

type ActiveGame =
    | 'hub' | 'ticTacToe' | 'snake' | 'platformer'
    | 'brickBreaker' | 'calculator' | 'aiOracle' | 'wordMatch' | 'aiBugSquasher'
    | 'songSearch' | 'magicButton' | 'videoEditor'
    | 'guessThePrompt' | 'musicMemory' | 'fileChat' | 'analyzeMedia'
    | 'imageToCode' | 'mediaRecorder' | 'textToSpeech';

const GameButton: React.FC<{ icon: React.ReactNode; title: string; description: string; onClick?: () => void; disabled?: boolean; comingSoon?: boolean; beta?: boolean; highScore?: number; }> = ({ icon, title, description, onClick, disabled, comingSoon, beta, highScore }) => (
    <div className="relative group h-full">
        <button
            onClick={onClick}
            disabled={disabled || comingSoon}
            className="w-full h-full flex items-start text-left gap-4 p-4 bg-black/40 border-4 border-brand-light shadow-pixel transition-all hover:bg-brand-cyan/20 hover:border-brand-yellow hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_#f0f0f0] active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Open ${title}`}
        >
            <div className="flex-shrink-0 w-16 h-16 text-brand-cyan">{icon}</div>
            <div className="font-sans">
                <h3 className="font-press-start text-base md:text-lg text-brand-yellow">{title}</h3>
                <p className="text-xs text-brand-light/80 mt-1">{description}</p>
                {highScore != null && highScore > 0 && (
                    <p className="font-press-start text-xs text-brand-cyan mt-2">
                        HI-SCORE: {highScore.toLocaleString()}
                    </p>
                )}
            </div>
        </button>
        {comingSoon && (
             <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-1 pointer-events-none" aria-hidden="true">
                <p className="text-xs font-press-start text-brand-yellow drop-shadow-[2px_2px_0_#000]">Coming Soon</p>
            </div>
        )}
         {beta && (
            <div className="absolute top-2 right-2 bg-brand-magenta text-white text-[8px] font-press-start px-1 border border-black pointer-events-none" aria-hidden="true">BETA</div>
        )}
    </div>
);


export const MinigameHubPage: React.FC<MinigameHubPageProps> = ({ playSound, isOnline }) => {
    const [activeGame, setActiveGame] = useState<ActiveGame>('hub');
    const [error, setError] = useState<string | null>(null);
    const { addCredits } = useCredits();
    const [searchQuery, setSearchQuery] = useState('');
    const [highScores, setHighScores] = useState({
        snake: 0,
        brickBreaker: 0,
        musicMemory: 0,
    });

    useEffect(() => {
        if (activeGame === 'hub') {
            const scores = {
                snake: parseInt(localStorage.getItem('minigame_snake_highscore') || '0', 10),
                brickBreaker: parseInt(localStorage.getItem('minigame_brickBreaker_highscore') || '0', 10),
                musicMemory: parseInt(localStorage.getItem('musicMemoryHighScore') || '0', 10),
            };
            setHighScores(scores);
        }
    }, [activeGame]);

    const handleLaunchGame = (game: ActiveGame) => {
        playSound(audioService.playClick);
        setActiveGame(game);
    };
    
    const aiToolsData = useMemo(() => [
        {
            icon: <FileChatIcon className="w-16 h-16" />,
            title: "File Q&A",
            description: "Upload a file (image, audio, text) and start chatting with an AI about its content.",
            onClick: () => handleLaunchGame('fileChat'),
            disabled: !isOnline,
            beta: true
        },
        {
            icon: <VideoEditorIcon className="w-16 h-16" />,
            title: "Video Editor",
            description: "Edit your videos with the power of AI. Change styles, generate automatic subtitles, and more.",
            onClick: () => handleLaunchGame('videoEditor'),
            disabled: !isOnline,
            beta: true
        },
        {
            icon: <SearchMusicIcon className="w-16 h-16" />,
            title: "Song/Audio Search",
            description: "Upload an audio or video clip and let an AI help you identify the song and find more information.",
            onClick: () => handleLaunchGame('songSearch'),
            disabled: !isOnline,
            beta: true
        },
        {
            icon: <AnalyzeIcon className="w-16 h-16" />,
            title: "Media Analyzer",
            description: "Let an AI analyze your image, video, or audio files to describe, enhance quality, or extract elements.",
            onClick: () => handleLaunchGame('analyzeMedia'),
            disabled: !isOnline,
            beta: true
        },
        {
            icon: <CodeIcon className="w-16 h-16" />,
            title: "Image to Code",
            description: "Upload a UI mockup and watch AI convert it into HTML and CSS code.",
            onClick: () => handleLaunchGame('imageToCode'),
            disabled: !isOnline,
            beta: true
        },
    ], [isOnline]);

    const gamesAndFunData = useMemo(() => [
        {
            icon: <RecordIcon className="w-16 h-16" />,
            title: "Media Recorder",
            description: "Record audio from your microphone or video from your camera directly in the app.",
            onClick: () => handleLaunchGame('mediaRecorder'),
        },
        {
            icon: <TextToSpeechIcon className="w-16 h-16" />,
            title: "AI Text-to-Speech",
            description: "Convert text to speech with various voices. Earn 1 credit for every character the AI reads!",
            onClick: () => handleLaunchGame('textToSpeech'),
        },
        {
            icon: <GuessThePromptIcon className="w-16 h-16" />,
            title: "Guess The Prompt",
            description: "See an AI-generated image and try to guess what prompt was used to create it! Test your AI intuition.",
            onClick: () => handleLaunchGame('guessThePrompt'),
            disabled: !isOnline,
            beta: true,
        },
         {
            icon: <MusicInspectIcon className="w-16 h-16" />,
            title: "Music Inspector",
            description: "Test your musical memory! Listen to the AI's sequence and play it back correctly.",
            onClick: () => handleLaunchGame('musicMemory'),
            beta: true,
            highScore: highScores.musicMemory,
        },
        {
            icon: <WordMatchIcon className="w-16 h-16" />,
            title: "AI Word Match",
            description: "Enter any topic and have the AI generate creative associations. Earn 10,000 free credits every time!",
            onClick: () => handleLaunchGame('wordMatch'),
            disabled: !isOnline
        },
        {
            icon: <TicTacToeIcon className="w-16 h-16" />,
            title: "Smart Tic-Tac-Toe",
            description: "Challenge a surprisingly smart AI in the classic game of Tic-Tac-Toe, or play with a friend.",
            onClick: () => handleLaunchGame('ticTacToe'),
            disabled: !isOnline
        },
        {
            icon: <BrickBreakerIcon className="w-16 h-16" />,
            title: "Brick Breaker",
            description: "The timeless classic block-breaking game! The more bricks you smash, the more credits you earn!",
            onClick: () => handleLaunchGame('brickBreaker'),
            highScore: highScores.brickBreaker,
        },
        {
            icon: <SnakeIcon className="w-16 h-16" />,
            title: "Snake Game",
            description: "Control the little snake to eat food, grow, and score points. Earn credits for every bite!",
            onClick: () => handleLaunchGame('snake'),
            highScore: highScores.snake,
        },
        {
            icon: <PlatformerIcon className="w-16 h-16" />,
            title: "Platformer",
            description: "A challenging platforming adventure. Guide your character through the level to reach the goal.",
            onClick: () => handleLaunchGame('platformer'),
        },
        {
            icon: <BugIcon className="w-16 h-16" />,
            title: "AI Text Corrector",
            description: "Let an AI act as your personal proofreader for Thai text (cost is based on text length).",
            onClick: () => handleLaunchGame('aiBugSquasher'),
            disabled: !isOnline
        },
        {
            icon: <OracleIcon className="w-16 h-16" />,
            title: "AI Oracle",
            description: "Ask the AI Oracle a question, and it will reveal a mysterious 'secret' or story for you.",
            onClick: () => handleLaunchGame('aiOracle'),
            disabled: !isOnline
        },
        {
            icon: <CalculatorIcon className="w-16 h-16" />,
            title: "Credit Calculator",
            description: "Turn simple calculations into credit generation! Earn credits equal to the calculated result.",
            onClick: () => handleLaunchGame('calculator'),
        },
        {
            icon: <MagicButtonIcon className="w-16 h-16" />,
            title: "The Magic Button",
            description: "A simple yet powerful button! Every press instantly grants you 1 free credit!",
            onClick: () => handleLaunchGame('magicButton'),
        },
         {
            icon: <PetIcon className="w-16 h-16" />,
            title: "AI Pet Workshop",
            description: "Create and customize your own digital pet using parts generated by AI.",
            comingSoon: true
        }
    ], [highScores, isOnline]);

    const filteredAiTools = useMemo(() => {
        if (!searchQuery.trim()) return aiToolsData;
        const lowerCaseQuery = searchQuery.toLowerCase();
        return aiToolsData.filter(tool =>
            tool.title.toLowerCase().includes(lowerCaseQuery) ||
            tool.description.toLowerCase().includes(lowerCaseQuery)
        );
    }, [searchQuery, aiToolsData]);

    const filteredGamesAndFun = useMemo(() => {
        if (!searchQuery.trim()) return gamesAndFunData;
        const lowerCaseQuery = searchQuery.toLowerCase();
        return gamesAndFunData.filter(game =>
            game.title.toLowerCase().includes(lowerCaseQuery) ||
            game.description.toLowerCase().includes(lowerCaseQuery)
        );
    }, [searchQuery, gamesAndFunData]);


    if (activeGame === 'ticTacToe') {
        return <TicTacToePage onClose={() => setActiveGame('hub')} playSound={playSound} isOnline={isOnline} />;
    }
    if (activeGame === 'snake') {
        return <SnakeGame onClose={() => setActiveGame('hub')} playSound={playSound} addCredits={addCredits} />;
    }
    if (activeGame === 'platformer') {
        return <PlatformerGame onClose={() => setActiveGame('hub')} playSound={playSound} />;
    }
    if (activeGame === 'brickBreaker') {
        return <BrickBreakerGame onClose={() => setActiveGame('hub')} playSound={playSound} addCredits={addCredits} />;
    }
    if (activeGame === 'calculator') {
        return <CalculatorPage onClose={() => setActiveGame('hub')} playSound={playSound} />;
    }
    if (activeGame === 'aiOracle') {
        return <AiOraclePage onClose={() => setActiveGame('hub')} playSound={playSound} isOnline={isOnline} />;
    }
    if (activeGame === 'wordMatch') {
        return <WordMatchPage onClose={() => setActiveGame('hub')} playSound={playSound} isOnline={isOnline} />;
    }
    if (activeGame === 'aiBugSquasher') {
        return <AiBugSquasherPage onClose={() => setActiveGame('hub')} playSound={playSound} isOnline={isOnline} />;
    }
    if (activeGame === 'songSearch') {
        return <SongSearchPage onClose={() => setActiveGame('hub')} playSound={playSound} isOnline={isOnline} />;
    }
    if (activeGame === 'magicButton') {
        return <MagicButtonPage onClose={() => setActiveGame('hub')} playSound={playSound} addCredits={addCredits} />;
    }
    if (activeGame === 'videoEditor') {
        return <VideoEditorPage onClose={() => handleLaunchGame('hub')} playSound={playSound} isOnline={isOnline} />;
    }
    if (activeGame === 'guessThePrompt') {
        return <GuessThePromptPage onClose={() => setActiveGame('hub')} playSound={playSound} isOnline={isOnline} />;
    }
    if (activeGame === 'musicMemory') {
        return <MusicMemoryGamePage onClose={() => setActiveGame('hub')} playSound={playSound} />;
    }
    if (activeGame === 'fileChat') {
        return <FileChatPage onClose={() => setActiveGame('hub')} playSound={playSound} isOnline={isOnline} />;
    }
    if (activeGame === 'analyzeMedia') {
        return <AnalyzeMediaPage onClose={() => setActiveGame('hub')} playSound={playSound} isOnline={isOnline} />;
    }
    if (activeGame === 'imageToCode') {
        return <ImageToCodePage onClose={() => setActiveGame('hub')} playSound={playSound} isOnline={isOnline} />;
    }
    if (activeGame === 'mediaRecorder') {
        return <MediaRecorderPage onClose={() => setActiveGame('hub')} playSound={playSound} />;
    }
    if (activeGame === 'textToSpeech') {
        return <TextToSpeechPage onClose={() => setActiveGame('hub')} playSound={playSound} />;
    }

    return (
        <div className="w-full h-full flex flex-col items-center px-4">
            <h1 className="text-3xl sm:text-4xl text-brand-yellow text-center drop-shadow-[3px_3px_0_#000] mb-6">Features & Minigames</h1>
            
            <div className="w-full max-w-4xl mb-6">
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-light/70 pointer-events-none">
                        <SearchIcon className="w-6 h-6" />
                    </span>
                    <input
                        type="search"
                        placeholder="Search for tools or games..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-4 pl-14 bg-black/50 border-4 border-brand-light text-brand-light font-press-start text-sm focus:outline-none focus:border-brand-yellow placeholder:text-brand-light/50"
                        aria-label="Search for tools and minigames"
                    />
                </div>
            </div>

            <div className="w-full max-w-4xl flex-grow font-sans">
                {error && (
                    <div role="alert" className="w-full p-3 mb-4 text-center text-sm text-brand-light bg-brand-magenta/20 border-2 border-brand-magenta">
                        {error}
                    </div>
                )}
                
                {filteredAiTools.length > 0 && (
                    <>
                        <h2 id="tools-heading" className="font-press-start text-2xl text-brand-cyan mb-4 mt-4">AI Tools</h2>
                        <section 
                            aria-labelledby="tools-heading"
                            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
                        >
                            {filteredAiTools.map(tool => <GameButton key={tool.title} {...tool} />)}
                        </section>
                    </>
                )}

                {filteredGamesAndFun.length > 0 && (
                    <>
                        <h2 id="games-heading" className="font-press-start text-2xl text-brand-cyan mb-4">Minigames & Fun</h2>
                        <section 
                            aria-labelledby="games-heading"
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                           {filteredGamesAndFun.map(game => <GameButton key={game.title} {...game} />)}
                        </section>
                    </>
                )}
                
                {searchQuery && filteredAiTools.length === 0 && filteredGamesAndFun.length === 0 && (
                     <div className="text-center font-press-start text-brand-light/80 p-8">
                        <p>No tools or games match your search.</p>
                    </div>
                )}
            </div>
        </div>
    );
};