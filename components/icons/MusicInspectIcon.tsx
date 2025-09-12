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
        {/* Magnifying Glass Circle */}
        <path d="M4 8H10V9H11V13H10V14H4V13H3V9H4V8Z" />
        <path fill="black" d="M5 10H10V12H5V10Z" />
        {/* Magnifying Glass Handle */}
        <path d="M10 14L14 18V19L15 18L11 14Z" />
        
        {/* Music Note */}
        <path d="M15 4H17V11H15V4Z" />
        <path d="M17 11H20V13H17V11Z" />
        <path d="M15 8H20V10H15V8Z" />
    </svg>
);
