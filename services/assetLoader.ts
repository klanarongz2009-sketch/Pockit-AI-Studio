
import * as audioService from './audioService';

export const IMAGE_ASSETS = {
  defaultPlayer: '/assets/images/default_player.png',
  defaultObstacle: '/assets/images/default_obstacle.png',
};

export const AUDIO_ASSETS = {
  backgroundMusic: '/assets/music/bgm.mp3',
};

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

let preloadingPromise: Promise<void> | null = null;

export function preloadAllAssets(): Promise<void> {
    if (!preloadingPromise) {
        console.log("Starting asset preloading...");
        preloadingPromise = Promise.all([preloadImages(), preloadAudio()]).then(() => {
            console.log("Asset preloading complete.");
        });
    }
    return preloadingPromise;
}
