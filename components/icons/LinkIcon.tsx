import React from 'react';

export const LinkIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M9 8H11V9H12V10H11V11H9V13H8V11H7V9H8V8H9Z M15 11H17V13H16V15H14V16H13V15H14V14H15V13H17V11H16V10H15V11Z"/>
        </svg>
    );
};
