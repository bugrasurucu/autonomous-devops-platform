'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
    pending: '#64748b',
    running: '#818cf8',
    success: '#34d399',
    failed: '#f87171',
    cancelled: '#fbbf24',
    blocked: '#fbbf24',
};

const STATUS_ICONS: Record<string, string> = {
    pending: '⏳',
    running: '🔄',
    success: '✅',
    failed: '❌',
    cancelled: '⚠️',
    blocked: '🚫',
};

// 5-stage autonomous agent pipeline for each deployment
const PIPELINE_STAGES = [
    { id: 'bootstrap-agent', label: 'Repo Analysis', icon: '🔍' },
    { id: 'infra-agent', label: 'Infrastructure', icon: '🏗️' },
    { id: 'finops-agent', label: 'FinOps Validation', icon: '💰' },
    { id: 'pipeline-agent', label: 'CI/CD Pipeline', icon: '⚡' },
    { id: 'sre-agent', label: 'SRE Monitoring Setup', icon: '🛡️' },
];

function derivePipelineStages(deployment: any) {
    const status = deployment.status;
    const createdAt = new Date(deployment.createdAt).getTime();

    let parsedBackendStages: any[] = [];
    try {
        if (deployment.stages) {
            parsedBackendStages = typeof deployment.stages === 'string'
                ? JSON.parse(deployment.stages)
                : deployment.stages;
        }
    } catch {
        parsedBackendStages = [];
    }

    const totalDuration = deployment.duration || 0;
    const perStageDuration = totalDuration > 0 ? Math.max(2, Math.round(totalDuration / PIPELINE_STAGES.length)) : 12;

    return PIPELINE_STAGES.map((stage, i) => {
        const backendStage = parsedBackendStages[i];
        let stageStatus: 'pending' | 'running' | 'success' | 'failed';

        if (backendStage?.status) {
            if (backendStage.status === 'completed' || backendStage.status === 'success') {
                stageStatus = 'success';
            } else if (backendStage.status === 'running') {
                stageStatus = 'running';
            } else if (backendStage.status === 'failed') {
                stageStatus = 'failed';
            } else {
                stageStatus = 'pending';
            }
        } else if (status === 'success') {
            stageStatus = 'success';
        } else if (status === 'failed') {
            stageStatus = i < 3 ? 'success' : i === 3 ? 'failed' : 'pending';
        } else if (status === 'running') {
            stageStatus = i < 2 ? 'success' : i === 2 ? 'running' : 'pending';
        } else if (status === 'cancelled') {
            stageStatus = i === 0 ? 'success' : 'pending';
        } else {
            stageStatus = 'pending';
        }

        const stageStart = createdAt + i * (perStageDuration * 1000);
        return {
            ...stage,
            label: backendStage?.label || stage.label,
            result: backendStage?.result || null,
            status: stageStatus,
            duration: stageStatus === 'success' ? perStageDuration : null,
            startedAt: stageStatus !== 'pending' ? new Date(stageStart).toISOString() : null,
        };
    });
}

function PipelineStageBar({ stages }: { stages: ReturnType<typeof derivePipelineStages> }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 10 }}>
            {stages.map((stage, i) => (
                <div key={stage.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <div style={{
                        flex: 1,
                        height: 6,
                        borderRadius: i === 0 ? '6px 0 0 6px' : i === stages.length - 1 ? '0 6px 6px 0' : 0,
                        background: stage.status === 'success'
                            ? 'linear-gradient(90deg, #34d399, #34d39990)'
                            : stage.status === 'running'
                                ? 'linear-gradient(90deg, #818cf8, #818cf840)'
                                : stage.status === 'failed'
                                    ? '#f87171'
                                    : 'rgba(30,41,59,0.6)',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        {stage.status === 'running' && (
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                                animation: 'shimmer 1.5s infinite',
                            }} />
                        )}
                    </div>
                    {i < stages.length - 1 && (
                        <div style={{ width: 1, height: 6, background: 'rgba(255,255,255,0.1)' }} />
                    )}
                </div>
            ))}
        </div>
    );
}

export default function PipelinePage() {
    const [deployments, setDeployments] = useState<any[]>([]);
    const [selected, setSelected] = useState<any>(null);
    const [expandedStage, setExpandedStage] = useState<string | null>('infra-agent');
    const [showDeploy, setShowDeploy] = useState(false);
    const [deployForm, setDeployForm] = useState({
        projectName: '',
        githubRepo: '',
        githubBranch: 'main',
        region: 'us-east-1',
        environment: 'production',
        budget: 100,
    });
    const [deploying, setDeploying] = useState(false);
    const [filter, setFilter] = useState<string>('all');

    const loadDeployments = useCallback(async () => {
        try {
            const data = await api.getDeployments(50);
            setDeployments(data);
            // Keep selected in sync
            if (selected) {
                const updated = data.find((d: any) => d.id === selected.id);
                if (updated) setSelected(updated);
            }
        } catch { }
    }, [selected]);

    useEffect(() => {
        loadDeployments();
        const interval = setInterval(loadDeployments, 3000);
        return () => clearInterval(interval);
    }, [loadDeployments]);

    const handleDeploy = async () => {
        if (!deployForm.projectName.trim()) return;
        setDeploying(true);
        try {
            await api.deploy(deployForm);
            setShowDeploy(false);
            setDeployForm({
                projectName: '',
                githubRepo: '',
                githubBranch: 'main',
                region: 'us-east-1',
                environment: 'production',
                budget: 100,
            });
            await loadDeployments();
        } catch (e: any) { alert(e.message); }
        finally { setDeploying(false); }
    };

    const handleStop = async (id: string) => {
        try {
            await api.stopDeployment(id);
            await loadDeployments();
        } catch (e: any) { alert(e.message); }
    };

    const handleRedeploy = async (id: string) => {
        try {
            await api.redeployDeployment(id);
            await loadDeployments();
        } catch (e: any) { alert(e.message); }
    };

    const handlePromote = async (id: string, currentEnv: string) => {
        const nextEnv = currentEnv === 'development' ? 'staging' : 'production';
        try {
            await api.promoteDeployment(id, nextEnv);
            await loadDeployments();
        } catch (e: any) { alert(e.message); }
    };

    const handleRollback = async (id: string) => {
        try {
            await api.rollbackDeployment(id);
            await loadDeployments();
        } catch (e: any) { alert(e.message); }
    };

    const stats = {
        total: deployments.length,
        running: deployments.filter(d => d.status === 'running').length,
        success: deployments.filter(d => d.status === 'success').length,
        failed: deployments.filter(d => d.status === 'failed').length,
    };

    const filtered = filter === 'all' ? deployments : deployments.filter(d => d.status === filter);

    const selectedStages = selected ? derivePipelineStages(selected) : [];

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700 }}>
                        <span className="gradient-text">Deployment Pipeline</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                        5-Stage Autonomous Agent Pipeline — Repo Analysis → Infrastructure → FinOps → CI/CD → SRE Monitoring
                    </p>
                </div>
                <button className="btn-primary" onClick={() => setShowDeploy(true)} style={{ fontSize: 13 }}>
                    ▶ New Deployment
                </button>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                    { label: 'Total Deployments', value: stats.total, color: '#818cf8', icon: '🚀' },
                    { label: 'Running', value: stats.running, color: '#818cf8', icon: '🔄' },
                    { label: 'Successful', value: stats.success, color: '#34d399', icon: '✅' },
                    { label: 'Failed', value: stats.failed, color: '#f87171', icon: '❌' },
                ].map(s => (
                    <div key={s.label} className="glass-card" style={{ padding: '14px 18px' }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{s.icon} {s.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: 16 }}>
                {/* Left: Deployment list */}
                <div>
                    {/* Filter tabs */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        {['all', 'running', 'success', 'failed', 'pending'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{
                                    padding: '5px 14px', borderRadius: 7, fontSize: 12, cursor: 'pointer', border: 'none', fontWeight: 600,
                                    background: filter === f ? 'rgba(129,140,248,0.2)' : 'rgba(30,41,59,0.5)',
                                    color: filter === f ? '#818cf8' : 'var(--text-secondary)',
                                    textTransform: 'capitalize',
                                }}
                            >
                                {f === 'all' ? `All (${stats.total})` : f}
                            </button>
                        ))}
                    </div>

                    <div className="glass-card" style={{ overflow: 'hidden' }}>
                        {filtered.length === 0 ? (
                            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
                                <div style={{ fontSize: 36, marginBottom: 12 }}>🚀</div>
                                <div style={{ fontSize: 14 }}>No deployments yet</div>
                                <div style={{ fontSize: 12, marginTop: 6 }}>Click "New Deployment" to get started</div>
                            </div>
                        ) : (
                            filtered.map((d, idx) => {
                                const stages = derivePipelineStages(d);
                                const isSelected = selected?.id === d.id;
                                return (
                                    <div
                                        key={d.id}
                                        onClick={() => setSelected(isSelected ? null : d)}
                                        style={{
                                            padding: '14px 20px',
                                            borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-color)' : 'none',
                                            cursor: 'pointer',
                                            background: isSelected ? 'rgba(129,140,248,0.05)' : 'transparent',
                                            borderLeft: isSelected ? '3px solid #818cf8' : '3px solid transparent',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <span style={{ fontSize: 18 }}>{STATUS_ICONS[d.status]}</span>
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{d.projectName}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                                        {d.deployId}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{d.region}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{d.environment}</div>
                                                </div>
                                                <span style={{
                                                    fontSize: 11, padding: '3px 10px', borderRadius: 6, fontWeight: 600,
                                                    background: STATUS_COLORS[d.status] + '20',
                                                    color: STATUS_COLORS[d.status],
                                                    textTransform: 'capitalize',
                                                }}>
                                                    {d.status}
                                                </span>
                                                <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-secondary)' }}>
                                                    {d.cost > 0 && <div style={{ color: '#34d399' }}>${d.cost.toFixed(2)}</div>}
                                                    <div>{new Date(d.createdAt).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Mini pipeline bar */}
                                        <PipelineStageBar stages={stages} />
                                        <div style={{ display: 'flex', gap: 4, marginTop: 5 }}>
                                            {stages.map(s => (
                                                <span key={s.id} style={{
                                                    fontSize: 9, color: STATUS_COLORS[s.status] || 'var(--text-secondary)',
                                                    flex: 1, textAlign: 'center',
                                                }}>
                                                    {s.icon}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right: Deployment detail */}
                {selected && (
                    <div className="glass-card" style={{ padding: 22, height: 'fit-content', position: 'sticky', top: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 700 }}>{selected.projectName}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace', marginTop: 2 }}>
                                    {selected.deployId}
                                </div>
                            </div>
                            <button onClick={() => setSelected(null)} style={{
                                background: 'none', border: 'none', color: 'var(--text-secondary)',
                                cursor: 'pointer', fontSize: 18, padding: '0 4px',
                            }}>×</button>
                        </div>

                        {/* Status + Meta */}
                        <div style={{
                            padding: '10px 14px', borderRadius: 8, marginBottom: 18,
                            background: STATUS_COLORS[selected.status] + '10',
                            border: `1px solid ${STATUS_COLORS[selected.status]}30`,
                            display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                            <span style={{ fontSize: 20 }}>{STATUS_ICONS[selected.status]}</span>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: STATUS_COLORS[selected.status], textTransform: 'capitalize' }}>
                                    {selected.status}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                    {selected.region} · {selected.environment}
                                    {selected.duration > 0 && ` · ${selected.duration}s`}
                                </div>
                            </div>
                        </div>

                        {/* Pipeline stages with expandable agent artifacts */}
                        <div style={{ marginBottom: 18 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Autonomous Agent Stages & Generated Artifacts
                            </div>
                            {selectedStages.map((stage) => {
                                const isOpen = expandedStage === stage.id;
                                return (
                                    <div key={stage.id} style={{
                                        marginBottom: 8,
                                        borderRadius: 10,
                                        border: `1px solid ${isOpen && stage.result ? STATUS_COLORS[stage.status] + '40' : 'rgba(255,255,255,0.06)'}`,
                                        background: 'rgba(15,23,42,0.35)',
                                        overflow: 'hidden',
                                    }}>
                                        <div
                                            onClick={() => setExpandedStage(isOpen ? null : stage.id)}
                                            style={{
                                                display: 'flex', alignItems: 'center', padding: '10px 12px', gap: 10,
                                                cursor: stage.result ? 'pointer' : 'default',
                                            }}
                                        >
                                            <div style={{
                                                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                                background: STATUS_COLORS[stage.status] + '15',
                                                border: `1.5px solid ${STATUS_COLORS[stage.status]}40`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 14,
                                                animation: stage.status === 'running' ? 'spin 2s linear infinite' : undefined,
                                            }}>
                                                {stage.status === 'running' ? '⟳' : stage.icon}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 12, fontWeight: 600, color: STATUS_COLORS[stage.status] }}>
                                                    {stage.label}
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                                    {stage.status === 'pending' ? 'Waiting...'
                                                        : stage.status === 'running' ? 'Agent executing...'
                                                            : stage.status === 'success' ? `Completed (~${stage.duration}s)`
                                                                : 'Failed / Blocked'}
                                                </div>
                                            </div>
                                            {stage.result && (
                                                <span style={{ fontSize: 10, color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.05)' }}>
                                                    {isOpen ? '▲ Hide Output' : '▼ View Output'}
                                                </span>
                                            )}
                                            <div style={{
                                                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                                background: STATUS_COLORS[stage.status],
                                                boxShadow: stage.status === 'running' ? `0 0 6px ${STATUS_COLORS.running}` : 'none',
                                            }} />
                                        </div>
                                        {isOpen && stage.result && (
                                            <pre style={{
                                                margin: 0,
                                                padding: '10px 12px',
                                                borderTop: '1px solid rgba(255,255,255,0.06)',
                                                background: 'rgba(2,6,23,0.75)',
                                                color: '#cbd5e1',
                                                fontSize: 11,
                                                fontFamily: 'JetBrains Mono, monospace',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                                maxHeight: 220,
                                                overflowY: 'auto',
                                                lineHeight: 1.5,
                                            }}>
                                                {stage.result}
                                            </pre>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Action Buttons (Live Preview / IaC / Promote / Rollback / Redeploy / Stop) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                            <Link
                                href={`/dashboard/preview/${selected.id}`}
                                style={{
                                    padding: '10px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                                    background: selected.status === 'success' ? 'rgba(52,211,153,0.15)' : 'rgba(129,140,248,0.15)',
                                    border: selected.status === 'success' ? '1px solid rgba(52,211,153,0.35)' : '1px solid rgba(129,140,248,0.35)',
                                    color: selected.status === 'success' ? '#34d399' : '#818cf8',
                                    textDecoration: 'none', textAlign: 'center',
                                }}
                            >
                                {selected.status === 'success'
                                    ? '🔗 Open Live Container & DevOps IaC Bundle'
                                    : '📦 View Generated DevOps IaC & Files (6)'}
                            </Link>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {selected.status === 'running' ? (
                                    <button
                                        onClick={() => handleStop(selected.id)}
                                        style={{
                                            flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                                            background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.35)',
                                            color: '#f87171', cursor: 'pointer',
                                        }}
                                    >
                                        ⏹ Stop Deployment
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => handleRedeploy(selected.id)}
                                            style={{
                                                flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                                                background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.3)',
                                                color: '#818cf8', cursor: 'pointer',
                                            }}
                                        >
                                            ↻ Redeploy
                                        </button>
                                        {selected.status === 'success' && selected.environment !== 'production' && (
                                            <button
                                                onClick={() => handlePromote(selected.id, selected.environment)}
                                                style={{
                                                    flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                                                    background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)',
                                                    color: '#fbbf24', cursor: 'pointer',
                                                }}
                                            >
                                                ⬆ Promote to {selected.environment === 'development' ? 'Staging' : 'Prod'}
                                            </button>
                                        )}
                                        {(selected.status === 'failed' || selected.status === 'cancelled') && (
                                            <button
                                                onClick={() => handleRollback(selected.id)}
                                                style={{
                                                    flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                                                    background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)',
                                                    color: '#fbbf24', cursor: 'pointer',
                                                }}
                                            >
                                                ⏪ Rollback
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Cost + Budget */}
                        {(selected.cost > 0 || selected.budget > 0) && (
                            <div style={{
                                padding: '12px 14px', borderRadius: 8,
                                background: 'rgba(15,23,42,0.5)', border: '1px solid var(--border-color)',
                                fontSize: 12,
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Est. Monthly Infra Cost</span>
                                    <span style={{ color: '#34d399', fontWeight: 600 }}>${selected.cost.toFixed(2)}/mo</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Target Budget</span>
                                    <span style={{ fontWeight: 600 }}>${selected.budget}/mo</span>
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-secondary)' }}>
                            Started: {new Date(selected.createdAt).toLocaleString()}
                            {selected.completedAt && (
                                <div>Finished: {new Date(selected.completedAt).toLocaleString()}</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* New Deployment Modal */}
            {showDeploy && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} onClick={e => e.target === e.currentTarget && setShowDeploy(false)}>
                    <div className="glass-card" style={{ padding: 28, width: 440, maxWidth: '90vw' }}>
                        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>🚀 New Deployment</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Project Name *</label>
                                <input className="input-field" placeholder="my-app" value={deployForm.projectName}
                                    onChange={e => setDeployForm({ ...deployForm, projectName: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                                <div>
                                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>GitHub Repo (owner/repo or URL)</label>
                                    <input className="input-field" placeholder="bugrasurucu/autonomous-devops-platform" value={deployForm.githubRepo}
                                        onChange={e => setDeployForm({ ...deployForm, githubRepo: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Branch</label>
                                    <input className="input-field" placeholder="main" value={deployForm.githubBranch}
                                        onChange={e => setDeployForm({ ...deployForm, githubBranch: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Cloud Provider & Region</label>
                                    <select className="input-field" value={deployForm.region}
                                        onChange={e => setDeployForm({ ...deployForm, region: e.target.value })}>
                                        <optgroup label="☁️ Amazon Web Services (AWS)">
                                            <option value="aws:us-east-1">AWS — US East (N. Virginia)</option>
                                            <option value="aws:eu-west-1">AWS — EU West (Ireland)</option>
                                            <option value="aws:ap-southeast-1">AWS — Asia Pacific (Singapore)</option>
                                            <option value="us-east-1">AWS — Default (us-east-1)</option>
                                        </optgroup>
                                        <optgroup label="🌐 Google Cloud Platform (GCP)">
                                            <option value="gcp:us-central1">GCP — Iowa (us-central1)</option>
                                            <option value="gcp:europe-west1">GCP — Belgium (europe-west1)</option>
                                        </optgroup>
                                        <optgroup label="🔷 Microsoft Azure">
                                            <option value="azure:eastus">Azure — East US (eastus)</option>
                                            <option value="azure:westeurope">Azure — West Europe (westeurope)</option>
                                        </optgroup>
                                        <optgroup label="☸️ Kubernetes (Cloud-Agnostic)">
                                            <option value="k8s:cluster-default">Kubernetes — Production Cluster</option>
                                        </optgroup>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Environment</label>
                                    <select className="input-field" value={deployForm.environment}
                                        onChange={e => setDeployForm({ ...deployForm, environment: e.target.value })}>
                                        <option value="production">Production</option>
                                        <option value="staging">Staging</option>
                                        <option value="development">Development</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Budget ($)</label>
                                <input className="input-field" type="number" value={deployForm.budget}
                                    onChange={e => setDeployForm({ ...deployForm, budget: Number(e.target.value) })} />
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button className="btn-primary" onClick={handleDeploy} disabled={deploying || !deployForm.projectName}
                                    style={{ flex: 1, justifyContent: 'center' }}>
                                    {deploying ? '⏳ Deploying...' : '🚀 Deploy'}
                                </button>
                                <button onClick={() => setShowDeploy(false)} style={{
                                    padding: '10px 16px', borderRadius: 8, background: 'none',
                                    border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer',
                                }}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
