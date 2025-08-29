
import type { Song, SongNote, SoundEffectParameters, MidiNote } from './geminiService';

let audioContext: AudioContext | null = null;
let isInitialized = false;

// Module-level state for song playback
let activeSources: AudioScheduledSourceNode[] = [];
let songEndTimeoutId: number | null = null;

// Module-level state for MIDI playback
let activeMidiSources: AudioScheduledSourceNode[] = [];
let midiEndTimeoutId: number | null = null;

// Module-level state for background music
let musicSource: AudioBufferSourceNode | null = null;
let musicGain: GainNode | null = null;
let desiredMusicVolume = 0; // Store the desired volume

// Initialize AudioContext on first user gesture
export const initAudio = () => {
    if (isInitialized || typeof window === 'undefined') return;
    isInitialized = true;
    try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContext.state === 'suspended') {
            audioContext.resume().catch(e => {
                console.error("Error resuming AudioContext:", e);
                audioContext = null;
            });
        }
    } catch (e) {
        console.error("Web Audio API is not supported or could not be initialized:", e);
        audioContext = null;
    }
};

export type SoundType = 'sine' | 'square' | 'sawtooth' | 'triangle';

const playSoundInternal = (type: SoundType, startFreq: number, endFreq: number, duration: number, volume: number = 0.3) => {
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
};

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

// Intro Sounds
export const playIntro1 = () => playSoundInternal('sine', 440, 660, 0.3, 0.3);
export const playIntro2 = () => playSoundInternal('sine', 550, 770, 0.3, 0.3);
export const playIntro3 = () => playSoundInternal('sine', 660, 880, 0.4, 0.3);

// Brick Breaker Sounds
export const playBrickHit = () => playSoundInternal('square', 800, 1000, 0.05, 0.2);
export const playPaddleHit = () => playSoundInternal('square', 400, 400, 0.05, 0.2);
export const playWallHit = () => playSoundInternal('sine', 200, 200, 0.05, 0.1);
export const playMiss = () => playSoundInternal('sawtooth', 200, 100, 0.3, 0.3);


export const startBackgroundMusic = async () => { 
    if (!audioContext || musicSource) return;
    try {
        const lengthSeconds = 16;
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, sampleRate * lengthSeconds, sampleRate);
        const data = buffer.getChannelData(0);

        const bpm = 130;
        const beat = 60 / bpm;
        const notes = [
            { f: NOTE_FREQUENCIES['C3'], d: beat / 2 }, { f: NOTE_FREQUENCIES['E3'], d: beat / 2 },
            { f: NOTE_FREQUENCIES['G3'], d: beat / 2 }, { f: NOTE_FREQUENCIES['C4'], d: beat / 2 },
            { f: NOTE_FREQUENCIES['G3'], d: beat }, { f: NOTE_FREQUENCIES['E3'], d: beat },
            { f: NOTE_FREQUENCIES['D3'], d: beat / 2 }, { f: NOTE_FREQUENCIES['F3'], d: beat / 2 },
            { f: NOTE_FREQUENCIES['A3'], d: beat / 2 }, { f: NOTE_FREQUENCIES['D4'], d: beat / 2 },
            { f: NOTE_FREQUENCIES['A3'], d: beat }, { f: NOTE_FREQUENCIES['F3'], d: beat },
        ];

        let currentTime = 0;
        for (let i = 0; i < 4; i++) { // Repeat pattern to fill buffer
            for (const note of notes) {
                const startSample = Math.floor(currentTime * sampleRate);
                const endSample = Math.floor((currentTime + note.d) * sampleRate);
                for (let j = startSample; j < endSample; j++) {
                    if (j >= data.length) break;
                    const t = (j - startSample) / sampleRate;
                    // Square wave simulation with quick decay
                    const wave = Math.sin(2 * Math.PI * note.f * t) > 0 ? 0.2 : -0.2;
                    const decay = Math.exp(-t * 5);
                    data[j] = wave * decay;
                }
                currentTime += note.d;
            }
        }
        
        musicSource = audioContext.createBufferSource();
        musicSource.buffer = buffer;
        musicSource.loop = true;

        musicGain = audioContext.createGain();
        musicGain.gain.setValueAtTime(0, audioContext.currentTime);
        musicGain.gain.setTargetAtTime(desiredMusicVolume, audioContext.currentTime, 0.5);

        musicSource.connect(musicGain);
        musicGain.connect(audioContext.destination);
        musicSource.start(0);

    } catch (e) {
        console.error("Could not start background music:", e);
    }
};
export const setMusicVolume = (volume: number) => {
    desiredMusicVolume = volume;
    if (musicGain && audioContext) {
        musicGain.gain.setTargetAtTime(volume, audioContext.currentTime, 0.1);
    }
};

// --- Song Playback ---
export const NOTE_FREQUENCIES: { [key: string]: number } = {
    'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
    'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51, 'F6': 1396.91, 'F#6': 1479.98, 'G6': 1567.98, 'G#6': 1661.22, 'A6': 1760.00, 'A#6': 1864.66, 'B6': 1975.53,
    'C7': 2093.00, 'C#7': 2217.46, 'D7': 2349.32, 'D#7': 2489.02, 'E7': 2637.02, 'F7': 2793.83, 'F#7': 2959.96, 'G7': 3135.96, 'G#7': 3322.44, 'A7': 3520.00, 'A#7': 3729.31, 'B7': 3951.07,
};

const noteToFrequency = (note: string): number => NOTE_FREQUENCIES[note] || 0;
const durationToSeconds = (duration: string, bpm: number): number => {
    const beatDuration = 60 / bpm;
    switch (duration) {
        case 'whole': return beatDuration * 4;
        case 'half': return beatDuration * 2;
        case 'quarter': return beatDuration;
        case 'eighth': return beatDuration / 2;
        case 'sixteenth': return beatDuration / 4;
        default: return 0;
    }
};

const playNoteInternal = (frequency: number, startTime: number, duration: number, type: SoundType = 'square', volume: number = 0.5): AudioScheduledSourceNode | null => {
    if (!audioContext || audioContext.state !== 'running') return null;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.5, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
    return oscillator;
};

export const stopSong = () => {
    activeSources.forEach(source => { try { source.stop(0); } catch (e) {} });
    activeSources = [];
    if (songEndTimeoutId) {
        clearTimeout(songEndTimeoutId);
        songEndTimeoutId = null;
    }
};

export const playSong = (song: Song, bpm: number = 120, onEnd?: () => void) => {
    if (!audioContext || audioContext.state !== 'running') return;
    stopSong();
    let currentTime = audioContext.currentTime;
    let totalDuration = 0;
    const trackVolumes = [0.5, 0.4, 0.3, 0.45, 0.6, 0.35, 0.3, 0.25, 0.7, 0.5]; // Volumes for up to 10 tracks
    const trackTypes: SoundType[] = ['square', 'triangle', 'sine', 'sawtooth', 'square', 'sine', 'triangle', 'sawtooth', 'square', 'sine'];

    song.forEach((track, trackIndex) => {
        let trackTime = currentTime;
        track.forEach((note: SongNote) => {
            const freq = noteToFrequency(note.pitch);
            const dur = durationToSeconds(note.duration, bpm);
            if (freq > 0) {
                const source = playNoteInternal(freq, trackTime, dur * 0.95, trackTypes[trackIndex % trackTypes.length] || 'square', trackVolumes[trackIndex % trackVolumes.length] || 0.3);
                if(source) activeSources.push(source);
            }
            trackTime += dur;
        });
        if ((trackTime - currentTime) > totalDuration) {
            totalDuration = trackTime - currentTime;
        }
    });

    if (onEnd) {
        songEndTimeoutId = window.setTimeout(onEnd, totalDuration * 1000);
    }
};

const playNoteInContext = (context: BaseAudioContext, frequency: number, startTime: number, duration: number, type: SoundType = 'square', volume: number = 0.5) => {
    if (frequency <= 0) return;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.5, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
};

export const exportSongToWav = async (song: Song, bpm: number): Promise<Blob | null> => {
    if (!song || song.length === 0) return null;

    // Calculate total duration
    let totalDurationSeconds = 0;
    song.forEach(track => {
        let trackDuration = 0;
        track.forEach(note => {
            trackDuration += durationToSeconds(note.duration, bpm);
        });
        if (trackDuration > totalDurationSeconds) {
            totalDurationSeconds = trackDuration;
        }
    });

    if (totalDurationSeconds === 0) return null;
    
    const sampleRate = 44100;
    // Using an OfflineAudioContext to render the audio to a buffer
    const offlineCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * totalDurationSeconds), sampleRate);

    const trackVolumes = [0.5, 0.4, 0.3, 0.45, 0.6, 0.35, 0.3, 0.25, 0.7, 0.5];
    const trackTypes: SoundType[] = ['square', 'triangle', 'sine', 'sawtooth', 'square', 'sine', 'triangle', 'sawtooth', 'square', 'sine'];
    
    song.forEach((track, trackIndex) => {
        let currentTime = 0;
        track.forEach((note: SongNote) => {
            const freq = noteToFrequency(note.pitch);
            const dur = durationToSeconds(note.duration, bpm);
            if (freq > 0) {
                playNoteInContext(offlineCtx, freq, currentTime, dur * 0.95, trackTypes[trackIndex % trackTypes.length] || 'square', trackVolumes[trackIndex % trackVolumes.length] || 0.3);
            }
            currentTime += dur;
        });
    });

    try {
        const renderedBuffer = await offlineCtx.startRendering();
        return bufferToWav(renderedBuffer);
    } catch (e) {
        console.error("Error rendering song to WAV:", e);
        return null;
    }
};

// --- MIDI Playback ---
export const stopMidi = () => {
    activeMidiSources.forEach(source => { try { source.stop(0); } catch (e) {} });
    activeMidiSources = [];
    if (midiEndTimeoutId) {
        clearTimeout(midiEndTimeoutId);
        midiEndTimeoutId = null;
    }
};

export const playMidi = (notes: MidiNote[], onEnd?: () => void) => {
    if (!audioContext || audioContext.state !== 'running') return;
    stopMidi();
    
    let totalDuration = 0;
    const now = audioContext.currentTime;

    notes.forEach(note => {
        const freq = noteToFrequency(note.pitch);
        if (freq > 0) {
            const volume = (note.velocity / 127) * 0.7; // Convert velocity to gain level (0.7 max gain)
            const source = playNoteInternal(freq, now + note.startTime, note.duration, 'sine', volume);
            if(source) activeMidiSources.push(source);
        }
        const noteEndTime = note.startTime + note.duration;
        if (noteEndTime > totalDuration) {
            totalDuration = noteEndTime;
        }
    });

    if (onEnd) {
        midiEndTimeoutId = window.setTimeout(onEnd, totalDuration * 1000);
    }
};

export const exportMidiToWav = async (notes: MidiNote[]): Promise<Blob | null> => {
    if (!notes || notes.length === 0) return null;

    let totalDurationSeconds = 0;
    notes.forEach(note => {
        const noteEndTime = note.startTime + note.duration;
        if (noteEndTime > totalDurationSeconds) {
            totalDurationSeconds = noteEndTime;
        }
    });

    if (totalDurationSeconds === 0) return null;
    
    const sampleRate = 44100;
    const offlineCtx = new OfflineAudioContext(1, Math.ceil(sampleRate * totalDurationSeconds) + sampleRate, sampleRate); // Add 1s padding

    notes.forEach(note => {
        const freq = noteToFrequency(note.pitch);
        if (freq > 0) {
            const volume = (note.velocity / 127) * 0.7;
            playNoteInContext(offlineCtx, freq, note.startTime, note.duration, 'sine', volume);
        }
    });

    try {
        const renderedBuffer = await offlineCtx.startRendering();
        return bufferToWav(renderedBuffer);
    } catch (e) {
        console.error("Error rendering MIDI to WAV:", e);
        return null;
    }
};

// --- Voice Changer & Audio Processing ---
export interface EffectParameters {
    pitchShift?: number; delayTime?: number; delayFeedback?: number; radioFrequency?: number; clarityLevel?: number;
    aiLevel?: number; sunoVersion?: number; bitCrushLevel?: number; sampleRateCrushLevel?: number;
    bassBoostLevel?: number; snareBoost?: number; vibratoDepth?: number; humFrequency?: number;
    chorusDepth?: number; reverbRoomSize?: number; reverbWet?: number; lofiVintage?: number;
    remasterIntensity?: number;
}

export const decodeAudioFile = (file: File): Promise<AudioBuffer> => {
    return new Promise((resolve, reject) => {
        if (!audioContext) {
            initAudio();
            if (!audioContext) {
                return reject(new Error("AudioContext ไม่รองรับหรือไม่สามารถเริ่มต้นได้"));
            }
        }
        
        const reader = new FileReader();

        reader.onload = (event) => {
            const arrayBuffer = event.target?.result as ArrayBuffer;
            if (!arrayBuffer) {
                return reject(new Error("ไม่สามารถอ่านไฟล์ได้"));
            }
            
            audioContext!.decodeAudioData(arrayBuffer,
                (decodedBuffer) => {
                    if (decodedBuffer.length === 0) {
                         reject(new Error("การถอดรหัสล้มเหลว: ไฟล์เสียงว่างเปล่าหรือไม่ถูกต้อง"));
                         return;
                    }
                    resolve(decodedBuffer);
                },
                (decodeError) => {
                    console.error("Error decoding audio data:", decodeError);
                    reject(new Error("การถอดรหัสไฟล์ล้มเหลว: ไฟล์อาจเสียหาย, ไม่ใช่รูปแบบที่รองรับ, หรือถูกเข้ารหัส (DRM)"));
                }
            );
        };
        
        reader.onerror = (error) => {
            console.error("FileReader error:", error);
            reject(new Error("เกิดข้อผิดพลาดในการอ่านไฟล์"));
        };

        reader.readAsArrayBuffer(file);
    });
};

// --- Voice Changer Helpers ---
const createReverbImpulse = (context: BaseAudioContext, duration: number, decay: number, reverse: boolean = false): AudioBuffer => {
    const sampleRate = context.sampleRate;
    const length = sampleRate * duration;
    const impulse = context.createBuffer(2, length, sampleRate);
    const impulseL = impulse.getChannelData(0);
    const impulseR = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        const n = reverse ? length - i : i;
        impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
        impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
    }
    return impulse;
};

const createDistortionCurve = (amount: number): Float32Array => {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
        const x = i * 2 / n_samples - 1;
        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
};

const createBitCrusherCurve = (bits: number): Float32Array => {
    const step = Math.pow(0.5, bits);
    const n_samples = 4096;
    const curve = new Float32Array(n_samples);
    for (let i = 0; i < n_samples; i++) {
        const x = (i - (n_samples / 2)) / (n_samples / 2); // -1 to 1
        curve[i] = step * Math.floor(x / step);
    }
    return curve;
};


export const applyVoiceEffect = async (file: File, effect: string, params: EffectParameters): Promise<AudioBuffer> => {
    if (!audioContext) {
        initAudio();
        if (!audioContext) throw new Error("AudioContext is not available.");
    }

    let originalBuffer = await decodeAudioFile(file);

    // --- Manual Pre-processing for effects that require buffer manipulation ---
    if ((effect === '8-bit-classic') && params.sampleRateCrushLevel) {
        const minSR = 2000;
        const maxSR = 22050;
        // Map 1-40 slider to sample rate. Lower value = lower sample rate = more crushed.
        const targetSampleRate = minSR + ((40 - params.sampleRateCrushLevel) / 39) * (maxSR - minSR);
        const step = Math.max(1, Math.floor(originalBuffer.sampleRate / targetSampleRate));

        const crushedBuffer = audioContext.createBuffer(originalBuffer.numberOfChannels, originalBuffer.length, originalBuffer.sampleRate);
        for (let channel = 0; channel < originalBuffer.numberOfChannels; channel++) {
            const originalData = originalBuffer.getChannelData(channel);
            const crushedData = crushedBuffer.getChannelData(channel);
            let lastSample = 0;
            for (let i = 0; i < originalData.length; i++) {
                if (i % step === 0) {
                    lastSample = originalData[i];
                }
                crushedData[i] = lastSample;
            }
        }
        originalBuffer = crushedBuffer;
    }


    if (effect === 'reverse') {
        const offlineCtx = new OfflineAudioContext(originalBuffer.numberOfChannels, originalBuffer.length, originalBuffer.sampleRate);
        const source = offlineCtx.createBufferSource();
        const reversedBuffer = offlineCtx.createBuffer(originalBuffer.numberOfChannels, originalBuffer.length, originalBuffer.sampleRate);
        for (let i = 0; i < originalBuffer.numberOfChannels; i++) {
            const channelData = new Float32Array(originalBuffer.getChannelData(i));
            reversedBuffer.copyToChannel(channelData.reverse(), i);
        }
        source.buffer = reversedBuffer;
        source.connect(offlineCtx.destination);
        source.start(0);
        return offlineCtx.startRendering();
    }
    
    const playbackRate = (effect === 'pitch-shift' ? Math.pow(2, (params.pitchShift ?? 0) / 12) : 1) * (effect === 'monster' ? 0.7 : 1) * (effect === 'ai-narrator' ? 0.95 : 1);

    const offlineContext = new OfflineAudioContext(originalBuffer.numberOfChannels, Math.floor(originalBuffer.duration * (1 / playbackRate) * originalBuffer.sampleRate), originalBuffer.sampleRate);
    const source = offlineContext.createBufferSource();
    source.buffer = originalBuffer;
    source.playbackRate.value = playbackRate;

    let lastNode: AudioNode = source;
    const masterGain = offlineContext.createGain();
    masterGain.gain.value = 0.7;

    switch (effect) {
        case 'robot': {
            const outputGain = offlineContext.createGain();
            outputGain.gain.value = 0.0; // Start silent

            const carrier = offlineContext.createOscillator();
            carrier.type = 'square';
            carrier.frequency.value = 150; // Base pitch
            carrier.start(0);

            const filter = offlineContext.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 3000;
            filter.Q.value = 5;
            
            const pitchModulationGain = offlineContext.createGain();
            // A higher value makes the pitch follow the input more dramatically, creating a less monotonic "singing" effect.
            pitchModulationGain.gain.value = 1000; // Increased from 400

            source.connect(pitchModulationGain);
            pitchModulationGain.connect(carrier.frequency);

            carrier.connect(filter);
            filter.connect(outputGain);

            const envelopeFollower = offlineContext.createBiquadFilter();
            envelopeFollower.type = 'lowpass';
            envelopeFollower.frequency.value = 20;

            const n_samples = 256;
            const curve = new Float32Array(n_samples);
            for(let i=0; i<n_samples; ++i) {
                const x = (i / (n_samples-1)) * 2 - 1;
                curve[i] = Math.abs(x) * 1.2;
            }
            const rectifier = offlineContext.createWaveShaper();
            rectifier.curve = curve;
            
            source.connect(rectifier);
            rectifier.connect(envelopeFollower);
            envelopeFollower.connect(outputGain.gain);

            lastNode = outputGain;
            break;
        }
        case 'echo': {
            const delay = offlineContext.createDelay();
            delay.delayTime.value = params.delayTime ?? 0.5;
            const feedback = offlineContext.createGain();
            feedback.gain.value = params.delayFeedback ?? 0.5;
            lastNode.connect(delay);
            delay.connect(feedback);
            feedback.connect(delay);
            lastNode.connect(masterGain); // Dry signal
            delay.connect(masterGain); // Wet signal
            lastNode = masterGain; // Re-route to prevent double connection at the end
            break;
        }
        case 'old-radio': {
            const filter = offlineContext.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = params.radioFrequency ?? 1500;
            filter.Q.value = 12; // Narrower band
            lastNode.connect(filter);
            lastNode = filter;
            
            const distortion = offlineContext.createWaveShaper();
            distortion.curve = createDistortionCurve(150); // More distortion
            lastNode.connect(distortion);
            lastNode = distortion;
            break;
        }
        case 'old-computer': {
            // Hum
            const hum = offlineContext.createOscillator();
            hum.type = 'sine';
            hum.frequency.value = params.humFrequency ?? 60;
            const humGain = offlineContext.createGain();
            humGain.gain.value = 0.05; // very low volume
            hum.connect(humGain);
            humGain.connect(masterGain);
            hum.start(0);
            
            // Main signal path
            const filter = offlineContext.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 2000;
            filter.Q.value = 8;
            lastNode.connect(filter);
            lastNode = filter;
            
            const distortion = offlineContext.createWaveShaper();
            distortion.curve = createDistortionCurve(50);
            lastNode.connect(distortion);
            lastNode = distortion;
            break;
        }
        case 'telephone': {
            const filter = offlineContext.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 1800;
            filter.Q.value = 15; // Very narrow band
            lastNode.connect(filter);
            lastNode = filter;
            break;
        }
        case 'clarity-adjust': {
            const clarity = params.clarityLevel ?? 0;
            const treble = offlineContext.createBiquadFilter();
            treble.type = 'highshelf';
            treble.frequency.value = 3000;
            treble.gain.value = clarity * 2;
            lastNode.connect(treble);
            lastNode = treble;
            break;
        }
         case '8-bit-classic': {
            const bits = params.bitCrushLevel ?? 8;
            const bitCrusher = offlineContext.createWaveShaper();
            bitCrusher.curve = createBitCrusherCurve(bits);
            lastNode.connect(bitCrusher);
            lastNode = bitCrusher;
            break;
        }
        case 'underwater': {
            const lowpass = offlineContext.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.value = 400; // Lower frequency
            lowpass.Q.value = 2;
            lastNode.connect(lowpass);
            lastNode = lowpass;
            break;
        }
        case 'monster': {
            // playbackRate already adjusted
            const distortion = offlineContext.createWaveShaper();
            distortion.curve = createDistortionCurve(60); // More distortion
            lastNode.connect(distortion);
            lastNode = distortion;
            break;
        }
        case 'electric-piano': {
            const outputGain = offlineContext.createGain();
            outputGain.gain.value = 0.0; // Start silent.

            const carrier1 = offlineContext.createOscillator();
            carrier1.type = 'sawtooth';
            carrier1.frequency.value = 150; 
            carrier1.detune.value = -7; 
            carrier1.start(0);

            const carrier2 = offlineContext.createOscillator();
            carrier2.type = 'square';
            carrier2.frequency.value = 150;
            carrier2.detune.value = 7; 
            carrier2.start(0);

            const filter = offlineContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 400; 
            filter.Q.value = 7; 

            carrier1.connect(filter);
            carrier2.connect(filter);
            filter.connect(outputGain);

            const modulationGain = offlineContext.createGain();
            // INCREASED SIGNIFICANTLY: This makes the pitch follow the voice's melody much more aggressively.
            modulationGain.gain.value = 2500; 

            source.connect(modulationGain);
            modulationGain.connect(carrier1.frequency);
            modulationGain.connect(carrier2.frequency);
            
            const filterModulationGain = offlineContext.createGain();
            // INCREASED SIGNIFICANTLY: This creates a much more dynamic "wah" effect that follows the voice.
            filterModulationGain.gain.value = 4000;
            source.connect(filterModulationGain);
            filterModulationGain.connect(filter.frequency);

            const envelopeFollower = offlineContext.createBiquadFilter();
            envelopeFollower.type = 'lowpass';
            envelopeFollower.frequency.value = 15;

            const n_samples = 256;
            const curve = new Float32Array(n_samples);
            for(let i=0; i<n_samples; ++i) {
                const x = (i / (n_samples-1)) * 2 - 1;
                curve[i] = Math.abs(x) * 2.5;
            }
            const rectifier = offlineContext.createWaveShaper();
            rectifier.curve = curve;
            
            source.connect(rectifier);
            rectifier.connect(envelopeFollower);
            envelopeFollower.connect(outputGain.gain);

            lastNode = outputGain;
            break;
        }
        case 'vibrato': {
            const lfo = offlineContext.createOscillator();
            lfo.frequency.value = 6;
            const gain = offlineContext.createGain();
            gain.gain.value = params.vibratoDepth ?? 10;
            lfo.connect(gain);
            gain.connect(source.playbackRate); // Modulates pitch
            lfo.start(0);
            break;
        }
        case 'chorus': {
            const delay = offlineContext.createDelay();
            delay.delayTime.value = 0.025;
            const lfo = offlineContext.createOscillator();
            lfo.frequency.value = 0.1 * (params.chorusDepth ?? 5);
            const lfoGain = offlineContext.createGain();
            lfoGain.gain.value = 0.005;
            lfo.connect(lfoGain);
            lfoGain.connect(delay.delayTime);
            lastNode.connect(masterGain); // Dry signal
            lastNode.connect(delay);
            delay.connect(masterGain); // Wet signal
            lastNode = masterGain;
            lfo.start(0);
            break;

        }
        case 'reverb': {
            const convolver = offlineContext.createConvolver();
            const roomSize = (params.reverbRoomSize ?? 4) / 5;
            convolver.buffer = createReverbImpulse(offlineContext, roomSize, 2);
            const wetGain = offlineContext.createGain();
            wetGain.gain.value = params.reverbWet ?? 0.5;
            lastNode.connect(masterGain); // Dry
            lastNode.connect(convolver);
            convolver.connect(wetGain);
            wetGain.connect(masterGain); // Wet
            lastNode = masterGain;
            break;
        }
        case 'bass-boost': {
            const bass = offlineContext.createBiquadFilter();
            bass.type = 'lowshelf';
            bass.frequency.value = 250;
            bass.gain.value = params.bassBoostLevel ?? 6;
            lastNode.connect(bass);
            lastNode = bass;
            break;
        }
        case 'ai-lofi-remix': {
            const lowpass = offlineContext.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.value = 3000;
            const distortion = offlineContext.createWaveShaper();
            distortion.curve = createDistortionCurve((params.lofiVintage ?? 5) * 5);
            lastNode.connect(lowpass);
            lowpass.connect(distortion);
            lastNode = distortion;
            break;
        }
        case 'ai-voice-enhancer': {
            const compressor = offlineContext.createDynamicsCompressor();
            compressor.threshold.value = -24;
            compressor.knee.value = 30;
            compressor.ratio.value = 12;
            compressor.attack.value = 0.003;
            compressor.release.value = 0.25;

            const treble = offlineContext.createBiquadFilter();
            treble.type = 'highshelf';
            treble.frequency.value = 3200;
            treble.gain.value = params.remasterIntensity ?? 5;

            lastNode.connect(compressor);
            compressor.connect(treble);
            lastNode = treble;
            break;
        }
        case 'ai-noise-removal': {
            const noiseGate = offlineContext.createDynamicsCompressor();
            noiseGate.threshold.value = -50;
            noiseGate.knee.value = 40;
            noiseGate.ratio.value = 12;
            noiseGate.attack.value = 0;
            noiseGate.release.value = 0.25;

            const lowpass = offlineContext.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.value = 4500;

            lastNode.connect(noiseGate);
            noiseGate.connect(lowpass);
            lastNode = lowpass;
            break;
        }
        case 'ai-vocal-isolation': {
            const bandpass = offlineContext.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.frequency.value = 1800; // Center of vocal range
            bandpass.Q.value = 2.5;
            lastNode.connect(bandpass);
            lastNode = bandpass;
            break;
        }
        case 'ai-narrator': {
            // Pitch is already handled by playbackRate
            const compressor = offlineContext.createDynamicsCompressor();
            compressor.threshold.value = -20;
            compressor.ratio.value = 8;
            lastNode.connect(compressor);
            
            const convolver = offlineContext.createConvolver();
            convolver.buffer = createReverbImpulse(offlineContext, 0.5, 1); // Short, subtle reverb
            const wetGain = offlineContext.createGain();
            wetGain.gain.value = 0.15;

            compressor.connect(masterGain); // Dry
            compressor.connect(convolver);
            convolver.connect(wetGain);
            wetGain.connect(masterGain); // Wet
            lastNode = masterGain;
            break;
        }
        // Default case for effects with no specific node chain (like pitch-shift)
        default:
            break;
    }

    if (lastNode !== masterGain) {
        lastNode.connect(masterGain);
    }
    masterGain.connect(offlineContext.destination);
    
    source.start(0);
    return offlineContext.startRendering();
};


export const playAudioBuffer = (buffer: AudioBuffer): AudioBufferSourceNode => {
    if (!audioContext) throw new Error("AudioContext not available.");
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
    return source;
};

const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
};

const interleave = (channels: Float32Array[]): Float32Array => {
    if (channels.length === 0) return new Float32Array(0);
    const frameCount = channels[0].length;
    const channelCount = channels.length;
    const result = new Float32Array(frameCount * channelCount);

    let offset = 0;
    for (let i = 0; i < frameCount; i++) {
        for (let j = 0; j < channelCount; j++) {
            result[offset++] = channels[j][i];
        }
    }
    return result;
};

export const bufferToWav = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferOut = new ArrayBuffer(length);
    const view = new DataView(bufferOut);
    const channels: Float32Array[] = [];
    let sample;
    let offset = 0;

    for (let i = 0; i < numOfChan; i++) {
        channels.push(buffer.getChannelData(i));
    }
    const interleaved = interleave(channels);

    writeString(view, offset, 'RIFF'); offset += 4;
    view.setUint32(offset, length - 8, true); offset += 4;
    writeString(view, offset, 'WAVE'); offset += 4;
    writeString(view, offset, 'fmt '); offset += 4;
    view.setUint32(offset, 16, true); offset += 4; // Sub-chunk size
    view.setUint16(offset, 1, true); offset += 2; // Audio format 1=PCM
    view.setUint16(offset, numOfChan, true); offset += 2;
    view.setUint32(offset, buffer.sampleRate, true); offset += 4;
    view.setUint32(offset, buffer.sampleRate * 2 * numOfChan, true); offset += 4; // Byte rate
    view.setUint16(offset, numOfChan * 2, true); offset += 2; // Block align
    view.setUint16(offset, 16, true); offset += 2; // Bits per sample
    writeString(view, offset, 'data'); offset += 4;
    view.setUint32(offset, length - 44, true); offset += 4;

    for (let i = 0; i < interleaved.length; i++) {
        sample = Math.max(-1, Math.min(1, interleaved[i]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, sample, true);
        offset += 2;
    }

    return new Blob([view], { type: 'audio/wav' });
};

// --- Sound Effect Generator ---
export const playSoundFromParams = (params: SoundEffectParameters) => {
    playSoundInternal(params.waveType, params.startFrequency, params.endFrequency, params.duration, params.volume);
};

const playSoundInContext = (context: OfflineAudioContext, type: SoundType, startFreq: number, endFreq: number, duration: number, volume: number = 0.3) => {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const currentTime = 0; // Offline context starts at 0

    oscillator.type = type;
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.01);
    
    oscillator.frequency.setValueAtTime(startFreq, currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(endFreq, currentTime + duration);
    
    gainNode.gain.exponentialRampToValueAtTime(0.0001, currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(currentTime);
    oscillator.stop(currentTime + duration);
};

export const exportSoundEffectToWav = async (params: SoundEffectParameters): Promise<Blob | null> => {
    const { waveType, startFrequency, endFrequency, duration, volume } = params;
    if (duration <= 0) return null;

    const sampleRate = 44100;
    const offlineCtx = new OfflineAudioContext(1, Math.ceil(sampleRate * duration), sampleRate);

    playSoundInContext(offlineCtx, waveType, startFrequency, endFrequency, duration, volume);

    try {
        const renderedBuffer = await offlineCtx.startRendering();
        return bufferToWav(renderedBuffer);
    } catch (e) {
        console.error("Error rendering sound effect to WAV:", e);
        return null;
    }
};

export const playMusicalNote = (frequency: number, type: SoundType, duration: number = 0.4) => {
    if (frequency > 0) {
        playSoundInternal(type, frequency, frequency, duration, 0.4);
    }
};
