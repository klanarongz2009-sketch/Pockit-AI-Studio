
import React from 'react';

export const MinesweeperIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        <path d="M8 4H16V5H17V6H18V8H17V9H16V10H15V11H9V10H8V9H7V8H6V6H7V5H8V4Z M10 2H14V4H10V2Z"/>
        <path d="M7 10H17V17H7V10Z"/>
        <path fill="var(--color-bg, black)" d="M9 12H15V15H9V12Z"/>
        <path fill="#ffff00" d="M11 7H13V8H11V7Z"/>
    </svg>
);
