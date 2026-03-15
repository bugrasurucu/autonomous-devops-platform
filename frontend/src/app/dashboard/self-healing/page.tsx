'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function SelfHealingPage() {
    const [incidents, setIncidents] = useState<any[]>([]);

    useEffect(() => {
        loadIncidents();
        const interval = setInterval(loadIncidents, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadIncidents = async () => {
        try {
            const data = await api.getIncidents(30);
            setIncidents(data);
        } catch { }
    };

    const resolveIncident = async (id: string) => {
        try {
            await api.resolveIncident(id, 'Resolved from dashboard');
            loadIncidents();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const statusColors: Record<string, string> = {
        active: '#f87171',
        investigating: '#fbbf24',
        resolved: '#34d399',
    };

    const active = incidents.filter((i) => i.status === 'active');
    const resolved = incidents.filter((i) => i.status === 'resolved');

    // Heal cycle flow
    const healCycle = ['Sense', 'Analyze', 'Act', 'Verify'];

    return (
        <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
                <span className="gradient-text">Self-Healing Engine</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                Autonomous incident detection and remediation
            </p>

            {/* Heal Cycle Visualization */}
            <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Heal Cycle (SAAV)</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    {healCycle.map((step, i) => (
                        <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                width: 80, height: 80, borderRadius: '50%',
                                background: 'rgba(99,102,241,0.1)', border: '2px solid rgba(99,102,241,0.3)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <div style={{ fontSize: 20 }}>
                                    {['🔍', '🧠', '⚡', '✅'][i]}
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2 }}>{step}</div>
                            </div>
                            {i < healCycle.length - 1 && (
                                <div style={{
                                    width: 40, height: 2,
                                    background: 'linear-gradient(90deg, rgba(99,102,241,0.3), rgba(99,102,241,0.1))',
                                }} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
                {[
                    { label: 'Active Incidents', value: active.length, color: '#f87171' },
                    { label: 'Resolved', value: resolved.length, color: '#34d399' },
                    { label: 'Total', value: incidents.length, color: '#818cf8' },
                ].map((s) => (
                    <div key={s.label} className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Incident Timeline */}
            <div className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Incident Timeline</h3>
                {incidents.length === 0 && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        No incidents recorded. Your system is healthy!
                    </p>
                )}
                {incidents.map((incident) => (
                    <div key={incident.id} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 14,
                        padding: '14px 0', borderBottom: '1px solid var(--border-color)',
                    }}>
                        <div style={{
                            width: 10, height: 10, borderRadius: '50%',
                            background: statusColors[incident.status] || '#94a3b8',
                            marginTop: 5, flexShrink: 0,
                            boxShadow: incident.status === 'active' ? `0 0 8px ${statusColors.active}80` : 'none',
                        }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{incident.title}</div>
                                    {incident.description && (
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                                            {incident.description}
                                        </div>
                                    )}
                                </div>
                                <span style={{
                                    fontSize: 11, padding: '3px 10px', borderRadius: 6, fontWeight: 500,
                                    background: (statusColors[incident.status] || '#94a3b8') + '20',
                                    color: statusColors[incident.status] || '#94a3b8',
                                    textTransform: 'capitalize',
                                }}>
                                    {incident.status}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: 12, marginTop: 6, alignItems: 'center' }}>
                                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                    {new Date(incident.createdAt).toLocaleString()}
                                </span>
                                {incident.status === 'active' && (
                                    <button onClick={() => resolveIncident(incident.id)} style={{
                                        fontSize: 11, padding: '2px 10px', borderRadius: 6,
                                        background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)',
                                        color: '#34d399', cursor: 'pointer', fontWeight: 500,
                                    }}>
                                        Resolve
                                    </button>
                                )}
                                {incident.resolution && (
                                    <span style={{ fontSize: 11, color: '#34d399' }}>
                                        Resolution: {incident.resolution}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
