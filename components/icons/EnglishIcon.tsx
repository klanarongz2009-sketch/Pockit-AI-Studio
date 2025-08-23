import React from 'react';

export const EnglishIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            {/* Globe Outline */}
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
            {/* Lines on Globe */}
            <path d="M4 12h16" />
            <path d="M12 4v16" />
            <path d="M8 4.27C9.29 4.88 10.58 5.23 12 5.23s2.71-.35 4-0.96V4.27c-1.29.61-2.58.96-4 .96s-2.71-.35-4-0.96z" />
            <path d="M8 19.73c1.29-.61 2.58-.96 4-.96s2.71.35 4 .96v-0.01c-1.29-.61-2.58-.96-4-.96s-2.71.35-4 .96z" />
        </svg>
    );
};