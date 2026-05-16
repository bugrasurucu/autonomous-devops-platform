'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface UsageData {
    monthlyBudgetTokens: number;
    usedTokens: number;
    costUsd: number;
    byModel: { model: string; _sum: { inputTokens: number; outputTokens: number; costUsd: number } }[];
    byAgent: { agentId: string; _sum: { inputTokens: number; outputTokens: number; costUsd: number } }[];
}

const MODEL_META: Record<string, { label: string; color: string; icon: string }> = {
    'claude-haiku-4-5-20251001': { label: 'Claude Haiku',    color: '#f59e0b', icon: '⚡' },
    'claude-sonnet-4-6':         { label: 'Claude Sonnet',   color: '#8b5cf6', icon: '🎵' },
    'gpt-4.1-mini':              { label: 'GPT-4.1 Mini',    color: '#34d399', icon: '🤖' },
    'gpt-4o':                    { label: 'GPT-4o',          color: '#06b6d4', icon: '🧠' },
    'gpt-4o-mini':               { label: 'GPT-4o Mini',     color: '#818cf8', icon: '🤖' },
    'gemini-2.0-flash':          { label: 'Gemini Flash',    color: '#4ade80', icon: '💎' },
};

const AGENT_META: Record<string, { color: string; icon: string; label: string }> = {
    'infra-agent':     { color: '#818cf8', icon: '🏗️', label: 'Infra'     },
    'pipeline-agent':  { color: '#34d399', icon: '🔄', label: 'Pipeline'  },
    'finops-agent':    { color: '#fbbf24', icon: '💰', label: 'FinOps'    },
    'sre-agent':       { color: '#f87171', icon: '🛡️', label: 'SRE'       },
    'bootstrap-agent': { color: '#a78bfa', icon: '🚀', label: 'Bootstrap' },
};

// ── Sub-components ────────────────────────────────────────────────

function StatCard({ label, value, sub, color, icon }: { label: string; value: string; sub?: string; color: string; icon: string }) {
    return (
        <div className="glass-card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: `${color}18`, border: `1px solid ${color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>{icon}</div>
                <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                    {sub && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>{sub}</div>}
                </div>
            </div>
        </div>
    );
}

function GradientBar({ value, max, color, height = 6 }: { value: number; max: number; color: string; height?: number }) {
    const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
    const barColor = pct >= 90 ? '#f87171' : pct >= 75 ? '#fbbf24' : color;
    return (
        <div style={{ height, borderRadius: height / 2, background: 'rgba(30,41,59,0.8)', overflow: 'hidden', marginTop: 6 }}>
            <div style={{
                height: '100%', width: `${pct}%`, borderRadius: height / 2,
                background: `linear-gradient(90deg, ${barColor}70, ${barColor})`,
                transition: 'width 1s ease',
                boxShadow: pct >= 75 ? `0 0 8px ${barColor}50` : 'none',
            }} />
        </div>
    );
}

function DonutChart({ segments }: { segments: { value: number; color: string; label: string }[] }) {
    const total = segments.reduce((s, x) => s + x.value, 0);
    if (total === 0) return <div style={{ color: 'var(--text-secondary)', fontSize: 12, textAlign: 'center', padding: 20 }}>No data</div>;

    const size = 120;
    const radius = 46;
    const cx = size / 2;
    const cy = size / 2;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
                <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(30,41,59,0.8)" strokeWidth={12} />
                {segments.map((seg, i) => {
                    const pct = seg.value / total;
                    const dash = pct * circumference;
                    const el = (
                        <circle
                            key={i}
                            cx={cx} cy={cy} r={radius}
                            fill="none"
                            stroke={seg.color}
                            strokeWidth={12}
                            strokeDasharray={`${dash} ${circumference - dash}`}
                            strokeDashoffset={-offset}
                            strokeLinecap="round"
                        />
                    );
                    offset += dash;
                    return el;
                })}
            </svg>
            <div style={{ flex: 1 }}>
                {segments.map((seg, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1 }}>{seg.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                            {Math.round((seg.value / total) * 100)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────

export default function TokenUsagePage() {
    const [data, setData] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'cost' | 'tokens'>('tokens');

    const load = useCallback(() => {
        api.getTokenUsage()
            .then((r: any) => { setData(r); setError(null); })
            .catch((e: any) => setError(e?.message ?? 'Failed to load'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
        const iv = setInterval(load, 30_000);
        return () => clearInterval(iv);
    }, [load]);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 13, paddingTop: 40 }}>
            <div style={{ width: 16, height: 16, border: '2px solid #00ffc8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading token analytics…
        </div>
    );

    if (error) return (
        <div className="glass-card" style={{ padding: 20, color: '#f87171', fontSize: 13 }}>❌ {error}</div>
    );

    if (!data) return (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
            No token usage recorded yet. Run an agent to start tracking.
        </div>
    );

    const usagePct = Math.min(Math.round((data.usedTokens / data.monthlyBudgetTokens) * 100), 100);
    const remaining = data.monthlyBudgetTokens - data.usedTokens;
    const avgCostPer1k = data.usedTokens > 0 ? (data.costUsd / data.usedTokens) * 1000 : 0;
    const projectedMonthly = data.costUsd * (30 / new Date().getDate());

    const modelSegments = data.byModel.map(m => {
        const meta = MODEL_META[m.model] ?? { color: '#818cf8', label: m.model };
        const val = view === 'cost' ? (m._sum.costUsd ?? 0) : (m._sum.inputTokens ?? 0) + (m._sum.outputTokens ?? 0);
        return { value: val, color: meta.color, label: meta.label };
    });

    const agentSegments = data.byAgent.map(a => {
        const meta = AGENT_META[a.agentId] ?? { color: '#818cf8', label: a.agentId };
        const val = view === 'cost' ? (a._sum.costUsd ?? 0) : (a._sum.inputTokens ?? 0) + (a._sum.outputTokens ?? 0);
        return { value: val, color: meta.color, label: meta.label };
    });

    const statusColor = usagePct >= 90 ? '#f87171' : usagePct >= 70 ? '#fbbf24' : '#34d399';

    return (
        <div style={{ maxWidth: 960 }}>
            {/* ── Header ─────────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700 }}>
                        <span className="gradient-text">Token Usage</span>
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                        AI model consumption · cost analytics · monthly budget tracking
                    </p>
                </div>
                {/* View toggle */}
                <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 4, border: '1px solid rgba(255,255,255,0.08)' }}>
                    {(['tokens', 'cost'] as const).map(v => (
                        <button key={v} onClick={() => setView(v)} style={{
                            padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
                            background: view === v ? 'rgba(0,212,255,0.15)' : 'transparent',
                            color: view === v ? '#00d4ff' : 'var(--text-secondary)',
                            transition: 'all 0.2s',
                        }}>
                            {v === 'tokens' ? '🔢 Tokens' : '💵 Cost'}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Stat cards ─────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                <StatCard
                    label="Tokens Used"
                    value={data.usedTokens.toLocaleString()}
                    sub={`of ${data.monthlyBudgetTokens.toLocaleString()} budget`}
                    color={statusColor}
                    icon="🔢"
                />
                <StatCard
                    label="Total Cost"
                    value={`$${data.costUsd.toFixed(4)}`}
                    sub={`~$${projectedMonthly.toFixed(2)}/mo projected`}
                    color="#34d399"
                    icon="💰"
                />
                <StatCard
                    label="Avg Cost / 1K tokens"
                    value={`$${avgCostPer1k.toFixed(4)}`}
                    sub={`${data.byModel.length} model${data.byModel.length !== 1 ? 's' : ''} active`}
                    color="#818cf8"
                    icon="📊"
                />
                <StatCard
                    label="Remaining Budget"
                    value={remaining.toLocaleString()}
                    sub={`${100 - usagePct}% remaining`}
                    color={remaining < 5000 ? '#f87171' : '#00ffc8'}
                    icon="🎯"
                />
            </div>

            {/* ── Monthly budget bar ─────────────────────────────────── */}
            <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Monthly Budget</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                            fontSize: 11, padding: '2px 8px', borderRadius: 20,
                            background: `${statusColor}18`, color: statusColor,
                            border: `1px solid ${statusColor}30`, fontWeight: 600,
                        }}>
                            {usagePct}% used
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            {data.usedTokens.toLocaleString()} / {data.monthlyBudgetTokens.toLocaleString()} tokens
                        </span>
                    </div>
                </div>
                <GradientBar value={data.usedTokens} max={data.monthlyBudgetTokens} color="#818cf8" height={10} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-secondary)', marginTop: 6 }}>
                    <span>0</span>
                    <span style={{ color: usagePct >= 70 ? '#fbbf24' : undefined }}>⚠ 70%</span>
                    <span style={{ color: usagePct >= 90 ? '#f87171' : undefined }}>🔴 90%</span>
                    <span>{data.monthlyBudgetTokens.toLocaleString()}</span>
                </div>
            </div>

            {/* ── Model + Agent breakdown ─────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                {/* Model distribution */}
                <div className="glass-card" style={{ padding: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        🤖 Model Distribution
                        <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 400 }}>
                            ({view === 'tokens' ? 'by tokens' : 'by cost'})
                        </span>
                    </div>

                    <DonutChart segments={modelSegments} />

                    <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14 }}>
                        {data.byModel.map(m => {
                            const meta = MODEL_META[m.model] ?? { label: m.model, color: '#818cf8', icon: '🤖' };
                            const total = (m._sum.inputTokens ?? 0) + (m._sum.outputTokens ?? 0);
                            return (
                                <div key={m.model} style={{ marginBottom: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: meta.color, fontWeight: 500 }}>
                                            <span>{meta.icon}</span> {meta.label}
                                        </span>
                                        <span style={{ color: 'var(--text-secondary)' }}>
                                            {view === 'cost'
                                                ? `$${(m._sum.costUsd ?? 0).toFixed(4)}`
                                                : `${total.toLocaleString()} tok`}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 16, fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>
                                        <span>↑ {(m._sum.inputTokens ?? 0).toLocaleString()} in</span>
                                        <span>↓ {(m._sum.outputTokens ?? 0).toLocaleString()} out</span>
                                    </div>
                                    <GradientBar
                                        value={view === 'cost' ? (m._sum.costUsd ?? 0) : total}
                                        max={view === 'cost' ? data.costUsd : data.usedTokens}
                                        color={meta.color}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Agent distribution */}
                <div className="glass-card" style={{ padding: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        🤖 Agent Distribution
                        <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 400 }}>
                            ({view === 'tokens' ? 'by tokens' : 'by cost'})
                        </span>
                    </div>

                    <DonutChart segments={agentSegments} />

                    <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14 }}>
                        {data.byAgent
                            .sort((a, b) => {
                                const av = view === 'cost' ? (a._sum.costUsd ?? 0) : (a._sum.inputTokens ?? 0) + (a._sum.outputTokens ?? 0);
                                const bv = view === 'cost' ? (b._sum.costUsd ?? 0) : (b._sum.inputTokens ?? 0) + (b._sum.outputTokens ?? 0);
                                return bv - av;
                            })
                            .map(a => {
                                const meta = AGENT_META[a.agentId] ?? { color: '#818cf8', icon: '🤖', label: a.agentId };
                                const total = (a._sum.inputTokens ?? 0) + (a._sum.outputTokens ?? 0);
                                return (
                                    <div key={a.agentId} style={{ marginBottom: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: meta.color, fontWeight: 500 }}>
                                                <span>{meta.icon}</span> {meta.label}
                                            </span>
                                            <span style={{ color: 'var(--text-secondary)' }}>
                                                {view === 'cost'
                                                    ? `$${(a._sum.costUsd ?? 0).toFixed(4)}`
                                                    : `${total.toLocaleString()} tok`}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 16, fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>
                                            <span>↑ {(a._sum.inputTokens ?? 0).toLocaleString()} in</span>
                                            <span>↓ {(a._sum.outputTokens ?? 0).toLocaleString()} out</span>
                                            <span style={{ color: meta.color }}>
                                                efficiency {total > 0 ? Math.round(((a._sum.outputTokens ?? 0) / total) * 100) : 0}% out
                                            </span>
                                        </div>
                                        <GradientBar
                                            value={view === 'cost' ? (a._sum.costUsd ?? 0) : total}
                                            max={view === 'cost' ? data.costUsd : data.usedTokens}
                                            color={meta.color}
                                        />
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </div>

            {/* ── Cost efficiency tips ────────────────────────────────── */}
            <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>💡 Cost Optimization Insights</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {[
                        {
                            icon: '⚡',
                            title: 'Use Haiku for routing',
                            desc: 'Claude Haiku is 8× cheaper than Sonnet for classification and simple tasks.',
                            color: '#f59e0b',
                            saving: '~60% cost reduction',
                        },
                        {
                            icon: '🔧',
                            title: 'Batch agent calls',
                            desc: 'Combine multiple small tasks into one agent run to reduce API overhead.',
                            color: '#34d399',
                            saving: '~25% token savings',
                        },
                        {
                            icon: '📋',
                            title: 'Cache Terraform plans',
                            desc: 'infra-agent uses the most tokens — enable plan caching to avoid redundant calls.',
                            color: '#818cf8',
                            saving: '~40% for infra-agent',
                        },
                    ].map((tip, i) => (
                        <div key={i} style={{
                            padding: 14, borderRadius: 10,
                            background: `${tip.color}08`, border: `1px solid ${tip.color}20`,
                        }}>
                            <div style={{ fontSize: 20, marginBottom: 6 }}>{tip.icon}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: tip.color, marginBottom: 4 }}>{tip.title}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>{tip.desc}</div>
                            <div style={{
                                fontSize: 10, padding: '2px 8px', borderRadius: 20, display: 'inline-block',
                                background: `${tip.color}15`, color: tip.color, fontWeight: 600,
                            }}>{tip.saving}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Budget warning / upgrade CTA ───────────────────────── */}
            {usagePct >= 70 && (
                <div style={{
                    padding: '16px 20px', borderRadius: 12, marginBottom: 16,
                    background: usagePct >= 90 ? 'rgba(248,113,113,0.08)' : 'rgba(251,191,36,0.08)',
                    border: `1px solid ${statusColor}30`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                }}>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: statusColor }}>
                            {usagePct >= 90 ? '🔴 Budget critical — upgrade now' : '⚠️ Budget running low'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                            {remaining.toLocaleString()} tokens remaining · Upgrade for 10× more capacity and unlimited deployments
                        </div>
                    </div>
                    <a href="/dashboard/billing" style={{
                        padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                        background: statusColor, color: '#0f172a', textDecoration: 'none', whiteSpace: 'nowrap',
                        flexShrink: 0,
                    }}>
                        Upgrade Plan →
                    </a>
                </div>
            )}
        </div>
    );
}
