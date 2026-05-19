'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
    running: '#818cf8',
    success: '#34d399',
    failed: '#f87171',
    cancelled: '#94a3b8',
    pending: '#a78bfa',
};

const STATUS_BG: Record<string, string> = {
    running: 'rgba(129,140,248,0.08)',
    success: 'rgba(52,211,153,0.08)',
    failed: 'rgba(248,113,113,0.08)',
    cancelled: 'rgba(148,163,184,0.08)',
    pending: 'rgba(167,139,250,0.08)',
};

export default function DeploymentsPage() {
    const [deployments, setDeployments] = useState<any[]>([]);
    const [usage, setUsage] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [stoppingId, setStoppingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    
    const { success, error: toastError, info } = useToast();

    const loadData = useCallback(async () => {
        try {
            const [deploys, usageData] = await Promise.all([
                api.getDeployments(50),
                api.getUsage(),
            ]);
            setDeployments(deploys || []);
            setUsage(usageData);
        } catch (e: any) {
            console.error('Failed to load deployments page data:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, [loadData]);

    const handleStop = async (id: string) => {
        if (!confirm('Are you sure you want to stop this active deployment?')) return;
        setStoppingId(id);
        info('Stopping deployment...', 'Request sent to DevOps agent.');
        try {
            await api.stopDeployment(id);
            success('Stopped', 'Deployment has been cancelled successfully.');
            await loadData();
        } catch (e: any) {
            toastError('Failed to stop', e.message);
        } finally {
            setStoppingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to permanently delete this deployment from history?')) return;
        setDeletingId(id);
        try {
            await api.deleteDeployment(id);
            success('Deleted', 'Deployment record removed.');
            await loadData();
        } catch (e: any) {
            toastError('Failed to delete', e.message);
        } finally {
            setDeletingId(null);
        }
    };

    const isBugrahan = usage?.deployLimit === -1;

    if (loading && deployments.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>⏳ Orchestrating Deployments Overview...</span>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700 }}><span className="gradient-text">Deployments</span> <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>Orchestrator</span></h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                        Monitor, stop, and clean up autonomous deployment lifecycles.
                    </p>
                </div>
            </div>

            {/* Admin/Quota Banner */}
            {usage && (
                <div style={{
                    padding: '16px 20px', borderRadius: 14, marginBottom: 24,
                    background: isBugrahan
                        ? 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(0,255,136,0.05))'
                        : 'linear-gradient(135deg, rgba(129,140,248,0.06), transparent)',
                    border: isBugrahan
                        ? '1px solid rgba(0,212,255,0.25)'
                        : '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                    boxShadow: isBugrahan ? '0 0 20px rgba(0,212,255,0.1)' : 'none',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span style={{ fontSize: 24 }}>{isBugrahan ? '👑' : '📊'}</span>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: isBugrahan ? '#00d4ff' : 'var(--text-primary)' }}>
                                {isBugrahan ? 'Buğrahan Sürücü - Unlimited Admin Mode' : 'Deployment Rights Quota'}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                                {isBugrahan 
                                    ? 'You have unlimited deployment rights across all projects. Deploy as code at scale.'
                                    : `You have consumed ${usage.deploysThisMonth} out of your ${usage.deployLimit} monthly deployments.`}
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: isBugrahan ? '#00ff88' : 'var(--text-primary)' }}>
                            {isBugrahan ? '∞' : `${usage.deploysThisMonth} / ${usage.deployLimit}`}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
                            {isBugrahan ? 'Deployments Remaining' : 'Monthly Allowance'}
                        </div>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                {deployments.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <span style={{ fontSize: 28, display: 'block', marginBottom: 12 }}>🚀</span>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>No Deployments Yet</div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>Trigger your first autonomous deployment from the Dashboard!</div>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                                    <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Deployment ID</th>
                                    <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Project Name</th>
                                    <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Source</th>
                                    <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Env / Region</th>
                                    <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Agent Stages</th>
                                    <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                                    <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deployments.map((dep: any) => {
                                    let parsedStages: any[] = [];
                                    try {
                                        parsedStages = typeof dep.stages === 'string' ? JSON.parse(dep.stages) : dep.stages;
                                    } catch (e) {
                                        parsedStages = [];
                                    }

                                    return (
                                        <tr key={dep.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }} className="table-row-hover">
                                            <td style={{ padding: '16px 20px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#818cf8' }}>
                                                {dep.deployId}
                                            </td>
                                            <td style={{ padding: '16px 20px', fontWeight: 600 }}>
                                                {dep.projectName}
                                            </td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ fontSize: 14 }}>{dep.githubBranch === 'upload' ? '📁' : '🐙'}</span>
                                                    <span style={{ 
                                                        color: 'var(--text-secondary)', 
                                                        fontSize: 12, 
                                                        maxWidth: 160, 
                                                        overflow: 'hidden', 
                                                        textOverflow: 'ellipsis', 
                                                        whiteSpace: 'nowrap' 
                                                    }}>
                                                        {dep.githubRepo || 'Uploaded Archive'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ fontSize: 12, fontWeight: 600 }}>{dep.environment}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{dep.region}</div>
                                            </td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    {parsedStages.map((stage: any, sIdx: number) => (
                                                        <div 
                                                            key={sIdx}
                                                            title={`${stage.label}: ${stage.status}`}
                                                            style={{
                                                                width: 8, height: 8, borderRadius: '50%',
                                                                background: STATUS_COLORS[stage.status] || '#94a3b8',
                                                                boxShadow: stage.status === 'running' ? `0 0 8px ${STATUS_COLORS.running}` : 'none',
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
                                                    {parsedStages.filter(s => s.status === 'success').length} / {parsedStages.length} Stages Passed
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <span style={{
                                                    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                                                    color: STATUS_COLORS[dep.status] || '#94a3b8',
                                                    background: STATUS_BG[dep.status] || 'rgba(148,163,184,0.08)',
                                                    border: `1px solid ${STATUS_COLORS[dep.status]}20`,
                                                    textTransform: 'capitalize',
                                                    display: 'inline-flex', alignItems: 'center', gap: 6
                                                }}>
                                                    {dep.status === 'running' && (
                                                        <span style={{
                                                            width: 6, height: 6, borderRadius: '50%', background: '#818cf8',
                                                            animation: 'pulse 1.5s infinite'
                                                        }} />
                                                    )}
                                                    {dep.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                                    {dep.status === 'success' && (
                                                        <Link 
                                                            href={`/dashboard/preview/${dep.id}`}
                                                            style={{
                                                                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                                                                background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)',
                                                                color: '#34d399', textDecoration: 'none', cursor: 'pointer', transition: 'background 0.2s',
                                                                display: 'inline-flex', alignItems: 'center'
                                                            }}
                                                            className="btn-success-hover"
                                                        >
                                                            🔗 Live Preview
                                                        </Link>
                                                    )}
                                                    {dep.status === 'running' ? (
                                                        <button 
                                                            onClick={() => handleStop(dep.id)}
                                                            disabled={stoppingId === dep.id}
                                                            style={{
                                                                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                                                background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)',
                                                                color: '#f87171', cursor: 'pointer', transition: 'background 0.2s'
                                                            }}
                                                            className="btn-danger-hover"
                                                        >
                                                            {stoppingId === dep.id ? '⏳ Stop' : '⏹ Stop'}
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleDelete(dep.id)}
                                                            disabled={deletingId === dep.id}
                                                            style={{
                                                                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                                                color: 'var(--text-secondary)', cursor: 'pointer', transition: 'background 0.2s'
                                                            }}
                                                            className="btn-secondary-hover"
                                                        >
                                                            {deletingId === dep.id ? '⏳ Delete' : '🗑 Delete'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            <style jsx global>{`
                .table-row-hover:hover {
                    background: rgba(255,255,255,0.02) !important;
                }
                .btn-danger-hover:hover {
                    background: rgba(248,113,113,0.2) !important;
                }
                .btn-secondary-hover:hover {
                    background: rgba(255,255,255,0.08) !important;
                    color: var(--text-primary) !important;
                }
                @keyframes pulse {
                    0% { transform: scale(0.95); opacity: 0.5; }
                    50% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(0.95); opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}
