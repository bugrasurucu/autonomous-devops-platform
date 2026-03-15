'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function FinOpsPage() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        api.getFinOps().then(setData).catch(() => { });
    }, []);

    if (!data) {
        return <div style={{ color: 'var(--text-secondary)', padding: 24 }}>Loading FinOps data...</div>;
    }

    const budgetPct = data.budgetUsage;

    return (
        <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
                <span className="gradient-text">FinOps Dashboard</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                Cost management and optimization
            </p>

            {/* Budget gauge + summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
                {/* Budget */}
                <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>Monthly Budget</div>
                    <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto' }}>
                        <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth="10" />
                            <circle cx="60" cy="60" r="50" fill="none"
                                stroke={budgetPct > 80 ? '#f87171' : budgetPct > 50 ? '#fbbf24' : '#34d399'}
                                strokeWidth="10" strokeLinecap="round"
                                strokeDasharray={`${(budgetPct / 100) * 314} 314`} />
                        </svg>
                        <div style={{
                            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <span style={{ fontSize: 22, fontWeight: 700 }}>{budgetPct}%</span>
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>used</span>
                        </div>
                    </div>
                    <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600, color: '#34d399' }}>
                        ${data.monthlyCost} / ${data.monthlyBudget}
                    </div>
                </div>

                {/* Stats */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Cost Summary</div>
                    {[
                        { label: 'Total Cost', value: `$${data.totalCost}`, color: '#818cf8' },
                        { label: 'This Month', value: `$${data.monthlyCost}`, color: '#34d399' },
                        { label: 'Avg/Deploy', value: `$${data.avgCostPerDeploy}`, color: '#fbbf24' },
                        { label: 'Deploys', value: data.deployCount, color: '#94a3b8' },
                    ].map((s) => (
                        <div key={s.label} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '8px 0', borderBottom: '1px solid var(--border-color)',
                        }}>
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.label}</span>
                            <span style={{ fontSize: 14, fontWeight: 600, color: s.color }}>{s.value}</span>
                        </div>
                    ))}
                </div>

                {/* 7-day trend */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>7-Day Trend</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
                        {data.trend?.map((val: number, i: number) => {
                            const maxVal = Math.max(...data.trend, 1);
                            const height = (val / maxVal) * 80 + 4;
                            return (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                    <div style={{
                                        width: '100%', height, borderRadius: 4,
                                        background: `linear-gradient(180deg, #818cf8, #6366f1)`,
                                        opacity: 0.3 + (i / 7) * 0.7,
                                        transition: 'height 0.5s ease',
                                    }} />
                                    <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Breakdown + Optimizations */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Cost breakdown */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Cost Breakdown</h3>
                    {data.breakdown?.map((b: any) => (
                        <div key={b.service} style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                                <span>{b.service}</span>
                                <span style={{ color: 'var(--accent-light)', fontWeight: 500 }}>${b.cost} ({b.percentage}%)</span>
                            </div>
                            <div style={{ height: 6, borderRadius: 3, background: 'rgba(99,102,241,0.1)' }}>
                                <div style={{
                                    width: `${b.percentage}%`, height: '100%', borderRadius: 3,
                                    background: 'linear-gradient(90deg, #6366f1, #818cf8)',
                                    transition: 'width 0.5s ease',
                                }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Optimizations */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Optimization Recommendations</h3>
                    {data.optimizations?.map((o: any) => (
                        <div key={o.id} style={{
                            padding: 14, borderRadius: 10, marginBottom: 10,
                            background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border-color)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 500 }}>{o.title}</div>
                                    <div style={{ fontSize: 12, color: '#34d399', fontWeight: 600, marginTop: 4 }}>
                                        Savings: {o.savings}
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 500,
                                    background: o.impact === 'high' ? 'rgba(248,113,113,0.15)' :
                                        o.impact === 'medium' ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.15)',
                                    color: o.impact === 'high' ? '#f87171' :
                                        o.impact === 'medium' ? '#fbbf24' : '#34d399',
                                    textTransform: 'capitalize',
                                }}>
                                    {o.impact}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
