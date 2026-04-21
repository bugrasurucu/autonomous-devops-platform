'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

/* ═══ DATA ════════════════════════════════════════════════════════════ */

const agents = [
    {
        id: 'infra', name: 'Infrastructure Agent', icon: '🏗',
        color: '#00d4ff', tagColor: 'cyan',
        headline: 'From repo to cloud in under 3 minutes.',
        desc: 'Reads your codebase, selects the right AWS stack (ECS vs EKS vs Lambda), generates production-grade Terraform/CDK, runs Checkov security scans, and provisions VPC, RDS, ElastiCache — with least-privilege IAM out of the box.',
        tags: ['terraform', 'aws-cdk', 'checkov', 'vpc', 'ecs', 'rds'],
        stats: [{ v: '< 3min', l: 'Infra Ready' }, { v: 'CIS', l: 'Benchmarks' }, { v: 'Zero', l: 'Manual IaC' }],
    },
    {
        id: 'pipeline', name: 'Pipeline Agent', icon: '🔄',
        color: '#00ff88', tagColor: 'green',
        headline: 'CI/CD that writes itself.',
        desc: 'Auto-generates GitHub Actions YAML, writes unit and E2E tests for your stack, runs visual regression QA with a headless browser, and pushes green builds. Integrates with Docker, semantic versioning, and environment promotion.',
        tags: ['github-actions', 'jest', 'pytest', 'playwright', 'docker', 'semver'],
        stats: [{ v: '100%', l: 'Auto-Generated' }, { v: 'E2E', l: 'Test Coverage' }, { v: 'Visual', l: 'QA Included' }],
    },
    {
        id: 'finops', name: 'FinOps Agent', icon: '💰',
        color: '#f59e0b', tagColor: 'orange',
        headline: 'Cut cloud costs by 40% automatically.',
        desc: 'Real-time cost estimation via AWS Pricing MCP before any resource is provisioned. Infracost static analysis on PRs. OPA Rego policies block budget overruns. Graviton and Reserved Instance recommendations baked in.',
        tags: ['aws-pricing', 'infracost', 'opa-rego', 'graviton', 'reserved-instances'],
        stats: [{ v: '40%', l: 'Avg Savings' }, { v: 'OPA', l: 'Policy Guard' }, { v: 'Pre-deploy', l: 'Cost Estimate' }],
    },
    {
        id: 'sre', name: 'SRE Agent', icon: '🛡',
        color: '#ff4d6d', tagColor: 'cyan',
        headline: 'Self-heals before you even get paged.',
        desc: 'Runs the SAAV loop — Sense (CloudWatch anomaly detection), Analyze (RAG-based root cause), Act (Lambda/SSM auto-remediation), Verify (metric confirmation). EventBridge triggers it instantly on any alarm.',
        tags: ['cloudwatch', 'eventbridge', 'lambda', 'rag-rca', 'ssm', 'slack'],
        stats: [{ v: 'SAAV', l: 'Heal Loop' }, { v: 'RAG', l: 'Root Cause AI' }, { v: '< 30s', l: 'MTTR' }],
    },
];

const pipelineSteps = [
    {
        step: '01', label: 'Repo Drop', icon: '📦',
        desc: 'Push your code or paste a GitHub URL. Orbitron clones and analyzes the stack automatically.',
        detail: ['Language detected', 'Framework inferred', 'Deps scanned'],
    },
    {
        step: '02', label: 'Agent Plan', icon: '🧠',
        desc: 'The ReAct loop plans tool calls across all 4 agents in parallel. Zero config required.',
        detail: ['IaC strategy chosen', 'Cost pre-estimated', 'Security baseline set'],
    },
    {
        step: '03', label: 'IaC Generated', icon: '⚙',
        desc: 'Terraform + CDK written, Checkov security scans pass, VPC topology finalized.',
        detail: ['Terraform HCL written', 'Checkov ✓ passed', 'IAM least-privilege'],
    },
    {
        step: '04', label: 'CI/CD Built', icon: '🔄',
        desc: 'GitHub Actions YAML generated, unit + E2E tests written, Docker image built.',
        detail: ['Pipeline YAML created', 'Tests auto-written', 'Docker multi-stage'],
    },
    {
        step: '05', label: 'Deploy → AWS', icon: '🚀',
        desc: 'Resources provisioned on AWS. Health checks pass. Traffic routed to the new environment.',
        detail: ['ECS/EKS live', 'RDS provisioned', 'CDN fronted'],
    },
    {
        step: '06', label: 'SRE Watch', icon: '🛡',
        desc: 'SRE Agent starts monitoring. CloudWatch alarms wired. Auto-heals on first anomaly.',
        detail: ['Alarms active', 'SAAV loop on', 'Slack notified'],
    },
];

const k8sReasons = [
    {
        icon: '🔒', title: 'Multi-Tenant Isolation', color: '#00d4ff',
        desc: 'Every organization gets a dedicated Kubernetes namespace. Network policies, secrets, and RBAC roles are fully scoped — air-gapped from all other tenants.',
        code: 'apiVersion: v1\nkind: Namespace\nmetadata:\n  name: tenant-{org-id}\n  labels:\n    tenant: "true"',
    },
    {
        icon: '⚡', title: 'kagent CRD Scheduling', color: '#00ff88',
        desc: 'kagent extends K8s with an Agent custom resource. The control plane handles scheduling, retry-on-failure, and backpressure — no custom orchestration code needed.',
        code: 'apiVersion: kagent.dev/v1\nkind: Agent\nspec:\n  type: InfraAgent\n  tools: [terraform, checkov]\n  mcp: aws-cloud-control',
    },
    {
        icon: '📈', title: 'Horizontal Pod Autoscaling', color: '#f59e0b',
        desc: 'HPA scales agent pods based on queue depth and CPU. During peak deployments, 10+ agents run in parallel — zero cold-start and no throttling.',
        code: 'kind: HorizontalPodAutoscaler\nspec:\n  minReplicas: 1\n  maxReplicas: 20\n  metrics:\n  - type: External\n    external:\n      metric: agent_queue_depth',
    },
    {
        icon: '🛡', title: 'RBAC → SOC2 / GDPR', color: '#ff4d6d',
        desc: 'K8s RBAC enforces least-privilege per agent type. Infra agents can\'t touch pipeline secrets. Every API call is audit-logged to CloudWatch for compliance.',
        code: 'kind: Role\nrules:\n- apiGroups: ["kagent.dev"]\n  resources: ["agents"]\n  verbs: ["get","watch"]\n  # No write — read-only audit',
    },
    {
        icon: '🔌', title: 'MCP Sidecar Auto-Injection', color: '#a78bfa',
        desc: 'MCP servers (AWS Cloud Control, GitHub, Infracost) are injected as sidecar containers via Mutating Webhook. Agents get their tools automatically — zero agent configuration.',
        code: 'annotations:\n  kagent.dev/inject-mcp: "true"\n  kagent.dev/mcp-servers: >\n    aws-cloud-control,\n    github-actions,\n    infracost',
    },
    {
        icon: '🔄', title: 'Stateful Crash Recovery', color: '#00d4ff',
        desc: 'Agent state is checkpointed to Redis on every tool call. If a pod crashes mid-execution, K8s restarts it and execution resumes from the last checkpoint — no work lost.',
        code: '# Redis checkpoint\nagent.state.checkpoint(\n  step="terraform_apply",\n  completed_resources=[\n    "aws_vpc.main",\n    "aws_subnet.public"\n  ]\n)',
    },
];

const techStack = [
    {
        category: 'Orchestration', color: '#00d4ff',
        items: [
            { name: 'Kubernetes', logo: '☸', desc: 'Container orchestration and agent scheduling via kagent CRDs' },
            { name: 'kagent', logo: '🤖', desc: 'Kubernetes-native AI agent framework — the core brain of Orbitron' },
            { name: 'Helm', logo: '⎈', desc: 'Package manager for Kubernetes deployments' },
        ],
    },
    {
        category: 'Infrastructure as Code', color: '#00ff88',
        items: [
            { name: 'Terraform', logo: '🏗', desc: 'Multi-cloud IaC — generated and applied autonomously' },
            { name: 'AWS CDK', logo: '☁', desc: 'TypeScript-native AWS resource definitions' },
            { name: 'Checkov', logo: '🔒', desc: 'Static IaC security analysis — CIS benchmark compliance' },
        ],
    },
    {
        category: 'CI/CD', color: '#f59e0b',
        items: [
            { name: 'GitHub Actions', logo: '⚡', desc: 'Auto-generated YAML workflows for every project' },
            { name: 'Docker', logo: '🐳', desc: 'Multi-stage builds, layer caching, registry push' },
            { name: 'Playwright', logo: '🎭', desc: 'Visual regression and E2E test generation' },
        ],
    },
    {
        category: 'Cloud & Observability', color: '#ff4d6d',
        items: [
            { name: 'AWS', logo: '🌐', desc: 'ECS, EKS, Lambda, RDS, ElastiCache, CloudWatch' },
            { name: 'CloudWatch', logo: '📊', desc: 'Metrics, anomaly detection, and alarm triggers' },
            { name: 'EventBridge', logo: '🔔', desc: 'Event routing for SRE auto-remediation workflows' },
        ],
    },
    {
        category: 'AI & MCP', color: '#a78bfa',
        items: [
            { name: 'Claude Sonnet', logo: '🧠', desc: 'Agent reasoning, tool selection, and plan generation' },
            { name: 'MCP Protocol', logo: '🔌', desc: 'Tool servers injected as K8s sidecars — zero config' },
            { name: 'RAG Engine', logo: '📚', desc: 'Retrieval-augmented root cause analysis for SRE' },
        ],
    },
    {
        category: 'FinOps', color: '#f59e0b',
        items: [
            { name: 'Infracost', logo: '💰', desc: 'Pre-deploy cost estimates on every PR and plan' },
            { name: 'OPA / Rego', logo: '📋', desc: 'Policy enforcement — blocks budget overruns' },
            { name: 'AWS Pricing MCP', logo: '🏷', desc: 'Real-time pricing data fed to agents before provisioning' },
        ],
    },
];

const plans = [
    {
        name: 'Free', price: '$0', period: '/mo', color: '#7a9cc0', popular: false,
        features: [
            '3 deployments / month',
            '50K tokens / month',
            '4 AI Agents (shared)',
            'Community support',
            'GitHub Actions CI/CD',
            'Basic CloudWatch alerts',
        ],
        cta: 'Start Free', ctaHref: '/login',
    },
    {
        name: 'Pro', price: '$29', period: '/mo', color: '#00d4ff', popular: true,
        features: [
            '100 deployments / month',
            '500K tokens / month',
            '4 AI Agents (dedicated)',
            'Priority support + SLA',
            'Advanced FinOps policies',
            'Full audit logs',
            'SSO ready',
        ],
        cta: 'Start Pro Trial', ctaHref: '/login',
    },
    {
        name: 'Enterprise', price: 'Custom', period: '', color: '#f59e0b', popular: false,
        features: [
            'Unlimited deployments',
            '5M+ tokens / month',
            'Custom AI agents',
            'Dedicated K8s cluster',
            'SOC2 / GDPR SLA',
            'On-prem deployment option',
            '24/7 white-glove support',
        ],
        cta: 'Contact Sales', ctaHref: 'mailto:sales@orbitron.dev',
    },
];

/* Terminal animation script — module-level for stable useEffect closure */
const TERMINAL_SCRIPT: string[] = [
    '$ orbitron deploy github.com/acme/api-service',
    '▶ Analyzing stack... Python 3.11 + FastAPI detected',
    '▶ Infra Agent: generating terraform/main.tf',
    '  ✓ aws_vpc.main provisioned',
    '  ✓ aws_ecs_cluster.api created',
    '▶ Pipeline Agent: writing .github/workflows/ci.yml',
    '  ✓ 47 unit tests generated and passing',
    '▶ FinOps Agent: estimated cost $38.20/mo (↓12%)',
    '▶ Deploying to us-east-1... 🚀',
    '✅ LIVE at https://api.acme.com  [2m 47s total]',
];

/* ═══ COMPONENT ═══════════════════════════════════════════════════════ */

export default function LandingPage() {
    const [activeAgent, setActiveAgent] = useState(0);
    const [activePipeline, setActivePipeline] = useState(0);
    const [terminalLines, setTerminalLines] = useState<string[]>([]);

    // Cycle pipeline steps
    useEffect(() => {
        const t = setInterval(() => setActivePipeline(p => (p + 1) % pipelineSteps.length), 2000);
        return () => clearInterval(t);
    }, []);

    // Animate terminal lines
    useEffect(() => {
        let i = 0;
        const t = setInterval(() => {
            if (i < TERMINAL_SCRIPT.length) {
                setTerminalLines(prev => [...prev, TERMINAL_SCRIPT[i]]);
                i++;
            } else {
                clearInterval(t);
            }
        }, 500);
        return () => clearInterval(t);
    }, []);

    const C = {
        cyan: '#00d4ff', green: '#00ff88', amber: '#f59e0b', red: '#ff4d6d', purple: '#a78bfa',
    };

    return (
        <div style={{ overflow: 'hidden' }}>

            {/* ─── HERO ─────────────────────────────────────────────────── */}
            <section style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center',
                position: 'relative', padding: '120px 24px 80px',
            }}>
                {/* Grid bg */}
                <div className="grid-bg" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
                {/* Radial glow */}
                <div style={{
                    position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
                    width: 700, height: 700, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />

                <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
                    {/* Left — text */}
                    <div className="page-enter">
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '6px 14px', borderRadius: 20,
                            background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)',
                            marginBottom: 28,
                        }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, boxShadow: '0 0 8px #00ff88' }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: C.cyan, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>
                                ORBITRON Beta — Kubernetes-native
                            </span>
                        </div>

                        <h1 style={{
                            fontSize: 'clamp(44px, 5.5vw, 72px)', fontWeight: 900,
                            lineHeight: 1.0, letterSpacing: '-2px', marginBottom: 24,
                            color: '#e2eeff',
                        }}>
                            Ship<br />
                            <span className="gradient-text">Infrastructure,</span><br />
                            Not YAML.
                        </h1>

                        <p style={{ fontSize: 18, color: '#7a9cc0', lineHeight: 1.7, maxWidth: 480, marginBottom: 36 }}>
                            Orbitron deploys <strong style={{ color: C.cyan }}>4 specialized AI agents</strong> — Infra, Pipeline, FinOps, and SRE — running on Kubernetes with <span style={{ color: C.green }}>kagent</span>. Drop your repo. We handle the rest.
                        </p>

                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                            <Link href="/login" className="btn-primary" style={{ fontSize: 16, padding: '14px 28px' }}>
                                Start Free →
                            </Link>
                            <a href="#k8s" className="btn-ghost" style={{ fontSize: 16, padding: '14px 28px' }}>
                                Why Kubernetes?
                            </a>
                        </div>

                        {/* Trust badges */}
                        <div style={{ display: 'flex', gap: 20, marginTop: 36, flexWrap: 'wrap' }}>
                            {['☸ Kubernetes-native', '⚡ < 3min deploy', '🔒 SOC2-ready', '🌐 AWS native'].map(t => (
                                <span key={t} style={{ fontSize: 12, color: '#3d5a7a', fontFamily: 'JetBrains Mono, monospace' }}>{t}</span>
                            ))}
                        </div>
                    </div>

                    {/* Right — live terminal */}
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            background: 'rgba(2,12,27,0.97)', border: '1px solid rgba(0,212,255,0.2)',
                            borderRadius: 16, overflow: 'hidden',
                            boxShadow: '0 0 60px rgba(0,212,255,0.08), 0 40px 80px rgba(0,0,0,0.4)',
                        }}>
                            {/* Terminal title bar */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '12px 16px', borderBottom: '1px solid rgba(0,212,255,0.08)',
                                background: 'rgba(10,22,40,0.8)',
                            }}>
                                {['#ff5f57', '#febc2e', '#28c840'].map(c => (
                                    <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
                                ))}
                                <span style={{ marginLeft: 8, fontSize: 12, color: '#3d5a7a', fontFamily: 'JetBrains Mono, monospace' }}>
                                    orbitron — deploy agent
                                </span>
                            </div>
                            <div style={{ padding: '20px 24px', minHeight: 300, fontFamily: 'JetBrains Mono, monospace', fontSize: 13, lineHeight: 1.9 }}>
                                {terminalLines.map((line, i) => (
                                    <div key={i} style={{
                                        color: typeof line === 'string' && line.startsWith('$') ? C.cyan
                                            : typeof line === 'string' && line.startsWith('✅') ? C.green
                                            : typeof line === 'string' && line.startsWith('  ✓') ? C.green
                                            : '#7a9cc0',
                                        opacity: 1,
                                    }}>
                                        {line}
                                    </div>
                                ))}
                                {terminalLines.length < TERMINAL_SCRIPT.length && (
                                    <span style={{ color: C.cyan, animation: 'pulse 1s infinite' }}>█</span>
                                )}
                            </div>
                        </div>
                        {/* Glow effect under terminal */}
                        <div style={{
                            position: 'absolute', bottom: -30, left: '10%', right: '10%', height: 60,
                            background: 'radial-gradient(ellipse, rgba(0,212,255,0.15) 0%, transparent 70%)',
                            filter: 'blur(10px)',
                        }} />
                    </div>
                </div>

                {/* Metrics bar */}
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    borderTop: '1px solid rgba(0,212,255,0.08)',
                    background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(12px)',
                }}>
                    <div style={{
                        maxWidth: 1200, margin: '0 auto', padding: '20px 24px',
                        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24,
                    }}>
                        {[
                            { v: '< 3min', l: 'Deploy Time', sub: 'Zero to production', c: C.cyan },
                            { v: '40%', l: 'Cost Savings', sub: 'With FinOps Agent', c: C.green },
                            { v: '99.9%', l: 'Uptime SLA', sub: 'SAAV self-healing', c: C.amber },
                            { v: '4+', l: 'AI Agents', sub: 'K8s-native, parallel', c: '#a78bfa' },
                        ].map(m => (
                            <div key={m.l} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 28, fontWeight: 900, color: m.c, letterSpacing: '-1px' }}>{m.v}</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2eeff', marginTop: 2 }}>{m.l}</div>
                                <div style={{ fontSize: 11, color: '#3d5a7a', marginTop: 1 }}>{m.sub}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── PIPELINE PROCESS ────────────────────────────────────── */}
            <section style={{ padding: '100px 24px', background: 'rgba(10,22,40,0.5)', position: 'relative' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 64 }}>
                        <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: C.cyan, letterSpacing: '0.15em', marginBottom: 12 }}>AUTONOMOUS PIPELINE</div>
                        <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 16 }}>
                            Drop repo. Get{' '}
                            <span className="gradient-text">production.</span>
                        </h2>
                        <p style={{ fontSize: 16, color: '#7a9cc0', maxWidth: 520, margin: '0 auto' }}>
                            6 autonomous steps, 0 configuration. Every agent runs in parallel on Kubernetes pods.
                        </p>
                    </div>

                    {/* Steps timeline */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, position: 'relative' }}>
                        {/* Connecting line */}
                        <div style={{
                            position: 'absolute', top: 32, left: '8%', right: '8%', height: 1,
                            background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.3), transparent)',
                        }} />
                        {pipelineSteps.map((step, i) => {
                            const isActive = i === activePipeline;
                            const isDone = i < activePipeline;
                            return (
                                <div
                                    key={step.step}
                                    onClick={() => setActivePipeline(i)}
                                    style={{
                                        position: 'relative', textAlign: 'center',
                                        cursor: 'pointer', transition: 'all 0.3s',
                                    }}
                                >
                                    {/* Step circle */}
                                    <div style={{
                                        width: 64, height: 64, borderRadius: '50%',
                                        margin: '0 auto 16px',
                                        background: isActive
                                            ? `linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,212,255,0.05))`
                                            : isDone ? 'rgba(0,255,136,0.08)' : 'rgba(10,22,40,0.8)',
                                        border: `2px solid ${isActive ? C.cyan : isDone ? C.green : 'rgba(0,212,255,0.12)'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 24,
                                        boxShadow: isActive ? `0 0 24px rgba(0,212,255,0.3)` : 'none',
                                        transition: 'all 0.3s',
                                    }}>
                                        {isDone ? '✓' : step.icon}
                                    </div>
                                    <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: C.cyan, marginBottom: 4 }}>
                                        STEP {step.step}
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? '#e2eeff' : '#7a9cc0' }}>
                                        {step.label}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Active step detail */}
                    <div style={{
                        marginTop: 48, padding: '28px 36px', borderRadius: 16,
                        background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(0,212,255,0.12)',
                        display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center',
                        transition: 'all 0.3s',
                    }}>
                        <div>
                            <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: C.cyan, marginBottom: 8 }}>
                                {pipelineSteps[activePipeline].step} / {pipelineSteps[activePipeline].label.toUpperCase()}
                            </div>
                            <p style={{ fontSize: 16, color: '#e2eeff', lineHeight: 1.7 }}>
                                {pipelineSteps[activePipeline].desc}
                            </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                            {pipelineSteps[activePipeline].detail.map(d => (
                                <div key={d} style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '6px 12px', borderRadius: 8,
                                    background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.15)',
                                }}>
                                    <span style={{ color: C.green, fontSize: 11, fontWeight: 700 }}>✓</span>
                                    <span style={{ fontSize: 12, color: '#7a9cc0', fontFamily: 'JetBrains Mono, monospace' }}>{d}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── AI AGENTS ───────────────────────────────────────────── */}
            <section id="agents" style={{ padding: '100px 24px' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 64 }}>
                        <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: C.green, letterSpacing: '0.15em', marginBottom: 12 }}>AI AGENT FLEET</div>
                        <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 16 }}>
                            4 specialized agents,{' '}
                            <span className="gradient-text">1 platform.</span>
                        </h2>
                        <p style={{ fontSize: 16, color: '#7a9cc0', maxWidth: 520, margin: '0 auto' }}>
                            Each agent is a Kubernetes pod with its own MCP server sidecars. They collaborate via shared Redis state — never in each other's way.
                        </p>
                    </div>

                    {/* Agent selector */}
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 40, flexWrap: 'wrap' }}>
                        {agents.map((a, i) => (
                            <button
                                key={a.id}
                                onClick={() => setActiveAgent(i)}
                                style={{
                                    padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14,
                                    background: activeAgent === i ? `${a.color}18` : 'transparent',
                                    border: `1px solid ${activeAgent === i ? a.color : 'rgba(0,212,255,0.12)'}`,
                                    color: activeAgent === i ? a.color : '#7a9cc0',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {a.icon} {a.name}
                            </button>
                        ))}
                    </div>

                    {/* Active agent card */}
                    {agents.map((agent, i) => i === activeAgent && (
                        <div key={agent.id} style={{
                            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48,
                            padding: '48px', borderRadius: 20,
                            background: `linear-gradient(135deg, ${agent.color}06, transparent)`,
                            border: `1px solid ${agent.color}25`,
                        }}>
                            <div>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>{agent.icon}</div>
                                <h3 style={{ fontSize: 28, fontWeight: 800, color: agent.color, marginBottom: 8 }}>{agent.name}</h3>
                                <p style={{ fontSize: 15, color: '#7a9cc0', fontStyle: 'italic', marginBottom: 20 }}>{agent.headline}</p>
                                <p style={{ fontSize: 15, color: '#e2eeff', lineHeight: 1.8, marginBottom: 28 }}>{agent.desc}</p>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {agent.tags.map(t => (
                                        <span key={t} style={{
                                            padding: '4px 10px', borderRadius: 6,
                                            fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                                            background: `${agent.color}10`, color: agent.color,
                                            border: `1px solid ${agent.color}25`,
                                        }}>{t}</span>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {/* Stats */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
                                    {agent.stats.map(s => (
                                        <div key={s.l} style={{
                                            padding: '16px', borderRadius: 12, textAlign: 'center',
                                            background: `${agent.color}08`, border: `1px solid ${agent.color}18`,
                                        }}>
                                            <div style={{ fontSize: 22, fontWeight: 800, color: agent.color }}>{s.v}</div>
                                            <div style={{ fontSize: 11, color: '#7a9cc0', marginTop: 4 }}>{s.l}</div>
                                        </div>
                                    ))}
                                </div>
                                {/* K8s pod visualization */}
                                <div style={{
                                    background: 'rgba(2,12,27,0.9)', border: `1px solid ${agent.color}20`,
                                    borderRadius: 12, padding: '16px 20px',
                                    fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#7a9cc0', lineHeight: 1.9,
                                }}>
                                    <div style={{ color: '#3d5a7a', marginBottom: 4 }}># Kubernetes pod status</div>
                                    <div><span style={{ color: agent.color }}>NAME</span>{'                         STATUS'}</div>
                                    <div><span style={{ color: '#e2eeff' }}>{agent.id}-agent-7d4f9b</span>   <span style={{ color: C.green }}>Running ✓</span></div>
                                    <div><span style={{ color: '#e2eeff' }}>mcp-sidecar-{agent.id.slice(0,4)}</span>      <span style={{ color: C.green }}>Running ✓</span></div>
                                    <div><span style={{ color: '#e2eeff' }}>redis-checkpoint</span>       <span style={{ color: C.green }}>Running ✓</span></div>
                                </div>
                                <Link href="/login" style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: 8, padding: '14px', borderRadius: 12, textDecoration: 'none',
                                    background: `linear-gradient(135deg, ${agent.color}30, ${agent.color}10)`,
                                    border: `1px solid ${agent.color}40`, color: agent.color, fontWeight: 700, fontSize: 14,
                                    transition: 'all 0.2s',
                                }}>
                                    Try {agent.name} Free →
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── WHY KUBERNETES ──────────────────────────────────────── */}
            <section id="k8s" style={{ padding: '100px 24px', background: 'rgba(10,22,40,0.4)' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 72 }}>
                        <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: '#a78bfa', letterSpacing: '0.15em', marginBottom: 12 }}>☸ KUBERNETES-NATIVE ARCHITECTURE</div>
                        <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 16 }}>
                            Why does Orbitron{' '}
                            <span style={{ background: 'linear-gradient(135deg, #a78bfa, #00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                run on Kubernetes?
                            </span>
                        </h2>
                        <p style={{ fontSize: 16, color: '#7a9cc0', maxWidth: 600, margin: '0 auto' }}>
                            Kubernetes isn't configurable overhead — it's the core reason Orbitron can run multi-tenant AI agents safely, scalably, and without custom orchestration code.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                        {k8sReasons.map((r) => (
                            <div key={r.title} className="glass-card" style={{ padding: '28px 24px' }}>
                                <div style={{ fontSize: 28, marginBottom: 12 }}>{r.icon}</div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: r.color, marginBottom: 10 }}>{r.title}</h3>
                                <p style={{ fontSize: 13, color: '#7a9cc0', lineHeight: 1.7, marginBottom: 16 }}>{r.desc}</p>
                                <pre style={{
                                    background: 'rgba(2,12,27,0.9)', border: `1px solid ${r.color}20`,
                                    borderRadius: 8, padding: '12px 14px',
                                    fontFamily: 'JetBrains Mono, monospace',
                                    fontSize: 10, color: C.green, lineHeight: 1.8,
                                    overflowX: 'auto', whiteSpace: 'pre',
                                }}>
                                    {r.code}
                                </pre>
                            </div>
                        ))}
                    </div>

                    {/* kagent flow diagram */}
                    <div style={{
                        marginTop: 48, padding: '36px 40px', borderRadius: 20,
                        background: 'rgba(2,12,27,0.8)', border: '1px solid rgba(167,139,250,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, flexWrap: 'wrap',
                    }}>
                        {[
                            { label: 'Your Repo', color: '#7a9cc0', icon: '📦' },
                            { arrow: true },
                            { label: 'kagent Controller', color: '#a78bfa', icon: '☸' },
                            { arrow: true },
                            { label: 'Agent Pods', color: C.cyan, icon: '🤖' },
                            { arrow: true },
                            { label: 'MCP Sidecars', color: C.green, icon: '🔌' },
                            { arrow: true },
                            { label: 'AWS Cloud', color: C.amber, icon: '🌐' },
                        ].map((item: any, i) => item.arrow ? (
                            <div key={i} style={{ fontSize: 20, color: '#3d5a7a', padding: '0 12px' }}>→</div>
                        ) : (
                            <div key={i} style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                                padding: '16px 20px', borderRadius: 12,
                                background: `${item.color}08`, border: `1px solid ${item.color}20`,
                                minWidth: 110,
                            }}>
                                <span style={{ fontSize: 24 }}>{item.icon}</span>
                                <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: item.color, textAlign: 'center' }}>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── TECH STACK ──────────────────────────────────────────── */}
            <section id="stack" style={{ padding: '100px 24px' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 64 }}>
                        <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: C.amber, letterSpacing: '0.15em', marginBottom: 12 }}>TECH STACK</div>
                        <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 16 }}>
                            Best-in-class tools,{' '}
                            <span className="gradient-text-warm">fully wired.</span>
                        </h2>
                        <p style={{ fontSize: 16, color: '#7a9cc0', maxWidth: 520, margin: '0 auto' }}>
                            Every tool in this stack was chosen because it's the category standard. No lock-in — you own every file Orbitron generates.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                        {techStack.map(cat => (
                            <div key={cat.category} className="glass-card" style={{ padding: '24px 20px' }}>
                                <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: cat.color, letterSpacing: '0.1em', marginBottom: 16, borderBottom: `1px solid ${cat.color}20`, paddingBottom: 12 }}>
                                    {cat.category.toUpperCase()}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    {cat.items.map(item => (
                                        <div key={item.name} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                                                background: `${cat.color}10`, border: `1px solid ${cat.color}20`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                                            }}>{item.logo}</div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: '#e2eeff', marginBottom: 3 }}>{item.name}</div>
                                                <div style={{ fontSize: 11, color: '#7a9cc0', lineHeight: 1.5 }}>{item.desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── PRICING ─────────────────────────────────────────────── */}
            <section id="pricing" style={{ padding: '100px 24px', background: 'rgba(10,22,40,0.5)' }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 64 }}>
                        <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: C.cyan, letterSpacing: '0.15em', marginBottom: 12 }}>PRICING</div>
                        <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 16 }}>
                            Start free.{' '}
                            <span className="gradient-text">Scale when ready.</span>
                        </h2>
                        <p style={{ fontSize: 16, color: '#7a9cc0', maxWidth: 420, margin: '0 auto' }}>
                            No credit card required for the free plan. Upgrade instantly when you need more agents or throughput.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                        {plans.map(plan => (
                            <div key={plan.name} style={{
                                padding: '32px 28px', borderRadius: 20, position: 'relative',
                                background: plan.popular ? `linear-gradient(160deg, ${plan.color}08, transparent)` : 'rgba(10,22,40,0.8)',
                                border: `1px solid ${plan.popular ? plan.color + '40' : 'rgba(0,212,255,0.1)'}`,
                                boxShadow: plan.popular ? `0 0 40px ${plan.color}12` : 'none',
                            }}>
                                {plan.popular && (
                                    <div style={{
                                        position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                                        background: `linear-gradient(135deg, ${plan.color}, #006a80)`,
                                        color: '#020c1b', fontSize: 10, fontWeight: 800,
                                        padding: '4px 14px', borderRadius: 20, whiteSpace: 'nowrap',
                                        fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em',
                                    }}>MOST POPULAR</div>
                                )}
                                <div style={{ fontSize: 16, fontWeight: 700, color: plan.color, marginBottom: 8 }}>{plan.name}</div>
                                <div style={{ marginBottom: 24 }}>
                                    <span style={{ fontSize: 42, fontWeight: 900, color: '#e2eeff', letterSpacing: '-2px' }}>{plan.price}</span>
                                    <span style={{ fontSize: 14, color: '#7a9cc0' }}>{plan.period}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                                    {plan.features.map(f => (
                                        <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                                            <span style={{ color: plan.popular ? plan.color : C.green, fontWeight: 700, fontSize: 12 }}>✓</span>
                                            <span style={{ color: '#7a9cc0' }}>{f}</span>
                                        </div>
                                    ))}
                                </div>
                                <a
                                    href={plan.ctaHref}
                                    style={{
                                        display: 'block', textAlign: 'center', padding: '13px',
                                        borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 14,
                                        background: plan.popular ? `linear-gradient(135deg, #006a80, ${plan.color})` : `${plan.color}12`,
                                        border: `1px solid ${plan.color}${plan.popular ? '60' : '25'}`,
                                        color: plan.popular ? '#020c1b' : plan.color,
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {plan.cta}
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── CTA ──────────────────────────────────────────────────── */}
            <section style={{ padding: '120px 24px', textAlign: 'center', position: 'relative' }}>
                <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
                <div style={{
                    position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)',
                    width: 600, height: 600, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 70%)',
                }} />
                <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
                    <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: C.cyan, letterSpacing: '0.15em', marginBottom: 20 }}>READY TO ORBIT?</div>
                    <h2 style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: 20, lineHeight: 1.1 }}>
                        Your infrastructure,<br />
                        <span className="gradient-text">in orbit.</span>
                    </h2>
                    <p style={{ fontSize: 17, color: '#7a9cc0', marginBottom: 40, lineHeight: 1.7 }}>
                        Join teams shipping cloud infrastructure in under 3 minutes. Free forever, no credit card needed.
                    </p>
                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/login" className="btn-primary" style={{ fontSize: 17, padding: '16px 36px' }}>
                            Start Free →
                        </Link>
                        <Link href="/login" className="btn-ghost" style={{ fontSize: 17, padding: '16px 36px' }}>
                            Sign In
                        </Link>
                    </div>
                    <div style={{ marginTop: 32, fontSize: 13, color: '#3d5a7a', fontFamily: 'JetBrains Mono, monospace' }}>
                        ☸ &nbsp;Kubernetes-native &nbsp;·&nbsp; 🔒 No vendor lock-in &nbsp;·&nbsp; ⚡ Free plan forever
                    </div>
                </div>
            </section>
        </div>
    );
}
