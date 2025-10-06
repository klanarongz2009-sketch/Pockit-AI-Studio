import React from 'react';

export const OfflineAiIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* Chip outline */}
        <path d="M6 3H18V4H20V6H21V18H20V20H18V21H6V20H4V18H3V6H4V4H6V3Z" />
        <path fill="var(--color-bg, black)" d="M5 5H19V19H5V5Z" />
        {/* Brain-like pattern */}
        <path d="M11 8H13V9H14V10H13V11H11V10H10V9H11V8Z" />
        <path d="M9 10H10V11H8V13H9V14H10V15H11V16H13V15H14V14H15V13H16V11H14V10H15V9H13V8H14V7H10V8H9V10Z" />
    </svg>
);