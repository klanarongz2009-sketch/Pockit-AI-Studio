// Define the shape of our preferences object
export interface Preferences {
    // Sound
    isSoundOn: boolean;
    uiSoundVolume: number;
    notificationSound: boolean;
    autoPlaySounds: boolean;

    // Display & Accessibility
    theme: 'light' | 'dark' | 'system';
    language: 'th' | 'en' | 'ja';
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

const PREFERENCES_STORAGE_KEY = 'ai-studio-user-preferences';

// Function to get all preferences from localStorage
function getAllPreferences(): Partial<Preferences> {
    try {
        const storedPreferences = localStorage.getItem(PREFERENCES_STORAGE_KEY);
        if (storedPreferences) {
            return JSON.parse(storedPreferences);
        }
    } catch (error) {
        console.error("Failed to parse user preferences from localStorage:", error);
        // If parsing fails, it's safer to start fresh
        localStorage.removeItem(PREFERENCES_STORAGE_KEY);
    }
    return {};
}

// Function to save all preferences to localStorage
function saveAllPreferences(prefs: Partial<Preferences>): void {
    try {
        localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(prefs));
    } catch (error) {
        console.error("Failed to save user preferences to localStorage:", error);
    }
}

/**
 * Gets a specific preference value from localStorage.
 * @param key The key of the preference to retrieve.
 * @param defaultValue The value to return if the key is not found.
 * @returns The stored preference value or the default value.
 */
export function getPreference<K extends keyof Preferences>(key: K, defaultValue: Preferences[K]): Preferences[K] {
    const prefs = getAllPreferences();
    const storedValue = prefs[key];

    // FIX: Add explicit check for null/undefined and a type assertion.
    // TypeScript has limitations inferring narrowed types from indexed access on generic objects.
    // The previous `if (storedValue)` check was buggy for falsy values like `false` or `0`.
    if (storedValue !== null && storedValue !== undefined) {
        return storedValue as Preferences[K];
    }
    return defaultValue;
}

/**
 * Sets a specific preference value in localStorage.
 * @param key The key of the preference to set.
 * @param value The value to store.
 */
export function setPreference<K extends keyof Preferences>(key: K, value: Preferences[K]): void {
    const prefs = getAllPreferences();
    prefs[key] = value;
    saveAllPreferences(prefs);
}