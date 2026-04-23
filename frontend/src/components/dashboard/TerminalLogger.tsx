'use client';

import { useEffect, useState, useRef } from 'react';

interface LogEntry {
  id: number;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

const LEVEL_COLORS: Record<string, string> = {
  info: '#00ffc8',
  warn: '#fbbf24',
  error: '#ff5f57',
  success: '#34d399',
};

const LOG_TEMPLATES: { level: LogEntry['level']; message: string }[] = [
  { level: 'info', message: '[kagent] CRD sync — 4 agents healthy' },
  { level: 'info', message: '[infra-agent] Terraform plan: 0 to add, 0 to change, 0 to destroy' },
  { level: 'success', message: '[pipeline-agent] GitHub Actions workflow completed — all checks passed' },
  { level: 'warn', message: '[finops-agent] Budget alert: $2.10 / $5.00 (42%) — within threshold' },
  { level: 'info', message: '[sre-agent] CloudWatch anomaly scan: no anomalies detected' },
  { level: 'error', message: '[kagent] Pod orbitron-worker-3: CrashLoopBackOff — container OOMKilled (512Mi limit)' },
  { level: 'info', message: '[system] Health check: API latency 23ms, DB connections: 4/20' },
  { level: 'warn', message: '[sre-agent] Memory pressure detected on node ip-10-0-1-42 (78%)' },
  { level: 'success', message: '[infra-agent] ECS service stable — 3/3 tasks running' },
  { level: 'error', message: '[pipeline-agent] E2E test timeout on /api/v1/deploy endpoint (30s)' },
  { level: 'info', message: '[finops-agent] Graviton migration opportunity: save ~$12/mo on t3.medium → t4g.medium' },
  { level: 'success', message: '[sre-agent] Auto-remediation: restarted orbitron-worker-3 — pod healthy' },
];

export default function TerminalLogger() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef(0);

  useEffect(() => {
    // Add initial batch
    const initial: LogEntry[] = Array.from({ length: 5 }, (_, i) => {
      const tmpl = LOG_TEMPLATES[i % LOG_TEMPLATES.length];
      return {
        id: i,
        timestamp: new Date(Date.now() - (4 - i) * 3000).toISOString().split('T')[1].substring(0, 8),
        level: tmpl.level,
        message: tmpl.message,
      };
    });
    counterRef.current = 5;
    setLogs(initial);

    const id = setInterval(() => {
      const tmpl = LOG_TEMPLATES[counterRef.current % LOG_TEMPLATES.length];
      const entry: LogEntry = {
        id: counterRef.current,
        timestamp: new Date().toISOString().split('T')[1].substring(0, 8),
        level: tmpl.level,
        message: tmpl.message,
      };
      counterRef.current++;
      setLogs(prev => [...prev.slice(-30), entry]);
    }, 4000);

    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glass-card" style={{ padding: 0, marginBottom: 16, overflow: 'hidden' }}>
      <div style={{
        padding: '8px 14px',
        background: 'rgba(0,0,0,0.4)',
        borderBottom: '1px solid rgba(0,255,200,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#34d399',
          boxShadow: '0 0 6px #34d399',
          animation: 'pulse 2s ease-in-out infinite',
        }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#00ffc8', fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}>
          orbitron-system-logs
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)', marginLeft: 'auto' }}>
          LIVE · {logs.length} entries
        </span>
      </div>

      <div
        ref={containerRef}
        style={{
          height: 180,
          overflowY: 'auto',
          padding: '8px 14px',
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontSize: 11.5,
          lineHeight: 1.7,
          background: 'rgba(2,6,23,0.7)',
        }}
      >
        {logs.map(log => (
          <div key={log.id} style={{ display: 'flex', gap: 8, whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <span style={{ color: '#475569', flexShrink: 0 }}>{log.timestamp}</span>
            <span style={{
              color: LEVEL_COLORS[log.level],
              fontWeight: 600,
              flexShrink: 0,
              width: 40,
              textTransform: 'uppercase',
            }}>
              {log.level === 'success' ? 'ok' : log.level}
            </span>
            <span style={{ color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
