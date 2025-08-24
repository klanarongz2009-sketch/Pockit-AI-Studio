import React from 'react';

export const ImageSoundIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* Image Frame */}
        <path d="M4 4H20V18H4V4Z" />
        <path fill="black" d="M6 6H18V16H6V6Z" />
        {/* Image content (sun and mountain) */}
        <path d="M8 14H16V15H8V14Z" />
        <path d="M10 12H14V14H10V12Z" />
        <path d="M11 10H13V12H11V10Z" />
        <path fill="#ffff00" d="M8 8H10V10H8V8Z" />

        {/* Sound waves */}
        <path d="M19 19H21V21H19V19Z" />
        <path d="M16 19H18V21H16V19Z" />
        <path d="M13 19H15V21H13V19Z" />
    </svg>
);
