/**
 * Mission Control — Otonom DevOps Dashboard
 * Interactive dashboard with live simulations, sparklines, and animations
 */

// ══════════════════════════════════════
// Data & State
// ══════════════════════════════════════

const AGENTS = [
    {
        id: 'infra',
        name: 'Platform & Infra Agent',
        icon: '🏗',
        description: 'AWS altyapısını Terraform/CDK ile kodlar ve provizyonlar',
        status: 'online',
        mcp: ['aws-cloud-control', 'aws-iac', 'aws-terraform'],
        capabilities: ['generate_terraform', 'provision_resources', 'security_scan'],
        iam: 'devops-infra-agent-role',
        color: '#818cf8',
    },
    {
        id: 'pipeline',
        name: 'Pipeline & CI/CD Agent',
        icon: '🔄',
        description: 'CI/CD pipeline yapılandırır, test yazar, görsel QA yapar',
        status: 'running',
        mcp: ['mcpdoc-github-actions', 'mcpdoc-aws'],
        capabilities: ['generate_cicd_config', 'generate_tests', 'visual_qa', 'deploy', 'rollback'],
        iam: 'devops-pipeline-agent-role',
        color: '#34d399',
    },
    {
        id: 'finops',
        name: 'FinOps Agent',
        icon: '💰',
        description: 'Maliyet analizi, bütçe doğrulama ve optimizasyon önerileri',
        status: 'online',
        mcp: ['aws-pricing'],
        capabilities: ['cost_estimation', 'budget_validation', 'cost_optimization'],
        iam: 'devops-finops-agent-role',
        color: '#fbbf24',
    },
    {
        id: 'sre',
        name: 'SRE & Self-Healing Agent',
        icon: '🛡',
        description: 'Monitoring, anomali tespiti, RCA ve otonom iyileştirme',
        status: 'watching',
        mcp: ['aws-cloudwatch'],
        capabilities: ['monitoring_setup', 'anomaly_detection', 'rca_analysis', 'auto_remediation'],
        iam: 'devops-sre-agent-role',
        color: '#f43f5e',
    },
];

const ACTIVITIES = [
    { icon: '🏗', text: 'Infra Agent: VPC modülü oluşturuldu (10.0.0.0/16)', color: '#818cf8', time: '2dk önce' },
    { icon: '💰', text: 'FinOps: Maliyet analizi tamamlandı — $247/ay', color: '#fbbf24', time: '5dk önce' },
    { icon: '🔄', text: 'Pipeline: CI/CD testleri çalışıyor (8/12)', color: '#34d399', time: '8dk önce' },
    { icon: '🛡', text: 'SRE: CloudWatch Dashboard kuruldu', color: '#f43f5e', time: '15dk önce' },
    { icon: '🏗', text: 'Infra Agent: ECS Fargate cluster oluşturuldu', color: '#818cf8', time: '22dk önce' },
    { icon: '🔒', text: 'Checkov: 0 kritik güvenlik açığı', color: '#34d399', time: '25dk önce' },
    { icon: '💰', text: 'FinOps: Graviton geçiş önerisi — %30 tasarruf', color: '#fbbf24', time: '30dk önce' },
    { icon: '🛡', text: 'SRE: Self-healing Lambda deploy edildi', color: '#f43f5e', time: '35dk önce' },
    { icon: '🏗', text: 'Infra Agent: RDS (PostgreSQL 15.4) oluşturuldu', color: '#818cf8', time: '40dk önce' },
    { icon: '🔄', text: 'Pipeline: Docker image build tamamlandı', color: '#34d399', time: '45dk önce' },
];

const COST_BREAKDOWN = [
    { label: 'ECS Fargate', value: 89, max: 150, color: '#818cf8' },
    { label: 'RDS', value: 72, max: 150, color: '#c084fc' },
    { label: 'NAT Gateway', value: 45, max: 150, color: '#a78bfa' },
    { label: 'ALB', value: 22, max: 150, color: '#60a5fa' },
    { label: 'CloudWatch', value: 12, max: 150, color: '#22d3ee' },
    { label: 'Diğer', value: 7, max: 150, color: '#94a3b8' },
];

const OPTIMIZATIONS = [
    { icon: '💡', title: 'Graviton Geçişi', desc: 'ECS task\'ları ARM64 (Graviton) mimarisine taşıyın', savings: '-$27/ay' },
    { icon: '📦', title: 'Reserved Instance', desc: 'RDS için 1 yıllık RI satın alarak tasarruf edin', savings: '-$29/ay' },
    { icon: '📊', title: 'Log Retention', desc: 'CloudWatch log tutma süresini 90 güne düşürün', savings: '-$4/ay' },
    { icon: '🧹', title: 'Kullanılmayan EIP', desc: '2 adet kullanılmayan Elastic IP kaldırılabilir', savings: '-$7/ay' },
];

const INCIDENTS = [
    {
        title: 'CPU Spike Algılandı',
        time: '2 gün önce',
        desc: 'ECS CPU kullanımı %92\'ye ulaştı — trafik artışı',
        action: '✅ Auto-scale: 2 → 4 task, 5dk içinde çözüldü',
        status: 'resolved',
    },
    {
        title: 'RDS Bağlantı Hatası',
        time: '5 gün önce',
        desc: 'Connection pool tükendi — max_connections limiti',
        action: '✅ Parametre grubu güncellendi, restart yapıldı',
        status: 'resolved',
    },
    {
        title: '5xx Hata Artışı',
        time: '1 hafta önce',
        desc: 'Deployment sonrası 5xx hata sayısı 15\'e çıktı',
        action: '✅ Önceki task definition\'a rollback yapıldı',
        status: 'resolved',
    },
];

const PIPELINE_STAGES = [
    { name: 'Lint', icon: '🔍', status: 'done', time: '12s' },
    { name: 'Test', icon: '🧪', status: 'done', time: '1m 23s' },
    { name: 'Security', icon: '🔒', status: 'done', time: '34s' },
    { name: 'Build', icon: '🐳', status: 'done', time: '2m 11s' },
    { name: 'FinOps', icon: '💰', status: 'done', time: '18s' },
    { name: 'Deploy', icon: '🚀', status: 'running', time: '...' },
];

const DEPLOYMENTS = [
    { id: '#142', commit: 'feat: add health endpoint', env: 'production', status: 'success', time: '12:42', duration: '4m 38s' },
    { id: '#141', commit: 'fix: memory leak in handler', env: 'production', status: 'success', time: '10:15', duration: '4m 12s' },
    { id: '#140', commit: 'chore: update dependencies', env: 'staging', status: 'success', time: '09:30', duration: '3m 55s' },
    { id: '#139', commit: 'feat: add caching layer', env: 'production', status: 'failed', time: 'Dün 18:22', duration: '5m 01s' },
    { id: '#138', commit: 'fix: cors configuration', env: 'staging', status: 'success', time: 'Dün 15:10', duration: '3m 42s' },
];

const CLIPBOARD_STATE = {
    project_research: {
        type: 'nodejs',
        framework: 'express',
        database: 'postgresql',
        port: 3000,
        docker: true,
    },
    'infra-agent': {
        vpc_id: 'vpc-0a1b2c3d4e5f',
        ecs_cluster_arn: 'arn:aws:ecs:eu-west-1:123456789:cluster/my-app',
        rds_endpoint: 'my-app-db.cluster-xyz.eu-west-1.rds.amazonaws.com',
        alb_dns: 'my-app-alb-1234.eu-west-1.elb.amazonaws.com',
    },
    'finops-agent': {
        estimated_cost: '$247/ay',
        budget_status: 'OK',
        decision: 'PROCEED',
        savings_potential: '$67/ay',
    },
    'pipeline-agent': {
        pipeline_url: 'https://github.com/org/app/actions',
        test_results: '24/24 passed',
        coverage: '87%',
    },
    'sre-agent': {
        dashboard_url: 'https://console.aws.amazon.com/cloudwatch/dashboards/my-app',
        alarms_active: 0,
        self_healing: 'enabled',
        uptime: '99.95%',
    },
};

// ══════════════════════════════════════
// Navigation
// ══════════════════════════════════════

const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const pageTitle = document.getElementById('pageTitle');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');

const PAGE_TITLES = {
    dashboard: 'Dashboard',
    agents: 'Ajanlar',
    orchestration: 'Orkestrasyon',
    pipeline: 'Pipeline',
    finops: 'FinOps',
    selfheal: 'Self-Healing',
};

navItems.forEach((item) => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;

        navItems.forEach((n) => n.classList.remove('active'));
        item.classList.add('active');

        pages.forEach((p) => p.classList.remove('active'));
        const target = document.getElementById(`page-${page}`);
        if (target) {
            target.classList.add('active');
        }

        pageTitle.textContent = PAGE_TITLES[page] || 'Dashboard';

        // Close mobile sidebar
        sidebar.classList.remove('open');
    });
});

menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

// ══════════════════════════════════════
// Deploy Modal
// ══════════════════════════════════════

const deployBtn = document.getElementById('deployBtn');
const deployModal = document.getElementById('deployModal');
const modalCancel = document.getElementById('modalCancel');
const modalDeploy = document.getElementById('modalDeploy');

deployBtn.addEventListener('click', () => {
    deployModal.classList.add('show');
});

modalCancel.addEventListener('click', () => {
    deployModal.classList.remove('show');
});

deployModal.addEventListener('click', (e) => {
    if (e.target === deployModal) {
        deployModal.classList.remove('show');
    }
});

modalDeploy.addEventListener('click', () => {
    deployModal.classList.remove('show');
    startOrchestrationAnimation();
});

// ══════════════════════════════════════
// Activity Feed
// ══════════════════════════════════════

function renderActivityFeed() {
    const feed = document.getElementById('activityFeed');
    feed.innerHTML = ACTIVITIES.map(
        (a) => `
    <div class="feed-item">
      <span class="feed-dot" style="background:${a.color}"></span>
      <span class="feed-text">${a.icon} ${a.text}</span>
      <span class="feed-time">${a.time}</span>
    </div>
  `
    ).join('');
}

// ══════════════════════════════════════
// Sparklines (Canvas)
// ══════════════════════════════════════

function drawSparkline(container, data, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 140;
    canvas.height = 60;
    container.innerHTML = '';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const step = canvas.width / (data.length - 1);

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, color + '30');
    gradient.addColorStop(1, color + '00');

    // Path
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    data.forEach((val, i) => {
        const x = i * step;
        const y = canvas.height - ((val - min) / range) * canvas.height * 0.8 - 4;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });

    // Fill area
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    data.forEach((val, i) => {
        const x = i * step;
        const y = canvas.height - ((val - min) / range) * canvas.height * 0.8 - 4;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // End dot
    const lastX = (data.length - 1) * step;
    const lastY = canvas.height - ((data[data.length - 1] - min) / range) * canvas.height * 0.8 - 4;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
}

function initSparklines() {
    drawSparkline(document.getElementById('sparkAgents'), [4, 4, 3, 4, 4, 3, 4, 4, 4, 4], '#818cf8');
    drawSparkline(document.getElementById('sparkDeploys'), [8, 6, 9, 7, 10, 8, 11, 9, 12, 12], '#34d399');
    drawSparkline(document.getElementById('sparkCost'), [220, 235, 210, 240, 255, 230, 245, 238, 250, 247], '#fbbf24');
    drawSparkline(document.getElementById('sparkHeal'), [1, 0, 2, 1, 0, 1, 0, 0, 1, 3], '#f43f5e');
}

// ══════════════════════════════════════
// Agents Detail Page
// ══════════════════════════════════════

function renderAgentsDetail() {
    const grid = document.getElementById('agentsDetailGrid');
    grid.innerHTML = AGENTS.map(
        (a) => `
    <div class="agent-detail-card" style="border-top: 2px solid ${a.color}">
      <div class="agent-detail-header">
        <span style="font-size:28px">${a.icon}</span>
        <h3>${a.name}</h3>
        <span class="badge">${a.status.toUpperCase()}</span>
      </div>
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:8px">${a.description}</p>
      <div style="font-size:11px;color:var(--text-muted);margin-top:8px">IAM: <code style="color:var(--accent-cyan);font-family:var(--font-mono)">${a.iam}</code></div>
      <div style="margin-top:10px">
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">MCP Sunucuları</div>
        <div class="mcp-list">${a.mcp.map((m) => `<span class="mcp-tag">${m}</span>`).join('')}</div>
      </div>
      <div style="margin-top:10px">
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">Yetenekler</div>
        <div class="capability-list">${a.capabilities.map((c) => `<span class="cap-tag">${c}</span>`).join('')}</div>
      </div>
    </div>
  `
    ).join('');
}

// ══════════════════════════════════════
// Pipeline Page
// ══════════════════════════════════════

function renderPipeline() {
    const stages = document.getElementById('pipelineStages');
    stages.innerHTML = PIPELINE_STAGES.map(
        (s) => `
    <div class="pipeline-stage">
      <div class="stage-indicator ${s.status}">${s.icon}</div>
      <div class="stage-name">${s.name}</div>
      <div class="stage-time">${s.time}</div>
    </div>
  `
    ).join('');

    const table = document.getElementById('deployTable');
    table.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th><th>Commit</th><th>Ortam</th><th>Durum</th><th>Zaman</th><th>Süre</th>
        </tr>
      </thead>
      <tbody>
        ${DEPLOYMENTS.map(
        (d) => `
          <tr>
            <td style="font-family:var(--font-mono);font-weight:600">${d.id}</td>
            <td>${d.commit}</td>
            <td><span style="font-size:11px;font-family:var(--font-mono)">${d.env}</span></td>
            <td><span class="deploy-badge ${d.status}">${d.status === 'success' ? '✓ Başarılı' : d.status === 'failed' ? '✗ Başarısız' : '◉ Çalışıyor'}</span></td>
            <td style="font-family:var(--font-mono);font-size:12px">${d.time}</td>
            <td style="font-family:var(--font-mono);font-size:12px">${d.duration}</td>
          </tr>
        `
    ).join('')}
      </tbody>
    </table>
  `;
}

// ══════════════════════════════════════
// FinOps Page
// ══════════════════════════════════════

function renderFinOps() {
    // Budget gauge
    const totalCost = 247;
    const budget = 500;
    const pct = totalCost / budget;
    const circumference = 2 * Math.PI * 52;
    const circle = document.getElementById('gaugeCircle');

    // Add gradient def
    const svg = circle.closest('svg');
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad.id = 'gaugeGradient';
    grad.innerHTML = `
    <stop offset="0%" stop-color="#34d399" />
    <stop offset="50%" stop-color="#fbbf24" />
    <stop offset="100%" stop-color="#f43f5e" />
  `;
    defs.appendChild(grad);
    svg.insertBefore(defs, svg.firstChild);

    setTimeout(() => {
        circle.style.strokeDasharray = `${circumference * pct} ${circumference}`;
    }, 300);

    // Cost breakdown
    const bars = document.getElementById('costBars');
    bars.innerHTML = COST_BREAKDOWN.map(
        (c) => `
    <div class="cost-bar-item">
      <span class="cost-bar-label">${c.label}</span>
      <div class="cost-bar-track">
        <div class="cost-bar-fill" style="width:0%;background:${c.color}" data-width="${(c.value / c.max) * 100}%"></div>
      </div>
      <span class="cost-bar-value">$${c.value}</span>
    </div>
  `
    ).join('');

    // Animate bars
    setTimeout(() => {
        document.querySelectorAll('.cost-bar-fill').forEach((bar) => {
            bar.style.width = bar.dataset.width;
        });
    }, 400);

    // Optimizations
    const optList = document.getElementById('optimizationList');
    optList.innerHTML = OPTIMIZATIONS.map(
        (o) => `
    <div class="opt-item">
      <span class="opt-icon">${o.icon}</span>
      <div class="opt-info">
        <div class="opt-title">${o.title}</div>
        <div class="opt-desc">${o.desc}</div>
      </div>
      <span class="opt-savings">${o.savings}</span>
    </div>
  `
    ).join('');
}

// ══════════════════════════════════════
// Self-Healing Page
// ══════════════════════════════════════

function renderSelfHealing() {
    const timeline = document.getElementById('incidentTimeline');
    timeline.innerHTML = INCIDENTS.map(
        (inc) => `
    <div class="incident-item ${inc.status}">
      <div class="incident-header">
        <span class="incident-title">${inc.title}</span>
        <span class="incident-time">${inc.time}</span>
      </div>
      <div class="incident-desc">${inc.desc}</div>
      <div class="incident-action">${inc.action}</div>
    </div>
  `
    ).join('');
}

// ══════════════════════════════════════
// Orchestration — Clipboard Viewer
// ══════════════════════════════════════

function renderClipboard() {
    const content = document.getElementById('clipboardContent');
    content.textContent = JSON.stringify(CLIPBOARD_STATE, null, 2);
}

// ══════════════════════════════════════
// Orchestration Flow Animation
// ══════════════════════════════════════

function startOrchestrationAnimation() {
    const nodes = ['flowBootstrap', 'flowInfra', 'flowFinops', 'flowPipeline', 'flowSre'];
    const connectors = ['conn1', 'conn2', 'conn3', 'conn4', 'conn5'];

    // Reset
    nodes.forEach((id) => {
        const el = document.getElementById(id);
        el.classList.remove('active', 'done');
        const statusEl = el.querySelector('.node-status');
        if (statusEl) statusEl.textContent = 'Bekliyor';
    });
    connectors.forEach((id) => {
        document.getElementById(id).classList.remove('active');
    });

    // Start node
    document.getElementById('flowStart').classList.add('done');
    document.getElementById('conn1').classList.add('active');

    const statuses = [
        'Repo analizi yapılıyor...',
        'Terraform üretiliyor...',
        'Maliyet hesaplanıyor...',
        'CI/CD kurulumu...',
        'Monitoring kurulumu...',
    ];

    const doneStatuses = [
        'Analiz tamamlandı ✓',
        'IaC oluşturuldu ✓',
        '$247/ay — OK ✓',
        'Pipeline aktif ✓',
        'Self-Heal aktif ✓',
    ];

    nodes.forEach((id, i) => {
        // Activate node
        setTimeout(() => {
            const el = document.getElementById(id);
            el.classList.add('active');
            const statusEl = el.querySelector('.node-status');
            if (statusEl) statusEl.textContent = statuses[i];

            // Add new activity
            addActivity(AGENTS[Math.min(i, 3)]?.icon || '📂', statuses[i], AGENTS[Math.min(i, 3)]?.color || '#818cf8');
        }, (i + 1) * 2000);

        // Complete node
        setTimeout(() => {
            const el = document.getElementById(id);
            el.classList.remove('active');
            el.classList.add('done');
            const statusEl = el.querySelector('.node-status');
            if (statusEl) statusEl.textContent = doneStatuses[i];

            // Activate next connector
            if (connectors[i + 1]) {
                document.getElementById(connectors[i + 1]).classList.add('active');
            }
        }, (i + 1) * 2000 + 1500);
    });
}

function addActivity(icon, text, color) {
    const feed = document.getElementById('activityFeed');
    const item = document.createElement('div');
    item.className = 'feed-item';
    item.innerHTML = `
    <span class="feed-dot" style="background:${color}"></span>
    <span class="feed-text">${icon} ${text}</span>
    <span class="feed-time">Şimdi</span>
  `;
    feed.insertBefore(item, feed.firstChild);
}

// ══════════════════════════════════════
// Self-Healing Cycle Animation
// ══════════════════════════════════════

function animateHealCycle() {
    const steps = document.querySelectorAll('.cycle-step');
    let current = 0;

    setInterval(() => {
        steps.forEach((s) => s.classList.remove('active', 'done'));

        for (let i = 0; i < current; i++) {
            steps[i].classList.add('done');
        }
        steps[current].classList.add('active');

        current = (current + 1) % steps.length;
    }, 3000);
}

// ══════════════════════════════════════
// Sequential Pattern Animation
// ══════════════════════════════════════

function animateSequentialPattern() {
    const nodes = document.querySelectorAll('.sequential .p-node');
    let idx = 0;

    setInterval(() => {
        nodes.forEach((n) => n.classList.remove('p-active'));
        nodes[idx].classList.add('p-active');
        idx = (idx + 1) % nodes.length;
    }, 1500);
}

// ══════════════════════════════════════
// Live Counter Animation
// ══════════════════════════════════════

function animateCounters() {
    const counters = [
        { el: document.getElementById('activeAgents'), target: 4 },
        { el: document.getElementById('deployCount'), target: 12 },
        { el: document.getElementById('healEvents'), target: 3 },
    ];

    counters.forEach(({ el, target }) => {
        let current = 0;
        const step = Math.ceil(target / 20);
        const interval = setInterval(() => {
            current = Math.min(current + step, target);
            el.textContent = current;
            if (current >= target) clearInterval(interval);
        }, 50);
    });

    // Cost counter with $
    const costEl = document.getElementById('monthlyCost');
    let costVal = 0;
    const costStep = Math.ceil(247 / 30);
    const costInterval = setInterval(() => {
        costVal = Math.min(costVal + costStep, 247);
        costEl.textContent = `$${costVal}`;
        if (costVal >= 247) clearInterval(costInterval);
    }, 40);
}

// ══════════════════════════════════════
// Initialize
// ══════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    renderActivityFeed();
    initSparklines();
    renderAgentsDetail();
    renderPipeline();
    renderFinOps();
    renderSelfHealing();
    renderClipboard();
    animateCounters();

    // Start animations with delay
    setTimeout(() => animateHealCycle(), 1000);
    setTimeout(() => animateSequentialPattern(), 2000);

    // Simulated live updates
    setInterval(() => {
        const randomActivity = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
        addActivity(randomActivity.icon, randomActivity.text, randomActivity.color);
    }, 15000);
});
