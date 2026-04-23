'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const TIER_ORDER = ['free', 'starter', 'pro', 'enterprise'];

function UsageBar({ used, limit, color }: { used: number; limit: number; color: string }) {
    const pct = limit === -1 ? 0 : Math.min(Math.round((used / limit) * 100), 100);
    const barColor = pct >= 90 ? '#f87171' : pct >= 70 ? '#fbbf24' : color;
    return (
        <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>
                <span>{used} used</span>
                <span>{limit === -1 ? '∞' : limit} limit</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: 'rgba(30,41,59,0.8)', overflow: 'hidden' }}>
                {limit !== -1 && (
                    <div style={{
                        height: '100%', width: `${pct}%`, borderRadius: 3,
                        background: `linear-gradient(90deg, ${barColor}90, ${barColor})`,
                        transition: 'width 0.8s ease',
                    }} />
                )}
            </div>
            {pct >= 90 && <div style={{ fontSize: 10, color: '#f87171', marginTop: 2 }}>⚠ {pct}% — approaching limit</div>}
        </div>
    );
}

export default function FinOpsPage() {
    const [tiers, setTiers] = useState<any[]>([]);
    const [usage, setUsage] = useState<any>(null);
    const [freeTier, setFreeTier] = useState<any[]>([]);
    const [estimates, setEstimates] = useState<any>(null);
    const [finopsData, setFinopsData] = useState<any>(null);
    const [tab, setTab] = useState<'overview' | 'tiers' | 'free-tier' | 'estimates'>('overview');
    const [scaling, setScaling] = useState(false);

    useEffect(() => {
        Promise.all([
            api.cost.getTiers().catch(() => []),
            api.cost.getUsage().catch(() => null),
            api.cost.getFreeTier().catch(() => []),
            api.cost.getEstimates().catch(() => null),
            api.getFinOps().catch(() => null),
        ]).then(([t, u, ft, est, fo]) => {
            setTiers(t);
            setUsage(u);
            setFreeTier(ft);
            setEstimates(est);
            setFinopsData(fo);
        });
    }, []);

    const budgetPct = finopsData?.budgetUsage || 0;

    const TABS = [
        { id: 'overview', label: '📊 Overview' },
        { id: 'tiers', label: '💎 Plans' },
        { id: 'free-tier', label: '🆓 AWS Free Tier' },
        { id: 'estimates', label: '🧮 Cost Estimates' },
    ];

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700 }}><span className="gradient-text">FinOps Dashboard</span></h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                    Cost analysis, usage limits and platform plans
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border-color)', paddingBottom: 0 }}>
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id as any)} style={{
                        padding: '8px 14px', fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: tab === t.id ? '#818cf8' : 'var(--text-secondary)',
                        borderBottom: tab === t.id ? '2px solid #818cf8' : '2px solid transparent',
                        marginBottom: -1, transition: 'all 0.15s',
                    }}>{t.label}</button>
                ))}
            </div>

            {/* Overview tab */}
            {tab === 'overview' && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                        {/* Budget gauge */}
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
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: 22, fontWeight: 700 }}>{budgetPct}%</span>
                                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>used</span>
                                </div>
                            </div>
                            <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600, color: '#34d399' }}>
                                ${finopsData?.monthlyCost ?? 0} / ${finopsData?.monthlyBudget ?? 500}
                            </div>
                        </div>

                        {/* Cost summary */}
                        <div className="glass-card" style={{ padding: 24 }}>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Cost Summary</div>
                            {[
                                { label: 'Total Cost', value: `$${finopsData?.totalCost || 0}`, color: '#818cf8' },
                                { label: 'This Month', value: `$${finopsData?.monthlyCost || 0}`, color: '#34d399' },
                                { label: 'Avg/Deploy', value: `$${finopsData?.avgCostPerDeploy || 0}`, color: '#fbbf24' },
                                { label: 'Deploys', value: finopsData?.deployCount || 0, color: '#94a3b8' },
                            ].map(s => (
                                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-color)' }}>
                                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.label}</span>
                                    <span style={{ fontSize: 14, fontWeight: 600, color: s.color }}>{s.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Usage limits */}
                        <div className="glass-card" style={{ padding: 24 }}>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                                Plan Usage — <strong style={{ color: usage?.tier?.color }}>{usage?.tier?.name || 'Free'}</strong>
                            </div>
                            {usage && (
                                <>
                                    <div style={{ marginBottom: 12 }}>
                                        <div style={{ fontSize: 12, fontWeight: 500 }}>🚀 Deploy</div>
                                        <UsageBar used={usage.usage.deploys.used} limit={usage.usage.deploys.limit} color="#818cf8" />
                                    </div>
                                    <div style={{ marginBottom: 12 }}>
                                        <div style={{ fontSize: 12, fontWeight: 500 }}>🤖 Agent Runs</div>
                                        <UsageBar used={usage.usage.agentRuns.used} limit={usage.usage.agentRuns.limit} color="#34d399" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 500 }}>💾 Storage</div>
                                        <UsageBar used={usage.usage.storage.used} limit={usage.usage.storage.limit} color="#fbbf24" />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {finopsData && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="glass-card" style={{ padding: 24 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Cost Breakdown</h3>
                                {finopsData.breakdown?.map((b: any) => (
                                    <div key={b.service} style={{ marginBottom: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                                            <span>{b.service}</span>
                                            <span style={{ color: 'var(--accent-light)', fontWeight: 500 }}>${b.cost} ({b.percentage}%)</span>
                                        </div>
                                        <div style={{ height: 6, borderRadius: 3, background: 'rgba(99,102,241,0.1)' }}>
                                            <div style={{ width: `${b.percentage}%`, height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #6366f1, #818cf8)', transition: 'width 0.5s ease' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="glass-card" style={{ padding: 24 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Optimization Recommendations</h3>
                                {finopsData.optimizations?.map((o: any) => (
                                    <div key={o.id} style={{ padding: 12, borderRadius: 10, marginBottom: 8, background: 'rgba(15,23,42,0.5)', border: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 500 }}>{o.title}</div>
                                                <div style={{ fontSize: 12, color: '#34d399', fontWeight: 600, marginTop: 4 }}>Savings: {o.savings}</div>
                                            </div>
                                            <span style={{
                                                fontSize: 11, padding: '2px 8px', borderRadius: 4,
                                                background: o.impact === 'high' ? 'rgba(248,113,113,0.15)' : 'rgba(251,191,36,0.15)',
                                                color: o.impact === 'high' ? '#f87171' : '#fbbf24',
                                            }}>{o.impact}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tiers tab */}
            {tab === 'tiers' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                    {tiers.map(tier => (
                        <div key={tier.id} className="glass-card" style={{
                            padding: 22,
                            border: `1px solid ${usage?.plan === tier.id ? tier.color + '60' : 'transparent'}`,
                            background: usage?.plan === tier.id ? tier.color + '08' : undefined,
                            position: 'relative',
                        }}>
                            {tier.popular && (
                                <div style={{
                                    position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                                    background: tier.color, color: '#0f172a', fontSize: 10, fontWeight: 800,
                                    padding: '2px 10px', borderRadius: 20,
                                }}>MOST POPULAR</div>
                            )}
                            {usage?.plan === tier.id && (
                                <div style={{
                                    position: 'absolute', top: 10, right: 10,
                                    background: tier.color + '20', color: tier.color, fontSize: 10, fontWeight: 700,
                                    padding: '2px 7px', borderRadius: 6,
                                }}>Current plan</div>
                            )}
                            <div style={{ textAlign: 'center', paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: 22, fontWeight: 800, color: tier.color }}>{tier.name}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{tier.description}</div>
                                <div style={{ fontSize: 28, fontWeight: 800 }}>
                                    {tier.price === null ? 'Custom' : tier.price === 0 ? 'Free' : `$${tier.price}`}
                                </div>
                                {tier.price > 0 && <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>/mo</div>}
                            </div>

                            <div style={{ marginBottom: 14 }}>
                                {[
                                    { key: 'deploysPerMonth', label: '🚀 Deploys', suffix: '/mo' },
                                    { key: 'agentRunsPerMonth', label: '🤖 Agent Runs', suffix: '/mo' },
                                    { key: 'storageGB', label: '💾 Storage', suffix: 'GB' },
                                    { key: 'teamMembers', label: '👥 Team', suffix: ' members' },
                                    { key: 'awsBudgetUSD', label: '☁️ AWS Budget', prefix: '$' },
                                ].map(item => (
                                    <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '1px solid rgba(30,41,59,0.5)' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                                        <strong style={{ color: tier.color }}>
                                            {tier.limits[item.key] === -1 ? '∞' : `${item.prefix || ''}${tier.limits[item.key]}${item.suffix || ''}`}
                                        </strong>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                {tier.features.slice(0, 4).map((f: string) => (
                                    <div key={f} style={{ fontSize: 11, color: '#94a3b8', display: 'flex', gap: 5 }}>
                                        <span style={{ color: '#34d399' }}>✓</span> {f}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Free tier tab */}
            {tab === 'free-tier' && (
                <div>
                    <div style={{ padding: '14px 18px', borderRadius: 12, marginBottom: 20, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#34d399', marginBottom: 6 }}>🆓 Start free with AWS Free Tier</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Test your infrastructure at zero cost with services that are free for the first 12 months or indefinitely.</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                        {freeTier.map((item: any) => (
                            <div key={item.service} className="glass-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{item.service}</div>
                                    <div style={{ fontSize: 12, color: '#34d399', marginTop: 2 }}>{item.limit}</div>
                                </div>
                                <span style={{
                                    fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 600,
                                    background: item.note.includes('12 ay') ? 'rgba(251,191,36,0.1)' : 'rgba(52,211,153,0.1)',
                                    color: item.note.includes('12 ay') ? '#fbbf24' : '#34d399',
                                    border: `1px solid ${item.note.includes('12 ay') ? 'rgba(251,191,36,0.2)' : 'rgba(52,211,153,0.2)'}`,
                                }}>{item.note}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Estimates tab */}
            {tab === 'estimates' && estimates && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                    {Object.entries(estimates).map(([key, est]: any) => (
                        <div key={key} className="glass-card" style={{ padding: 22 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                <h3 style={{ fontSize: 15, fontWeight: 600 }}>{est.label}</h3>
                                <span style={{ fontSize: 20, fontWeight: 800, color: '#818cf8' }}>${est.total}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-secondary)' }}>/mo</span></span>
                            </div>
                            {[
                                { label: '⚡ ECS Fargate', value: est.ecs },
                                { label: '🗄 RDS', value: est.rds },
                                { label: '⚖️ Load Balancer', value: est.alb },
                                { label: '📦 Misc (S3, CW)', value: est.misc },
                            ].map(item => (
                                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: '1px solid rgba(30,41,59,0.5)' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                                    <strong>${item.value}/mo</strong>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
