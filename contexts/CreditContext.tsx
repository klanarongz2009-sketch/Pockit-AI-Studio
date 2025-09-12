import React, { createContext, useContext, useState, useEffect, useCallback, FC, ReactNode } from 'react';
import * as audioService from '../services/audioService';
import * as preferenceService from '../services/preferenceService';

export const CREDIT_COSTS = {
  IMAGE_GENERATION: 10,
  SPRITESHEET_GENERATION: 300,
  PROMPT_SUGGESTION: 2,
  SONG_V1: 0,
  SONG_V2_BETA: 10,
  SONG_SEARCH: 15,
  VIDEO_SUBTITLES: 20,
  VOICE_EFFECT_AI: 10,
  SOUND_EFFECT_IDEAS: 5,
  IMAGE_TO_SOUND: 8,
  CHAT_MESSAGE: 1,
  FEEDBACK_ANALYSIS: 2,
  TICTACTOE_AI_MOVE: 1,
  MINIGAME_ASSET: 10, 
  PLATFORMER_CONTINUE: 5,
  AUDIO_TO_MIDI: 20,
  AI_ORACLE: 5,
};

export const DAILY_CREDIT_AMOUNT = 250;
const INITIAL_CREDITS = 500;
const CREDITS_STORAGE_KEY = 'ai-studio-credits';
const LAST_REFRESH_STORAGE_KEY = 'ai-studio-last-refresh';

interface CreditContextType {
    credits: number;
    loading: boolean;
    lastRefresh: string | null;
    spendCredits: (amount: number) => boolean;
    addCredits: (amount: number) => void;
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

export const CreditProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [credits, setCredits] = useState(0);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<string | null>(null);

    const updateCredits = useCallback((newCreditValue: number) => {
        const intValue = Math.floor(newCreditValue);
        setCredits(intValue);
        try {
            localStorage.setItem(CREDITS_STORAGE_KEY, String(intValue));
        } catch (error) {
            console.error("Failed to save credits to localStorage:", error);
        }
    }, []);

    useEffect(() => {
        try {
            const storedCredits = localStorage.getItem(CREDITS_STORAGE_KEY);
            const storedLastRefresh = localStorage.getItem(LAST_REFRESH_STORAGE_KEY);
            const today = new Date().toDateString();

            setLastRefresh(storedLastRefresh);

            let currentCreditsValue: number;

            if (storedCredits === null) {
                currentCreditsValue = INITIAL_CREDITS;
                localStorage.setItem(LAST_REFRESH_STORAGE_KEY, today);
                setLastRefresh(today);
            } else {
                currentCreditsValue = parseFloat(storedCredits);
                if (isNaN(currentCreditsValue)) {
                    currentCreditsValue = INITIAL_CREDITS;
                }
                if (storedLastRefresh !== today) {
                    currentCreditsValue += DAILY_CREDIT_AMOUNT;
                    setLastRefresh(today);
                    localStorage.setItem(LAST_REFRESH_STORAGE_KEY, today);
                }
            }
            updateCredits(Math.floor(currentCreditsValue));
        } catch (error) {
            console.error("Failed to initialize credits from localStorage:", error);
            updateCredits(INITIAL_CREDITS);
        } finally {
            setLoading(false);
        }
    }, [updateCredits]);

    const spendCredits = useCallback((amount: number): boolean => {
        if (amount > 0 && preferenceService.getPreference('confirmCreditSpend', false)) {
            if (!window.confirm(`การกระทำนี้จะใช้ ${amount} เครดิต คุณต้องการดำเนินการต่อหรือไม่?`)) {
                return false;
            }
        }

        const hasEnough = credits >= amount;
        if (hasEnough) {
            updateCredits(credits - amount);
            if (amount > 0) {
                audioService.playCreditSpend();
            }
        }
        return hasEnough;
    }, [credits, updateCredits]);

    const addCredits = useCallback((amount: number): void => {
        setCredits(prev => {
            const newTotal = Math.floor(prev + amount);
            updateCredits(newTotal);
            if (amount > 0) {
                audioService.playCreditAdd();
            }
            return newTotal;
        });
    }, [updateCredits]);

    const value = { credits, loading, lastRefresh, spendCredits, addCredits };

    return (
        <CreditContext.Provider value={value}>
            {children}
        </CreditContext.Provider>
    );
};

export const useCredits = (): CreditContextType => {
    const context = useContext(CreditContext);
    if (context === undefined) {
        throw new Error('useCredits must be used within a CreditProvider');
    }
    return context;
};