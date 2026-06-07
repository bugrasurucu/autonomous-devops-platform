'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: 'dark' | 'light';
    setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'dark',
    resolvedTheme: 'dark',
    setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function getSystemTheme(): 'dark' | 'light' {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('dark');
    const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

    // Load saved theme
    useEffect(() => {
        const saved = localStorage.getItem('orbitron-theme') as Theme | null;
        if (saved) {
            setThemeState(saved);
        }
    }, []);

    // Resolve theme
    useEffect(() => {
        const resolved = theme === 'system' ? getSystemTheme() : theme;
        setResolvedTheme(resolved);
        document.documentElement.setAttribute('data-theme', resolved);

        // Listen for system theme changes
        if (theme === 'system') {
            const mq = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = (e: MediaQueryListEvent) => {
                const newResolved = e.matches ? 'dark' : 'light';
                setResolvedTheme(newResolved);
                document.documentElement.setAttribute('data-theme', newResolved);
            };
            mq.addEventListener('change', handler);
            return () => mq.removeEventListener('change', handler);
        }
    }, [theme]);

    const setTheme = (t: Theme) => {
        setThemeState(t);
        localStorage.setItem('orbitron-theme', t);
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
