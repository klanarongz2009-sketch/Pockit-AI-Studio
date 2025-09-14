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
        <path d="M6 3H18V21H6V3Z"/>
        <path fill="var(--color-bg, black)" d="M8 5H16V19H8V5Z"/>
        <path d="M9 6H15V10H9V6Z"/>
        <path d="M9 12H11V14H9V12Z M13 12H15V14H13V12Z M9 16H11V18H9V16Z M13 16H15V18H13V16Z"/>
    </svg>
);
