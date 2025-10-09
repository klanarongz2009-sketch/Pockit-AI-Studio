import React from 'react';

export const MineCheekIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* Body */}
        <path d="M8 4H16V5H17V6H18V8H19V16H18V18H17V19H16V20H8V19H7V18H6V16H5V8H6V6H7V5H8V4Z" fill="#2c2c2c"/>
        {/* Fuse */}
        <path d="M11 2H13V4H11V2Z" fill="#e0e0e0"/>
        <path d="M13 2H14V3H13V2Z" fill="#ffab00"/>
        {/* Face */}
        <path d="M9 10H11V12H9V10Z M13 10H15V12H13V10Z" fill="white"/>
        <path d="M9 15H15V16H9V15Z" fill="white"/>
    </svg>
);
