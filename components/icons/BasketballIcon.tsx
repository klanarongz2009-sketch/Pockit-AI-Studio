import React from 'react';

export const BasketballIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* Hoop */}
        <path d="M18 4H20V10H18V4Z" />
        <path d="M14 10H20V12H14V10Z" />
        <path d="M15 12H19V13H15V12Z" />

        {/* Net */}
        <path fill="rgba(240,240,240,0.8)" d="M15 13H16V15H15V13Z" />
        <path fill="rgba(240,240,240,0.8)" d="M17 13H18V15H17V13Z" />
        <path fill="rgba(240,240,240,0.8)" d="M16 15H17V17H16V15Z" />

        {/* Basketball */}
        <path fill="#ff8c00" d="M6 14H12V20H6V14Z" />
        <path fill="#ff8c00" d="M5 15H6V19H5V15Z" />
        <path fill="#ff8c00" d="M12 15H13V19H12V15Z" />
        <path fill="#ff8c00" d="M7 14H11V15H7V14Z" />
        <path fill="#ff8c00" d="M7 19H11V20H7V19Z" />

        {/* Ball Lines */}
        <path fill="black" d="M9 14H10V20H9V14Z" />
    </svg>
);
