import React from 'react';

export const JumpingIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* Player */}
        <path d="M6 10H8V12H6V10Z M5 12H9V14H5V12Z M6 14H8V17H6V14Z M4 17H6V19H4V17Z M8 17H10V19H8V17Z"/>
        {/* Ground */}
        <path d="M2 20H22V22H2V20Z"/>
        {/* Obstacle */}
        <path fill="#ff00ff" d="M16 16H20V20H16V16Z"/>
         {/* Coin */}
        <path fill="#ffff00" d="M12 6H14V8H12V6Z"/>
    </svg>
);
