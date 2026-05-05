'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Member {
    id: string;
    role: string;
    user: { id: string; name: string; email: string };
}

interface Org {
    id: string;
    name: string;
    slug: string;
    plan: string;
    members: Member[];
}

const ROLE_COLORS: Record<string, string> = {
    owner: '#fbbf24',
    admin: '#818cf8',
    member: '#34d399',
    viewer: '#64748b',
};

export default function TeamPage() {
    const [org, setOrg] = useState<Org | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'member' | 'admin' | 'viewer'>('member');
    const [inviting, setInviting] = useState(false);

    const fetchOrg = async () => {
        try {
            const data: any = await api.tenant.getMe();
            // Backend returns org; members may be nested
            setOrg(data);
            setError(null);
        } catch (e: any) {
            setError(e?.message ?? 'Failed to load team data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrg(); }, []);

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault();
        if (!inviteEmail.trim() || !org) return;
        setInviting(true);
        try {
            // Backend expects userId — for now pass email as userId placeholder
            // A future invite-by-email endpoint would look up the user first
            await api.tenant.invite(org.id, inviteEmail, inviteRole);
            setInviteEmail('');
            await fetchOrg();
        } catch (err: any) {
            alert(err?.message ?? 'Failed to send invitation');
        } finally {
            setInviting(false);
        }
    }

    async function handleRemove(userId: string) {
        if (!org) return;
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            await api.tenant.remove(org.id, userId);
            await fetchOrg();
        } catch (err: any) {
            alert(err?.message ?? 'Failed to remove member');
        }
    }

    if (loading) return (
        <div style={{ color: 'var(--text-secondary)', fontSize: 13, padding: 24 }}>Loading...</div>
    );

    if (error) return (
        <div style={{ maxWidth: 700 }}>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700 }}><span className="gradient-text">Team Management</span></h1>
            </div>
            <div className="glass-card" style={{ padding: 20, color: '#f87171', fontSize: 13 }}>
                ❌ {error}
            </div>
        </div>
    );

    const members: Member[] = org?.members ?? [];

    return (
        <div style={{ maxWidth: 700 }}>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700 }}><span className="gradient-text">Team Management</span></h1>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {org?.name} · {members.length} members
                </p>
            </div>

            {/* Member list */}
            <div className="glass-card" style={{ marginBottom: 16, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Members
                </div>
                {members.length === 0 && (
                    <div style={{ padding: '20px', fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
                        No members yet
                    </div>
                )}
                {members.map(m => (
                    <div key={m.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 20px', borderBottom: '1px solid var(--border-color)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                width: 34, height: 34, borderRadius: '50%',
                                background: `${ROLE_COLORS[m.role] ?? '#818cf8'}20`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 13, fontWeight: 700, color: ROLE_COLORS[m.role] ?? '#818cf8',
                            }}>
                                {m.user?.name?.charAt(0).toUpperCase() ?? '?'}
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{m.user?.name ?? '—'}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{m.user?.email ?? '—'}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{
                                fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                                background: `${ROLE_COLORS[m.role] ?? '#818cf8'}20`,
                                color: ROLE_COLORS[m.role] ?? '#818cf8',
                            }}>
                                {m.role.toUpperCase()}
                            </span>
                            {m.role !== 'owner' && (
                                <button onClick={() => handleRemove(m.user.id)} style={{
                                    background: 'transparent', border: 'none',
                                    color: '#f87171', fontSize: 11, cursor: 'pointer', padding: '2px 6px',
                                }}>
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Invite form */}
            <div className="glass-card" style={{ padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>
                    Invite Member
                </div>
                <form onSubmit={handleInvite} style={{ display: 'flex', gap: 10 }}>
                    <input
                        type="email"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        placeholder="email@example.com"
                        required
                        className="input-field"
                        style={{ flex: 1 }}
                    />
                    <select
                        value={inviteRole}
                        onChange={e => setInviteRole(e.target.value as any)}
                        className="input-field"
                        style={{ width: 110 }}
                    >
                        <option value="member">member</option>
                        <option value="admin">admin</option>
                        <option value="viewer">viewer</option>
                    </select>
                    <button type="submit" className="btn-primary" disabled={inviting} style={{ whiteSpace: 'nowrap' }}>
                        {inviting ? '...' : '+ Invite'}
                    </button>
                </form>
            </div>
        </div>
    );
}
