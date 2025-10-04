import React from 'react';

export const ColorPickerIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        style={{ imageRendering: 'pixelated' }}
        aria-hidden="true"
    >
        <path d="M14 4H16V5H17V6H16V7H15V8H14V9H13V10H11V8H10V7H9V6H8V5H7V4H9V3H10V2H14V3H15V4H14Z" />
        <path d="M10 9H8V11H7V13H8V15H10V17H11V18H13V17H14V15H16V13H17V11H16V9H14V11H13V12H11V11H10V9Z" />
        <path fill="#ff00ff" d="M4 18H6V20H4V18Z" />
        <path fill="#00ffff" d="M18 18H20V20H18V18Z" />
        <path fill="#ffff00" d="M11 20H13V22H11V20Z" />
    </svg>
);