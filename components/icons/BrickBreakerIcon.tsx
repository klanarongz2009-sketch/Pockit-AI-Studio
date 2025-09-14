import React from 'react';

export const BrickBreakerIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        <path d="M4 4H8V6H4V4Z" />
        <path fill="#ff00ff" d="M10 4H14V6H10V4Z" />
        <path d="M16 4H20V6H16V4Z" />
        <path fill="#ff00ff" d="M7 7H11V9H7V7Z" />
        <path d="M13 7H17V9H13V7Z" />
        <path d="M8 18H16V20H8V18Z" />
        <path fill="#ffff00" d="M11 15H13V17H11V15Z" />
    </svg>
);
