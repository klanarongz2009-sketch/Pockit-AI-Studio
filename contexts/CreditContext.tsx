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
  SPIN_WHEEL: 5,
  APP_PUBLISHER: 20,
};

const INITIAL_CREDITS = 500;

interface CreditContextType {
    credits: number;
    loading: boolean;
    lastRefresh: string | null;
    spendCredits: (amount: number) => boolean;
    addCredits: (amount: number) => void;
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

export const CreditProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [credits, setCredits] = useState(() => {
        const savedCredits = preferenceService.getPreference('credits', null);
        return savedCredits === null ? INITIAL_CREDITS : savedCredits;
    });
    const [loading, setLoading] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<string | null>(new Date().toDateString());
    
    // One-time setup: if 'credits' is not in storage, set it.
    useEffect(() => {
        if (preferenceService.getPreference('credits', null) === null) {
            preferenceService.setPreference('credits', INITIAL_CREDITS);
        }
    }, []);

    const spendCredits = useCallback((amount: number): boolean => {
        if (amount > 0 && preferenceService.getPreference('confirmCreditSpend', false)) {
            if (!window.confirm(`การกระทำนี้จะใช้ ${amount} เครดิต คุณต้องการดำเนินการต่อหรือไม่?`)) {
                return false;
            }
        }
        
        if (credits < amount) {
            return false;
        }

        const newCredits = credits - amount;
        setCredits(newCredits);
        preferenceService.setPreference('credits', newCredits);
        if (amount > 0) {
            audioService.playCreditSpend();
        }
        return true;
    }, [credits]);

    const addCredits = useCallback((amount: number): void => {
        const newCredits = Math.floor(credits + amount);
        setCredits(newCredits);
        preferenceService.setPreference('credits', newCredits);
        if (amount > 0) {
            audioService.playCreditAdd();
        }
    }, [credits]);

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