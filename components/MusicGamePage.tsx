import React, { useState, useCallback } from 'react';
import { PageWrapper, PageHeader } from './PageComponents';
import * as audioService from '../services/audioService';

// Define the keyboard layout
const keys = [
    { note: 'C4', type: 'white' }, { note: 'C#4', type: 'black' },
    { note: 'D4', type: 'white' }, { note: 'D#4', type: 'black' },
    { note: 'E4', type: 'white' },
    { note: 'F4', type: 'white' }, { note: 'F#4', type: 'black' },
    { note: 'G4', type: 'white' }, { note: 'G#4', type: 'black' },
    { note: 'A4', type: 'white' }, { note: 'A#4', type: 'black' },
    { note: 'B4', type: 'white' },
    { note: 'C5', type: 'white' },
];

const waveforms: audioService.SoundType[] = ['square', 'sine', 'sawtooth', 'triangle'];

export const MusicGamePage: React.FC<{
    onClose: () => void;
    playSound: (player: () => void) => void;
}> = ({ onClose, playSound }) => {
    const [waveform, setWaveform] = useState<audioService.SoundType>('square');
    const [activeNote, setActiveNote] = useState<string | null>(null);

    const playNote = useCallback((note: string) => {
        const freq = audioService.NOTE_FREQUENCIES[note];
        if (freq) {
            audioService.playMusicalNote(freq, waveform, 0.4);
            setActiveNote(note);
            setTimeout(() => setActiveNote(null), 200);
        }
    }, [waveform]);

    return (
        <PageWrapper>
            <PageHeader title="Pixel Synthesizer" onBack={onClose} />
            <main id="main-content" className="w-full max-w-2xl flex-grow flex flex-col items-center justify-center gap-6 p-4">
                <div className="w-full max-w-lg space-y-2">
                    <label className="font-press-start text-sm text-brand-cyan">Waveform:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {waveforms.map(wf => (
                            <button
                                key={wf}
                                onClick={() => { playSound(audioService.playToggle); setWaveform(wf); }}
                                className={`p-2 border-2 border-brand-light font-press-start text-xs transition-all ${waveform === wf ? 'bg-brand-yellow text-black' : 'bg-brand-cyan/20 text-white hover:bg-brand-cyan/40'}`}
                            >
                                {wf}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative w-full max-w-2xl h-48 bg-black border-4 border-brand-light shadow-pixel select-none" aria-label="คีย์บอร์ดซินธิไซเซอร์">
                    {keys.filter(k => k.type === 'white').map((key, index, whiteKeys) => (
                        <button
                            key={key.note}
                            onMouseDown={() => playNote(key.note)}
                            onTouchStart={(e) => { e.preventDefault(); playNote(key.note); }}
                            className={`absolute top-0 bottom-0 w-[12.5%] border-l-2 border-black transition-colors ${activeNote === key.note ? 'bg-brand-cyan' : 'bg-brand-light hover:bg-brand-light/80'}`}
                            style={{ left: `${index * 12.5}%` }}
                            aria-label={`เล่นโน้ต ${key.note}`}
                        >
                            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 font-press-start text-black text-xs pointer-events-none">{key.note.slice(0, -1)}</span>
                        </button>
                    ))}
                     {keys.filter(k => k.type === 'black').map((key) => {
                        const whiteKeysBefore = keys.slice(0, keys.findIndex(k => k.note === key.note)).filter(k => k.type === 'white').length;
                        return (
                             <button
                                key={key.note}
                                onMouseDown={(e) => { e.stopPropagation(); playNote(key.note); }}
                                onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); playNote(key.note); }}
                                className={`absolute top-0 h-2/3 w-[8%] bg-black border-2 border-brand-light transition-colors z-10 ${activeNote === key.note ? 'bg-gray-600' : 'hover:bg-gray-800'}`}
                                style={{ left: `${whiteKeysBefore * 12.5 - 4}%` }}
                                aria-label={`เล่นโน้ต ${key.note}`}
                            />
                        )
                     })}
                </div>
                 <p className="font-sans text-sm text-center text-brand-light/80">
                    คลิกหรือแตะที่คีย์บอร์ดเพื่อเล่น! ลองเปลี่ยน Waveform เพื่อสร้างเสียงที่แตกต่างกัน
                </p>
            </main>
        </PageWrapper>
    );
};
