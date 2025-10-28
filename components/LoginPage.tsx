
import React, { useState } from 'react';
import * as audioService from '../services/audioService';
import { GoogleIcon } from './icons/GoogleIcon';
import { FacebookIcon } from './icons/FacebookIcon';

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
            onLoginSuccess();
        } else {
            audioService.playError();
            setError('Please enter a username and password');
        }
    };
    
    // Simulate OAuth login
    const handleOAuthLogin = () => {
        onLoginSuccess();
    };

    return (
        <div className="h-screen w-screen bg-background text-text-primary flex flex-col items-center justify-center font-press-start p-4">
            <div className="w-full max-w-sm bg-surface-1 p-6 border-4 border-border-primary shadow-pixel animate-page-enter">
                <h1 className="text-2xl text-brand-primary text-center mb-6">
                    Authentication
                </h1>
                <p className="font-sans text-sm text-center text-text-secondary mb-6">
                    For security, please log in. (In this demo, any input is fine).
                </p>
                <form onSubmit={handleLogin} className="space-y-4 font-sans">
                    <div>
                        <label htmlFor="username" className="block text-xs font-press-start text-text-secondary mb-1">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-2 bg-surface-2 text-text-primary rounded-md border-2 border-border-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            autoComplete="username"
                        />
                    </div>
                     <div>
                        <label htmlFor="password"  className="block text-xs font-press-start text-text-secondary mb-1">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 bg-surface-2 text-text-primary rounded-md border-2 border-border-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            autoComplete="current-password"
                        />
                    </div>
                    {error && <p className="text-xs text-brand-accent">{error}</p>}
                    <button
                        type="submit"
                        className="w-full mt-2 p-3 bg-brand-primary text-text-inverted border-2 border-transparent shadow-pixel text-base font-press-start transition-all hover:bg-brand-primary/80 active:shadow-pixel-active"
                    >
                        Log In
                    </button>
                </form>

                <div className="flex items-center my-6">
                    <hr className="flex-grow border-t border-border-primary" />
                    <span className="mx-4 text-xs text-text-secondary font-press-start">OR</span>
                    <hr className="flex-grow border-t border-border-primary" />
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleOAuthLogin}
                        className="w-full p-3 bg-white text-black border-2 border-border-primary shadow-pixel text-sm font-sans font-medium flex items-center justify-center gap-3 transition-all hover:bg-gray-200 active:shadow-pixel-active"
                    >
                        <GoogleIcon className="w-5 h-5" />
                        Sign in with Google
                    </button>
                     <button
                        onClick={handleOAuthLogin}
                        className="w-full p-3 bg-[#1877F2] text-white border-2 border-blue-700 shadow-pixel text-sm font-sans font-medium flex items-center justify-center gap-3 transition-all hover:bg-blue-600 active:shadow-pixel-active"
                    >
                        <FacebookIcon className="w-5 h-5" />
                        Sign in with Facebook
                    </button>
                </div>
            </div>
        </div>
    );
};
