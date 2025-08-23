import React from 'react';

export const VideoEditorIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* Film Strip */}
        <path d="M4 3H20V21H4V3Z" />
        <path fill="rgb(76, 45, 122)" d="M6 5H18V19H6V5Z" />
        <path d="M6 5H8V7H6V5Z" />
        <path d="M11 5H13V7H11V5Z" />
        <path d="M16 5H18V7H16V5Z" />
        <path d="M6 17H8V19H6V17Z" />
        <path d="M11 17H13V19H11V17Z" />
        <path d="M16 17H18V19H16V17Z" />
        
        {/* Sparkles */}
        <path fill="currentColor" d="M11 9H13V12H11V9Z" />
        <path fill="currentColor" d="M9 12H11V15H9V12Z" />
        <path fill="currentColor" d="M13 12H15V15H13V12Z" />
        <path fill="currentColor" d="M11 15H13V18H11V15Z" />
    </svg>
);