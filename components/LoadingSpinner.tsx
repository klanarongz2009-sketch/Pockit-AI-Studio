
import React from 'react';

export const LoadingSpinner = ({ text = "Generating..." }: { text?: string }): React.ReactNode => {
    return (
        <div role="status" className="flex flex-col items-center justify-center space-y-4 font-press-start text-brand-light">
            <div className="relative w-16 h-16">
                 <svg 
                    viewBox="0 0 24 24" 
                    className="w-full h-full text-brand-magenta animate-pulse" 
                    style={{ imageRendering: 'pixelated' }}
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-label="Pulsing heart icon"
                 >
                    <path d="M7 3H9V5H7V3Z" />
                    <path d="M15 3H17V5H15V3Z" />
                    <path d="M5 5H7V7H5V5Z" />
                    <path d="M9 5H15V7H9V5Z" />
                    <path d="M17 5H19V7H17V5Z" />
                    <path d="M3 7H5V9H3V7Z" />
                    <path d="M7 7H17V11H7V7Z" />
                    <path d="M19 7H21V9H19V7Z" />
                    <path d="M3 9H7V13H3V9Z" />
                    <path d="M17 9H21V13H17V9Z" />
                    <path d="M3 13H5V15H3V13Z" />
                    <path d="M5 13H19V17H5V13Z" />
                    <path d="M19 13H21V15H19V13Z" />
                    <path d="M5 17H7V19H5V17Z" />
                    <path d="M7 17H17V19H7V17Z" />
                    <path d="M17 17H19V19H17V17Z" />
                    <path d="M7 19H9V21H7V19Z" />
                    <path d="M9 19H15V21H9V19Z" />
                    <path d="M15 19H17V21H15V19Z" />
                 </svg>
            </div>
            <p className="text-sm tracking-widest">{text}</p>
        </div>
    );
};