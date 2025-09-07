
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
            <path d="M10 8H11V9H10V8Z" />
            <path d="M13 8H14V9H13V8Z" />
            <path d="M9 9H10V10H9V9Z" />
            <path d="M14 9H15V10H14V9Z" />
            <path d="M8 10H9V11H8V10Z" />
            <path d="M15 10H16V11H15V10Z" />
            <path d="M7 11H8V13H7V11Z" />
            <path d="M16 11H17V13H16V11Z" />
            <path d="M8 13H9V14H8V13Z" />
            <path d="M15 13H16V14H15V13Z" />
            <path d="M9 14H10V15H9V14Z" />
            <path d="M14 14H15V15H14V14Z" />
            <path d="M10 15H11V16H10V15Z" />
            <path d="M13 15H14V16H13V15Z" />
            <path d="M11 11H13V13H11V11Z" />
        </svg>
    );
};
