import React from 'react';

export const RegenerateIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        <path d="M12 4H14V5H16V6H18V10H16V8H15V7H10V9H8V11H6V15H8V17H10V18H14V16H16V14H18V12H20V18H18V19H16V20H10V18H8V16H6V10H8V9H12V4Z"/>
        <path d="M18 4H20V6H18V4Z"/>
        <path d="M4 14H6V16H4V14Z"/>
    </svg>
);
