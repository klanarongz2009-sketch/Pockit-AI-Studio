


import React, { useState, useEffect, useCallback } from 'react';
import { PageWrapper, PageHeader } from './PageComponents';
import { useCredits, CREDIT_COSTS } from '../contexts/CreditContext';
import * as audioService from '../services/audioService';
import * as preferenceService from '../services/preferenceService';
import { SpinningWheel } from './SpinningWheel';
import { AdPlayer } from './AdPlayer';
import { GiftIcon } from './icons/GiftIcon';
import { VideoEditorIcon } from './icons/VideoEditorIcon';

const DAILY_REWARD = 200;
const AD_REWARD = 250;

const Section: React.FC<{ title: string; description: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, description, icon, children }) => (
    <div className="w-full bg-surface-primary p-4 border-4 border-border-secondary shadow-pixel space-y-3">
        <div className="flex items-start gap-4">
            <div className="w-12 h-12 flex-shrink-0 text-brand-cyan">{icon}</div>
            <div>
                <h3 className="font-press-start text-lg text-brand-cyan">{title}</h3>
                <p className="font-sans text-xs text-text-secondary mt-1">{description}</p>
            </div>
        </div>
        <div className="pl-16">{children}</div>
    </div>
);

export const CreditCenterPage: React.FC<{ onClose: () => void; playSound: (player: () => void) => void; }> = ({ onClose, playSound }) => {
    const { addCredits } = useCredits();
    const [isAdPlaying, setIsAdPlaying] = useState(false);
    
    const [canClaimDaily, setCanClaimDaily] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');

    const checkDailyReward = useCallback(async () => {
        // FIX: `getPreference` is async
        const lastClaim = await preferenceService.getPreference('lastDailyRewardClaim', 0);
        const now = new Date();
        const lastClaimDate = new Date(lastClaim);

        if (now.getFullYear() > lastClaimDate.getFullYear() || 
            now.getMonth() > lastClaimDate.getMonth() || 
            now.getDate() > lastClaimDate.getDate()) {
            setCanClaimDaily(true);
        } else {
            setCanClaimDaily(false);
            const tomorrow = new Date(now);
            tomorrow.setDate(now.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            const diff = tomorrow.getTime() - now.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            setTimeLeft(`${hours}h ${minutes}m`);
        }
    }, []);

    useEffect(() => {
        checkDailyReward();
        const interval = setInterval(checkDailyReward, 60000);
        return () => clearInterval(interval);
    }, [checkDailyReward]);

    const handleClaimDaily = async () => {
        if (!canClaimDaily) return;
        playSound(audioService.playCreditAdd);
        // FIX: `addCredits` and `setPreference` are now async
        await addCredits(DAILY_REWARD);
        await preferenceService.setPreference('lastDailyRewardClaim', Date.now());
        setCanClaimDaily(false);
        checkDailyReward();
    };

    const handleWatchAd = () => {
        playSound(audioService.playClick);
        setIsAdPlaying(true);
    };

    const handleAdComplete = async () => {
        setIsAdPlaying(false);
        playSound(audioService.playSuccess);
        // FIX: `addCredits` is now async
        await addCredits(AD_REWARD);
    };

    if (isAdPlaying) {
        return <AdPlayer onComplete={handleAdComplete} />;
    }

    return (
        <PageWrapper>
            <PageHeader title="Credit Center" onBack={onClose} />
            <main id="main-content" className="w-full max-w-2xl flex-grow overflow-y-auto px-2 pb-8 space-y-6">
                
                <Section 
                    title="Daily Reward" 
                    description="Claim your free credits once every day to fuel your creativity!"
                    icon={<GiftIcon className="w-full h-full" />}
                >
                    <button
                        onClick={handleClaimDaily}
                        disabled={!canClaimDaily}
                        className="w-full mt-2 p-3 bg-brand-lime text-black border-4 border-brand-light shadow-pixel text-base font-press-start transition-all hover:bg-brand-yellow active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {canClaimDaily ? `Claim ${DAILY_REWARD} Credits` : `Available in ${timeLeft}`}
                    </button>
                </Section>
                
                <Section 
                    title="Watch an Ad"
                    description="Watch a short (simulated) ad to earn a big credit bonus. A quick and easy way to top up!"
                    icon={<VideoEditorIcon className="w-full h-full" />}
                >
                     <button
                        onClick={handleWatchAd}
                        className="w-full mt-2 p-3 bg-brand-cyan text-black border-4 border-brand-light shadow-pixel text-base font-press-start transition-all hover:bg-brand-yellow active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px]"
                    >
                        Watch Ad (+{AD_REWARD} Credits)
                    </button>
                </Section>

                <div className="w-full bg-surface-primary p-4 border-4 border-border-secondary shadow-pixel space-y-3 text-center">
                    <h3 className="font-press-start text-lg text-brand-cyan">Spinning Wheel</h3>
                    <p className="font-sans text-xs text-text-secondary">Feeling lucky? Spend {CREDIT_COSTS.SPIN_WHEEL} credits for a chance to win a big prize!</p>
                    <div className="mt-4 flex justify-center">
                       <SpinningWheel />
                    </div>
                </div>

            </main>
        </PageWrapper>
    );
};