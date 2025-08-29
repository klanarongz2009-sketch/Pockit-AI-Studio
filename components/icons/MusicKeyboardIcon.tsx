import React from 'react';

export const MusicKeyboardIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* Keyboard base */}
        <path d="M4 8H20V18H4V8Z" />
        {/* White key separators */}
        <path fill="black" d="M8 8H9V18H8V8Z" />
        <path fill="black" d="M12 8H13V18H12V8Z" />
        <path fill="black" d="M16 8H17V18H16V8Z" />
        {/* Black keys */}
        <path fill="black" d="M6 8H8V14H6V8Z" />
        <path fill="black" d="M10 8H12V14H10V8Z" />
        <path fill="black" d="M14 8H16V14H14V8Z" />
    </svg>
);
