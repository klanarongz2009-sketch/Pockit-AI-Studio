import React from 'react';

export const TalkingCatIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* Speech Bubble */}
        <path d="M14 4H22V12H18L16 14V12H14V4Z" />
        <path fill="var(--color-bg, black)" d="M16 6H20V10H16V6Z" />

        {/* Cat */}
        <path d="M4 8H12V16H11V18H9V16H7V18H5V16H4V8Z" />
        <path fill="var(--color-bg, black)" d="M6 10H10V14H6V10Z" />
        <path d="M5 7H7V8H5V7Z M9 7H11V8H9V7Z"/>
    </svg>
);