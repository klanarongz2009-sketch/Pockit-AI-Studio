import type { CurrentPage } from '../App';
import type { Song, MidiNote } from './geminiService';
import type { SoundEffectParameters } from './geminiService';

export type SoundType = 'sine' | 'square' | 'sawtooth' | 'triangle' | 'noise';

let audioContext: AudioContext | null = null;
let isInitialized = false;

// NEW: Centralized audio nodes for effects and analysis
let masterGain: GainNode | null = null;
let songGain: GainNode | null = null;
let analyser: AnalyserNode | null = null;

const preloadedAudioData = new Map<string, ArrayBuffer>();
const decodedAudioBuffers = new Map<string, AudioBuffer>();

let musicGain: GainNode | null = null;
let desiredMusicVolume = 0.1; 
let whiteNoiseBuffer: AudioBuffer | null = null;


export interface EffectParameters {
  pitchShift?: number;
  delayTime?: number;
  delayFeedback?: number;
  radioFrequency?: number;
  clarityLevel?: number;
  bitCrushLevel?: number;
  sampleRateCrushLevel?: number;
  humFrequency?: number;
  bassBoostLevel?: number;
  vibratoDepth?: number;
  chorusDepth?: number;
  reverbRoomSize?: number;
  reverbWet?: number;
  lofiVintage?: number;
  remasterIntensity?: number;
}

export interface ComposedSong {
    tracks: {
        instrument: SoundType;
        notes: (string | null)[];
    }[];
    bpm: number;
}

export interface LocalAnalysisResult {
    duration: number;
    peakLoudness: number; // dB
    averageLoudness: number; // dB
    dominantFrequency: number; // Hz
    estimatedBpm: number;
    estimatedPitch: string;
    harmonicRichness: number; // Percentage
}


export const NOTE_FREQUENCIES: { [key: string]: number } = {
  'C0': 16.35, 'C#0': 17.32, 'D0': 18.35, 'D#0': 19.45, 'E0': 20.60, 'F0': 21.83, 'F#0': 23.12, 'G0': 24.50, 'G#0': 25.96, 'A0': 27.50, 'A#0': 29.14, 'B0': 30.87,
  'C1': 32.70, 'C#1': 34.65, 'D1': 36.71, 'D#1': 38.89, 'E1': 41.20, 'F1': 43.65, 'F#1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'A1': 55.00, 'A#1': 58.27, 'B1': 61.74,
  'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
  'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51, 'F6': 1396.91, 'F#6': 1479.98, 'G6': 1567.98, 'G#6': 1661.22, 'A6': 1760.00, 'A#6': 1864.66, 'B6': 1975.53,
  'C7': 2093.00, 'C#7': 2217.46, 'D7': 2349.32, 'D#7': 2489.02, 'E7': 2637.02, 'F7': 2793.83, 'F#7': 2959.96, 'G7': 3135.96, 'G#7': 3322.44, 'A7': 3520.00, 'A#7': 3729.31, 'B7': 3951.07,
  'C8': 4186.01, 'C#8': 4434.92, 'D8': 4698.63, 'D#8': 4978.03, 'E8': 5274.04, 'F8': 5587.65, 'F#8': 5919.91, 'G8': 6271.93, 'G#8': 6644.88, 'A8': 7040.00, 'A#8': 7458.62, 'B8': 7902.13
};

export function addPreloadedAudio(name: string, data: ArrayBuffer) {
    preloadedAudioData.set(name, data);
}

export async function initAudio(): Promise<boolean> {
    if (isInitialized || typeof window === 'undefined') return true;

    try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // NEW: Create and connect main audio graph
        masterGain = audioContext.createGain();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256; // Good for visuals

        songGain = audioContext.createGain();
        songGain.connect(masterGain);

        masterGain.connect(analyser);
        analyser.connect(audioContext.destination);

        // Crucially, wait for resume if needed
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        // NEW: Create white noise buffer for percussion sounds
        const bufferSize = audioContext.sampleRate * 2; // 2 seconds of noise is plenty
        whiteNoiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = whiteNoiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const decodingPromises = Array.from(preloadedAudioData.entries()).map(async ([name, data]) => {
            if (audioContext) {
                try {
                    const decodedBuffer = await audioContext.decodeAudioData(data.slice(0));
                    decodedAudioBuffers.set(name, decodedBuffer);
                } catch (e) {
                    console.error(`Error decoding preloaded audio '${name}':`, e);
                }
            }
        });
        await Promise.all(decodingPromises);

        isInitialized = true;
        return true;
    } catch (e) {
        console.error("Web Audio API is not supported or could not be initialized:", e);
        isInitialized = false;
        audioContext = null;
        return false;
    }
}


// NEW: Export analyser for visualizer component
export function getAnalyser(): AnalyserNode | null {
    return analyser;
}


// FIX: Changed SoundType to OscillatorType as this function does not handle 'noise'.
function playSoundInternal(type: OscillatorType, startFreq: number, endFreq: number, duration: number, volume: number = 0.3) {
    if (!audioContext || !masterGain || audioContext.state !== 'running') return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = type;
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
    
    oscillator.frequency.setValueAtTime(startFreq, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(endFreq, audioContext.currentTime + duration);
    
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    // MODIFIED: Connect to master gain instead of destination
    gainNode.connect(masterGain);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

// FIX: Changed SoundType to OscillatorType in note definition as this function does not handle 'noise'.
function playNoteSequence(notes: { freq: number; duration: number; type: OscillatorType; volume: number; delay: number }[]) {
    if (!audioContext || !masterGain || audioContext.state !== 'running') return;
    const startTime = audioContext.currentTime;
    notes.forEach(note => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = note.type;
        oscillator.frequency.setValueAtTime(note.freq, startTime + note.delay);

        gainNode.gain.setValueAtTime(0, startTime + note.delay);
        gainNode.gain.linearRampToValueAtTime(note.volume, startTime + note.delay + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + note.delay + note.duration);

        oscillator.connect(gainNode);
        // MODIFIED: Connect to master gain
        gainNode.connect(masterGain);

        oscillator.start(startTime + note.delay);
        oscillator.stop(startTime + note.delay + note.duration);
    });
}


export const playSoundFromParams = (params: SoundEffectParameters) => {
    if (!audioContext) return;
    playSoundInternal(params.type, params.startFreq, params.endFreq, params.duration, params.volume);
};

export const exportSoundEffectToWav = async (params: SoundEffectParameters): Promise<Blob | null> => {
    if (!audioContext) return null;
    const offlineCtx = new OfflineAudioContext(1, audioContext.sampleRate * params.duration, audioContext.sampleRate);
    const oscillator = offlineCtx.createOscillator();
    const gainNode = offlineCtx.createGain();

    oscillator.type = params.type;
    gainNode.gain.setValueAtTime(0, 0);
    gainNode.gain.linearRampToValueAtTime(params.volume, 0.01);
    oscillator.frequency.setValueAtTime(params.startFreq, 0);
    oscillator.frequency.exponentialRampToValueAtTime(params.endFreq, params.duration);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, params.duration);

    oscillator.connect(gainNode);
    gainNode.connect(offlineCtx.destination);
    oscillator.start(0);
    oscillator.stop(params.duration);

    const renderedBuffer = await offlineCtx.startRendering();
    return bufferToWav(renderedBuffer);
};


export const playHover = () => playSoundInternal('sine', 1500, 1500, 0.03, 0.05);
export const playClick = () => playSoundInternal('square', 440, 480, 0.05, 0.15);
export const playToggle = () => playSoundInternal('triangle', 600, 800, 0.08, 0.1);
export const playCloseModal = () => playSoundInternal('sine', 400, 100, 0.2, 0.2);
export const playGenerate = () => playNoteSequence([
    { freq: NOTE_FREQUENCIES['C4'], duration: 0.08, type: 'square', volume: 0.1, delay: 0 },
    { freq: NOTE_FREQUENCIES['E4'], duration: 0.08, type: 'square', volume: 0.1, delay: 0.08 },
    { freq: NOTE_FREQUENCIES['G4'], duration: 0.1, type: 'square', volume: 0.1, delay: 0.16 },
]);
export const playSuccess = () => playNoteSequence([
    { freq: NOTE_FREQUENCIES['C5'], duration: 0.08, type: 'triangle', volume: 0.2, delay: 0 },
    { freq: NOTE_FREQUENCIES['E5'], duration: 0.08, type: 'triangle', volume: 0.2, delay: 0.1 },
    { freq: NOTE_FREQUENCIES['G5'], duration: 0.08, type: 'triangle', volume: 0.2, delay: 0.2 },
    { freq: NOTE_FREQUENCIES['C6'], duration: 0.15, type: 'triangle', volume: 0.2, delay: 0.3 },
]);
export const playError = () => playSoundInternal('sawtooth', 200, 50, 0.4, 0.3);
export const playSwoosh = () => playSoundInternal('sine', 1200, 100, 0.2, 0.15);
export const playSelection = () => playSoundInternal('square', 1000, 1000, 0.05, 0.1);
export const playCameraShutter = () => playSoundInternal('square', 3000, 500, 0.1, 0.25);
export const playDownload = () => playNoteSequence([
    { freq: NOTE_FREQUENCIES['G5'], duration: 0.08, type: 'sine', volume: 0.2, delay: 0 },
    { freq: NOTE_FREQUENCIES['E5'], duration: 0.08, type: 'sine', volume: 0.2, delay: 0.1 },
    { freq: NOTE_FREQUENCIES['C5'], duration: 0.15, type: 'sine', volume: 0.2, delay: 0.2 },
]);
export const playSliderChange = () => playSoundInternal('sine', 1200, 1200, 0.02, 0.04);
export const playScore = () => playSoundInternal('triangle', 1200, 1800, 0.08, 0.25);
export const playPlayerHit = () => playSoundInternal('square', 200, 50, 0.2, 0.3);
export const playGameOver = () => playNoteSequence([
    { freq: NOTE_FREQUENCIES['G3'], duration: 0.1, type: 'sawtooth', volume: 0.3, delay: 0 },
    { freq: NOTE_FREQUENCIES['F#3'], duration: 0.1, type: 'sawtooth', volume: 0.3, delay: 0.15 },
    { freq: NOTE_FREQUENCIES['F3'], duration: 0.1, type: 'sawtooth', volume: 0.3, delay: 0.3 },
    { freq: NOTE_FREQUENCIES['E3'], duration: 0.4, type: 'sawtooth', volume: 0.3, delay: 0.45 },
]);
export const playTrash = () => playSoundInternal('square', 200, 100, 0.15, 0.2);
export const playCreditAdd = () => playSoundInternal('sine', 1000, 1500, 0.1, 0.3);
export const playCreditSpend = () => playSoundInternal('sine', 800, 500, 0.1, 0.2);
export const playIntro1 = () => playSoundInternal('sine', 600, 800, 0.1, 0.3);
export const playIntro2 = () => playSoundInternal('sine', 800, 1000, 0.1, 0.3);
export const playIntro3 = () => playSoundInternal('sine', 1000, 1400, 0.15, 0.3);
export const playBrickHit = () => playSoundInternal('square', 1500, 1500, 0.05, 0.2);
export const playPaddleHit = () => playSoundInternal('square', 500, 500, 0.05, 0.3);
export const playWallHit = () => playSoundInternal('sine', 300, 300, 0.05, 0.2);
export const playMiss = () => playSoundInternal('triangle', 800, 400, 0.3, 0.3);
export const playWheelSpin = () => playSoundInternal('sine', 800, 1600, 0.5, 0.1);
export const playWheelWin = () => playNoteSequence([
    { freq: NOTE_FREQUENCIES['C5'], duration: 0.08, type: 'sine', volume: 0.2, delay: 0 },
    { freq: NOTE_FREQUENCIES['G5'], duration: 0.08, type: 'sine', volume: 0.2, delay: 0.1 },
    { freq: NOTE_FREQUENCIES['C6'], duration: 0.15, type: 'sine', volume: 0.2, delay: 0.2 },
]);

export const playMusicalNote = (frequency: number, type: SoundType, duration: number) => {
    if (!audioContext || !masterGain || audioContext.state !== 'running') return;

    if (type === 'noise') {
        if (!whiteNoiseBuffer) return;
        const source = audioContext.createBufferSource();
        source.buffer = whiteNoiseBuffer;
        
        const gainNode = audioContext.createGain();
        // Noise needs a much lower volume and a percussive envelope
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);

        source.connect(gainNode);
        gainNode.connect(masterGain);
        source.start(audioContext.currentTime);
        source.stop(audioContext.currentTime + duration);
    } else {
        // IMPROVEMENT: Use a simple ADSR-like envelope for better sound
        const gainNode = audioContext.createGain();
        const osc = audioContext.createOscillator();
        const now = audioContext.currentTime;

        const attackTime = 0.01;
        const decayTime = 0.1;
        const sustainLevel = 0.1;
        const releaseTime = 0.1;
        const totalDuration = duration;

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + attackTime); // Attack
        gainNode.gain.exponentialRampToValueAtTime(0.3 * sustainLevel, now + attackTime + decayTime); // Decay
        gainNode.gain.setValueAtTime(0.3 * sustainLevel, now + totalDuration - releaseTime); // Sustain
        gainNode.gain.linearRampToValueAtTime(0, now + totalDuration); // Release

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, now);
        osc.connect(gainNode);
        gainNode.connect(masterGain);
        osc.start(now);
        osc.stop(now + totalDuration);
    }
};

export const startBackgroundMusic = (page: string) => { 
    // Background music removed per user request.
};

export const changeBackgroundMusic = (page: string) => {
    // Background music removed per user request.
};


export const setMusicVolume = (volume: number) => { 
    desiredMusicVolume = volume;
    if (musicGain && audioContext && audioContext.state === 'running') {
        musicGain.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.5);
    }
};

let songTimeouts: number[] = [];
let activeSongSources: (OscillatorNode | AudioBufferSourceNode)[] = [];
export function stopSong() {
    songTimeouts.forEach(clearTimeout);
    songTimeouts = [];
    activeSongSources.forEach(source => {
        try {
            source.stop();
            source.disconnect();
        } catch (e) {
            // Source may have already been stopped or finished playing.
        }
    });
    activeSongSources = [];

    // As a fail-safe, quickly fade out the dedicated song gain node.
    // This ensures any lingering sounds from this song channel are silenced without affecting other channels.
    if (songGain && audioContext) {
        songGain.gain.cancelScheduledValues(audioContext.currentTime);
        // Use setValueAtTime and linearRampToValueAtTime for a smooth and quick fade out.
        songGain.gain.setValueAtTime(songGain.gain.value, audioContext.currentTime);
        songGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.05);
    }
}
export function playSong(song: Song, bpm: number, onEnd?: () => void) {
    if (!audioContext || !masterGain || !songGain || audioContext.state !== 'running') return;
    stopSong(); // Stop any currently playing song

    // After stopping, ensure the gain is reset to 1 for the new song.
    const startTime = audioContext.currentTime;
    songGain.gain.cancelScheduledValues(startTime);
    songGain.gain.setValueAtTime(1, startTime);

    const noteDuration = 60 / bpm; // Assuming each step is a quarter note
    let totalTime = 0;
    
    song.forEach((track, trackIndex) => {
        let currentTime = 0;
        const instrumentType: OscillatorType = trackIndex % 2 === 0 ? 'square' : 'triangle';
        
        track.forEach(note => {
            if (note) { // Don't process null/empty notes (rests)
                const freq = NOTE_FREQUENCIES[note];
                if (freq) {
                    const oscillator = audioContext!.createOscillator();
                    const gainNode = audioContext!.createGain();
                    const notePlayTime = startTime + currentTime;

                    oscillator.type = instrumentType;
                    oscillator.frequency.setValueAtTime(freq, notePlayTime);

                    gainNode.gain.setValueAtTime(0, notePlayTime);
                    gainNode.gain.linearRampToValueAtTime(0.3, notePlayTime + 0.01); // Quick fade in
                    gainNode.gain.exponentialRampToValueAtTime(0.0001, notePlayTime + (noteDuration * 0.9)); // Fade out

                    oscillator.connect(gainNode);
                    gainNode.connect(songGain);
                    
                    oscillator.start(notePlayTime);
                    oscillator.stop(notePlayTime + noteDuration);
                    
                    activeSongSources.push(oscillator);
                }
            }
            currentTime += noteDuration;
        });

        if (currentTime > totalTime) {
            totalTime = currentTime;
        }
    });

    if (onEnd) {
        const endTimeout = window.setTimeout(() => {
            activeSongSources = []; // Clear the sources array
            onEnd();
        }, totalTime * 1000);
        songTimeouts.push(endTimeout);
    } else {
        const cleanupTimeout = window.setTimeout(() => {
            activeSongSources = [];
        }, totalTime * 1000);
        songTimeouts.push(cleanupTimeout);
    }
}

let midiTimeouts: number[] = [];
export function stopMidi() {
    midiTimeouts.forEach(clearTimeout);
    midiTimeouts = [];
}
export function playMidi(notes: MidiNote[], onEnd?: () => void) {
    if (!audioContext) return;
    stopMidi();
    let maxTime = 0;
    notes.forEach(note => {
        const freq = 440 * Math.pow(2, (note.pitch - 69) / 12);
        const timeout = window.setTimeout(() => {
            playMusicalNote(freq, 'sine', note.duration * 0.9);
        }, note.startTime * 1000);
        midiTimeouts.push(timeout);
        if (note.startTime + note.duration > maxTime) {
            maxTime = note.startTime + note.duration;
        }
    });
    if (onEnd) {
        const endTimeout = window.setTimeout(onEnd, maxTime * 1000);
        midiTimeouts.push(endTimeout);
    }
}

export function bufferToWav(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels,
      length = buffer.length * numOfChan * 2 + 44,
      bufferArr = new ArrayBuffer(length),
      view = new DataView(bufferArr),
      channels = [];
    let i, sample, offset = 0, pos = 0;
  
    setUint32(0x46464952); 
    setUint32(length - 8); 
    setUint32(0x45564157); 
    setUint32(0x20746d66); 
    setUint32(16); 
    setUint16(1); 
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); 
    setUint16(numOfChan * 2); 
    setUint16(16); 
    setUint32(0x61746164); 
    setUint32(length - pos - 4); 
  
    for (i = 0; i < buffer.numberOfChannels; i++)
      channels.push(buffer.getChannelData(i));
  
    while (pos < length - 44) {
      for (i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }
  
    function setUint16(data: number) { view.setUint16(pos, data, true); pos += 2; }
    function setUint32(data: number) { view.setUint32(pos, data, true); pos += 4; }
  
    return new Blob([view], { type: 'audio/wav' });
}

async function renderToBuffer(renderFn: (ctx: OfflineAudioContext) => void, duration: number): Promise<AudioBuffer | null> {
    if (!audioContext) return null;
    const offlineCtx = new OfflineAudioContext(1, Math.ceil(audioContext.sampleRate * duration), audioContext.sampleRate);
    renderFn(offlineCtx);
    return await offlineCtx.startRendering();
}

export const exportSongToWav = async (song: Song, bpm: number): Promise<Blob | null> => {
    const noteDuration = 60 / bpm;
    let totalDuration = 0;
    song.forEach(track => {
        const trackDuration = track.length * noteDuration;
        if (trackDuration > totalDuration) totalDuration = trackDuration;
    });

    const buffer = await renderToBuffer((ctx) => {
        song.forEach((track, trackIndex) => {
            let currentTime = 0;
            // FIX: Changed SoundType to OscillatorType as it only uses valid oscillator types.
            const instrumentType: OscillatorType = trackIndex % 2 === 0 ? 'square' : 'triangle';
            track.forEach(note => {
                const freq = NOTE_FREQUENCIES[note];
                if (freq) {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = instrumentType;
                    osc.frequency.setValueAtTime(freq, currentTime);
                    gain.gain.setValueAtTime(0.3, currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.0001, currentTime + noteDuration * 0.9);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(currentTime);
                    osc.stop(currentTime + noteDuration);
                }
                currentTime += noteDuration;
            });
        });
    }, totalDuration);
    
    return buffer ? bufferToWav(buffer) : null;
}

export const exportMidiToWav = async (notes: MidiNote[]): Promise<Blob | null> => {
    const totalDuration = notes.reduce((max, n) => Math.max(max, n.startTime + n.duration), 0);
    const buffer = await renderToBuffer(ctx => {
        notes.forEach(note => {
            const freq = 440 * Math.pow(2, (note.pitch - 69) / 12);
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, note.startTime);
            gain.gain.setValueAtTime(0.3, note.startTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, note.startTime + note.duration * 0.9);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(note.startTime);
            osc.stop(note.startTime + note.duration);
        });
    }, totalDuration);
    return buffer ? bufferToWav(buffer) : null;
};

export const exportSequencerToWav = async (notes: Set<string>, bpm: number, instrument: SoundType, pitches: string[], numSteps: number): Promise<Blob | null> => {
    const noteDuration = (60 / bpm) / 4; // 16th notes
    const totalDuration = numSteps * noteDuration;

    if (!audioContext) return null; // Need sampleRate from the main context

    const buffer = await renderToBuffer((ctx) => {
        let offlineNoiseBuffer: AudioBuffer | null = null;
        if (instrument === 'noise') {
            const bufferSize = ctx.sampleRate * 2;
            offlineNoiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = offlineNoiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
        }
    
        for (let step = 0; step < numSteps; step++) {
            const stepTime = step * noteDuration;
            pitches.forEach(pitch => {
                if (notes.has(`${pitch}:${step}`)) {
                    if (instrument === 'noise') {
                        if (!offlineNoiseBuffer) return;
                        const source = ctx.createBufferSource();
                        source.buffer = offlineNoiseBuffer;
                        const gain = ctx.createGain();
                        gain.gain.setValueAtTime(0.2, stepTime);
                        gain.gain.exponentialRampToValueAtTime(0.0001, stepTime + noteDuration * 0.9);
                        source.connect(gain);
                        gain.connect(ctx.destination);
                        source.start(stepTime);
                        source.stop(stepTime + noteDuration);
                    } else {
                        const freq = NOTE_FREQUENCIES[pitch];
                        if (freq) {
                            const osc = ctx.createOscillator();
                            const gain = ctx.createGain();
                            osc.type = instrument;
                            osc.frequency.setValueAtTime(freq, stepTime);
                            gain.gain.setValueAtTime(0.3, stepTime);
                            gain.gain.exponentialRampToValueAtTime(0.0001, stepTime + noteDuration * 0.9);
                            osc.connect(gain);
                            gain.connect(ctx.destination);
                            osc.start(stepTime);
                            osc.stop(stepTime + noteDuration);
                        }
                    }
                }
            });
        }
    }, totalDuration);
    
    return buffer ? bufferToWav(buffer) : null;
};

export const playComposedSong = (song: ComposedSong, onEnd?: () => void) => {
    if (!audioContext || !masterGain || !songGain || audioContext.state !== 'running') return;
    stopSong();

    const startTime = audioContext.currentTime;
    songGain.gain.cancelScheduledValues(startTime);
    songGain.gain.setValueAtTime(1, startTime);

    const noteDuration = 60 / song.bpm;
    const maxNotes = Math.max(...song.tracks.map(t => t.notes.length));
    const totalTime = maxNotes * noteDuration;

    song.tracks.forEach(track => {
        let currentTime = 0;
        track.notes.forEach(note => {
            if (note) {
                const freq = NOTE_FREQUENCIES[note];
                if (freq || track.instrument === 'noise') {
                    const notePlayTime = startTime + currentTime;
                    if (track.instrument === 'noise') {
                         if (!whiteNoiseBuffer) return;
                         const source = audioContext.createBufferSource();
                         source.buffer = whiteNoiseBuffer;
                         const gainNode = audioContext.createGain();
                         gainNode.gain.setValueAtTime(0, notePlayTime);
                         gainNode.gain.linearRampToValueAtTime(0.2, notePlayTime + 0.01);
                         gainNode.gain.exponentialRampToValueAtTime(0.0001, notePlayTime + noteDuration * 0.5);
                         source.connect(gainNode);
                         gainNode.connect(songGain);
                         source.start(notePlayTime);
                         source.stop(notePlayTime + noteDuration);
                         activeSongSources.push(source);
                    } else {
                        const oscillator = audioContext.createOscillator();
                        const gainNode = audioContext.createGain();
                        oscillator.type = track.instrument as OscillatorType;
                        oscillator.frequency.setValueAtTime(freq, notePlayTime);

                        gainNode.gain.setValueAtTime(0, notePlayTime);
                        gainNode.gain.linearRampToValueAtTime(0.25, notePlayTime + 0.01);
                        gainNode.gain.exponentialRampToValueAtTime(0.0001, notePlayTime + (noteDuration * 0.9));

                        oscillator.connect(gainNode);
                        gainNode.connect(songGain);
                        
                        oscillator.start(notePlayTime);
                        oscillator.stop(notePlayTime + noteDuration);
                        activeSongSources.push(oscillator);
                    }
                }
            }
            currentTime += noteDuration;
        });
    });

     if (onEnd) {
        const endTimeout = window.setTimeout(() => {
            activeSongSources = [];
            onEnd();
        }, totalTime * 1000 + 100);
        songTimeouts.push(endTimeout);
    } else {
        const cleanupTimeout = window.setTimeout(() => {
            activeSongSources = [];
        }, totalTime * 1000 + 100);
        songTimeouts.push(cleanupTimeout);
    }
}

export const exportComposedSongToWav = async (song: ComposedSong): Promise<Blob | null> => {
    const noteDuration = 60 / song.bpm;
    const totalDuration = Math.max(...song.tracks.map(t => t.notes.length)) * noteDuration;
    if (totalDuration === 0) return null;

    const buffer = await renderToBuffer((ctx) => {
        let offlineNoiseBuffer: AudioBuffer | null = null;
        if (song.tracks.some(t => t.instrument === 'noise')) {
            const bufferSize = ctx.sampleRate * 2;
            offlineNoiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = offlineNoiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
        }

        song.tracks.forEach(track => {
            let currentTime = 0;
            track.notes.forEach(note => {
                const freq = NOTE_FREQUENCIES[note];
                if (freq || (note && track.instrument === 'noise')) {
                     if (track.instrument === 'noise') {
                        if (!offlineNoiseBuffer) return;
                        const source = ctx.createBufferSource();
                        source.buffer = offlineNoiseBuffer;
                        const gain = ctx.createGain();
                        gain.gain.setValueAtTime(0, currentTime);
                        gain.gain.linearRampToValueAtTime(0.2, currentTime + 0.01);
                        gain.gain.exponentialRampToValueAtTime(0.0001, currentTime + noteDuration * 0.5);
                        source.connect(gain);
                        gain.connect(ctx.destination);
                        source.start(currentTime);
                        source.stop(currentTime + noteDuration);
                    } else {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = track.instrument as OscillatorType;
                        osc.frequency.setValueAtTime(freq, currentTime);
                        gain.gain.setValueAtTime(0, currentTime);
                        gain.gain.linearRampToValueAtTime(0.25, currentTime + 0.01);
                        gain.gain.exponentialRampToValueAtTime(0.0001, currentTime + noteDuration * 0.9);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start(currentTime);
                        osc.stop(currentTime + noteDuration);
                    }
                }
                currentTime += noteDuration;
            });
        });
    }, totalDuration);
    
    return buffer ? bufferToWav(buffer) : null;
};


export const playAudioBuffer = (buffer: AudioBuffer): AudioBufferSourceNode => {
    if (!audioContext || !masterGain) throw new Error("Audio context not initialized");
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(masterGain);
    source.start();
    return source;
};

export const applyVoiceEffect = async (file: File, effect: string, params: EffectParameters): Promise<AudioBuffer> => {
    if (!audioContext) throw new Error("Audio context not initialized");
    const arrayBuffer = await file.arrayBuffer();
    const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const offlineCtx = new OfflineAudioContext(decodedBuffer.numberOfChannels, decodedBuffer.length, decodedBuffer.sampleRate);
    
    const source = offlineCtx.createBufferSource();
    source.buffer = decodedBuffer;
    let lastNode: AudioNode = source;

    if (effect === 'pitch-shift' && params.pitchShift) {
        console.warn("Pitch shift effect is complex and not implemented in this demo.");
    }
    if (effect === 'echo' && params.delayTime) {
        const delay = offlineCtx.createDelay(params.delayTime + 1);
        delay.delayTime.value = params.delayTime;
        const feedback = offlineCtx.createGain();
        feedback.gain.value = params.delayFeedback || 0.4;
        lastNode.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        lastNode = delay;
    }
    
    lastNode.connect(offlineCtx.destination);
    source.start();
    return await offlineCtx.startRendering();
};

export const applyBitcrusherEffect = async (
    file: File, 
    bitDepth: number, 
    targetSampleRate: number
): Promise<AudioBuffer> => {
    if (!audioContext) throw new Error("Audio context not initialized");
    const arrayBuffer = await file.arrayBuffer();
    const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const offlineCtx = new OfflineAudioContext(decodedBuffer.numberOfChannels, decodedBuffer.length, decodedBuffer.sampleRate);
    
    const inputData = decodedBuffer.getChannelData(0); // Assuming mono for simplicity
    const outputBuffer = offlineCtx.createBuffer(1, decodedBuffer.length, decodedBuffer.sampleRate);
    const outputData = outputBuffer.getChannelData(0);

    const steps = Math.pow(2, bitDepth);
    const stepSize = 2 / steps; // Samples are in range [-1, 1]
    
    const sampleRateReductionFactor = Math.max(1, Math.floor(decodedBuffer.sampleRate / targetSampleRate));
    let lastSample = 0;
    
    for (let i = 0; i < inputData.length; i++) {
        // Sample rate reduction (sample and hold)
        if (i % sampleRateReductionFactor === 0) {
            // Bit crushing (quantization)
            const currentSample = inputData[i];
            const crushedSample = stepSize * Math.floor(currentSample / stepSize + 0.5);
            lastSample = crushedSample;
        }
        outputData[i] = lastSample;
    }
    
    const source = offlineCtx.createBufferSource();
    source.buffer = outputBuffer;
    source.connect(offlineCtx.destination);
    source.start();

    return await offlineCtx.startRendering();
};

// This function takes an AudioBuffer and returns a new, reversed one.
export const reverseAudioBuffer = (buffer: AudioBuffer): AudioBuffer => {
    if (!audioContext) throw new Error("Audio context not initialized");
    const channelCount = buffer.numberOfChannels;
    const frameCount = buffer.length;
    const reversedBuffer = audioContext.createBuffer(channelCount, frameCount, buffer.sampleRate);
    for (let i = 0; i < channelCount; i++) {
        const originalData = buffer.getChannelData(i);
        const reversedData = reversedBuffer.getChannelData(i);
        for (let j = 0; j < frameCount; j++) {
            reversedData[j] = originalData[frameCount - 1 - j];
        }
    }
    return reversedBuffer;
};

// New helper to combine file reading, decoding, and reversing
export const extractAndReverseAudioFromFile = async (file: File): Promise<AudioBuffer> => {
    if (!audioContext) throw new Error("Audio context not initialized");
    const arrayBuffer = await file.arrayBuffer();
    const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return reverseAudioBuffer(decodedBuffer);
};

// --- New Polyphonic Offline Audio to MIDI conversion ---

// FFT implementation (helper, not exported)
function fft(buffer: Float32Array): { real: Float32Array, imag: Float32Array } {
    const n = buffer.length;
    if ((n & (n - 1)) !== 0) { // Not a power of 2
        console.warn("FFT input size is not a power of 2. Results may be inaccurate.");
    }
    if (n <= 1) return { real: buffer, imag: new Float32Array(n).fill(0) };

    const even = new Float32Array(n / 2);
    const odd = new Float32Array(n / 2);
    for (let i = 0; i < n / 2; i++) {
        even[i] = buffer[2 * i];
        odd[i] = buffer[2 * i + 1];
    }

    const { real: even_fft_real, imag: even_fft_imag } = fft(even);
    const { real: odd_fft_real, imag: odd_fft_imag } = fft(odd);

    const real = new Float32Array(n);
    const imag = new Float32Array(n);

    for (let k = 0; k < n / 2; k++) {
        const angle = -2 * Math.PI * k / n;
        const cos_angle = Math.cos(angle);
        const sin_angle = Math.sin(angle);
        
        const t_real = cos_angle * odd_fft_real[k] - sin_angle * odd_fft_imag[k];
        const t_imag = sin_angle * odd_fft_real[k] + cos_angle * odd_fft_imag[k];

        real[k] = even_fft_real[k] + t_real;
        imag[k] = even_fft_imag[k] + t_imag;
        real[k + n / 2] = even_fft_real[k] - t_real;
        imag[k + n / 2] = even_fft_imag[k] - t_imag;
    }
    return { real, imag };
}


function analyzePolyphonicFrequency(buffer: Float32Array, sampleRate: number): number[] {
    const n = buffer.length;
    
    // Apply a window function (Hann) to reduce spectral leakage
    const windowedBuffer = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        windowedBuffer[i] = buffer[i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / n));
    }

    const { real, imag } = fft(windowedBuffer);
    const magnitudes = new Float32Array(n / 2);
    for (let i = 0; i < n / 2; i++) {
        magnitudes[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
    }
    
    const peaks: { freq: number, mag: number }[] = [];
    const avgMag = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
    const threshold = avgMag * 5; // Peaks must be 5x the average noise floor

    for (let i = 1; i < magnitudes.length - 1; i++) {
        if (magnitudes[i] > magnitudes[i - 1] && magnitudes[i] > magnitudes[i + 1] && magnitudes[i] > threshold) {
            const y1 = magnitudes[i-1], y2 = magnitudes[i], y3 = magnitudes[i+1];
            const p = 0.5 * (y1 - y3) / (y1 - 2 * y2 + y3);
            const peakIndex = i + p;
            const freq = peakIndex * sampleRate / n;
            peaks.push({ freq, mag: y2 });
        }
    }
    
    if (peaks.length === 0) return [];
    
    peaks.sort((a, b) => b.mag - a.mag);
    
    const MAX_NOTES = 6;
    const potentialNotes = peaks.slice(0, MAX_NOTES * 3); 

    const fundamentalNotes: { freq: number, mag: number }[] = [];
    for (const peak of potentialNotes) {
        if (peak.freq < 50) continue; // Ignore very low frequencies
        let isHarmonic = false;
        for (const fundamental of fundamentalNotes) {
            const ratio = peak.freq / fundamental.freq;
            const harmonicNumber = Math.round(ratio);
            if (harmonicNumber > 1 && Math.abs(ratio - harmonicNumber) < 0.05 && peak.mag < fundamental.mag * 0.9) {
                isHarmonic = true;
                break;
            }
        }
        if (!isHarmonic) {
            fundamentalNotes.push(peak);
        }
    }
    
    const midiPitches = fundamentalNotes
        .slice(0, MAX_NOTES)
        .map(note => 69 + 12 * Math.log2(note.freq / 440))
        .filter(midi => midi >= 21 && midi <= 108) // Piano range
        .map(midi => Math.round(midi));

    return [...new Set(midiPitches)];
}


export async function analyzeAudioBufferToMidi(buffer: AudioBuffer): Promise<MidiNote[]> {
    if (!buffer) return [];
    
    const channelData = buffer.getChannelData(0); // Use mono
    const sampleRate = buffer.sampleRate;
    const chunkSize = 4096; // Power of 2 for FFT
    const chunkDuration = chunkSize / sampleRate;

    let activeNotes = new Map<number, { pitch: number, startTime: number, duration: number }>();
    const finishedNotes: MidiNote[] = [];
    
    for (let offset = 0; offset + chunkSize <= channelData.length; offset += chunkSize) {
        const chunk = channelData.slice(offset, offset + chunkSize);
        const currentTime = offset / sampleRate;
        const detectedPitches = analyzePolyphonicFrequency(chunk, sampleRate);
        const detectedPitchesSet = new Set(detectedPitches);
        const activePitchesSet = new Set(activeNotes.keys());

        // Finish notes that have ended
        for (const pitch of activePitchesSet) {
            if (!detectedPitchesSet.has(pitch)) {
                const finishedNote = activeNotes.get(pitch)!;
                if (finishedNote.duration > chunkDuration * 1.5) { // Filter out very short notes
                    finishedNotes.push(finishedNote);
                }
                activeNotes.delete(pitch);
            }
        }

        // Extend or start notes
        for (const pitch of detectedPitches) {
            if (activeNotes.has(pitch)) {
                activeNotes.get(pitch)!.duration += chunkDuration;
            } else {
                activeNotes.set(pitch, {
                    pitch: pitch,
                    startTime: currentTime,
                    duration: chunkDuration
                });
            }
        }
    }

    // Add any remaining active notes at the end of the audio
    for (const note of activeNotes.values()) {
        if (note.duration > chunkDuration * 1.5) {
            finishedNotes.push(note);
        }
    }

    // Sort notes by start time, just in case
    finishedNotes.sort((a, b) => a.startTime - b.startTime);

    return finishedNotes;
}


// --- NEW HELPER FUNCTIONS for musical analysis ---
const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function frequencyToNoteName(frequency: number): string {
    if (frequency <= 0) return "N/A";
    const midiNum = 69 + 12 * Math.log2(frequency / 440);
    const roundedMidi = Math.round(midiNum);
    if (roundedMidi < 0 || roundedMidi > 127) return "N/A";
    const noteIndex = roundedMidi % 12;
    const octave = Math.floor(roundedMidi / 12) - 1;
    return noteStrings[noteIndex] + octave;
}

function detectBpm(buffer: AudioBuffer): number {
    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const frameSize = 1024;
    const hopSize = 512;
    const energies: number[] = [];

    for (let i = 0; i + frameSize <= channelData.length; i += hopSize) {
        let sum = 0;
        for (let j = 0; j < frameSize; j++) {
            sum += Math.pow(channelData[i + j], 2);
        }
        energies.push(sum);
    }
    
    const onsets: number[] = [];
    const historySize = 20; 
    for (let i = historySize; i < energies.length - 1; i++) {
        const historyBuffer = energies.slice(i - historySize, i);
        const localAverage = historyBuffer.reduce((a, b) => a + b, 0) / historySize;
        const threshold = localAverage * 1.4; 
        
        if (energies[i] > threshold && energies[i] > energies[i-1] && energies[i] > energies[i+1]) {
            onsets.push(i * hopSize / sampleRate);
        }
    }

    if (onsets.length < 4) return 0;
    
    const iois: number[] = [];
    for (let i = 1; i < onsets.length; i++) {
        const ioi = onsets[i] - onsets[i - 1];
        if (ioi > 0.1 && ioi < 2.0) { // 30-600 bpm range
            iois.push(ioi);
        }
    }
    
    if (iois.length < 3) return 0;
    
    iois.sort((a, b) => a - b);
    const medianIoi = iois[Math.floor(iois.length / 2)];
    
    if (medianIoi === 0) return 0;

    let bpm = 60.0 / medianIoi;
    while (bpm < 70) bpm *= 2;
    while (bpm > 180) bpm /= 2;

    return Math.round(bpm);
}

function calculateHarmonicRichness(magnitudes: Float32Array, fundamentalIndex: number): number {
    if (fundamentalIndex <= 0 || magnitudes.length === 0) return 0;

    let harmonicEnergy = 0;
    let totalEnergy = 0;
    
    for (let h = 1; (h * fundamentalIndex) < magnitudes.length; h++) {
        const harmonicIdx = Math.round(h * fundamentalIndex);
        
        let peakEnergy = 0;
        const window = 2;
        for (let i = -window; i <= window; i++) {
            const idx = harmonicIdx + i;
            if (idx >= 0 && idx < magnitudes.length) {
                peakEnergy = Math.max(peakEnergy, magnitudes[idx]);
            }
        }
        harmonicEnergy += peakEnergy;
    }
    
    for (let i = 0; i < magnitudes.length; i++) {
        totalEnergy += magnitudes[i];
    }
    
    if (totalEnergy === 0) return 0;

    const richness = (harmonicEnergy / totalEnergy) * 100;
    return isFinite(richness) ? Math.min(100, richness) : 0;
}


export async function analyzeAudioLocally(buffer: AudioBuffer): Promise<LocalAnalysisResult> {
    if (!buffer) {
        throw new Error("Invalid AudioBuffer provided.");
    }
    
    const channelData = buffer.getChannelData(0); // Analyze mono
    const sampleRate = buffer.sampleRate;
    
    // 1. Duration
    const duration = buffer.duration;

    // 2. Loudness
    let sumOfSquares = 0;
    let peak = 0;
    for (let i = 0; i < channelData.length; i++) {
        const sample = channelData[i];
        sumOfSquares += sample * sample;
        if (Math.abs(sample) > peak) {
            peak = Math.abs(sample);
        }
    }
    const rms = Math.sqrt(sumOfSquares / channelData.length);
    const averageLoudness = 20 * Math.log10(rms); 
    const peakLoudness = 20 * Math.log10(peak);
    
    // 3. Dominant Frequency
    const fftSize = 4096;
    if (channelData.length < fftSize) {
        return {
            duration,
            peakLoudness: isFinite(peakLoudness) ? peakLoudness : -100,
            averageLoudness: isFinite(averageLoudness) ? averageLoudness : -100,
            dominantFrequency: 0,
            estimatedBpm: 0,
            estimatedPitch: 'N/A',
            harmonicRichness: 0,
        };
    }
    const start = Math.floor((channelData.length - fftSize) / 2);
    const fftBuffer = new Float32Array(fftSize);
    for (let i = 0; i < fftSize; i++) {
        fftBuffer[i] = channelData[start + i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / fftSize));
    }
    
    const { real, imag } = fft(fftBuffer);
    const magnitudes = new Float32Array(fftSize / 2).map((_, i) => Math.sqrt(real[i] * real[i] + imag[i] * imag[i]));
    
    let maxMag = 0;
    let maxIndex = 0;
    for (let i = 1; i < magnitudes.length; i++) {
        if (magnitudes[i] > maxMag) {
            maxMag = magnitudes[i];
            maxIndex = i;
        }
    }
    
    const dominantFrequency = maxIndex * sampleRate / fftSize;

    // 4. New Musical Analysis
    const estimatedPitch = frequencyToNoteName(dominantFrequency);
    const estimatedBpm = detectBpm(buffer);
    const harmonicRichness = calculateHarmonicRichness(magnitudes, maxIndex);

    return {
        duration,
        peakLoudness: isFinite(peakLoudness) ? peakLoudness : -100,
        averageLoudness: isFinite(averageLoudness) ? averageLoudness : -100,
        dominantFrequency,
        estimatedBpm,
        estimatedPitch,
        harmonicRichness: isFinite(harmonicRichness) ? harmonicRichness : 0,
    };
}