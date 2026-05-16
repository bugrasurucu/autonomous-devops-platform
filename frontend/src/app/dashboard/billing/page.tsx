'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/Toast';

interface Plan {
    plan: string;
    deploymentsPerMonth: number;
    tokenBudget: number;
    priceUsd: number;
    priceId: string | null;
}

const PLAN_META: Record<string, {
    label: string; color: string; emoji: string;
    gradient: string; tagline: string; popular?: boolean;
    features: string[];
}> = {
    free: {
        label: 'Free', color: '#64748b', emoji: '🚀', gradient: 'rgba(100,116,139,0.12)',
        tagline: 'Perfect to explore Orbitron',
        features: ['3 deployments / month', '50K tokens / month', '4 AI Agents (shared)', 'Community support', 'Basic CloudWatch alerts', 'GitHub Actions CI/CD'],
    },
    starter: {
        label: 'Starter', color: '#818cf8', emoji: '⚡', gradient: 'rgba(129,140,248,0.12)',
        tagline: 'For growing teams',
        features: ['20 deployments / month', '200K tokens / month', '4 AI Agents (dedicated)', 'Priority email support', 'Advanced FinOps policies', 'Slack notifications'],
    },
    pro: {
        label: 'Pro', color: '#34d399', emoji: '🏆', gradient: 'rgba(52,211,153,0.12)',
        tagline: 'Most popular for engineering teams', popular: true,
        features: ['100 deployments / month', '500K tokens / month', 'All AI models (Claude Sonnet)', 'SLA support + priority', 'Full audit logs + SIEM', 'SSO ready', 'Unlimited team members'],
    },
    enterprise: {
        label: 'Enterprise', color: '#fbbf24', emoji: '🌐', gradient: 'rgba(251,191,36,0.08)',
        tagline: 'For mission-critical infrastructure',
        features: ['Unlimited deployments', '5M+ tokens / month', 'Custom AI agents', 'Dedicated K8s cluster', 'SOC2 / GDPR SLA', 'On-prem option', '24/7 white-glove support'],
    },
};

const PLAN_ORDER = ['free', 'starter', 'pro', 'enterprise'];

const COMPARISON_ROWS = [
    ['Deployments/mo',   '3',        '20',          '100',        'Unlimited'],
    ['Token Budget',      '50K',      '200K',        '500K',       '5M+'],
    ['AI Agents',         '4 shared', '4 dedicated', '4 dedicated', '4 + custom'],
    ['Model Access',      'Haiku',    'Haiku + Sonnet', 'All models', 'All + custom'],
    ['Team Members',      '1',        '5',           'Unlimited',   'Unlimited'],
    ['Priority Support',  '✕',        '✕',           '✓',          '✓ SLA'],
    ['Audit Logs',        '✕',        '✕',           '✓',          '✓'],
    ['SSO / RBAC',        '✕',        '✕',           '✕',          '✓'],
    ['On-Prem Deploy',    '✕',        '✕',           '✕',          '✓'],
    ['SLO Guarantee',     '✕',        '✕',           '99.9%',      '99.99%'],
];

export default function BillingPage() {
    const { user } = useAuth();
    const { success, error: toastError } = useToast();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [currentPlan, setCurrentPlan] = useState<string>('free');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
    const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
    const [usage, setUsage] = useState<any>(null);

    useEffect(() => {
        Promise.all([
            api.billing.getPlans(),
            api.tenant.getMe(),
            api.getUsage().catch(() => null),
        ]).then(([plansData, orgData, usageData]: [any, any, any]) => {
            setPlans(plansData ?? []);
            setCurrentPlan(orgData?.plan ?? 'free');
            setUsage(usageData);
        }).catch((e: any) => {
            setError(e?.message ?? 'Failed to load billing data');
        }).finally(() => setLoading(false));
    }, []);

    async function handleUpgrade(planKey: string) {
        setCheckoutLoading(planKey);
        try {
            const res: any = await api.billing.checkout(planKey, window.location.origin + '/dashboard/billing');
            if (res?.url) {
                window.location.href = res.url;
            } else {
                success('Plan Updated!', `You're now on the ${PLAN_META[planKey]?.label} plan.`);
                setCurrentPlan(planKey);
            }
        } catch (err: any) {
            toastError('Upgrade Failed', err?.message ?? 'Failed to start checkout');
        } finally {
            setCheckoutLoading(null);
        }
    }

    async function handlePortal() {
        try {
            const res: any = await api.billing.portal(window.location.origin + '/dashboard/billing');
            if (res?.url) window.location.href = res.url;
        } catch {
            toastError('Error', 'Failed to open billing portal');
        }
    }

    const getPrice = (plan: Plan) => {
        if (plan.priceUsd === 0) return { display: '$0', period: '/mo' };
        if (plan.plan === 'enterprise') return { display: 'Custom', period: '' };
        const monthly = plan.priceUsd;
        const annual = Math.round(monthly * 10); // 2 months free
        return billingInterval === 'annual'
            ? { display: `$${annual}`, period: '/yr', save: `Save $${monthly * 2}` }
            : { display: `$${monthly}`, period: '/mo' };
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 13, padding: 40 }}>
            <div className="orbit-loader" /> Loading billing...
        </div>
    );

    const currentMeta = PLAN_META[currentPlan] ?? PLAN_META.free;
    const deploysUsed = usage?.deploysThisMonth ?? 0;
    const currentPlanData = plans.find(p => p.plan === currentPlan);
    const deployLimit = currentPlanData?.deploymentsPerMonth ?? 3;
    const deployPct = deployLimit === -1 ? 0 : Math.min(100, (deploysUsed / deployLimit) * 100);
    const tokenBudget = currentPlanData?.tokenBudget ?? 50000;

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                        <span className="gradient-text">Billing</span> & Plans
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        Manage your subscription, usage, and payment details
                    </p>
                </div>
                {currentPlan !== 'free' && (
                    <button onClick={handlePortal} className="btn-primary" style={{ fontSize: 12 }}>
                        🔗 Billing Portal
                    </button>
                )}
            </div>

            {error && (
                <div className="glass-card" style={{ padding: '12px 16px', marginBottom: 20, color: '#f87171', fontSize: 13, border: '1px solid rgba(248,113,113,0.25)' }}>
                    ❌ {error} — plan data may not be fully available.
                </div>
            )}

            {/* Current plan banner */}
            <div style={{
                padding: '20px 24px', borderRadius: 14, marginBottom: 24,
                background: `linear-gradient(135deg, ${currentMeta.color}12, ${currentMeta.color}06)`,
                border: `1px solid ${currentMeta.color}30`,
                display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
            }}>
                <div style={{ fontSize: 36 }}>{currentMeta.emoji}</div>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3, letterSpacing: '0.05em' }}>CURRENT PLAN</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: currentMeta.color }}>{currentMeta.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{currentMeta.tagline}</div>
                </div>
                {/* Usage bars */}
                <div style={{ flex: 2, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                            <span>Deployments this month</span>
                            <span style={{ color: deployPct > 80 ? '#f87171' : 'var(--text-secondary)' }}>
                                {deploysUsed} / {deployLimit === -1 ? '∞' : deployLimit}
                            </span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: 'rgba(30,41,59,0.8)' }}>
                            <div style={{
                                height: '100%', borderRadius: 3, transition: 'width 0.5s',
                                background: deployPct > 80 ? '#f87171' : currentMeta.color,
                                width: deployLimit === -1 ? '10%' : `${deployPct}%`,
                            }} />
                        </div>
                    </div>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                            <span>Token budget</span>
                            <span>{tokenBudget.toLocaleString()} / mo</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: 'rgba(30,41,59,0.8)' }}>
                            <div style={{ height: '100%', borderRadius: 3, background: currentMeta.color, width: '8%' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Billing toggle */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28, gap: 0 }}>
                <div style={{
                    display: 'flex', background: 'rgba(15,23,42,0.7)', borderRadius: 10,
                    border: '1px solid var(--border-color)', padding: 3,
                }}>
                    {(['monthly', 'annual'] as const).map(interval => (
                        <button
                            key={interval}
                            onClick={() => setBillingInterval(interval)}
                            style={{
                                padding: '7px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                                background: billingInterval === interval ? '#818cf8' : 'transparent',
                                color: billingInterval === interval ? 'white' : 'var(--text-secondary)',
                            }}
                        >
                            {interval === 'monthly' ? 'Monthly' : '🎁 Annual (2mo free)'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Plan cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
                {PLAN_ORDER.map(planKey => {
                    const planData = plans.find(p => p.plan === planKey);
                    const meta = PLAN_META[planKey];
                    if (!meta) return null;
                    const isCurrentPlan = planKey === currentPlan;
                    const isUpgrade = PLAN_ORDER.indexOf(planKey) > PLAN_ORDER.indexOf(currentPlan);
                    const pricing = planData ? getPrice(planData) : { display: '—', period: '' };

                    return (
                        <div key={planKey} style={{
                            padding: '24px 20px', borderRadius: 16, position: 'relative',
                            background: meta.popular
                                ? `linear-gradient(160deg, ${meta.color}10, ${meta.gradient})`
                                : meta.gradient,
                            border: `1.5px solid ${isCurrentPlan ? meta.color : meta.popular ? meta.color + '40' : 'var(--border-color)'}`,
                            boxShadow: isCurrentPlan
                                ? `0 0 24px ${meta.color}20`
                                : meta.popular ? `0 0 32px ${meta.color}15` : 'none',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}>
                            {/* Badge */}
                            {isCurrentPlan && (
                                <div style={{
                                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                                    background: meta.color, color: '#0a0f1e', fontSize: 9, fontWeight: 800,
                                    padding: '3px 12px', borderRadius: 20, whiteSpace: 'nowrap', letterSpacing: '0.05em',
                                }}>✓ ACTIVE PLAN</div>
                            )}
                            {meta.popular && !isCurrentPlan && (
                                <div style={{
                                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                                    background: `linear-gradient(135deg, ${meta.color}, #00d4ff)`,
                                    color: '#0a0f1e', fontSize: 9, fontWeight: 800,
                                    padding: '3px 12px', borderRadius: 20, whiteSpace: 'nowrap', letterSpacing: '0.05em',
                                }}>⭐ MOST POPULAR</div>
                            )}

                            <div style={{ fontSize: 28, marginBottom: 8 }}>{meta.emoji}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: meta.color, marginBottom: 4 }}>{meta.label}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.3 }}>{meta.tagline}</div>

                            <div style={{ marginBottom: 20 }}>
                                <span style={{ fontSize: 32, fontWeight: 900, color: '#e2eeff', letterSpacing: '-1px' }}>{pricing.display}</span>
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 3 }}>{pricing.period}</span>
                                {'save' in pricing && pricing.save && (
                                    <div style={{ fontSize: 10, color: meta.color, fontWeight: 600, marginTop: 2 }}>{pricing.save}</div>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 20 }}>
                                {meta.features.map(f => (
                                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11 }}>
                                        <span style={{ color: meta.color, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                                        <span style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>{f}</span>
                                    </div>
                                ))}
                            </div>

                            {isCurrentPlan ? (
                                <div style={{
                                    padding: '9px 0', borderRadius: 8, textAlign: 'center',
                                    background: `${meta.color}15`, border: `1px solid ${meta.color}30`,
                                    fontSize: 12, fontWeight: 700, color: meta.color,
                                }}>Current Plan</div>
                            ) : planKey === 'enterprise' ? (
                                <a href="mailto:sales@orbitron.dev" style={{
                                    display: 'block', textAlign: 'center', padding: '9px 0',
                                    border: `1px solid ${meta.color}`, borderRadius: 8,
                                    color: meta.color, fontSize: 12, fontWeight: 700, textDecoration: 'none',
                                }}>Contact Sales →</a>
                            ) : isUpgrade ? (
                                <button
                                    onClick={() => handleUpgrade(planKey)}
                                    disabled={checkoutLoading === planKey}
                                    style={{
                                        width: '100%', padding: '10px 0',
                                        background: meta.popular
                                            ? `linear-gradient(135deg, ${meta.color}80, ${meta.color})`
                                            : `${meta.color}20`,
                                        border: `1px solid ${meta.color}60`,
                                        borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                        color: meta.popular ? '#0a0f1e' : meta.color,
                                        opacity: checkoutLoading === planKey ? 0.7 : 1,
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {checkoutLoading === planKey ? '⏳ Redirecting...' : `Upgrade to ${meta.label} →`}
                                </button>
                            ) : (
                                <div style={{
                                    padding: '9px 0', borderRadius: 8, textAlign: 'center',
                                    background: 'rgba(30,41,59,0.4)', border: '1px solid var(--border-color)',
                                    fontSize: 12, color: 'var(--text-secondary)',
                                }}>Downgrade</div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Feature comparison table */}
            <div className="glass-card" style={{ overflow: 'hidden', marginBottom: 20 }}>
                <div style={{
                    padding: '14px 20px', borderBottom: '1px solid var(--border-color)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>📊 Plan Comparison</span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>All features compared</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 600 }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '10px 20px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500, width: '30%' }}>Feature</th>
                                {PLAN_ORDER.map(p => {
                                    const meta = PLAN_META[p];
                                    return (
                                        <th key={p} style={{
                                            padding: '10px 16px', textAlign: 'center',
                                            color: meta.color, fontWeight: 700,
                                            background: p === currentPlan ? `${meta.color}08` : 'transparent',
                                        }}>
                                            {meta.emoji} {meta.label}
                                            {p === currentPlan && <div style={{ fontSize: 9, fontWeight: 400, opacity: 0.7 }}>← current</div>}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {COMPARISON_ROWS.map(([feature, ...values]) => (
                                <tr key={feature} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <td style={{ padding: '10px 20px', color: 'var(--text-secondary)' }}>{feature}</td>
                                    {values.map((v, i) => {
                                        const planKey = PLAN_ORDER[i];
                                        const meta = PLAN_META[planKey];
                                        const isCurrent = planKey === currentPlan;
                                        const isCheck = v === '✓' || v.startsWith('✓');
                                        const isCross = v === '✕';
                                        return (
                                            <td key={i} style={{
                                                padding: '10px 16px', textAlign: 'center',
                                                color: isCross ? '#334155' : isCheck ? '#34d399' : isCurrent ? meta.color : 'var(--text-primary)',
                                                fontWeight: isCheck ? 700 : 400,
                                                background: isCurrent ? `${meta.color}05` : 'transparent',
                                            }}>{v}</td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FAQ / Info bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                    { icon: '💳', title: 'Secure Payments', desc: 'Stripe-powered checkout. No card stored on our servers.' },
                    { icon: '🔄', title: 'Cancel Anytime', desc: 'Downgrade or cancel your plan with zero friction.' },
                    { icon: '📩', title: 'Questions?', desc: 'Email sales@orbitron.dev for enterprise quotes.' },
                ].map(item => (
                    <div key={item.title} className="glass-card" style={{ padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{item.title}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
