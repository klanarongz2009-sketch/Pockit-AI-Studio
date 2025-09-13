import React from 'react';

export const RecordIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* Outer Circle */}
        <path d="M8 4H16V5H18V7H19V9H20V15H19V17H18V19H16V20H8V19H6V17H5V15H4V9H5V7H6V5H8V4Z" />
        {/* Inner Red Circle */}
        <path fill="#ff0000" d="M8 8H16V16H8V8Z" />
    </svg>
);
