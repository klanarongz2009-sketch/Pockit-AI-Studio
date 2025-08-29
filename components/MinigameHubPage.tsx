

import React, { useState, useCallback } from 'react';
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
import { MusicKeyboardIcon } from './icons/MusicKeyboardIcon';
import { MusicGamePage } from './MusicGamePage';
import { VoiceChangerPage } from './VoiceChangerPage';
import { AnalyzeMediaPage } from './AnalyzeMediaPage';
import { TextToSongPage } from './TextToSongPage';
import { ImageToSoundPage } from './ImageToSoundPage';
import { VideoEditorPage } from './VideoEditorPage';
import { VoiceChangerIcon } from './icons/VoiceChangerIcon';
import { AnalyzeIcon } from './icons/AnalyzeIcon';
import { TextMusicIcon } from './icons/TextMusicIcon';
import { ImageSoundIcon } from './icons/ImageSoundIcon';
import { VideoEditorIcon } from './icons/VideoEditorIcon';
import { SoundLibraryPage } from './SoundLibraryPage';
import { SoundWaveIcon } from './icons/SoundWaveIcon';
import { TextToSpeechPage } from './TextToSpeechPage';
import { TextToSpeechIcon } from './icons/TextToSpeechIcon';

interface MinigameHubPageProps {
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

type ActiveGame =
    | 'hub' | 'pixelDodge' | 'ticTacToe' | 'snake' | 'platformer'
    | 'brickBreaker' | 'calculator' | 'aiOracle' | 'wordMatch' | 'aiBugSquasher'
    | 'songSearch' | 'magicButton' | 'musicGame' | 'voiceChanger' | 'analyzeMedia'
    | 'textToSong' | 'imageToSound' | 'videoEditor' | 'soundLibrary' | 'textToSpeech';

const GameButton: React.FC<{ icon: React.ReactNode; title: string; description: string; onClick?: () => void; disabled?: boolean; comingSoon?: boolean; beta?: boolean; }> = ({ icon, title, description, onClick, disabled, comingSoon, beta }) => (
    <div className="relative group h-full">
        <button
            onClick={onClick}
            disabled={disabled || comingSoon}
            className="w-full h-full flex items-start text-left gap-4 p-4 bg-black/40 border-4 border-brand-light shadow-pixel transition-all hover:bg-brand-cyan/20 hover:border-brand-yellow hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_#f0f0f0] active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <div className="flex-shrink-0 w-16 h-16 text-brand-cyan">{icon}</div>
            <div className="font-sans">
                <h3 className="font-press-start text-base md:text-lg text-brand-yellow">{title}</h3>
                <p className="text-xs text-brand-light/80 mt-1">{description}</p>
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


export const MinigameHubPage: React.FC<MinigameHubPageProps> = ({ playSound, isOnline }) => {
    const [activeGame, setActiveGame] = useState<ActiveGame>('hub');
    const [isLoadingAssets, setIsLoadingAssets] = useState(false);
    const [gameAssets, setGameAssets] = useState<{ player: string | null; obstacle: string | null; }>({ player: null, obstacle: null });
    const [error, setError] = useState<string | null>(null);
    const { addCredits, spendCredits, credits } = useCredits();
    const [isPlayingSong, setIsPlayingSong] = useState(false);

    const handleLaunchPixelDodge = useCallback(async () => {
        if (!isOnline) {
            setError("เกมนี้ต้องการการเชื่อมต่ออินเทอร์เน็ตเพื่อสร้างตัวละคร");
            return;
        }

        const cost = CREDIT_COSTS.MINIGAME_ASSET * 2;
        if (!spendCredits(cost)) {
            setError(`เครดิตไม่เพียงพอ! ต้องการ ${cost} เครดิต แต่คุณมี ${Math.floor(credits)} เครดิต`);
            return;
        }

        playSound(audioService.playGenerate);
        setIsLoadingAssets(true);
        setError(null);

        try {
            const [player, obstacle] = await Promise.all([
                geminiService.generatePixelArt("a cute and simple hero character for a game"),
                geminiService.generatePixelArt("a simple obstacle for a game, like a spiky ball or a small monster")
            ]);
            setGameAssets({ player, obstacle });
            setActiveGame('pixelDodge');
        } catch (err) {
            playSound(audioService.playError);
            addCredits(cost); // Refund credits on failure
            const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างทรัพย์สินเกม';
            setError(errorMessage);
        } finally {
            setIsLoadingAssets(false);
        }
    }, [isOnline, spendCredits, credits, playSound, addCredits]);

    const handleLaunchGame = (game: ActiveGame) => {
        playSound(audioService.playClick);
        setActiveGame(game);
    };
    
    const aiToolsData = [
        {
            icon: <VideoEditorIcon className="w-16 h-16" />,
            title: "ตัดต่อวิดีโอ",
            description: "ตัดต่อวิดีโอของคุณด้วยพลังของ AI เปลี่ยนสไตล์, สร้างคำบรรยายอัตโนมัติ, และอื่นๆ อีกมากมาย",
            onClick: () => handleLaunchGame('videoEditor'),
            disabled: !isOnline,
            beta: true
        },
        {
            icon: <VoiceChangerIcon className="w-16 h-16" />,
            title: "สตูดิโอเสียง",
            description: "แปลงไฟล์เสียง/วิดีโอด้วยเอฟเฟกต์มากมาย หรือแปลงเสียงร้องเป็นโน้ตดนตรี (MIDI)",
            onClick: () => handleLaunchGame('voiceChanger'),
            beta: true,
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
            icon: <TextToSpeechIcon className="w-16 h-16" />,
            title: "AI อ่านออกเสียง",
            description: "แปลงข้อความเป็นเสียงพูดด้วย AI พร้อมปรับแต่งเสียงได้หลากหลาย รับเครดิตตามความยาวข้อความ!",
            onClick: () => handleLaunchGame('textToSpeech'),
        },
        {
            icon: <TextMusicIcon className="w-16 h-16" />,
            title: "สร้างเพลงจากข้อความ",
            description: "เปลี่ยนเรื่องราว, บทกวี, หรือเนื้อเพลงของคุณให้กลายเป็นเพลง 8-bit ที่มีเอกลักษณ์ไม่ซ้ำใคร",
            onClick: () => handleLaunchGame('textToSong'),
            disabled: !isOnline
        },
        {
            icon: <SoundWaveIcon className="w-16 h-16" />,
            title: "คลังเสียง 8-Bit",
            description: "สร้างเสียงประกอบ 8-bit ที่เป็นเอกลักษณ์สำหรับโปรเจกต์ของคุณด้วย AI",
            onClick: () => handleLaunchGame('soundLibrary'),
            disabled: !isOnline
        },
        {
            icon: <ImageSoundIcon className="w-16 h-16" />,
            title: "สร้างเสียงจากภาพ",
            description: "อัปโหลดภาพ แล้วให้ AI ตีความอารมณ์เพื่อสร้างสรรค์เสียงประกอบ 8-bit ที่เข้ากับภาพนั้น",
            onClick: () => handleLaunchGame('imageToSound'),
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
    ];

    const gamesAndFunData = [
         {
            icon: <GamepadIcon className="w-16 h-16" />,
            title: "Pixel Dodge",
            description: `เกมหลบหลีกที่สร้างตัวละครฮีโร่และอุปสรรคโดย AI! (ใช้ ${CREDIT_COSTS.MINIGAME_ASSET * 2} เครดิตในการสร้างตัวละคร)`,
            onClick: handleLaunchPixelDodge,
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
        },
        {
            icon: <SnakeIcon className="w-16 h-16" />,
            title: "เกมงู",
            description: "ควบคุมเจ้างูน้อยให้กินอาหารเพื่อเติบโตและทำคะแนน ทุกครั้งที่กิน รับเครดิตเพิ่ม!",
            onClick: () => handleLaunchGame('snake'),
        },
        {
            icon: <PlatformerIcon className="w-16 h-16" />,
            title: "Platformer",
            description: "เกมกระโดดผจญภัยสุดท้าทาย บังคับตัวละครของคุณผ่านด่านเพื่อไปให้ถึงเส้นชัย",
            onClick: () => handleLaunchGame('platformer'),
        },
        {
            icon: <MusicKeyboardIcon className="w-16 h-16" />,
            title: "Pixel Synthesizer",
            description: "เล่นสนุกกับซินธิไซเซอร์ 8-bit! สร้างสรรค์เมโลดี้ของคุณเองด้วยเสียงต่างๆ และคีย์บอร์ดสไตล์เรโทร",
            onClick: () => handleLaunchGame('musicGame'),
        },
        {
            icon: <BugIcon className="w-16 h-16" />,
            title: "AI แก้ไขคำผิด",
            description: "ให้ AI เป็นผู้ช่วยพิสูจน์อักษรภาษาไทยของคุณ (มีค่าใช้จ่ายตามความยาวข้อความ)",
            onClick: () => handleLaunchGame('aiBugSquasher'),
            disabled: !isOnline
        },
        {
            icon: <WordMatchIcon className="w-16 h-16" />,
            title: "AI จับคู่คำ",
            description: "ป้อนคำใดๆ แล้วให้ AI จับคู่กับสิ่งต่างๆ พร้อมรับ 10,000 เครดิตฟรีทุกครั้งที่เล่น!",
            onClick: () => handleLaunchGame('wordMatch'),
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
        }
    ];

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
    if (activeGame === 'musicGame') {
        return <MusicGamePage onClose={() => setActiveGame('hub')} playSound={playSound} />;
    }
    if (activeGame === 'voiceChanger') {
        return <VoiceChangerPage onClose={() => handleLaunchGame('hub')} playSound={playSound} />;
    }
    if (activeGame === 'analyzeMedia') {
        return <AnalyzeMediaPage onClose={() => handleLaunchGame('hub')} playSound={playSound} isOnline={isOnline} />;
    }
    if (activeGame === 'textToSong') {
        return <TextToSongPage onClose={() => handleLaunchGame('hub')} playSound={playSound} isPlayingSong={isPlayingSong} setIsPlayingSong={setIsPlayingSong} isOnline={isOnline} />;
    }
    if (activeGame === 'imageToSound') {
        return <ImageToSoundPage onClose={() => handleLaunchGame('hub')} playSound={playSound} isOnline={isOnline} />;
    }
    if (activeGame === 'videoEditor') {
        return <VideoEditorPage onClose={() => handleLaunchGame('hub')} playSound={playSound} isOnline={isOnline} />;
    }
    if (activeGame === 'soundLibrary') {
        return <SoundLibraryPage onClose={() => setActiveGame('hub')} playSound={playSound} isOnline={isOnline} />;
    }
    if (activeGame === 'textToSpeech') {
        return <TextToSpeechPage onClose={() => handleLaunchGame('hub')} playSound={playSound} />;
    }

    return (
        <div className="w-full h-full flex flex-col items-center px-4">
            <h1 className="text-3xl sm:text-4xl text-brand-yellow text-center drop-shadow-[3px_3px_0_#000] mb-6">ฟีเจอร์เสริม & มินิเกม</h1>
            <div className="w-full max-w-4xl flex-grow font-sans">
                {isLoadingAssets ? (
                    <LoadingSpinner text="กำลังสร้างตัวละคร..." />
                ) : (
                    <>
                        {error && (
                            <div role="alert" className="w-full p-3 text-center text-sm text-brand-magenta border-2 border-brand-magenta/50 bg-brand-magenta/10">
                                {error}
                            </div>
                        )}
                        
                        <h2 id="tools-heading" className="font-press-start text-2xl text-brand-cyan mb-4 mt-4">เครื่องมือ AI</h2>
                        <section 
                            aria-labelledby="tools-heading"
                            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
                        >
                            {aiToolsData.map(tool => <GameButton key={tool.title} {...tool} />)}
                        </section>

                        <h2 id="games-heading" className="font-press-start text-2xl text-brand-cyan mb-4">มินิเกมและความสนุก</h2>
                        <section 
                            aria-labelledby="games-heading"
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                           {gamesAndFunData.map(game => <GameButton key={game.title} {...game} />)}
                        </section>
                    </>
                )}
            </div>
        </div>
    );
};