
import React from 'react';

export const GuessThePromptIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* Image Frame */}
        <path d="M4 4H20V18H4V4Z" />
        <path fill="black" d="M6 6H18V16H6V6Z" />
        
        {/* Question Mark inside frame */}
        <path d="M11 8H13V10H11V8Z" />
        <path d="M10 10H11V11H12V13H10V10Z" />
        <path d="M11 14H13V15H11V14Z" />
    </svg>
);
