import React from 'react';

export const PixelPotionIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            {/* Liquid */}
            <path fill="#ff00ff" d="M8 12H16V20H8V12Z" />
            {/* Bubbles */}
            <path fill="#f0f0f0" d="M10 18H11V19H10V18Z" />
            <path fill="#f0f0f0" d="M13 15H14V16H13V15Z" />
            {/* Bottle Glass */}
            <path d="M9 6H15V7H16V9H15V8H9V9H8V7H9V6Z" />
            <path d="M7 9H8V21H16V21H17V9H16V10H8V9H7V9Z" />
            {/* Cork */}
            <path fill="#a0522d" d="M10 4H14V6H10V4Z" />
        </svg>
    );
};
