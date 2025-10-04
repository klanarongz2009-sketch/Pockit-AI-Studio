import React from 'react';

export const BellOffIcon = ({ className }: { className?: string }): React.ReactNode => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} style={{ imageRendering: 'pixelated' }} aria-hidden="true">
            <path d="M7 6H17V8H18V14H17V16H7V14H6V8H7V6Z"/>
            <path d="M9 4H15V6H9V4Z"/>
            <path d="M10 18H14V20H10V18Z"/>
            <path d="M20 3L4 19H5L21 4H20Z" stroke="currentColor" strokeWidth="2"/>
        </svg>
    );
};
