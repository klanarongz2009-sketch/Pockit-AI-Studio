import type { Song } from './geminiService';
import * as cloudService from './cloudService';

const PREFERENCES_KEY = 'app-preferences-v1'; // This key is now obsolete but kept for reference

// --- New Types for persistent state ---
export type ModelVersion = 'v1' | 'v1.5' | 'v2.0-beta';

export interface HistoryItem {
    id: string;
    text: string;
    song: Song;
    timestamp: number;
    modelVersion: ModelVersion;
}

// FIX: Moved the Message interface here to be globally accessible and prevent cascading type errors.
export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: { uri: string; title:string }[];
}


// Define the shape of our preferences object
export interface Preferences {
    // Sound
    isSoundOn: boolean;
    uiSoundVolume: number;
    notificationSound: boolean;
    autoPlaySounds: boolean;

    // Display & Accessibility
    theme: 'light' | 'dark' | 'system';
    language: 'th' | 'en' | 'auto'; // Added 'auto' for initial detection
    uiAnimations: boolean;
    highContrastMode: boolean;
    showTooltips: boolean;
    chatFontSize: 'small' | 'medium' | 'large';

    // Creation
    imageGeneratorMode: 'image' | 'gif' | 'video' | 'spritesheet';
    imageGeneratorEngine: 'gemini' | 'huggingface';
    imageGeneratorFps: number;
    imageGeneratorFrameCount: number;
    imageGenerationQuality: 'fast' | 'quality';
    defaultImageAspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    autoSaveToGallery: boolean;
    textToSongModel: 'v1' | 'v1.5' | 'v2.0-beta';
    
    // AI Chat
    defaultChatModelName: string;
    saveChatHistory: boolean;
    defaultWebSearch: boolean;
    streamChatResponse: boolean; // Mock for now

    // Minigames
    defaultMinigameDifficulty: 'easy' | 'normal' | 'hard';
    // FIX: Add missing preference for asteroid shooter high score.
    asteroidShooterHighScore: number;
    
    // Credits & Data
    confirmCreditSpend: boolean;
    lowCreditWarningThreshold: number;

    // --- New & Updated ---
    textToSpeechVoiceName: 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir';
    lastDailyRewardClaim: number;

    // --- Persisted State ---
    credits: number;
    songHistory: HistoryItem[];
    chatHistory: { [modelId: string]: Message[] };

    // --- Deprecated or Unused in Settings UI, but kept for compatibility ---
    musicVolume: number;
    ticTacToeGameMode: 'ai' | 'player';
    ticTacToeDifficulty: 'easy' | 'hard';
    voiceChangerEffect: string;
    videoEditorSubtitleLang: string;
    videoEditorAutoDetectLang: boolean;
    textToSpeechAutoDetectLang: boolean;
}

/**
 * Gets a specific preference value from the cloud store.
 * @param key The key of the preference to retrieve.
 * @param defaultValue The value to return if the key is not found.
 * @returns A promise that resolves to the stored preference value or the default value.
 */
// FIX: `getPreference` is now async to simulate cloud storage.
export async function getPreference<K extends keyof Preferences>(key: K, defaultValue: Preferences[K]): Promise<Preferences[K]> {
    const value = await cloudService.getCloudData(key as string);
    if (value !== null && value !== undefined) {
        return value as Preferences[K];
    }
    return defaultValue;
}

/**
 * Sets a specific preference value in the cloud store.
 * @param key The key of the preference to set.
 * @param value The value to store.
 */
// FIX: `setPreference` is now async to simulate cloud storage.
export async function setPreference<K extends keyof Preferences>(key: K, value: Preferences[K]): Promise<void> {
    await cloudService.setCloudData(key as string, value);
}

/**
 * Clears all user preferences and data from the cloud store.
 */
export async function clearAllPreferences(): Promise<void> {
    await cloudService.clearAllCloudData();
}