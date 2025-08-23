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
        {/* Document/Media Frame */}
        <path d="M4 3H20V21H4V3Z" />
        <path fill="black" d="M6 5H18V19H6V5Z" />
        
        {/* Magnifying Glass */}
        {/* Handle */}
        <path d="M14 14L18 18H17L13 14Z" />
        {/* Circle */}
        <path d="M9 7H15V8H16V12H15V13H9V12H8V8H9V7Z" />
        <path fill="black" d="M10 9H14V11H10V9Z" />
    </svg>
);
