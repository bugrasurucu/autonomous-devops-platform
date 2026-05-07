'use client';

import { useState, createContext, useContext, useCallback, useRef, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
}

interface ToastContextType {
    // legacy single-arg API (backward compat)
    toast: (message: string, type?: ToastType) => void;
    // new rich API
    success: (title: string, message?: string) => void;
    error:   (title: string, message?: string) => void;
    info:    (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType>({
    toast: () => {},
    success: () => {}, error: () => {}, info: () => {}, warning: () => {},
});

const ICONS: Record<ToastType, string>  = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
const COLORS: Record<ToastType, { bg: string; border: string; text: string }> = {
    success: { bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.35)',  text: '#34d399' },
    error:   { bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.35)', text: '#f87171' },
    info:    { bg: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.35)', text: '#818cf8' },
    warning: { bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.35)',  text: '#fbbf24' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    const dismiss = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
        clearTimeout(timers.current[id]);
        delete timers.current[id];
    }, []);

    const add = useCallback((type: ToastType, title: string, message?: string) => {
        const id = `t-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setToasts(prev => [...prev.slice(-4), { id, type, title, message }]);
        timers.current[id] = setTimeout(() => dismiss(id), 4500);
    }, [dismiss]);

    // Legacy single-message API
    const toast = useCallback((message: string, type: ToastType = 'info') => add(type, message), [add]);
    const success = useCallback((t: string, m?: string) => add('success', t, m), [add]);
    const error   = useCallback((t: string, m?: string) => add('error',   t, m), [add]);
    const info    = useCallback((t: string, m?: string) => add('info',    t, m), [add]);
    const warning = useCallback((t: string, m?: string) => add('warning', t, m), [add]);

    return (
        <ToastContext.Provider value={{ toast, success, error, info, warning }}>
            {children}
            {/* Toast container — bottom right */}
            <div style={{
                position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
                display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 380,
                pointerEvents: 'none',
            }}>
                {toasts.map(t => {
                    const c = COLORS[t.type];
                    return (
                        <div key={t.id} onClick={() => dismiss(t.id)} style={{
                            pointerEvents: 'all', cursor: 'pointer',
                            padding: '12px 16px', borderRadius: 12,
                            background: 'rgba(8,12,28,0.96)',
                            border: `1px solid ${c.border}`,
                            backdropFilter: 'blur(16px)',
                            boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${c.border}20`,
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                            animation: 'toastIn 0.3s cubic-bezier(0.21,1.02,0.73,1)',
                        }}>
                            <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{ICONS[t.type]}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: c.text, lineHeight: 1.3 }}>
                                    {t.title}
                                </div>
                                {t.message && (
                                    <div style={{ fontSize: 12, color: '#7a9cc0', marginTop: 3, lineHeight: 1.5 }}>
                                        {t.message}
                                    </div>
                                )}
                            </div>
                            <span style={{ color: '#3d5a7a', fontSize: 16, flexShrink: 0, lineHeight: 1 }}>×</span>
                        </div>
                    );
                })}
            </div>
            <style>{`
                @keyframes toastIn {
                    from { opacity: 0; transform: translateX(110%) scale(0.9); }
                    to   { opacity: 1; transform: translateX(0) scale(1); }
                }
            `}</style>
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);
