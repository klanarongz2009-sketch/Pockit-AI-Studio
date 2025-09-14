import React from 'react';

export const PetIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden="true"
        >
            <path d="M9 6H15V7H16V9H15V8H9V9H8V7H9V6Z M10 4H11V6H10V4Z M13 4H14V6H13V4Z"/>
            <path d="M4 14H6V16H4V14Z M6 16H8V18H6V16Z M8 18H16V20H8V18Z M18 14H20V16H18V14Z M16 16H18V18H16V16Z"/>
        </svg>
    );
};
