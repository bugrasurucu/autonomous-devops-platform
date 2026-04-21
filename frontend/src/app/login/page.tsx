'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isRegister) {
                await register(email, password, name || 'User');
            } else {
                await login(email, password);
            }
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex', minHeight: '100vh',
            background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)',
        }}>
            {/* LEFT — brand panel */}
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                justifyContent: 'center', padding: '60px 64px',
                borderRight: '1px solid rgba(99,102,241,0.12)',
                background: 'linear-gradient(160deg, rgba(99,102,241,0.04) 0%, transparent 60%)',
            }} className="login-panel-left">
                <Link href="/" style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 22, fontWeight: 800, color: '#fff',
                            boxShadow: '0 0 24px rgba(99,102,241,0.4)',
                        }}>⊙</div>
                        <span style={{
                            fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px',
                            background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>ORBITRON</span>
                    </div>
                </Link>

                <h1 style={{
                    fontSize: 'clamp(28px, 3vw, 42px)', fontWeight: 900,
                    color: '#f1f5f9', lineHeight: 1.1, letterSpacing: '-1px', marginBottom: 20,
                }}>
                    Your infrastructure,<br />
                    <span style={{
                        background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>in orbit.</span>
                </h1>
                <p style={{ color: '#64748b', fontSize: 16, lineHeight: 1.7, maxWidth: 380, marginBottom: 40 }}>
                    4 AI agents. Kubernetes-native. Fully autonomous DevOps — from infrastructure to self-healing.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {[
                        { icon: '🏗', label: 'Infrastructure Agent', desc: 'Terraform, CDK, Checkov' },
                        { icon: '🔄', label: 'Pipeline Agent', desc: 'GitHub Actions, visual QA' },
                        { icon: '💰', label: 'FinOps Agent', desc: 'Cost control with OPA' },
                        { icon: '🛡', label: 'SRE Agent', desc: 'SAAV self-healing cycle' },
                    ].map((item) => (
                        <div key={item.label} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 14px', borderRadius: 10,
                            background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(99,102,241,0.1)',
                        }}>
                            <span style={{ fontSize: 20 }}>{item.icon}</span>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{item.label}</div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>{item.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Grid decoration */}
                <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.06) 1px, transparent 0)',
                    backgroundSize: '36px 36px',
                }} />
            </div>

            {/* RIGHT — form panel */}
            <div style={{
                width: 460, display: 'flex', flexDirection: 'column',
                justifyContent: 'center', padding: '60px 48px',
                position: 'relative',
            }}>
                <div style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', marginBottom: 6 }}>
                        {isRegister ? 'Create account' : 'Welcome back'}
                    </h2>
                    <p style={{ color: '#64748b', fontSize: 14 }}>
                        {isRegister ? 'Start your free plan — no credit card required' : 'Sign in to your Orbitron workspace'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {isRegister && (
                        <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Full Name
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="John Smith"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            Email
                        </label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Password
                            </label>
                        </div>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="Min 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={3}
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '10px 14px',
                            background: 'rgba(248,113,113,0.08)',
                            border: '1px solid rgba(248,113,113,0.25)',
                            borderRadius: 10, color: '#f87171', fontSize: 13,
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ width: '100%', padding: 14, fontSize: 15, marginTop: 4 }}
                    >
                        {loading ? '⏳ Please wait...' : isRegister ? '🚀 Create Account' : 'Sign In →'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#475569' }}>
                    {isRegister ? 'Already have an account?' : "Don't have an account?"}
                    <button
                        onClick={() => { setIsRegister(!isRegister); setError(''); }}
                        style={{
                            background: 'none', border: 'none', color: '#818cf8',
                            cursor: 'pointer', marginLeft: 6, fontWeight: 700, fontSize: 13,
                        }}
                    >
                        {isRegister ? 'Sign In' : 'Register Free'}
                    </button>
                </div>

                {/* Trust indicators */}
                <div style={{
                    marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(99,102,241,0.1)',
                    display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap',
                }}>
                    {['☸ Kubernetes-native', '🔐 JWT Auth', '⚡ 99.9% uptime'].map((t) => (
                        <span key={t} style={{ fontSize: 11, color: '#475569', fontWeight: 500 }}>{t}</span>
                    ))}
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .login-panel-left { display: none !important; }
                }
            `}</style>
        </div>
    );
}
