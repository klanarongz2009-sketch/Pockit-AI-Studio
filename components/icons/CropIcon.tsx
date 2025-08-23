import React from 'react';

export const CropIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* Top-left corner */}
        <path d="M6 3H8V8H3V6H6V3Z" />
        {/* Bottom-right corner */}
        <path d="M16 21H18V16H21V18H16V21Z" />
        {/* Lines */}
        <path d="M8 6H16V8H8V6Z" />
        <path d="M6 8V16H8V8H6Z" />
    </svg>
);
