'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)',
            padding: 20,
        }}>
            {/* Background grid */}
            <div style={{
                position: 'fixed',
                inset: 0,
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.08) 1px, transparent 0)',
                backgroundSize: '40px 40px',
                pointerEvents: 'none',
            }} />

            <div className="glass-card page-enter" style={{
                width: '100%',
                maxWidth: 440,
                padding: 40,
                position: 'relative',
                zIndex: 1,
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 60,
                        height: 60,
                        borderRadius: 16,
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        fontSize: 28,
                        fontWeight: 800,
                        color: 'white',
                        boxShadow: '0 0 30px rgba(99, 102, 241, 0.3)',
                    }}>
                        M
                    </div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
                        <span className="gradient-text">Mission Control</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                        Autonomous DevOps Platform
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                Name
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    )}

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
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

                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                            Password
                        </label>
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
                            background: 'rgba(248, 113, 113, 0.1)',
                            border: '1px solid rgba(248, 113, 113, 0.3)',
                            borderRadius: 10,
                            color: '#f87171',
                            fontSize: 13,
                            marginBottom: 16,
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ width: '100%', padding: 14, fontSize: 15 }}
                    >
                        {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
                    </button>
                </form>

                <div style={{
                    textAlign: 'center',
                    marginTop: 20,
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                }}>
                    {isRegister ? 'Already have an account?' : "Don't have an account?"}
                    <button
                        onClick={() => { setIsRegister(!isRegister); setError(''); }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent-light)',
                            cursor: 'pointer',
                            marginLeft: 4,
                            fontWeight: 600,
                            fontSize: 13,
                        }}
                    >
                        {isRegister ? 'Sign In' : 'Register'}
                    </button>
                </div>

                {/* Plan badges */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: 24,
                    paddingTop: 20,
                    borderTop: '1px solid var(--border-color)',
                }}>
                    {['Free', 'Pro', 'Enterprise'].map((plan) => (
                        <span key={plan} style={{
                            fontSize: 11,
                            padding: '4px 10px',
                            borderRadius: 6,
                            background: plan === 'Pro'
                                ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(79,70,229,0.2))'
                                : 'rgba(30,41,59,0.5)',
                            border: plan === 'Pro'
                                ? '1px solid rgba(99,102,241,0.3)'
                                : '1px solid var(--border-color)',
                            color: plan === 'Pro' ? 'var(--accent-light)' : 'var(--text-secondary)',
                            fontWeight: 500,
                        }}>
                            {plan}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
