import React from 'react';

export const SequencerIcon = ({ className }: { className?: string }): React.ReactNode => (
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
        {/* Grid lines */}
        <path d="M10 6H11V18H10V6Z M14 6H15V18H14V6Z M6 10H18V11H6V10Z M6 14H18V15H6V14Z"/>
        {/* Notes */}
        <path fill="#00ffff" d="M7 7H9V9H7V7Z"/>
        <path fill="#ff00ff" d="M11 12H13V14H11V12Z"/>
        <path fill="#ffff00" d="M15 16H17V18H15V16Z"/>
    </svg>
);
