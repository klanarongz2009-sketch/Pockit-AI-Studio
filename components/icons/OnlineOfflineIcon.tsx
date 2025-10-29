import React from 'react';

export const OnlineOfflineIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* Cloud for Online */}
        <path d="M8 7H9V6H15V7H16V8H17V10H16V11H15V12H9V11H8V10H7V8H8V7Z"/>
        {/* Chip for Offline */}
        <path d="M6 14H18V15H19V16H20V18H19V19H18V20H6V19H5V18H4V16H5V15H6V14Z"/>
        <path fill="var(--color-bg, black)" d="M7 16H17V18H7V16Z"/>
    </svg>
);