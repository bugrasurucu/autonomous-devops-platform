'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface Repo {
    id: number;
    name: string;
    fullName: string;
    description: string | null;
    language: string | null;
    stars: number;
    private: boolean;
    defaultBranch: string;
    updatedAt: string;
    url: string;
}

const LANGUAGE_COLORS: Record<string, string> = {
    TypeScript: '#3178c6',
    JavaScript: '#f7df1e',
    Python: '#3572A5',
    Go: '#00ADD8',
    Rust: '#dea584',
    Java: '#b07219',
    'C#': '#178600',
    Ruby: '#701516',
    PHP: '#4F5D95',
    Swift: '#F05138',
    Kotlin: '#A97BFF',
    Dockerfile: '#384d54',
    Shell: '#89e051',
};

export default function RepositoriesPage() {
    const [githubStatus, setGithubStatus] = useState<{ connected: boolean; username?: string } | null>(null);
    const [repos, setRepos] = useState<Repo[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Repo | null>(null);
    const [deploying, setDeploying] = useState(false);
    const [deployConfig, setDeployConfig] = useState({ region: 'us-east-1', environment: 'production', budget: 100 });
    const [deploySuccess, setDeploySuccess] = useState<string | null>(null);
    const [langFilter, setLangFilter] = useState<string>('all');

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const status = await api.github.getStatus();
            setGithubStatus(status);
            if (status.connected) {
                loadRepos();
            }
        } catch { }
    };

    const loadRepos = useCallback(async (q?: string) => {
        setLoading(true);
        try {
            const data = await api.github.listRepos(q);
            setRepos(data);
        } catch { } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!githubStatus?.connected) return;
        const t = setTimeout(() => loadRepos(search), 300);
        return () => clearTimeout(t);
    }, [search, githubStatus, loadRepos]);

    const connectGitHub = async () => {
        try {
            const { url } = await api.github.getOAuthUrl();
            window.location.href = url;
        } catch (e: any) { alert(e.message); }
    };

    const handleDeploy = async () => {
        if (!selected) return;
        setDeploying(true);
        setDeploySuccess(null);
        try {
            const res = await api.deploy({
                projectName: selected.name,
                ...deployConfig,
                githubRepo: selected.fullName,
                githubBranch: selected.defaultBranch,
            } as any);
            setDeploySuccess(res.deployId);
        } catch (e: any) { alert(e.message); } finally {
            setDeploying(false);
        }
    };

    // Unique languages for filter
    const languages = ['all', ...Array.from(new Set(repos.map(r => r.language).filter(Boolean) as string[]))];

    const filtered = repos.filter(r => {
        const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || (r.description || '').toLowerCase().includes(search.toLowerCase());
        const matchLang = langFilter === 'all' || r.language === langFilter;
        return matchSearch && matchLang;
    });

    if (!githubStatus) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div className="gradient-text" style={{ fontSize: 16, fontWeight: 600 }}>Loading...</div>
            </div>
        );
    }

    if (!githubStatus.connected) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 20 }}>
                <svg width="64" height="64" viewBox="0 0 16 16" fill="var(--text-secondary)">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>Connect GitHub</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', maxWidth: 360, marginBottom: 24 }}>
                        Connect your GitHub account to browse and deploy any of your repositories directly from Mission Control.
                    </p>
                    <div style={{ textAlign: 'center' }}>
                        <button className="btn-primary" onClick={connectGitHub} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                            </svg>
                            Connect GitHub
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700 }}>
                        <span className="gradient-text">Repositories</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                        Connected as <strong>@{githubStatus.username}</strong> · {repos.length} repositories
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => loadRepos(search)} style={{
                        padding: '8px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                        background: 'rgba(30,41,59,0.6)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)',
                    }}>↻ Refresh</button>
                    <button onClick={() => api.github.disconnect().then(checkStatus)} style={{
                        padding: '8px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                        background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171',
                    }}>Disconnect</button>
                </div>
            </div>

            {/* Two-column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16, height: 'calc(100vh - 160px)' }}>
                {/* Left: Repo list */}
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {/* Search + Filter */}
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
                        <input
                            className="input-field"
                            placeholder="🔍 Search repositories..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ marginBottom: 10 }}
                        />
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {languages.slice(0, 8).map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => setLangFilter(lang)}
                                    style={{
                                        padding: '3px 9px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: 'none',
                                        background: langFilter === lang ? 'rgba(129,140,248,0.3)' : 'rgba(30,41,59,0.6)',
                                        color: langFilter === lang ? '#818cf8' : 'var(--text-secondary)',
                                        fontWeight: langFilter === lang ? 600 : 400,
                                        display: 'flex', alignItems: 'center', gap: 4,
                                    }}
                                >
                                    {lang !== 'all' && (
                                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: LANGUAGE_COLORS[lang] || '#8b949e', display: 'inline-block' }} />
                                    )}
                                    {lang === 'all' ? 'All' : lang}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Repo items */}
                    <div style={{ flex: 1, overflow: 'auto', padding: '8px 8px' }}>
                        {loading && (
                            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)', fontSize: 13 }}>
                                Loading repositories...
                            </div>
                        )}
                        {!loading && filtered.length === 0 && (
                            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)', fontSize: 13 }}>
                                No repositories found
                            </div>
                        )}
                        {!loading && filtered.map(repo => (
                            <div
                                key={repo.id}
                                onClick={() => { setSelected(repo); setDeploySuccess(null); }}
                                style={{
                                    padding: '12px 14px',
                                    borderRadius: 10,
                                    marginBottom: 4,
                                    cursor: 'pointer',
                                    border: `1px solid ${selected?.id === repo.id ? '#818cf8' : 'transparent'}`,
                                    background: selected?.id === repo.id ? 'rgba(129,140,248,0.08)' : 'rgba(15,23,42,0.3)',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: selected?.id === repo.id ? '#818cf8' : '#e2e8f0' }}>
                                        {repo.name}
                                    </span>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11, color: 'var(--text-secondary)' }}>
                                        {repo.private && (
                                            <span style={{ padding: '1px 5px', borderRadius: 4, background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
                                                Private
                                            </span>
                                        )}
                                        {repo.language && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: LANGUAGE_COLORS[repo.language] || '#8b949e', display: 'inline-block' }} />
                                                {repo.language}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {repo.description && (
                                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {repo.description}
                                    </p>
                                )}
                                <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
                                    <span>⭐ {repo.stars}</span>
                                    <span>🌿 {repo.defaultBranch}</span>
                                    <span>{new Date(repo.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Repo detail */}
                {!selected ? (
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        <span style={{ fontSize: 40 }}>📂</span>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Select a repository to view details</p>
                    </div>
                ) : (
                    <div className="glass-card" style={{ padding: 28, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {/* Repo name + link */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <h2 style={{ fontSize: 20, fontWeight: 700 }}>
                                    <span className="gradient-text">{selected.name}</span>
                                </h2>
                                <a href={selected.url} target="_blank" rel="noreferrer" style={{
                                    display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
                                    color: 'var(--text-secondary)', textDecoration: 'none',
                                    padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border-color)',
                                    background: 'rgba(30,41,59,0.5)',
                                }}>
                                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                                    </svg>
                                    View on GitHub
                                </a>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                                {selected.description || 'No description'}
                            </p>
                        </div>

                        {/* Meta badges */}
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            {[
                                { icon: '🔀', label: selected.defaultBranch, color: '#34d399' },
                                { icon: '⭐', label: `${selected.stars} stars`, color: '#fbbf24' },
                                { icon: '🔒', label: selected.private ? 'Private' : 'Public', color: selected.private ? '#f87171' : '#34d399' },
                                ...(selected.language ? [{ icon: '●', label: selected.language, color: LANGUAGE_COLORS[selected.language] || '#8b949e' }] : []),
                            ].map(badge => (
                                <span key={badge.label} style={{
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                                    background: badge.color + '15',
                                    border: `1px solid ${badge.color}30`,
                                    color: badge.color,
                                }}>
                                    <span style={{ fontSize: 10 }}>{badge.icon}</span>
                                    {badge.label}
                                </span>
                            ))}
                        </div>

                        {/* Full name */}
                        <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(15,23,42,0.5)', border: '1px solid var(--border-color)', fontFamily: 'monospace', fontSize: 13 }}>
                            {selected.fullName}
                        </div>

                        <div style={{ height: 1, background: 'var(--border-color)' }} />

                        {/* Deploy section */}
                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>🚀 Deploy this repository</h3>

                            {deploySuccess && (
                                <div style={{
                                    padding: '12px 16px', borderRadius: 8, marginBottom: 16,
                                    background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)',
                                    color: '#34d399', fontSize: 13, fontWeight: 600,
                                }}>
                                    ✅ Deployment started! ID: <span style={{ fontFamily: 'monospace' }}>{deploySuccess}</span>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>Region</label>
                                    <select className="input-field" value={deployConfig.region}
                                        onChange={e => setDeployConfig({ ...deployConfig, region: e.target.value })}>
                                        <option value="us-east-1">US East (N. Virginia)</option>
                                        <option value="eu-west-1">EU West (Ireland)</option>
                                        <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>Environment</label>
                                    <select className="input-field" value={deployConfig.environment}
                                        onChange={e => setDeployConfig({ ...deployConfig, environment: e.target.value })}>
                                        <option value="production">Production</option>
                                        <option value="staging">Staging</option>
                                        <option value="development">Development</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>Budget ($)</label>
                                <input className="input-field" type="number" value={deployConfig.budget}
                                    onChange={e => setDeployConfig({ ...deployConfig, budget: Number(e.target.value) })} />
                            </div>

                            {/* Summary box */}
                            <div style={{
                                padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(129,140,248,0.25)',
                                background: 'rgba(129,140,248,0.05)', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16,
                                lineHeight: 1.8,
                            }}>
                                <div>📂 <strong>{selected.fullName}</strong></div>
                                <div>🌿 Branch: <strong>{selected.defaultBranch}</strong></div>
                                <div>🌍 Region: <strong>{deployConfig.region}</strong></div>
                                <div>🏷️ Environment: <strong>{deployConfig.environment}</strong></div>
                                <div>💰 Budget: <strong>${deployConfig.budget}</strong></div>
                            </div>

                            <button
                                className="btn-primary"
                                onClick={handleDeploy}
                                disabled={deploying}
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                {deploying ? '⏳ Deploying...' : `🚀 Deploy ${selected.name}`}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
