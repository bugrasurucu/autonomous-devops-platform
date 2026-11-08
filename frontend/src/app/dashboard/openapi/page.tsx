'use client';

import { useEffect, useState } from 'react';

const DEFAULT_OPENAPI_SPEC = {
    openapi: '3.1.0',
    info: {
        title: 'Orbitron Multi-Cloud Autonomous DevOps Platform API',
        version: '2.0.0',
        description:
            'Control Plane REST API for Multi-Cloud IaC Synthesis (AWS, GCP, Azure, Kubernetes), Autonomous Agents, FinOps OPA Policies, and SAAV Self-Healing.',
    },
    paths: {
        '/api/deploy': { post: { summary: 'Trigger autonomous multi-cloud deployment orchestration', tag: 'Deployments' } },
        '/api/deployments': { get: { summary: 'List deployments for authenticated tenant', tag: 'Deployments' } },
        '/api/deployments/providers': { get: { summary: 'Get multi-cloud provider catalog & keyless OIDC setup templates', tag: 'Multi-Cloud' } },
        '/api/deployments/{id}/artifacts': { get: { summary: 'Get synthesized Dockerfile, OpenTofu/Terraform, K8s manifests, Security Gate & FinOps report', tag: 'Deployments' } },
        '/api/deployments/{id}/plan-diff': { get: { summary: 'Get structured OpenTofu plan diff (+add ~change -destroy) and iacHash', tag: 'Deployments' } },
        '/api/deployments/{id}/github-pr': { post: { summary: 'Prepare GitHub Setup Pull Request on orbitron/setup-* branch', tag: 'GitOps' } },
        '/api/deployments/{id}/rollback': { post: { summary: 'Rollback deployment to previous verified release', tag: 'Deployments' } },
        '/api/deployments/{id}/destroy': { post: { summary: 'Destroy environment resources (tofu destroy)', tag: 'Deployments' } },
        '/api/agents': { get: { summary: 'List autonomous DevOps agents and runtime telemetry', tag: 'AI Agents' } },
        '/api/agents/tools': { get: { summary: 'List deterministic agent tool catalog & guardrail policies', tag: 'AI Agents' } },
        '/api/agents/benchmark': { get: { summary: 'Run 10-stack multi-cloud evaluation benchmark suite', tag: 'AI Agents' } },
        '/api/incidents/runbooks': { get: { summary: 'List declarative YAML SAAV remediation runbooks', tag: 'SRE & SAAV' } },
        '/api/incidents/{id}/saav-timeline': { get: { summary: 'Get 4-stage Sense→Analyze→Act→Verify timeline for incident', tag: 'SRE & SAAV' } },
        '/api/incidents/webhook/{provider}': { post: { summary: 'Ingest cloud alarm webhook (aws, gcp, azure, alertmanager)', tag: 'SRE & SAAV' } },
        '/api/finops': { get: { summary: 'Get multi-cloud cost breakdown, 30-day projection, anomalies, and IaC optimization patches', tag: 'FinOps' } },
        '/api/finops/opa-evaluate': { get: { summary: 'Evaluate OPA/Rego FinOps budget and compute policies', tag: 'FinOps' } },
        '/api/tenants/rbac-matrix': { get: { summary: 'Get environment-scoped RBAC permission matrix', tag: 'Enterprise & Audit' } },
        '/api/tenants/audit-logs': { get: { summary: 'Query immutable tenant audit logs', tag: 'Enterprise & Audit' } },
        '/api/tenants/audit-logs/export': { get: { summary: 'Export audit logs as JSON or CSV', tag: 'Enterprise & Audit' } },
    },
};

export default function OpenApiExplorerPage() {
    const [spec, setSpec] = useState<any>(DEFAULT_OPENAPI_SPEC);
    const [copied, setCopied] = useState(false);
    const [showRawJson, setShowRawJson] = useState(false);

    useEffect(() => {
        fetch('/api/openapi.json')
            .then(r => (r.ok ? r.json() : null))
            .then(data => {
                if (data?.openapi) setSpec(data);
            })
            .catch(() => {});
    }, []);

    const handleCopyJson = () => {
        navigator.clipboard.writeText(JSON.stringify(spec, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadJson = () => {
        const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'orbitron-openapi-3.1.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const entries = Object.entries(spec.paths || {});

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h1 style={{ fontSize: 22, fontWeight: 700 }}>
                            <span className="gradient-text">OpenAPI {spec.openapi || '3.1.0'}</span> Specification
                        </h1>
                        <span style={{
                            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
                            background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)',
                        }}>
                            v{spec.info?.version || '2.0.0'} · OAS 3.1
                        </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                        {spec.info?.description}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setShowRawJson(v => !v)}
                        style={{
                            padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            background: showRawJson ? 'rgba(251,191,36,0.2)' : 'rgba(129,140,248,0.15)',
                            border: '1px solid rgba(129,140,248,0.35)', color: showRawJson ? '#fbbf24' : '#818cf8',
                        }}
                    >
                        {showRawJson ? '📋 Show Interactive Endpoints' : '{ } View Raw OpenAPI JSON'}
                    </button>
                    <button
                        onClick={handleCopyJson}
                        style={{
                            padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.35)', color: '#34d399',
                        }}
                    >
                        {copied ? '✓ Copied JSON!' : '📋 Copy Spec JSON'}
                    </button>
                    <button
                        onClick={handleDownloadJson}
                        style={{
                            padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.35)', color: '#38bdf8',
                        }}
                    >
                        ⬇ Download openapi.json
                    </button>
                    <a
                        href="/api/openapi.json"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)', textDecoration: 'none',
                        }}
                    >
                        ↗ /api/openapi.json
                    </a>
                </div>
            </div>

            {showRawJson ? (
                <div className="glass-card" style={{ padding: 20 }}>
                    <pre style={{
                        margin: 0, padding: 16, borderRadius: 10, background: '#050811',
                        color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
                        lineHeight: 1.6, overflowX: 'auto', maxHeight: '72vh',
                    }}>
                        {JSON.stringify(spec, null, 2)}
                    </pre>
                </div>
            ) : (
                <div className="glass-card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700 }}>🌐 Control Plane REST Endpoints ({entries.length})</h3>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
                            Base URL: http://localhost:3001
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {entries.map(([path, methods]: [string, any]) => {
                            const method = Object.keys(methods)[0]?.toUpperCase() || 'GET';
                            const details = methods[method.toLowerCase()] || {};
                            const isPost = method === 'POST';
                            return (
                                <div
                                    key={path}
                                    style={{
                                        padding: '12px 16px', borderRadius: 10,
                                        background: 'rgba(15, 23, 42, 0.55)',
                                        border: `1px solid ${isPost ? 'rgba(56,189,248,0.25)' : 'rgba(52,211,153,0.25)'}`,
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                        <span style={{
                                            fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 6,
                                            minWidth: 56, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace',
                                            background: isPost ? 'rgba(56,189,248,0.18)' : 'rgba(52,211,153,0.18)',
                                            color: isPost ? '#38bdf8' : '#34d399',
                                        }}>
                                            {method}
                                        </span>
                                        <code style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace' }}>
                                            {path}
                                        </code>
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                        {details.summary}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

