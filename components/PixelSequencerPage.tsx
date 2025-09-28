import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PageWrapper, PageHeader } from './PageComponents';
import * as audioService from '../services/audioService';
import { PlayIcon } from './icons/PlayIcon';
import { StopIcon } from './icons/StopIcon';
import { useLanguage } from '../contexts/LanguageContext';
import { TrashIcon } from './icons/TrashIcon';
import { DownloadIcon } from './icons/DownloadIcon';

const pitches = ['C5', 'B4', 'A#4', 'A4', 'G#4', 'G4', 'F#4', 'F4', 'E4', 'D#4', 'D4', 'C#4', 'C4'];
const numSteps = 16;
const waveforms: audioService.SoundType[] = ['square', 'sine', 'sawtooth', 'triangle', 'noise'];

export const PixelSequencerPage: React.FC<{
    onClose: () => void;
    playSound: (player: () => void) => void;
}> = ({ onClose, playSound }) => {
    const { t } = useLanguage();
    const [notes, setNotes] = useState<Set<string>>(new Set());
    const [instrument, setInstrument] = useState<audioService.SoundType>('square');
    const [bpm, setBpm] = useState(120);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playheadCol, setPlayheadCol] = useState<number | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const intervalRef = useRef<number | null>(null);
    const notesRef = useRef(notes);
    notesRef.current = notes;

    const toggleNote = (pitch: string, step: number) => {
        const noteId = `${pitch}:${step}`;
        const newNotes = new Set(notes);
        if (newNotes.has(noteId)) {
            newNotes.delete(noteId);
        } else {
            newNotes.add(noteId);
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

    }, [bpm, instrument]);

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
            const wavBlob = await audioService.exportSequencerToWav(notes, bpm, instrument, pitches);
            if (wavBlob) {
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
            // In a real app, you might want to show an error to the user here.
        } finally {
            setIsDownloading(false);
        }
    };

    const clearGrid = () => {
        playSound(audioService.playTrash);
        if(isPlaying) stopPlayback();
        setNotes(new Set());
    };

    useEffect(() => {
        if (isPlaying) {
            stopPlayback();
            startPlayback();
        }
    }, [bpm, instrument, isPlaying, startPlayback, stopPlayback]);
    
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
            <main id="main-content" className="w-full max-w-4xl flex-grow flex flex-col items-center gap-4 p-2 font-sans">
                <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 p-2 bg-black/30 border-2 border-border-secondary">
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
                    <div className="flex" style={{ minWidth: '800px' }}>
                        <div className="flex flex-col text-xs font-press-start text-brand-cyan sticky left-0 bg-background z-10">
                            {pitches.map(pitch => (
                                <div key={pitch} className={`h-8 flex items-center justify-center pr-2 border-r border-b border-border-secondary/20 ${pitch.includes('#') ? 'bg-black/40' : 'bg-black/20'}`}>
                                    {pitch}
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex-grow flex">
                            {Array.from({ length: numSteps }).map((_, step) => (
                                <div key={step} className={`flex flex-col flex-1 transition-colors ${playheadCol === step ? 'bg-brand-yellow/30' : ''} ${step % 4 === 0 ? 'border-l-2 border-border-secondary/70' : 'border-l border-border-secondary/30'}`}>
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