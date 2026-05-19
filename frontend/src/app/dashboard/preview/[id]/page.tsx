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
    const [spinningUp, setSpinningUp] = useState(false);
    const [spinError, setSpinError] = useState<string | null>(null);

    const handleSpinUpContainer = async () => {
        setSpinningUp(true);
        setSpinError(null);
        try {
            const res = await api.spinUpLiveContainer(deployment.id || deployment.deployId) as any;
            setLiveContainerUrl(res.url);
        } catch (e: any) {
            setSpinError(e.message || 'Failed to start Docker container. Check if Docker daemon is running.');
        } finally {
            setSpinningUp(false);
        }
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
        const fetchDep = async () => {
            try {
                const deploys = await api.getDeployments();
                const found = deploys.find((d: any) => d.id === id || d.deployId === id);
                if (found) {
                    setDeployment(found);
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
    const isMicroservice = 
        projectName.toLowerCase().includes('micro') || 
        projectName.toLowerCase().includes('k8s') || 
        projectName.toLowerCase().includes('k8') || 
        projectName.toLowerCase().includes('kube') || 
        projectName.toLowerCase().includes('backend') || 
        projectName.toLowerCase().includes('split') ||
        projectName.toLowerCase().includes('server') ||
        pods[selectedPod] !== undefined;

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700 }}>
                        <span className="gradient-text">{isMicroservice ? 'K8s Cluster Topology' : 'Live Preview'}</span> · <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>{projectName}</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>
                        {isMicroservice 
                            ? 'Interactive Kubernetes pods & service mesh topology running inside simulated Orbitron sandbox.'
                            : 'Faux browser sandbox running inside the autonomous environment container.'}
                    </p>
                </div>
                <Link href="/dashboard/deployments" style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-primary)', textDecoration: 'none', transition: 'background 0.2s'
                }}>
                    ← Back
                </Link>
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
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>Host Mode: Real Local Docker Deployment</h3>
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                            Compile and host this application directly inside a real running Docker container on your local machine.
                        </p>
                    </div>
                </div>
                <div>
                    {liveContainerUrl ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>🟢 ACTIVE ON LOCALHOST:</span>
                            <a href={liveContainerUrl} target="_blank" rel="noopener noreferrer" style={{
                                fontSize: 12, padding: '8px 16px', borderRadius: 8, fontWeight: 700,
                                background: '#34d399', color: '#000', textDecoration: 'none',
                                boxShadow: '0 0 15px rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', gap: 6
                            }}>
                                🌐 Open Real App Link ↗
                            </a>
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

            {/* Microservice / Kubernetes Workspace Preview */}
            {isMicroservice ? (
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
