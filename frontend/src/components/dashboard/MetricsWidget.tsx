'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

function generateTokenData() {
  const now = Date.now();
  return Array.from({ length: 12 }, (_, i) => ({
    time: new Date(now - (11 - i) * 60_000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    tokens: Math.floor(800 + Math.random() * 1200),
  }));
}

const AGENT_COMPUTE = [
  { name: 'Infra', value: 38, fill: '#818cf8' },
  { name: 'Pipeline', value: 28, fill: '#34d399' },
  { name: 'FinOps', value: 18, fill: '#fbbf24' },
  { name: 'SRE', value: 16, fill: '#f87171' },
];

export default function MetricsWidget() {
  const [tokenData, setTokenData] = useState(generateTokenData);

  useEffect(() => {
    const id = setInterval(() => setTokenData(generateTokenData()), 8000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>📊 Live Observability</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Token Usage Line Chart */}
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Token Usage (live)</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={tokenData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid rgba(0,255,200,0.2)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Line type="monotone" dataKey="tokens" stroke="#00ffc8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Compute Distribution Bar Chart */}
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Compute Distribution</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={AGENT_COMPUTE} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} unit="%" />
              <YAxis type="category" dataKey="name" tick={{ fill: '#e2e8f0', fontSize: 11 }} width={60} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid rgba(0,255,200,0.2)', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
