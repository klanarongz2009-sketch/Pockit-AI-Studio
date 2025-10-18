import React, { useState, useCallback, useEffect } from 'react';
import { PageWrapper, PageHeader } from './PageComponents';
import * as audioService from '../services/audioService';
import { PlayIcon } from './icons/PlayIcon';
import { StopIcon } from './icons/StopIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { LoadingSpinner } from './LoadingSpinner';
import type { SoundEffectParameters, Song } from '../services/geminiService';
import { AudioVisualizer } from './icons/AudioVisualizer';
import { useCredits } from '../contexts/CreditContext';

interface MusicAndSoundPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
}

interface LibrarySoundEffect {
  id: string;
  name: string;
  params: SoundEffectParameters;
}

interface LibraryMusicLoop {
  id: string;
  name: string;
  song: Song;
  bpm: number;
}

const soundEffects: LibrarySoundEffect[] = [
    { id: 'sfx_laser', name: 'Laser Shot', params: { name: 'Laser', type: 'square', startFreq: 880, endFreq: 440, duration: 0.2, volume: 0.2 } },
    { id: 'sfx_jump', name: 'Jump', params: { name: 'Jump', type: 'sine', startFreq: 440, endFreq: 880, duration: 0.15, volume: 0.3 } },
    { id: 'sfx_coin', name: 'Coin Pickup', params: { name: 'Coin', type: 'triangle', startFreq: 1200, endFreq: 1800, duration: 0.08, volume: 0.25 } },
    { id: 'sfx_explosion', name: 'Explosion', params: { name: 'Explosion', type: 'sawtooth', startFreq: 400, endFreq: 50, duration: 0.5, volume: 0.4 } },
    { id: 'sfx_powerup', name: 'Power Up', params: { name: 'PowerUp', type: 'square', startFreq: 523, endFreq: 1046, duration: 0.2, volume: 0.3 } },
    { id: 'sfx_hit', name: 'Hit Damage', params: { name: 'Hit', type: 'square', startFreq: 200, endFreq: 50, duration: 0.2, volume: 0.3 } },
    { id: 'sfx_select', name: 'Menu Select', params: { name: 'Select', type: 'square', startFreq: 1000, endFreq: 1000, duration: 0.05, volume: 0.1 } },
    { id: 'sfx_error', name: 'Error/Fail', params: { name: 'Error', type: 'sawtooth', startFreq: 200, endFreq: 50, duration: 0.4, volume: 0.3 } },
    { id: 'sfx_ui_click', name: 'UI Click', params: { name: 'UI Click', type: 'square', startFreq: 440, endFreq: 480, duration: 0.05, volume: 0.15 } },
    { id: 'sfx_swoosh', name: 'Swoosh', params: { name: 'Swoosh', type: 'sine', startFreq: 1200, endFreq: 100, duration: 0.2, volume: 0.15 } },
    { id: 'sfx_camera', name: 'Camera Shutter', params: { name: 'Camera Shutter', type: 'square', startFreq: 3000, endFreq: 500, duration: 0.1, volume: 0.25 } },
    { id: 'sfx_brick_hit', name: 'Brick Hit', params: { name: 'Brick Hit', type: 'square', startFreq: 1500, endFreq: 1500, duration: 0.05, volume: 0.2 } },
    { id: 'sfx_miss', name: 'Miss / Lose Life', params: { name: 'Miss', type: 'triangle', startFreq: 800, endFreq: 400, duration: 0.3, volume: 0.3 } },
    { id: 'sfx_alarm', name: 'Alarm', params: { name: 'Alarm', type: 'sawtooth', startFreq: 900, endFreq: 1000, duration: 0.4, volume: 0.25 } },
];

const musicLoops: LibraryMusicLoop[] = [
    { id: 'loop_action', name: 'Action Groove', bpm: 140, song: [
        ['C4', null, 'C4', null, 'G3', null, 'G3', null, 'F3', null, 'F3', null, 'F3', null, null, null],
        [null, null, 'E4', null, 'B3', null, null, null, 'A3', null, 'A3', null, 'C4', null, null, null]
    ]},
    { id: 'loop_adventure', name: 'Adventure Awaits', bpm: 120, song: [
        ['C4', 'E4', 'G4', 'E4', 'F4', 'A4', 'C5', 'A4'],
        ['C2', null, 'C2', null, 'F2', null, 'F2', null]
    ]},
    { id: 'loop_mystery', name: 'Misterioso', bpm: 90, song: [
        ['C#4', null, 'D4', null, 'E4', null, 'C#4', null],
        ['A2', null, null, null, 'A2', null, null, null]
    ]},
    { id: 'loop_boss', name: 'Boss Battle', bpm: 160, song: [
        ['C3', null, 'C#3', null, 'D3', null, 'D#3', null],
        ['C2', 'C2', 'C2', 'C2', 'C2', 'C2', 'C2', 'C2']
    ]},
    { id: 'jingle_success', name: 'Success Jingle', bpm: 180, song: [
        ['C5', null, 'E5', null, 'G5', null, 'C6', null],
        [null, 'C4', null, 'E4', null, 'G4', null, 'C5']
    ]},
    { id: 'jingle_generate', name: 'Generate Jingle', bpm: 160, song: [
        ['C4', 'E4', 'G4', null],
        ['G3', 'C4', 'E4', null]
    ]},
    { id: 'jingle_gameover', name: 'Game Over Jingle', bpm: 100, song: [
        ['G3', null, 'F#3', null, 'F3', null, 'E3', 'E3'],
        ['G2', null, 'F#2', null, 'F2', null, 'E2', 'E2']
    ]},
    { id: 'jingle_download', name: 'Download Jingle', bpm: 120, song: [
        ['G5', null, 'E5', null, 'C5', null, null, null],
        ['G4', null, 'E4', null, 'C4', null, null, null]
    ]},
    {
        id: 'loop_voyage', name: 'Galactic Voyage (Long Loop)', bpm: 130, song: [
            [
                'C2', null, null, null, 'C2', null, 'C2', null, 'G2', null, null, null, 'G2', null, 'G2', null,
                'A#2', null, null, null, 'A#2', null, 'A#2', null, 'F2', null, null, null, 'F2', null, 'F2', null,
                'C2', null, null, null, 'C2', null, 'C2', null, 'G2', null, null, null, 'G2', null, 'G2', null,
                'A#2', null, 'G2', null, 'F2', null, 'D#2', null, 'D2', null, null, null, null, null, null, null,
            ],
            [
                'G4', 'F4', 'D#4', 'D4', 'C4', null, null, null, 'D#4', 'D4', 'C4', 'A#3', 'G3', null, null, null,
                'G4', 'F4', 'D#4', 'D4', 'C4', null, null, null, 'D#4', 'D4', 'F4', 'G4', 'A#4', null, 'A#4', null,
                'C5', null, 'A#4', null, 'G4', null, 'D#4', null, 'C5', null, 'A#4', null, 'G4', null, 'D#4', null,
                'G4', null, 'A#4', 'G4', 'F4', 'D#4', 'D4', 'C4', 'D#4', null, 'F4', null, 'D#4', null, 'C4', null,
            ]
        ]
    }
];

export const MusicAndSoundPage: React.FC<MusicAndSoundPageProps> = ({ onClose, playSound }) => {
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { addCredits } = useCredits();

    const handlePlaySfx = (sfx: LibrarySoundEffect) => {
        playSound(() => audioService.playSoundFromParams(sfx.params));
    };

    const handlePlayLoop = (loop: LibraryMusicLoop) => {
        if (playingId === loop.id) {
            audioService.stopSong();
            setPlayingId(null);
        } else {
            playSound(() => {
                audioService.playSong(loop.song, loop.bpm, () => setPlayingId(null));
                setPlayingId(loop.id);
            });
        }
    };
    
    useEffect(() => {
        // Stop any playing music when the component unmounts
        return () => {
            audioService.stopSong();
        };
    }, []);

    const handleDownloadSfx = useCallback(async (sfx: LibrarySoundEffect) => {
        if (downloadingId) return;
        playSound(audioService.playDownload);
        setDownloadingId(sfx.id);
        setError(null);
    
        try {
            const wavBlob = await audioService.exportSoundEffectToWav(sfx.params);
            if (wavBlob) {
                addCredits(35);
                const url = URL.createObjectURL(wavBlob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `${sfx.name.replace(/\s+/g, '_').toLowerCase()}.wav`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                // We don't revoke the URL immediately to prevent navigation errors in some browsers.
                // The browser will handle cleanup on page unload.
            } else {
                throw new Error("Failed to create WAV file.");
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unexpected download error occurred.";
            setError(errorMessage);
            playSound(audioService.playError);
        } finally {
            setDownloadingId(null);
        }
    }, [downloadingId, playSound, addCredits]);

    const handleDownloadLoop = useCallback(async (loop: LibraryMusicLoop) => {
        if (downloadingId) return;
        playSound(audioService.playDownload);
        setDownloadingId(loop.id);
        setError(null);
    
        try {
            const wavBlob = await audioService.exportSongToWav(loop.song, loop.bpm);
            if (wavBlob) {
                addCredits(35);
                const url = URL.createObjectURL(wavBlob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `${loop.name.replace(/\s+/g, '_').toLowerCase()}.wav`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                // We don't revoke the URL immediately to prevent navigation errors in some browsers.
            } else {
                throw new Error("Failed to create WAV file.");
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unexpected download error occurred.";
            setError(errorMessage);
            playSound(audioService.playError);
        } finally {
            setDownloadingId(null);
        }
    }, [downloadingId, playSound, addCredits]);

    const renderItem = (item: LibrarySoundEffect | LibraryMusicLoop, type: 'sfx' | 'loop') => {
        const isPlaying = playingId === item.id;
        const isDownloading = downloadingId === item.id;

        const onPlay = type === 'sfx' 
            ? () => handlePlaySfx(item as LibrarySoundEffect)
            : () => handlePlayLoop(item as LibraryMusicLoop);
            
        const onDownload = type === 'sfx'
            ? () => handleDownloadSfx(item as LibrarySoundEffect)
            : () => handleDownloadLoop(item as LibraryMusicLoop);

        return (
            <div key={item.id} className="flex items-center gap-2 p-3 bg-black/30 border-2 border-brand-light/50">
                <span className="flex-grow text-sm font-press-start text-brand-light truncate" title={item.name}>
                    {item.name}
                </span>
                <button
                    onClick={onPlay}
                    className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-brand-cyan text-black border-2 border-brand-light shadow-sm transition-all hover:bg-brand-yellow active:shadow-none"
                >
                    {isPlaying ? <StopIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6"/>}
                </button>
                 <button
                    onClick={onDownload}
                    disabled={isDownloading}
                    className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-brand-yellow text-black border-2 border-brand-light shadow-sm transition-all hover:bg-brand-magenta hover:text-white active:shadow-none disabled:bg-gray-500"
                >
                    {isDownloading ? <div className="w-6 h-6"><LoadingSpinner text="" /></div> : <DownloadIcon className="w-6 h-6"/>}
                </button>
            </div>
        );
    };


    return (
        <PageWrapper>
            <PageHeader title="เสียงเพลง และเสียง" onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col gap-6 font-sans">
                <p className="text-sm text-center text-brand-light/80">
                    เรียกดูคลังเสียงประกอบและเพลง 8-bit ที่สร้างไว้ล่วงหน้าของเรา คุณสามารถเล่นและดาวน์โหลดเพื่อใช้ในโปรเจกต์ของคุณได้เลย!
                </p>

                {error && (
                    <div role="alert" className="w-full p-3 text-center text-sm text-brand-light bg-brand-magenta/20 border-2 border-brand-magenta">
                        {error}
                    </div>
                )}

                <div className="w-full my-2">
                    <AudioVisualizer />
                </div>

                <section>
                    <h3 className="font-press-start text-lg text-brand-cyan mb-3">เสียงประกอบ (SFX)</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {soundEffects.map(sfx => renderItem(sfx, 'sfx'))}
                    </div>
                </section>

                 <section>
                    <h3 className="font-press-start text-lg text-brand-cyan mb-3">เพลงและจิงเกิล</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {musicLoops.map(loop => renderItem(loop, 'loop'))}
                    </div>
                </section>
            </main>
        </PageWrapper>
    );
};
