import React from 'react';

export const AsteroidShooterIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor"
        strokeWidth="2"
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        <path d="M12 2L15 6L14 9L17 11L16 14L20 16L18 19L14 18L11 22L8 18L4 19L2 16L6 14L5 11L8 9L7 6L12 2Z" />
    </svg>
);