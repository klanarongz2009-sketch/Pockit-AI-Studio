import React from 'react';

export const AnalyzeIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        <path d="M4 3H18V4H20V6H21V15H19V17H18V18H17V19H15V21H5V6H4V3Z M6 5V19H13V17H15V16H17V15H18V6H16V5H6Z"/>
        <path d="M9 7H15V8H16V12H15V13H9V12H8V8H9V7Z"/>
        <path fill="var(--color-bg, black)" d="M10 9H14V11H10V9Z"/>
    </svg>
);
