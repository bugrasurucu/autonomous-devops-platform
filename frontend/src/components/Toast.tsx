'use client';

import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastContextType {
    toast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => { } });

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        const id = Math.random().toString(36).slice(2);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const colors: Record<string, { bg: string; border: string; text: string }> = {
        success: { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)', text: '#34d399' },
        error: { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', text: '#f87171' },
        info: { bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.3)', text: '#818cf8' },
        warning: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', text: '#fbbf24' },
    };

    return (
        <ToastContext.Provider value={{ toast: addToast }}>
            {children}
            {/* Toast container */}
            <div style={{
                position: 'fixed',
                top: 16,
                right: 16,
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                pointerEvents: 'none',
            }}>
                {toasts.map((t) => {
                    const c = colors[t.type];
                    return (
                        <div key={t.id} className="page-enter" style={{
                            padding: '12px 20px',
                            borderRadius: 12,
                            background: c.bg,
                            border: `1px solid ${c.border}`,
                            color: c.text,
                            fontSize: 14,
                            fontWeight: 500,
                            backdropFilter: 'blur(12px)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                            pointerEvents: 'auto',
                            maxWidth: 360,
                        }}>
                            {t.type === 'success' && '✓ '}
                            {t.type === 'error' && '✕ '}
                            {t.type === 'warning' && '⚠ '}
                            {t.message}
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);
