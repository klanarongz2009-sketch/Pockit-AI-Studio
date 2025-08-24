import React from 'react';

export const SearchMusicIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* Magnifying Glass Circle */}
        <path d="M10 4H16V5H17V9H16V10H10V9H9V5H10V4Z" />
        <path fill="black" d="M11 6H15V8H11V6Z" />

        {/* Magnifying Glass Handle */}
        <path d="M8 10L4 14V15L5 14L9 10Z" />
        
        {/* Music Note */}
        <path d="M15 12H17V19H15V12Z" />
        <path d="M17 19H20V21H17V19Z" />
        <path d="M15 16H20V18H15V16Z" />
    </svg>
);
