import React from 'react';

export const PhoneticIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* 'A' character */}
        <path d="M6 18H8V16H10V14H12V16H14V18H16V14H14V12H12V10H10V12H8V14H6V18Z M10 16H8V14H10V16Z M14 16H12V14H14V16Z" />
        {/* Sound Waves */}
        <path d="M18 8H20V10H18V8Z M18 12H22V14H18V12Z M18 16H20V18H18V16Z"/>
    </svg>
);