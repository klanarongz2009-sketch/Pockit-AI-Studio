import React from 'react';

export const FacebookIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} style={{ imageRendering: 'pixelated' }} aria-hidden="true">
        <path d="M4 4H20V20H4V4Z" fill="#3B5998"/>
        <path d="M15 8H17V10H15V12H17V14H15V20H12V14H10V12H12V10C12 8 13 8 15 8Z" fill="white"/>
    </svg>
);
