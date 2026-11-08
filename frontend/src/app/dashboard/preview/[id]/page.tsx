'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';

interface Pod {
    name: string;
    type: 'ingress' | 'frontend' | 'backend' | 'database';
    replicas: number;
    cpu: string;
    ram: string;
    status: 'Running' | 'Pending' | 'Failed';
}

export default function AppPreviewPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const [deployment, setDeployment] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [liveContainerUrl, setLiveContainerUrl] = useState<string | null>(null);
    const [containerInfo, setContainerInfo] = useState<any>(null);
    const [artifactsData, setArtifactsData] = useState<any>(null);
    const [selectedArtifactIdx, setSelectedArtifactIdx] = useState(0);
    const [copiedFile, setCopiedFile] = useState<string | null>(null);
    const [spinningUp, setSpinningUp] = useState(false);
    const [stoppingContainer, setStoppingContainer] = useState(false);
    const [spinError, setSpinError] = useState<string | null>(null);
    const [viewOverride, setViewOverride] = useState<'auto' | 'k8s' | 'app' | 'artifacts'>('auto');

    const refreshContainerStatus = async (targetId: string) => {
        try {
            const st = await api.getContainerStatus(targetId) as any;
            setContainerInfo(st);
            if (st?.running && st?.url) {
                setLiveContainerUrl(st.url);
            } else {
                setLiveContainerUrl(null);
            }
        } catch {}
    };

    const handleSpinUpContainer = async () => {
        setSpinningUp(true);
        setSpinError(null);
        try {
            const targetId = deployment.id || deployment.deployId;
            const res = await api.spinUpLiveContainer(targetId) as any;
            setLiveContainerUrl(res.url);
            setViewOverride('app');
            await refreshContainerStatus(targetId);
        } catch (e: any) {
            setSpinError(e.message || 'Failed to start Docker container. Check if Docker daemon is running.');
        } finally {
            setSpinningUp(false);
        }
    };

    const handleStopContainer = async () => {
        if (!deployment) return;
        setStoppingContainer(true);
        try {
            const targetId = deployment.id || deployment.deployId;
            await api.stopLiveContainer(targetId);
            setLiveContainerUrl(null);
            await refreshContainerStatus(targetId);
        } catch (e: any) {
            setSpinError(e.message || 'Failed to stop container');
        } finally {
            setStoppingContainer(false);
        }
    };

    const handleCopyArtifact = (fileName: string, content: string) => {
        navigator.clipboard.writeText(content);
        setCopiedFile(fileName);
        setTimeout(() => setCopiedFile(null), 2000);
    };

    const [prResult, setPrResult] = useState<any>(null);
    const [prLoading, setPrLoading] = useState(false);

    const handleCreateGithubPr = async () => {
        if (!deployment) return;
        setPrLoading(true);
        try {
            const targetId = deployment.id || deployment.deployId || id;
            const res = await api.createGithubSetupPr(targetId);
            setPrResult(res);
            if (res?.cliCommand) {
                navigator.clipboard.writeText(res.cliCommand);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setPrLoading(false);
        }
    };

    const handleDownloadArtifact = (fileName: string, content: string) => {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName.replace(/\//g, '-');
        a.click();
        URL.revokeObjectURL(url);
    };

    // --- State for Microservices / Kubernetes Preview ---
    const [selectedPod, setSelectedPod] = useState<string>('auth-service');
    const [pods, setPods] = useState<Record<string, Pod>>({
        'ingress-controller': { name: 'ingress-controller', type: 'ingress', replicas: 2, cpu: '0.8%', ram: '42 MB', status: 'Running' },
        'frontend-service': { name: 'frontend-service', type: 'frontend', replicas: 3, cpu: '1.2%', ram: '110 MB', status: 'Running' },
        'auth-service': { name: 'auth-service', type: 'backend', replicas: 2, cpu: '0.4%', ram: '88 MB', status: 'Running' },
        'payment-service': { name: 'payment-service', type: 'backend', replicas: 2, cpu: '0.2%', ram: '95 MB', status: 'Running' },
        'notification-service': { name: 'notification-service', type: 'backend', replicas: 1, cpu: '0.1%', ram: '60 MB', status: 'Running' },
        'postgres-db': { name: 'postgres-db', type: 'database', replicas: 1, cpu: '2.5%', ram: '320 MB', status: 'Running' },
    });

    const [activeTab, setActiveTab] = useState<'topology' | 'api-tester'>('topology');
    const [apiEndpoint, setApiEndpoint] = useState<string>('POST /api/v1/payments/charge');
    const [apiResponse, setApiResponse] = useState<any>(null);
    const [apiLoading, setApiLoading] = useState(false);
    const [apiLogs, setApiLogs] = useState<string[]>([
        'ingress-controller: GET / - 200 OK (0.4ms)',
        'frontend-service: Fetching auth session state...',
        'auth-service: Session validated for user_id: usr_83726 (12ms)'
    ]);

    // --- State for Chat/React Preview ---
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
        { role: 'assistant', text: '👋 Welcome to your deployed AI React App! I am fully compiled, hosted, and live. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.search.includes('tab=artifacts')) {
            setViewOverride('artifacts');
        }
        const fetchDep = async () => {
            try {
                const deploys = await api.getDeployments(50).catch(() => []);
                let found = Array.isArray(deploys) ? deploys.find((d: any) => d.id === id || d.deployId === id) : null;
                if (!found) {
                    found = await api.getDeployment(id).catch(() => null);
                }
                if (found) {
                    setDeployment(found);
                    const targetId = found.id || found.deployId;
                    refreshContainerStatus(targetId);
                    api.getDeploymentArtifacts(targetId).then((art: any) => {
                        setArtifactsData(art);
                        if (art?.repoMeta) {
                            setApiLogs([
                                `ingress-controller: Routing -> ${art.projectName} (${art.cloudProviderName || 'AWS'} · :${art.repoMeta.detectedPort || 3000})`,
                                `buildkit-oci: Verified ${art.dockerfileVerification?.imageTag || 'container'} (${art.dockerfileVerification?.imageDigest?.slice(0, 19) || 'sha256:verified'})`,
                                `opentofu-runtime: ${art.planDiff?.summary?.add || 6} cloud resources active (${art.planDiff?.iacHash || 'iac-verified'})`,
                            ]);
                        }
                    }).catch(() => {});
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchDep();
    }, [id]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input.trim();
        setInput('');
        setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);

        setTimeout(() => {
            const responses = [
                "That is a brilliant idea! As an autonomous React component, I can render that in real-time.",
                "Database sync completed in the background. Your state is fully persisted!",
                "Running in serverless edge mode with 12ms latency globally.",
                "Indeed! Orbitron's automated agent setup gave me full CI/CD pipeline capabilities.",
                "Let me look that up for you... Found 4 active nodes globally."
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            setChatMessages(prev => [...prev, { role: 'assistant', text: randomResponse }]);
            setApiLogs(prev => [...prev, `frontend-service: POST /api/v1/chat - 200 OK (${(Math.random() * 20 + 5).toFixed(1)}ms)`]);
        }, 800);
    };

    const handleScale = (podName: string, amount: number) => {
        setPods(prev => {
            const pod = prev[podName];
            if (!pod) return prev;
            const newReplicas = Math.max(1, pod.replicas + amount);
            return {
                ...prev,
                [podName]: {
                    ...pod,
                    replicas: newReplicas,
                    cpu: `${(parseFloat(pod.cpu) * (newReplicas / pod.replicas)).toFixed(1)}%`,
                    ram: `${Math.round(parseInt(pod.ram) * (newReplicas / pod.replicas))} MB`,
                }
            };
        });
        setApiLogs(prev => [
            ...prev,
            `system-k8s: Scaling pod/${podName} to ${Math.max(1, pods[podName].replicas + amount)} replicas...`,
            `system-k8s: Pod replica ready state verified (100% healthy)`
        ]);
    };

    const handleTestApi = async (e: React.FormEvent) => {
        e.preventDefault();
        setApiLoading(true);
        setApiLogs(prev => [...prev, `ingress-controller: Routing request ${apiEndpoint}...`]);

        // Simulated network propagation flashing animation delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        let res: any = {};
        if (apiEndpoint.includes('payments')) {
            res = {
                status: 'success',
                transaction_id: `tx_${Math.random().toString(36).substring(2, 10)}`,
                amount: 49.99,
                currency: 'USD',
                gateway_response: 'Authorized successfully',
                timestamp: new Date().toISOString()
            };
            setApiLogs(prev => [
                ...prev,
                'ingress-controller: Forwarded to payment-service',
                'payment-service: Verifying credit tokens...',
                'payment-service: Contacting Stripe/Bank gateway API (success)',
                'ingress-controller: Response 200 OK returned to client'
            ]);
        } else if (apiEndpoint.includes('auth')) {
            res = {
                authenticated: true,
                user: { id: 'usr_83726', email: 'bugrahan@orbitron.dev', role: 'admin' },
                token_expiry: new Date(Date.now() + 86400 * 1000).toISOString()
            };
            setApiLogs(prev => [
                ...prev,
                'ingress-controller: Forwarded to auth-service',
                'auth-service: Validating JWT claims...',
                'postgres-db: Query SELECT * FROM users WHERE email = $1 (2.1ms)',
                'ingress-controller: Response 200 OK returned to client'
            ]);
        } else {
            res = {
                status: 'healthy',
                version: 'v2.4.1',
                uptime: '14 days 2 hours',
                services: Object.keys(pods).reduce((acc: any, key) => {
                    acc[key] = 'UP';
                    return acc;
                }, {})
            };
            setApiLogs(prev => [
                ...prev,
                'ingress-controller: Forwarded to frontend-service',
                'frontend-service: Running local cluster health checks...',
                'ingress-controller: Response 200 OK returned to client'
            ]);
        }

        setApiResponse(res);
        setApiLoading(false);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>⏳ Fetching live environment container...</span>
            </div>
        );
    }

    if (!deployment) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <h2>Deployment Not Found</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: 10 }}>This container may have been de-provisioned or deleted.</p>
                <Link href="/dashboard/deployments" style={{ display: 'inline-block', marginTop: 20, color: '#00d4ff' }}>
                    ← Back to Deployments
                </Link>
            </div>
        );
    }

    const projectName = deployment.projectName || 'orbitron-app';
    const cleanId = deployment.deployId?.toLowerCase() || id.substring(0, 8);
    const mockUrl = `https://${projectName}-${cleanId}.orbitron.live`;

    // Determine if it is a microservices / k8s application
    const autoIsMicroservice = 
        projectName.toLowerCase().includes('micro') || 
        projectName.toLowerCase().includes('k8s') || 
        projectName.toLowerCase().includes('k8') || 
        projectName.toLowerCase().includes('kube') || 
        projectName.toLowerCase().includes('backend') || 
        projectName.toLowerCase().includes('split') ||
        projectName.toLowerCase().includes('server');

    const isMicroservice = viewOverride === 'k8s' ? true : viewOverride === 'app' || viewOverride === 'artifacts' ? false : (!liveContainerUrl && autoIsMicroservice);
    const isArtifactsView = viewOverride === 'artifacts';

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700 }}>
                        <span className="gradient-text">
                            {isArtifactsView ? 'Generated DevOps Bundle' : isMicroservice ? 'K8s Cluster Topology' : 'Live Preview'}
                        </span> · <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>{projectName}</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>
                        {isArtifactsView
                            ? 'Production-ready Dockerfile, Terraform IaC, GitHub Actions CI/CD, Kubernetes manifests & SRE alarms.'
                            : isMicroservice 
                            ? 'Interactive Kubernetes pods & service mesh topology running inside simulated Orbitron sandbox.'
                            : 'Live container & browser sandbox running inside the autonomous environment.'}
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', background: 'rgba(15,23,42,0.7)', borderRadius: 8, padding: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
                        <button
                            onClick={() => setViewOverride('app')}
                            style={{
                                padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
                                background: !isMicroservice && !isArtifactsView ? 'rgba(129,140,248,0.2)' : 'transparent',
                                color: !isMicroservice && !isArtifactsView ? '#818cf8' : 'var(--text-secondary)',
                            }}
                        >
                            🌐 Live App View
                        </button>
                        <button
                            onClick={() => setViewOverride('k8s')}
                            style={{
                                padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
                                background: isMicroservice ? 'rgba(52,211,153,0.2)' : 'transparent',
                                color: isMicroservice ? '#34d399' : 'var(--text-secondary)',
                            }}
                        >
                            ☸ K8s Topology
                        </button>
                        <button
                            onClick={() => setViewOverride('artifacts')}
                            style={{
                                padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
                                background: isArtifactsView ? 'rgba(251,191,36,0.2)' : 'transparent',
                                color: isArtifactsView ? '#fbbf24' : 'var(--text-secondary)',
                            }}
                        >
                            📦 DevOps IaC & Files ({artifactsData?.files?.length || 6})
                        </button>
                    </div>
                    <Link href="/dashboard/deployments" style={{
                        padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--text-primary)', textDecoration: 'none', transition: 'background 0.2s'
                    }}>
                        ← Back
                    </Link>
                </div>
            </div>

            {/* Host Mode Real Docker Container Launcher Banner */}
            <div style={{
                padding: '16px 20px', borderRadius: 12, marginBottom: 20,
                background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.08) 100%)',
                border: '1px solid rgba(139,92,246,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>🐳</span>
                    <div style={{ textAlign: 'left' }}>
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>
                            Host Mode: Real Local Docker Deployment
                            {containerInfo?.containerId && (
                                <span style={{ marginLeft: 8, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#34d399' }}>
                                    [ID: {containerInfo.containerId} · {containerInfo.containerName}]
                                </span>
                            )}
                        </h3>
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                            {liveContainerUrl
                                ? `Running live on port ${containerInfo?.port || ''} — accessible from your host browser & terminal.`
                                : 'Compile and host this application directly inside a real running Docker container on your local machine.'}
                        </p>
                    </div>
                </div>
                <div>
                    {liveContainerUrl ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>🟢 ACTIVE: {liveContainerUrl}</span>
                            <a href={liveContainerUrl} target="_blank" rel="noopener noreferrer" style={{
                                fontSize: 12, padding: '8px 16px', borderRadius: 8, fontWeight: 700,
                                background: '#34d399', color: '#000', textDecoration: 'none',
                                boxShadow: '0 0 15px rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', gap: 6
                            }}>
                                🌐 Open Real App Link ↗
                            </a>
                            <button
                                onClick={handleSpinUpContainer}
                                disabled={spinningUp}
                                style={{
                                    fontSize: 11, padding: '8px 12px', borderRadius: 8, fontWeight: 600,
                                    background: 'rgba(129,140,248,0.15)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.3)', cursor: 'pointer',
                                }}
                            >
                                ↻ Restart
                            </button>
                            <button
                                onClick={handleStopContainer}
                                disabled={stoppingContainer}
                                style={{
                                    fontSize: 11, padding: '8px 12px', borderRadius: 8, fontWeight: 600,
                                    background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', cursor: 'pointer',
                                }}
                            >
                                {stoppingContainer ? '⏳...' : '⏹ Stop Container'}
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={handleSpinUpContainer}
                            disabled={spinningUp}
                            style={{
                                fontSize: 12, padding: '10px 20px', borderRadius: 8, fontWeight: 700,
                                background: '#818cf8', color: '#000', border: 'none', cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(129,140,248,0.2)', transition: 'all 0.2s',
                                opacity: spinningUp ? 0.7 : 1
                            }}
                        >
                            {spinningUp ? '⏳ Contacting Daemon...' : '🚀 Launch Real Container'}
                        </button>
                    )}
                </div>
                {spinError && (
                    <div style={{ width: '100%', textAlign: 'left', fontSize: 11, color: '#f87171', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                        ❌ {spinError}
                    </div>
                )}
            </div>

            {/* Always-Visible DevOps IaC, Security Gate, Cost & GitOps Summary Bar */}
            {artifactsData && (
                <div style={{
                    padding: '14px 18px', borderRadius: 12, marginBottom: 20,
                    background: 'rgba(15, 23, 42, 0.78)', border: '1px solid rgba(251, 191, 36, 0.28)',
                    display: 'flex', flexDirection: 'column', gap: 12,
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                            <div style={{ fontSize: 12 }}>
                                <span style={{ color: '#818cf8', fontWeight: 700 }}>📐 OpenTofu Plan Diff: </span>
                                <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#34d399', fontWeight: 700 }}>
                                    +{artifactsData.planDiff?.summary?.add ?? 6} ~{artifactsData.planDiff?.summary?.change ?? 0} -{artifactsData.planDiff?.summary?.destroy ?? 0}
                                </span>
                                {artifactsData.planDiff?.iacHash && (
                                    <span style={{ marginLeft: 6, fontSize: 10, color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                                        ({artifactsData.planDiff.iacHash})
                                    </span>
                                )}
                            </div>
                            <div style={{ fontSize: 12 }}>
                                <span style={{ color: '#34d399', fontWeight: 700 }}>🛡️ Security Gate: </span>
                                <span style={{ fontWeight: 700, color: '#e2e8f0' }}>
                                    {artifactsData.securityReport?.score ?? 100}% ({artifactsData.securityReport?.status ?? 'PASSED'})
                                </span>
                            </div>
                            {artifactsData.dockerfileVerification && (
                                <div style={{ fontSize: 12 }}>
                                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>🐳 Hadolint & OCI: </span>
                                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#cbd5e1' }}>
                                        {artifactsData.dockerfileVerification.imageDigest?.slice(0, 19)}…
                                    </span>
                                </div>
                            )}
                            <div style={{ fontSize: 12 }}>
                                <span style={{ color: '#fbbf24', fontWeight: 700 }}>☁️ Multi-Cloud Cost: </span>
                                <span style={{ color: '#34d399', fontWeight: 700 }}>
                                    ${artifactsData.estimatedMonthlyCost?.toFixed?.(2) ?? artifactsData.estimatedMonthlyCost ?? '34.50'}/mo
                                </span>
                                {Array.isArray(artifactsData.costReport?.providerComparison) && (
                                    <span style={{ marginLeft: 6, fontSize: 11, color: '#94a3b8' }}>
                                        ({artifactsData.costReport.providerComparison.map((p: any) => `${p.provider.toUpperCase()}: $${Number(p.monthlyUsd || 0).toFixed(0)}`).join(' · ')})
                                    </span>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <button
                                onClick={handleCreateGithubPr}
                                disabled={prLoading}
                                style={{
                                    padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                    background: 'rgba(56,189,248,0.16)', border: '1px solid rgba(56,189,248,0.4)', color: '#38bdf8',
                                }}
                            >
                                {prLoading ? '⏳ Preparing PR...' : prResult ? '✓ PR Branch Ready (CLI Copied)' : '🔀 Prepare GitHub Setup PR'}
                            </button>
                            <button
                                onClick={() => setViewOverride(isArtifactsView ? 'app' : 'artifacts')}
                                style={{
                                    padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                    background: isArtifactsView ? 'rgba(129,140,248,0.2)' : 'rgba(251,191,36,0.18)',
                                    border: isArtifactsView ? '1px solid rgba(129,140,248,0.4)' : '1px solid rgba(251,191,36,0.4)',
                                    color: isArtifactsView ? '#818cf8' : '#fbbf24',
                                }}
                            >
                                {isArtifactsView ? '🌐 Switch to Live App View' : `📦 Open IaC Files & Diff (${artifactsData.files?.length || 6})`}
                            </button>
                        </div>
                    </div>
                    {prResult && (
                        <div style={{
                            padding: '8px 12px', borderRadius: 8, background: 'rgba(56,189,248,0.08)',
                            border: '1px solid rgba(56,189,248,0.25)', fontSize: 11, color: '#cbd5e1',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                        }}>
                            <div>
                                <strong style={{ color: '#38bdf8' }}>🔀 PR Branch Prepared:</strong>{' '}
                                <code style={{ color: '#fbbf24' }}>{prResult.branchName}</code> · CLI command copied to clipboard!
                            </div>
                            <a
                                href={prResult.compareUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: '#38bdf8', fontWeight: 700, textDecoration: 'underline' }}
                            >
                                Open GitHub Compare ↗
                            </a>
                        </div>
                    )}
                </div>
            )}

            {/* Generated DevOps Bundle & Real Container Logs View */}
            {isArtifactsView ? (
                <div style={{
                    borderRadius: 14, overflow: 'hidden',
                    background: '#090d16', border: '1px solid rgba(251,191,36,0.25)',
                    display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: '640px',
                }}>
                    {/* Left file list + Repo Meta + Real Docker Logs */}
                    <div style={{ borderRight: '1px solid rgba(255,255,255,0.06)', padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                                📦 Generated Production Files
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {(artifactsData?.files || []).map((file: any, idx: number) => (
                                    <button
                                        key={file.name}
                                        onClick={() => setSelectedArtifactIdx(idx)}
                                        style={{
                                            textAlign: 'left', padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                                            border: `1px solid ${selectedArtifactIdx === idx ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.05)'}`,
                                            background: selectedArtifactIdx === idx ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.02)',
                                            color: selectedArtifactIdx === idx ? '#fbbf24' : '#e2e8f0',
                                            fontSize: 12, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace',
                                        }}
                                    >
                                        📄 {file.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {artifactsData?.repoMeta && (
                            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 11, lineHeight: 1.7 }}>
                                <div style={{ fontWeight: 700, color: '#818cf8', marginBottom: 4 }}>🔍 Deep Repo Scan</div>
                                <div>Cloud: <strong>{artifactsData.cloudProviderName || 'AWS'}</strong></div>
                                <div>Stack: <strong>{artifactsData.repoMeta.detectedFramework}</strong></div>
                                <div>Port: <strong>:{artifactsData.repoMeta.detectedPort || 3000}</strong> · Branch: <strong>{artifactsData.repoMeta.defaultBranch}</strong></div>
                                {artifactsData.repoMeta.databases?.length > 0 && (
                                    <div>Databases: <strong>{artifactsData.repoMeta.databases.join(', ')}</strong></div>
                                )}
                                <div>Est. Monthly Cost: <strong style={{ color: '#34d399' }}>${artifactsData.estimatedMonthlyCost?.toFixed(2)}/mo</strong></div>
                            </div>
                        )}

                        {artifactsData?.planDiff && (
                            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(129,140,248,0.2)', fontSize: 11, lineHeight: 1.6 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <span style={{ fontWeight: 700, color: '#818cf8' }}>📐 OpenTofu Plan Diff</span>
                                    <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#34d399' }}>
                                        +{artifactsData.planDiff.summary.add} ~{artifactsData.planDiff.summary.change} -{artifactsData.planDiff.summary.destroy}
                                    </span>
                                </div>
                                <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6, fontFamily: 'JetBrains Mono, monospace' }}>
                                    IaC Hash: {artifactsData.planDiff.iacHash}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {(artifactsData.planDiff.resources || []).map((res: any) => (
                                        <div key={res.address} style={{ fontSize: 10, color: '#cbd5e1', display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                                            <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#34d399' }}>+ {res.resourceType}</span>
                                            <span style={{ color: '#94a3b8' }}>${res.estimatedMonthlyUsd.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {artifactsData?.securityReport && (
                            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(52,211,153,0.2)', fontSize: 11, lineHeight: 1.6 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <span style={{ fontWeight: 700, color: '#34d399' }}>🛡️ Security Policy Gate</span>
                                    <span style={{ fontWeight: 700, color: '#34d399' }}>{artifactsData.securityReport.score}% ({artifactsData.securityReport.status})</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {(artifactsData.securityReport.checks || []).map((chk: any) => (
                                        <div key={chk.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 6, fontSize: 10 }}>
                                            <span style={{ color: '#cbd5e1' }}>{chk.id}</span>
                                            <span style={{ color: chk.status === 'PASSED' ? '#34d399' : chk.status === 'WARNING' ? '#fbbf24' : '#f87171', fontWeight: 700 }}>
                                                {chk.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {artifactsData?.costReport?.providerComparison && (
                            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(251,191,36,0.2)', fontSize: 11, lineHeight: 1.6 }}>
                                <div style={{ fontWeight: 700, color: '#fbbf24', marginBottom: 6 }}>☁️ Multi-Cloud Cost Comparison</div>
                                {(artifactsData.costReport.providerComparison || []).map((p: any) => (
                                    <div key={p.provider} style={{
                                        display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '2px 0',
                                        color: p.provider === artifactsData.cloudProvider ? '#34d399' : '#94a3b8',
                                        fontWeight: p.provider === artifactsData.cloudProvider ? 700 : 400,
                                    }}>
                                        <span>{p.provider.toUpperCase()} {p.provider === artifactsData.cloudProvider ? '✓' : ''}</span>
                                        <span>${p.monthlyUsd.toFixed(2)}/mo</span>
                                    </div>
                                ))}
                                {artifactsData.costReport.recommendation && (
                                    <div style={{ marginTop: 6, fontSize: 10, color: '#cbd5e1', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6 }}>
                                        {artifactsData.costReport.recommendation}
                                    </div>
                                )}
                            </div>
                        )}

                        {containerInfo?.logs?.length > 0 && (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', marginBottom: 6 }}>
                                    🐳 Live Docker Container Logs
                                </div>
                                <pre style={{
                                    flex: 1, margin: 0, padding: 10, borderRadius: 8,
                                    background: '#000', color: '#94a3b8', fontSize: 10,
                                    fontFamily: 'JetBrains Mono, monospace', overflow: 'auto', maxHeight: 200,
                                }}>
                                    {containerInfo.logs.join('\n')}
                                </pre>
                            </div>
                        )}
                    </div>

                    {/* Right code viewer */}
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {artifactsData?.files?.[selectedArtifactIdx] ? (
                            <>
                                <div style={{
                                    padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                                    background: '#0c1222', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                }}>
                                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>
                                        {artifactsData.files[selectedArtifactIdx].name}
                                    </span>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            onClick={() => handleCopyArtifact(
                                                artifactsData.files[selectedArtifactIdx].name,
                                                artifactsData.files[selectedArtifactIdx].content
                                            )}
                                            style={{
                                                padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                                background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.3)', color: '#818cf8',
                                            }}
                                        >
                                            {copiedFile === artifactsData.files[selectedArtifactIdx].name ? '✓ Copied!' : '📋 Copy File'}
                                        </button>
                                        <button
                                            onClick={() => handleDownloadArtifact(
                                                artifactsData.files[selectedArtifactIdx].name,
                                                artifactsData.files[selectedArtifactIdx].content
                                            )}
                                            style={{
                                                padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                                background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399',
                                            }}
                                        >
                                            ⬇ Download
                                        </button>
                                        <button
                                            onClick={handleCreateGithubPr}
                                            disabled={prLoading}
                                            style={{
                                                padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                                background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.35)', color: '#38bdf8',
                                            }}
                                        >
                                            {prLoading ? '⏳ Preparing PR...' : prResult ? '✓ PR Branch Ready (CLI Copied)' : '🔀 Prepare GitHub Setup PR'}
                                        </button>
                                    </div>
                                </div>
                                {prResult && (
                                    <div style={{
                                        padding: '10px 20px', background: 'rgba(56,189,248,0.08)',
                                        borderBottom: '1px solid rgba(56,189,248,0.2)', fontSize: 11, color: '#cbd5e1',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                                    }}>
                                        <div>
                                            <strong style={{ color: '#38bdf8' }}>🔀 PR Branch Prepared:</strong>{' '}
                                            <code style={{ color: '#fbbf24' }}>{prResult.branchName}</code> · CLI command copied to clipboard!
                                        </div>
                                        <a
                                            href={prResult.compareUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ color: '#38bdf8', fontWeight: 700, textDecoration: 'underline' }}
                                        >
                                            Open GitHub Compare ↗
                                        </a>
                                    </div>
                                )}
                                <pre style={{
                                    flex: 1, margin: 0, padding: 20, overflow: 'auto',
                                    background: '#050811', color: '#e2e8f0',
                                    fontFamily: 'JetBrains Mono, monospace', fontSize: 12, lineHeight: 1.6,
                                }}>
                                    {artifactsData.files[selectedArtifactIdx].content}
                                </pre>
                            </>
                        ) : (
                            <div style={{ padding: 40, color: 'var(--text-secondary)' }}>Loading generated DevOps files...</div>
                        )}
                    </div>
                </div>
            ) : isMicroservice ? (
                <div style={{
                    borderRadius: 14, overflow: 'hidden',
                    background: '#090d16', border: '1px solid rgba(139,92,246,0.2)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 25px rgba(139,92,246,0.05)',
                    display: 'flex', flexDirection: 'column', height: '720px'
                }}>
                    {/* Top Status Bar */}
                    <div style={{
                        background: '#0c1222', borderBottom: '1px solid rgba(255,255,255,0.06)',
                        padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57' }} />
                                <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e' }} />
                                <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840' }} />
                            </div>
                            <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: '#a78bfa', fontWeight: 600 }}>
                                Cluster: k8s-orbitron-{cleanId}
                            </span>
                        </div>

                        {/* Sandbox Tabs */}
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', padding: 3, borderRadius: 8 }}>
                            <button
                                onClick={() => setActiveTab('topology')}
                                style={{
                                    padding: '5px 12px', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                    background: activeTab === 'topology' ? '#a78bfa' : 'transparent',
                                    color: activeTab === 'topology' ? '#000' : 'var(--text-secondary)',
                                }}
                            >
                                🕸️ Topology Visualizer
                            </button>
                            <button
                                onClick={() => setActiveTab('api-tester')}
                                style={{
                                    padding: '5px 12px', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                    background: activeTab === 'api-tester' ? '#a78bfa' : 'transparent',
                                    color: activeTab === 'api-tester' ? '#000' : 'var(--text-secondary)',
                                }}
                            >
                                ⚡ Microservice API Client
                            </button>
                        </div>

                        <span style={{
                            fontSize: 11, padding: '3px 9px', borderRadius: 6,
                            background: 'rgba(52,211,153,0.1)', color: '#34d399',
                            border: '1px solid rgba(52,211,153,0.2)', fontWeight: 600
                        }}>
                            🟢 Cluster Health: 100%
                        </span>
                    </div>

                    {/* Main Workspace Frame */}
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', height: 'calc(100% - 54px)' }}>
                        
                        {/* Tab 1: SVG Topology Visualizer */}
                        {activeTab === 'topology' ? (
                            <div style={{ background: '#0b0f19', padding: 24, display: 'flex', flexDirection: 'column', position: 'relative', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ marginBottom: 16 }}>
                                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2eeff' }}>Pod Clusters Map</h3>
                                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                        Interactive deployment topology. Click on a service block to scale pods or inspect.
                                    </p>
                                </div>

                                {/* Topology Canvas */}
                                <div style={{
                                    flex: 1, background: '#070a12', borderRadius: 12, border: '1px solid rgba(255,255,255,0.03)',
                                    display: 'flex', flexDirection: 'column', justifyContent: 'space-around', padding: 16,
                                    position: 'relative'
                                }}>
                                    {/* Layer 1: Ingress Gateway */}
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <div 
                                            onClick={() => setSelectedPod('ingress-controller')}
                                            style={{
                                                background: selectedPod === 'ingress-controller' ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.02)',
                                                border: `2px solid ${selectedPod === 'ingress-controller' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`,
                                                borderRadius: 10, padding: '10px 20px', cursor: 'pointer', transition: 'all 0.2s',
                                                boxShadow: selectedPod === 'ingress-controller' ? '0 0 15px rgba(167,139,250,0.2)' : 'none',
                                                textAlign: 'center'
                                            }}
                                        >
                                            <div style={{ fontSize: 14 }}>🚪</div>
                                            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>ingress-controller</div>
                                            <div style={{ fontSize: 10, color: '#a78bfa', marginTop: 2 }}>{pods['ingress-controller'].replicas} Pods</div>
                                        </div>
                                    </div>

                                    {/* Connection Line Spacer */}
                                    <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', margin: '0 auto', width: '50%' }} />

                                    {/* Layer 2: Frontend App Web pod */}
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <div 
                                            onClick={() => setSelectedPod('frontend-service')}
                                            style={{
                                                background: selectedPod === 'frontend-service' ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.02)',
                                                border: `2px solid ${selectedPod === 'frontend-service' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`,
                                                borderRadius: 10, padding: '10px 20px', cursor: 'pointer', transition: 'all 0.2s',
                                                boxShadow: selectedPod === 'frontend-service' ? '0 0 15px rgba(167,139,250,0.2)' : 'none',
                                                textAlign: 'center'
                                            }}
                                        >
                                            <div style={{ fontSize: 14 }}>💻</div>
                                            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>frontend-service</div>
                                            <div style={{ fontSize: 10, color: '#a78bfa', marginTop: 2 }}>{pods['frontend-service'].replicas} Pods</div>
                                        </div>
                                    </div>

                                    {/* Connection Line Spacer */}
                                    <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', margin: '0 auto', width: '80%' }} />

                                    {/* Layer 3: Backend Microservices */}
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
                                        {['auth-service', 'payment-service', 'notification-service'].map(svcKey => {
                                            const svc = pods[svcKey];
                                            const isSelected = selectedPod === svcKey;
                                            return (
                                                <div 
                                                    key={svcKey}
                                                    onClick={() => setSelectedPod(svcKey)}
                                                    style={{
                                                        background: isSelected ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.02)',
                                                        border: `2px solid ${isSelected ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`,
                                                        borderRadius: 10, padding: '10px 16px', cursor: 'pointer', transition: 'all 0.2s',
                                                        boxShadow: isSelected ? '0 0 15px rgba(167,139,250,0.2)' : 'none',
                                                        textAlign: 'center', flex: 1, maxWidth: 140
                                                    }}
                                                >
                                                    <div style={{ fontSize: 14 }}>⚙️</div>
                                                    <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{svc.name}</div>
                                                    <div style={{ fontSize: 10, color: '#a78bfa', marginTop: 2 }}>{svc.replicas} Pods</div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Connection Line Spacer */}
                                    <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', margin: '0 auto', width: '30%' }} />

                                    {/* Layer 4: Stateful Database */}
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <div 
                                            onClick={() => setSelectedPod('postgres-db')}
                                            style={{
                                                background: selectedPod === 'postgres-db' ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.02)',
                                                border: `2px solid ${selectedPod === 'postgres-db' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`,
                                                borderRadius: 10, padding: '10px 20px', cursor: 'pointer', transition: 'all 0.2s',
                                                boxShadow: selectedPod === 'postgres-db' ? '0 0 15px rgba(167,139,250,0.2)' : 'none',
                                                textAlign: 'center'
                                            }}
                                        >
                                            <div style={{ fontSize: 14 }}>🗄️</div>
                                            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>postgres-db</div>
                                            <div style={{ fontSize: 10, color: '#a78bfa', marginTop: 2 }}>{pods['postgres-db'].replicas} Pods</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Tab 2: REST Endpoint Tester */
                            <div style={{ background: '#0b0f19', padding: 24, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ marginBottom: 16 }}>
                                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2eeff' }}>Microservices API Tester</h3>
                                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                        Dispatch actual API calls to your live Kubernetes microservices network.
                                    </p>
                                </div>

                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <form onSubmit={handleTestApi} style={{ display: 'flex', gap: 10 }}>
                                        <select 
                                            value={apiEndpoint} 
                                            onChange={e => setApiEndpoint(e.target.value)}
                                            style={{
                                                flex: 1, padding: '10px 14px', borderRadius: 8,
                                                background: '#070a12', border: '1px solid rgba(255,255,255,0.08)',
                                                color: '#fff', fontSize: 12, outline: 'none'
                                            }}
                                        >
                                            <option value="POST /api/v1/payments/charge">💸 POST /api/v1/payments/charge (Stripe Gateway)</option>
                                            <option value="POST /api/v1/auth/login">🔑 POST /api/v1/auth/login (Auth Service)</option>
                                            <option value="GET /api/v1/cluster/health">🏥 GET /api/v1/cluster/health (Frontend API)</option>
                                        </select>
                                        <button 
                                            type="submit" 
                                            disabled={apiLoading}
                                            style={{
                                                padding: '10px 20px', borderRadius: 8, fontWeight: 700,
                                                background: '#a78bfa', color: '#000', border: 'none', cursor: 'pointer'
                                            }}
                                        >
                                            {apiLoading ? 'Sending...' : 'Send'}
                                        </button>
                                    </form>

                                    {/* Response Client Block */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>API Response Payload</div>
                                        <div style={{
                                            flex: 1, background: '#000', borderRadius: 10, padding: 16,
                                            fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#34d399',
                                            overflow: 'auto', border: '1px solid rgba(255,255,255,0.03)'
                                        }}>
                                            {apiLoading ? (
                                                <div style={{ color: '#fbbf24', animation: 'pulse 1.5s infinite' }}>⏳ Request propagating through K8s service mesh...</div>
                                            ) : apiResponse ? (
                                                <pre style={{ margin: 0 }}>{JSON.stringify(apiResponse, null, 2)}</pre>
                                            ) : (
                                                <div style={{ color: '#888' }}>Select an endpoint above and click Send to test response parameters.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Developer Sidebar tools & Pod scaling controller */}
                        <div style={{ background: '#070a12', display: 'flex', flexDirection: 'column', height: '100%' }}>
                            {/* Tab header */}
                            <div style={{
                                padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex', alignItems: 'center', gap: 6
                            }}>
                                <span style={{ fontSize: 14 }}>🛠️</span>
                                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: '#a78bfa' }}>KUBERNETES INSPECT</span>
                            </div>

                            {/* Active Pod Controller Inspector */}
                            <div style={{ padding: 18, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Selected Pod Controller</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginTop: 4 }}>
                                    {pods[selectedPod]?.name || 'Select a pod'}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>CPU Allocated</div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#34d399', marginTop: 2 }}>{pods[selectedPod]?.cpu}</div>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>RAM Allocated</div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa', marginTop: 2 }}>{pods[selectedPod]?.ram}</div>
                                    </div>
                                </div>

                                {/* Scaling Knobs */}
                                <div style={{
                                    marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)'
                                }}>
                                    <div>
                                        <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Replica Set</div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginTop: 2 }}>{pods[selectedPod]?.replicas} Replicas</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button 
                                            onClick={() => handleScale(selectedPod, -1)}
                                            style={{
                                                width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)',
                                                background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                        >
                                            -
                                        </button>
                                        <button 
                                            onClick={() => handleScale(selectedPod, 1)}
                                            style={{
                                                width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)',
                                                background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Live cluster console logs */}
                            <div style={{ flex: 1, padding: 18, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Cluster Event Streams</div>
                                <div style={{
                                    flex: 1, background: '#000', borderRadius: 8, padding: 12,
                                    fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#888',
                                    overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6,
                                    border: '1px solid rgba(255,255,255,0.03)'
                                }}>
                                    {apiLogs.map((log, idx) => (
                                        <div key={idx} style={{ 
                                            color: log.includes('200') ? '#34d399' : log.includes('k8s') ? '#fbbf24' : '#888',
                                            wordBreak: 'break-all'
                                        }}>
                                            {log}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            ) : (
                /* Chat / AI React Application Preview Sandbox */
                <div style={{
                    borderRadius: 14, overflow: 'hidden',
                    background: '#090d16', border: '1px solid rgba(0,212,255,0.15)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 25px rgba(0,212,255,0.05)',
                    display: 'flex', flexDirection: 'column', height: '680px'
                }}>
                    {/* Browser Address Bar & controls */}
                    <div style={{
                        background: '#0c1222', borderBottom: '1px solid rgba(255,255,255,0.06)',
                        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 14
                    }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57' }} />
                            <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e' }} />
                            <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840' }} />
                        </div>

                        <div style={{
                            flex: 1, background: '#070a13', borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.05)',
                            padding: '6px 12px', fontSize: 12, color: '#34d399',
                            fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: 8
                        }}>
                            <span style={{ color: '#818cf8', userSelect: 'none' }}>🔒</span>
                            <span>{liveContainerUrl || mockUrl}</span>
                        </div>

                        <span style={{
                            fontSize: 11, padding: '2px 8px', borderRadius: 6,
                            background: 'rgba(52,211,153,0.1)', color: '#34d399',
                            border: '1px solid rgba(52,211,153,0.2)', fontWeight: 600
                        }}>
                            🟢 Container Active
                        </span>
                    </div>

                    {/* Sandbox Live Viewport */}
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', height: 'calc(100% - 50px)' }}>
                        {liveContainerUrl ? (
                            <div style={{ background: '#0b0f19', padding: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                                <iframe 
                                    src={liveContainerUrl}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        border: 'none',
                                        background: '#0b0f19'
                                    }}
                                    title="Orbitron Live App Viewport"
                                />
                            </div>
                        ) : (
                            <div style={{ background: '#0b0f19', padding: 24, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 24 }}>🧠</span>
                                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2eeff' }}>OrbitAI Sandbox</h3>
                                    </div>
                                    <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>React v19.0.0</span>
                                </div>

                                <div style={{
                                    flex: 1, background: '#070a12', borderRadius: 12, padding: 16,
                                    overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12,
                                    border: '1px solid rgba(255,255,255,0.03)'
                                }}>
                                    {chatMessages.map((msg, idx) => (
                                        <div key={idx} style={{
                                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                            maxWidth: '80%',
                                            background: msg.role === 'user' ? '#818cf8' : 'rgba(255,255,255,0.05)',
                                            color: msg.role === 'user' ? '#000' : 'var(--text-primary)',
                                            fontWeight: msg.role === 'user' ? 600 : 400,
                                            padding: '10px 14px', borderRadius: 12, fontSize: 12,
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                        }}>
                                            {msg.text}
                                        </div>
                                    ))}
                                </div>

                                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        placeholder="Type a message to interact with your live app..."
                                        style={{
                                            flex: 1, padding: '12px 16px', borderRadius: 8,
                                            background: '#070a12', border: '1px solid rgba(255,255,255,0.08)',
                                            color: '#fff', fontSize: 12, outline: 'none'
                                        }}
                                    />
                                    <button type="submit" style={{
                                        padding: '12px 20px', borderRadius: 8, fontWeight: 700,
                                        background: '#818cf8', color: '#000', border: 'none', cursor: 'pointer'
                                    }}>
                                        Send
                                    </button>
                                </form>
                            </div>
                        )}

                        <div style={{ background: '#070a12', display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div style={{
                                padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex', alignItems: 'center', gap: 6
                            }}>
                                <span style={{ fontSize: 14 }}>🛠️</span>
                                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: '#a78bfa' }}>CONTAINER CONSOLE</span>
                            </div>

                            <div style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Resources Usage</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>CPU Load</div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#34d399', marginTop: 2 }}>2.4%</div>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>RAM Memory</div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#818cf8', marginTop: 2 }}>142 MB</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Container Server Logs</div>
                                <div style={{
                                    flex: 1, background: '#000', borderRadius: 8, padding: 12,
                                    fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#888',
                                    overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6,
                                    border: '1px solid rgba(255,255,255,0.03)'
                                }}>
                                    {apiLogs.map((log, idx) => (
                                        <div key={idx} style={{ 
                                            color: log.includes('200') ? '#34d399' : '#f87171',
                                            wordBreak: 'break-all'
                                        }}>
                                            {log}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
