
import React from 'react';

export const TrashIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M6 7H8V21H6V7Z" />
            <path d="M10 7H14V21H10V7Z" />
            <path d="M16 7H18V21H16V7Z" />
            <path d="M4 4H20V6H4V4Z" />
            <path d="M9 2H15V4H9V2Z" />
        </svg>
    );
};
