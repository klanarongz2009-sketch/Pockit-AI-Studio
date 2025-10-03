// Define the shape of our preferences object
export interface Preferences {
    // Sound
    isSoundOn: boolean;
    uiSoundVolume: number;
    notificationSound: boolean;
    autoPlaySounds: boolean;

    // Display & Accessibility
    theme: 'light' | 'dark' | 'system';
    // FIX: Added 'fr' to support French language selection and resolve type mismatch.
    language: 'th' | 'en' | 'ja' | 'fr';
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

    // --- Deprecated or Unused in Settings UI, but kept for compatibility ---
    musicVolume: number;
    ticTacToeGameMode: 'ai' | 'player';
    ticTacToeDifficulty: 'easy' | 'hard';
    voiceChangerEffect: string;
    videoEditorSubtitleLang: string;
    videoEditorAutoDetectLang: boolean;
    textToSpeechVoiceURI: string;
    textToSpeechPitch: number;
    textToSpeechRate: number;
    textToSpeechAutoDetectLang: boolean;
}

// In-memory store for preferences. This will be reset on every page load.
let inMemoryPreferences: Partial<Preferences> = {};

// Function to get all preferences from the in-memory store
function getAllPreferences(): Partial<Preferences> {
    return inMemoryPreferences;
}

// Function to save all preferences to the in-memory store
function saveAllPreferences(prefs: Partial<Preferences>): void {
    inMemoryPreferences = prefs;
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
