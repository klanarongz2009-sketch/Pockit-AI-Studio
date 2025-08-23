
import React from 'react';

export const PaletteIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className={className}
            style={{ imageRendering: 'pixelated' }}
            fill="currentColor"
            aria-hidden="true"
        >
            <path 
                fillRule="evenodd"
                d="M6 5H18V6H20V7H21V14H20V15H18V16H16V17H8V16H6V15H5V14H4V7H5V6H6V5ZM8 8H10V10H8V8ZM11 7H13V9H11V7ZM14 8H16V10H14V8ZM12 11H14V13H12V11Z"
            />
        </svg>
    );
};
