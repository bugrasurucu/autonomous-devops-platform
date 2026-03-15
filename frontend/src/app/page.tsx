'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            router.replace(user ? '/dashboard' : '/login');
        }
    }, [user, loading, router]);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: 'var(--bg-primary)',
        }}>
            <div className="gradient-text" style={{ fontSize: 24, fontWeight: 700 }}>
                Loading...
            </div>
        </div>
    );
}
