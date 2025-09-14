import React from 'react';

export const MusicInspectIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        <path d="M4 8H10V9H11V13H10V14H4V13H3V9H4V8Z"/>
        <path fill="var(--color-bg, black)" d="M5 10H10V12H5V10Z"/>
        <path d="M10 14L14 18V19L15 18L11 14Z"/>
        <path d="M15 4H17V11H19V13H15V10H19V8H15V4Z"/>
    </svg>
);
