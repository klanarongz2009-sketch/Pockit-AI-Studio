import React from 'react';

export const FacePlayingIcon = ({ className }: { className?: string }): React.ReactNode => (
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
        <path fill="black" d="M9 9H11V11H9V9Z M13 9H15V11H13V9Z M8 14H16V16H8V14Z" />
        <path fill="white" d="M9 14H15V15H9V14Z" />
    </svg>
);
