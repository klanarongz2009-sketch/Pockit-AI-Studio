import React from 'react';

export const FilmMusicIcon = ({ className, style }: { className?: string, style?: React.CSSProperties }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated', ...style }}
            aria-hidden="true"
        >
            <path d="M4 3H20V21H4V3Z"/>
            <path fill="var(--color-bg, black)" d="M6 5H18V19H6V5Z"/>
            <path d="M6 5H8V7H6V5Z M11 5H13V7H11V5Z M16 5H18V7H16V5Z M6 17H8V19H6V17Z M11 17H13V19H11V17Z M16 17H18V19H16V17Z"/>
            <path d="M10 9H12V14H14V15H10V13H14V11H10V9Z"/>
        </svg>
    );
};
