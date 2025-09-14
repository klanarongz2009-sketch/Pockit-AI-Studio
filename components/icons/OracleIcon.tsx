import React from 'react';

export const OracleIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        <path d="M8 20H16V22H8V20Z M9 18H15V20H9V18Z"/>
        <path d="M6 9H18V10H19V14H18V15H17V16H16V17H8V16H7V15H6V14H5V10H6V9Z"/>
        <path fill="var(--color-bg, black)" d="M7 10H17V15H7V10Z"/>
        <path d="M9 11H11V13H9V11Z"/>
    </svg>
);
