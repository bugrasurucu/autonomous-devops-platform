'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Plan {
    plan: string;
    deploymentsPerMonth: number;
    tokenBudget: number;
    priceUsd: number;
    priceId: string | null;
}

const PLAN_LABELS: Record<string, string> = {
    free: 'Free',
    starter: 'Starter',
    pro: 'Pro',
    enterprise: 'Enterprise',
};

const PLAN_COLORS: Record<string, string> = {
    free: '#64748b',
    starter: '#818cf8',
    pro: '#34d399',
    enterprise: '#fbbf24',
};

const PLAN_ORDER = ['free', 'starter', 'pro', 'enterprise'];

export default function BillingPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [currentPlan, setCurrentPlan] = useState<string>('free');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            api.billing.getPlans(),
            api.tenant.getMe(),
        ]).then(([plansData, orgData]: [any, any]) => {
            setPlans(plansData ?? []);
            setCurrentPlan(orgData?.plan ?? 'free');
        }).catch((e: any) => {
            setError(e?.message ?? 'Failed to load data');
        }).finally(() => setLoading(false));
    }, []);

    async function handleUpgrade(plan: string) {
        setCheckoutLoading(plan);
        try {
            const res: any = await api.billing.checkout(plan, window.location.origin + '/dashboard/billing');
            if (res?.url) window.location.href = res.url;
        } catch (err: any) {
            alert(err?.message ?? 'Failed to start checkout');
        } finally {
            setCheckoutLoading(null);
        }
    }

    async function handlePortal() {
        try {
            const res: any = await api.billing.portal(window.location.origin + '/dashboard/billing');
            if (res?.url) window.location.href = res.url;
        } catch {
            alert('Failed to open billing portal');
        }
    }

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13, padding: 40 }}>
            <div className="orbit-loader" /> Loading billing...
        </div>
    );

    if (error) return (
        <div style={{ maxWidth: 900 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
                <span className="gradient-text">Billing</span>
            </h1>
            <div className="glass-card" style={{ padding: 20, color: '#f87171', fontSize: 13 }}>
                ❌ {error}
            </div>
        </div>
    );

    return (
        <div style={{ maxWidth: 900 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                        <span className="gradient-text">Billing</span> <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>& Plans</span>
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        Current plan:{' '}
                        <span style={{ color: PLAN_COLORS[currentPlan], fontWeight: 600 }}>
                            {PLAN_LABELS[currentPlan] ?? currentPlan}
                        </span>
                    </p>
                </div>
                {currentPlan !== 'free' && (
                    <button onClick={handlePortal} className="btn-primary" style={{ fontSize: 12 }}>
                        Billing Portal
                    </button>
                )}
            </div>

            {/* Plan cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                {plans.map(plan => {
                    const isCurrentPlan = plan.plan === currentPlan;
                    const color = PLAN_COLORS[plan.plan] ?? '#818cf8';
                    const isDowngrade = PLAN_ORDER.indexOf(plan.plan) < PLAN_ORDER.indexOf(currentPlan);

                    return (
                        <div key={plan.plan} className="glass-card" style={{
                            padding: 20, position: 'relative',
                            border: `1px solid ${isCurrentPlan ? color : 'var(--border-color)'}`,
                            boxShadow: isCurrentPlan ? `0 0 0 1px ${color}40` : 'none',
                        }}>
                            {isCurrentPlan && (
                                <div style={{
                                    position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                                    background: color, color: '#0f172a', fontSize: 10, fontWeight: 700,
                                    padding: '2px 10px', borderRadius: 20, whiteSpace: 'nowrap',
                                }}>
                                    CURRENT PLAN
                                </div>
                            )}

                            <div style={{ fontSize: 15, fontWeight: 700, color, marginBottom: 4 }}>
                                {PLAN_LABELS[plan.plan] ?? plan.plan}
                            </div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                                {plan.priceUsd === 0 ? 'Free' : `$${plan.priceUsd}/mo`}
                            </div>

                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                                {plan.deploymentsPerMonth === -1
                                    ? 'Unlimited deploys/mo'
                                    : `${plan.deploymentsPerMonth} deploys/mo`}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>
                                {plan.tokenBudget.toLocaleString()} tokens/mo
                            </div>

                            {!isCurrentPlan && plan.plan !== 'enterprise' && !isDowngrade && (
                                <button
                                    onClick={() => handleUpgrade(plan.plan)}
                                    disabled={checkoutLoading === plan.plan}
                                    style={{
                                        width: '100%', padding: '9px 0',
                                        background: color, color: '#0f172a',
                                        border: 'none', borderRadius: 8,
                                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                        opacity: checkoutLoading === plan.plan ? 0.7 : 1,
                                    }}
                                >
                                    {checkoutLoading === plan.plan ? 'Redirecting...' : 'Upgrade'}
                                </button>
                            )}
                            {plan.plan === 'enterprise' && !isCurrentPlan && (
                                <a href="mailto:sales@orbitron.dev" style={{
                                    display: 'block', textAlign: 'center', padding: '9px 0',
                                    border: `1px solid ${color}`, borderRadius: 8,
                                    color, fontSize: 12, fontWeight: 700, textDecoration: 'none',
                                }}>
                                    Contact Sales
                                </a>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Feature comparison table */}
            <div className="glass-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Plan Comparison
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ padding: '10px 20px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500 }}>Feature</th>
                            {PLAN_ORDER.map(p => (
                                <th key={p} style={{ padding: '10px 16px', textAlign: 'center', color: PLAN_COLORS[p], fontWeight: 600 }}>
                                    {PLAN_LABELS[p]}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            ['Deployments/mo', '3', '20', '100', 'Unlimited'],
                            ['Token Budget', '50K', '200K', '500K', '5M+'],
                            ['kagent AI Agents', '4', '4', '4', '4 + custom'],
                            ['AWS MCP Tools', '✓', '✓', '✓', '✓'],
                            ['Model Selection', 'Haiku', 'Haiku+Sonnet', 'All', 'All'],
                            ['Team Members', '1', '5', 'Unlimited', 'Unlimited'],
                            ['Priority Support', '✕', '✕', '✓', '✓ SLA'],
                            ['SSO & RBAC', '✕', '✕', '✕', '✓'],
                            ['Audit Logs', '✕', '✕', '✓', '✓'],
                        ].map(([feature, ...values]) => (
                            <tr key={feature} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '10px 20px', color: 'var(--text-secondary)' }}>{feature}</td>
                                {values.map((v, i) => (
                                    <td key={i} style={{
                                        padding: '10px 16px', textAlign: 'center',
                                        color: v === '✕' ? '#334155' : v === '✓' || v.startsWith('✓') ? '#34d399' : 'var(--text-primary)',
                                        fontWeight: v === '✓' || v.startsWith('✓') ? 700 : 400,
                                    }}>{v}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
