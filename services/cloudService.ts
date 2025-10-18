
// This service simulates a cloud backend.
// In a real application, this would be replaced with actual API calls to a cloud database (e.g., Firestore, DynamoDB).
// For this simulation, we use localStorage as the persistent backend and introduce async latency.

const CLOUD_STORAGE_KEY = '__AI_APP_CLOUD_SIMULATION__';
const SIMULATED_LATENCY_MS = 120;

let cloudStore: { [key: string]: any } = {};
let isInitialized = false;

// Load the entire "cloud" database from localStorage into memory once.
const initializeStore = () => {
    if (isInitialized) return;
    try {
        const storedData = localStorage.getItem(CLOUD_STORAGE_KEY);
        if (storedData) {
            cloudStore = JSON.parse(storedData);
        }
    } catch (e) {
        console.error("Failed to initialize simulated cloud store from localStorage", e);
        cloudStore = {};
    }
    isInitialized = true;
};

// Persist the entire in-memory store back to localStorage.
const persistStore = () => {
    try {
        localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify(cloudStore));
    } catch (e) {
        console.error("Failed to persist simulated cloud store to localStorage", e);
    }
};

// Initialize on module load.
initializeStore();

/**
 * Simulates fetching a specific key from the cloud data store.
 * @param key The key to retrieve.
 * @returns A promise that resolves with the value.
 */
export const getCloudData = async (key: string): Promise<any> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(cloudStore[key]);
        }, SIMULATED_LATENCY_MS);
    });
};

/**
 * Simulates setting a specific key-value pair in the cloud data store.
 * @param key The key to set.
 * @param value The value to store.
 */
export const setCloudData = async (key: string, value: any): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            cloudStore[key] = value;
            persistStore();
            resolve();
        }, SIMULATED_LATENCY_MS);
    });
};

/**
 * Simulates clearing all data from the cloud, e.g., on a user reset.
 */
export const clearAllCloudData = async (): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            cloudStore = {};
            persistStore();
            resolve();
        }, SIMULATED_LATENCY_MS);
    });
};
