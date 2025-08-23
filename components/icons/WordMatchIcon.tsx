import React from 'react';

export const WordMatchIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={{ imageRendering: 'pixelated' }} 
        aria-hidden="true"
    >
        {/* Puzzle Piece 1 */}
        <path d="M4 8H6V6H8V4H12V6H14V8H12V10H10V8H8V10H6V12H4V8Z" />
        
        {/* Puzzle Piece 2 (interlocked) */}
        <path fill="#ffff00" d="M12 10H14V12H16V14H18V16H20V20H18V18H16V16H14V18H12V20H10V16H12V14H10V12H12V10Z" />
    </svg>
);
