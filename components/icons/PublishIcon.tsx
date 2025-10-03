import React from 'react';

export const PublishIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        style={{ imageRendering: 'pixelated' }}
        aria-hidden="true"
    >
        {/* Rocket Body */}
        <path d="M11 20H13V18H15V16H16V12H15V10H14V8H10V10H9V12H8V16H9V18H11V20Z"/>
        {/* Window */}
        <path fill="var(--color-bg, black)" d="M11 12H13V14H11V12Z"/>
        {/* Fins */}
        <path d="M8 18H9V21H8V18Z M15 18H16V21H15V18Z"/>
        {/* Flame */}
        <path fill="#ffff00" d="M11 21H13V22H11V21Z"/>
        <path fill="#FFA500" d="M10 22H14V23H10V22Z"/>
        {/* Stars */}
        <path d="M5 4H6V5H5V4Z M18 6H19V7H18V6Z M7 12H8V13H7V12Z"/>
    </svg>
);
