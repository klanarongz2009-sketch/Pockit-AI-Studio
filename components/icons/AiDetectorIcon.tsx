import React from 'react';

export const AiDetectorIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* Human half */}
        <path d="M4 6H11V8H10V9H9V10H8V14H9V15H10V16H11V18H4V6Z" />
        <path fill="var(--color-bg, black)" d="M5 8H8V9H9V10H10V14H9V15H8V16H6V8Z" />
        <path d="M7 10H8V11H7V10Z M7 13H8V14H7V13Z" />

        {/* AI half */}
        <path fill="#00ffff" d="M13 6H20V18H13V6Z" />
        <path fill="var(--color-bg, black)" d="M14 8H19V16H14V8Z" />
        <path fill="#ff00ff" d="M16 11H18V13H16V11Z" />
    </svg>
);
