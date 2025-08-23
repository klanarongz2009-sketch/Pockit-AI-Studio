import React from 'react';

export const TextMusicIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            {/* Document with lines of text */}
            <path d="M4 3H16V15H4V3Z" />
            <path fill="black" d="M6 5H14V6H6V5Z" />
            <path fill="black" d="M6 8H14V9H6V8Z" />
            <path fill="black" d="M6 11H12V12H6V11Z" />
            
            {/* Music Note */}
            <path d="M15 12H17V19H15V12Z" />
            <path d="M17 19H20V21H17V19Z" />
            <path d="M15 16H20V18H15V16Z" />
        </svg>
    );
};
