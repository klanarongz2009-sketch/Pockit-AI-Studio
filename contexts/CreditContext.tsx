import React, { createContext, useState, useEffect, useCallback, useContext, ReactNode } from 'react';
import * as audioService from '../services/audioService';

const CREDITS_STORAGE_KEY = 'ai-studio-credits';
const LAST_REFRESH_STORAGE_KEY = 'ai-studio-last-refresh';

export const CREDIT_COSTS = {
  IMAGE_GENERATION: 10,
  // GIF is dynamic: frameCount * 2
  // Video is dynamic: prompt.length
  SPRITESHEET_GENERATION: 300,
  PROMPT_SUGGESTION: 2,
  SONG_V1: 0,
  // Song V1.5 is dynamic: 1 per note
  SONG_V2_BETA: 10,
  VIDEO_SUBTITLES: 20,
  VOICE_EFFECT_AI: 10,
  SOUND_EFFECT_IDEAS: 5,
  CHAT_MESSAGE: 1,
  FEEDBACK_ANALYSIS: 2,
  TICTACTOE_AI_MOVE: 1,
  MINIGAME_ASSET: 10, 
  AI_ORACLE: 5,
  PLATFORMER_CONTINUE: 5,
};


export const DAILY_CREDIT_AMOUNT = 250;
const INITIAL_CREDITS = 500;

interface CreditContextType {
    credits: number;
    loading: boolean;
    spendCredits: (amount: number) => boolean;
    addCredits: (amount: number) => void;
    lastRefresh: string | null;
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

export const CreditProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [credits, setCredits] = useState(0);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<string | null>(null);

    useEffect(() => {
        try {
            const storedCredits = localStorage.getItem(CREDITS_STORAGE_KEY);
            const storedLastRefresh = localStorage.getItem(LAST_REFRESH_STORAGE_KEY);
            const today = new Date().toDateString();

            setLastRefresh(storedLastRefresh);

            if (storedCredits === null) {
                // First time user
                setCredits(INITIAL_CREDITS);
                localStorage.setItem(CREDITS_STORAGE_KEY, String(INITIAL_CREDITS));
                localStorage.setItem(LAST_REFRESH_STORAGE_KEY, today);
                setLastRefresh(today);
            } else {
                let currentCredits = parseFloat(storedCredits);
                if (isNaN(currentCredits)) {
                    currentCredits = INITIAL_CREDITS;
                }
                // Daily refresh logic
                if (storedLastRefresh !== today) {
                    currentCredits += DAILY_CREDIT_AMOUNT;
                    setLastRefresh(today);
                    localStorage.setItem(LAST_REFRESH_STORAGE_KEY, today);
                }
                setCredits(Math.floor(currentCredits));
                 localStorage.setItem(CREDITS_STORAGE_KEY, String(Math.floor(currentCredits)));
            }
        } catch (error) {
            console.error("Failed to initialize credits from localStorage:", error);
            setCredits(INITIAL_CREDITS); // Fallback
        } finally {
            setLoading(false);
        }
    }, []);

    const updateCredits = (newCreditValue: number) => {
        const intValue = Math.floor(newCreditValue);
        setCredits(intValue);
        try {
            localStorage.setItem(CREDITS_STORAGE_KEY, String(intValue));
        } catch (error) {
            console.error("Failed to save credits to localStorage:", error);
        }
    };

    const spendCredits = useCallback((amount: number): boolean => {
        const hasEnough = credits >= amount;
        if (hasEnough) {
            updateCredits(credits - amount);
            if (amount > 0) {
                audioService.playCreditSpend();
            }
        }
        return hasEnough;
    }, [credits]);

    const addCredits = useCallback((amount: number) => {
        setCredits(prevCredits => {
            const newTotal = Math.floor(prevCredits + amount);
            try {
                localStorage.setItem(CREDITS_STORAGE_KEY, String(newTotal));
                if (amount > 0) {
                    audioService.playCreditAdd();
                }
            } catch (error) {
                 console.error("Failed to save credits to localStorage:", error);
            }
            return newTotal;
        });
    }, []);

    const value = { credits, loading, spendCredits, addCredits, lastRefresh };

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