'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const TABS = [
    { id: 'profile', label: '👤 Profile', icon: '👤' },
    { id: 'agents', label: '🤖 Agent Models', icon: '🤖' },
    { id: 'apikeys', label: '🔑 API Keys', icon: '🔑' },
    { id: 'danger', label: '⚠️ Danger Zone', icon: '⚠️' },
];

const AGENT_DEFS = [
    { id: 'infra-agent', name: 'Infrastructure Agent', emoji: '🏗', color: '#818cf8', taskType: 'iac_generation' },
    { id: 'pipeline-agent', name: 'Pipeline Agent', emoji: '🔄', color: '#34d399', taskType: 'pipeline' },
    { id: 'finops-agent', name: 'FinOps Agent', emoji: '💰', color: '#fbbf24', taskType: 'cost_calc' },
    { id: 'sre-agent', name: 'SRE Agent', emoji: '🛡', color: '#f87171', taskType: 'incident_rca' },
];

const AVAILABLE_MODELS = [
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', tier: 'free', desc: 'Fast, cost-efficient' },
    { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', tier: 'pro', desc: 'Balanced performance' },
    { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', tier: 'free', desc: 'OpenAI efficient model' },
    { id: 'gpt-4o', label: 'GPT-4o', tier: 'enterprise', desc: 'Most capable OpenAI' },
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', tier: 'pro', desc: 'Google multimodal' },
];

const TIER_COLORS: Record<string, string> = {
    free: '#34d399', pro: '#818cf8', enterprise: '#fbbf24',
};

export default function SettingsPage() {
    const { user, updateUser } = useAuth();
    const [tab, setTab] = useState('profile');
    const [models, setModels] = useState<any[]>([]);
    const [agentModels, setAgentModels] = useState<any[]>([]);
    const [usage, setUsage] = useState<any>(null);
    const [apiKeys, setApiKeys] = useState<any[]>([]);
    const [name, setName] = useState(user?.name || '');
    const [company, setCompany] = useState(user?.company || '');
    const [saving, setSaving] = useState(false);
    const [savingAgent, setSavingAgent] = useState<string | null>(null);
    const [newKey, setNewKey] = useState({ provider: 'openai', key: '', label: '' });
    const [addingKey, setAddingKey] = useState(false);
    const [showKey, setShowKey] = useState<Record<string, boolean>>({});
    const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
    const [savingPassword, setSavingPassword] = useState(false);

    useEffect(() => {
        api.getModels().then(setModels).catch(() => { });
        api.getAgentModels().then(setAgentModels).catch(() => { });
        api.getUsage().then(setUsage).catch(() => { });
        api.getApiKeys().then(setApiKeys).catch(() => { });
    }, []);

    const saveProfile = async () => {
        setSaving(true);
        try {
            const updated = await api.updateProfile({ name, company });
            updateUser(updated);
        } catch (err: any) { alert(err.message); }
        setSaving(false);
    };

    const saveAgentModel = async (agentId: string, data: any) => {
        setSavingAgent(agentId);
        try {
            await api.updateAgentModel(agentId, data);
            const updated = await api.getAgentModels();
            setAgentModels(updated);
        } catch (err: any) { alert(err.message); }
        setSavingAgent(null);
    };

    const addApiKey = async () => {
        if (!newKey.key) return;
        setAddingKey(true);
        try {
            await api.createApiKey(newKey);
            setNewKey({ provider: 'openai', key: '', label: '' });
            setApiKeys(await api.getApiKeys());
        } catch (err: any) { alert(err.message); }
        setAddingKey(false);
    };

    const deleteKey = async (id: string) => {
        if (!confirm('Delete this API key?')) return;
        try {
            await api.deleteApiKey(id);
            setApiKeys(apiKeys.filter((k) => k.id !== id));
        } catch (err: any) { alert(err.message); }
    };

    const getAgentConfig = (agentId: string) =>
        agentModels.find((m: any) => m.agentId === agentId);

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700 }}>
                    <span className="gradient-text">Settings</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                    Manage your profile, AI models, and integrations
                </p>
            </div>

            {/* Tab nav */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        style={{
                            padding: '8px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                            border: 'none', fontWeight: 600,
                            background: tab === t.id ? 'rgba(129,140,248,0.2)' : 'rgba(30,41,59,0.5)',
                            color: tab === t.id ? '#818cf8' : 'var(--text-secondary)',
                            borderBottom: tab === t.id ? '2px solid #818cf8' : '2px solid transparent',
                            transition: 'all 0.15s',
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── Profile Tab ─────────────────────── */}
            {tab === 'profile' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="glass-card" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 18 }}>Personal Info</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>Full Name</label>
                                <input className="input-field" value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>Company</label>
                                <input className="input-field" value={company} onChange={e => setCompany(e.target.value)} placeholder="Your company" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>Email</label>
                                <input className="input-field" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
                            </div>
                            <button className="btn-primary" onClick={saveProfile} disabled={saving}>
                                {saving ? '⏳ Saving...' : '💾 Save Changes'}
                            </button>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 18 }}>Plan & Usage</h3>
                        <div style={{
                            padding: '14px 16px', borderRadius: 10, marginBottom: 16,
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(79,70,229,0.08))',
                            border: '1px solid rgba(99,102,241,0.25)',
                        }}>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Current Plan</div>
                            <div style={{ fontSize: 22, fontWeight: 700, textTransform: 'capitalize', color: '#818cf8' }}>
                                {usage?.plan || user?.plan || 'free'}
                            </div>
                        </div>
                        {usage && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {[
                                    { label: 'Deploys this month', value: `${usage.deploysThisMonth ?? 0} / ${usage.deployLimit === -1 ? '∞' : (usage.deployLimit ?? 5)}` },
                                    { label: 'Agent limit', value: usage.agentLimit ?? 4 },
                                ].map(row => (
                                    <div key={row.label} style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        padding: '8px 0', borderBottom: '1px solid var(--border-color)',
                                    }}>
                                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{row.label}</span>
                                        <span style={{ fontSize: 13, fontWeight: 600 }}>{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Agent Models Tab ─────────────────── */}
            {tab === 'agents' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="glass-card" style={{ padding: '14px 20px', background: 'rgba(129,140,248,0.05)', border: '1px solid rgba(129,140,248,0.15)' }}>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                            🤖 Configure which AI model each agent uses. Changes take effect on the next agent run. Lower-tier models reduce token costs.
                        </p>
                    </div>

                    {AGENT_DEFS.map(agent => {
                        const config = getAgentConfig(agent.id);
                        const currentModel = config?.model ?? 'claude-haiku-4-5-20251001';
                        const modelInfo = AVAILABLE_MODELS.find(m => m.id === currentModel);
                        const isEnabled = config?.enabled !== false;

                        return (
                            <div key={agent.id} className="glass-card" style={{ padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                                            background: `${agent.color}15`, border: `1.5px solid ${agent.color}30`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                                        }}>
                                            {agent.emoji}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 600 }}>{agent.name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                                Task type: <span style={{ color: agent.color }}>{agent.taskType}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Enable toggle */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                            {isEnabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                        <div
                                            onClick={() => saveAgentModel(agent.id, { enabled: !isEnabled })}
                                            style={{
                                                width: 36, height: 20, borderRadius: 10, cursor: 'pointer',
                                                background: isEnabled ? '#34d399' : 'rgba(30,41,59,0.8)',
                                                border: `1px solid ${isEnabled ? '#34d399' : 'var(--border-color)'}`,
                                                position: 'relative', transition: 'all 0.2s',
                                            }}
                                        >
                                            <div style={{
                                                position: 'absolute', top: 2, left: isEnabled ? 18 : 2,
                                                width: 14, height: 14, borderRadius: '50%',
                                                background: 'white', transition: 'left 0.2s',
                                            }} />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div>
                                        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Model</label>
                                        <select
                                            className="input-field"
                                            value={currentModel}
                                            onChange={e => saveAgentModel(agent.id, { model: e.target.value })}
                                            disabled={savingAgent === agent.id}
                                        >
                                            {AVAILABLE_MODELS.map(m => (
                                                <option key={m.id} value={m.id}>{m.label} ({m.tier})</option>
                                            ))}
                                        </select>
                                        {modelInfo && (
                                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
                                                <span style={{
                                                    padding: '1px 6px', borderRadius: 4, fontSize: 10,
                                                    background: TIER_COLORS[modelInfo.tier] + '15',
                                                    color: TIER_COLORS[modelInfo.tier],
                                                    fontWeight: 600,
                                                }}>
                                                    {modelInfo.tier}
                                                </span>
                                                {modelInfo.desc}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Max Tokens</label>
                                        <select
                                            className="input-field"
                                            defaultValue={config?.maxTokens ?? 4096}
                                            onChange={e => saveAgentModel(agent.id, { maxTokens: parseInt(e.target.value) })}
                                        >
                                            {[1024, 2048, 4096, 8192, 16384].map(v => (
                                                <option key={v} value={v}>{v.toLocaleString()}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {savingAgent === agent.id && (
                                    <div style={{ fontSize: 11, color: '#818cf8', marginTop: 8 }}>⏳ Saving...</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── API Keys Tab ─────────────────────── */}
            {tab === 'apikeys' && (
                <div>
                    <div className="glass-card" style={{ padding: 22, marginBottom: 16 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Add API Key</h3>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <select className="input-field" value={newKey.provider} style={{ width: 140 }}
                                onChange={e => setNewKey({ ...newKey, provider: e.target.value })}>
                                <option value="openai">OpenAI</option>
                                <option value="anthropic">Anthropic</option>
                                <option value="google">Google</option>
                                <option value="deepseek">DeepSeek</option>
                                <option value="mistral">Mistral</option>
                            </select>
                            <input className="input-field" placeholder="Label (optional)" value={newKey.label} style={{ width: 150 }}
                                onChange={e => setNewKey({ ...newKey, label: e.target.value })} />
                            <input className="input-field" type="password" placeholder="sk-..." value={newKey.key} style={{ flex: 1, minWidth: 200 }}
                                onChange={e => setNewKey({ ...newKey, key: e.target.value })} />
                            <button className="btn-primary" onClick={addApiKey} disabled={addingKey || !newKey.key} style={{ whiteSpace: 'nowrap' }}>
                                {addingKey ? '⏳' : '+ Add Key'}
                            </button>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: 22 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Stored Keys ({apiKeys.length})</h3>
                        {apiKeys.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-secondary)', fontSize: 13 }}>
                                <div style={{ fontSize: 32, marginBottom: 10 }}>🔑</div>
                                No API keys configured. Add your first key above.
                            </div>
                        ) : (
                            apiKeys.map(k => (
                                <div key={k.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '12px 14px', borderRadius: 10, marginBottom: 8,
                                    background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border-color)',
                                }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                        background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 13, fontWeight: 700, color: '#818cf8', textTransform: 'capitalize',
                                    }}>
                                        {k.provider[0].toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{k.provider}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                            {showKey[k.id] ? k.maskedKey : '••••••••••••••••••••'}
                                        </div>
                                    </div>
                                    {k.label && <span style={{ fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0 }}>{k.label}</span>}
                                    <button onClick={() => setShowKey(prev => ({ ...prev, [k.id]: !prev[k.id] }))} style={{
                                        background: 'none', border: '1px solid var(--border-color)',
                                        color: 'var(--text-secondary)', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', flexShrink: 0,
                                    }}>
                                        {showKey[k.id] ? '🙈 Hide' : '👁 Show'}
                                    </button>
                                    <button onClick={() => deleteKey(k.id)} style={{
                                        background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                                        color: '#f87171', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', flexShrink: 0,
                                    }}>
                                        🗑 Delete
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ── Danger Zone Tab ──────────────────── */}
            {tab === 'danger' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="glass-card" style={{ padding: 22, border: '1px solid rgba(248,113,113,0.2)' }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: '#f87171' }}>⚠️ Danger Zone</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                            These actions are permanent and cannot be undone.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* Change password */}
                            <div style={{
                                padding: '16px 18px', borderRadius: 10,
                                background: 'rgba(15,23,42,0.5)', border: '1px solid var(--border-color)',
                            }}>
                                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>🔒 Change Password</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                                    <input className="input-field" type="password" placeholder="Current password"
                                        value={passwordForm.current} onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })} />
                                    <input className="input-field" type="password" placeholder="New password"
                                        value={passwordForm.next} onChange={e => setPasswordForm({ ...passwordForm, next: e.target.value })} />
                                    <input className="input-field" type="password" placeholder="Confirm new"
                                        value={passwordForm.confirm} onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
                                </div>
                                <button
                                    className="btn-primary"
                                    disabled={savingPassword || !passwordForm.current || !passwordForm.next || passwordForm.next !== passwordForm.confirm}
                                    onClick={async () => {
                                        setSavingPassword(true);
                                        try {
                                            await api.updateProfile({ name }); // placeholder — wire real password endpoint
                                            alert('Password updated successfully');
                                            setPasswordForm({ current: '', next: '', confirm: '' });
                                        } catch (e: any) { alert(e.message); }
                                        setSavingPassword(false);
                                    }}
                                    style={{ fontSize: 13 }}
                                >
                                    {savingPassword ? '⏳ Updating...' : '🔒 Update Password'}
                                </button>
                            </div>

                            {/* Export data */}
                            <div style={{
                                padding: '16px 18px', borderRadius: 10,
                                background: 'rgba(15,23,42,0.5)', border: '1px solid var(--border-color)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>📦 Export Data</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Download all your data as JSON</div>
                                </div>
                                <button style={{
                                    padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600,
                                    background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.3)', color: '#818cf8',
                                }} onClick={() => alert('Export feature coming soon — will include deployments, incidents, and token usage.')}>
                                    Export
                                </button>
                            </div>

                            {/* Delete account */}
                            <div style={{
                                padding: '16px 18px', borderRadius: 10,
                                background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.2)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#f87171' }}>🗑 Delete Account</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                        Permanently delete your account and all associated data
                                    </div>
                                </div>
                                <button style={{
                                    padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600,
                                    background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171',
                                }} onClick={() => alert('Please contact support@orbitron.dev to delete your account.')}>
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
