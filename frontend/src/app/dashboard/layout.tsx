'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard', icon: '⬡' },
    { href: '/dashboard/agents', label: 'Agents', icon: '⟁' },
    { href: '/dashboard/pipeline', label: 'Pipeline', icon: '▸▸' },
    { href: '/dashboard/finops', label: 'FinOps', icon: '◈' },
    { href: '/dashboard/self-healing', label: 'Self-Healing', icon: '↻' },
    { href: '/dashboard/settings', label: 'Settings', icon: '⚙' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div className="gradient-text" style={{ fontSize: 20, fontWeight: 700 }}>Loading...</div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            {/* Sidebar */}
            <aside style={{
                width: 240,
                background: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
            }}>
                {/* Logo */}
                <div style={{
                    padding: '20px 20px 16px',
                    borderBottom: '1px solid var(--border-color)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 16,
                            color: 'white',
                        }}>
                            M
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>Mission Control</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>DevOps Platform</div>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '10px 12px',
                                    borderRadius: 10,
                                    marginBottom: 2,
                                    fontSize: 14,
                                    fontWeight: isActive ? 600 : 400,
                                    color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)',
                                    background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                    textDecoration: 'none',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User */}
                <div style={{
                    padding: '12px 14px',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                }}>
                    <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'white',
                    }}>
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                            {user.plan} Plan
                        </div>
                    </div>
                    <button
                        onClick={() => { logout(); router.push('/login'); }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontSize: 16,
                            padding: 4,
                        }}
                        title="Logout"
                    >
                        ⏻
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main style={{
                flex: 1,
                overflow: 'auto',
                padding: 24,
                background: 'var(--bg-primary)',
            }}>
                <div className="page-enter">
                    {children}
                </div>
            </main>
        </div>
    );
}
