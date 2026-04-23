'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';

const STEP_ICONS: Record<string, string> = { reason: '🤔', act: '🔧', observe: '👁' };
const STEP_COLORS: Record<string, string> = { reason: '#818cf8', act: '#fbbf24', observe: '#34d399' };
const STEP_LABELS: Record<string, string> = { reason: 'REASON', act: 'ACT', observe: 'OBSERVE' };

// Backend returns `capabilities` array; UI expects tool objects with `.name`
function getTools(agent: any): { name: string }[] {
    if (Array.isArray(agent.tools) && agent.tools.length > 0) {
        return agent.tools.map((t: any) => (typeof t === 'string' ? { name: t } : t));
    }
    if (Array.isArray(agent.capabilities)) {
        return agent.capabilities.map((c: string) => ({ name: c }));
    }
    return [];
}

export default function AgentsPage() {
    const [agents, setAgents] = useState<any[]>([]);
    const [selected, setSelected] = useState<any>(null);
    const [executions, setExecutions] = useState<any[]>([]);
    const [activeExec, setActiveExec] = useState<any>(null);
    const [liveSteps, setLiveSteps] = useState<any[]>([]);
    const [customTask, setCustomTask] = useState('');
    const [triggering, setTriggering] = useState(false);

    // Use a ref for selected so the polling interval doesn't depend on it
    const selectedRef = useRef<any>(null);
    selectedRef.current = selected;

    // Load agents on mount; poll every 4 s — never re-creates due to stale closure
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const data = await api.getAgents();
                if (cancelled) return;
                setAgents(data);
                // Sync the selected agent state without causing a re-render loop
                const cur = selectedRef.current;
                if (cur) {
                    const updated = data.find((a: any) => a.id === cur.id);
                    if (updated) setSelected(updated);
                }
            } catch { /* ignore */ }
        };

        load();
        const interval = setInterval(load, 4000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []); // ← empty deps: runs once, no infinite loop

    const selectAgent = async (agent: any) => {
        setSelected(agent);
        setActiveExec(null);
        setLiveSteps([]);
        try {
            const execs = await api.getAgentExecutions(agent.id, 5);
            setExecutions(execs);
        } catch { setExecutions([]); }
    };

    const triggerAgent = async () => {
        const cur = selectedRef.current;
        if (!cur) return;
        setTriggering(true);
        setLiveSteps([]);
        setActiveExec(null);
        try {
            const triggerResult = await api.triggerAgent(cur.id, customTask || undefined);
            setCustomTask('');

            // Poll for real execution steps from the backend
            let attempts = 0;
            const maxAttempts = 15; // ~30 seconds max
            const pollInterval = 2000;

            const poll = async () => {
                attempts++;
                try {
                    const execs = await api.getAgentExecutions(cur.id, 1);
                    if (execs.length > 0) {
                        const latest = execs[0];
                        // Try to get detailed steps from the execution
                        const detail = await api.getAgentExecutionSteps(cur.id, latest.id);
                        if (detail && Array.isArray(detail.steps) && detail.steps.length > 0) {
                            setLiveSteps(detail.steps.map((s: any, i: number) => ({
                                ...s,
                                id: `live-${i}`,
                                timestamp: s.timestamp || new Date().toISOString(),
                            })));
                        }
                        if (latest.status === 'completed' || latest.status === 'failed') {
                            // Execution finished — show final result
                            if (detail && (!detail.steps || detail.steps.length === 0)) {
                                // No detailed steps from backend, show summary
                                setLiveSteps([{
                                    id: 'summary',
                                    type: latest.status === 'completed' ? 'observe' : 'reason',
                                    content: latest.result || `Agent ${latest.status}.`,
                                    timestamp: latest.completedAt || new Date().toISOString(),
                                }]);
                            }
                            setExecutions(await api.getAgentExecutions(cur.id, 5));
                            setTriggering(false);
                            return;
                        }
                    }
                } catch { /* backend may be catching up */ }

                if (attempts < maxAttempts) {
                    setTimeout(poll, pollInterval);
                } else {
                    // Timeout — show what we have
                    setLiveSteps(prev => prev.length > 0 ? prev : [{
                        id: 'timeout',
                        type: 'observe',
                        content: 'Agent is still processing. Check back shortly.',
                        timestamp: new Date().toISOString(),
                    }]);
                    try { setExecutions(await api.getAgentExecutions(cur.id, 5)); } catch {}
                    setTriggering(false);
                }
            };

            // Start polling after a brief delay to let the backend create the execution
            setTimeout(poll, 1500);
        } catch (e: any) {
            alert(e.message);
            setTriggering(false);
        }
    };

    const viewExecution = async (exec: any) => {
        const cur = selectedRef.current;
        setActiveExec(exec);
        setLiveSteps([]);
        try {
            const detail = await api.getAgentExecutionSteps(cur?.id, exec.id);
            if (detail?.steps) setLiveSteps(detail.steps);
        } catch { /* ignore */ }
    };

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700 }}><span className="gradient-text">Agent Management</span></h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                    ReAct-driven autonomous agents with real-time reasoning chain
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, minHeight: '70vh' }}>
                {/* Left: Agent list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {agents.map(agent => (
                        <div key={agent.id}
                            onClick={() => selectAgent(agent)}
                            className="glass-card"
                            style={{
                                padding: '14px 16px', cursor: 'pointer',
                                border: `1px solid ${selected?.id === agent.id ? agent.color + '60' : 'transparent'}`,
                                background: selected?.id === agent.id ? agent.color + '10' : undefined,
                                transition: 'all 0.15s',
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                    width: 38, height: 38, borderRadius: 10,
                                    background: agent.color + '20', border: `1.5px solid ${agent.color}40`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 18,
                                }}>{agent.emoji || agent.letter}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: selected?.id === agent.id ? agent.color : '#e2e8f0' }}>
                                        {agent.name}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{agent.role}</div>
                                </div>
                                <div style={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    background: agent.status === 'working' ? '#818cf8' : agent.status === 'error' ? '#f87171' : '#334155',
                                    boxShadow: agent.status === 'working' ? `0 0 6px #818cf8` : undefined,
                                    animation: agent.status === 'working' ? 'pulse 1.5s infinite' : undefined,
                                }} />
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
                                <span>🔧 {getTools(agent).length} tools</span>
                                <span>📊 {agent.stats?.totalRuns || 0} runs</span>
                                <span style={{ color: '#34d399' }}>✓ {agent.stats?.successRate || 100}%</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right: Agent detail + ReAct chain */}
                {!selected ? (
                    <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                        <span style={{ fontSize: 40 }}>🤖</span>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Select an agent to view details and reasoning chain</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {/* Agent header */}
                        <div className="glass-card" style={{ padding: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                                <div style={{
                                    width: 52, height: 52, borderRadius: 14,
                                    background: selected.color + '20', border: `2px solid ${selected.color}40`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                                }}>{selected.emoji}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <h2 style={{ fontSize: 17, fontWeight: 700, color: selected.color }}>{selected.name}</h2>
                                        <span style={{
                                            fontSize: 11, padding: '2px 9px', borderRadius: 6, fontWeight: 600,
                                            background: selected.status === 'working' ? 'rgba(129,140,248,0.2)' : 'rgba(30,41,59,0.5)',
                                            color: selected.status === 'working' ? '#818cf8' : 'var(--text-secondary)',
                                        }}>{selected.status}</span>
                                    </div>
                                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                                        {selected.description}
                                    </p>
                                </div>
                            </div>

                            {/* MCP servers */}
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                                {selected.mcpServers?.map((s: string) => (
                                    <span key={s} style={{
                                        fontSize: 10, padding: '2px 7px', borderRadius: 5,
                                        background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                                        color: '#818cf8', fontFamily: 'monospace',
                                    }}>{s}</span>
                                ))}
                            </div>

                            {/* Tool registry */}
                            <div style={{ marginBottom: 14 }}>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tool Registry</div>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {getTools(selected).map((t) => (
                                        <span key={t.name} style={{
                                            fontSize: 11, padding: '3px 9px', borderRadius: 6,
                                            background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
                                            color: '#fbbf24',
                                        }}>🔧 {t.name}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Trigger */}
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                    className="input-field"
                                    style={{ flex: 1 }}
                                    placeholder={`Custom task for ${selected.name}... (optional)`}
                                    value={customTask}
                                    onChange={e => setCustomTask(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !triggering && triggerAgent()}
                                />
                                <button
                                    className="btn-primary"
                                    onClick={triggerAgent}
                                    disabled={triggering || selected.status === 'working'}
                                    style={{ whiteSpace: 'nowrap' }}
                                >
                                    {triggering || selected.status === 'working' ? '⏳ Running...' : '▶ Trigger'}
                                </button>
                            </div>
                        </div>

                        {/* ReAct Chain */}
                        <div className="glass-card" style={{ padding: 20, flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 600 }}>
                                    🔍 Reasoning Chain {activeExec && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>— {new Date(activeExec.createdAt).toLocaleString()}</span>}
                                </h3>
                                {executions.length > 0 && (
                                    <select
                                        className="input-field"
                                        style={{ padding: '4px 8px', fontSize: 11 }}
                                        onChange={e => {
                                            const exec = executions.find((x: any) => x.id === e.target.value);
                                            if (exec) viewExecution(exec);
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="">Recent executions...</option>
                                        {executions.map((e: any) => (
                                            <option key={e.id} value={e.id}>
                                                {new Date(e.createdAt).toLocaleTimeString()} — {e.status} ({Math.round(e.durationMs / 1000)}s)
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {liveSteps.length === 0 && !triggering ? (
                                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', fontSize: 13 }}>
                                    Trigger the agent to see the reasoning chain
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflow: 'auto' }}>
                                    {liveSteps.map((step, i) => (
                                        <div key={step.id || i} style={{
                                            padding: '12px 14px', borderRadius: 10,
                                            background: STEP_COLORS[step.type] + '08',
                                            border: `1px solid ${STEP_COLORS[step.type]}25`,
                                            animation: 'fadeIn 0.3s ease',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                <span style={{ fontSize: 14 }}>{STEP_ICONS[step.type]}</span>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: STEP_COLORS[step.type], letterSpacing: '0.08em' }}>
                                                    {STEP_LABELS[step.type]}
                                                </span>
                                                {step.tool && (
                                                    <span style={{
                                                        fontSize: 10, padding: '1px 6px', borderRadius: 4,
                                                        background: 'rgba(251,191,36,0.1)', color: '#fbbf24',
                                                        fontFamily: 'monospace',
                                                    }}>{step.tool}</span>
                                                )}
                                                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-secondary)' }}>
                                                    {step.durationMs ? `${step.durationMs}ms` : ''}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.6 }}>
                                                {step.content || step.tool}
                                            </div>
                                            {step.output && (
                                                <div style={{
                                                    marginTop: 8, padding: '6px 10px', borderRadius: 6,
                                                    background: 'rgba(15,23,42,0.6)', fontFamily: 'monospace',
                                                    fontSize: 11, color: '#94a3b8', overflowX: 'auto',
                                                }}>
                                                    {step.output}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {(triggering || selected.status === 'working') && liveSteps.length < 6 && (
                                        <div style={{
                                            padding: '12px 14px', borderRadius: 10,
                                            background: 'rgba(129,140,248,0.06)',
                                            border: '1px solid rgba(129,140,248,0.2)',
                                            display: 'flex', alignItems: 'center', gap: 10, fontSize: 12,
                                            color: '#818cf8',
                                        }}>
                                            <span style={{ animation: 'spin 1s linear infinite' }}>⟳</span>
                                            Thinking...
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
            `}</style>
        </div>
    );
}
