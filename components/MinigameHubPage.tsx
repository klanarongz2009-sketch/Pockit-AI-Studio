
import React, { useState, useCallback } from 'react';
import { PageHeader, PageWrapper } from './PageComponents';
import { LoadingSpinner } from './LoadingSpinner';
import * as geminiService from '../services/geminiService';
import * as audioService from '../services/audioService';
import { TicTacToePage } from './TicTacToePage';
import { Minigame } from './Minigame';
import { TicTacToeIcon } from './icons/TicTacToeIcon';
import { GamepadIcon } from './icons/GamepadIcon';
import { SnakeIcon } from './icons/SnakeIcon';
import { SnakeGame } from './SnakeGame';
import { SparklesIcon } from './icons/SparklesIcon';
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

interface MinigameHubPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

type ActiveGame = 'hub' | 'pixelDodge' | 'ticTacToe' | 'snake' | 'platformer' | 'brickBreaker' | 'calculator' | 'aiOracle' | 'wordMatch' | 'aiBugSquasher' | 'songSearch' | 'magicButton';

const GameButton: React.FC<{ icon: React.ReactNode; title: string; description: string; onClick?: () => void; disabled?: boolean; comingSoon?: boolean; beta?: boolean; }> = ({ icon, title, description, onClick, disabled, comingSoon, beta }) => (
    <div className="relative group">
        <button
            onClick={onClick}
            disabled={disabled || comingSoon}
            className="w-full flex items-start text-left gap-4 p-4 bg-black/40 border-4 border-brand-light shadow-pixel transition-all hover:bg-brand-cyan/20 active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <div className="flex-shrink-0 w-16 h-16 text-brand-cyan">{icon}</div>
            <div className="font-sans">
                <h3 className="font-press-start text-lg text-brand-yellow">{title}</h3>
                <p className="text-sm text-brand-light/80 mt-1">{description}</p>
            </div>
        </button>
        {comingSoon && (
             <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-1" aria-hidden="true">
                <p className="text-xs font-press-start text-brand-yellow drop-shadow-[2px_2px_0_#000]">เร็วๆ นี้</p>
            </div>
        )}
         {beta && (
            <div className="absolute top-2 right-2 bg-brand-magenta text-white text-[8px] font-press-start px-1 border border-black" aria-hidden="true">ทดลอง</div>
        )}
    </div>
);


export const MinigameHubPage: React.FC<MinigameHubPageProps> = ({ onClose, playSound, isOnline }) => {
    const [activeGame, setActiveGame] = useState<ActiveGame>('hub');
    const [isLoadingAssets, setIsLoadingAssets] = useState(false);
    const [gameAssets, setGameAssets] = useState<{ player: string | null; obstacle: string | null; }>({ player: null, obstacle: null });
    const [error, setError] = useState<string | null>(null);
    const { addCredits, spendCredits, credits } = useCredits();

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


    const pixelDodgeCost = CREDIT_COSTS.MINIGAME_ASSET * 2;

    return (
        <PageWrapper>
            <PageHeader title="ฟีเจอร์เสริม & มินิเกม" onBack={onClose} />
            <main className="w-full max-w-2xl flex-grow overflow-y-auto font-sans pr-2 space-y-6">
                {isLoadingAssets ? (
                    <LoadingSpinner text="กำลังสร้างตัวละคร..." />
                ) : (
                    <>
                        {error && (
                            <div role="alert" className="w-full p-3 text-center text-sm text-brand-magenta border-2 border-brand-magenta/50 bg-brand-magenta/10">
                                {error}
                            </div>
                        )}
                        <div className="space-y-4">
                             <GameButton
                                icon={<SearchMusicIcon className="w-16 h-16" />}
                                title="ค้นหาเพลง/เสียง"
                                description="เคยได้ยินเพลงแล้วนึกชื่อไม่ออกไหม? อัปโหลดไฟล์เสียงหรือวิดีโอที่มีเสียงนั้น แล้ว AI ของเราจะทำการวิเคราะห์และค้นหาข้อมูลเพลงให้คุณทันที ไม่ว่าจะเป็นชื่อเพลง ศิลปิน หรือแม้แต่เพลงที่มีทำนองคล้ายกัน"
                                onClick={() => handleLaunchGame('songSearch')}
                                disabled={!isOnline}
                                beta={true}
                            />
                             <GameButton
                                icon={<BugIcon className="w-16 h-16" />}
                                title="AI แก้ไขคำผิด"
                                description="เบื่อไหมกับการพิมพ์ผิดๆ ถูกๆ? ให้ AI ของเราเป็นผู้ช่วยพิสูจน์อักษรส่วนตัวของคุณ พิมพ์ข้อความภาษาไทยลงไปแล้ว AI จะแก้ไขให้ถูกต้องตามหลักไวยากรณ์ การันตีความเป๊ะ! (มีค่าใช้จ่ายตามความยาวข้อความ)"
                                onClick={() => handleLaunchGame('aiBugSquasher')}
                                disabled={!isOnline}
                            />
                            <GameButton
                                icon={<WordMatchIcon className="w-16 h-16" />}
                                title="AI จับคู่คำ"
                                description="ทดสอบความคิดสร้างสรรค์ของ AI! เพียงแค่ป้อนคำหรือแนวคิดใดๆ ลงไป แล้ว AI จะทำการเชื่อมโยงและจับคู่กับสิ่งต่างๆ ในหมวดหมู่ที่คาดไม่ถึง พร้อมรับ 10,000 เครดิตฟรีทุกครั้งที่เล่น!"
                                onClick={() => handleLaunchGame('wordMatch')}
                                disabled={!isOnline}
                            />
                            <GameButton
                                icon={<OracleIcon className="w-16 h-16" />}
                                title="AI พยากรณ์"
                                description="คุณมีคำถามที่หาคำตอบไม่ได้ใช่ไหม? ถาม AI พยากรณ์ของเราสิ ป้อนหัวข้อที่คุณอยากรู้ แล้ว AI จะเปิดเผย 'ความลับ' หรือเรื่องราวที่คาดไม่ถึงเกี่ยวกับสิ่งนั้นให้คุณฟัง"
                                onClick={() => handleLaunchGame('aiOracle')}
                                disabled={!isOnline}
                            />
                            <GameButton
                                icon={<GamepadIcon className="w-16 h-16" />}
                                title="Pixel Dodge"
                                description={`เกมหลบหลีกสิ่งกีดขวางสุดท้าทายที่สร้างตัวละครฮีโร่และอุปสรรคโดย AI! แต่ละรอบจะไม่ซ้ำกัน มาดูกันว่าคุณจะทำคะแนนได้เท่าไหร่ (ต้องใช้ ${pixelDodgeCost} เครดิตในการสร้างตัวละคร)`}
                                onClick={handleLaunchPixelDodge}
                                disabled={!isOnline}
                            />
                            <GameButton
                                icon={<TicTacToeIcon className="w-16 h-16" />}
                                title="OX อัจฉริยะ"
                                description="ท้าทาย AI ที่ฉลาดเป็นกรดในเกม OX สุดคลาสสิก วางแผนการเดินของคุณให้ดีเพื่อเอาชนะและรับเครดิตเป็นรางวัล หรือจะชวนเพื่อนมาเล่น 2 คนก็ได้!"
                                onClick={() => handleLaunchGame('ticTacToe')}
                                disabled={!isOnline}
                            />
                             <GameButton
                                icon={<BrickBreakerIcon className="w-16 h-16" />}
                                title="Brick Breaker"
                                description="เกมทำลายบล็อกสุดคลาสสิกที่ทุกคนคุ้นเคย ควบคุมแท่นรับลูกบอลเพื่อทำลายบล็อกทั้งหมดบนหน้าจอ ยิ่งทุบเยอะ ยิ่งได้เครดิตเยอะ!"
                                onClick={() => handleLaunchGame('brickBreaker')}
                            />
                            <GameButton
                                icon={<SnakeIcon className="w-16 h-16" />}
                                title="เกมงู"
                                description="ควบคุมเจ้างูน้อยในโลกพิกเซลให้กินอาหารเพื่อเติบโตและทำคะแนน แต่ระวัง! อย่าชนกำแพงหรือหางของตัวเอง ทุกครั้งที่กิน คุณจะได้รับเครดิตเพิ่ม!"
                                onClick={() => handleLaunchGame('snake')}
                            />
                             <GameButton
                                icon={<PlatformerIcon className="w-16 h-16" />}
                                title="Platformer"
                                description="เกมแพลตฟอร์มเมอร์กระโดดผจญภัยสุดท้าทาย บังคับตัวละครของคุณผ่านด่านที่เต็มไปด้วยอุปสรรคเพื่อไปให้ถึงเส้นชัย หากพลาดท่า สามารถใช้เครดิตเพื่อเล่นต่อได้!"
                                onClick={() => handleLaunchGame('platformer')}
                            />
                             <GameButton
                                icon={<CalculatorIcon className="w-16 h-16" />}
                                title="เครื่องคิดเลขเครดิต"
                                description="เครื่องมือสุดพิเศษที่จะเปลี่ยนการคำนวณตัวเลขธรรมดาให้กลายเป็นการสร้างเครดิต! แค่ใส่สมการคณิตศาสตร์ลงไป แล้วรับเครดิตเท่ากับผลลัพธ์ที่ได้ (ปัดเศษลง)"
                                onClick={() => handleLaunchGame('calculator')}
                            />
                             <GameButton
                                icon={<MagicButtonIcon className="w-16 h-16" />}
                                title="ปุ่มมหัศจรรย์"
                                description="ปุ่มที่เรียบง่ายแต่ทรงพลัง! ทุกครั้งที่คุณกดปุ่มนี้ คุณจะได้รับ 1 เครดิตฟรีทันที ไม่มีเงื่อนไข ไม่จำกัดจำนวนครั้ง มาดูกันว่าคุณจะสะสมได้เท่าไหร่!"
                                onClick={() => handleLaunchGame('magicButton')}
                            />
                        </div>
                    </>
                )}
            </main>
        </PageWrapper>
    );
};
