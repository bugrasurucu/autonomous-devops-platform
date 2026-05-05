'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

const SEVERITY_COLORS: Record<string, string> = {
    critical: '#f87171',
    high: '#fb923c',
    medium: '#fbbf24',
    low: '#34d399',
};

const SEVERITY_BG: Record<string, string> = {
    critical: 'rgba(248,113,113,0.08)',
    high: 'rgba(251,146,60,0.08)',
    medium: 'rgba(251,191,36,0.08)',
    low: 'rgba(52,211,153,0.08)',
};

const STATUS_COLORS: Record<string, string> = {
    active: '#f87171',
    investigating: '#fbbf24',
    resolved: '#34d399',
};

const HEAL_STEPS = [
    { icon: '🔍', label: 'Sense', desc: 'Detect anomaly' },
    { icon: '🧠', label: 'Analyze', desc: 'Root cause analysis' },
    { icon: '⚡', label: 'Act', desc: 'Apply remediation' },
    { icon: '✅', label: 'Verify', desc: 'Confirm resolution' },
];

export default function SelfHealingPage() {
    const [incidents, setIncidents] = useState<any[]>([]);
    const [stats, setStats] = useState({ active: 0, resolved: 0, total: 0 });
    const [simulating, setSimulating] = useState(false);
    const [resolving, setResolving] = useState<string | null>(null);
    const [healStep, setHealStep] = useState(0); // 0-3 animated step
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ title: '', description: '', severity: 'medium' });
    const [creating, setCreating] = useState(false);

    const loadAll = useCallback(async () => {
        try {
            const [data, s] = await Promise.all([
                api.getIncidents(30),
                fetch('/api/proxy/incidents/stats', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('orbitron_token')}` },
                }).then(r => r.ok ? r.json() : { active: 0, resolved: 0, total: 0 }).catch(() => ({ active: 0, resolved: 0, total: 0 })),
            ]);
            setIncidents(data);
            // Derive stats from data
            setStats({
                active: data.filter((i: any) => i.status === 'active').length,
                resolved: data.filter((i: any) => i.status === 'resolved').length,
                total: data.length,
            });
        } catch { }
    }, []);

    useEffect(() => {
        loadAll();
        const interval = setInterval(loadAll, 5000);
        return () => clearInterval(interval);
    }, [loadAll]);

    // Animate SAAV cycle when there are active incidents
    useEffect(() => {
        const hasActive = incidents.some(i => i.status === 'active');
        if (!hasActive) { setHealStep(0); return; }
        const t = setInterval(() => setHealStep(s => (s + 1) % 4), 1800);
        return () => clearInterval(t);
    }, [incidents]);

    const handleSimulate = async () => {
        setSimulating(true);
        try {
            await api.simulateIncident();
            await loadAll();
        } catch (e: any) { alert(e.message); }
        finally { setSimulating(false); }
    };

    const handleResolve = async (id: string) => {
        setResolving(id);
        try {
            await api.resolveIncident(id, 'Auto-resolved by SRE agent');
            await loadAll();
        } catch (e: any) { alert(e.message); }
        finally { setResolving(null); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createForm.title.trim()) return;
        setCreating(true);
        try {
            await api.createIncident(createForm.title, createForm.description, createForm.severity);
            setCreateForm({ title: '', description: '', severity: 'medium' });
            setShowCreate(false);
            await loadAll();
        } catch (e: any) { alert(e.message); }
        finally { setCreating(false); }
    };

    const activeIncidents = incidents.filter(i => i.status === 'active');
    const otherIncidents = incidents.filter(i => i.status !== 'active');

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700 }}>
                        <span className="gradient-text">Self-Healing Engine</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                        Autonomous incident detection and remediation — Sense → Analyze → Act → Verify
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        onClick={() => setShowCreate(true)}
                        style={{
                            padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600,
                            background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.3)', color: '#818cf8',
                        }}
                    >
                        + Create Incident
                    </button>
                    <button
                        onClick={handleSimulate}
                        disabled={simulating}
                        className="btn-primary"
                        style={{ fontSize: 13 }}
                    >
                        {simulating ? '⏳ Simulating...' : '⚡ Simulate Incident'}
                    </button>
                </div>
            </div>

            {/* SAAV Cycle */}
            <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600 }}>SAAV Heal Cycle</h3>
                    <span style={{
                        fontSize: 11, padding: '3px 10px', borderRadius: 6, fontWeight: 600,
                        background: stats.active > 0 ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)',
                        color: stats.active > 0 ? '#f87171' : '#34d399',
                    }}>
                        {stats.active > 0 ? `${stats.active} active incident${stats.active > 1 ? 's' : ''}` : '✓ All Systems Normal'}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    {HEAL_STEPS.map((step, i) => {
                        const isActive = stats.active > 0 && healStep === i;
                        const isPast = stats.active > 0 && healStep > i;
                        return (
                            <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                                }}>
                                    <div style={{
                                        width: 72, height: 72, borderRadius: '50%',
                                        background: isActive ? 'rgba(99,102,241,0.2)' : isPast ? 'rgba(52,211,153,0.1)' : 'rgba(30,41,59,0.6)',
                                        border: `2px solid ${isActive ? '#818cf8' : isPast ? '#34d399' : 'rgba(99,102,241,0.2)'}`,
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.4s ease',
                                        boxShadow: isActive ? '0 0 20px rgba(129,140,248,0.3)' : 'none',
                                        animation: isActive ? 'pulse-ring 1.5s ease infinite' : undefined,
                                    }}>
                                        <span style={{ fontSize: 22 }}>{step.icon}</span>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? '#818cf8' : isPast ? '#34d399' : 'var(--text-secondary)' }}>
                                            {step.label}
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{step.desc}</div>
                                    </div>
                                </div>
                                {i < HEAL_STEPS.length - 1 && (
                                    <div style={{
                                        width: 48, height: 2, marginBottom: 28,
                                        background: isPast
                                            ? 'linear-gradient(90deg, #34d399, #34d39960)'
                                            : isActive
                                                ? 'linear-gradient(90deg, #818cf8, #818cf840)'
                                                : 'rgba(99,102,241,0.15)',
                                        transition: 'all 0.4s ease',
                                    }} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
                {[
                    { label: 'Active Incidents', value: stats.active, color: '#f87171', icon: '🔴' },
                    { label: 'Resolved', value: stats.resolved, color: '#34d399', icon: '✅' },
                    { label: 'Total', value: stats.total, color: '#818cf8', icon: '📊' },
                ].map(s => (
                    <div key={s.label} className="glass-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span style={{ fontSize: 28 }}>{s.icon}</span>
                        <div>
                            <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Active Incidents */}
            {activeIncidents.length > 0 && (
                <div className="glass-card" style={{ padding: 20, marginBottom: 16, border: '1px solid rgba(248,113,113,0.2)' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: '#f87171' }}>
                        🔴 Active Incidents ({activeIncidents.length})
                    </h3>
                    {activeIncidents.map(incident => (
                        <div key={incident.id} style={{
                            padding: '14px 16px', borderRadius: 10, marginBottom: 10,
                            background: SEVERITY_BG[incident.severity] || SEVERITY_BG.medium,
                            border: `1px solid ${SEVERITY_COLORS[incident.severity] || '#fbbf24'}30`,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span style={{
                                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                                            background: (SEVERITY_COLORS[incident.severity] || '#fbbf24') + '20',
                                            color: SEVERITY_COLORS[incident.severity] || '#fbbf24',
                                            textTransform: 'uppercase', letterSpacing: '0.05em',
                                        }}>
                                            {incident.severity || 'medium'}
                                        </span>
                                        <span style={{ fontSize: 14, fontWeight: 600 }}>{incident.title}</span>
                                    </div>
                                    {incident.description && (
                                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                            {incident.description}
                                        </div>
                                    )}
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
                                        🕐 {new Date(incident.createdAt).toLocaleString()}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleResolve(incident.id)}
                                    disabled={resolving === incident.id}
                                    style={{
                                        padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                        background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)',
                                        color: '#34d399', whiteSpace: 'nowrap', flexShrink: 0,
                                    }}
                                >
                                    {resolving === incident.id ? '⏳ Resolving...' : '✓ Resolve'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Incident History */}
            <div className="glass-card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
                    📋 Incident History
                </h3>
                {incidents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', fontSize: 13 }}>
                        <div style={{ fontSize: 36, marginBottom: 12 }}>🛡️</div>
                        No incidents recorded. Your system is healthy!
                        <br />
                        <span style={{ fontSize: 12 }}>Click "Simulate Incident" to test the self-healing flow.</span>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {otherIncidents.concat(activeIncidents.length > 0 ? [] : activeIncidents).map(incident => (
                            <div key={incident.id} style={{
                                display: 'flex', alignItems: 'flex-start', gap: 12,
                                padding: '12px 0', borderBottom: '1px solid var(--border-color)',
                            }}>
                                <div style={{
                                    width: 9, height: 9, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                                    background: STATUS_COLORS[incident.status] || '#94a3b8',
                                    boxShadow: incident.status === 'active' ? `0 0 8px ${STATUS_COLORS.active}80` : 'none',
                                }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                        <div>
                                            <span style={{
                                                fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, marginRight: 7,
                                                background: (SEVERITY_COLORS[incident.severity] || '#fbbf24') + '15',
                                                color: SEVERITY_COLORS[incident.severity] || '#fbbf24',
                                            }}>
                                                {incident.severity || 'medium'}
                                            </span>
                                            <span style={{ fontSize: 13, fontWeight: 500 }}>{incident.title}</span>
                                        </div>
                                        <span style={{
                                            fontSize: 11, padding: '2px 8px', borderRadius: 5, fontWeight: 500, flexShrink: 0,
                                            background: (STATUS_COLORS[incident.status] || '#94a3b8') + '15',
                                            color: STATUS_COLORS[incident.status] || '#94a3b8',
                                        }}>
                                            {incident.status}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
                                        {new Date(incident.createdAt).toLocaleString()}
                                        {incident.resolution && <span style={{ color: '#34d399', marginLeft: 10 }}>→ {incident.resolution}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Incident Modal */}
            {showCreate && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
                    <div className="glass-card" style={{ padding: 28, width: 460, maxWidth: '90vw' }}>
                        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>🚨 Create Incident</h3>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Title *</label>
                                <input
                                    className="input-field"
                                    placeholder="e.g. CPU spike on api-service"
                                    value={createForm.title}
                                    onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Description</label>
                                <textarea
                                    className="input-field"
                                    placeholder="What happened? Impact? Steps to reproduce?"
                                    value={createForm.description}
                                    onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                                    rows={3}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Severity</label>
                                <select
                                    className="input-field"
                                    value={createForm.severity}
                                    onChange={e => setCreateForm({ ...createForm, severity: e.target.value })}
                                >
                                    <option value="critical">🔴 Critical</option>
                                    <option value="high">🟠 High</option>
                                    <option value="medium">🟡 Medium</option>
                                    <option value="low">🟢 Low</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button type="submit" className="btn-primary" disabled={creating} style={{ flex: 1, justifyContent: 'center' }}>
                                    {creating ? '⏳ Creating...' : '🚨 Create Incident'}
                                </button>
                                <button type="button" onClick={() => setShowCreate(false)} style={{
                                    padding: '10px 16px', borderRadius: 8, background: 'none',
                                    border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer',
                                }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse-ring {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(129,140,248,0.3); }
                    50% { box-shadow: 0 0 0 8px rgba(129,140,248,0); }
                }
            `}</style>
        </div>
    );
}
