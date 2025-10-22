import React from 'react';

export const HuggingFaceIcon = ({ className }: { className?: string }): React.ReactNode => (
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
    </svg>
);