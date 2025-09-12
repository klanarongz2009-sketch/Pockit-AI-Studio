import React from 'react';

export const FileChatIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* Document */}
        <path d="M6 3H16V4H18V6H19V21H5V6H6V4H6V3Z" />
        <path fill="black" d="M7 5H17V19H7V5Z" />
        <path d="M9 7H15V8H9V7Z" />
        <path d="M9 10H15V11H9V10Z" />
        
        {/* Chat bubble */}
        <path fill="#00ffff" d="M10 13H17V17H14L13 18L12 17H10V13Z" />
    </svg>
);
