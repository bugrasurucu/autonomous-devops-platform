'use client';

import React, { Component, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * React Error Boundary — catches runtime errors in child components
 * and shows a recovery UI instead of crashing the whole page.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary]', error, info.componentStack);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div style={{
                    padding: 32,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 300,
                    gap: 16,
                }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: '50%',
                        background: 'rgba(248,113,113,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 24,
                    }}>
                        ⚠️
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#f87171', marginBottom: 6 }}>
                            Something went wrong
                        </div>
                        <div style={{
                            fontSize: 12, color: 'var(--text-secondary)',
                            maxWidth: 400, fontFamily: 'JetBrains Mono, monospace',
                            padding: '8px 12px', borderRadius: 8,
                            background: 'rgba(30,41,59,0.5)',
                            border: '1px solid var(--border-color)',
                            wordBreak: 'break-all',
                        }}>
                            {this.state.error?.message || 'Unknown error'}
                        </div>
                    </div>
                    <button
                        onClick={this.handleRetry}
                        className="btn-primary"
                        style={{ padding: '8px 20px', fontSize: 13 }}
                    >
                        ↻ Retry
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
