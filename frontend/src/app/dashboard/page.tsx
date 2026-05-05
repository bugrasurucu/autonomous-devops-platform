'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import dynamic from 'next/dynamic';

const MetricsWidget = dynamic(() => import('@/components/dashboard/MetricsWidget'), { ssr: false });
const TerminalLogger = dynamic(() => import('@/components/dashboard/TerminalLogger'), { ssr: false });

const PRIORITY_COLORS: Record<string, string> = {
    critical: '#f87171', high: '#fb923c', medium: '#fbbf24', low: '#34d399',
};
const PRIORITY_BG: Record<string, string> = {
    critical: 'rgba(248,113,113,0.08)', high: 'rgba(251,146,60,0.08)',
    medium: 'rgba(251,191,36,0.08)', low: 'rgba(52,211,153,0.08)',
};

function MetricBar({ label, value, unit = '%', color, warning = 80, critical = 90 }: any) {
    const pct = Math.min(Math.round(value), 100);
    const barColor = pct >= critical ? '#f87171' : pct >= warning ? '#fbbf24' : color || '#34d399';
    return (
        <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontWeight: 600, color: barColor }}>{pct}{unit}</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(30,41,59,0.8)', overflow: 'hidden' }}>
                <div style={{
                    height: '100%', width: `${pct}%`, borderRadius: 3,
                    background: `linear-gradient(90deg, ${barColor}90, ${barColor})`,
                    transition: 'width 1s ease',
                    boxShadow: pct >= critical ? `0 0 8px ${barColor}60` : undefined,
                }} />
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [metrics, setMetrics] = useState<any>(null);
    const [usage, setUsage] = useState<any>(null);
    const [deployments, setDeployments] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [showDeploy, setShowDeploy] = useState(false);
    const [scaling, setScaling] = useState<string | null>(null);
    const [deployForm, setDeployForm] = useState({ projectName: '', region: 'us-east-1', environment: 'production', budget: 100 });
    const [deploying, setDeploying] = useState(false);

    const loadAll = useCallback(async () => {
        try {
            const [s, d, sug, m, u] = await Promise.all([
                api.getStats().catch(() => null),
                api.getDeployments(5).catch(() => []),
                api.cost.getSuggestions().catch(() => []),
                api.cost.getMetrics().catch(() => null),
                api.cost.getUsage().catch(() => null),
            ]);
            setStats(s);
            setDeployments(d || []);
            setSuggestions(sug || []);
            setMetrics(m);
            setUsage(u);
        } catch { }
    }, []);

    useEffect(() => {
        loadAll();
        const interval = setInterval(loadAll, 15000);
        return () => clearInterval(interval);
    }, [loadAll]);

    const handleScale = async (action: string) => {
        setScaling(action);
        try {
            await api.cost.scale(action);
            await loadAll();
        } catch (e: any) { alert(e.message); }
        finally { setScaling(null); }
    };

    const handleDeploy = async () => {
        if (!deployForm.projectName.trim()) return;
        setDeploying(true);
        try {
            await api.deploy(deployForm);
            setShowDeploy(false);
            setDeployForm({ projectName: '', region: 'us-east-1', environment: 'production', budget: 100 });
            await loadAll();
        } catch (e: any) { alert(e.message); }
        finally { setDeploying(false); }
    };

    const criticalSuggestions = suggestions.filter(s => s.priority === 'critical' || s.priority === 'high');
    const otherSuggestions = suggestions.filter(s => s.priority !== 'critical' && s.priority !== 'high');

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700 }}><span className="gradient-text">Orbitron</span> <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>Command</span></h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                        {usage && <span>Plan: <strong style={{ color: usage.tier?.color }}>{usage.tier?.name}</strong> · </span>}
                        Real-time DevOps overview
                    </p>
                </div>
                <button className="btn-primary" onClick={() => setShowDeploy(true)}>
                    ▶ Deploy
                </button>
            </div>

            {/* Tier Banner */}
            {usage && (
                <div style={{
                    padding: '12px 18px', borderRadius: 12, marginBottom: 20,
                    background: `linear-gradient(135deg, ${usage.tier?.color}12, transparent)`,
                    border: `1px solid ${usage.tier?.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 18 }}>
                            {usage.plan === 'free' ? '🆓' : usage.plan === 'starter' ? '🚀' : usage.plan === 'pro' ? '⚡' : '🏢'}
                        </span>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: usage.tier?.color }}>
                                {usage.tier?.name} Plan
                                {usage.plan === 'free' && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-secondary)', fontWeight: 400 }}>· Free</span>}
                                {usage.tier?.price > 0 && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-secondary)', fontWeight: 400 }}>· ${usage.tier.price}/mo</span>}
                            </div>
                            <div style={{ display: 'flex', gap: 16, marginTop: 3 }}>
                                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                    Deploy: <strong style={{ color: usage.usage.deploys.pct >= 80 ? '#f87171' : '#94a3b8' }}>
                                        {usage.usage.deploys.used}/{usage.usage.deploys.limit === -1 ? '∞' : usage.usage.deploys.limit}
                                    </strong>
                                </span>
                                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                    Agents: <strong style={{ color: usage.usage.agentRuns.pct >= 80 ? '#f87171' : '#94a3b8' }}>
                                        {usage.usage.agentRuns.used}/{usage.usage.agentRuns.limit === -1 ? '∞' : usage.usage.agentRuns.limit}
                                    </strong>
                                </span>
                                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                    Estimated: <strong style={{ color: '#34d399' }}>${usage.estimatedCost}/mo</strong>
                                </span>
                            </div>
                        </div>
                    </div>
                    {usage.plan === 'free' && (
                        <a href="/dashboard/finops" style={{
                            fontSize: 12, padding: '6px 12px', borderRadius: 8, fontWeight: 600,
                            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                            color: '#818cf8', textDecoration: 'none',
                        }}>Compare Plans →</a>
                    )}
                </div>
            )}

            {/* Critical Suggestions */}
            {criticalSuggestions.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                    {criticalSuggestions.map(sug => (
                        <div key={sug.id} style={{
                            padding: '14px 18px', borderRadius: 12, marginBottom: 10,
                            background: PRIORITY_BG[sug.priority],
                            border: `1px solid ${PRIORITY_COLORS[sug.priority]}30`,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                <span style={{ fontSize: 18, flexShrink: 0 }}>{sug.icon}</span>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: PRIORITY_COLORS[sug.priority] }}>
                                        {sug.title}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                                        {sug.description}
                                    </div>
                                </div>
                            </div>
                            {sug.actionType?.startsWith('scale') && (
                                <button
                                    onClick={() => handleScale(sug.actionType)}
                                    disabled={!!scaling}
                                    style={{
                                        padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                                        background: PRIORITY_COLORS[sug.priority] + '20',
                                        border: `1px solid ${PRIORITY_COLORS[sug.priority]}50`,
                                        color: PRIORITY_COLORS[sug.priority], cursor: 'pointer', whiteSpace: 'nowrap',
                                    }}
                                >
                                    {scaling === sug.actionType ? '⏳ Applying...' : sug.action}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
                {[
                    { label: 'Total Deployments', value: stats?.totalDeployments ?? '—', icon: '🚀', color: '#818cf8' },
                    { label: 'Active Agents', value: '4', icon: '🤖', color: '#34d399' },
                    { label: 'Success Rate', value: `${stats?.successRate ?? 95}%`, icon: '✅', color: '#34d399' },
                    { label: 'Est. Monthly Cost', value: usage ? `$${usage.estimatedCost}` : '—', icon: '💰', color: '#fbbf24' },
                ].map(card => (
                    <div key={card.label} className="glass-card" style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 20 }}>{card.icon}</span>
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: card.color }}>{card.value}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>{card.label}</div>
                    </div>
                ))}
            </div>

            {/* Observability UI */}
            <MetricsWidget />
            <TerminalLogger />

            {/* Metrics + Suggestions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                {/* System metrics */}
                <div className="glass-card" style={{ padding: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>📊 System Metrics</h3>
                    {metrics ? (
                        <>
                            <MetricBar label="CPU Usage" value={metrics.cpuPercent} color="#818cf8" />
                            <MetricBar label="Memory Usage" value={metrics.memPercent} color="#34d399" />
                            <MetricBar label="Error Rate" value={metrics.errorRate} unit="%" color="#34d399" warning={3} critical={8} />
                            <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
                                <span>⚡ {Math.round(metrics.reqPerSec)} req/s</span>
                                <span>🔗 {metrics.activeConns} conns</span>
                            </div>
                        </>
                    ) : (
                        <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No metrics available</div>
                    )}
                </div>

                {/* Usage limits */}
                <div className="glass-card" style={{ padding: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>📈 Usage Limits</h3>
                    {usage ? (
                        <>
                            <MetricBar
                                label={`Deploy (${usage.usage.deploys.used}/${usage.usage.deploys.limit === -1 ? '∞' : usage.usage.deploys.limit})`}
                                value={usage.usage.deploys.pct}
                                color="#818cf8"
                            />
                            <MetricBar
                                label={`Agent Runs (${usage.usage.agentRuns.used}/${usage.usage.agentRuns.limit === -1 ? '∞' : usage.usage.agentRuns.limit})`}
                                value={usage.usage.agentRuns.pct}
                                color="#34d399"
                            />
                            <MetricBar
                                label={`Storage (${usage.usage.storage.used} GB / ${usage.usage.storage.limit === -1 ? '∞' : usage.usage.storage.limit} GB)`}
                                value={usage.usage.storage.pct}
                                color="#fbbf24"
                            />
                            {usage.plan === 'free' && (
                                <div style={{
                                    marginTop: 14, padding: '8px 12px', borderRadius: 8, fontSize: 12,
                                    background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
                                    color: '#34d399',
                                }}>
                                    🆓 Start free with AWS Free Tier → <a href="/dashboard/finops" style={{ color: '#34d399', fontWeight: 600 }}>Details</a>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Loading...</div>
                    )}
                </div>
            </div>

            {/* Other suggestions + Recent deployments */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Suggestions */}
                <div className="glass-card" style={{ padding: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>💡 Recommendations</h3>
                    {otherSuggestions.length === 0 && criticalSuggestions.length === 0 ? (
                        <div style={{ color: '#34d399', fontSize: 13 }}>✅ All metrics are within normal range!</div>
                    ) : otherSuggestions.length === 0 ? (
                        <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Critical suggestions are shown above.</div>
                    ) : (
                        otherSuggestions.map(sug => (
                            <div key={sug.id} style={{
                                padding: '10px 12px', borderRadius: 8, marginBottom: 8,
                                background: 'rgba(15,23,42,0.4)', border: '1px solid var(--border-color)',
                            }}>
                                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 3 }}>
                                    {sug.icon} {sug.title}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{sug.description}</div>
                            </div>
                        ))
                    )}
                </div>

                {/* Recent deployments */}
                <div className="glass-card" style={{ padding: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>🚀 Recent Deployments</h3>
                    {deployments.length === 0 ? (
                        <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No deployments yet</div>
                    ) : deployments.map((d: any) => (
                        <div key={d.id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '8px 0', borderBottom: '1px solid rgba(30,41,59,0.5)',
                        }}>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 600 }}>{d.projectName}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{d.deployId} · {d.region}</div>
                            </div>
                            <span style={{
                                fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 600,
                                background: d.status === 'success' ? 'rgba(52,211,153,0.1)' : d.status === 'running' ? 'rgba(129,140,248,0.1)' : 'rgba(248,113,113,0.1)',
                                color: d.status === 'success' ? '#34d399' : d.status === 'running' ? '#818cf8' : '#f87171',
                            }}>{d.status}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Deploy Modal */}
            {showDeploy && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} onClick={e => e.target === e.currentTarget && setShowDeploy(false)}>
                    <div className="glass-card" style={{ padding: 28, width: 440, maxWidth: '90vw' }}>
                        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>🚀 New Deployment</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Project Name</label>
                                <input className="input-field" placeholder="my-app" value={deployForm.projectName} onChange={e => setDeployForm({ ...deployForm, projectName: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Region</label>
                                    <select className="input-field" value={deployForm.region} onChange={e => setDeployForm({ ...deployForm, region: e.target.value })}>
                                        <option value="us-east-1">US East (N. Virginia)</option>
                                        <option value="eu-west-1">EU West (Ireland)</option>
                                        <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Environment</label>
                                    <select className="input-field" value={deployForm.environment} onChange={e => setDeployForm({ ...deployForm, environment: e.target.value })}>
                                        <option value="production">Production</option>
                                        <option value="staging">Staging</option>
                                        <option value="development">Development</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Budget ($)</label>
                                <input className="input-field" type="number" value={deployForm.budget} onChange={e => setDeployForm({ ...deployForm, budget: Number(e.target.value) })} />
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button className="btn-primary" onClick={handleDeploy} disabled={deploying || !deployForm.projectName} style={{ flex: 1, justifyContent: 'center' }}>
                                    {deploying ? '⏳ Deploying...' : '🚀 Deploy'}
                                </button>
                                <button onClick={() => setShowDeploy(false)} style={{
                                    padding: '10px 16px', borderRadius: 8, background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer',
                                }}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
