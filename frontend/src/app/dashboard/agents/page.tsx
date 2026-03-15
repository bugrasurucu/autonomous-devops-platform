'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AgentsPage() {
    const [agents, setAgents] = useState<any[]>([]);

    useEffect(() => {
        loadAgents();
        const interval = setInterval(loadAgents, 3000);
        return () => clearInterval(interval);
    }, []);

    const loadAgents = async () => {
        try {
            const data = await api.getAgents();
            setAgents(data);
        } catch { }
    };

    const triggerAgent = async (id: string) => {
        try {
            await api.triggerAgent(id, 'Manual trigger from dashboard');
            setTimeout(loadAgents, 500);
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
                <span className="gradient-text">Agent Management</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                Monitor and control your autonomous agents
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {agents.map((agent) => (
                    <div key={agent.id} className="glass-card" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                            <div style={{
                                width: 48,
                                height: 48,
                                borderRadius: 12,
                                background: agent.color + '20',
                                border: `2px solid ${agent.color}40`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: 20,
                                color: agent.color,
                            }}>
                                {agent.letter}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>{agent.name}</h3>
                                    <span className={`status-dot ${agent.status}`} />
                                    <span style={{
                                        fontSize: 11,
                                        padding: '2px 8px',
                                        borderRadius: 6,
                                        background: agent.status === 'working' ? 'rgba(129,140,248,0.15)' :
                                            agent.status === 'error' ? 'rgba(248,113,113,0.15)' : 'rgba(148,163,184,0.1)',
                                        color: agent.status === 'working' ? '#818cf8' :
                                            agent.status === 'error' ? '#f87171' : '#94a3b8',
                                        fontWeight: 500,
                                        textTransform: 'capitalize',
                                    }}>
                                        {agent.status}
                                    </span>
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{agent.role}</div>
                            </div>
                        </div>

                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 12 }}>
                            {agent.description}
                        </p>

                        {/* MCP Servers */}
                        <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {agent.mcpServers?.map((s: string) => (
                                <span key={s} style={{
                                    fontSize: 11,
                                    padding: '3px 8px',
                                    borderRadius: 6,
                                    background: 'rgba(99,102,241,0.1)',
                                    border: '1px solid rgba(99,102,241,0.2)',
                                    color: 'var(--accent-light)',
                                    fontFamily: 'JetBrains Mono, monospace',
                                }}>
                                    {s}
                                </span>
                            ))}
                        </div>

                        {/* Capabilities */}
                        <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {agent.capabilities?.slice(0, 4).map((c: string) => (
                                <span key={c} style={{
                                    fontSize: 11,
                                    padding: '3px 8px',
                                    borderRadius: 6,
                                    background: 'rgba(30,41,59,0.5)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-secondary)',
                                }}>
                                    {c}
                                </span>
                            ))}
                        </div>

                        {/* Action */}
                        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                            <button
                                className="btn-primary"
                                onClick={() => triggerAgent(agent.id)}
                                disabled={agent.status === 'working'}
                                style={{ flex: 1, padding: '8px 14px', fontSize: 13 }}
                            >
                                {agent.status === 'working' ? 'Working...' : 'Trigger'}
                            </button>
                        </div>

                        {agent.lastActivity && (
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>
                                Last active: {new Date(agent.lastActivity).toLocaleString()}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
