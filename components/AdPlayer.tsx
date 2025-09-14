import React from 'react';

export const AdPlayer: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
    // This is a placeholder for a real ad player component.
    // In a real scenario, this would display an ad and call onComplete when finished.
    React.useEffect(() => {
        if (onComplete) {
            const timer = setTimeout(() => {
                onComplete();
            }, 3000); // Simulate an ad playing for 3 seconds
            return () => clearTimeout(timer);
        }
    }, [onComplete]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white font-press-start">
            <p>Simulating an ad...</p>
            <p className="text-xs mt-2">You will be returned to the app shortly.</p>
        </div>
    );
};
