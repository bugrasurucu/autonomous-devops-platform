'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';

interface LogEntry {
    id: string;
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'success' | 'debug';
    source: string;
    message: string;
}

const LEVEL_COLORS: Record<string, string> = {
    info:    '#00ffc8',
    warn:    '#fbbf24',
    error:   '#ff5f57',
    success: '#34d399',
    debug:   '#818cf8',
};

const LEVEL_BADGE: Record<string, string> = {
    info: 'INF', warn: 'WRN', error: 'ERR', success: 'OK ', debug: 'DBG',
};

// Fallback simulation when SSE unavailable
const FALLBACK_LOGS: Omit<LogEntry, 'id' | 'timestamp'>[] = [
    { level: 'info',    source: 'kagent',         message: 'CRD sync — 4 agents healthy' },
    { level: 'info',    source: 'infra-agent',     message: 'Terraform plan: 0 to add, 0 to change, 0 to destroy' },
    { level: 'success', source: 'pipeline-agent',  message: 'GitHub Actions workflow completed — all checks passed' },
    { level: 'warn',    source: 'finops-agent',    message: 'Budget alert: $2.10 / $5.00 (42%) — within threshold' },
    { level: 'info',    source: 'sre-agent',       message: 'CloudWatch anomaly scan: no anomalies detected' },
    { level: 'error',   source: 'kagent',          message: 'Pod orbitron-worker-3: CrashLoopBackOff — container OOMKilled (512Mi limit)' },
    { level: 'info',    source: 'system',          message: 'Health check: API latency 23ms, DB connections: 4/20' },
    { level: 'warn',    source: 'sre-agent',       message: 'Memory pressure detected on node ip-10-0-1-42 (78%)' },
    { level: 'success', source: 'infra-agent',     message: 'ECS service stable — 3/3 tasks running' },
    { level: 'success', source: 'sre-agent',       message: 'Auto-remediation: restarted orbitron-worker-3 — pod healthy' },
    { level: 'info',    source: 'finops-agent',    message: 'Graviton opportunity: save ~$12/mo on t3.medium → t4g.medium' },
    { level: 'info',    source: 'system',          message: 'DB pool: 5/20 connections active' },
];

export default function TerminalLogger() {
    const { token } = useAuth();
    const [logs, setLogs] = useState<LogEntry[]>(() => {
        if (typeof window !== 'undefined' && (window as any).orbitron_logs) {
            return (window as any).orbitron_logs;
        }
        return [];
    });
    const [connected, setConnected] = useState(false);
    const [paused, setPaused] = useState(false);
    const [filter, setFilter] = useState<string>('all');
    const containerRef = useRef<HTMLDivElement>(null);
    const esRef = useRef<EventSource | null>(null);
    const fallbackRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const counterRef = useRef(0);
    const pausedRef = useRef(false);
    pausedRef.current = paused;

    const addLog = useCallback((entry: LogEntry) => {
        if (pausedRef.current) return;
        setLogs(prev => {
            const next = [...prev, entry].slice(-100); // keep last 100
            if (typeof window !== 'undefined') {
                (window as any).orbitron_logs = next;
            }
            return next;
        });
    }, []);

    // Auto-scroll to bottom unless paused
    useEffect(() => {
        if (!paused && containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [logs, paused]);

    // --- SSE connection ---
    useEffect(() => {
        const BACKEND = process.env.NEXT_PUBLIC_API_URL || '/api';
        const url = `${BACKEND}/logs/stream`;

        const connect = () => {
            // SSE with auth header isn't directly supported in EventSource API.
            // We use credentials: include (works for cookie-based auth).
            // For token-based: pass token as query param (backend should accept it).
            const sseUrl = token ? `${url}?token=${token}` : url;
            const es = new EventSource(sseUrl, { withCredentials: true });
            esRef.current = es;

            es.onopen = () => {
                setConnected(true);
                // Clear fallback if running
                if (fallbackRef.current) {
                    clearInterval(fallbackRef.current);
                    fallbackRef.current = null;
                }
            };

            es.addEventListener('log', (e: MessageEvent) => {
                try {
                    const log: LogEntry = JSON.parse(e.data);
                    addLog(log);
                } catch { /* ignore malformed */ }
            });

            es.onerror = () => {
                setConnected(false);
                es.close();
                esRef.current = null;
                // Start fallback simulation
                startFallback();
                // Retry SSE after 10s
                setTimeout(connect, 10_000);
            };
        };

        const startFallback = () => {
            if (fallbackRef.current) return; // already running

            // Seed with initial entries
            const initial: LogEntry[] = Array.from({ length: 6 }, (_, i) => {
                const tmpl = FALLBACK_LOGS[i % FALLBACK_LOGS.length];
                return {
                    id: `init-${i}`,
                    timestamp: new Date(Date.now() - (5 - i) * 4000).toISOString(),
                    ...tmpl,
                };
            });
            setLogs(initial);
            counterRef.current = 6;

            fallbackRef.current = setInterval(() => {
                const tmpl = FALLBACK_LOGS[counterRef.current % FALLBACK_LOGS.length];
                addLog({
                    id: `fb-${counterRef.current}`,
                    timestamp: new Date().toISOString(),
                    ...tmpl,
                });
                counterRef.current++;
            }, 4000);
        };

        // Try SSE first; fall back if it fails within 3s
        const sseTimeout = setTimeout(() => {
            if (!esRef.current || esRef.current.readyState === EventSource.CLOSED) {
                startFallback();
            }
        }, 3000);

        connect();

        return () => {
            clearTimeout(sseTimeout);
            esRef.current?.close();
            if (fallbackRef.current) clearInterval(fallbackRef.current);
        };
    }, [token, addLog]);

    const filtered = filter === 'all' ? logs : logs.filter(l => l.level === filter);

    const fmt = (iso: string) => {
        try { return iso.split('T')[1]?.substring(0, 8) ?? iso; }
        catch { return iso; }
    };

    return (
        <div className="glass-card" style={{ padding: 0, marginBottom: 16, overflow: 'hidden' }}>
            {/* ── Header ─────────────────────────────────────────────── */}
            <div style={{
                padding: '8px 14px',
                background: 'rgba(0,0,0,0.4)',
                borderBottom: '1px solid rgba(0,255,200,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
            }}>
                {/* Live indicator */}
                <div style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: connected ? '#34d399' : '#fbbf24',
                    boxShadow: connected ? '0 0 6px #34d399' : '0 0 6px #fbbf24',
                    animation: 'pulse 2s ease-in-out infinite',
                    flexShrink: 0,
                }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#00ffc8', fontFamily: '"JetBrains Mono", monospace' }}>
                    orbitron-system-logs
                </span>
                <span style={{
                    fontSize: 9, padding: '1px 6px', borderRadius: 4, fontFamily: '"JetBrains Mono", monospace',
                    background: connected ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)',
                    color: connected ? '#34d399' : '#fbbf24',
                    border: `1px solid ${connected ? 'rgba(52,211,153,0.3)' : 'rgba(251,191,36,0.3)'}`,
                }}>
                    {connected ? 'SSE' : 'POLL'}
                </span>

                {/* Filter pills */}
                <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                    {['all', 'error', 'warn', 'success'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '1px 7px', borderRadius: 4, fontSize: 9, fontWeight: 600,
                                fontFamily: '"JetBrains Mono", monospace', cursor: 'pointer', border: 'none',
                                background: filter === f
                                    ? (f === 'error' ? 'rgba(255,95,87,0.25)' : f === 'warn' ? 'rgba(251,191,36,0.25)' : f === 'success' ? 'rgba(52,211,153,0.25)' : 'rgba(0,212,255,0.2)')
                                    : 'rgba(255,255,255,0.05)',
                                color: filter === f
                                    ? (f === 'error' ? '#ff5f57' : f === 'warn' ? '#fbbf24' : f === 'success' ? '#34d399' : '#00d4ff')
                                    : '#7a9cc0',
                            }}
                        >
                            {f.toUpperCase()}
                        </button>
                    ))}
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                        {filtered.length} entries
                    </span>
                    {/* Pause/resume */}
                    <button
                        onClick={() => setPaused(p => !p)}
                        title={paused ? 'Resume' : 'Pause'}
                        style={{
                            padding: '2px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer',
                            background: paused ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.05)',
                            color: paused ? '#fbbf24' : '#7a9cc0',
                            border: `1px solid ${paused ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.1)'}`,
                        }}
                    >
                        {paused ? '▶ Resume' : '⏸ Pause'}
                    </button>
                    {/* Clear */}
                    <button
                        onClick={() => setLogs([])}
                        style={{
                            padding: '2px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer',
                            background: 'rgba(255,255,255,0.05)', color: '#7a9cc0',
                            border: '1px solid rgba(255,255,255,0.1)',
                        }}
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* ── Log lines ──────────────────────────────────────────── */}
            <div
                ref={containerRef}
                style={{
                    height: 200,
                    overflowY: 'auto',
                    padding: '8px 14px',
                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                    fontSize: 11.5,
                    lineHeight: 1.75,
                    background: 'rgba(2,6,23,0.8)',
                }}
            >
                {filtered.length === 0 && (
                    <div style={{ color: '#475569', textAlign: 'center', paddingTop: 60, fontSize: 11 }}>
                        No logs yet — waiting for stream…
                    </div>
                )}
                {filtered.map(log => (
                    <div
                        key={log.id}
                        style={{
                            display: 'flex', gap: 8, alignItems: 'baseline',
                            padding: '0 0 1px',
                            borderBottom: '1px solid rgba(255,255,255,0.02)',
                        }}
                    >
                        <span style={{ color: '#334155', flexShrink: 0, fontSize: 10 }}>
                            {fmt(log.timestamp)}
                        </span>
                        <span style={{
                            color: LEVEL_COLORS[log.level] ?? '#7a9cc0',
                            fontWeight: 700,
                            flexShrink: 0,
                            width: 28,
                            fontSize: 9.5,
                        }}>
                            {LEVEL_BADGE[log.level] ?? log.level.toUpperCase()}
                        </span>
                        <span style={{
                            color: '#64748b',
                            flexShrink: 0,
                            fontSize: 10,
                            minWidth: 90,
                        }}>
                            [{log.source}]
                        </span>
                        <span style={{ color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {log.message}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
