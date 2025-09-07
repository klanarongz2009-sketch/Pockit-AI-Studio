import React, { createContext, useContext, useState, useEffect, useCallback, FC, ReactNode } from 'react';
import * as preferenceService from '../services/preferenceService';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getInitialTheme = (): Theme => {
    const savedTheme = preferenceService.getPreference('theme', 'system');
    if (savedTheme !== 'system') {
        return savedTheme;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
    }
    return 'dark';
};

export const ThemeProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    useEffect(() => {
        const root = window.document.body;
        const isDark = theme === 'dark';
        
        root.classList.remove(isDark ? 'theme-light' : 'theme-dark');
        root.classList.add(isDark ? 'theme-dark' : 'theme-light');
        
        // Update theme-color meta tag for browser UI consistency
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
            themeColorMeta.setAttribute('content', isDark ? '#080c2b' : '#E2E8F0');
        }

        preferenceService.setPreference('theme', theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    }, []);
    
    const value = { theme, toggleTheme };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};