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
        <path d="M12 4H14V5H15V6H16V8H15V7H14V6H10V8H8V10H6V14H8V16H10V18H14V19H15V20H12V18H11V17H10V16H9V12H10V11H11V10H15V12H17V10H18V6H17V5H15V4H12Z" />
        <path d="M4 10H6V12H4V10Z" />
        <path d="M18 12H20V14H18V12Z" />
    </svg>
);
