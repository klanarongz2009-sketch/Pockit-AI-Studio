import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useCredits } from '../contexts/CreditContext';
import * as audioService from '../services/audioService';
import { AD_REWARD_AMOUNT, DAILY_CREDIT_AMOUNT } from '../contexts/CreditContext';
import { AdPlayer } from './AdPlayer';

interface EarnCreditsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const REFILL_COOLDOWN_SECONDS = 3600; // 1 hour
const REFILL_AMOUNT = 100;
const REFILL_STORAGE_KEY = 'ai-studio-last-refill';

const QUICK_REFILL_COOLDOWN_SECONDS = 900; // 15 minutes
const QUICK_REFILL_AMOUNT = 25;
const QUICK_REFILL_STORAGE_KEY = 'ai-studio-last-quick-refill';

export const EarnCreditsModal: React.FC<EarnCreditsModalProps> = ({ isOpen, onClose }) => {
    const { addCredits, lastRefresh } = useCredits();
    const [isWatchingAd, setIsWatchingAd] = useState(false);
    const [refillCooldown, setRefillCooldown] = useState<number | null>(null);
    const [quickRefillCooldown, setQuickRefillCooldown] = useState<number | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        const checkCooldowns = () => {
            try {
                // Standard Refill
                const lastRefillTime = localStorage.getItem(REFILL_STORAGE_KEY);
                if (lastRefillTime) {
                    const timePassed = (Date.now() - parseInt(lastRefillTime, 10)) / 1000;
                    const timeRemaining = REFILL_COOLDOWN_SECONDS - timePassed;
                    if (timeRemaining > 0) {
                        setRefillCooldown(Math.ceil(timeRemaining));
                    } else {
                        setRefillCooldown(null);
                        localStorage.removeItem(REFILL_STORAGE_KEY);
                    }
                } else {
                    setRefillCooldown(null);
                }

                // Quick Refill
                const lastQuickRefillTime = localStorage.getItem(QUICK_REFILL_STORAGE_KEY);
                if (lastQuickRefillTime) {
                    const timePassed = (Date.now() - parseInt(lastQuickRefillTime, 10)) / 1000;
                    const timeRemaining = QUICK_REFILL_COOLDOWN_SECONDS - timePassed;
                    if (timeRemaining > 0) {
                        setQuickRefillCooldown(Math.ceil(timeRemaining));
                    } else {
                        setQuickRefillCooldown(null);
                        localStorage.removeItem(QUICK_REFILL_STORAGE_KEY);
                    }
                } else {
                    setQuickRefillCooldown(null);
                }
            } catch (e) {
                console.error("Failed to read refill cooldown from storage", e);
                setRefillCooldown(null);
                setQuickRefillCooldown(null);
            }
        };

        checkCooldowns();
        const interval = setInterval(checkCooldowns, 1000);

        return () => clearInterval(interval);

    }, [isOpen]);

    const handleWatchAd = () => {
        setIsWatchingAd(true);
    };
    
    const onAdComplete = () => {
        addCredits(AD_REWARD_AMOUNT);
        setIsWatchingAd(false);
        onClose();
    };


    const handleStandardRefill = () => {
        if (refillCooldown === null) {
            audioService.playCreditAdd();
            addCredits(REFILL_AMOUNT);
            try {
                localStorage.setItem(REFILL_STORAGE_KEY, String(Date.now()));
            } catch(e) {
                console.error("Failed to save refill time to storage", e);
            }
            setRefillCooldown(REFILL_COOLDOWN_SECONDS);
            onClose();
        }
    };

    const handleQuickRefill = () => {
        if (quickRefillCooldown === null) {
            audioService.playCreditAdd();
            addCredits(QUICK_REFILL_AMOUNT);
            try {
                localStorage.setItem(QUICK_REFILL_STORAGE_KEY, String(Date.now()));
            } catch(e) {
                console.error("Failed to save quick refill time to storage", e);
            }
            setQuickRefillCooldown(QUICK_REFILL_COOLDOWN_SECONDS);
            onClose();
        }
    };

    const formatCooldown = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `รออีก ${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const today = new Date().toDateString();
    
    if (isWatchingAd) {
        return <AdPlayer onComplete={onAdComplete} />;
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="รับเครดิตเพิ่ม">
            <div className="space-y-6 text-center font-sans">
                <>
                    <div>
                        <h3 className="font-press-start text-lg text-brand-yellow">ดูโฆษณาเพื่อรับเครดิต</h3>
                        <p className="mt-2 text-sm text-brand-light/80">
                            ดูโฆษณาสั้นๆ เพื่อรับ <strong className="text-brand-yellow">{AD_REWARD_AMOUNT} เครดิต</strong> ทันที!
                        </p>
                        <button
                            onClick={handleWatchAd}
                            className="w-full mt-4 p-4 bg-brand-lime text-black border-4 border-brand-light shadow-pixel text-base font-press-start transition-all hover:bg-brand-yellow active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px]"
                        >
                            ดูโฆษณา
                        </button>
                    </div>
                    
                    <div className="pt-6 border-t-2 border-brand-light/30">
                        <h3 className="font-press-start text-lg text-brand-lime">เติมเครดิตมาตรฐาน</h3>
                        <p className="mt-2 text-sm text-brand-light/80">
                            หากเครดิตใกล้หมด รับ <strong className="text-brand-lime">{REFILL_AMOUNT} เครดิต</strong> ฟรี! (รับได้ชั่วโมงละครั้ง)
                        </p>
                        <button
                            onClick={handleStandardRefill}
                            disabled={refillCooldown !== null}
                            className="w-full mt-4 p-4 bg-brand-lime text-black border-4 border-brand-light shadow-pixel text-base font-press-start transition-all hover:bg-brand-yellow active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            {refillCooldown !== null ? formatCooldown(refillCooldown) : 'รับเครดิต'}
                        </button>
                    </div>

                    <div className="pt-6 border-t-2 border-brand-light/30">
                        <h3 className="font-press-start text-lg text-brand-lime">เติมเครดิตด่วน</h3>
                        <p className="mt-2 text-sm text-brand-light/80">
                            เติมพลังด่วน! รับ <strong className="text-brand-lime">{QUICK_REFILL_AMOUNT} เครดิต</strong> (รับได้ทุก 15 นาที)
                        </p>
                        <button
                            onClick={handleQuickRefill}
                            disabled={quickRefillCooldown !== null}
                            className="w-full mt-4 p-4 bg-brand-lime text-black border-4 border-brand-light shadow-pixel text-base font-press-start transition-all hover:bg-brand-yellow active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            {quickRefillCooldown !== null ? formatCooldown(quickRefillCooldown) : 'รับเครดิตด่วน'}
                        </button>
                    </div>

                    <div className="pt-6 border-t-2 border-brand-light/30">
                        <h3 className="font-press-start text-lg text-brand-cyan">เครดิตรายวัน</h3>
                         {lastRefresh === today ? (
                            <p className="mt-2 text-sm text-brand-light/80">
                                คุณได้รับเครดิตรายวันสำหรับวันนี้แล้ว! กลับมาใหม่พรุ่งนี้เพื่อรับอีก <strong className="text-brand-cyan">{DAILY_CREDIT_AMOUNT} เครดิต</strong>
                            </p>
                        ) : (
                            <p className="mt-2 text-sm text-brand-light/80">
                                คุณจะได้รับ <strong className="text-brand-cyan">{DAILY_CREDIT_AMOUNT} เครดิต</strong> โดยอัตโนมัติในครั้งแรกที่เปิดแอปในแต่ละวัน
                            </p>
                        )}
                    </div>
                </>
            </div>
        </Modal>
    );
};