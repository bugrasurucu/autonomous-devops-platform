'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function SettingsPage() {
    const { user, updateUser } = useAuth();
    const [models, setModels] = useState<any[]>([]);
    const [usage, setUsage] = useState<any>(null);
    const [apiKeys, setApiKeys] = useState<any[]>([]);
    const [name, setName] = useState(user?.name || '');
    const [company, setCompany] = useState(user?.company || '');
    const [saving, setSaving] = useState(false);
    const [newKey, setNewKey] = useState({ provider: 'openai', key: '', label: '' });

    useEffect(() => {
        api.getModels().then(setModels).catch(() => { });
        api.getUsage().then(setUsage).catch(() => { });
        api.getApiKeys().then(setApiKeys).catch(() => { });
    }, []);

    const saveProfile = async () => {
        setSaving(true);
        try {
            const updated = await api.updateProfile({ name, company });
            updateUser(updated);
        } catch (err: any) {
            alert(err.message);
        }
        setSaving(false);
    };

    const addApiKey = async () => {
        if (!newKey.key) return;
        try {
            await api.createApiKey(newKey);
            setNewKey({ provider: 'openai', key: '', label: '' });
            const keys = await api.getApiKeys();
            setApiKeys(keys);
        } catch (err: any) {
            alert(err.message);
        }
    };

    const deleteKey = async (id: string) => {
        if (!confirm('Delete this API key?')) return;
        try {
            await api.deleteApiKey(id);
            setApiKeys(apiKeys.filter((k) => k.id !== id));
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
                <span className="gradient-text">Settings</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                Manage your profile, models, and API keys
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Profile */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Profile</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Name</label>
                            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Company</label>
                            <input className="input-field" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Your company" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Email</label>
                            <input className="input-field" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
                        </div>
                        <button className="btn-primary" onClick={saveProfile} disabled={saving} style={{ marginTop: 4 }}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                {/* Usage */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Usage & Plan</h3>
                    <div style={{
                        padding: 16, borderRadius: 10,
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(79,70,229,0.1))',
                        border: '1px solid rgba(99,102,241,0.2)',
                        marginBottom: 16,
                    }}>
                        <div style={{ fontSize: 20, fontWeight: 700, textTransform: 'capitalize', color: 'var(--accent-light)' }}>
                            {usage?.plan || user?.plan} Plan
                        </div>
                    </div>
                    {usage && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[
                                { label: 'Deploys This Month', value: `${usage.deploysThisMonth} / ${usage.deployLimit === -1 ? '∞' : usage.deployLimit}` },
                                { label: 'Agent Limit', value: usage.agentLimit },
                            ].map((s) => (
                                <div key={s.label} style={{
                                    display: 'flex', justifyContent: 'space-between', padding: '8px 0',
                                    borderBottom: '1px solid var(--border-color)',
                                }}>
                                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.label}</span>
                                    <span style={{ fontSize: 14, fontWeight: 600 }}>{s.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Models */}
            <div className="glass-card" style={{ padding: 24, marginTop: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>AI Models</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    {models.map((m) => (
                        <div key={m.id} style={{
                            padding: 14, borderRadius: 10,
                            background: m.available ? 'rgba(99,102,241,0.05)' : 'rgba(30,41,59,0.3)',
                            border: `1px solid ${m.available ? 'rgba(99,102,241,0.2)' : 'var(--border-color)'}`,
                            opacity: m.available ? 1 : 0.5,
                        }}>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{m.provider}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{m.desc}</div>
                            <span style={{
                                display: 'inline-block', marginTop: 6,
                                fontSize: 10, padding: '2px 6px', borderRadius: 4,
                                background: m.tier === 'free' ? 'rgba(52,211,153,0.1)' :
                                    m.tier === 'pro' ? 'rgba(99,102,241,0.1)' : 'rgba(251,191,36,0.1)',
                                color: m.tier === 'free' ? '#34d399' :
                                    m.tier === 'pro' ? '#818cf8' : '#fbbf24',
                                textTransform: 'capitalize', fontWeight: 500,
                            }}>
                                {m.tier}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* API Keys */}
            <div className="glass-card" style={{ padding: 24, marginTop: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>API Keys</h3>
                {/* Add key form */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <select className="input-field" value={newKey.provider} style={{ width: 140 }}
                        onChange={(e) => setNewKey({ ...newKey, provider: e.target.value })}>
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                        <option value="google">Google</option>
                        <option value="deepseek">DeepSeek</option>
                        <option value="mistral">Mistral</option>
                    </select>
                    <input className="input-field" placeholder="Label (optional)" value={newKey.label} style={{ width: 140 }}
                        onChange={(e) => setNewKey({ ...newKey, label: e.target.value })} />
                    <input className="input-field" placeholder="sk-..." value={newKey.key} style={{ flex: 1 }}
                        onChange={(e) => setNewKey({ ...newKey, key: e.target.value })} />
                    <button className="btn-primary" onClick={addApiKey} style={{ whiteSpace: 'nowrap' }}>Add Key</button>
                </div>
                {/* Key list */}
                {apiKeys.map((k) => (
                    <div key={k.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px', borderRadius: 10, marginBottom: 6,
                        background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border-color)',
                    }}>
                        <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'capitalize', width: 80 }}>{k.provider}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, fontFamily: 'JetBrains Mono, monospace' }}>
                            {k.maskedKey}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{k.label}</span>
                        <button onClick={() => deleteKey(k.id)} style={{
                            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                            color: '#f87171', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer',
                        }}>
                            Delete
                        </button>
                    </div>
                ))}
                {apiKeys.length === 0 && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No API keys configured</p>
                )}
            </div>
        </div>
    );
}
