import * as audioService from './audioService';

// The asset files listed here were missing, causing 404 errors.
// They have been removed to fix the application.
// The audio service has been updated to use synthesized sounds as fallbacks.
export const IMAGE_ASSETS: { [key: string]: string } = {};

export const AUDIO_ASSETS: { [key: string]: string } = {};

export const UI_SOUNDS: { [key: string]: string } = {};


async function preloadImages(): Promise<void> {
    const promises = Object.values(IMAGE_ASSETS).map(src => {
        return new Promise<void>((resolve) => {
            const img = new Image();
            img.src = src;
            img.onload = () => resolve();
            img.onerror = () => {
                console.warn(`Failed to preload image: ${src}`);
                resolve(); // Don't reject for a single failed asset
            };
        });
    });
    await Promise.all(promises);
}

async function preloadAudio(): Promise<void> {
    const promises = Object.entries(AUDIO_ASSETS).map(async ([name, url]) => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            audioService.addPreloadedAudio(name, arrayBuffer);
        } catch (e) {
            console.warn(`Failed to preload audio: ${url}`, e);
        }
    });
    await Promise.all(promises);
}

async function preloadUiSounds(): Promise<void> {
    const promises = Object.entries(UI_SOUNDS).map(async ([name, url]) => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            audioService.addPreloadedAudio(name, arrayBuffer);
        } catch (e) {
            console.warn(`Failed to preload UI sound: ${url}`, e);
        }
    });
    await Promise.all(promises);
}

let preloadingPromise: Promise<void> | null = null;

export function preloadAllAssets(): Promise<void> {
    if (!preloadingPromise) {
        console.log("Starting asset preloading...");
        preloadingPromise = Promise.all([preloadImages(), preloadAudio(), preloadUiSounds()]).then(() => {
            console.log("Asset preloading complete.");
        });
    }
    return preloadingPromise;
}