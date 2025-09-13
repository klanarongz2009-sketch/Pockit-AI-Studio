import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PageHeader, PageWrapper } from './PageComponents';
import * as audioService from '../services/audioService';
import { RecordIcon } from './icons/RecordIcon';
import { StopIcon } from './icons/StopIcon';
import { DownloadIcon } from './icons/DownloadIcon';

type RecordMode = 'audio' | 'video';

export const MediaRecorderPage: React.FC<{
    onClose: () => void;
    playSound: (player: () => void) => void;
}> = ({ onClose, playSound }) => {
    const [mode, setMode] = useState<RecordMode>('video');
    const [permission, setPermission] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [mediaBlobUrl, setMediaBlobUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const liveVideoFeed = useRef<HTMLVideoElement>(null);
    const recordedChunks = useRef<Blob[]>([]);

    const getPermissions = useCallback(async () => {
        setError(null);
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: mode === 'video',
                audio: true,
            });
            setStream(mediaStream);
            setPermission(true);
        } catch (err) {
            console.error('Error accessing media devices.', err);
            setError('Permission to access camera/microphone was denied. Please check your browser settings.');
            setPermission(false);
        }
    }, [mode, stream]);

    useEffect(() => {
        if (permission && stream && liveVideoFeed.current) {
            liveVideoFeed.current.srcObject = stream;
        }
    }, [permission, stream]);

    const handleStartRecording = () => {
        if (!stream) return;
        playSound(audioService.playClick);
        setMediaBlobUrl(null);
        setIsRecording(true);
        
        const options = { mimeType: mode === 'video' ? 'video/webm' : 'audio/webm' };
        mediaRecorderRef.current = new MediaRecorder(stream, options);
        recordedChunks.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.current.push(event.data);
            }
        };
        
        mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(recordedChunks.current, { type: options.mimeType });
            const url = URL.createObjectURL(blob);
            setMediaBlobUrl(url);
        };

        mediaRecorderRef.current.start();
    };

    const handleStopRecording = () => {
        playSound(audioService.playClick);
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    };

    const handleDownload = () => {
        if (!mediaBlobUrl) return;
        playSound(audioService.playDownload);
        const a = document.createElement('a');
        a.href = mediaBlobUrl;
        a.download = `recording-${Date.now()}.${mode === 'video' ? 'webm' : 'ogg'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <PageWrapper>
            <PageHeader title="Media Recorder" onBack={onClose} />
            <main className="w-full max-w-2xl flex flex-col items-center gap-4 font-sans p-2">
                <div className="w-full h-auto aspect-video bg-black/50 border-4 border-brand-light flex items-center justify-center shadow-pixel p-2">
                    {!permission ? (
                        <div className="text-center p-4">
                            <p className="mb-4">Select a mode and grant permissions to start recording.</p>
                            {error && <p className="text-brand-magenta text-sm mb-4">{error}</p>}
                            <button onClick={getPermissions} className="p-3 bg-brand-cyan text-black border-2 border-brand-light font-press-start hover:bg-brand-yellow">
                                Request Permissions
                            </button>
                        </div>
                    ) : mediaBlobUrl ? (
                         mode === 'video' ? (
                            <video src={mediaBlobUrl} controls autoPlay className="w-full h-full object-contain" />
                         ) : (
                            <audio src={mediaBlobUrl} controls autoPlay className="w-full" />
                         )
                    ) : (
                        <video ref={liveVideoFeed} autoPlay muted className={`w-full h-full object-contain ${mode === 'audio' ? 'hidden' : ''}`} />
                    )}
                </div>
                
                <div className="w-full flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                        <label className="font-press-start text-sm">Mode:</label>
                        <div className="flex gap-2">
                            <button onClick={() => setMode('video')} disabled={isRecording} className={`flex-1 p-2 border-2 ${mode === 'video' ? 'bg-brand-yellow text-black' : 'bg-surface-primary'}`}>Video</button>
                            <button onClick={() => setMode('audio')} disabled={isRecording} className={`flex-1 p-2 border-2 ${mode === 'audio' ? 'bg-brand-yellow text-black' : 'bg-surface-primary'}`}>Audio</button>
                        </div>
                    </div>
                    <div className="flex-1 flex items-end gap-2">
                        {!isRecording ? (
                             <button onClick={handleStartRecording} disabled={!permission} className="flex-1 p-3 flex items-center justify-center gap-2 bg-red-600 text-white border-2 border-red-200 font-press-start disabled:bg-gray-500">
                                <RecordIcon className="w-5 h-5" /> Start
                            </button>
                        ) : (
                            <button onClick={handleStopRecording} className="flex-1 p-3 flex items-center justify-center gap-2 bg-gray-600 text-white border-2 border-gray-200 font-press-start">
                                <StopIcon className="w-5 h-5" /> Stop
                            </button>
                        )}
                        <button onClick={handleDownload} disabled={!mediaBlobUrl} className="p-3 flex items-center justify-center gap-2 bg-brand-cyan text-black border-2 border-brand-light font-press-start disabled:bg-gray-500">
                            <DownloadIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </main>
        </PageWrapper>
    );
};
