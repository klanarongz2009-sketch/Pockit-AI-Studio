


import React, { createContext, useContext, useState, useEffect, useCallback, FC, ReactNode } from 'react';
import * as preferenceService from '../services/preferenceService';

type Theme = 'light' | 'dark';
type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    themePreference: ThemePreference;
    setThemePreference: (preference: ThemePreference) => void;
    isThemeLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getSystemTheme = (): Theme => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
    }
    return 'dark';
};

export const ThemeProvider: FC<{ children: ReactNode }> = ({ children }) => {
    // FIX: Initialize with a default value, not an async call.
    const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
    const [actualTheme, setActualTheme] = useState<Theme>(getSystemTheme);
    const [isThemeLoaded, setIsThemeLoaded] = useState(false);

    // FIX: Load preference asynchronously using useEffect.
    useEffect(() => {
        const initTheme = async () => {
            const pref = await preferenceService.getPreference('theme', 'system');
            setThemePreferenceState(pref);
            setIsThemeLoaded(true);
        };
        initTheme();
    }, []);

    const setThemePreference = useCallback(async (preference: ThemePreference) => {
        setThemePreferenceState(preference);
        await preferenceService.setPreference('theme', preference);
    }, []);

    useEffect(() => {
        if (!isThemeLoaded) return; // Wait for preference to load

        const root = window.document.body;
        const isDark = actualTheme === 'dark';
        
        root.classList.remove(isDark ? 'theme-light' : 'theme-dark');
        root.classList.add(isDark ? 'theme-dark' : 'theme-light');
        
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
            themeColorMeta.setAttribute('content', isDark ? '#111827' : '#f3f4f6');
        }
    }, [actualTheme, isThemeLoaded]);

    useEffect(() => {
        if (!isThemeLoaded) return;

        if (themePreference === 'system') {
            setActualTheme(getSystemTheme());
            const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
            const handleChange = (e: MediaQueryListEvent) => {
                setActualTheme(e.matches ? 'light' : 'dark');
            };
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        } else {
            setActualTheme(themePreference);
        }
    }, [themePreference, isThemeLoaded]);
    
    const value = { theme: actualTheme, themePreference, setThemePreference, isThemeLoaded };

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