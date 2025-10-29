import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PageWrapper, PageHeader } from './PageComponents';
import * as audioService from '../services/audioService';
import { PlayIcon } from './icons/PlayIcon';
import { StopIcon } from './icons/StopIcon';
import { useLanguage } from '../contexts/LanguageContext';
import { TrashIcon } from './icons/TrashIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { useCredits } from '../contexts/CreditContext';

const pitches = ['B5', 'A#5', 'A5', 'G#5', 'G5', 'F#5', 'F5', 'E5', 'D#5', 'D5', 'C#5', 'C5', 'B4', 'A#4', 'A4', 'G#4', 'G4', 'F#4', 'F4', 'E4', 'D#4', 'D4', 'C#4', 'C4', 'B3', 'A#3', 'A3', 'G#3', 'G3', 'F#3', 'F3', 'E3', 'D#3', 'D3', 'C#3', 'C3'];
const defaultSteps = 16;
const waveforms: audioService.SoundType[] = ['square', 'sine', 'sawtooth', 'triangle', 'noise'];

export const PixelSequencerPage: React.FC<{
    onClose: () => void;
    playSound: (player: () => void) => void;
}> = ({ onClose, playSound }) => {
    const { t } = useLanguage();
    const [notes, setNotes] = useState<Set<string>>(new Set());
    const [instrument, setInstrument] = useState<audioService.SoundType>('square');
    const [bpm, setBpm] = useState(120);
    const [numSteps, setNumSteps] = useState(defaultSteps);
    const [numStepsInput, setNumStepsInput] = useState(String(defaultSteps));
    const [isPlaying, setIsPlaying] = useState(false);
    const [playheadCol, setPlayheadCol] = useState<number | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const { addCredits } = useCredits();

    const intervalRef = useRef<number | null>(null);
    const notesRef = useRef(notes);
    notesRef.current = notes;

    const toggleNote = async (pitch: string, step: number) => {
        const noteId = `${pitch}:${step}`;
        const newNotes = new Set(notes);
        if (newNotes.has(noteId)) {
            newNotes.delete(noteId);
        } else {
            newNotes.add(noteId);
            await addCredits(1);
            const freq = audioService.NOTE_FREQUENCIES[pitch];
            if (freq || instrument === 'noise') {
                audioService.playMusicalNote(freq, instrument, 0.1);
            }
        }
        setNotes(newNotes);
    };

    const stopPlayback = useCallback(() => {
        setIsPlaying(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setPlayheadCol(null);
    }, []);

    const startPlayback = useCallback(() => {
        if (numSteps <= 0) return;
        setIsPlaying(true);
        setPlayheadCol(0);

        const playStep = (step: number) => {
            setPlayheadCol(step);
            pitches.forEach(pitch => {
                if (notesRef.current.has(`${pitch}:${step}`)) {
                    const freq = audioService.NOTE_FREQUENCIES[pitch];
                    if (freq || instrument === 'noise') {
                        audioService.playMusicalNote(freq, instrument, 0.2);
                    }
                }
            });
            return (step + 1) % numSteps;
        };

        let currentStep = 0;
        intervalRef.current = window.setInterval(() => {
            currentStep = playStep(currentStep);
        }, (60 * 1000) / bpm / 4);

    }, [bpm, instrument, numSteps]);

    const handlePlayToggle = () => {
        playSound(audioService.playClick);
        if (isPlaying) {
            stopPlayback();
        } else {
            startPlayback();
        }
    };
    
    const handleDownload = async () => {
        if (isDownloading || notes.size === 0) return;
    
        playSound(audioService.playDownload);
        setIsDownloading(true);
    
        try {
            const wavBlob = await audioService.exportSequencerToWav(notes, bpm, instrument, pitches, numSteps);
            if (wavBlob) {
                await addCredits(1);
                const url = URL.createObjectURL(wavBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `pixel-sequence-${bpm}bpm-${instrument}.wav`;
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                throw new Error("Failed to create WAV file.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsDownloading(false);
        }
    };

    const clearGrid = () => {
        playSound(audioService.playTrash);
        if(isPlaying) stopPlayback();
        setNotes(new Set());
    };
    
    const handleNumStepsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setNumStepsInput(val);
        const parsed = parseInt(val, 10);
        if (!isNaN(parsed) && parsed >= 4 && parsed <= 100) {
            setNumSteps(parsed);
        }
    };


    useEffect(() => {
        if (isPlaying) {
            stopPlayback();
            startPlayback();
        }
    }, [bpm, instrument, isPlaying, startPlayback, stopPlayback, numSteps]);
    
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);
    
    const handleClose = () => {
        stopPlayback();
        onClose();
    };


    return (
        <PageWrapper>
            <PageHeader title={t('sequencer.title')} onBack={handleClose} />
            <main id="main-content" className="w-full max-w-5xl flex-grow flex flex-col items-center gap-4 p-2 font-sans">
                <div className="w-full grid grid-cols-2 md:grid-cols-5 gap-4 p-2 bg-black/30 border-2 border-border-secondary">
                    <button onClick={handlePlayToggle} className="p-3 bg-brand-cyan text-black border-4 border-border-primary shadow-pixel flex items-center justify-center gap-2">
                        {isPlaying ? <StopIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                        <span className="font-press-start text-sm">{isPlaying ? t('sequencer.stop') : t('sequencer.play')}</span>
                    </button>
                    <div className="flex flex-col">
                        <label htmlFor="bpm-slider" className="text-xs font-press-start text-brand-cyan flex justify-between">
                            <span>{t('sequencer.bpm')}</span>
                            <span>{bpm}</span>
                        </label>
                        <input id="bpm-slider" type="range" min="40" max="240" value={bpm} onChange={e => setBpm(Number(e.target.value))} className="w-full"/>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs font-press-start text-brand-cyan mb-1">{t('sequencer.instrument')}</label>
                        <select value={instrument} onChange={e => setInstrument(e.target.value as audioService.SoundType)} className="p-1 bg-surface-primary border border-border-secondary">
                           {waveforms.map(wf => <option key={wf} value={wf}>{wf}</option>)}
                        </select>
                    </div>
                     <div className="flex flex-col">
                        <label htmlFor="steps-input" className="text-xs font-press-start text-brand-cyan mb-1">{t('sequencer.steps')} (4-100)</label>
                        <input id="steps-input" type="number" value={numStepsInput} onChange={handleNumStepsChange} className="w-full p-1 bg-surface-primary border border-border-secondary text-center"/>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={clearGrid} className="flex-1 p-2 bg-brand-magenta text-white border-4 border-border-primary shadow-pixel flex items-center justify-center gap-2">
                            <TrashIcon className="w-5 h-5" />
                            <span className="font-press-start text-xs">{t('sequencer.clear')}</span>
                        </button>
                         <button onClick={handleDownload} disabled={isDownloading || notes.size === 0} className="flex-1 p-2 bg-brand-yellow text-black border-4 border-border-primary shadow-pixel flex items-center justify-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed">
                            <DownloadIcon className="w-5 h-5" />
                            <span className="font-press-start text-xs">{isDownloading ? '...' : t('sequencer.download')}</span>
                        </button>
                    </div>
                </div>
                
                <div className="w-full overflow-x-auto flex-grow bg-black/50 border-4 border-brand-light">
                    <div className="flex" style={{ width: `${numSteps * 2.5}rem` }}>
                        <div className="flex flex-col text-[10px] font-press-start text-brand-cyan sticky left-0 bg-background z-10">
                            {pitches.map(pitch => (
                                <div key={pitch} className={`h-8 flex-shrink-0 w-12 flex items-center justify-center pr-2 border-r border-b border-border-secondary/20 ${pitch.includes('#') ? 'bg-black/40' : 'bg-black/20'}`}>
                                    {pitch}
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex-grow flex">
                            {Array.from({ length: numSteps }).map((_, step) => (
                                <div key={step} className={`flex flex-col w-10 flex-shrink-0 transition-colors ${playheadCol === step ? 'bg-brand-yellow/30' : ''} ${step % 4 === 0 ? 'border-l-2 border-border-secondary/70' : 'border-l border-border-secondary/30'}`}>
                                    {pitches.map(pitch => {
                                        const noteId = `${pitch}:${step}`;
                                        const isActive = notes.has(noteId);
                                        return (
                                            <button
                                                key={noteId}
                                                onClick={() => toggleNote(pitch, step)}
                                                className={`h-8 border-b border-border-secondary/20 transition-colors ${isActive ? 'bg-brand-cyan hover:bg-brand-cyan/80' : 'hover:bg-brand-light/10'}`}
                                                aria-label={`Toggle note ${pitch} at step ${step + 1}`}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </PageWrapper>
    );
};