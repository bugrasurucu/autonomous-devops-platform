/**
 * Mission Control — Dashboard Client
 * API + WebSocket ile gerçek veri entegrasyonu
 */

// ══════════════════════════════════════
// API & WebSocket Connection
// ══════════════════════════════════════

const API_BASE = window.location.origin + '/api';
let ws = null;
let wsReconnectTimer = null;
let appState = {};
let isConnected = false;

function connectWebSocket() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${wsProtocol}//${window.location.host}`);

    ws.onopen = () => {
        isConnected = true;
        updateConnectionStatus(true);
        console.log('🔌 WebSocket bağlandı');
        clearTimeout(wsReconnectTimer);
    };

    ws.onclose = () => {
        isConnected = false;
        updateConnectionStatus(false);
        console.log('🔌 WebSocket koptu, yeniden bağlanılıyor...');
        wsReconnectTimer = setTimeout(connectWebSocket, 3000);
    };

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        handleWSMessage(msg);
    };

    ws.onerror = () => {
        ws.close();
    };
}

function handleWSMessage(msg) {
    switch (msg.type) {
        case 'INIT':
            appState = msg.payload;
            renderAll();
            break;
        case 'AGENT_UPDATED':
            if (appState.agents) appState.agents[msg.payload.id] = msg.payload;
            renderAgents();
            renderStats();
            break;
        case 'NEW_ACTIVITY':
            if (!appState.activities) appState.activities = [];
            appState.activities.unshift(msg.payload);
            renderActivityFeed();
            animatePulse();
            break;
        case 'NEW_DEPLOYMENT':
            if (!appState.deployments) appState.deployments = [];
            appState.deployments.unshift(msg.payload);
            renderDeployments();
            renderStats();
            break;
        case 'DEPLOYMENT_UPDATED':
            if (appState.deployments) {
                const idx = appState.deployments.findIndex(d => d.deployId === msg.payload.deployId);
                if (idx >= 0) appState.deployments[idx] = msg.payload;
            }
            renderDeployments();
            renderStats();
            break;
        case 'FINOPS_UPDATED':
            appState.finops = msg.payload;
            renderFinOps();
            renderStats();
            break;
        case 'NEW_INCIDENT':
            if (!appState.incidents) appState.incidents = [];
            appState.incidents.unshift(msg.payload);
            renderIncidents();
            renderStats();
            break;
        case 'INCIDENT_RESOLVED':
            if (appState.incidents) {
                const idx = appState.incidents.findIndex(i => i.id === msg.payload.id);
                if (idx >= 0) appState.incidents[idx] = msg.payload;
            }
            renderIncidents();
            break;
        case 'CLIPBOARD_UPDATED':
            if (!appState.clipboard) appState.clipboard = {};
            Object.assign(appState.clipboard, { [msg.payload.key]: { data: msg.payload.value } });
            renderClipboard();
            break;
        case 'ORCHESTRATION_UPDATED':
            appState.orchestration = msg.payload;
            renderOrchestrationFlow();
            break;
        case 'STATE_CHANGED':
            appState = { ...msg.payload, stats: msg.payload.stats };
            renderAll();
            break;
    }
}

async function apiFetch(endpoint, options = {}) {
    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            headers: { 'Content-Type': 'application/json' },
            ...options,
        });
        return await res.json();
    } catch (err) {
        console.error(`API error (${endpoint}):`, err);
        return null;
    }
}

// ══════════════════════════════════════
// Page Navigation
// ══════════════════════════════════════

let currentPage = 'dashboard';

function initNavigation() {
    document.querySelectorAll('.nav-item').forEach((item) => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            if (page) switchPage(page);
        });
    });

    // Mobile toggle
    const toggle = document.getElementById('sidebarToggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('open');
        });
    }
}

function switchPage(page) {
    currentPage = page;
    document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));

    const pageEl = document.getElementById(`page-${page}`);
    const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (pageEl) pageEl.classList.add('active');
    if (navEl) navEl.classList.add('active');

    // Sayfa geçişinde render
    renderCurrentPage();
}

function renderCurrentPage() {
    switch (currentPage) {
        case 'dashboard': renderDashboard(); break;
        case 'agents': renderAgentsPage(); break;
        case 'orchestration': renderOrchestrationPage(); break;
        case 'pipeline': renderPipelinePage(); break;
        case 'finops': renderFinOpsPage(); break;
        case 'selfheal': renderSelfHealPage(); break;
    }
}

// ══════════════════════════════════════
// Connection Status Indicator
// ══════════════════════════════════════

function updateConnectionStatus(connected) {
    let indicator = document.getElementById('connectionStatus');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'connectionStatus';
        indicator.style.cssText = `
      position: fixed; bottom: 16px; right: 16px; z-index: 1000;
      padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600;
      backdrop-filter: blur(12px); transition: all 0.3s;
    `;
        document.body.appendChild(indicator);
    }
    if (connected) {
        indicator.textContent = '🟢 Bağlı';
        indicator.style.background = 'rgba(52, 211, 153, 0.15)';
        indicator.style.color = '#34d399';
        indicator.style.border = '1px solid rgba(52, 211, 153, 0.3)';
    } else {
        indicator.textContent = '🔴 Bağlantı kesik';
        indicator.style.background = 'rgba(244, 63, 94, 0.15)';
        indicator.style.color = '#f43f5e';
        indicator.style.border = '1px solid rgba(244, 63, 94, 0.3)';
    }
}

function animatePulse() {
    const indicator = document.getElementById('connectionStatus');
    if (indicator) {
        indicator.style.transform = 'scale(1.1)';
        setTimeout(() => { indicator.style.transform = 'scale(1)'; }, 200);
    }
}

// ══════════════════════════════════════
// Render Functions
// ══════════════════════════════════════

function renderAll() {
    renderStats();
    renderAgents();
    renderActivityFeed();
    renderOrchestrationFlow();
    renderCurrentPage();
}

// ── Stats Cards ──
function renderStats() {
    const stats = appState.stats || {};
    const agents = appState.agents ? Object.values(appState.agents) : [];
    const activeCount = agents.filter(a => a.status !== 'idle').length;
    const totalDeploys = (appState.deployments || []).length;
    const successDeploys = (appState.deployments || []).filter(d => d.status === 'success').length;
    const cost = appState.finops?.currentCost || 0;
    const healEvents = (appState.incidents || []).length;

    setStatCard('stat-agents', `${activeCount}/${agents.length}`, 'Aktif Ajan');
    setStatCard('stat-deploys', `${successDeploys}`, 'Başarılı Deploy');
    setStatCard('stat-cost', `$${cost}`, 'Aylık Maliyet');
    setStatCard('stat-heal', `${healEvents}`, 'Self-Heal');
}

function setStatCard(id, value, label) {
    const el = document.getElementById(id);
    if (!el) return;
    const valEl = el.querySelector('.stat-value');
    const lblEl = el.querySelector('.stat-label');
    if (valEl) {
        const oldVal = valEl.textContent;
        valEl.textContent = value;
        if (oldVal !== value) {
            valEl.style.color = '#34d399';
            setTimeout(() => { valEl.style.color = ''; }, 600);
        }
    }
    if (lblEl) lblEl.textContent = label;
}

// ── Agent Status Cards on Dashboard ──
function renderAgents() {
    const container = document.getElementById('agentStatusList');
    if (!container) return;
    const agents = appState.agents ? Object.values(appState.agents) : [];

    container.innerHTML = agents.map(agent => `
    <div class="agent-card mini" data-agent="${agent.id}" style="border-left: 3px solid ${agent.color}">
      <div class="agent-header">
        <span class="agent-icon">${agent.icon}</span>
        <span class="agent-name">${agent.name}</span>
        <span class="agent-status-badge ${agent.status}">${statusBadge(agent.status)}</span>
      </div>
      ${agent.currentTask ? `<div class="agent-task">${agent.currentTask}</div>` : ''}
      <div class="agent-meta">
        <span>✅ ${agent.completedTasks || 0} görev</span>
        ${agent.lastActivity ? `<span>🕐 ${timeAgo(agent.lastActivity)}</span>` : ''}
      </div>
    </div>
  `).join('');
}

function statusBadge(status) {
    const badges = {
        idle: '⏸ Beklemede',
        running: '▶ Çalışıyor',
        error: '⚠ Hata',
    };
    return badges[status] || status;
}

// ── Activity Feed ──
function renderActivityFeed() {
    const container = document.getElementById('activityFeed');
    if (!container) return;
    const activities = appState.activities || [];
    const recent = activities.slice(0, 20);

    if (recent.length === 0) {
        container.innerHTML = '<div class="empty-state">Henüz aktivite yok. Deploy başlatarak ajanları tetikleyin.</div>';
        return;
    }

    container.innerHTML = recent.map((a, i) => `
    <div class="activity-item ${i === 0 ? 'new' : ''}" style="animation-delay: ${i * 50}ms">
      <span class="activity-icon" style="color: ${a.color || '#818cf8'}">${a.icon || '📌'}</span>
      <div class="activity-content">
        <span class="activity-text">${a.text}</span>
        <span class="activity-time">${timeAgo(a.timestamp)}</span>
      </div>
    </div>
  `).join('');
}

// ── Orchestration Flow ──
function renderOrchestrationFlow() {
    const container = document.getElementById('orchestrationFlow');
    if (!container) return;
    const orch = appState.orchestration || {};
    const nodes = orch.nodes || [];

    if (nodes.length === 0) {
        container.innerHTML = '<div class="empty-state">Aktif orkestrasyon akışı yok.</div>';
        return;
    }

    container.innerHTML = `
    <div class="flow-pipeline">
      ${nodes.map((node, i) => `
        <div class="flow-node ${node.status}" key="${node.id}">
          <div class="flow-icon">${node.icon}</div>
          <div class="flow-label">${node.label}</div>
          <div class="flow-status-dot ${node.status}"></div>
        </div>
        ${i < nodes.length - 1 ? '<div class="flow-arrow ' + (node.status === 'done' ? 'active' : '') + '">→</div>' : ''}
      `).join('')}
    </div>
  `;
}

// ── Dashboard Page ──
function renderDashboard() {
    renderStats();
    renderAgents();
    renderActivityFeed();
    renderOrchestrationFlow();
}

// ── Agents Detail Page ──
function renderAgentsPage() {
    const container = document.getElementById('agentsDetailGrid');
    if (!container) return;
    const agents = appState.agents ? Object.values(appState.agents) : [];

    container.innerHTML = agents.map(agent => `
    <div class="card agent-detail-card" style="--accent: ${agent.color}">
      <div class="card-header">
        <span class="agent-icon-lg">${agent.icon}</span>
        <div>
          <h3>${agent.name}</h3>
          <span class="agent-status-badge ${agent.status}">${statusBadge(agent.status)}</span>
        </div>
      </div>
      <p class="agent-desc">${agent.description}</p>
      ${agent.currentTask ? `<div class="current-task"><strong>Aktif Görev:</strong> ${agent.currentTask}</div>` : ''}
      <div class="agent-section">
        <h4>🔌 MCP Sunucuları</h4>
        <div class="tag-list">${agent.mcp.map(m => `<span class="tag">${m}</span>`).join('')}</div>
      </div>
      <div class="agent-section">
        <h4>⚡ Yetenekler</h4>
        <div class="tag-list">${agent.capabilities.map(c => `<span class="tag cap">${c}</span>`).join('')}</div>
      </div>
      <div class="agent-section">
        <h4>🔐 IAM Rolü</h4>
        <code>${agent.iam}</code>
      </div>
      <div class="agent-footer">
        <span>✅ ${agent.completedTasks || 0} tamamlanan görev</span>
        <button class="btn btn-sm" onclick="triggerAgent('${agent.id}')" ${agent.status === 'running' ? 'disabled' : ''}>
          ${agent.status === 'running' ? '⏳ Çalışıyor...' : '▶ Tetikle'}
        </button>
      </div>
    </div>
  `).join('');
}

async function triggerAgent(agentId) {
    const agent = appState.agents?.[agentId];
    if (!agent) return;

    const tasks = {
        infra: 'Terraform plan — VPC ve kaynak kontrolü',
        pipeline: 'Test suite yürütme ve coverage raporu',
        finops: 'Maliyet optimizasyon taraması',
        sre: 'Sağlık kontrolü ve metrik taraması',
    };

    await apiFetch(`/agents/${agentId}/trigger`, {
        method: 'POST',
        body: JSON.stringify({ task: tasks[agentId] || 'Manuel görev' }),
    });

    // 3-5 saniye sonra otomatik tamamla
    setTimeout(async () => {
        await apiFetch(`/agents/${agentId}/complete`, {
            method: 'POST',
            body: JSON.stringify({ success: true, output: { result: 'OK' } }),
        });
    }, 3000 + Math.random() * 2000);
}

// ── Orchestration Page ──
function renderOrchestrationPage() {
    renderOrchestrationFlow();
    renderClipboard();
}

function renderClipboard() {
    const container = document.getElementById('clipboardViewer');
    if (!container) return;
    const clipboard = appState.clipboard || {};
    const keys = Object.keys(clipboard);

    if (keys.length === 0) {
        container.innerHTML = '<div class="empty-state">Clipboard boş. Deploy başlatarak veri akışını görün.</div>';
        return;
    }

    container.innerHTML = keys.map(key => `
    <div class="clipboard-entry">
      <div class="clipboard-key">${key}</div>
      <pre class="clipboard-value">${JSON.stringify(clipboard[key]?.data || clipboard[key], null, 2)}</pre>
      ${clipboard[key]?.updatedAt ? `<span class="clipboard-time">${timeAgo(clipboard[key].updatedAt)}</span>` : ''}
    </div>
  `).join('');
}

// ── Pipeline Page ──
function renderPipelinePage() {
    renderDeployments();
}

function renderDeployments() {
    const container = document.getElementById('deploymentsTable');
    if (!container) return;
    const deployments = appState.deployments || [];

    if (deployments.length === 0) {
        container.innerHTML = '<div class="empty-state">Henüz deploy yok. "Yeni Deploy" butonunu kullanın.</div>';
        return;
    }

    container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Proje</th>
          <th>Ortam</th>
          <th>Bölge</th>
          <th>Durum</th>
          <th>Süre</th>
          <th>Tarih</th>
        </tr>
      </thead>
      <tbody>
        ${deployments.map(d => `
          <tr class="deploy-row ${d.status}">
            <td><code>${d.deployId || d.id}</code></td>
            <td>${d.projectName || '-'}</td>
            <td><span class="env-badge ${d.environment}">${d.environment || '-'}</span></td>
            <td>${d.region || '-'}</td>
            <td><span class="status-pill ${d.status}">${deployStatusLabel(d.status)}</span></td>
            <td>${d.duration || (d.status === 'running' ? '⏳' : '-')}</td>
            <td>${d.timestamp ? new Date(d.timestamp).toLocaleTimeString('tr-TR') : '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function deployStatusLabel(status) {
    const labels = { running: '🔄 Çalışıyor', success: '✅ Başarılı', failed: '❌ Başarısız', pending: '⏳ Bekliyor' };
    return labels[status] || status;
}

// ── FinOps Page ──
function renderFinOpsPage() {
    renderFinOps();
}

function renderFinOps() {
    const container = document.getElementById('finopsContent');
    if (!container) return;
    const finops = appState.finops || {};

    const percent = finops.monthlyBudget > 0 ? Math.round((finops.currentCost / finops.monthlyBudget) * 100) : 0;
    const gaugeColor = percent > 80 ? '#f43f5e' : percent > 60 ? '#fbbf24' : '#34d399';

    container.innerHTML = `
    <div class="finops-grid">
      <div class="card finops-gauge-card">
        <h3>Bütçe Kullanımı</h3>
        <div class="gauge-container">
          <svg viewBox="0 0 200 120" class="gauge-svg">
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="12" stroke-linecap="round"/>
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="${gaugeColor}" stroke-width="12" stroke-linecap="round"
              stroke-dasharray="${percent * 2.51} 251" class="gauge-fill"/>
            <text x="100" y="85" text-anchor="middle" fill="white" font-size="28" font-weight="bold">$${finops.currentCost || 0}</text>
            <text x="100" y="105" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="12">/ $${finops.monthlyBudget || 500}</text>
          </svg>
          <div class="gauge-percent" style="color: ${gaugeColor}">${percent}%</div>
        </div>
      </div>

      <div class="card">
        <h3>Servis Bazlı Maliyet</h3>
        <div class="cost-bars">
          ${(finops.costBreakdown || []).map(item => `
            <div class="cost-bar-row">
              <span class="cost-label">${item.service}</span>
              <div class="cost-bar-track">
                <div class="cost-bar-fill" style="width: ${finops.currentCost ? (item.cost / finops.currentCost * 100) : 0}%; background: ${gaugeColor}"></div>
              </div>
              <span class="cost-value">$${item.cost}</span>
            </div>
          `).join('')}
          ${(finops.costBreakdown || []).length === 0 ? '<div class="empty-state">Maliyet verisi yok. Deploy sonrası güncellenecek.</div>' : ''}
        </div>
      </div>

      <div class="card">
        <h3>💡 Optimizasyon Önerileri</h3>
        <div class="optimization-list">
          ${(finops.optimizations || []).map(opt => `
            <div class="optimization-item">
              <div class="opt-header">
                <span class="opt-title">${opt.title}</span>
                <span class="opt-savings">-$${opt.savings}/ay</span>
              </div>
              <p class="opt-desc">${opt.desc}</p>
            </div>
          `).join('')}
          ${(finops.optimizations || []).length === 0 ? '<div class="empty-state">Optimizasyon önerileri deploy sonrası oluşturulacak.</div>' : ''}
        </div>
      </div>
    </div>
  `;
}

// ── Self-Heal Page ──
function renderSelfHealPage() {
    renderIncidents();
}

function renderIncidents() {
    const container = document.getElementById('incidentsTimeline');
    if (!container) return;
    const incidents = appState.incidents || [];

    if (incidents.length === 0) {
        container.innerHTML = `
      <div class="heal-cycle-visual">
        <div class="cycle-node sense">🔍 Sense</div>
        <div class="cycle-arrow">→</div>
        <div class="cycle-node analyze">🧠 Analyze</div>
        <div class="cycle-arrow">→</div>
        <div class="cycle-node act">⚡ Act</div>
        <div class="cycle-arrow">→</div>
        <div class="cycle-node verify">✅ Verify</div>
      </div>
      <div class="empty-state">Henüz olay kaydı yok. Sistem sağlıklı çalışıyor.</div>
    `;
        return;
    }

    container.innerHTML = `
    <div class="heal-cycle-visual">
      <div class="cycle-node sense">🔍 Sense</div>
      <div class="cycle-arrow">→</div>
      <div class="cycle-node analyze">🧠 Analyze</div>
      <div class="cycle-arrow">→</div>
      <div class="cycle-node act">⚡ Act</div>
      <div class="cycle-arrow">→</div>
      <div class="cycle-node verify">✅ Verify</div>
    </div>
    <div class="incidents-list">
      ${incidents.map(inc => `
        <div class="incident-card ${inc.status}">
          <div class="incident-header">
            <span class="incident-icon">${inc.status === 'resolved' ? '✅' : '🚨'}</span>
            <span class="incident-title">${inc.title || inc.alarm || 'Olay'}</span>
            <span class="incident-status ${inc.status}">${inc.status === 'resolved' ? 'Çözüldü' : 'Aktif'}</span>
          </div>
          <p>${inc.description || ''}</p>
          ${inc.resolution ? `<div class="resolution">🔧 ${inc.resolution}</div>` : ''}
          <span class="incident-time">${timeAgo(inc.timestamp)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

// ══════════════════════════════════════
// Deploy Modal
// ══════════════════════════════════════

function initDeployModal() {
    const openBtn = document.getElementById('deployBtn');
    const modal = document.getElementById('deployModal');
    const closeBtn = document.getElementById('closeModal');
    const form = document.getElementById('deployForm');

    if (openBtn) {
        openBtn.addEventListener('click', () => {
            if (modal) modal.classList.add('active');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (modal) modal.classList.remove('active');
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = {
                projectName: formData.get('projectName') || 'my-app',
                region: formData.get('region') || 'eu-west-1',
                environment: formData.get('environment') || 'production',
                budget: parseInt(formData.get('budget')) || 500,
            };

            // Modal kapat
            if (modal) modal.classList.remove('active');

            // Deploy API çağır
            const result = await apiFetch('/deploy', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            if (result) {
                console.log('🚀 Deploy başlatıldı:', result);
                switchPage('dashboard'); // Dashboard'a geç
            }
        });
    }
}

// ══════════════════════════════════════
// Utilities
// ══════════════════════════════════════

function timeAgo(timestamp) {
    if (!timestamp) return '';
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diff = Math.floor((now - then) / 1000);

    if (diff < 5) return 'şimdi';
    if (diff < 60) return `${diff}s önce`;
    if (diff < 3600) return `${Math.floor(diff / 60)}dk önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}sa önce`;
    return `${Math.floor(diff / 86400)}g önce`;
}

// Zamanlayıcı — timeAgo'ları güncelle
setInterval(() => {
    document.querySelectorAll('.activity-time, .incident-time, .clipboard-time').forEach(el => {
        // Zaten render'lamış olduğumuz için sadece feed'i tekrar render edelim
    });
    renderActivityFeed();
}, 30000);

// ══════════════════════════════════════
// Sparkline Canvas (Stats Kartlarında)
// ══════════════════════════════════════

function initSparklines() {
    document.querySelectorAll('.sparkline').forEach((canvas) => {
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth * 2;
        canvas.height = canvas.offsetHeight * 2;
        ctx.scale(2, 2);
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;

        const data = Array.from({ length: 20 }, () => Math.random() * 0.6 + 0.2);
        drawSparkline(ctx, data, w, h, canvas.dataset.color || '#818cf8');
    });
}

function drawSparkline(ctx, data, w, h, color) {
    ctx.clearRect(0, 0, w, h);
    const step = w / (data.length - 1);
    const pad = 4;

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, color + '40');
    grad.addColorStop(1, color + '00');

    ctx.beginPath();
    ctx.moveTo(0, h);
    data.forEach((v, i) => {
        const x = i * step;
        const y = h - pad - v * (h - pad * 2);
        if (i === 0) ctx.lineTo(x, y);
        else {
            const px = (i - 1) * step;
            const py = h - pad - data[i - 1] * (h - pad * 2);
            const cx = (px + x) / 2;
            ctx.bezierCurveTo(cx, py, cx, y, x, y);
        }
    });
    ctx.lineTo(w, h);
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    data.forEach((v, i) => {
        const x = i * step;
        const y = h - pad - v * (h - pad * 2);
        if (i === 0) ctx.moveTo(x, y);
        else {
            const px = (i - 1) * step;
            const py = h - pad - data[i - 1] * (h - pad * 2);
            const cx = (px + x) / 2;
            ctx.bezierCurveTo(cx, py, cx, y, x, y);
        }
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
}

// ══════════════════════════════════════
// Init
// ══════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initDeployModal();
    initSparklines();
    connectWebSocket();

    // Fallback: WebSocket bağlanamazsa polling
    setTimeout(async () => {
        if (!isConnected) {
            console.log('⚡ Polling fallback — API\'den veri çekiliyor');
            const data = await apiFetch('/state');
            if (data) {
                appState = data;
                renderAll();
            }
        }
    }, 3000);
});
