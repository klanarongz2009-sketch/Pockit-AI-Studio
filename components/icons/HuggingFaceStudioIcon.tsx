import React from 'react';

export const HuggingFaceStudioIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* Simplified Hugging Face Logo */}
        <path d="M8 8H10V10H8V8Z M14 8H16V10H14V8Z"/>
        <path d="M8 12H16V14H8V12Z"/>
        <path d="M9 14H15V15H14V16H10V15H9V14Z"/>

         {/* Studio Gear */}
        <path d="M4 4H7V7H4V4Z M17 4H20V7H17V4Z M4 17H7V20H4V17Z M17 17H20V20H17V17Z" opacity="0.6"/>
    </svg>
);