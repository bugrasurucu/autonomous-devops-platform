'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface CommandItem {
    id: string;
    label: string;
    icon: string;
    category: string;
    href?: string;
    action?: () => void;
    keywords?: string[];
}

const COMMANDS: CommandItem[] = [
    // Navigation
    { id: 'nav-dashboard', label: 'Dashboard', icon: '⬡', category: 'Navigation', href: '/dashboard', keywords: ['home', 'main', 'overview'] },
    { id: 'nav-deployments', label: 'Deployments', icon: '🚀', category: 'Navigation', href: '/dashboard/deployments', keywords: ['deploy', 'release', 'ship'] },
    { id: 'nav-agents', label: 'AI Agents', icon: '⟁', category: 'Navigation', href: '/dashboard/agents', keywords: ['ai', 'bot', 'infra', 'finops', 'sre', 'pipeline'] },
    { id: 'nav-repos', label: 'Repositories', icon: '⌥', category: 'Navigation', href: '/dashboard/repositories', keywords: ['github', 'repo', 'git', 'code'] },
    { id: 'nav-pipeline', label: 'Pipeline', icon: '▸▸', category: 'Navigation', href: '/dashboard/pipeline', keywords: ['ci', 'cd', 'build', 'test'] },
    { id: 'nav-finops', label: 'FinOps', icon: '◈', category: 'Navigation', href: '/dashboard/finops', keywords: ['cost', 'money', 'budget', 'pricing'] },
    { id: 'nav-self-healing', label: 'Self-Healing', icon: '↻', category: 'Navigation', href: '/dashboard/self-healing', keywords: ['heal', 'incident', 'alert', 'monitor'] },
    { id: 'nav-token-usage', label: 'Token Usage', icon: '⬡', category: 'Navigation', href: '/dashboard/token-usage', keywords: ['token', 'usage', 'api', 'llm'] },
    { id: 'nav-team', label: 'Team', icon: '⊞', category: 'Navigation', href: '/dashboard/team', keywords: ['team', 'members', 'invite', 'org'] },
    { id: 'nav-billing', label: 'Billing', icon: '◎', category: 'Navigation', href: '/dashboard/billing', keywords: ['billing', 'plan', 'subscription', 'payment'] },
    { id: 'nav-settings', label: 'Settings', icon: '⚙', category: 'Navigation', href: '/dashboard/settings', keywords: ['settings', 'config', 'profile', 'api key'] },

    // Quick Actions
    { id: 'act-deploy', label: 'New Deployment', icon: '🚀', category: 'Actions', keywords: ['deploy', 'new', 'create', 'launch'] },
    { id: 'act-incident', label: 'Simulate Incident', icon: '🔥', category: 'Actions', href: '/dashboard/self-healing', keywords: ['incident', 'simulate', 'test', 'alert'] },
    { id: 'act-trigger-infra', label: 'Trigger Infra Agent', icon: '🏗️', category: 'Actions', href: '/dashboard/agents', keywords: ['infra', 'terraform', 'aws', 'cloud'] },
    { id: 'act-trigger-finops', label: 'Trigger FinOps Agent', icon: '💰', category: 'Actions', href: '/dashboard/agents', keywords: ['finops', 'cost', 'optimize'] },
    { id: 'act-trigger-pipeline', label: 'Trigger Pipeline Agent', icon: '🔄', category: 'Actions', href: '/dashboard/agents', keywords: ['pipeline', 'ci', 'cd', 'build'] },
    { id: 'act-trigger-sre', label: 'Trigger SRE Agent', icon: '🛡️', category: 'Actions', href: '/dashboard/agents', keywords: ['sre', 'monitor', 'health', 'heal'] },

    // External
    { id: 'ext-prometheus', label: 'Open Prometheus', icon: '📊', category: 'External', keywords: ['prometheus', 'metrics', 'monitoring'] },
    { id: 'ext-grafana', label: 'Open Grafana', icon: '📈', category: 'External', keywords: ['grafana', 'dashboard', 'charts'] },
    { id: 'ext-rabbitmq', label: 'Open RabbitMQ', icon: '🐇', category: 'External', keywords: ['rabbitmq', 'queue', 'messages'] },
];

function fuzzyMatch(text: string, query: string): boolean {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    
    // Direct substring match
    if (lowerText.includes(lowerQuery)) return true;
    
    // Fuzzy character-by-character match
    let qi = 0;
    for (let ti = 0; ti < lowerText.length && qi < lowerQuery.length; ti++) {
        if (lowerText[ti] === lowerQuery[qi]) qi++;
    }
    return qi === lowerQuery.length;
}

function filterCommands(query: string): CommandItem[] {
    if (!query.trim()) return COMMANDS;
    
    return COMMANDS.filter(cmd => {
        if (fuzzyMatch(cmd.label, query)) return true;
        if (fuzzyMatch(cmd.category, query)) return true;
        if (cmd.keywords?.some(kw => fuzzyMatch(kw, query))) return true;
        return false;
    });
}

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const filtered = filterCommands(query);

    // Global keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus input on open
    useEffect(() => {
        if (open) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    // Scroll selected item into view
    useEffect(() => {
        if (listRef.current) {
            const selected = listRef.current.children[selectedIndex] as HTMLElement;
            selected?.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    const executeCommand = useCallback((cmd: CommandItem) => {
        setOpen(false);
        if (cmd.href) {
            router.push(cmd.href);
        } else if (cmd.action) {
            cmd.action();
        } else if (cmd.id === 'ext-prometheus') {
            window.open('http://localhost:9090', '_blank');
        } else if (cmd.id === 'ext-grafana') {
            window.open('http://localhost:3002', '_blank');
        } else if (cmd.id === 'ext-rabbitmq') {
            window.open('http://localhost:15672', '_blank');
        }
    }, [router]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (filtered[selectedIndex]) {
                    executeCommand(filtered[selectedIndex]);
                }
                break;
        }
    };

    // Reset selection when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    if (!open) return null;

    // Group by category
    const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
        if (!acc[cmd.category]) acc[cmd.category] = [];
        acc[cmd.category].push(cmd);
        return acc;
    }, {});

    let flatIndex = -1;

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                paddingTop: '15vh',
                animation: 'fadeIn 0.15s ease-out',
            }}
            onClick={e => e.target === e.currentTarget && setOpen(false)}
        >
            <div
                style={{
                    width: 560, maxWidth: '90vw',
                    background: 'rgba(10, 22, 40, 0.98)',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                    borderRadius: 16,
                    boxShadow: '0 32px 64px rgba(0,0,0,0.5), 0 0 48px rgba(0,212,255,0.08)',
                    overflow: 'hidden',
                    animation: 'slideUp 0.2s ease-out',
                }}
            >
                {/* Search input */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(0,212,255,0.1)',
                }}>
                    <span style={{ fontSize: 18, color: 'var(--accent)', opacity: 0.6 }}>⌘</span>
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search commands, pages, actions..."
                        style={{
                            flex: 1, background: 'none', border: 'none',
                            color: 'var(--text-primary)', fontSize: 16,
                            outline: 'none', fontFamily: 'inherit',
                        }}
                    />
                    <kbd style={{
                        fontSize: 11, padding: '3px 8px', borderRadius: 6,
                        background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)',
                        color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace',
                    }}>ESC</kbd>
                </div>

                {/* Results */}
                <div ref={listRef} style={{
                    maxHeight: 380, overflowY: 'auto',
                    padding: '8px 0',
                }}>
                    {filtered.length === 0 ? (
                        <div style={{
                            padding: '32px 20px', textAlign: 'center',
                            color: 'var(--text-muted)', fontSize: 14,
                        }}>
                            No results found for &ldquo;{query}&rdquo;
                        </div>
                    ) : (
                        Object.entries(grouped).map(([category, items]) => (
                            <div key={category}>
                                <div style={{
                                    padding: '8px 20px 4px',
                                    fontSize: 11, fontWeight: 600,
                                    color: 'var(--text-muted)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}>
                                    {category}
                                </div>
                                {items.map(cmd => {
                                    flatIndex++;
                                    const isSelected = flatIndex === selectedIndex;
                                    const thisIndex = flatIndex;
                                    return (
                                        <div
                                            key={cmd.id}
                                            onClick={() => executeCommand(cmd)}
                                            onMouseEnter={() => setSelectedIndex(thisIndex)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 12,
                                                padding: '10px 20px',
                                                cursor: 'pointer',
                                                background: isSelected ? 'rgba(0,212,255,0.08)' : 'transparent',
                                                borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                                                transition: 'all 0.1s ease',
                                            }}
                                        >
                                            <span style={{
                                                fontSize: 16, width: 28, textAlign: 'center',
                                                opacity: isSelected ? 1 : 0.6,
                                            }}>
                                                {cmd.icon}
                                            </span>
                                            <span style={{
                                                flex: 1, fontSize: 14,
                                                color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                fontWeight: isSelected ? 500 : 400,
                                            }}>
                                                {cmd.label}
                                            </span>
                                            {cmd.href && (
                                                <span style={{
                                                    fontSize: 10, color: 'var(--text-muted)',
                                                    fontFamily: 'JetBrains Mono, monospace',
                                                }}>
                                                    {cmd.href}
                                                </span>
                                            )}
                                            {isSelected && (
                                                <kbd style={{
                                                    fontSize: 10, padding: '2px 6px', borderRadius: 4,
                                                    background: 'rgba(0,212,255,0.1)',
                                                    border: '1px solid rgba(0,212,255,0.15)',
                                                    color: 'var(--accent)',
                                                    fontFamily: 'JetBrains Mono, monospace',
                                                }}>↵</kbd>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '10px 20px',
                    borderTop: '1px solid rgba(0,212,255,0.1)',
                    fontSize: 11, color: 'var(--text-muted)',
                }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <kbd style={{ padding: '1px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>↑↓</kbd>
                        Navigate
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <kbd style={{ padding: '1px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>↵</kbd>
                        Select
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <kbd style={{ padding: '1px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>esc</kbd>
                        Close
                    </span>
                </div>
            </div>
        </div>
    );
}
