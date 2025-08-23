
import React from 'react';

export const CalculatorIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* Calculator Body */}
        <path d="M4 3H20V21H4V3Z" />
        <path fill="black" d="M6 5H18V19H6V5Z" />
        
        {/* Screen */}
        <path d="M7 6H17V10H7V6Z" />

        {/* Buttons */}
        <path d="M7 12H9V14H7V12Z" />
        <path d="M11 12H13V14H11V12Z" />
        <path d="M15 12H17V14H15V12Z" />
        <path d="M7 16H9V18H7V16Z" />
        <path d="M11 16H13V18H11V16Z" />
        <path d="M15 16H17V18H15V16Z" />
    </svg>
);
