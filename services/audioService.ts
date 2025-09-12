export type SoundType = 'sine' | 'square' | 'sawtooth' | 'triangle';

let audioContext: AudioContext | null = null;
let isInitialized = false;

// NEW: Store preloaded raw data and decoded buffers
const preloadedAudioData = new Map<string, ArrayBuffer>();
const decodedAudioBuffers = new Map<string, AudioBuffer>();

// Module-level state for background music
let musicSource: AudioBufferSourceNode | null = null;
let musicGain: GainNode | null = null;
let desiredMusicVolume = 0.1; // Store the desired volume

export const NOTE_FREQUENCIES: { [key: string]: number } = {
  'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
  'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51, 'F6': 1396.91, 'F#6': 1479.98, 'G6': 1567.98, 'G#6': 1661.22, 'A6': 1760.00, 'A#6': 1864.66, 'B6': 1975.53,
  'C7': 2093.00, 'C#7': 2217.46, 'D7': 2349.32, 'D#7': 2489.02, 'E7': 2637.02, 'F7': 2793.83, 'F#7': 2959.96, 'G7': 3135.96, 'G#7': 3322.44, 'A7': 3520.00, 'A#7': 3729.31, 'B7': 3951.07,
};

// NEW: Function for asset loader to call
export function addPreloadedAudio(name: string, data: ArrayBuffer) {
    preloadedAudioData.set(name, data);
}

export function initAudio() {
    if (isInitialized || typeof window === 'undefined') return;
    
    try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        isInitialized = true;

        // Decode all preloaded audio data
        preloadedAudioData.forEach(async (data, name) => {
            if (audioContext) {
                try {
                    // Use slice to create a copy, preventing the buffer from being detached
                    const decodedBuffer = await audioContext.decodeAudioData(data.slice(0));
                    decodedAudioBuffers.set(name, decodedBuffer);
                    console.log(`Successfully decoded audio: ${name}`);
                } catch (e) {
                    console.error(`Error decoding preloaded audio '${name}':`, e);
                }
            }
        });

        if (audioContext.state === 'suspended') {
            audioContext.resume().catch(e => {
                console.error("Error resuming AudioContext:", e);
                isInitialized = false;
                audioContext = null;
            });
        }
    } catch (e) {
        console.error("Web Audio API is not supported or could not be initialized:", e);
        isInitialized = false;
        audioContext = null;
    }
}

function playSoundInternal(type: SoundType, startFreq: number, endFreq: number, duration: number, volume: number = 0.3) {
    if (!audioContext || audioContext.state !== 'running') return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = type;
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
    
    oscillator.frequency.setValueAtTime(startFreq, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(endFreq, audioContext.currentTime + duration);
    
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

export const playHover = () => playSoundInternal('square', 800, 800, 0.05, 0.1);
export const playClick = () => playSoundInternal('square', 600, 1200, 0.08, 0.2);
export const playToggle = () => playSoundInternal('triangle', 300, 200, 0.1, 0.2);
export const playCloseModal = () => playSoundInternal('sawtooth', 500, 200, 0.15, 0.2);
export const playGenerate = () => playSoundInternal('sine', 200, 800, 0.3, 0.3);
export const playSuccess = () => playSoundInternal('sine', 523.25, 1046.50, 0.3, 0.3);
export const playError = () => playSoundInternal('sawtooth', 400, 100, 0.4, 0.2);
export const playSwoosh = () => playSoundInternal('sine', 1500, 500, 0.2, 0.2);
export const playSelection = () => playSoundInternal('triangle', 440, 660, 0.1, 0.2);
export const playCameraShutter = () => playSoundInternal('square', 1200, 300, 0.1, 0.3);
export const playDownload = () => playSoundInternal('sine', 880, 440, 0.3, 0.3);
export const playSliderChange = () => playSoundInternal('sine', 1000, 1000, 0.03, 0.05);
export const playScore = () => playSoundInternal('sine', 880, 1760, 0.1, 0.2);
export const playPlayerHit = () => playSoundInternal('square', 200, 50, 0.2, 0.4);
export const playGameOver = () => playSoundInternal('sawtooth', 300, 50, 0.8, 0.3);
export const playTrash = () => playSoundInternal('square', 200, 100, 0.15, 0.2);
export const playCreditAdd = () => playSoundInternal('sine', 1046.50, 1567.98, 0.2, 0.3);
export const playCreditSpend = () => playSoundInternal('square', 200, 100, 0.15, 0.2);
export const playIntro1 = () => playSoundInternal('sine', 440, 660, 0.3, 0.3);
export const playIntro2 = () => playSoundInternal('sine', 550, 770, 0.3, 0.3);
export const playIntro3 = () => playSoundInternal('sine', 660, 880, 0.4, 0.3);
export const playBrickHit = () => playSoundInternal('square', 800, 1000, 0.05, 0.2);
export const playPaddleHit = () => playSoundInternal('square', 400, 400, 0.05, 0.2);
export const playWallHit = () => playSoundInternal('sine', 200, 200, 0.05, 0.1);
export const playMiss = () => playSoundInternal('sawtooth', 200, 100, 0.3, 0.3);

export const playMusicalNote = (frequency: number, type: SoundType, duration: number) => {
    playSoundInternal(type, frequency, frequency, duration, 0.3);
};

export const startBackgroundMusic = () => { 
    if (!audioContext || musicSource || audioContext.state !== 'running') return;

    const buffer = decodedAudioBuffers.get('backgroundMusic');
    if (!buffer) {
        console.warn("Background music is not ready to play yet.");
        // Attempt to play later if the buffer loads after this call
        setTimeout(startBackgroundMusic, 1000);
        return;
    }

    musicSource = audioContext.createBufferSource();
    musicSource.buffer = buffer;
    musicSource.loop = true;

    musicGain = audioContext.createGain();
    musicGain.gain.value = 0; // Start silent for fade-in
    
    musicSource.connect(musicGain);
    musicGain.connect(audioContext.destination);
    musicSource.start(0);

    // Fade in
    musicGain.gain.linearRampToValueAtTime(desiredMusicVolume, audioContext.currentTime + 2.0);
};
export const setMusicVolume = (volume: number) => { 
    desiredMusicVolume = volume;
    if (musicGain && audioContext && audioContext.state === 'running') {
        // Use a ramp for smooth volume changes
        musicGain.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.5);
    }
};
