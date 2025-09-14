import React from 'react';

export const SearchIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M9 4H15V5H17V6H18V10H17V11H16V12H10V11H9V10H8V6H9V5H9V4Z" />
            <path fill="var(--color-bg, black)" d="M10 6H16V10H10V6Z" />
            <path d="M8 12H7V13L4 16V18L6 16L9 13V12H8Z" />
        </svg>
    );
};
