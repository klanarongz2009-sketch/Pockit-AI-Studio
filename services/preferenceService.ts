import type { Song } from './geminiService';

const PREFERENCES_KEY = 'app-preferences-v1';

// --- New Types for persistent state ---
export type ModelVersion = 'v1' | 'v1.5' | 'v2.0-beta';

export interface HistoryItem {
    id: string;
    text: string;
    song: Song;
    timestamp: number;
    modelVersion: ModelVersion;
}

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
    language: 'th' | 'en';
    uiAnimations: boolean;
    highContrastMode: boolean;
    showTooltips: boolean;
    chatFontSize: 'small' | 'medium' | 'large';

    // Creation
    imageGeneratorMode: 'image' | 'gif' | 'video' | 'spritesheet';
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
    
    // Credits & Data
    confirmCreditSpend: boolean;
    lowCreditWarningThreshold: number;

    // --- New & Updated ---
    textToSpeechVoiceName: 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir';

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

// Function to get all preferences from localStorage
function getAllPreferences(): Partial<Preferences> {
    try {
        const storedPrefs = localStorage.getItem(PREFERENCES_KEY);
        if (storedPrefs) {
            return JSON.parse(storedPrefs);
        }
    } catch (error) {
        console.error("Failed to read preferences from localStorage:", error);
    }
    return {};
}

// Function to save all preferences to localStorage
function saveAllPreferences(prefs: Partial<Preferences>): void {
    try {
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
    } catch (error) {
        console.error("Failed to save preferences to localStorage:", error);
    }
}


/**
 * Gets a specific preference value from the in-memory store.
 * @param key The key of the preference to retrieve.
 * @param defaultValue The value to return if the key is not found.
 * @returns The stored preference value or the default value.
 */
export function getPreference<K extends keyof Preferences>(key: K, defaultValue: Preferences[K]): Preferences[K] {
    const prefs = getAllPreferences();
    const storedValue = prefs[key];

    if (storedValue !== null && storedValue !== undefined) {
        return storedValue as Preferences[K];
    }
    return defaultValue;
}

/**
 * Sets a specific preference value in the in-memory store.
 * @param key The key of the preference to set.
 * @param value The value to store.
 */
export function setPreference<K extends keyof Preferences>(key: K, value: Preferences[K]): void {
    const prefs = getAllPreferences();
    prefs[key] = value;
    saveAllPreferences(prefs);
}