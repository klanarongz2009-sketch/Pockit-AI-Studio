import React from 'react';

export const GoogleIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} style={{ imageRendering: 'pixelated' }} aria-hidden="true">
        <path d="M12 10H20V12H14V14H18V16H14V18H12C8 18 8 10 12 10Z" fill="#4285F4"/>
        <path d="M12 10C16 10 16 6 12 6C8 6 8 10 12 10Z" fill="#34A853"/>
        <path d="M12 18C8 18 8 14 12 14V18Z" fill="#FBBC05"/>
        <path d="M12 6V10H4V8H12Z" fill="#EA4335"/>
    </svg>
);
