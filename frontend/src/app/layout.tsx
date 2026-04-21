import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
    title: 'Orbitron — Autonomous DevOps Platform',
    description: 'Your infrastructure, in orbit. Enterprise-grade autonomous DevOps platform with AI-powered multi-agent architecture — deploy, monitor, optimize, and self-heal your cloud infrastructure.',
    keywords: ['DevOps', 'SaaS', 'AI', 'automation', 'cloud', 'Kubernetes', 'kagent', 'self-healing', 'FinOps', 'Orbitron'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark">
            <body>
                <AuthProvider>
                    <ToastProvider>{children}</ToastProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
