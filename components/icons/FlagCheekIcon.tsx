import React from 'react';

export const FlagCheekIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* Flag */}
        <path d="M10 4H12V6H10V4Z M12 6H14V8H12V6Z M10 8H12V10H10V8Z M8 10H10V12H8V10Z" fill="#ff00ff"/>
        {/* Pole */}
        <path d="M10 4H11V20H10V4Z" fill="#cccccc"/>
    </svg>
);
