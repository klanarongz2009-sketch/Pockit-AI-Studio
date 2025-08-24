

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

interface MinigameHubPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

type ActiveGame = 'hub' | 'pixelDodge' | 'ticTacToe' | 'snake' | 'platformer' | 'brickBreaker' | 'calculator' | 'aiOracle' | 'wordMatch' | 'aiBugSquasher';

const GameButton: React.FC<{ icon: React.ReactNode; title: string; description: string; onClick?: () => void; disabled?: boolean; comingSoon?: boolean }> = ({ icon, title, description, onClick, disabled, comingSoon }) => (
    <div className="relative">
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


    const pixelDodgeCost = CREDIT_COSTS.MINIGAME_ASSET * 2;

    return (
        <PageWrapper>
            <PageHeader title="ฟีเจอร์เสริม & มินิเกม" onBack={onClose} />
            <main className="w-full max-w-4xl mx-auto p-4 flex-grow overflow-y-auto font-sans space-y-6">
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
                                icon={<BugIcon className="w-16 h-16" />}
                                title="AI แก้ไขคำผิด"
                                description="พิมพ์ข้อความ แล้วให้ AI แก้ไขไวยากรณ์และคำผิด พร้อมลุ้นรับเครดิตคืน!"
                                onClick={() => handleLaunchGame('aiBugSquasher')}
                                disabled={!isOnline}
                            />
                            <GameButton
                                icon={<WordMatchIcon className="w-16 h-16" />}
                                title="AI จับคู่คำ"
                                description="ป้อนคำ แล้วรับการจับคู่สุดสร้างสรรค์พร้อม 10,000 เครดิตฟรี!"
                                onClick={() => handleLaunchGame('wordMatch')}
                                disabled={!isOnline}
                            />
                            <GameButton
                                icon={<OracleIcon className="w-16 h-16" />}
                                title="AI พยากรณ์"
                                description="ถาม AI เกี่ยวกับความลับของจักรวาล แล้วรับคำทำนายที่คาดไม่ถึง"
                                onClick={() => handleLaunchGame('aiOracle')}
                                disabled={!isOnline}
                            />
                            <GameButton
                                icon={<GamepadIcon className="w-16 h-16" />}
                                title="Pixel Dodge"
                                description={`เกมหลบหลีกสิ่งกีดขวางที่สร้างตัวละครโดย AI! (ต้องใช้ ${pixelDodgeCost} เครดิต)`}
                                onClick={handleLaunchPixelDodge}
                                disabled={!isOnline}
                            />
                            <GameButton
                                icon={<TicTacToeIcon className="w-16 h-16" />}
                                title="OX อัจฉริยะ"
                                description="ท้าทาย AI ในเกม OX สุดคลาสสิก ชนะเพื่อรับเครดิต!"
                                onClick={() => handleLaunchGame('ticTacToe')}
                                disabled={!isOnline}
                            />
                             <GameButton
                                icon={<BrickBreakerIcon className="w-16 h-16" />}
                                title="Brick Breaker"
                                description="เกมทำลายบล็อกสุดคลาสสิก ทุบบล็อกเพื่อรับเครดิต!"
                                onClick={() => handleLaunchGame('brickBreaker')}
                            />
                            <GameButton
                                icon={<SnakeIcon className="w-16 h-16" />}
                                title="เกมงู"
                                description="เกมงูคลาสสิกในสไตล์พิกเซล กินอาหารเพื่อรับเครดิต!"
                                onClick={() => handleLaunchGame('snake')}
                            />
                             <GameButton
                                icon={<PlatformerIcon className="w-16 h-16" />}
                                title="Platformer"
                                description="เกมกระโดดผจญภัยสั้นๆ ไปให้ถึงเส้นชัย!"
                                onClick={() => handleLaunchGame('platformer')}
                            />
                             <GameButton
                                icon={<CalculatorIcon className="w-16 h-16" />}
                                title="เครื่องคิดเลขเครดิต"
                                description="คำนวณเลขแล้วรับเครดิตเท่ากับผลลัพธ์!"
                                onClick={() => handleLaunchGame('calculator')}
                            />
                        </div>
                    </>
                )}
            </main>
        </PageWrapper>
    );
};