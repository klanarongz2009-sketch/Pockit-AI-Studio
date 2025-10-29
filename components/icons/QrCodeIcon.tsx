import React from 'react';

export const QrCodeIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* Finder Patterns */}
        <path d="M4 4H10V10H4V4Z M14 4H20V10H14V4Z M4 14H10V20H4V14Z"/>
        <path fill="var(--color-bg, black)" d="M5 5H9V9H5V5Z M15 5H19V9H15V5Z M5 15H9V19H5V15Z"/>
        <path d="M6 6H8V8H6V6Z M16 6H18V8H16V6Z M6 16H8V18H6V16Z"/>
        {/* Data modules */}
        <path d="M12 12H14V14H12V12Z M16 12H18V14H16V12Z M14 14H16V16H14V14Z M12 16H14V18H12V16Z M16 18H18V20H16V18Z M18 16H20V18H18V16Z M11 11H12V15H11V11Z M15 11H18V12H15V11Z"/>
    </svg>
);