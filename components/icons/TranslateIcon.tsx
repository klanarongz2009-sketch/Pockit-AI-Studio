import React from 'react';

export const TranslateIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* 'A' character */}
        <path d="M4 18H6V16H8V14H10V16H12V18H14V14H12V12H10V10H8V12H6V14H4V18Z M8 16H6V14H8V16Z M12 16H10V14H12V16Z" />
        
        {/* Arrow */}
        <path d="M11 6H13V10H11V6Z M10 10H14V12H10V10Z" />

        {/* Japanese 'あ' character */}
        <path d="M16 14H22V16H16V14Z M18 10H20V14H18V10Z M17 16H19V20C17 20 17 18 17 16Z" />
    </svg>
);
