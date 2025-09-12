import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as audioService from '../services/audioService';
import * as preferenceService from '../services/preferenceService';
import { PageHeader, PageWrapper } from './PageComponents';
import { UploadIcon } from './icons/UploadIcon';
import { LoadingSpinner } from './LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { PlayIcon } from './icons/PlayIcon';
import { StopIcon } from './icons/StopIcon';
import { MusicNoteIcon } from './icons/MusicNoteIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import type { EffectParameters } from '../services/audioService';
import { useCredits, CREDIT_COSTS } from '../contexts/CreditContext';
import * as geminiService from '../services/geminiService';
import type { MidiNote } from '../services/geminiService';


interface VoiceChangerPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
}

type VoiceEffect =
    | 'robot'
    | 'pitch-shift'
    | 'echo'
    | 'old-radio'
    | 'clarity-adjust'
    | '8-bit-classic'
    | 'old-computer'
    | 'telephone'
    | 'underwater'
    | 'bass-boost'
    | 'monster'
    | 'vibrato'
    | 'chorus'
    | 'reverb'
    | 'ai-lofi-remix'
    | 'electric-piano'
    | 'audio-to-midi'
    | 'ai-voice-enhancer'
    | 'ai-noise-removal'
    | 'ai-vocal-isolation'
    | 'ai-narrator';

// --- UI DATA STRUCTURE ---
interface Control {
    type: 'slider';
    param: keyof EffectParameters;
    label: string;
    min: number;
    max: number;
    step: number;
    defaultValue: number;
}

interface VoiceOption {
    label: string;
    effect: VoiceEffect;
    description: string;
    controls?: Control[];
    beta?: boolean;
}

interface VoiceSection {
    title: string;
    description: string;
    options: VoiceOption[];
}

// --- VOICE EFFECTS CONFIGURATION ---
const voiceSections: VoiceSection[] = [
  {
    title: 'เครื่องมือ AI',
    description: 'ใช้พลังของ AI เพื่อวิเคราะห์และแปลงโฉมเสียงของคุณอย่างชาญฉลาด',
    options: [
      {
        label: 'ปรับปรุงเสียง AI',
        effect: 'ai-voice-enhancer',
        description: 'ใช้ AI ปรับปรุงคุณภาพเสียงพูดให้คมชัด, ลดเสียงสะท้อน, และปรับความดังให้สม่ำเสมอ',
        controls: [{ type: 'slider', param: 'remasterIntensity', label: 'ความเข้มข้น', min: 0, max: 10, step: 1, defaultValue: 5 }],
        beta: true,
      },
      {
        label: 'ลดเสียงรบกวน',
        effect: 'ai-noise-removal',
        description: 'กำจัดเสียงรบกวนพื้นหลังที่ไม่ต้องการ เช่น เสียงพัดลม, เสียงแอร์ ออกจากไฟล์เสียงของคุณ',
        beta: true,
      },
      {
        label: 'แยกเสียงร้อง (คาราโอเกะ)',
        effect: 'ai-vocal-isolation',
        description: 'พยายามลบเสียงเครื่องดนตรีออกจากเพลงเพื่อแยกเสียงร้องออกมา (ได้ผลดีกับไฟล์สเตอริโอ)',
        beta: true,
      },
      {
        label: 'เสียงผู้บรรยาย AI',
        effect: 'ai-narrator',
        description: 'เปลี่ยนเสียงของคุณให้กลายเป็นเสียงผู้บรรยายที่นุ่มลึก, ชัดเจน, และน่าฟังเหมือนในสารคดี',
        beta: true,
      },
      { 
        label: 'แปลงเสียงเป็น MIDI', 
        effect: 'audio-to-midi', 
        beta: true,
        description: 'AI จะวิเคราะห์ไฟล์เสียงและพยายามถอดเสียงเมโลดี้หลักออกมาเป็นโน้ตดนตรี (MIDI)'
      },
      {
        label: 'รีมิกซ์ Lofi',
        effect: 'ai-lofi-remix',
        description: 'เปลี่ยนเพลงของคุณให้เป็นแนว Lofi ฟังสบายๆ พร้อมเสียงประกอบสไตล์วินเทจ',
        controls: [
            { type: 'slider', param: 'lofiVintage', label: 'ความเก่า', min: 0, max: 10, step: 1, defaultValue: 5 }
        ]
      },
    ]
  },
  {
    title: 'สไตล์เรโทร & โลไฟ',
    description: 'ย้อนยุคไปกับเอฟเฟกต์เสียงสุดคลาสสิกและฟังสบาย',
    options: [
      { 
        label: 'วิทยุเก่า', 
        effect: 'old-radio', 
        description: 'จำลองเสียงจากวิทยุ AM แบบโบราณ ทำให้เสียงแตกพร่าและมีสัญญาณรบกวน',
        controls: [{ type: 'slider', param: 'radioFrequency', label: 'ปรับคลื่น', min: 500, max: 4000, step: 50, defaultValue: 1500 }]
      },
       { 
        label: 'คอมพิวเตอร์เก่า', 
        effect: 'old-computer', 
        description: 'จำลองเสียงจากลำโพงคอมพิวเตอร์รุ่นเก่า พร้อมเสียงฮัม',
        controls: [
          { type: 'slider', param: 'humFrequency', label: 'ความถี่ฮัม', min: 40, max: 120, step: 1, defaultValue: 60 }
        ]
      },
      { 
        label: 'โทรศัพท์', 
        effect: 'telephone', 
        description: 'ทำให้เสียงของคุณเหมือนกำลังคุยผ่านสายโทรศัพท์แบบเก่า เสียงจะแคบและเบา' 
      },
      { 
        label: '8-Bit', 
        effect: '8-bit-classic', 
        description: 'แปลงเสียงของคุณให้เป็นสไตล์ Chiptune ย้อนยุคเหมือนในวิดีโอเกมเก่า',
        controls: [
          { type: 'slider', param: 'bitCrushLevel', label: 'ความลึกบิต', min: 1, max: 16, step: 1, defaultValue: 8 },
          { type: 'slider', param: 'sampleRateCrushLevel', label: 'อัตราสุ่ม', min: 1, max: 40, step: 1, defaultValue: 20 }
        ]
      },
    ]
  },
  {
    title: 'เอฟเฟกต์สนุกๆ & แฟนตาซี',
    description: 'ปลดปล่อยจินตนาการและแปลงร่างเสียงของคุณ',
    options: [
      { 
        label: 'ปรับระดับเสียง', 
        effect: 'pitch-shift', 
        description: 'ปรับเสียงให้สูงขึ้น (เสียงเล็ก) หรือต่ำลง (เสียงใหญ่)',
        controls: [{ type: 'slider', param: 'pitchShift', label: 'ระดับเสียง', min: -12, max: 12, step: 1, defaultValue: 0 }]
      },
      { label: 'หุ่นยนต์', effect: 'robot', description: 'แปลงเสียงของคุณเป็นเสียงหุ่นยนต์สังเคราะห์' },
      { label: 'เสียงปีศาจ', effect: 'monster', description: 'แปลงเสียงของคุณให้น่ากลัวเหมือนปีศาจ' },
      { label: 'เสียงใต้น้ำ', effect: 'underwater', description: 'ทำให้เสียงอู้อี้เหมือนกำลังพูดอยู่ใต้น้ำ' },
      { label: 'เปียโนไฟฟ้า', effect: 'electric-piano', description: 'แปลงเสียงพูดของคุณให้กลายเป็นเมโลดี้เปียโนไฟฟ้า', beta: true },
    ]
  },
  {
    title: 'เอฟเฟกต์สตูดิโอ',
    description: 'ปรับแต่งเสียงของคุณด้วยเครื่องมือมาตรฐานเหมือนในสตูดิโออัดเสียง',
    options: [
      { 
        label: 'เสียงก้อง (Echo)', 
        effect: 'echo',
        description: 'สร้างเสียงสะท้อนเหมือนอยู่ในถ้ำหรือหุบเขา',
        controls: [
            { type: 'slider', param: 'delayTime', label: 'ความหน่วง', min: 0.1, max: 1.0, step: 0.05, defaultValue: 0.3 },
            { type: 'slider', param: 'delayFeedback', label: 'เสียงสะท้อน', min: 0.1, max: 0.7, step: 0.05, defaultValue: 0.4 }
        ]
      },
      {
        label: 'เสียงกังวาน (Reverb)',
        effect: 'reverb',
        description: 'เพิ่มมิติให้เสียงเหมือนอยู่ในห้องโถงหรือสถานที่กว้าง',
        controls: [
            { type: 'slider', param: 'reverbRoomSize', label: 'ขนาดห้อง', min: 1, max: 10, step: 1, defaultValue: 4 },
            { type: 'slider', param: 'reverbWet', label: 'ความก้อง', min: 0, max: 1, step: 0.1, defaultValue: 0.5 }
        ]
      },
      {
        label: 'ประสานเสียง (Chorus)',
        effect: 'chorus',
        description: 'สร้างเอฟเฟกต์เสียงร้องประสานที่หนาและกว้างขึ้น',
        controls: [
            { type: 'slider', param: 'chorusDepth', label: 'ความหนา', min: 0, max: 10, step: 1, defaultValue: 5 }
        ]
      },
      { 
        label: 'เสียงสั่น (Vibrato)', 
        effect: 'vibrato',
        description: 'เพิ่มเอฟเฟกต์เสียงสั่น (Vibrato) ให้กับเสียงของคุณ',
        controls: [{ type: 'slider', param: 'vibratoDepth', label: 'ความแรง', min: 0, max: 50, step: 1, defaultValue: 10 }]
      },
      {
        label: 'เพิ่มเสียงเบส',
        effect: 'bass-boost',
        description: 'เพิ่มความหนักแน่นให้กับย่านความถี่ต่ำของเสียง',
        controls: [
            { type: 'slider', param: 'bassBoostLevel', label: 'ระดับเสียงเบส (dB)', min: 0, max: 15, step: 1, defaultValue: 6 }
        ]
      },
      { 
        label: 'ปรับความชัด', 
        effect: 'clarity-adjust',
        description: 'ทำให้เสียงคมชัดขึ้น (ขวา) หรือทุ้มอู้อี้ (ซ้าย)',
        controls: [{ type: 'slider', param: 'clarityLevel', label: 'ระดับความชัด', min: -10, max: 10, step: 1, defaultValue: 0 }]
      },
    ]
  },
];


export const VoiceChangerPage: React.FC<VoiceChangerPageProps> = ({ playSound, onClose }) => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [processedAudio, setProcessedAudio] = useState<AudioBuffer | null>(null);
    const [processedMidi, setProcessedMidi] = useState<MidiNote[] | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [isPlayingMidi, setIsPlayingMidi] = useState<boolean>(false);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    
    const allOptions = voiceSections.flatMap(s => s.options);
    const [selectedEffect, setSelectedEffect] = useState<VoiceOption>(() => {
        const savedEffect = preferenceService.getPreference('voiceChangerEffect', allOptions[0].effect);
        return allOptions.find(opt => opt.effect === savedEffect) || allOptions[0];
    });
    const [effectParams, setEffectParams] = useState<EffectParameters>({});
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const { credits, spendCredits, addCredits } = useCredits();

    // Effect to reset params when effect changes and save the new effect
    useEffect(() => {
        const defaultParams: EffectParameters = {};
        selectedEffect.controls?.forEach(control => {
            (defaultParams as any)[control.param] = control.defaultValue;
        });
        setEffectParams(defaultParams);
        preferenceService.setPreference('voiceChangerEffect', selectedEffect.effect);
    }, [selectedEffect]);


    const stopPlayback = useCallback(() => {
        if (activeAudioSourceRef.current) {
            try { activeAudioSourceRef.current.stop(); } catch (e) {}
            activeAudioSourceRef.current = null;
        }
        setIsPlaying(false);
        audioService.stopMidi();
        setIsPlayingMidi(false);
    }, []);


    useEffect(() => {
        return stopPlayback; // Cleanup on unmount
    }, [stopPlayback]);

    const resetState = (clearFile: boolean = false) => {
        setError(null);
        setProcessedAudio(null);
        setProcessedMidi(null);
        stopPlayback();
        if (clearFile) {
            setUploadedFile(null);
            if (filePreview) URL.revokeObjectURL(filePreview);
            setFilePreview(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const processFile = (file: File | undefined) => {
        if (!file) return;

        const fileType = file.type;
        
        if (!fileType.startsWith('audio/') && !fileType.startsWith('video/')) {
            setError(`ไฟล์ประเภท '${file.name}' ไม่รองรับ`);
            playSound(audioService.playError);
            return;
        }

        resetState(true);
        setUploadedFile(file);
        const url = URL.createObjectURL(file);
        setFilePreview(url);
        playSound(audioService.playSelection);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        processFile(event.target.files?.[0]);
    };
    
    const handleUploadClick = useCallback(() => {
        playSound(audioService.playClick);
        fileInputRef.current?.click();
    }, [playSound]);


    const handleDragEnter = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        // This timeout helps prevent flickering when dragging over child elements
        setTimeout(() => setIsDragging(false), 50);
    };

    const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };

    const handleGenerate = useCallback(async () => {
        if (!uploadedFile || isLoading) return;

        const cost = selectedEffect.effect === 'audio-to-midi' 
            ? CREDIT_COSTS.AUDIO_TO_MIDI 
            : CREDIT_COSTS.VOICE_EFFECT_AI;

        if (!spendCredits(cost)) {
            setError(`เครดิตไม่เพียงพอ! ต้องการ ${cost} เครดิต แต่คุณมี ${credits.toFixed(0)} เครดิต`);
            playSound(audioService.playError);
            return;
        }

        stopPlayback();
        setProcessedAudio(null);
        setProcessedMidi(null);
        setError(null);
        
        playSound(audioService.playGenerate);
        setIsLoading(true);

        try {
            if (selectedEffect.effect === 'audio-to-midi') {
                const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve((reader.result as string).split(',')[1]);
                    reader.onerror = error => reject(error);
                });
                const base64Data = await toBase64(uploadedFile);
                const midiNotes = await geminiService.convertAudioToMidi(base64Data, uploadedFile.type);

                if (midiNotes.length === 0) {
                    throw new Error('AI ไม่สามารถตรวจจับเมโลดี้ที่ชัดเจนในไฟล์เสียงนี้ได้');
                }
                setProcessedMidi(midiNotes);
                playSound(audioService.playSuccess);
                
                if (preferenceService.getPreference('autoPlaySounds', true)) {
                    setIsPlayingMidi(true);
                    audioService.playMidi(midiNotes, () => {
                        setIsPlayingMidi(false);
                    });
                }

            } else {
                 const audioBuffer = await audioService.applyVoiceEffect(uploadedFile, selectedEffect.effect, effectParams);
                 setProcessedAudio(audioBuffer);
                 playSound(audioService.playSuccess);
                 
                 if (preferenceService.getPreference('autoPlaySounds', true)) {
                    const source = audioService.playAudioBuffer(audioBuffer);
                    activeAudioSourceRef.current = source;
                    setIsPlaying(true);
                    source.onended = () => {
                        setIsPlaying(false);
                        activeAudioSourceRef.current = null;
                    };
                 }
            }

        } catch (err) {
            playSound(audioService.playError);
            addCredits(cost); // Refund credits on failure
            const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการประมวลผลเสียง';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [uploadedFile, isLoading, stopPlayback, playSound, selectedEffect.effect, effectParams, credits, spendCredits, addCredits]);


    const handlePlaybackToggle = useCallback(() => {
        playSound(audioService.playClick);
        if (isPlaying) {
            stopPlayback();
        } else if (processedAudio) {
            const source = audioService.playAudioBuffer(processedAudio);
            activeAudioSourceRef.current = source;
            setIsPlaying(true);
            source.onended = () => {
                setIsPlaying(false);
                activeAudioSourceRef.current = null;
            };
        }
    }, [isPlaying, processedAudio, playSound, stopPlayback]);

    const handleDownload = useCallback(async () => {
        if (!processedAudio || isDownloading) return;

        playSound(audioService.playDownload);
        setIsDownloading(true);
        try {
            const wavBlob = audioService.bufferToWav(processedAudio);
            const url = URL.createObjectURL(wavBlob);
            const a = document.createElement('a');
            a.href = url;
            const fileName = uploadedFile?.name.split('.').slice(0, -1).join('.') || 'transformed-audio';
            a.download = `${fileName}-${selectedEffect.effect}.wav`;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError('ไม่สามารถสร้างไฟล์ WAV ได้');
            playSound(audioService.playError);
        } finally {
            setIsDownloading(false);
        }
    }, [processedAudio, isDownloading, playSound, uploadedFile?.name, selectedEffect.effect]);

    const handleMidiPlaybackToggle = useCallback(() => {
        playSound(audioService.playClick);
        if (isPlayingMidi) {
            audioService.stopMidi();
            setIsPlayingMidi(false);
        } else if (processedMidi) {
            setIsPlayingMidi(true);
            audioService.playMidi(processedMidi, () => {
                setIsPlayingMidi(false);
            });
        }
    }, [isPlayingMidi, processedMidi, playSound]);

    const handleMidiDownload = useCallback(async () => {
        if (!processedMidi || isDownloading) return;

        playSound(audioService.playDownload);
        setIsDownloading(true);
        try {
            const wavBlob = await audioService.exportMidiToWav(processedMidi);
            if (!wavBlob) throw new Error("ไม่สามารถสร้างไฟล์ WAV ได้");
            const url = URL.createObjectURL(wavBlob);
            const a = document.createElement('a');
            a.href = url;
            const fileName = uploadedFile?.name.split('.').slice(0, -1).join('.') || 'transcribed-midi';
            a.download = `${fileName}_midi.wav`;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError('ไม่สามารถสร้างไฟล์ WAV ได้');
            playSound(audioService.playError);
        } finally {
            setIsDownloading(false);
        }
    }, [processedMidi, isDownloading, playSound, uploadedFile?.name]);


    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isLoading || isDownloading) return;
            
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const isCtrlCmd = isMac ? event.metaKey : event.ctrlKey;

            if (isCtrlCmd && event.key === 'Enter') {
                event.preventDefault();
                handleGenerate();
            } else if (event.altKey) {
                 switch(event.key.toLowerCase()){
                    case 'p':
                        if (processedAudio) {
                           event.preventDefault();
                           handlePlaybackToggle();
                        } else if (processedMidi) {
                            event.preventDefault();
                            handleMidiPlaybackToggle();
                        }
                        break;
                    case 'd':
                        if (processedAudio) {
                            event.preventDefault();
                            handleDownload();
                        } else if (processedMidi) {
                            event.preventDefault();
                            handleMidiDownload();
                        }
                        break;
                    case 'u':
                        event.preventDefault();
                        handleUploadClick();
                        break;
                 }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLoading, isDownloading, processedAudio, processedMidi, handleGenerate, handlePlaybackToggle, handleDownload, handleUploadClick, handleMidiPlaybackToggle, handleMidiDownload]);

    const renderFilePreview = () => {
        if (!uploadedFile || !filePreview) return null;
        return (
            <div className="w-full">
                <div className="flex items-center gap-3 p-3 bg-black/30">
                    <MusicNoteIcon className="w-8 h-8 text-brand-cyan flex-shrink-0" />
                    <p className="truncate text-sm">{uploadedFile.name}</p>
                </div>
                <audio src={filePreview} controls className="w-full mt-2" aria-label="ไฟล์เสียงต้นฉบับที่อัปโหลด" />
            </div>
        );
    };
    
    const getAriaValueText = (control: Control, value: number): string => {
        switch (control.param) {
            case 'pitchShift': return `ระดับเสียง: ${value >= 0 ? '+' : ''}${value}`;
            case 'delayTime': return `ความหน่วง: ${value.toFixed(2)} วินาที`;
            case 'delayFeedback': return `เสียงสะท้อน: ${(value * 100).toFixed(0)}%`;
            case 'radioFrequency': return `ความถี่: ${value} Hz`;
            case 'clarityLevel': return `ความชัด: ${value}`;
            case 'bitCrushLevel': return `ความลึก: ${value}-bit`;
            case 'sampleRateCrushLevel': return `อัตราสุ่ม: ${value}`;
            case 'bassBoostLevel': return `ระดับเสียงเบส: ${value} dB`;
            case 'vibratoDepth': return `ความแรง: ${value}`;
            case 'chorusDepth': return `ความหนา: ${value}`;
            case 'reverbRoomSize': return `ขนาด: ${value}`;
            case 'reverbWet': return `ความก้อง: ${(value * 100).toFixed(0)}%`;
            case 'lofiVintage': return `ความเก่า: ${value}`;
            case 'humFrequency': return `ความถี่ฮัม: ${value} Hz`;
            case 'remasterIntensity': return `ความเข้มข้น: ${value}`;
            default: return String(value);
        }
    };


    const renderControls = () => {
        if (!selectedEffect.controls || selectedEffect.controls.length === 0) {
            return <p className="text-center text-sm text-brand-light/70 p-4">เอฟเฟกต์นี้ไม่มีการตั้งค่าเพิ่มเติม</p>;
        }

        return selectedEffect.controls.map(control => {
            const paramKey = control.param;
            const currentValue = effectParams[paramKey] ?? control.defaultValue;
            return (
                <div key={control.param} className="flex flex-col gap-2">
                    <label htmlFor={`${String(control.param)}-slider`} className="text-xs font-press-start text-brand-light/80 flex justify-between">
                        <span>{control.label}</span>
                        <span>{currentValue}</span>
                    </label>
                    <input
                        id={`${String(control.param)}-slider`}
                        type="range"
                        min={control.min}
                        max={control.max}
                        step={control.step}
                        value={currentValue}
                        onChange={(e) => {
                            playSound(audioService.playSliderChange);
                            const value = parseFloat(e.target.value);
                            setEffectParams(prev => ({ ...prev, [paramKey]: value }));
                        }}
                        disabled={isLoading}
                        aria-valuetext={getAriaValueText(control, currentValue as number)}
                    />
                </div>
            )
        });
    };

    return (
        <PageWrapper>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*,audio/*" className="hidden" aria-hidden="true" />
            <PageHeader title="สตูดิโอเปลี่ยนเสียง" onBack={onClose} />
            <main 
                id="main-content"
                className="w-full max-w-4xl flex flex-col items-center gap-6 font-sans relative"
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                 {isDragging && (
                    <div className="absolute inset-0 bg-black/80 border-4 border-dashed border-brand-yellow z-10 flex items-center justify-center pointer-events-none">
                        <p className="font-press-start text-xl text-brand-yellow">วางไฟล์ของคุณที่นี่</p>
                    </div>
                )}
                {!uploadedFile ? (
                     <div className="w-full max-w-lg text-center space-y-4">
                        <p className="text-sm text-brand-light/80">มาเล่นสนุกกับเสียงของคุณกันเถอะ! ลากและวางไฟล์เสียงหรือวิดีโอของคุณที่นี่ หรือคลิกเพื่ออัปโหลด แล้วมาดูว่า AI จะเปลี่ยนเสียงของคุณให้แปลกและฮาแค่ไหน!</p>
                        <button 
                            onClick={handleUploadClick}
                            onMouseEnter={() => playSound(audioService.playHover)}
                            title="ปุ่มลัด: Alt+U"
                            className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px]">
                            <UploadIcon className="w-6 h-6" /> อัปโหลดไฟล์
                        </button>
                    </div>
                ) : (
                    <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Effect Library */}
                         <div className="lg:col-span-1 flex flex-col gap-4">
                           {voiceSections.map(section => (
                                <div key={section.title} className="bg-black/40 border-2 border-brand-light/50 p-4 space-y-3">
                                    <h3 className="font-press-start text-brand-cyan text-base">{section.title}</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {section.options.map(opt => (
                                            <div key={opt.effect} className="relative group">
                                                <button
                                                    onClick={() => { playSound(audioService.playClick); setSelectedEffect(opt); }}
                                                    onMouseEnter={() => playSound(audioService.playHover)}
                                                    className={`w-full h-full p-3 text-sm border-2 text-center border-brand-light shadow-sm transition-all ${selectedEffect.effect === opt.effect ? 'bg-brand-yellow text-black' : 'bg-brand-cyan/80 text-black hover:bg-brand-light'}`}
                                                    aria-pressed={selectedEffect.effect === opt.effect}
                                                    aria-describedby={opt.beta ? `beta-tooltip-${opt.effect}` : undefined}
                                                >
                                                    {opt.label}
                                                </button>
                                                {opt.beta && (
                                                     <div className="absolute top-1 right-1 bg-brand-magenta text-white text-[8px] font-press-start px-1 border border-black pointer-events-none" aria-hidden="true">
                                                        BETA
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Right Column: Controls & Results */}
                        <div id="control-panel" className="lg:col-span-2 flex flex-col gap-6">
                            <div className="bg-black/40 border-2 border-brand-light/50 p-4 space-y-3">
                                <h3 className="font-press-start text-brand-cyan">ไฟล์ที่เลือก:</h3>
                                {renderFilePreview()}
                                <button onClick={handleUploadClick} title="ปุ่มลัด: Alt+U" onMouseEnter={() => playSound(audioService.playHover)} className="text-sm underline hover:text-brand-yellow transition-colors">เปลี่ยนไฟล์อื่น</button>
                            </div>

                            <div className="bg-black/40 border-2 border-brand-light/50 p-4 space-y-4">
                               <h3 className="font-press-start text-brand-cyan">แผงควบคุม: {selectedEffect.label}</h3>
                               <p className="text-xs text-brand-light/80">{selectedEffect.description}</p>
                               <div className="space-y-3">{renderControls()}</div>
                            </div>

                            <button 
                                onClick={handleGenerate} 
                                onMouseEnter={() => playSound(audioService.playHover)}
                                disabled={isLoading}
                                title="ปุ่มลัด: Ctrl+Enter"
                                className="w-full flex items-center justify-center gap-3 p-4 bg-brand-magenta text-white border-4 border-brand-light shadow-pixel text-base hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px] disabled:bg-gray-500">
                                <SparklesIcon className="w-6 h-6" /> {isLoading ? 'กำลังประมวลผล...' : `ใช้เอฟเฟกต์ (${selectedEffect.effect === 'audio-to-midi' ? CREDIT_COSTS.AUDIO_TO_MIDI : CREDIT_COSTS.VOICE_EFFECT_AI} เครดิต)`}
                            </button>

                            {isLoading && <LoadingSpinner text="กำลังเปลี่ยนเสียง..." />}
                            
                            {error && (
                                <div role="alert" className="w-full p-4 space-y-3 text-center bg-black/40 border-4 border-brand-magenta">
                                    <h3 className="text-lg font-press-start text-brand-magenta">เกิดข้อผิดพลาด</h3>
                                    <p className="font-sans text-sm break-words text-brand-light/90 max-w-md mx-auto">
                                        {error}
                                    </p>
                                </div>
                            )}

                            {processedAudio && !isLoading && (
                                <div aria-live="polite" className="p-4 bg-black/40 border-2 border-brand-lime space-y-4">
                                    <h3 className="text-lg font-press-start text-brand-lime text-center">เสร็จสิ้น!</h3>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <button 
                                            onClick={handlePlaybackToggle}
                                            onMouseEnter={() => playSound(audioService.playHover)}
                                            title="ปุ่มลัด: Alt+P"
                                            className="flex-1 flex items-center justify-center gap-3 p-3 bg-brand-cyan text-black border-2 border-brand-light shadow-sm hover:bg-brand-yellow">
                                            {isPlaying ? <StopIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                                            <span>{isPlaying ? 'หยุด' : 'เล่นเสียง'}</span>
                                        </button>
                                        <button 
                                            onClick={handleDownload}
                                            onMouseEnter={() => playSound(audioService.playHover)}
                                            disabled={isDownloading}
                                            title="ปุ่มลัด: Alt+D"
                                            className="flex-1 flex items-center justify-center gap-3 p-3 bg-brand-yellow text-black border-2 border-brand-light shadow-sm hover:bg-brand-magenta hover:text-white disabled:bg-gray-500">
                                            <DownloadIcon className="w-6 h-6" />
                                            <span>{isDownloading ? 'กำลังสร้าง...' : 'ดาวน์โหลด'}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                            {processedMidi && !isLoading && (
                                <div aria-live="polite" className="p-4 bg-black/40 border-2 border-brand-lime space-y-4">
                                    <h3 className="text-lg font-press-start text-brand-lime text-center">แปลงเป็น MIDI สำเร็จ!</h3>
                                    <p className="text-center text-sm">{`ตรวจพบ ${processedMidi.length} โน้ต`}</p>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <button 
                                            onClick={handleMidiPlaybackToggle}
                                            onMouseEnter={() => playSound(audioService.playHover)}
                                            title="ปุ่มลัด: Alt+P"
                                            className="flex-1 flex items-center justify-center gap-3 p-3 bg-brand-cyan text-black border-2 border-brand-light shadow-sm hover:bg-brand-yellow">
                                            {isPlayingMidi ? <StopIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                                            <span>{isPlayingMidi ? 'หยุด' : 'เล่น MIDI'}</span>
                                        </button>
                                        <button 
                                            onClick={handleMidiDownload}
                                            onMouseEnter={() => playSound(audioService.playHover)}
                                            disabled={isDownloading}
                                            title="ปุ่มลัด: Alt+D"
                                            className="flex-1 flex items-center justify-center gap-3 p-3 bg-brand-yellow text-black border-2 border-brand-light shadow-sm hover:bg-brand-magenta hover:text-white disabled:bg-gray-500">
                                            <DownloadIcon className="w-6 h-6" />
                                            <span>{isDownloading ? 'กำลังสร้าง...' : 'ดาวน์โหลด (.wav)'}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </PageWrapper>
    );
};