import React from 'react';

export const BugIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        <path d="M9 8H15V10H16V14H15V16H9V14H8V10H9V8Z M10 6H14V8H10V6Z M7 10H8V12H7V10Z M6 12H7V14H6V12Z M16 10H17V12H16V10Z M17 12H18V14H17V12Z M9 16H10V18H9V16Z M14 16H15V18H14V16Z M10 4H11V6H10V4Z M13 4H14V6H13V4Z"/>
    </svg>
);
