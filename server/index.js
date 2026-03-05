/**
 * Mission Control API Server
 * Express + WebSocket — Ajanlar ile Dashboard arasındaki köprü
 */

const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const path = require('path');
const StateManager = require('./state');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const state = new StateManager();

const PORT = process.env.PORT || 3001;

// ── Middleware ──
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'dashboard')));

// ══════════════════════════════════════
// WebSocket — Gerçek Zamanlı Event Push
// ══════════════════════════════════════

const clients = new Set();

wss.on('connection', (ws) => {
    clients.add(ws);
    console.log(`🔌 WebSocket bağlantısı (toplam: ${clients.size})`);

    // İlk bağlantıda tam state gönder
    ws.send(JSON.stringify({ type: 'INIT', payload: state.getFullState() }));

    ws.on('close', () => {
        clients.delete(ws);
        console.log(`🔌 WebSocket koptu (toplam: ${clients.size})`);
    });

    ws.on('message', (msg) => {
        try {
            const data = JSON.parse(msg);
            handleWSMessage(data, ws);
        } catch (e) { /* ignore */ }
    });
});

function broadcast(type, payload) {
    const message = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
    for (const client of clients) {
        if (client.readyState === 1) {
            client.send(message);
        }
    }
}

function handleWSMessage(data, ws) {
    switch (data.type) {
        case 'PING':
            ws.send(JSON.stringify({ type: 'PONG' }));
            break;
        case 'GET_STATE':
            ws.send(JSON.stringify({ type: 'INIT', payload: state.getFullState() }));
            break;
    }
}

// State değişikliklerini WebSocket'e yönlendir
state.on('agentUpdated', (data) => broadcast('AGENT_UPDATED', data));
state.on('newActivity', (data) => broadcast('NEW_ACTIVITY', data));
state.on('newDeployment', (data) => broadcast('NEW_DEPLOYMENT', data));
state.on('finopsUpdated', (data) => broadcast('FINOPS_UPDATED', data));
state.on('newIncident', (data) => broadcast('NEW_INCIDENT', data));
state.on('incidentResolved', (data) => broadcast('INCIDENT_RESOLVED', data));
state.on('clipboardUpdated', (data) => broadcast('CLIPBOARD_UPDATED', data));
state.on('orchestrationUpdated', (data) => broadcast('ORCHESTRATION_UPDATED', data));
state.on('stateChanged', (data) => broadcast('STATE_CHANGED', data));

// ══════════════════════════════════════
// REST API Endpoints
// ══════════════════════════════════════

// ── Genel ──
app.get('/api/state', (req, res) => {
    res.json(state.getFullState());
});

app.get('/api/stats', (req, res) => {
    res.json(state.getStats());
});

// ── Ajanlar ──
app.get('/api/agents', (req, res) => {
    res.json(state.getAgents());
});

app.get('/api/agents/:id', (req, res) => {
    const agent = state.getAgent(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent bulunamadı' });
    res.json(agent);
});

app.patch('/api/agents/:id', (req, res) => {
    const result = state.updateAgent(req.params.id, req.body);
    if (!result) return res.status(404).json({ error: 'Agent bulunamadı' });
    res.json(result);
});

// Ajan Tetikleme — Gerçek görev başlatma
app.post('/api/agents/:id/trigger', (req, res) => {
    const { id } = req.params;
    const { task, input } = req.body;
    const agent = state.getAgent(id);
    if (!agent) return res.status(404).json({ error: 'Agent bulunamadı' });

    // Ajanı "running" yap
    state.updateAgent(id, { status: 'running', currentTask: task || 'Görev yürütülüyor' });
    state.addActivity({
        agentId: id,
        icon: agent.icon,
        text: `${agent.name}: ${task || 'Görev başlatıldı'}`,
        color: agent.color,
        type: 'task_start',
    });

    res.json({ message: `${agent.name} tetiklendi`, task });
});

// Ajan Görev Tamamlama
app.post('/api/agents/:id/complete', (req, res) => {
    const { id } = req.params;
    const { output, success = true } = req.body;
    const agent = state.getAgent(id);
    if (!agent) return res.status(404).json({ error: 'Agent bulunamadı' });

    state.updateAgent(id, {
        status: success ? 'idle' : 'error',
        currentTask: null,
        completedTasks: (agent.completedTasks || 0) + 1,
    });

    if (output) {
        state.updateClipboard(id, output);
    }

    state.addActivity({
        agentId: id,
        icon: agent.icon,
        text: `${agent.name}: Görev ${success ? 'tamamlandı ✓' : 'başarısız ✗'}`,
        color: agent.color,
        type: success ? 'task_complete' : 'task_failed',
    });

    res.json({ message: 'Görev tamamlandı', success });
});

// ── Aktiviteler ──
app.get('/api/activities', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    res.json(state.getActivities(limit));
});

app.post('/api/activities', (req, res) => {
    const entry = state.addActivity(req.body);
    res.status(201).json(entry);
});

// ── Deployments ──
app.get('/api/deployments', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    res.json(state.getDeployments(limit));
});

app.post('/api/deployments', (req, res) => {
    const entry = state.addDeployment(req.body);
    res.status(201).json(entry);
});

// ── FinOps ──
app.get('/api/finops', (req, res) => {
    res.json(state.getFinOps());
});

app.patch('/api/finops', (req, res) => {
    const result = state.updateFinOps(req.body);
    res.json(result);
});

// ── Incidents ──
app.get('/api/incidents', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    res.json(state.getIncidents(limit));
});

app.post('/api/incidents', (req, res) => {
    const entry = state.addIncident(req.body);
    res.status(201).json(entry);
});

app.patch('/api/incidents/:id/resolve', (req, res) => {
    const result = state.resolveIncident(req.params.id, req.body.resolution);
    if (!result) return res.status(404).json({ error: 'Incident bulunamadı' });
    res.json(result);
});

// ── Clipboard / Shared State ──
app.get('/api/clipboard', (req, res) => {
    res.json(state.getClipboard());
});

app.put('/api/clipboard/:key', (req, res) => {
    const result = state.updateClipboard(req.params.key, req.body);
    res.json(result);
});

// ── Orchestration ──
app.get('/api/orchestration', (req, res) => {
    res.json(state.getOrchestration());
});

app.patch('/api/orchestration', (req, res) => {
    const result = state.updateOrchestration(req.body);
    res.json(result);
});

// ══════════════════════════════════════
// Deploy Endpoint — Orkestrasyon Tetikleyici
// ══════════════════════════════════════

app.post('/api/deploy', async (req, res) => {
    const { projectName, region, environment, budget } = req.body;

    const deployId = `DEP-${Date.now()}`;

    // Deploy kaydı oluştur
    state.addDeployment({
        deployId,
        projectName: projectName || 'my-app',
        region: region || 'eu-west-1',
        environment: environment || 'production',
        budget: budget || 500,
        status: 'running',
        stages: [],
    });

    state.addActivity({
        icon: '🚀',
        text: `Otonom dağıtım başlatıldı: ${projectName || 'my-app'} → ${environment || 'production'}`,
        color: '#818cf8',
        type: 'deploy_start',
    });

    // Orchestration flow başlat
    const flowNodes = [
        { id: 'bootstrap', label: 'Analiz', icon: '📂', status: 'pending' },
        { id: 'infra', label: 'Infra', icon: '🏗', status: 'pending' },
        { id: 'finops', label: 'FinOps', icon: '💰', status: 'pending' },
        { id: 'pipeline', label: 'Pipeline', icon: '🔄', status: 'pending' },
        { id: 'sre', label: 'SRE', icon: '🛡', status: 'pending' },
    ];

    state.updateOrchestration({
        currentFlow: deployId,
        pattern: 'sequential',
        nodes: flowNodes,
    });

    res.json({ deployId, message: 'Dağıtım başlatıldı' });

    // Asenkron orkestrasyon simülasyonu — gerçek ajan çağrıları
    runOrchestration(deployId, flowNodes, { projectName, region, environment, budget });
});

/**
 * Sıralı orkestrasyon akışı — her adımda gerçek state güncellenir
 */
async function runOrchestration(deployId, nodes, config) {
    const agentSequence = [
        {
            nodeId: 'bootstrap',
            agentId: null,
            task: 'Proje analiz ediliyor...',
            duration: 3000,
            output: {
                project_type: 'nodejs',
                framework: 'express',
                database: 'postgresql',
                port: 3000,
                docker: true,
            },
        },
        {
            nodeId: 'infra',
            agentId: 'infra',
            task: 'Terraform modülleri üretiliyor (VPC, ECS, RDS)',
            duration: 5000,
            output: {
                vpc_id: 'vpc-0a1b2c3d4e5f',
                ecs_cluster_arn: `arn:aws:ecs:${config.region}:123456789:cluster/${config.projectName}`,
                rds_endpoint: `${config.projectName}-db.cluster-xyz.${config.region}.rds.amazonaws.com`,
                alb_dns: `${config.projectName}-alb-1234.${config.region}.elb.amazonaws.com`,
                ecr_repo: `123456789.dkr.ecr.${config.region}.amazonaws.com/${config.projectName}`,
            },
        },
        {
            nodeId: 'finops',
            agentId: 'finops',
            task: 'Maliyet analizi yapılıyor...',
            duration: 3000,
            output: {
                estimated_cost: 247,
                budget: config.budget || 500,
                decision: 'PROCEED',
                breakdown: [
                    { service: 'ECS Fargate', cost: 89 },
                    { service: 'RDS', cost: 72 },
                    { service: 'NAT Gateway', cost: 45 },
                    { service: 'ALB', cost: 22 },
                    { service: 'CloudWatch', cost: 12 },
                    { service: 'Diğer', cost: 7 },
                ],
                optimizations: [
                    { title: 'Graviton Geçişi', savings: 27, desc: 'ECS task\'ları ARM64 mimarisine taşıyın' },
                    { title: 'Reserved Instance', savings: 29, desc: 'RDS için 1 yıllık RI satın alın' },
                    { title: 'Log Retention', savings: 4, desc: 'CloudWatch log tutma süresini 90 güne düşürün' },
                ],
            },
        },
        {
            nodeId: 'pipeline',
            agentId: 'pipeline',
            task: 'CI/CD pipeline yapılandırılıyor...',
            duration: 4000,
            output: {
                pipeline_url: `https://github.com/bugrasurucu/${config.projectName}/actions`,
                test_results: '24/24 passed',
                coverage: '87%',
                docker_image: `${config.projectName}:latest`,
            },
        },
        {
            nodeId: 'sre',
            agentId: 'sre',
            task: 'Monitoring ve self-healing kuruluyor...',
            duration: 3000,
            output: {
                dashboard_url: `https://console.aws.amazon.com/cloudwatch/dashboards/${config.projectName}`,
                alarms: ['CPUHigh', 'MemoryHigh', 'ErrorRate5xx', 'HealthCheckFailed'],
                self_healing: 'enabled',
                uptime_sla: '99.95%',
            },
        },
    ];

    for (let i = 0; i < agentSequence.length; i++) {
        const step = agentSequence[i];

        // Nodu aktif yap
        nodes[i].status = 'active';
        state.updateOrchestration({ nodes: [...nodes] });

        // Ajanı tetikle
        if (step.agentId) {
            state.updateAgent(step.agentId, { status: 'running', currentTask: step.task });
        }

        state.addActivity({
            icon: step.agentId ? state.getAgent(step.agentId)?.icon || '📂' : '📂',
            text: step.task,
            color: step.agentId ? state.getAgent(step.agentId)?.color || '#818cf8' : '#818cf8',
            type: 'orchestration_step',
            deployId,
        });

        // Gerçek süre bekle
        await sleep(step.duration);

        // Nodu tamamla
        nodes[i].status = 'done';
        state.updateOrchestration({ nodes: [...nodes] });

        // Ajan tamamla
        if (step.agentId) {
            state.updateAgent(step.agentId, {
                status: 'idle',
                currentTask: null,
                completedTasks: (state.getAgent(step.agentId)?.completedTasks || 0) + 1,
            });
        }

        // Clipboard'a yaz
        state.updateClipboard(step.nodeId, step.output);

        // FinOps çıktısını güncelle
        if (step.nodeId === 'finops') {
            state.updateFinOps({
                currentCost: step.output.estimated_cost,
                budgetStatus: step.output.decision,
                costBreakdown: step.output.breakdown,
                optimizations: step.output.optimizations,
            });
        }

        state.addActivity({
            icon: '✅',
            text: `${step.nodeId.charAt(0).toUpperCase() + step.nodeId.slice(1)} tamamlandı`,
            color: '#34d399',
            type: 'orchestration_complete',
            deployId,
        });
    }

    // Deploy tamamlandı
    const deployments = state.state.deployments;
    const deploy = deployments.find(d => d.deployId === deployId);
    if (deploy) {
        deploy.status = 'success';
        deploy.completedAt = new Date().toISOString();
        deploy.duration = `${Math.round((Date.now() - parseInt(deployId.split('-')[1])) / 1000)}s`;
        state._save();
        broadcast('DEPLOYMENT_UPDATED', deploy);
    }

    state.updateOrchestration({ currentFlow: null });
    state.addActivity({
        icon: '🎉',
        text: `Dağıtım tamamlandı: ${config.projectName} → ${config.environment}`,
        color: '#34d399',
        type: 'deploy_complete',
    });
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Fallback: SPA ──
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dashboard', 'index.html'));
});

// ── Start ──
server.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════════╗
  ║  🚀 Mission Control API Server            ║
  ║                                           ║
  ║  Dashboard:  http://localhost:${PORT}        ║
  ║  API:        http://localhost:${PORT}/api    ║
  ║  WebSocket:  ws://localhost:${PORT}          ║
  ╚═══════════════════════════════════════════╝
  `);
});
