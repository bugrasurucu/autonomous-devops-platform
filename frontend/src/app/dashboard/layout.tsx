'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingSpinner } from '@/components/LoadingSkeleton';
import { useToast } from '@/components/Toast';

const NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard', icon: '⬡' },
    { href: '/dashboard/deployments', label: 'Deployments', icon: '🚀' },
    { href: '/dashboard/agents', label: 'Agents', icon: '⟁' },
    { href: '/dashboard/repositories', label: 'Repositories', icon: '⌥' },
    { href: '/dashboard/pipeline', label: 'Pipeline', icon: '▸▸' },
    { href: '/dashboard/finops', label: 'FinOps', icon: '◈' },
    { href: '/dashboard/self-healing', label: 'Self-Healing', icon: '↻' },
    { href: '/dashboard/token-usage', label: 'Token Usage', icon: '⬡' },
    { href: '/dashboard/team', label: 'Team', icon: '⊞' },
    { href: '/dashboard/billing', label: 'Billing', icon: '◎' },
    { href: '/dashboard/settings', label: 'Settings', icon: '⚙' },
];


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [kagentAvailable, setKagentAvailable] = useState<boolean | null>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [notifOpen, setNotifOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const { info } = useToast();

    useEffect(() => {
        api.kagent?.getStatus().then((s: any) => setKagentAvailable(s?.available ?? false)).catch(() => setKagentAvailable(false));
    }, []);

    // Poll activity feed for notifications
    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const stats = await api.getStats();
                if (stats?.activities) {
                    setActivities(stats.activities.slice(0, 8));
                    setUnreadCount(prev => {
                        const newCount = stats.activities.length;
                        if (prev > 0 && newCount > prev) return newCount;
                        return prev;
                    });
                }
            } catch { }
        };
        fetchActivities();
        const interval = setInterval(fetchActivities, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login');
        }
    }, [user, loading, router]);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    if (loading || !user) {
        return <LoadingSpinner text="Loading Orbitron..." />;
    }

    const sidebarContent = (
        <>
            {/* Logo */}
            <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #006a80, #00d4ff)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: 18, color: '#020c1b',
                        boxShadow: '0 0 16px rgba(0,212,255,0.3)',
                    }}>⊙</div>
                    <div>
                        <div style={{ fontWeight: 900, fontSize: 14, letterSpacing: '-0.3px', color: '#e2eeff',
                            background: 'linear-gradient(135deg,#00d4ff,#00ff88)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>ORBITRON</div>
                        <div style={{ fontSize: 10, color: '#3d5a7a', letterSpacing: '0.08em', fontFamily: 'JetBrains Mono, monospace' }}>DEVOPS AI PLATFORM</div>
                    </div>
                </div>
                {/* kagent badge */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 8px', borderRadius: 6,
                    background: kagentAvailable === null ? 'rgba(100,116,139,0.1)'
                        : kagentAvailable ? 'rgba(52,211,153,0.08)' : 'rgba(99,102,241,0.08)',
                    border: `1px solid ${kagentAvailable === null ? 'rgba(100,116,139,0.2)'
                        : kagentAvailable ? 'rgba(52,211,153,0.25)' : 'rgba(99,102,241,0.2)'}`,
                }}>
                    <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: kagentAvailable === null ? '#64748b'
                            : kagentAvailable ? '#34d399' : '#818cf8',
                        boxShadow: kagentAvailable ? '0 0 6px #34d399' : 'none',
                    }} />
                    <span style={{
                        fontSize: 10, fontWeight: 600,
                        color: kagentAvailable === null ? '#64748b'
                            : kagentAvailable ? '#34d399' : '#818cf8',
                    }}>
                        {kagentAvailable === null ? 'kagent: checking'
                            : kagentAvailable ? 'kagent: live ☸' : 'kagent: simulated'}
                    </span>
                </div>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    return (
                        <Link key={item.href} href={item.href} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px', borderRadius: 10, marginBottom: 2,
                            fontSize: 14, fontWeight: isActive ? 600 : 400,
                            color: isActive ? '#00d4ff' : '#7a9cc0',
                            background: isActive ? 'rgba(0,212,255,0.08)' : 'transparent',
                            textDecoration: 'none', transition: 'all 0.2s',
                        }}>
                            <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* User */}
            <div style={{
                padding: '12px 14px', borderTop: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', gap: 10,
            }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: 'white',
                }}>{user.name.charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        {user.plan} Plan
                    </div>
                </div>
                <button onClick={() => { logout(); router.push('/login'); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16, padding: 4 }}
                    title="Logout">⏻</button>
            </div>
        </>
    );

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            {/* Mobile hamburger */}
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                    position: 'fixed', top: 12, left: 12, zIndex: 200,
                    width: 40, height: 40, borderRadius: 10,
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                    color: '#fff', fontSize: 20, cursor: 'pointer',
                    display: 'none', alignItems: 'center', justifyContent: 'center',
                }}>
                {sidebarOpen ? '✕' : '☰'}
            </button>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} style={{
                    position: 'fixed', inset: 0, zIndex: 149,
                    background: 'rgba(0,0,0,0.6)', display: 'none',
                }} />
            )}

            {/* Sidebar - desktop */}
            <aside className="sidebar-desktop" style={{
                width: 240, background: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border-color)',
                display: 'flex', flexDirection: 'column', flexShrink: 0,
            }}>
                {sidebarContent}
            </aside>

            {/* Sidebar - mobile */}
            <aside className="sidebar-mobile" style={{
                position: 'fixed', top: 0, left: sidebarOpen ? 0 : -260,
                width: 260, height: '100vh', zIndex: 150,
                background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)',
                display: 'none', flexDirection: 'column',
                transition: 'left 0.3s ease',
            }}>
                {sidebarContent}
            </aside>

            {/* Main content */}
            <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
                {/* Top bar */}
                <div style={{
                    padding: '12px 24px', borderBottom: '1px solid var(--border-color)',
                    display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12,
                    background: 'rgba(8,15,30,0.8)', backdropFilter: 'blur(8px)',
                    flexShrink: 0,
                }}>
                    {/* Notification Bell */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => { setNotifOpen(o => !o); setUnreadCount(0); }}
                            style={{
                                background: 'none', border: '1px solid var(--border-color)',
                                borderRadius: 8, width: 34, height: 34, cursor: 'pointer',
                                color: 'var(--text-secondary)', fontSize: 16,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                position: 'relative', transition: 'border-color 0.2s',
                            }}
                        >
                            🔔
                            {unreadCount > 0 && (
                                <div style={{
                                    position: 'absolute', top: -4, right: -4,
                                    width: 16, height: 16, borderRadius: '50%',
                                    background: '#f87171', fontSize: 9, fontWeight: 700,
                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </div>
                            )}
                        </button>
                        {/* Dropdown */}
                        {notifOpen && (
                            <>
                                <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setNotifOpen(false)} />
                                <div style={{
                                    position: 'absolute', top: 42, right: 0, zIndex: 50,
                                    width: 340, maxHeight: 420, overflowY: 'auto',
                                    background: 'rgba(8,12,28,0.98)', backdropFilter: 'blur(20px)',
                                    border: '1px solid var(--border-color)', borderRadius: 12,
                                    boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                                }}>
                                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 13, fontWeight: 700 }}>Activity Feed</span>
                                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Recent events</span>
                                    </div>
                                    {activities.length === 0 ? (
                                        <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                                            No recent activity
                                        </div>
                                    ) : activities.map((a, i) => (
                                        <div key={i} style={{
                                            padding: '10px 16px', borderBottom: i < activities.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                            display: 'flex', alignItems: 'flex-start', gap: 10,
                                        }}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.color || '#818cf8', flexShrink: 0, marginTop: 5 }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 12, lineHeight: 1.4 }}>{a.text}</div>
                                                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
                                                    {new Date(a.createdAt).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
                    <div className="page-enter">
                        <ErrorBoundary>
                            {children}
                        </ErrorBoundary>
                    </div>
                </div>
            </main>

            <style>{`
                @media (max-width: 768px) {
                    .sidebar-desktop { display: none !important; }
                    .sidebar-mobile { display: flex !important; }
                    .mobile-menu-btn { display: flex !important; }
                    .mobile-overlay { display: block !important; }
                }
            `}</style>
        </div>
    );
}
