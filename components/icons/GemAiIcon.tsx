import React from 'react';

export const GemAiIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        <path d="M12 2L6 8V16L12 22L18 16V8L12 2Z" />
        <path fill="var(--color-bg, black)" d="M12 4.8L16.2 8.5V15.5L12 19.2L7.8 15.5V8.5L12 4.8Z"/>
        <path fill="#00ffff" d="M12 6.5L9.5 8.5L12 10.5L14.5 8.5L12 6.5Z"/>
        <path fill="#ff00ff" d="M12 17.5L9.5 15.5L12 13.5L14.5 15.5L12 17.5Z"/>
        <path fill="#ffff00" d="M8 9.5L10.5 11.5L8 13.5L5.5 11.5L8 9.5Z"/>
        <path fill="#ffff00" d="M16 9.5L18.5 11.5L16 13.5L13.5 11.5L16 9.5Z"/>
    </svg>
);