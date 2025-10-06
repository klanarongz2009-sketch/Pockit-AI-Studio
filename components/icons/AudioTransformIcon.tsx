import React from 'react';

export const AudioTransformIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* Original sound wave */}
        <path d="M4 10H5V14H4V10Z M6 8H7V16H6V8Z M8 5H9V19H8V5Z" />
        {/* Arrow */}
        <path d="M11 11H15V13H11V11Z M14 10L16 12L14 14V10Z" />
        {/* Transformed sound wave (blocky) */}
        <path d="M17 10H19V14H17V10Z M20 8H22V16H20V8Z" />
    </svg>
);
