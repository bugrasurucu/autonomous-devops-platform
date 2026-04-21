'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Navbar */}
            <nav style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                padding: '16px 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(10,10,25,0.85)',
                backdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(129,140,248,0.1)',
            }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg,#006a80,#00d4ff)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: 18, color: '#020c1b',
                        boxShadow: '0 0 16px rgba(0,212,255,0.3)',
                    }}>⊙</div>
                    <span style={{
                        fontSize: 18, fontWeight: 900, letterSpacing: '-0.5px',
                        background: 'linear-gradient(135deg,#00d4ff,#00ff88)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>ORBITRON</span>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="nav-desktop">
                    <a href="#agents" style={{ color: '#7a9cc0', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }}>Agents</a>
                    <a href="#k8s" style={{ color: '#7a9cc0', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Why K8s?</a>
                    <a href="#stack" style={{ color: '#7a9cc0', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Stack</a>
                    <a href="#pricing" style={{ color: '#7a9cc0', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Pricing</a>
                    {user ? (
                        <Link href="/dashboard" style={{
                            padding: '8px 20px', borderRadius: 8,
                            background: 'linear-gradient(135deg,#006a80,#00d4ff)',
                            color: '#020c1b', textDecoration: 'none', fontSize: 14, fontWeight: 700,
                        }}>Dashboard →</Link>
                    ) : (
                        <div style={{ display: 'flex', gap: 10 }}>
                            <Link href="/login" style={{ padding: '8px 16px', color: '#7a9cc0', textDecoration: 'none', fontSize: 14 }}>Sign In</Link>
                            <Link href="/login" style={{
                                padding: '8px 20px', borderRadius: 8,
                                background: 'linear-gradient(135deg,#006a80,#00d4ff)',
                                color: '#020c1b', textDecoration: 'none', fontSize: 14, fontWeight: 700,
                                boxShadow: '0 0 20px rgba(0,212,255,0.2)',
                            }}>Get Started Free</Link>
                        </div>
                    )}
                </div>

                {/* Mobile menu toggle */}
                <button onClick={() => setMenuOpen(!menuOpen)} className="nav-mobile"
                    style={{ background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', display: 'none' }}>
                    {menuOpen ? '✕' : '☰'}
                </button>
            </nav>

            {/* Mobile menu */}
            {menuOpen && (
                <div style={{
                    position: 'fixed', top: 68, left: 0, right: 0, bottom: 0, zIndex: 99,
                    background: 'rgba(2,12,27,0.98)', padding: 24,
                    display: 'flex', flexDirection: 'column', gap: 20,
                }}>
                    <a href="#agents" onClick={() => setMenuOpen(false)} style={{ color: '#e2eeff', fontSize: 18, textDecoration: 'none' }}>Agents</a>
                    <a href="#k8s" onClick={() => setMenuOpen(false)} style={{ color: '#e2eeff', fontSize: 18, textDecoration: 'none' }}>Why Kubernetes?</a>
                    <a href="#stack" onClick={() => setMenuOpen(false)} style={{ color: '#e2eeff', fontSize: 18, textDecoration: 'none' }}>Tech Stack</a>
                    <a href="#pricing" onClick={() => setMenuOpen(false)} style={{ color: '#e2eeff', fontSize: 18, textDecoration: 'none' }}>Pricing</a>
                    <Link href="/login" onClick={() => setMenuOpen(false)} style={{
                        marginTop: 16, padding: '12px 24px', borderRadius: 8, textAlign: 'center' as const,
                        background: 'linear-gradient(135deg,#006a80,#00d4ff)', color: '#020c1b',
                        textDecoration: 'none', fontSize: 16, fontWeight: 700,
                    }}>{user ? 'Dashboard →' : 'Get Started Free'}</Link>
                </div>
            )}

            {/* Content */}
            <main style={{ flex: 1 }}>{children}</main>

            {/* Footer */}
            <footer style={{
                padding: '48px 32px 24px',
                borderTop: '1px solid rgba(129,140,248,0.1)',
                background: 'rgba(10,10,25,0.5)',
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 40,
                        marginBottom: 40,
                    }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: '50%',
                                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 800, fontSize: 14, color: '#fff',
                                }}>⊙</div>
                                <span style={{ fontWeight: 800, color: '#818cf8', letterSpacing: '-0.3px' }}>ORBITRON</span>
                            </div>
                            <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.7, maxWidth: 240 }}>
                                Your infrastructure, in orbit.
                                AI-powered autonomous DevOps with Kubernetes-native agents.
                            </p>
                        </div>
                        <div>
                            <h4 style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 700, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Platform</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <a href="#agents" style={{ color: '#64748b', fontSize: 14, textDecoration: 'none' }}>AI Agents</a>
                                <a href="#k8s" style={{ color: '#64748b', fontSize: 14, textDecoration: 'none' }}>Why Kubernetes</a>
                                <a href="#pricing" style={{ color: '#64748b', fontSize: 14, textDecoration: 'none' }}>Pricing</a>
                                <a href="/login" style={{ color: '#64748b', fontSize: 14, textDecoration: 'none' }}>Dashboard</a>
                            </div>
                        </div>
                        <div>
                            <h4 style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 700, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Get Started</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <a href="/login" style={{ color: '#64748b', fontSize: 14, textDecoration: 'none' }}>Free Plan</a>
                                <a href="/login" style={{ color: '#64748b', fontSize: 14, textDecoration: 'none' }}>Pro Trial</a>
                                <a href="/login" style={{ color: '#64748b', fontSize: 14, textDecoration: 'none' }}>Enterprise</a>
                                <a href="/login" style={{ color: '#64748b', fontSize: 14, textDecoration: 'none' }}>Sign In</a>
                            </div>
                        </div>
                        <div>
                            <h4 style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 700, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tech Stack</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {['Kubernetes', 'kagent CRD', 'Terraform', 'GitHub Actions'].map((t) => (
                                    <span key={t} style={{ color: '#64748b', fontSize: 14 }}>{t}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div style={{
                        borderTop: '1px solid rgba(100,116,139,0.2)',
                        paddingTop: 20,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        flexWrap: 'wrap', gap: 12,
                    }}>
                        <span style={{ color: '#475569', fontSize: 13 }}>© 2026 Orbitron. All rights reserved.</span>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                               style={{ color: '#64748b', fontSize: 13, textDecoration: 'none' }}>GitHub</a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                               style={{ color: '#64748b', fontSize: 13, textDecoration: 'none' }}>Twitter</a>
                            <a href="/login" style={{ color: '#64748b', fontSize: 13, textDecoration: 'none' }}>Sign In</a>
                            <a href="/login" style={{
                                padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                                color: '#818cf8', textDecoration: 'none',
                            }}>Get Started</a>
                        </div>
                    </div>
                </div>
            </footer>

            <style>{`
                @media (max-width: 768px) {
                    .nav-desktop { display: none !important; }
                    .nav-mobile { display: block !important; }
                }
            `}</style>
        </div>
    );
}
