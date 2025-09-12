import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import * as geminiService from '../services/geminiService';
import * as audioService from '../services/audioService';
import { TicTacToePage } from './TicTacToePage';
import { Minigame } from './Minigame';
import { TicTacToeIcon } from './icons/TicTacToeIcon';
import { GamepadIcon } from './icons/GamepadIcon';
import { SnakeIcon } from './icons/SnakeIcon';
import { SnakeGame } from './SnakeGame';
import { PlatformerIcon } from './icons/PlatformerIcon';
import { PlatformerGame } from './PlatformerGame';
import { useCredits, CREDIT_COSTS } from '../contexts/CreditContext';
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
import { IMAGE_ASSETS } from '../services/assetLoader';
import { GuessThePromptIcon } from './icons/GuessThePromptIcon';
import { GuessThePromptPage } from './GuessThePromptPage';
import { PetIcon } from './icons/PetIcon';
import { MusicInspectIcon } from './icons/MusicInspectIcon';
import { MusicMemoryGamePage } from './MusicMemoryGamePage';
import { FileChatIcon } from './icons/FileChatIcon';
import { FileChatPage } from './FileChatPage';
import { AnalyzeMediaPage } from './AnalyzeMediaPage';

interface MinigameHubPageProps {
    playSound: (player: () => void) => void;
    isOnline: boolean;
    onOpenAbout: () => void;
}

type ActiveGame =
    | 'hub' | 'pixelDodge' | 'ticTacToe' | 'snake' | 'platformer'
    | 'brickBreaker' | 'calculator' | 'aiOracle' | 'wordMatch' | 'aiBugSquasher'
    | 'songSearch' | 'magicButton' | 'videoEditor'
    | 'guessThePrompt' | 'musicMemory' | 'fileChat' | 'analyzeMedia';

const GameButton: React.FC<{ icon: React.ReactNode; title: string; description: string; onClick?: () => void; disabled?: boolean; comingSoon?: boolean; beta?: boolean; highScore?: number; }> = ({ icon, title, description, onClick, disabled, comingSoon, beta, highScore }) => (
    <div className="relative group h-full">
        <button
            onClick={onClick}
            disabled={disabled || comingSoon}
            className="w-full h-full flex items-start text-left gap-4 p-4 bg-black/40 border-4 border-brand-light shadow-pixel transition-all hover:bg-brand-cyan/20 hover:border-brand-yellow hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_#f0f0f0] active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`เปิด ${title}`}
        >
            <div className="flex-shrink-0 w-16 h-16 text-brand-cyan">{icon}</div>
            <div className="font-sans">
                <h3 className="font-press-start text-base md:text-lg text-brand-yellow">{title}</h3>
                <p className="text-xs text-brand-light/80 mt-1">{description}</p>
                {highScore > 0 && (
                    <p className="font-press-start text-xs text-brand-cyan mt-2">
                        HI-SCORE: {highScore.toLocaleString()}
                    </p>
                )}
            </div>
        </button>
        {comingSoon && (
             <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-1 pointer-events-none" aria-hidden="true">
                <p className="text-xs font-press-start text-brand-yellow drop-shadow-[2px_2px_0_#000]">เร็วๆ นี้</p>
            </div>
        )}
         {beta && (
            <div className="absolute top-2 right-2 bg-brand-magenta text-white text-[8px] font-press-start px-1 border border-black pointer-events-none" aria-hidden="true">ทดลอง</div>
        )}
    </div>
);


export const MinigameHubPage: React.FC<MinigameHubPageProps> = ({ playSound, isOnline, onOpenAbout }) => {
    const [activeGame, setActiveGame] = useState<ActiveGame>('hub');
    const [isLoadingAssets, setIsLoadingAssets] = useState(false);
    const [gameAssets, setGameAssets] = useState<{ player: string | null; obstacle: string | null; }>({ player: null, obstacle: null });
    const [error, setError] = useState<string | null>(null);
    const { addCredits } = useCredits();
    const [searchQuery, setSearchQuery] = useState('');
    const [highScores, setHighScores] = useState({
        pixelDodge: 0,
        snake: 0,
        brickBreaker: 0,
        musicMemory: 0,
    });

    useEffect(() => {
        if (activeGame === 'hub') {
            const scores = {
                pixelDodge: parseInt(localStorage.getItem('minigame_pixelDodge_highscore') || '0', 10),
                snake: parseInt(localStorage.getItem('minigame_snake_highscore') || '0', 10),
                brickBreaker: parseInt(localStorage.getItem('minigame_brickBreaker_highscore') || '0', 10),
                musicMemory: parseInt(localStorage.getItem('musicMemoryHighScore') || '0', 10),
            };
            setHighScores(scores);
        }
    }, [activeGame]);

    const handleLaunchPixelDodge = useCallback(() => {
        playSound(audioService.playClick);
        setGameAssets({ 
            player: IMAGE_ASSETS.defaultPlayer,
            obstacle: IMAGE_ASSETS.defaultObstacle
        });
        setActiveGame('pixelDodge');
    }, [playSound]);

    const handleLaunchGame = (game: ActiveGame) => {
        playSound(audioService.playClick);
        setActiveGame(game);
    };
    
    const aiToolsData = useMemo(() => [
        {
            icon: <FileChatIcon className="w-16 h-16" />,
            title: "File Q&A (PDF.AI)",
            description: "อัปโหลดไฟล์ (รูป, เสียง, ข้อความ) แล้วเริ่มแชทกับ AI เกี่ยวกับเนื้อหาในไฟล์นั้นได้เลย",
            onClick: () => handleLaunchGame('fileChat'),
            disabled: !isOnline,
            beta: true
        },
        {
            icon: <VideoEditorIcon className="w-16 h-16" />,
            title: "ตัดต่อวิดีโอ",
            description: "ตัดต่อวิดีโอของคุณด้วยพลังของ AI เปลี่ยนสไตล์, สร้างคำบรรยายอัตโนมัติ, และอื่นๆ อีกมากมาย",
            onClick: () => handleLaunchGame('videoEditor'),
            disabled: !isOnline,
            beta: true
        },
        {
            icon: <SearchMusicIcon className="w-16 h-16" />,
            title: "ค้นหาเพลง/เสียง",
            description: "อัปโหลดคลิปเสียงหรือวิดีโอ แล้วให้ AI ช่วยค้นหาข้อมูลเพลงให้คุณทันที",
            onClick: () => handleLaunchGame('songSearch'),
            disabled: !isOnline,
            beta: true
        },
        {
            icon: <AnalyzeIcon className="w-16 h-16" />,
            title: "วิเคราะห์สื่อ",
            description: "ให้ AI ช่วยวิเคราะห์ไฟล์รูปภาพ, วิดีโอ, หรือเสียงของคุณ เพื่ออธิบาย, ปรับปรุงคุณภาพ, หรือแยกองค์ประกอบ",
            onClick: () => handleLaunchGame('analyzeMedia'),
            disabled: !isOnline,
            beta: true
        },
    ], [isOnline]);

    const gamesAndFunData = useMemo(() => [
        {
            icon: <GamepadIcon className="w-16 h-16" />,
            title: "Pixel Dodge",
            description: "เกมหลบหลีกสไตล์เรโทรสุดคลาสสิก! มาดูกันว่าคุณจะทำคะแนนได้เท่าไหร่!",
            onClick: handleLaunchPixelDodge,
            highScore: highScores.pixelDodge,
        },
        {
            icon: <GuessThePromptIcon className="w-16 h-16" />,
            title: "ทายคำสั่ง AI",
            description: "ดูภาพที่ AI สร้าง แล้วทายว่าคำสั่ง (prompt) ที่ใช้คืออะไร! ทดสอบสัญชาตญาณ AI ของคุณ",
            onClick: () => handleLaunchGame('guessThePrompt'),
            disabled: !isOnline,
            beta: true,
        },
         {
            icon: <MusicInspectIcon className="w-16 h-16" />,
            title: "Music Inspector",
            description: "ทดสอบความจำทางดนตรีของคุณ! ฟังเสียงจาก AI แล้วเล่นตามให้ถูกต้อง",
            onClick: () => handleLaunchGame('musicMemory'),
            beta: true,
            highScore: highScores.musicMemory,
        },
        {
            icon: <WordMatchIcon className="w-16 h-16" />,
            title: "AI จับคู่คำ",
            description: "ป้อนคำใดๆ แล้วให้ AI จับคู่กับสิ่งต่างๆ พร้อมรับ 10,000 เครดิตฟรีทุกครั้งที่เล่น!",
            onClick: () => handleLaunchGame('wordMatch'),
            disabled: !isOnline
        },
        {
            icon: <TicTacToeIcon className="w-16 h-16" />,
            title: "OX อัจฉริยะ",
            description: "ท้าทาย AI ที่ฉลาดเป็นกรดในเกม OX สุดคลาสสิก หรือชวนเพื่อนมาเล่น 2 คนก็ได้",
            onClick: () => handleLaunchGame('ticTacToe'),
            disabled: !isOnline
        },
        {
            icon: <BrickBreakerIcon className="w-16 h-16" />,
            title: "Brick Breaker",
            description: "เกมทำลายบล็อกสุดคลาสสิก! ยิ่งทุบบล็อกเยอะ ยิ่งได้เครดิตเยอะ!",
            onClick: () => handleLaunchGame('brickBreaker'),
            highScore: highScores.brickBreaker,
        },
        {
            icon: <SnakeIcon className="w-16 h-16" />,
            title: "เกมงู",
            description: "ควบคุมเจ้างูน้อยให้กินอาหารเพื่อเติบโตและทำคะแนน ทุกครั้งที่กิน รับเครดิตเพิ่ม!",
            onClick: () => handleLaunchGame('snake'),
            highScore: highScores.snake,
        },
        {
            icon: <PlatformerIcon className="w-16 h-16" />,
            title: "Platformer",
            description: "เกมกระโดดผจญภัยสุดท้าทาย บังคับตัวละครของคุณผ่านด่านเพื่อไปให้ถึงเส้นชัย",
            onClick: () => handleLaunchGame('platformer'),
        },
        {
            icon: <BugIcon className="w-16 h-16" />,
            title: "AI แก้ไขคำผิด",
            description: "ให้ AI เป็นผู้ช่วยพิสูจน์อักษรภาษาไทยของคุณ (มีค่าใช้จ่ายตามความยาวข้อความ)",
            onClick: () => handleLaunchGame('aiBugSquasher'),
            disabled: !isOnline
        },
        {
            icon: <OracleIcon className="w-16 h-16" />,
            title: "AI พยากรณ์",
            description: "ถาม AI พยากรณ์ของเราสิ แล้ว AI จะเปิดเผย 'ความลับ' หรือเรื่องราวที่คาดไม่ถึงให้คุณฟัง",
            onClick: () => handleLaunchGame('aiOracle'),
            disabled: !isOnline
        },
        {
            icon: <CalculatorIcon className="w-16 h-16" />,
            title: "เครื่องคิดเลขเครดิต",
            description: "เปลี่ยนการคำนวณตัวเลขธรรมดาให้กลายเป็นการสร้างเครดิต! รับเครดิตเท่ากับผลลัพธ์ที่ได้",
            onClick: () => handleLaunchGame('calculator'),
        },
        {
            icon: <MagicButtonIcon className="w-16 h-16" />,
            title: "ปุ่มมหัศจรรย์",
            description: "ปุ่มที่เรียบง่ายแต่ทรงพลัง! ทุกครั้งที่กด คุณจะได้รับ 1 เครดิตฟรีทันที!",
            onClick: () => handleLaunchGame('magicButton'),
        },
         {
            icon: <PetIcon className="w-16 h-16" />,
            title: "AI Pet Workshop",
            description: "สร้างและปรับแต่งสัตว์เลี้ยงดิจิทัลของคุณด้วยชิ้นส่วนที่สร้างโดย AI",
            comingSoon: true
        }
    ], [handleLaunchPixelDodge, highScores, isOnline]);

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


    if (activeGame === 'pixelDodge' && gameAssets.player && gameAssets.obstacle) {
        return <Minigame playerImageUrl={gameAssets.player} obstacleImageUrl={gameAssets.obstacle} onClose={() => setActiveGame('hub')} playSound={playSound} />;
    }
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

    return (
        <div className="w-full h-full flex flex-col items-center px-4">
            <h1 className="text-3xl sm:text-4xl text-brand-yellow text-center drop-shadow-[3px_3px_0_#000] mb-6">ฟีเจอร์เสริม & มินิเกม</h1>
            
            <div className="w-full max-w-4xl mb-6">
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-light/70 pointer-events-none">
                        <SearchIcon className="w-6 h-6" />
                    </span>
                    <input
                        type="search"
                        placeholder="ค้นหาเครื่องมือหรือเกม..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-4 pl-14 bg-black/50 border-4 border-brand-light text-brand-light font-press-start text-sm focus:outline-none focus:border-brand-yellow placeholder:text-brand-light/50"
                        aria-label="ค้นหาเครื่องมือและมินิเกม"
                    />
                </div>
            </div>

            <div className="w-full max-w-4xl flex-grow font-sans">
                {isLoadingAssets ? (
                    <LoadingSpinner text="กำลังสร้างตัวละคร..." />
                ) : (
                    <>
                        {error && (
                            <div role="alert" className="w-full p-3 mb-4 text-center text-sm text-brand-light bg-brand-magenta/20 border-2 border-brand-magenta">
                                {error}
                            </div>
                        )}
                        
                        {filteredAiTools.length > 0 && (
                            <>
                                <h2 id="tools-heading" className="font-press-start text-2xl text-brand-cyan mb-4 mt-4">เครื่องมือ AI</h2>
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
                                <h2 id="games-heading" className="font-press-start text-2xl text-brand-cyan mb-4">มินิเกมและความสนุก</h2>
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
                                <p>ไม่พบเครื่องมือหรือเกมที่ตรงกับเกณฑ์การค้นหาของคุณ</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
