import React from 'react';

export const SnakeIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* Snake Body */}
        <path d="M8 4H10V6H8V4Z" />
        <path d="M10 6H12V8H10V6Z" />
        <path d="M12 8H14V10H12V8Z" />
        <path d="M14 10H16V12H14V10Z" />
        <path d="M16 8H18V10H16V8Z" />
        <path d="M18 6H20V8H18V6Z" />
        <path d="M16 12H18V14H16V12Z" />
        <path d="M14 14H16V16H14V14Z" />
        <path d="M12 16H14V18H12V16Z" />

        {/* Food */}
        <path fill="#ffff00" d="M4 18H6V20H4V18Z" />

        {/* Border */}
        <path fill="rgba(240,240,240,0.5)" d="M2 2H22V3H2V2Z" />
        <path fill="rgba(240,240,240,0.5)" d="M2 21H22V22H2V21Z" />
        <path fill="rgba(240,240,240,0.5)" d="M2 3H3V21H2V3Z" />
        <path fill="rgba(240,240,240,0.5)" d="M21 3H22V21H21V3Z" />
    </svg>
);