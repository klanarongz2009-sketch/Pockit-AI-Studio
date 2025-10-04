import React from 'react';

export const ArticleIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M6 3H16V4H18V21H6V3Z"/>
            <path fill="var(--color-bg, black)" d="M8 5H16V19H8V5Z"/>
            <path d="M9 7H15V8H9V7Z"/>
            <path d="M9 10H15V11H9V10Z"/>
            <path d="M9 13H13V14H9V13Z"/>
        </svg>
    );
};