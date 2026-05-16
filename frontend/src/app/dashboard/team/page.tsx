'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/lib/auth-context';

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

const ROLE_META: Record<string, { color: string; bg: string; icon: string; desc: string }> = {
    owner:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  icon: '👑', desc: 'Full access, billing, delete org' },
    admin:  { color: '#818cf8', bg: 'rgba(129,140,248,0.12)', icon: '⚡', desc: 'Manage members, deploy, settings' },
    member: { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  icon: '🛠', desc: 'Deploy and view resources' },
    viewer: { color: '#64748b', bg: 'rgba(100,116,139,0.12)', icon: '👁', desc: 'Read-only access' },
};

const PLAN_LIMITS: Record<string, number> = {
    free: 1, starter: 5, pro: 999, enterprise: 999,
};

function getInitials(name: string) {
    return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function getAvatarColor(email: string) {
    const colors = ['#818cf8', '#34d399', '#f59e0b', '#f87171', '#a78bfa', '#00d4ff', '#fb923c'];
    let hash = 0;
    for (const c of email) hash = ((hash << 5) - hash) + c.charCodeAt(0);
    return colors[Math.abs(hash) % colors.length];
}

export default function TeamPage() {
    const { user } = useAuth();
    const { success, error: toastError } = useToast();
    const [org, setOrg] = useState<Org | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'member' | 'admin' | 'viewer'>('member');
    const [inviting, setInviting] = useState(false);
    const [removing, setRemoving] = useState<string | null>(null);

    const fetchOrg = async () => {
        try {
            const data: any = await api.tenant.getMe();
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
            await api.tenant.invite(org.id, inviteEmail, inviteRole);
            setInviteEmail('');
            await fetchOrg();
            success('Invitation Sent!', `${inviteEmail} has been invited as ${inviteRole}.`);
        } catch (err: any) {
            toastError('Invite Failed', err?.message ?? 'Failed to send invitation');
        } finally {
            setInviting(false);
        }
    }

    async function handleRemove(userId: string, userName: string) {
        if (!org) return;
        if (!confirm(`Remove ${userName} from the team?`)) return;
        setRemoving(userId);
        try {
            await api.tenant.remove(org.id, userId);
            await fetchOrg();
            success('Member Removed', `${userName} has been removed.`);
        } catch (err: any) {
            toastError('Remove Failed', err?.message ?? 'Failed to remove member');
        } finally {
            setRemoving(null);
        }
    }

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 13, padding: 40 }}>
            <div className="orbit-loader" /> Loading team...
        </div>
    );

    const members: Member[] = org?.members ?? [];
    const planKey = org?.plan ?? 'free';
    const seatLimit = PLAN_LIMITS[planKey] ?? 1;
    const seatsUsed = members.length;
    const seatPct = Math.min(100, (seatsUsed / seatLimit) * 100);
    const isAtLimit = seatLimit !== 999 && seatsUsed >= seatLimit;
    const myRole = members.find(m => m.user?.email === user?.email)?.role ?? 'viewer';
    const canManage = myRole === 'owner' || myRole === 'admin';

    return (
        <div style={{ maxWidth: 760 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                        <span className="gradient-text">Team</span> Management
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {org?.name} · {members.length} member{members.length !== 1 ? 's' : ''}
                    </p>
                </div>
                {/* Seat usage badge */}
                <div style={{
                    padding: '8px 14px', borderRadius: 10,
                    background: isAtLimit ? 'rgba(248,113,113,0.08)' : 'rgba(52,211,153,0.06)',
                    border: `1px solid ${isAtLimit ? 'rgba(248,113,113,0.25)' : 'rgba(52,211,153,0.2)'}`,
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: isAtLimit ? '#f87171' : '#34d399' }}>
                        {seatsUsed}{seatLimit !== 999 ? `/${seatLimit}` : ''}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                        {seatLimit === 999 ? 'UNLIMITED SEATS' : 'SEATS USED'}
                    </div>
                </div>
            </div>

            {error && (
                <div className="glass-card" style={{ padding: '12px 16px', marginBottom: 16, color: '#f87171', fontSize: 13 }}>
                    ❌ {error}
                </div>
            )}

            {/* Seat limit warning */}
            {isAtLimit && (
                <div style={{
                    padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13,
                    background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)',
                    color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <span>⚠️ Seat limit reached for the <strong>{planKey}</strong> plan.</span>
                    <a href="/dashboard/billing" style={{
                        fontSize: 12, padding: '4px 10px', borderRadius: 6, fontWeight: 600,
                        background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.3)',
                        color: '#818cf8', textDecoration: 'none',
                    }}>Upgrade →</a>
                </div>
            )}

            {/* Member list */}
            <div className="glass-card" style={{ marginBottom: 16, overflow: 'hidden' }}>
                <div style={{
                    padding: '14px 20px', borderBottom: '1px solid var(--border-color)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>👥 Members</span>
                    {seatLimit !== 999 && (
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 80, height: 4, borderRadius: 2, background: 'rgba(30,41,59,0.8)' }}>
                                <div style={{
                                    height: '100%', borderRadius: 2, transition: 'width 0.5s',
                                    background: isAtLimit ? '#f87171' : '#34d399',
                                    width: `${seatPct}%`,
                                }} />
                            </div>
                            {seatsUsed}/{seatLimit} seats
                        </div>
                    )}
                </div>

                {members.length === 0 && (
                    <div style={{ padding: '32px', fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
                        No members yet — invite your first teammate below.
                    </div>
                )}

                {members.map((m, idx) => {
                    const roleMeta = ROLE_META[m.role] ?? ROLE_META.viewer;
                    const avatarColor = getAvatarColor(m.user?.email ?? '');
                    const isMe = m.user?.email === user?.email;

                    return (
                        <div key={m.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '14px 20px',
                            borderBottom: idx < members.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                            transition: 'background 0.15s',
                        }}>
                            {/* Left: avatar + info */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {/* Avatar */}
                                <div style={{
                                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                                    background: `${avatarColor}20`,
                                    border: `2px solid ${avatarColor}40`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 14, fontWeight: 700, color: avatarColor,
                                }}>
                                    {getInitials(m.user?.name ?? m.user?.email ?? '?')}
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {m.user?.name ?? '—'}
                                        </span>
                                        {isMe && (
                                            <span style={{
                                                fontSize: 9, padding: '1px 6px', borderRadius: 4, fontWeight: 700,
                                                background: 'rgba(129,140,248,0.15)', color: '#818cf8', letterSpacing: '0.05em',
                                            }}>YOU</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
                                        {m.user?.email ?? '—'}
                                    </div>
                                </div>
                            </div>

                            {/* Right: role badge + actions */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                        fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                                        background: roleMeta.bg, color: roleMeta.color, border: `1px solid ${roleMeta.color}30`,
                                    }}>
                                        <span>{roleMeta.icon}</span>
                                        {m.role.toUpperCase()}
                                    </span>
                                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 3, textAlign: 'right' }}>
                                        {roleMeta.desc}
                                    </div>
                                </div>
                                {canManage && m.role !== 'owner' && !isMe && (
                                    <button
                                        onClick={() => handleRemove(m.user.id, m.user.name)}
                                        disabled={removing === m.user.id}
                                        style={{
                                            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                                            color: '#f87171', fontSize: 11, cursor: 'pointer', padding: '5px 10px',
                                            borderRadius: 6, fontWeight: 600, transition: 'all 0.15s',
                                            opacity: removing === m.user.id ? 0.5 : 1,
                                        }}
                                    >
                                        {removing === m.user.id ? '...' : 'Remove'}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Invite form */}
            {canManage ? (
                <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>📩 Invite a Teammate</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
                        {isAtLimit
                            ? '⚠️ Upgrade your plan to invite more members.'
                            : `Invite by email — they'll receive an account link automatically.`}
                    </div>
                    <form onSubmit={handleInvite} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <input
                            type="email"
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                            placeholder="teammate@company.com"
                            required
                            disabled={isAtLimit}
                            className="input-field"
                            style={{ flex: 1, minWidth: 200, opacity: isAtLimit ? 0.5 : 1 }}
                        />
                        <select
                            value={inviteRole}
                            onChange={e => setInviteRole(e.target.value as any)}
                            disabled={isAtLimit}
                            className="input-field"
                            style={{ width: 120, opacity: isAtLimit ? 0.5 : 1 }}
                        >
                            <option value="viewer">👁 Viewer</option>
                            <option value="member">🛠 Member</option>
                            <option value="admin">⚡ Admin</option>
                        </select>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={inviting || isAtLimit}
                            style={{ whiteSpace: 'nowrap', opacity: isAtLimit ? 0.5 : 1 }}
                        >
                            {inviting ? '⏳ Sending...' : '+ Invite'}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="glass-card" style={{ padding: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                    👁 You have viewer access — contact an admin to invite new members.
                </div>
            )}

            {/* Role legend */}
            <div className="glass-card" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, letterSpacing: '0.05em' }}>
                    ROLE PERMISSIONS
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                    {Object.entries(ROLE_META).map(([role, meta]) => (
                        <div key={role} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px', borderRadius: 8,
                            background: meta.bg, border: `1px solid ${meta.color}20`,
                        }}>
                            <span style={{ fontSize: 18 }}>{meta.icon}</span>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: meta.color }}>{role.toUpperCase()}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>{meta.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
