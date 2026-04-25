/**
 * Animated loading skeleton — replaces "Loading..." text with
 * pulsing placeholder blocks that match the page layout.
 */

export function LoadingSkeleton({ rows = 3, showHeader = true }: { rows?: number; showHeader?: boolean }) {
    return (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {showHeader && (
                <div style={{ marginBottom: 24 }}>
                    <div style={{ ...shimmer, width: 200, height: 24, borderRadius: 8, marginBottom: 8 }} />
                    <div style={{ ...shimmer, width: 320, height: 14, borderRadius: 6 }} />
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="glass-card" style={{ padding: 20 }}>
                        <div style={{ ...shimmer, width: '60%', height: 12, borderRadius: 4, marginBottom: 10 }} />
                        <div style={{ ...shimmer, width: '40%', height: 28, borderRadius: 6 }} />
                    </div>
                ))}
            </div>

            <div className="glass-card" style={{ padding: 20 }}>
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 0',
                        borderBottom: i < rows - 1 ? '1px solid var(--border-color)' : 'none',
                    }}>
                        <div style={{ ...shimmer, width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ ...shimmer, width: `${60 + Math.random() * 30}%`, height: 12, borderRadius: 4, marginBottom: 6 }} />
                            <div style={{ ...shimmer, width: `${30 + Math.random() * 20}%`, height: 10, borderRadius: 4 }} />
                        </div>
                        <div style={{ ...shimmer, width: 60, height: 24, borderRadius: 6 }} />
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes shimmerPulse {
                    0% { opacity: 0.3; }
                    50% { opacity: 0.6; }
                    100% { opacity: 0.3; }
                }
            `}</style>
        </div>
    );
}

const shimmer: React.CSSProperties = {
    background: 'linear-gradient(90deg, rgba(99,102,241,0.08), rgba(99,102,241,0.15), rgba(99,102,241,0.08))',
    animation: 'shimmerPulse 1.8s ease-in-out infinite',
};

/**
 * Simple centered spinner with text.
 */
export function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: '50vh', gap: 16,
        }}>
            <div style={{
                width: 36, height: 36, borderRadius: '50%',
                border: '3px solid rgba(0,212,255,0.15)',
                borderTopColor: '#00d4ff',
                animation: 'spin 0.8s linear infinite',
            }} />
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {text}
            </div>
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
