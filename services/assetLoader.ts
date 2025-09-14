import * as audioService from './audioService';

export const IMAGE_ASSETS = {
  defaultPlayer: '/assets/images/default_player.png',
  defaultObstacle: '/assets/images/default_obstacle.png',
};

export const AUDIO_ASSETS = {
  backgroundMusic: '/assets/music/bgm_new.mp3',
};

export const UI_SOUNDS = {
  click: '/assets/audio/click.mp3',
  toggle: '/assets/audio/toggle.mp3',
  generate: '/assets/audio/generate.mp3',
  success: '/assets/audio/success.mp3',
  error: '/assets/audio/error.mp3',
  swoosh: '/assets/audio/swoosh.mp3',
  notification: '/assets/audio/notification.mp3',
  trash: '/assets/audio/trash.mp3',
  credit: '/assets/audio/credit.mp3',
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