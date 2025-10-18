// FIX: Added component implementation to resolve "not a module" error.
import React from 'react';
import { PageWrapper, PageHeader } from './PageComponents';
import { PetIcon } from './icons/PetIcon';

interface TalkingCatPageProps {
    onClose: () => void;
    playSound: (player: () => void) => void;
    isOnline: boolean;
}

export const TalkingCatPage: React.FC<TalkingCatPageProps> = ({ onClose, playSound, isOnline }) => {
    return (
        <PageWrapper>
            <PageHeader title="Talking Cat" onBack={onClose} />
            <main id="main-content" className="w-full max-w-lg flex flex-col items-center justify-center gap-6 font-sans flex-grow">
                <PetIcon className="w-32 h-32 text-brand-cyan" />
                <h2 className="font-press-start text-2xl text-brand-yellow">Meow!</h2>
                {!isOnline ? (
                    <p className="text-center text-brand-magenta p-4 border-2 border-brand-magenta">
                        This feature requires an internet connection to talk to the AI cat.
                    </p>
                ) : (
                    <p className="text-center text-brand-light/80">
                        The real-time voice conversation feature is under construction. Check back soon!
                    </p>
                )}
            </main>
        </PageWrapper>
    );
};