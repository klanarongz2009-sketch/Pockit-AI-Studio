

import React, { useState, useMemo, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import * as audioService from '../services/audioService';
import { TicTacToePage } from './TicTacToePage';
import { TicTacToeIcon } from './icons/TicTacToeIcon';
import { SnakeIcon } from './icons/SnakeIcon';
import { SnakeGame } from './SnakeGame';
import { BrickBreakerIcon } from './icons/BrickBreakerIcon';
import { BrickBreakerGame } from './BrickBreakerGame';
import { CalculatorIcon } from './icons/CalculatorIcon';
import { CalculatorPage } from './icons/CalculatorPage';
import { SearchMusicIcon } from './icons/SearchMusicIcon';
import { SongSearchPage } from './SongSearchPage';
import { MagicButtonIcon } from './icons/MagicButtonIcon';
import { MagicButtonPage } from './MagicButtonPage';
import { SearchIcon } from './icons/SearchIcon';
import { TextToSpeechPage } from './TextToSpeechPage';
import { TextToSpeechIcon } from './icons/TextToSpeechIcon';
import { SequencerIcon } from './icons/SequencerIcon';
import { PixelSequencerPage } from './PixelSequencerPage';
import { JumpingIcon } from './icons/JumpingIcon';
import { JumpingGame } from './JumpingGame';
import { DeviceIcon } from './icons/DeviceIcon';
import { DeviceDetailsPage } from './icons/DeviceDetailsPage';
import { AiDetectorIcon } from './AiDetectorIcon';
import { AiDetectorPage } from './AiDetectorPage';
import { MusicAndSoundIcon } from './icons/MusicAndSoundIcon';
import { MusicAndSoundPage } from './MusicAndSoundPage';
import { useLanguage } from '../contexts/LanguageContext';
import { AsteroidShooterIcon } from './icons/AsteroidShooterIcon';
import { AsteroidShooterPage } from './AsteroidShooterPage';
import { MinesweeperIcon } from './icons/MinesweeperIcon';
import { MinesweeperPage } from './MinesweeperPage';

interface MinigameHubPageProps {
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

type ActiveGame =
    | 'hub' | 'ticTacToe' | 'snake' | 'asteroidShooter'
    | 'brickBreaker' | 'calculator' 
    | 'songSearch' | 'magicButton'
    | 'textToSpeech' | 'pixelSequencer'
    | 'jumpingGame' | 'deviceDetails' | 'aiDetector' | 'musicAndSound' | 'minesweeper';

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
    const [searchQuery, setSearchQuery] = useState('');
    const { t } = useLanguage();
    
    useEffect(() => {
        audioService.changeBackgroundMusic(activeGame);
    }, [activeGame]);


    const handleLaunchGame = (game: ActiveGame) => {
        playSound(audioService.playClick);
        setActiveGame(game);
    };
    
    const categories = useMemo(() => [
        { 
            title: "เครื่องมือสร้างสรรค์ AI",
            items: [
                { icon: <SearchMusicIcon className="w-16 h-16" />, title: t('minigameHub.songSearch.title'), description: t('minigameHub.songSearch.description'), onClick: () => handleLaunchGame('songSearch'), disabled: !isOnline, beta: true },
                { icon: <MusicAndSoundIcon className="w-16 h-16" />, title: t('minigameHub.musicAndSound.title'), description: t('minigameHub.musicAndSound.description'), onClick: () => handleLaunchGame('musicAndSound') },
                { icon: <SequencerIcon className="w-16 h-16" />, title: t('minigameHub.pixelSequencer.title'), description: t('minigameHub.pixelSequencer.description'), onClick: () => handleLaunchGame('pixelSequencer') },
                { icon: <TextToSpeechIcon className="w-16 h-16" />, title: t('minigameHub.textToSpeech.title'), description: t('minigameHub.textToSpeech.description'), onClick: () => handleLaunchGame('textToSpeech') },
            ]
        },
        {
            title: "ยูทิลิตี้และเกมอื่นๆ",
            items: [
                { icon: <AiDetectorIcon className="w-16 h-16" />, title: t('minigameHub.aiDetector.title'), description: t('minigameHub.aiDetector.description'), onClick: () => handleLaunchGame('aiDetector'), disabled: !isOnline, beta: true },
                { icon: <AsteroidShooterIcon className="w-16 h-16" />, title: t('minigameHub.asteroidShooter.title'), description: t('minigameHub.asteroidShooter.description'), onClick: () => handleLaunchGame('asteroidShooter') },
                { icon: <JumpingIcon className="w-16 h-16" />, title: t('minigameHub.pixelJumper.title'), description: t('minigameHub.pixelJumper.description'), onClick: () => handleLaunchGame('jumpingGame') },
                { icon: <BrickBreakerIcon className="w-16 h-16" />, title: t('minigameHub.brickBreaker.title'), description: t('minigameHub.brickBreaker.description'), onClick: () => handleLaunchGame('brickBreaker') },
                { icon: <SnakeIcon className="w-16 h-16" />, title: t('minigameHub.snake.title'), description: t('minigameHub.snake.description'), onClick: () => handleLaunchGame('snake') },
                { icon: <TicTacToeIcon className="w-16 h-16" />, title: t('minigameHub.ticTacToe.title'), description: t('minigameHub.ticTacToe.description'), onClick: () => handleLaunchGame('ticTacToe'), disabled: !isOnline },
                { icon: <MinesweeperIcon className="w-16 h-16" />, title: t('minigameHub.minesweeper.title'), description: t('minigameHub.minesweeper.description'), onClick: () => handleLaunchGame('minesweeper') },
                { icon: <MagicButtonIcon className="w-16 h-16" />, title: t('minigameHub.magicButton.title'), description: t('minigameHub.magicButton.description'), onClick: () => handleLaunchGame('magicButton') },
                { icon: <CalculatorIcon className="w-16 h-16" />, title: t('minigameHub.creditCalculator.title'), description: t('minigameHub.creditCalculator.description'), onClick: () => handleLaunchGame('calculator') },
                { icon: <DeviceIcon className="w-16 h-16" />, title: t('minigameHub.deviceSpy.title'), description: t('minigameHub.deviceSpy.description'), onClick: () => handleLaunchGame('deviceDetails') }
            ]
        }
    ], [isOnline, t]);

    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return categories;
        const lowerCaseQuery = searchQuery.toLowerCase();
        
        return categories
            .map(category => ({
                ...category,
                items: category.items.filter(item =>
                    item.title.toLowerCase().includes(lowerCaseQuery) ||
                    item.description.toLowerCase().includes(lowerCaseQuery)
                )
            }))
            .filter(category => category.items.length > 0);

    }, [searchQuery, categories]);


    if (activeGame === 'ticTacToe') {
        return <TicTacToePage onClose={() => setActiveGame('hub')} playSound={playSound} isOnline={isOnline} />;
    }
    if (activeGame === 'snake') {
        return <SnakeGame onClose={() => setActiveGame('hub')} playSound={playSound} />;
    }
    if (activeGame === 'asteroidShooter') {
        // FIX: Changed addCredits prop to an async empty function to match the required type.
        return <AsteroidShooterPage onClose={() => setActiveGame('hub')} addCredits={async () => {}} />;
    }
    if (activeGame === 'brickBreaker') {
        return <BrickBreakerGame onClose={() => setActiveGame('hub')} playSound={playSound} />;
    }
    if (activeGame === 'calculator') {
        return <CalculatorPage onClose={() => setActiveGame('hub')} playSound={playSound} />;
    }
    if (activeGame === 'songSearch') {
        return <SongSearchPage onClose={() => setActiveGame('hub')} playSound={playSound} isOnline={isOnline} />;
    }
    if (activeGame === 'magicButton') {
        return <MagicButtonPage onClose={() => setActiveGame('hub')} playSound={playSound} />;
    }
    if (activeGame === 'textToSpeech') {
        return <TextToSpeechPage onClose={() => setActiveGame('hub')} playSound={playSound} />;
    }
    if (activeGame === 'pixelSequencer') {
        return <PixelSequencerPage onClose={() => setActiveGame('hub')} playSound={playSound} />;
    }
    if (activeGame === 'jumpingGame') {
        return <JumpingGame onClose={() => setActiveGame('hub')} playSound={playSound} />;
    }
    if (activeGame === 'deviceDetails') {
        return <DeviceDetailsPage onClose={() => setActiveGame('hub')} />;
    }
    if (activeGame === 'aiDetector') {
        return <AiDetectorPage onClose={() => setActiveGame('hub')} playSound={playSound} isOnline={isOnline} />;
    }
    if (activeGame === 'musicAndSound') {
        return <MusicAndSoundPage onClose={() => setActiveGame('hub')} playSound={playSound} />;
    }
    if (activeGame === 'minesweeper') {
        return <MinesweeperPage onClose={() => setActiveGame('hub')} playSound={playSound} />;
    }


    return (
        <div className="w-full h-full flex flex-col items-center px-4">
            <h1 className="text-3xl sm:text-4xl text-brand-yellow text-center mb-6">AI Zone</h1>
            
            <div className="w-full max-w-4xl mb-6">
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-light/70 pointer-events-none">
                        <SearchIcon className="w-6 h-6" />
                    </span>
                    <input
                        type="search"
                        placeholder={t('minigameHub.searchPlaceholder')}
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
                
                {filteredCategories.map(category => (
                    <div key={category.title}>
                        <h2 id={`${category.title}-heading`} className="font-press-start text-2xl text-brand-cyan mb-4 mt-8">
                            {category.title}
                        </h2>
                        <section 
                            aria-labelledby={`${category.title}-heading`}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                            {category.items.map(item => <GameButton key={item.title} {...item} />)}
                        </section>
                    </div>
                ))}
                
                {searchQuery && filteredCategories.length === 0 && (
                     <div className="text-center font-press-start text-brand-light/80 p-8">
                        <p>{t('minigameHub.noResults')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};