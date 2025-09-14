import React from 'react';

export const SpriteSheetIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M4 4H8V8H4V4Z M10 4H14V8H10V4Z M16 4H20V8H16V4Z M4 10H8V14H4V10Z M10 10H14V14H10V10Z M16 10H20V14H16V10Z M4 16H8V20H4V16Z M10 16H14V20H10V16Z M16 16H20V20H16V16Z"/>
        </svg>
    );
};
