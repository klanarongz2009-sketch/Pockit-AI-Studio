import React from 'react';

export const PlatformerIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* Player */}
        <path d="M10 8H12V10H10V8Z" />
        <path d="M9 10H13V12H9V10Z" />
        <path d="M10 12H12V15H10V12Z" />
        <path d="M8 15H10V17H8V15Z" />
        <path d="M12 15H14V17H12V15Z" />
        
        {/* Platforms */}
        <path d="M2 18H10V20H2V18Z" />
        <path d="M14 18H22V20H14V18Z" />

        {/* Obstacle/Spike */}
        <path fill="#ff00ff" d="M16 16H18V18H16V16Z" />
        <path fill="#ff00ff" d="M15 14H19V16H15V14Z" />
    </svg>
);
