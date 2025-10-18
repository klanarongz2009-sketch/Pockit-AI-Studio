


import React, { createContext, useContext, useState, useEffect, FC, ReactNode } from 'react';

type Language = 'th' | 'en';
type Translations = { [key: string]: any };

interface LanguageContextType {
    language: Language;
    t: (key: string) => string;
    translations: Translations;
    isLoaded: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const fetchTranslations = async (lang: Language): Promise<Translations> => {
    try {
        const response = await fetch(`/i18n/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Could not load ${lang}.json: ${response.statusText}`);
        }
        const text = await response.text();
        if (text.trim() === '') {
            return {};
        }
        return JSON.parse(text);
    } catch (error) {
        console.error(`Failed to fetch or parse translations for '${lang}':`, error);
        return {}; 
    }
};

// Auto-detect language based on browser settings.
const detectSystemLanguage = (): Language => {
    // FIX: Language is now auto-detected based on browser settings.
    const userLang = navigator.language || (navigator as any).userLanguage;
    return userLang.toLowerCase().startsWith('th') ? 'th' : 'en';
};

export const LanguageProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [language] = useState<Language>(detectSystemLanguage);
    const [translations, setTranslations] = useState<Translations>({});
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        document.documentElement.lang = language;
        fetchTranslations(language).then(translations => {
            setTranslations(translations);
            setIsLoaded(true);
        });
    }, [language]);

    const t = (key: string): string => {
        if (!isLoaded) return ''; // Return empty string while loading
        const keys = key.split('.');
        let result: any = translations;
        for (const k of keys) {
            if (result && typeof result === 'object' && k in result) {
                result = result[k];
            } else {
                return key; // Key not found, return the key itself
            }
        }
        return typeof result === 'string' ? result : key;
    };
    
    // setLanguage function is removed as language is now automatic.
    const value = { language, t, translations, isLoaded };

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