'use client';

import Link from 'next/link';

const agents = [
    {
        id: 'infra', name: 'Infrastructure Agent', icon: 'I', color: '#6366f1',
        desc: 'Generates Terraform, CDK, CloudFormation templates. Runs Checkov security scans. Provisions VPC, ECS, RDS.',
        tags: ['aws-cloud-control', 'aws-iac', 'terraform', 'checkov'],
    },
    {
        id: 'pipeline', name: 'Pipeline Agent', icon: 'P', color: '#22c55e',
        desc: 'Creates CI/CD pipelines, writes tests, performs visual QA with Browser Subagent. GitHub Actions, GitLab CI.',
        tags: ['github-actions', 'gitlab-ci', 'codepipeline', 'testing'],
    },
    {
        id: 'finops', name: 'FinOps Agent', icon: 'F', color: '#eab308',
        desc: 'Cost estimation with AWS Pricing MCP, static analysis with Infracost, budget enforcement with OPA.',
        tags: ['aws-pricing', 'infracost', 'opa-rego', 'cost-optimization'],
    },
    {
        id: 'sre', name: 'SRE Agent', icon: 'S', color: '#f43f5e',
        desc: 'Self-healing cycles (Sense-Analyze-Act-Verify). CloudWatch anomaly detection, root cause analysis.',
        tags: ['cloudwatch', 'anomaly-detection', 'auto-remediation', 'rca'],
    },
];

const plans = [
    {
        name: 'Free', price: '$0', period: '/month', popular: false,
        features: ['2 Agents', '5 Deploys/month', '2 AI Models', 'Community Support', 'Basic Dashboard'],
        cta: 'Get Started Free',
    },
    {
        name: 'Pro', price: '$49', period: '/month', popular: true,
        features: ['4 Agents', '50 Deploys/month', '6 AI Models', 'Priority Support', 'Full FinOps Dashboard', 'Self-Healing Engine', 'Custom API Keys', 'Webhook Integrations'],
        cta: 'Start Pro Trial',
    },
    {
        name: 'Enterprise', price: '$199', period: '/month', popular: false,
        features: ['Unlimited Agents', 'Unlimited Deploys', 'All AI Models', '24/7 Dedicated Support', 'SSO & RBAC', 'Custom SLA', 'On-Premise Option', 'Audit Logs'],
        cta: 'Contact Sales',
    },
];

const features = [
    { icon: '🚀', title: 'Zero-Config Deploys', desc: 'Drop your project, our agents handle infrastructure, pipelines, and deployment automatically.' },
    { icon: '🤖', title: 'AI Multi-Agent', desc: '4 specialized agents work in parallel — Infrastructure, Pipeline, FinOps, and SRE — each with MCP servers.' },
    { icon: '💰', title: 'FinOps as Code', desc: 'Real-time cost estimation, budget enforcement with OPA policies, and optimization recommendations.' },
    { icon: '🔄', title: 'Self-Healing', desc: 'SAAV cycle (Sense-Analyze-Act-Verify) detects anomalies and auto-remediates in real-time.' },
    { icon: '📊', title: 'Real-Time Dashboard', desc: 'WebSocket-powered live updates, deployment tracking, agent monitoring, and incident timeline.' },
    { icon: '🔐', title: 'Enterprise Security', desc: 'JWT auth, encrypted API keys, RBAC, audit logs, and Checkov policy enforcement.' },
];

const metrics = [
    { label: 'Deploy Time', value: '< 3min', sub: 'Average' },
    { label: 'Cost Savings', value: '40%', sub: 'With FinOps' },
    { label: 'Uptime', value: '99.9%', sub: 'Self-Healing' },
    { label: 'AI Agents', value: '4', sub: 'Specialized' },
];

export default function LandingPage() {
    return (
        <div>
            {/* Hero */}
            <section style={{
                padding: '100px 32px 80px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Gradient orbs */}
                <div style={{
                    position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)',
                    width: 600, height: 600, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute', top: 100, right: -100,
                    width: 400, height: 400, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />

                <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto' }}>
                    <div style={{
                        display: 'inline-block', padding: '6px 16px', borderRadius: 20,
                        background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                        color: '#818cf8', fontSize: 13, fontWeight: 500, marginBottom: 24,
                    }}>
                        🚀 AI-Powered Autonomous DevOps
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 800,
                        lineHeight: 1.1, marginBottom: 20,
                        background: 'linear-gradient(135deg, #fff 30%, #818cf8 70%, #a78bfa)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                        Deploy. Monitor. Optimize. Self-Heal.
                    </h1>

                    <p style={{
                        fontSize: 'clamp(16px, 2vw, 20px)', color: '#94a3b8',
                        maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.6,
                    }}>
                        The platform that replaces your entire DevOps team with intelligent AI agents.
                        From infrastructure to cost optimization — fully autonomous.
                    </p>

                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/login" style={{
                            padding: '14px 32px', borderRadius: 10,
                            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                            color: '#fff', textDecoration: 'none', fontSize: 16, fontWeight: 600,
                            boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}>Get Started Free →</Link>
                        <a href="#features" style={{
                            padding: '14px 32px', borderRadius: 10,
                            border: '1px solid rgba(148,163,184,0.2)',
                            color: '#e2e8f0', textDecoration: 'none', fontSize: 16, fontWeight: 500,
                            transition: 'border-color 0.2s',
                        }}>See Features</a>
                    </div>
                </div>

                {/* Metrics bar */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: 16, maxWidth: 800, margin: '60px auto 0',
                }}>
                    {metrics.map((m) => (
                        <div key={m.label} style={{
                            padding: '20px 16px', borderRadius: 12,
                            background: 'rgba(30,30,60,0.5)', border: '1px solid rgba(129,140,248,0.1)',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: 28, fontWeight: 800, color: '#818cf8' }}>{m.value}</div>
                            <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>{m.label}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{m.sub}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section id="features" style={{ padding: '80px 32px', maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 60 }}>
                    <h2 style={{ fontSize: 36, fontWeight: 800, color: '#f1f5f9', marginBottom: 12 }}>
                        Everything You Need
                    </h2>
                    <p style={{ color: '#94a3b8', fontSize: 18, maxWidth: 500, margin: '0 auto' }}>
                        A complete DevOps platform powered by AI agents
                    </p>
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: 20,
                }}>
                    {features.map((f) => (
                        <div key={f.title} className="card" style={{
                            padding: 28, borderRadius: 16,
                            background: 'rgba(30,30,60,0.4)', border: '1px solid rgba(129,140,248,0.08)',
                            transition: 'transform 0.2s, border-color 0.2s',
                        }}>
                            <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>{f.title}</h3>
                            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Agents */}
            <section id="agents" style={{
                padding: '80px 32px',
                background: 'rgba(30,30,60,0.3)',
                borderTop: '1px solid rgba(129,140,248,0.08)',
                borderBottom: '1px solid rgba(129,140,248,0.08)',
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 60 }}>
                        <h2 style={{ fontSize: 36, fontWeight: 800, color: '#f1f5f9', marginBottom: 12 }}>
                            Meet the Agents
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: 18 }}>
                            4 specialized AI agents, each connected to MCP servers
                        </p>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: 20,
                    }}>
                        {agents.map((a) => (
                            <div key={a.id} className="card" style={{
                                padding: 28, borderRadius: 16,
                                background: 'rgba(15,15,40,0.6)', border: '1px solid rgba(129,140,248,0.1)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                    <div style={{
                                        width: 44, height: 44, borderRadius: 12,
                                        background: `${a.color}20`, border: `1px solid ${a.color}40`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 18, fontWeight: 800, color: a.color,
                                    }}>{a.icon}</div>
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 16 }}>{a.name}</div>
                                    </div>
                                </div>
                                <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, marginBottom: 16 }}>{a.desc}</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {a.tags.map((t) => (
                                        <span key={t} style={{
                                            padding: '3px 10px', borderRadius: 6, fontSize: 11,
                                            background: `${a.color}15`, color: a.color,
                                            border: `1px solid ${a.color}30`,
                                        }}>{t}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" style={{ padding: '80px 32px', maxWidth: 1100, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 60 }}>
                    <h2 style={{ fontSize: 36, fontWeight: 800, color: '#f1f5f9', marginBottom: 12 }}>
                        Simple, Transparent Pricing
                    </h2>
                    <p style={{ color: '#94a3b8', fontSize: 18 }}>Start free, scale as you grow</p>
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 20, alignItems: 'start',
                }}>
                    {plans.map((p) => (
                        <div key={p.name} className="card" style={{
                            padding: 32, borderRadius: 16,
                            background: p.popular ? 'rgba(99,102,241,0.08)' : 'rgba(30,30,60,0.4)',
                            border: `1px solid ${p.popular ? 'rgba(99,102,241,0.3)' : 'rgba(129,140,248,0.08)'}`,
                            position: 'relative' as const,
                        }}>
                            {p.popular && (
                                <div style={{
                                    position: 'absolute', top: -10, right: 20,
                                    padding: '4px 14px', borderRadius: 20,
                                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                    color: '#fff', fontSize: 12, fontWeight: 600,
                                }}>Most Popular</div>
                            )}
                            <h3 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>{p.name}</h3>
                            <div style={{ marginBottom: 24 }}>
                                <span style={{ fontSize: 44, fontWeight: 800, color: '#818cf8' }}>{p.price}</span>
                                <span style={{ color: '#64748b', fontSize: 14 }}>{p.period}</span>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 28 }}>
                                {p.features.map((f) => (
                                    <li key={f} style={{
                                        padding: '8px 0', fontSize: 14, color: '#cbd5e1',
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        borderBottom: '1px solid rgba(100,116,139,0.1)',
                                    }}>
                                        <span style={{ color: '#34d399' }}>✓</span> {f}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/login" style={{
                                display: 'block', textAlign: 'center', padding: '12px 24px', borderRadius: 10,
                                background: p.popular
                                    ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                                    : 'rgba(99,102,241,0.1)',
                                color: p.popular ? '#fff' : '#818cf8',
                                textDecoration: 'none', fontSize: 15, fontWeight: 600,
                                border: p.popular ? 'none' : '1px solid rgba(99,102,241,0.2)',
                            }}>{p.cta}</Link>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section style={{
                padding: '80px 32px', textAlign: 'center',
                background: 'linear-gradient(180deg, transparent, rgba(99,102,241,0.05))',
            }}>
                <h2 style={{ fontSize: 32, fontWeight: 800, color: '#f1f5f9', marginBottom: 12 }}>
                    Ready to Automate Your DevOps?
                </h2>
                <p style={{ color: '#94a3b8', fontSize: 16, marginBottom: 32 }}>
                    Join hundreds of teams shipping faster with AI-powered automation
                </p>
                <Link href="/login" style={{
                    padding: '16px 40px', borderRadius: 12,
                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    color: '#fff', textDecoration: 'none', fontSize: 18, fontWeight: 600,
                    boxShadow: '0 4px 24px rgba(99,102,241,0.4)',
                }}>Get Started Free →</Link>
            </section>
        </div>
    );
}
