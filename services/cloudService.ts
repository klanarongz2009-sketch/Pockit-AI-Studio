// This service simulates a cloud backend by using localStorage for persistence.

const PREFERENCES_KEY = 'app-preferences-v3';

// Helper to load the entire store from localStorage
const loadStore = (): { [key: string]: any } => {
    try {
        const storedData = localStorage.getItem(PREFERENCES_KEY);
        if (storedData) {
            return JSON.parse(storedData);
        }
    } catch (e) {
        console.error("Failed to parse preferences from localStorage:", e);
    }
    return {};
};

// Helper to save the entire store to localStorage
const saveStore = (store: { [key: string]: any }): void => {
    try {
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(store));
    } catch (e) {
        console.error("Failed to save preferences to localStorage:", e);
    }
};

/**
 * Gets a specific preference value from localStorage.
 * @param key The key to retrieve.
 * @returns A promise that resolves with the value.
 */
export const getCloudData = async (key: string): Promise<any> => {
    // Simulate async operation, though localStorage is sync
    return new Promise(resolve => {
        const store = loadStore();
        resolve(store[key]);
    });
};

/**
 * Sets a specific key-value pair in localStorage.
 * @param key The key to set.
 * @param value The value to store.
 */
export const setCloudData = async (key: string, value: any): Promise<void> => {
    return new Promise(resolve => {
        const store = loadStore();
        store[key] = value;
        saveStore(store);
        resolve();
    });
};

/**
 * Clears all data from localStorage.
 */
export const clearAllCloudData = async (): Promise<void> => {
    return new Promise(resolve => {
        try {
            localStorage.removeItem(PREFERENCES_KEY);
        } catch (e) {
            console.error("Failed to clear preferences from localStorage:", e);
        }
        resolve();
    });
};
