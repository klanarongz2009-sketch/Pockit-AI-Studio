import React from 'react';

export const GuessThePromptIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        <path d="M4 4H20V20H4V4Z"/>
        <path fill="var(--color-bg, black)" d="M6 6H18V18H6V6Z"/>
        <path d="M10 8H14V10H12V12H14V14H10V12H11V11H10V10Z M11 16H13V18H11V16Z"/>
    </svg>
);
