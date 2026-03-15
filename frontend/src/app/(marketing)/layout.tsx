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
                        width: 36, height: 36, borderRadius: 10,
                        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: 18, color: '#fff',
                    }}>M</div>
                    <span style={{
                        fontSize: 18, fontWeight: 700,
                        background: 'linear-gradient(135deg,#818cf8,#a78bfa)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>Mission Control</span>
                </Link>

                {/* Desktop links */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="nav-desktop">
                    <a href="#features" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Features</a>
                    <a href="#pricing" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Pricing</a>
                    <a href="#agents" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Agents</a>
                    {user ? (
                        <Link href="/dashboard" style={{
                            padding: '8px 20px', borderRadius: 8,
                            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                            color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600,
                        }}>Dashboard →</Link>
                    ) : (
                        <div style={{ display: 'flex', gap: 12 }}>
                            <Link href="/login" style={{ padding: '8px 16px', color: '#c4b5fd', textDecoration: 'none', fontSize: 14 }}>Sign In</Link>
                            <Link href="/login" style={{
                                padding: '8px 20px', borderRadius: 8,
                                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600,
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
                    background: 'rgba(10,10,25,0.98)', padding: 24,
                    display: 'flex', flexDirection: 'column', gap: 20,
                }}>
                    <a href="#features" onClick={() => setMenuOpen(false)} style={{ color: '#e2e8f0', fontSize: 18, textDecoration: 'none' }}>Features</a>
                    <a href="#pricing" onClick={() => setMenuOpen(false)} style={{ color: '#e2e8f0', fontSize: 18, textDecoration: 'none' }}>Pricing</a>
                    <a href="#agents" onClick={() => setMenuOpen(false)} style={{ color: '#e2e8f0', fontSize: 18, textDecoration: 'none' }}>Agents</a>
                    <Link href="/login" onClick={() => setMenuOpen(false)} style={{
                        marginTop: 16, padding: '12px 24px', borderRadius: 8, textAlign: 'center' as const,
                        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff',
                        textDecoration: 'none', fontSize: 16, fontWeight: 600,
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
                                    width: 28, height: 28, borderRadius: 7,
                                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 800, fontSize: 14, color: '#fff',
                                }}>M</div>
                                <span style={{ fontWeight: 700, color: '#e2e8f0' }}>Mission Control</span>
                            </div>
                            <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>
                                AI-powered autonomous DevOps platform. Deploy, monitor, optimize, and self-heal.
                            </p>
                        </div>
                        <div>
                            <h4 style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Product</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {['Features', 'Pricing', 'Agents', 'Documentation'].map((l) => (
                                    <a key={l} href="#" style={{ color: '#64748b', fontSize: 14, textDecoration: 'none' }}>{l}</a>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Company</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {['About', 'Blog', 'Careers', 'Contact'].map((l) => (
                                    <a key={l} href="#" style={{ color: '#64748b', fontSize: 14, textDecoration: 'none' }}>{l}</a>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Legal</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {['Privacy', 'Terms', 'Security', 'SLA'].map((l) => (
                                    <a key={l} href="#" style={{ color: '#64748b', fontSize: 14, textDecoration: 'none' }}>{l}</a>
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
                        <span style={{ color: '#475569', fontSize: 13 }}>© 2026 Mission Control. All rights reserved.</span>
                        <div style={{ display: 'flex', gap: 16 }}>
                            {['GitHub', 'Twitter', 'Discord'].map((s) => (
                                <a key={s} href="#" style={{ color: '#64748b', fontSize: 13, textDecoration: 'none' }}>{s}</a>
                            ))}
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
