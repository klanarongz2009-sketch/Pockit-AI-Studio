

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
            {/* Film Strip */}
            <path d="M4 3H20V21H4V3Z" />
            <path fill="black" d="M6 5H18V19H6V5Z" />
            <path d="M6 5H8V7H6V5Z" />
            <path d="M11 5H13V7H11V5Z" />
            <path d="M16 5H18V7H16V5Z" />
            <path d="M6 17H8V19H6V17Z" />
            <path d="M11 17H13V19H11V17Z" />
            <path d="M16 17H18V19H16V17Z" />
            
            {/* Music Note */}
            <path fill="currentColor" d="M10 9H12V14H10V9Z" />
            <path fill="currentColor" d="M10 11H14V13H10V11Z" />
            <path fill="currentColor" d="M12 14H14V15H12V14Z" />
        </svg>
    );
};