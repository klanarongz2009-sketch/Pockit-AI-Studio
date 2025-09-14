import React from 'react';

export const PlatformerIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        <path d="M10 8H12V10H10V8Z M9 10H13V12H9V10Z M10 12H12V15H10V12Z M8 15H10V17H8V15Z M12 15H14V17H12V15Z"/>
        <path d="M2 18H10V20H2V18Z M14 18H22V20H14V18Z"/>
        <path fill="#ff00ff" d="M16 16H18V18H16V16Z M15 14H19V16H15V14Z"/>
    </svg>
);
