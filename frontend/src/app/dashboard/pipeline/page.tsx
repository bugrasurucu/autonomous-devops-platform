'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function PipelinePage() {
    const [deployments, setDeployments] = useState<any[]>([]);

    useEffect(() => {
        loadDeployments();
        const interval = setInterval(loadDeployments, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadDeployments = async () => {
        try {
            const data = await api.getDeployments(50);
            setDeployments(data);
        } catch { }
    };

    const statusColors: Record<string, string> = {
        pending: '#94a3b8',
        running: '#818cf8',
        success: '#34d399',
        failed: '#f87171',
        cancelled: '#fbbf24',
    };

    return (
        <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
                <span className="gradient-text">Deployment Pipeline</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                Track and manage your deployment history
            </p>

            <div className="glass-card" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                            {['Deploy ID', 'Project', 'Status', 'Region', 'Environment', 'Cost', 'Duration', 'Date'].map((h) => (
                                <th key={h} style={{
                                    padding: '14px 16px',
                                    textAlign: 'left',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: 'var(--text-secondary)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {deployments.length === 0 && (
                            <tr>
                                <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No deployments yet
                                </td>
                            </tr>
                        )}
                        {deployments.map((d) => (
                            <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--accent-light)' }}>
                                    {d.deployId}
                                </td>
                                <td style={{ padding: '12px 16px', fontWeight: 500 }}>{d.projectName}</td>
                                <td style={{ padding: '12px 16px' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: 6,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        background: (statusColors[d.status] || '#94a3b8') + '20',
                                        color: statusColors[d.status] || '#94a3b8',
                                        textTransform: 'capitalize',
                                    }}>
                                        {d.status}
                                    </span>
                                </td>
                                <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{d.region}</td>
                                <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                                    {d.environment}
                                </td>
                                <td style={{ padding: '12px 16px', fontSize: 13, color: '#34d399', fontWeight: 500 }}>
                                    {d.cost > 0 ? `$${d.cost.toFixed(2)}` : '-'}
                                </td>
                                <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                                    {d.duration > 0 ? `${d.duration}s` : '-'}
                                </td>
                                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                                    {new Date(d.createdAt).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
