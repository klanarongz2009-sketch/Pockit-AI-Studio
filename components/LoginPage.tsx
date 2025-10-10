
import React, { useState } from 'react';
import * as audioService from '../services/audioService';

interface LoginPageProps {
    onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, you'd validate this against a server.
        // For this demo, any input is fine as long as it's not empty.
        if (username.trim() && password.trim()) {
            audioService.playSuccess();
            onLoginSuccess();
        } else {
            audioService.playError();
            setError('Please enter a username and password');
        }
    };

    return (
        <div className="h-screen w-screen bg-background text-text-primary flex flex-col items-center justify-center font-press-start p-4">
            <div className="w-full max-w-sm bg-black/40 p-6 border-4 border-border-primary shadow-pixel animate-fadeIn">
                <h1 className="text-2xl text-brand-yellow text-center drop-shadow-[2px_2px_0_var(--color-text-primary)] mb-6">
                    Authentication
                </h1>
                <p className="font-sans text-sm text-center text-text-secondary mb-6">
                    For security, please log in. (In this demo, you can enter anything).
                </p>
                <form onSubmit={handleLogin} className="space-y-4 font-sans">
                    <div>
                        <label htmlFor="username" className="block text-xs font-press-start text-brand-cyan mb-1">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-2 bg-text-primary text-background rounded-none border-2 border-border-primary focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                            autoComplete="username"
                        />
                    </div>
                     <div>
                        <label htmlFor="password"  className="block text-xs font-press-start text-brand-cyan mb-1">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 bg-text-primary text-background rounded-none border-2 border-border-primary focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                            autoComplete="current-password"
                        />
                    </div>
                    {error && <p className="text-xs text-brand-magenta">{error}</p>}
                    <button
                        type="submit"
                        className="w-full mt-4 p-3 bg-brand-magenta text-white border-4 border-border-primary shadow-pixel text-base font-press-start transition-all hover:bg-brand-yellow hover:text-black active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px]"
                    >
                        Log In
                    </button>
                </form>
            </div>
        </div>
    );
};