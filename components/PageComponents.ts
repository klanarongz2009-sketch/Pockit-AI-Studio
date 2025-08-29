import React, { useEffect } from 'react';

export const PageWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
    useEffect(() => {
        document.body.classList.add('modal-page-active');
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.classList.remove('modal-page-active');
            document.body.style.overflow = '';
        };
    }, []);

    // FIX: Replaced JSX with React.createElement to support .ts file extension.
    return React.createElement(
        'div',
        {
            className: `h-screen w-screen bg-black font-press-start text-brand-light flex flex-col items-center ${className}`
        },
        children
    );
};

export const PageHeader: React.FC<{ title: string; onBack: () => void; }> = ({ title, onBack }) => (
    React.createElement('header', {
        className: "w-full max-w-lg flex items-center p-3 border-b-4 border-brand-light bg-black/20 flex-shrink-0 mb-6"
    },
    React.createElement('button', {
        onClick: onBack,
        className: "text-sm underline hover:text-brand-yellow transition-colors pr-4 font-sans",
        'aria-label': 'กลับ'
    }, '\u2190 กลับ'),
    React.createElement('h2', {
        className: "text-base sm:text-lg text-brand-yellow font-press-start"
    }, title))
);