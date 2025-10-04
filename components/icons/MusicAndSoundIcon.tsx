import React from 'react';

export const MusicAndSoundIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* Sound Waves */}
        <path d="M4 10H6V14H4V10Z M7 8H9V16H7V8Z M10 5H12V19H10V5Z" />
        {/* Music Note */}
        <path d="M15 4H17V16H19V18H15V16H19V12H15V4Z M15 8H21V10H15V8Z"/>
    </svg>
);