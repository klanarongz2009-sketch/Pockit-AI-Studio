
import React, { createContext, useContext, useState, useEffect, useCallback, FC, ReactNode } from 'react';
import * as preferenceService from '../services/preferenceService';

type Theme = 'light' | 'dark';
type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    themePreference: ThemePreference;
    setThemePreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getSystemTheme = (): Theme => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
    }
    return 'dark';
};

const getInitialThemePreference = (): ThemePreference => {
    return preferenceService.getPreference('theme', 'system');
};

export const ThemeProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [themePreference, setThemePreferenceState] = useState<ThemePreference>(getInitialThemePreference);
    const [actualTheme, setActualTheme] = useState<Theme>(() => 
        themePreference === 'system' ? getSystemTheme() : themePreference
    );

    const setThemePreference = useCallback((preference: ThemePreference) => {
        setThemePreferenceState(preference);
        preferenceService.setPreference('theme', preference);
    }, []);

    useEffect(() => {
        const root = window.document.body;
        const isDark = actualTheme === 'dark';
        
        root.classList.remove(isDark ? 'theme-light' : 'theme-dark');
        root.classList.add(isDark ? 'theme-dark' : 'theme-light');
        
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
            themeColorMeta.setAttribute('content', isDark ? '#080c2b' : '#E2E8F0');
        }
    }, [actualTheme]);

    useEffect(() => {
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
    }, [themePreference]);
    
    const value = { theme: actualTheme, themePreference, setThemePreference };

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
