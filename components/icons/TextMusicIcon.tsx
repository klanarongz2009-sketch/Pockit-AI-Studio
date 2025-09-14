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
            <path d="M4 3H16V15H4V3Z"/>
            <path fill="var(--color-bg, black)" d="M6 5H14V6H6V5Z M6 8H14V9H6V8Z M6 11H12V12H6V11Z"/>
            <path d="M15 12H17V19H19V21H15V18H19V16H15V12Z"/>
        </svg>
    );
};
