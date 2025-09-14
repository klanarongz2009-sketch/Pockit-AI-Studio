// FIX: Add missing imports for types used in new functions.
import type { Song, MidiNote } from './geminiService';
import type { SoundEffectParameters } from './geminiService';

export type SoundType = 'sine' | 'square' | 'sawtooth' | 'triangle';

let audioContext: AudioContext | null = null;
let isInitialized = false;

// NEW: Store preloaded raw data and decoded buffers
const preloadedAudioData = new Map<string, ArrayBuffer>();
const decodedAudioBuffers = new Map<string, AudioBuffer>();

// Module-level state for background music
let musicGain: GainNode | null = null;
let desiredMusicVolume = 0.1; // Store the desired volume
let musicTimeouts: number[] = [];
let isMusicPlaying = false;


// FIX: Added missing type definition for voice changer effects.
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

// NEW: Helper for playing sequences of notes for more complex sounds.
function playNoteSequence(notes: { freq: number; duration: number; type: SoundType; volume: number; delay: number }[]) {
    if (!audioContext || audioContext.state !== 'running') return;
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
        gainNode.connect(audioContext.destination);

        oscillator.start(startTime + note.delay);
        oscillator.stop(startTime + note.delay + note.duration);
    });
}


// FIX: Added missing sound effect playback and export functions.
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


// --- UI SOUNDS OVERHAUL ---
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

// --- MUSIC/SYNTH SOUNDS ---
export const playMusicalNote = (frequency: number, type: SoundType, duration: number) => {
    playSoundInternal(type, frequency, frequency, duration, 0.3);
};

// --- NEW SYNTHESIZED BACKGROUND MUSIC ---
const musicSequence = {
    bpm: 130,
    tracks: [
        { // Bassline
            instrument: 'sawtooth' as SoundType,
            volume: 0.2,
            notes: [
                'C2', null, 'C2', 'C2', 'G2', null, 'G2', 'G2', 'A#2', null, 'A#2', 'A#2', 'F2', null, 'F2', 'F2',
                'C2', null, 'C2', 'C2', 'G2', null, 'G2', 'G2', 'A#2', null, 'A#2', 'A#2', 'F2', null, 'F2', 'F2',
                'F2', null, 'F2', 'F2', 'C2', null, 'C2', 'C2', 'D#2', null, 'D#2', 'D#2', 'A#2', null, 'A#2', 'A#2',
                'F2', null, 'F2', 'F2', 'C2', null, 'C2', 'C2', 'D#2', null, 'D#2', 'A#2', 'G2', 'G2', null, null,
            ]
        },
        { // Melody
            instrument: 'square' as SoundType,
            volume: 0.15,
            notes: [
                'C4', 'E4', 'G4', null, 'E4', null, 'C4', null, 'G3', 'B3', 'D4', null, 'B3', null, 'G3', null,
                'A#3', 'D4', 'F4', null, 'D4', null, 'A#3', null, 'F3', 'A3', 'C4', null, 'A3', null, 'F3', null,
                'C4', 'E4', 'G4', null, 'E4', null, 'C4', null, 'G3', 'B3', 'D4', null, 'B3', null, 'G3', null,
                'A#3', 'D4', 'F4', 'D4', 'C4', 'A#3', 'A3', 'G3', 'F4', null, null, null, 'G4', 'A4', 'A#4', null,
            ]
        },
        { // Arpeggio / Harmony
            instrument: 'sine' as SoundType,
            volume: 0.1,
            notes: [
                'G4', null, null, null, 'G4', null, null, null, 'D4', null, null, null, 'D4', null, null, null,
                'F4', null, null, null, 'F4', null, null, null, 'C4', null, null, null, 'C4', null, null, null,
                'G4', null, null, null, 'G4', null, null, null, 'D4', null, null, null, 'D4', null, null, null,
                'F4', null, 'C4', null, 'D#4', null, 'A#3', null, 'G4', null, null, 'G4', 'F4', null, 'D#4', null,
            ]
        },
        { // Percussion
            instrument: 'square' as SoundType,
            volume: 0.12,
            notes: [
                'C2', null, 'C3', null, 'C2', null, 'C3', null, 'C2', null, 'C3', null, 'C2', null, 'C3', null,
                'C2', null, 'C3', null, 'C2', null, 'C3', 'C3', 'C2', null, 'C3', null, 'C2', null, 'C3', 'C3',
                'C2', null, 'C3', null, 'C2', null, 'C3', null, 'C2', null, 'C3', null, 'C2', null, 'C3', null,
                'C2', null, 'C3', 'C3', 'C2', 'C2', 'C3', 'C3', 'D#3', 'D#3', 'D#3', null, 'D#3', 'D#3', 'D#3', null,
            ]
        }
    ]
};

function stopSynthesizedMusic() {
    musicTimeouts.forEach(clearTimeout);
    musicTimeouts = [];
    isMusicPlaying = false;
}

function playSynthesizedMusicLoop() {
    if (!audioContext || audioContext.state !== 'running' || !isMusicPlaying) return;

    const noteDurationMs = (60 / musicSequence.bpm) * 500; // 16th notes
    let totalDuration = 0;

    musicSequence.tracks.forEach(track => {
        let currentTime = 0;
        track.notes.forEach(note => {
            if (note) {
                const freq = NOTE_FREQUENCIES[note];
                if (freq) {
                    const timeout = window.setTimeout(() => {
                        if (!isMusicPlaying || !musicGain) return; // Check again before playing
                        const oscillator = audioContext!.createOscillator();
                        const noteGain = audioContext!.createGain();

                        oscillator.type = track.instrument;
                        oscillator.frequency.setValueAtTime(freq, audioContext!.currentTime);
                        
                        // Percussion track has very short notes
                        const isPercussion = track.instrument === 'square' && note.startsWith('C2') || note.startsWith('C3') || note.startsWith('D#3');
                        const duration = isPercussion ? 0.05 : (noteDurationMs * 0.9 / 1000);
                        const volume = isPercussion && note.startsWith('C3') ? track.volume * 0.7 : track.volume;

                        noteGain.gain.setValueAtTime(0, audioContext!.currentTime);
                        noteGain.gain.linearRampToValueAtTime(volume, audioContext!.currentTime + 0.01);
                        noteGain.gain.exponentialRampToValueAtTime(0.0001, audioContext!.currentTime + duration);
                        
                        oscillator.connect(noteGain);
                        noteGain.connect(musicGain); // Connect to the master music gain
                        
                        oscillator.start();
                        oscillator.stop(audioContext!.currentTime + duration + 0.05);
                    }, currentTime);
                    musicTimeouts.push(timeout);
                }
            }
            currentTime += noteDurationMs;
        });
        if (currentTime > totalDuration) {
            totalDuration = currentTime;
        }
    });

    // Loop it
    const loopTimeout = window.setTimeout(playSynthesizedMusicLoop, totalDuration);
    musicTimeouts.push(loopTimeout);
}


export const startBackgroundMusic = () => { 
    if (!audioContext || isMusicPlaying || audioContext.state !== 'running') return;

    // Create the master gain node for music if it doesn't exist
    if (!musicGain) {
        musicGain = audioContext.createGain();
        musicGain.gain.value = 0; // Start silent
        musicGain.connect(audioContext.destination);
    }

    isMusicPlaying = true;
    playSynthesizedMusicLoop();

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

// --- FIX: Added all missing audio playback and processing functions ---

// --- Song Playback ---
// FIX: The return type of setTimeout in browsers is number, not NodeJS.Timeout.
let songTimeouts: number[] = [];
export function stopSong() {
    songTimeouts.forEach(clearTimeout);
    songTimeouts = [];
}
export function playSong(song: Song, bpm: number, onEnd?: () => void) {
    if (!audioContext) return;
    stopSong();
    const noteDuration = 60 / bpm; // duration of a quarter note
    let totalTime = 0;
    song.forEach((track, trackIndex) => {
        let currentTime = 0;
        const instrumentType: SoundType = trackIndex % 2 === 0 ? 'square' : 'triangle';
        track.forEach(note => {
            const freq = NOTE_FREQUENCIES[note];
            if (freq) {
// FIX: Use window.setTimeout to ensure it returns a number, not NodeJS.Timeout.
                const timeout = window.setTimeout(() => {
                    playMusicalNote(freq, instrumentType, noteDuration * 0.9);
                }, currentTime * 1000);
                songTimeouts.push(timeout);
            }
            currentTime += noteDuration;
        });
        if (currentTime > totalTime) {
            totalTime = currentTime;
        }
    });

    if (onEnd) {
// FIX: Use window.setTimeout to ensure it returns a number, not NodeJS.Timeout.
        const endTimeout = window.setTimeout(onEnd, totalTime * 1000);
        songTimeouts.push(endTimeout);
    }
}

// --- MIDI Playback ---
// FIX: The return type of setTimeout in browsers is number, not NodeJS.Timeout.
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
// FIX: Use window.setTimeout to ensure it returns a number, not NodeJS.Timeout.
        const timeout = window.setTimeout(() => {
            playMusicalNote(freq, 'sine', note.duration * 0.9);
        }, note.startTime * 1000);
        midiTimeouts.push(timeout);
        if (note.startTime + note.duration > maxTime) {
            maxTime = note.startTime + note.duration;
        }
    });
    if (onEnd) {
// FIX: Use window.setTimeout to ensure it returns a number, not NodeJS.Timeout.
        const endTimeout = window.setTimeout(onEnd, maxTime * 1000);
        midiTimeouts.push(endTimeout);
    }
}

// --- AudioBuffer to WAV conversion ---
export function bufferToWav(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels,
      length = buffer.length * numOfChan * 2 + 44,
      bufferArr = new ArrayBuffer(length),
      view = new DataView(bufferArr),
      channels = [];
    let i, sample, offset = 0, pos = 0;
  
    // write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit
    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length
  
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

// --- Exporters ---
async function renderToBuffer(renderFn: (ctx: OfflineAudioContext) => void, duration: number): Promise<AudioBuffer | null> {
    if (!audioContext) return null;
    const offlineCtx = new OfflineAudioContext(1, audioContext.sampleRate * duration, audioContext.sampleRate);
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
            const instrumentType: SoundType = trackIndex % 2 === 0 ? 'square' : 'triangle';
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

// --- Voice Changer ---
export const playAudioBuffer = (buffer: AudioBuffer): AudioBufferSourceNode => {
    if (!audioContext) throw new Error("Audio context not initialized");
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
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
        // Not a native node, requires complex implementation. For demo, we'll skip the actual effect.
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
    // Add other effects here...
    
    lastNode.connect(offlineCtx.destination);
    source.start();
    return await offlineCtx.startRendering();
};