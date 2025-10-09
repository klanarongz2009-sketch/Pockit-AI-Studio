import React from 'react';

export const FaceLostIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="#ffff00" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* Face circle */}
        <path d="M8 4H16V5H18V8H19V16H18V19H16V20H8V19H6V16H5V8H6V5H8V4Z" />
        {/* Eyes and Mouth */}
        <path fill="black" d="M8 9L10 11L8 13V12L9 11L8 10V9Z M10 9L12 11L10 13V12L11 11L10 10V9Z M12 9L14 11L12 13V12L13 11L12 10V9Z M14 9L16 11L14 13V12L15 11L14 10V9Z M9 15H15V16H9V15Z" />
    </svg>
);
