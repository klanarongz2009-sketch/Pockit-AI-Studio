import React from 'react';

export const DeviceIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* Phone body */}
        <path d="M7 2H17V22H7V2Z"/>
        {/* Screen area */}
        <path fill="var(--color-bg, black)" d="M8 4H16V20H8V4Z"/>
        {/* Notch */}
        <path d="M10 4H14V5H10V4Z"/>
        {/* UI elements */}
        <path d="M9 7H15V8H9V7Z M9 10H15V11H9V10Z M9 13H13V14H9V13Z"/>
    </svg>
);
