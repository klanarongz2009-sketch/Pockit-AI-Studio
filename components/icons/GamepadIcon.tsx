import React from 'react';

export const GamepadIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M4 8H8V10H6V14H8V16H4V8Z" />
            <path d="M10 10H14V14H10V10Z" />
            <path d="M17 7H19V9H17V7Z" />
            <path d="M19 9H21V11H19V9Z" />
            <path d="M17 11H19V13H17V11Z" />
            <path d="M15 9H17V11H15V9Z" />
            <path d="M3 6H21V18H3V6Z" />
        </svg>
    );
};
