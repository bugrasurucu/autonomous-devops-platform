const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = 'ApiError';
    }
}

async function request(url: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    let res: Response;
    try {
        res = await fetch(`${API_BASE}${url}`, { ...options, headers });
    } catch (err) {
        throw new ApiError('Network error — server unreachable', 0);
    }

    if (res.status === 401) {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        throw new ApiError('Session expired', 401);
    }

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new ApiError(data.message || data.error || `Request failed: ${res.status}`, res.status);
    }

    return res.json();
}

export const api = {
    // Auth
    register: (data: { email: string; password: string; name: string }) =>
        request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

    login: (data: { email: string; password: string }) =>
        request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

    getMe: () => request('/auth/me'),

    updateProfile: (data: { name?: string; company?: string }) =>
        request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

    upgradePlan: (plan: string) =>
        request('/auth/plan', { method: 'PUT', body: JSON.stringify({ plan }) }),

    // Stats
    getStats: () => request('/stats'),

    // Agents
    getAgents: () => request('/agents'),
    getAgent: (id: string) => request(`/agents/${id}`),
    triggerAgent: (id: string, task?: string) =>
        request(`/agents/${id}/trigger`, { method: 'POST', body: JSON.stringify({ task }) }),
    completeAgent: (id: string, output?: string, success?: boolean) =>
        request(`/agents/${id}/complete`, { method: 'POST', body: JSON.stringify({ output, success }) }),

    // Deployments
    deploy: (data: { projectName: string; region?: string; environment?: string; budget?: number }) =>
        request('/deploy', { method: 'POST', body: JSON.stringify(data) }),
    getDeployments: (limit?: number) => request(`/deployments?limit=${limit || 20}`),

    // FinOps
    getFinOps: () => request('/finops'),

    // Incidents
    getIncidents: (limit?: number) => request(`/incidents?limit=${limit || 20}`),
    resolveIncident: (id: string, resolution?: string) =>
        request(`/incidents/${id}/resolve`, { method: 'POST', body: JSON.stringify({ resolution }) }),
    simulateIncident: () =>
        request('/incidents/simulate', { method: 'POST' }),
    createIncident: (title: string, description?: string, severity?: string) =>
        request('/incidents', { method: 'POST', body: JSON.stringify({ title, description, severity }) }),

    // Settings
    getModels: () => request('/settings/models'),
    getAgentModels: () => request('/settings/agent-models'),
    updateAgentModel: (agentId: string, data: any) =>
        request(`/settings/agent-models/${agentId}`, { method: 'PUT', body: JSON.stringify(data) }),
    getApiKeys: () => request('/settings/api-keys'),
    createApiKey: (data: { provider: string; key: string; label?: string }) =>
        request('/settings/api-keys', { method: 'POST', body: JSON.stringify(data) }),
    deleteApiKey: (id: string) =>
        request(`/settings/api-keys/${id}`, { method: 'DELETE' }),
    getUsage: () => request('/settings/usage'),

    // GitHub Integration
    github: {
        getOAuthUrl: () => request('/github/oauth-url'),
        getStatus: () => request('/github/status'),
        listRepos: (search?: string) => request(`/github/repos${search ? `?search=${encodeURIComponent(search)}` : ''}`),
        disconnect: () => request('/github/disconnect', { method: 'DELETE' }),
    },

    // Cost Monitor
    cost: {
        getTiers: () => request('/cost/tiers'),
        getFreeTier: () => request('/cost/free-tier'),
        getEstimates: () => request('/cost/estimates'),
        getUsage: () => request('/cost/usage'),
        getMetrics: () => request('/cost/metrics'),
        getSuggestions: () => request('/cost/suggestions'),
        getScalingHistory: () => request('/cost/scaling/history'),
        scale: (action: string) => request('/cost/scale', { method: 'POST', body: JSON.stringify({ action }) }),
    },

    // Agent executions
    getAgentExecutions: (agentId: string, limit?: number) =>
        request(`/agents/${agentId}/executions?limit=${limit || 10}`),
    getAgentExecutionSteps: (agentId: string, execId: string) =>
        request(`/agents/${agentId}/executions/${execId}`),

    // Errors
    getErrors: (count?: number) => request(`/errors?count=${count || 20}`),
    clearErrors: () => request('/errors', { method: 'DELETE' }),

    // Token Usage
    getTokenUsage: () => request('/token-usage'),

    // Tenants / Team
    tenant: {
        getMe: () => request('/tenants/me'),
        getMembers: (orgId: string) => request(`/tenants/${orgId}/members`),
        invite: (orgId: string, userId: string, role: string) =>
            request(`/tenants/${orgId}/members`, { method: 'POST', body: JSON.stringify({ userId, role }) }),
        remove: (orgId: string, userId: string) =>
            request(`/tenants/${orgId}/members/${userId}`, { method: 'DELETE' }),
    },

    // Billing
    billing: {
        getPlans: () => request('/billing/plans'),
        checkout: (plan: string, returnUrl: string) =>
            request('/billing/checkout', { method: 'POST', body: JSON.stringify({ plan, returnUrl }) }),
        portal: (returnUrl: string) =>
            request('/billing/portal', { method: 'POST', body: JSON.stringify({ returnUrl }) }),
    },

    // kagent / K8s status
    kagent: {
        getStatus: () => request('/kagent/status'),
    },
};

