
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
        {/* Bricks */}
        <path d="M4 4H8V6H4V4Z" />
        <path d="M10 4H14V6H10V4Z" />
        <path d="M16 4H20V6H16V4Z" />
        <path d="M4 7H8V9H4V7Z" />
        <path d="M10 7H14V9H10V7Z" />
        <path d="M16 7H20V9H16V7Z" />
        
        {/* Paddle */}
        <path d="M8 18H16V20H8V18Z" />

        {/* Ball */}
        <path fill="#ffff00" d="M11 15H13V17H11V15Z" />
    </svg>
);
