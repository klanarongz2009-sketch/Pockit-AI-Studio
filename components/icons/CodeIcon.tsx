import React from 'react';

export const CodeIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        <path d="M8 8L4 12L8 16V14H10V10H8V8Z"/>
        <path d="M16 8L20 12L16 16V14H14V10H16V8Z"/>
    </svg>
);
