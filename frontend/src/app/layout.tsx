import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
    title: 'Mission Control — Autonomous DevOps Platform',
    description: 'Enterprise-grade autonomous DevOps platform with multi-agent architecture',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark">
            <body>
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
