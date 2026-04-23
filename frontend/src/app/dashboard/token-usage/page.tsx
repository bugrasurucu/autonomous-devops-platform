'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface UsageData {
    monthlyBudgetTokens: number;
    usedTokens: number;
    costUsd: number;
    byModel: { model: string; _sum: { inputTokens: number; outputTokens: number; costUsd: number } }[];
    byAgent: { agentId: string; _sum: { inputTokens: number; outputTokens: number; costUsd: number } }[];
}

const MODEL_LABELS: Record<string, string> = {
    'claude-haiku-4-5-20251001': 'Claude Haiku',
    'claude-sonnet-4-6': 'Claude Sonnet',
    'gpt-4.1-mini': 'GPT-4.1 Mini',
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o Mini',
    'gemini-2.0-flash': 'Gemini 2.0 Flash',
};

const AGENT_COLORS: Record<string, string> = {
    'infra-agent': '#818cf8',
    'pipeline-agent': '#34d399',
    'finops-agent': '#fbbf24',
    'sre-agent': '#f87171',
    'bootstrap-agent': '#a78bfa',
};

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
    const barColor = pct >= 90 ? '#f87171' : pct >= 70 ? '#fbbf24' : color;
    return (
        <div style={{ height: 6, borderRadius: 3, background: 'rgba(30,41,59,0.8)', overflow: 'hidden', marginTop: 6 }}>
            <div style={{
                height: '100%', width: `${pct}%`, borderRadius: 3,
                background: `linear-gradient(90deg, ${barColor}80, ${barColor})`,
                transition: 'width 0.8s ease',
            }} />
        </div>
    );
}

export default function TokenUsagePage() {
    const [data, setData] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.getTokenUsage()
            .then((r: any) => setData(r))
            .catch((e: any) => setError(e?.message ?? 'Veri yüklenemedi'))
            .finally(() => setLoading(false));
    }, []);

    const usagePct = data ? Math.min(Math.round((data.usedTokens / data.monthlyBudgetTokens) * 100), 100) : 0;

    return (
        <div style={{ maxWidth: 900 }}>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700 }}><span className="gradient-text">Token Usage</span></h1>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Monthly AI model token consumption and cost breakdown
                </p>
            </div>

            {loading && (
                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Loading...</div>
            )}

            {error && (
                <div className="glass-card" style={{ padding: 20, color: '#f87171', fontSize: 13 }}>
                    ❌ {error}
                </div>
            )}

            {!loading && !error && !data && (
                <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                    No token usage recorded yet
                </div>
            )}

            {data && (
                <>
                    {/* Ana bütçe kartı */}
                    <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Monthly Budget</div>
                                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {data.usedTokens.toLocaleString()}
                                    <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 400 }}>
                                        {' '}/ {data.monthlyBudgetTokens.toLocaleString()} token
                                    </span>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total Cost</div>
                                <div style={{ fontSize: 22, fontWeight: 700, color: '#34d399' }}>
                                    ${data.costUsd.toFixed(4)}
                                </div>
                            </div>
                        </div>
                        <Bar value={data.usedTokens} max={data.monthlyBudgetTokens} color="#818cf8" />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                            <span>{usagePct}% used</span>
                            {usagePct >= 80 && (
                                <span style={{ color: '#fbbf24' }}>⚠ Approaching budget limit — consider upgrading</span>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {/* Model bazında kullanım */}
                        <div className="glass-card" style={{ padding: 20 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
                                Model Distribution
                            </div>
                            {data.byModel.length === 0 ? (
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>
                                    No usage yet
                                </div>
                            ) : (
                                data.byModel.map(m => {
                                    const total = (m._sum.inputTokens ?? 0) + (m._sum.outputTokens ?? 0);
                                    return (
                                        <div key={m.model} style={{ marginBottom: 14 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                                <span style={{ color: 'var(--text-primary)' }}>{MODEL_LABELS[m.model] ?? m.model}</span>
                                                <span style={{ color: 'var(--text-secondary)' }}>${(m._sum.costUsd ?? 0).toFixed(4)}</span>
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{total.toLocaleString()} token</div>
                                            <Bar value={total} max={data.usedTokens || 1} color="#818cf8" />
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Ajan bazında kullanım */}
                        <div className="glass-card" style={{ padding: 20 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
                                Agent Distribution
                            </div>
                            {data.byAgent.length === 0 ? (
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>
                                    No usage yet
                                </div>
                            ) : (
                                data.byAgent.map(a => {
                                    const total = (a._sum.inputTokens ?? 0) + (a._sum.outputTokens ?? 0);
                                    const color = AGENT_COLORS[a.agentId] ?? '#818cf8';
                                    return (
                                        <div key={a.agentId} style={{ marginBottom: 14 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                                <span style={{ color, fontWeight: 500 }}>{a.agentId}</span>
                                                <span style={{ color: 'var(--text-secondary)' }}>${(a._sum.costUsd ?? 0).toFixed(4)}</span>
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{total.toLocaleString()} token</div>
                                            <Bar value={total} max={data.usedTokens || 1} color={color} />
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Plan yükseltme CTA */}
                    {usagePct >= 70 && (
                        <div style={{
                            marginTop: 16, padding: 16, borderRadius: 12,
                            background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24' }}>Token bütçesi dolmak üzere</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                    Planı yükselterek daha fazla token ve deployment kapasitesi al
                                </div>
                            </div>
                            <a href="/dashboard/billing" style={{
                                padding: '8px 16px', background: '#fbbf24', color: '#0f172a',
                                borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none',
                                whiteSpace: 'nowrap',
                            }}>
                                Planı Yükselt
                            </a>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
