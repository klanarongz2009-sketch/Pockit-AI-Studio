import React from 'react';

export const ThumbsUpIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        <path d="M7 10H4V20H7V10Z"/>
        <path d="M9 10H10V8H12V7H16V8H18V10H19V14H18V16H17V17H16V18H10V20H9V10Z"/>
    </svg>
);
