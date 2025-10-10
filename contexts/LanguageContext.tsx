import React, { createContext, useContext, useState, useEffect, useCallback, FC, ReactNode } from 'react';
import * as preferenceService from '../services/preferenceService';

type Language = 'th' | 'en';
type Translations = { [key: string]: any };

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    translations: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const fetchTranslations = async (lang: Language): Promise<Translations> => {
    try {
        const response = await fetch(`/i18n/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Could not load ${lang}.json: ${response.statusText}`);
        }
        const text = await response.text();
        // If the file is empty or just whitespace, it's not valid JSON.
        // Return an empty object to prevent a parsing error.
        if (text.trim() === '') {
            return {};
        }
        return JSON.parse(text);
    } catch (error) {
        console.error(`Failed to fetch or parse translations for '${lang}':`, error);
        return {}; // Return empty object on any failure
    }
};

export const LanguageProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => preferenceService.getPreference('language', 'en'));
    const [translations, setTranslations] = useState<Translations>({});

    useEffect(() => {
        fetchTranslations(language).then(setTranslations);
    }, [language]);

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
        preferenceService.setPreference('language', lang);
        document.documentElement.lang = lang;
    }, []);

    const t = useCallback((key: string): string => {
        const keys = key.split('.');
        let result = translations;
        for (const k of keys) {
            if (result && typeof result === 'object' && k in result) {
                result = result[k];
            } else {
                return key; // Return the key itself if not found
            }
        }
        return typeof result === 'string' ? result : key;
    }, [translations]);

    const value = { language, setLanguage, t, translations };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};