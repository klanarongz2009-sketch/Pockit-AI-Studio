import React from 'react';

export const ThumbsDownIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        <path d="M7 14H4V4H7V14Z"/>
        <path d="M9 14H10V16H12V17H16V16H18V14H19V10H18V8H17V7H16V6H10V4H9V14Z"/>
    </svg>
);
