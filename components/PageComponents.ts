
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

    return React.createElement(
        'div',
        {
            className: `h-screen w-screen bg-background font-press-start text-text-primary flex flex-col items-center animate-page-enter ${className}`
        },
        children
    );
};

export const PageHeader: React.FC<{ title: string; onBack: () => void; }> = ({ title, onBack }) => (
    React.createElement('header', {
        className: "w-full max-w-lg flex items-center p-3 border-b-4 border-border-primary bg-background/20 flex-shrink-0 mb-6"
    },
    React.createElement('button', {
        onClick: onBack,
        className: "text-sm underline hover:text-brand-yellow transition-colors pr-4 font-sans",
        'aria-label': 'Back'
    }, '\u2190 Back'),
    React.createElement('h2', {
        className: "text-base sm:text-lg text-brand-yellow font-press-start"
    }, title))
);