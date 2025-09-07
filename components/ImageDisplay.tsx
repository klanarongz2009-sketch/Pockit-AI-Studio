



import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

type GenerationMode = 'image' | 'gif' | 'video' | 'spritesheet';

interface OutputDisplayProps {
  isLoading: boolean;
  error: string | null;
  generatedImage: string | null;
  generatedFrames: string[] | null;
  generatedVideoUrl: string | null;
  generatedCode: string | null;
  prompt: string;
  generationMode: GenerationMode;
  fps: number;
  loadingText: string;
  videoLoadingMessages?: string[];
  currentFrame: number;
}
export const OutputDisplay: React.FC<OutputDisplayProps> = ({ isLoading, error, generatedImage, generatedFrames, generatedVideoUrl, generatedCode, prompt, generationMode, fps, loadingText, videoLoadingMessages, currentFrame }) => {
  const [currentVideoMessage, setCurrentVideoMessage] = useState(0);

  useEffect(() => {
    if (isLoading && generationMode === 'video' && videoLoadingMessages && videoLoadingMessages.length > 0) {
        const intervalId = setInterval(() => {
            setCurrentVideoMessage(prev => (prev + 1) % videoLoadingMessages.length);
        }, 3500);
        return () => clearInterval(intervalId);
    }
  }, [isLoading, generationMode, videoLoadingMessages]);


  const getAltText = () => {
      if (!generatedImage && !generatedFrames && !generatedVideoUrl) return "พื้นที่แสดงผลลัพธ์ว่างเปล่า";
      const baseText = {
        image: 'ภาพพิกเซลอาร์ต',
        gif: 'แอนิเมชัน GIF พิกเซลอาร์ตแบบวนลูป',
        video: 'วิดีโอพิกเซลอาร์ต',
        spritesheet: 'สไปรต์ชีตแอนิเมชันพิกเซลอาร์ต'
      }[generationMode];
      return `${baseText}ที่สร้างจากคำสั่ง: ${prompt}`;
  }

  const hasContent = generatedImage || (generatedFrames && generatedFrames.length > 0) || generatedVideoUrl || generatedCode;
  const imageSource = generationMode === 'gif' && generatedFrames && generatedFrames.length > 0 ? generatedFrames[currentFrame] : generatedImage;

  const renderContent = () => {
    if (isLoading) {
        const text = (generationMode === 'video' && videoLoadingMessages) 
            ? videoLoadingMessages[currentVideoMessage] 
            : loadingText;
        return <LoadingSpinner text={text}/>;
    }
    if (error) {
        return (
            <div role="alert" className="w-full h-full p-4 flex flex-col items-center justify-center gap-4 text-center bg-black/40 border-4 border-brand-magenta">
                <div className="w-12 h-12 text-brand-magenta">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ imageRendering: 'pixelated' }} aria-hidden="true">
                        <path d="M11 4H13V14H11V4Z" />
                        <path d="M11 16H13V18H11V16Z" />
                        <path d="M4 2H20V3H21V21H20V22H4V21H3V3H4V2Z" />
                        <path fill="black" d="M5 4H19V20H5V4Z"/>
                    </svg>
                </div>
                <h3 className="font-press-start text-lg text-brand-magenta">เกิดข้อผิดพลาด</h3>
                <p className="font-sans text-sm break-words text-brand-light/90 max-w-md">
                    {error}
                </p>
            </div>
        );
    }
    if (generatedCode) {
        return (
            <iframe 
                srcDoc={generatedCode} 
                title="Code Preview" 
                className="w-full h-full border-0 bg-white" 
                sandbox="allow-scripts"
                aria-label={`ตัวอย่างโค้ดที่สร้างจากคำสั่ง: ${prompt}`}
            />
        );
    }
    if (generationMode === 'video' && generatedVideoUrl) {
        const videoUrlWithKey = `${generatedVideoUrl}&key=${process.env.API_KEY}`;
        return (
            <video src={videoUrlWithKey} controls autoPlay loop className="w-full h-full object-contain" aria-label={getAltText()}>
                เบราว์เซอร์ของคุณไม่รองรับแท็กวิดีโอ
            </video>
        );
    }
    if (hasContent && imageSource) {
        return <img src={imageSource} alt={getAltText()} className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />;
    }
    return (
        <div className="text-center text-brand-cyan font-press-start p-4" aria-label="พื้นที่เริ่มต้นใช้งาน">
          <h2 className="text-lg">ยินดีต้อนรับ!</h2>
          <p className="text-xs mt-4">ป้อนคำสั่ง หรือ อัปโหลดภาพเพื่อเริ่มต้น!</p>
        </div>
    );
  };

  return (
    <div role="region" aria-label="พื้นที่แสดงผลลัพธ์" aria-live="polite" className="w-full max-w-lg h-auto aspect-square bg-black/50 border-4 border-brand-light flex items-center justify-center p-2 shadow-pixel">
      {renderContent()}
    </div>
  );
};
