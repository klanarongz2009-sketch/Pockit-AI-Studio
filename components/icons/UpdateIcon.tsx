import React from 'react';

export const UpdateIcon = ({ className }: { className?: string }): React.ReactNode => (
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
        <path d="M11 8H13V12H11V8Z M10 12H14V14H10V12Z M12 14H13V16H11V15H12V14Z"/>
    </svg>
);
