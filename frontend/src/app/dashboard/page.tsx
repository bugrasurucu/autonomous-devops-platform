'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [deploying, setDeploying] = useState(false);
    const [showDeploy, setShowDeploy] = useState(false);
    const [deployForm, setDeployForm] = useState({ projectName: '', region: 'us-east-1', environment: 'production', budget: 100 });

    useEffect(() => {
        loadStats();
        const interval = setInterval(loadStats, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadStats = async () => {
        try {
            const data = await api.getStats();
            setStats(data);
        } catch { }
    };

    const handleDeploy = async () => {
        if (!deployForm.projectName) return;
        setDeploying(true);
        try {
            await api.deploy(deployForm);
            setShowDeploy(false);
            setDeployForm({ projectName: '', region: 'us-east-1', environment: 'production', budget: 100 });
            setTimeout(loadStats, 1000);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setDeploying(false);
        }
    };

    const statCards = stats ? [
        { label: 'Total Deploys', value: stats.totalDeploys, color: '#818cf8' },
        { label: 'Active Deploys', value: stats.activeDeploys, color: '#34d399' },
        { label: 'Agents', value: `${stats.activeAgents}/${stats.totalAgents}`, color: '#fbbf24' },
        { label: 'Active Incidents', value: stats.activeIncidents, color: '#f87171' },
    ] : [];

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700 }}>
                        Welcome back, <span className="gradient-text">{user?.name}</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
                        Here&apos;s your platform overview
                    </p>
                </div>
                <button className="btn-primary" onClick={() => setShowDeploy(true)}>
                    &#x25B6; Deploy
                </button>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {statCards.map((card) => (
                    <div key={card.label} className="glass-card" style={{ padding: 20 }}>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{card.label}</div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: card.color }}>{card.value}</div>
                    </div>
                ))}
            </div>

            {/* Agents + Activity grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Agents */}
                <div className="glass-card" style={{ padding: 20 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Agent Status</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {stats?.agents?.map((agent: any) => (
                            <div key={agent.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '10px 12px',
                                borderRadius: 10,
                                background: 'rgba(15, 23, 42, 0.5)',
                                border: '1px solid var(--border-color)',
                            }}>
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    background: agent.color + '20',
                                    border: `1px solid ${agent.color}40`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: 13,
                                    color: agent.color,
                                }}>
                                    {agent.letter}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{agent.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{agent.role}</div>
                                </div>
                                <span className={`status-dot ${agent.status}`} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Activity feed */}
                <div className="glass-card" style={{ padding: 20, maxHeight: 400, overflow: 'auto' }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Recent Activity</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {stats?.activities?.length === 0 && (
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No activity yet. Deploy to get started!</p>
                        )}
                        {stats?.activities?.map((a: any, i: number) => (
                            <div key={i} style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 10,
                                padding: '8px 0',
                                borderBottom: '1px solid var(--border-color)',
                            }}>
                                <div style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    background: a.color || '#818cf8',
                                    marginTop: 5,
                                    flexShrink: 0,
                                }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13 }}>{a.text}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                        {new Date(a.createdAt).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Deploy Modal */}
            {showDeploy && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100,
                }}
                    onClick={(e) => e.target === e.currentTarget && setShowDeploy(false)}
                >
                    <div className="glass-card page-enter" style={{ width: 460, padding: 32 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
                            <span className="gradient-text">New Deployment</span>
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Project Name</label>
                                <input className="input-field" placeholder="my-awesome-project" value={deployForm.projectName}
                                    onChange={(e) => setDeployForm({ ...deployForm, projectName: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Region</label>
                                    <select className="input-field" value={deployForm.region}
                                        onChange={(e) => setDeployForm({ ...deployForm, region: e.target.value })}>
                                        <option value="us-east-1">US East (N. Virginia)</option>
                                        <option value="eu-west-1">EU West (Ireland)</option>
                                        <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Environment</label>
                                    <select className="input-field" value={deployForm.environment}
                                        onChange={(e) => setDeployForm({ ...deployForm, environment: e.target.value })}>
                                        <option value="production">Production</option>
                                        <option value="staging">Staging</option>
                                        <option value="development">Development</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Budget ($)</label>
                                <input className="input-field" type="number" value={deployForm.budget}
                                    onChange={(e) => setDeployForm({ ...deployForm, budget: Number(e.target.value) })} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowDeploy(false)} style={{
                                padding: '10px 20px', borderRadius: 10, background: 'rgba(30,41,59,0.5)',
                                border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14,
                            }}>Cancel</button>
                            <button className="btn-primary" onClick={handleDeploy} disabled={deploying || !deployForm.projectName}>
                                {deploying ? 'Deploying...' : 'Start Deploy'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
