import React from 'react';

export const DeviceIcon = ({ className }: { className?: string }): React.ReactNode => (
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
        <path d="M9 7H15V8H9V7Z M9 10H15V11H9V10Z M9 13H15V14H9V13Z M9 16H13V17H9V16Z"/>
    </svg>
);
