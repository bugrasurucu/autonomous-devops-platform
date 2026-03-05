/**
 * State Manager — File-based Persistence
 * Ajanlar ve dashboard arasındaki paylaşılan durum yöneticisi
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

const STATE_FILE = path.join(__dirname, 'state.json');

class StateManager extends EventEmitter {
    constructor() {
        super();
        this.state = this._loadOrCreateState();
        this._watchFile();
    }

    /**
     * İlk başlatma veya mevcut state dosyasını yükle
     */
    _loadOrCreateState() {
        try {
            if (fs.existsSync(STATE_FILE)) {
                const data = fs.readFileSync(STATE_FILE, 'utf-8');
                return JSON.parse(data);
            }
        } catch (err) {
            console.warn('⚠️ State dosyası okunamadı, yenisi oluşturuluyor:', err.message);
        }

        const initial = this._createInitialState();
        this._persist(initial);
        return initial;
    }

    /**
     * state.json dosya değişikliklerini izle (orchestrator.py yazabilir)
     */
    _watchFile() {
        let debounce = null;
        try {
            fs.watch(STATE_FILE, () => {
                clearTimeout(debounce);
                debounce = setTimeout(() => {
                    try {
                        const data = fs.readFileSync(STATE_FILE, 'utf-8');
                        const newState = JSON.parse(data);
                        this.state = newState;
                        this.emit('stateChanged', newState);
                    } catch (e) { /* ignore parse errors during writes */ }
                }, 100);
            });
        } catch (e) {
            console.warn('⚠️ Dosya izleme başlatılamadı');
        }
    }

    /**
     * Başlangıç durumu — boş ama yapılandırılmış
     */
    _createInitialState() {
        return {
            agents: {
                infra: {
                    id: 'infra',
                    name: 'Platform & Infra Agent',
                    icon: '🏗',
                    status: 'idle',
                    description: 'AWS altyapısını Terraform/CDK ile kodlar ve provizyonlar',
                    mcp: ['aws-cloud-control', 'aws-iac', 'aws-terraform'],
                    capabilities: ['generate_terraform', 'provision_resources', 'security_scan'],
                    iam: 'devops-infra-agent-role',
                    color: '#818cf8',
                    currentTask: null,
                    completedTasks: 0,
                    lastActivity: null,
                    metrics: { successRate: 0, avgDuration: 0 },
                },
                pipeline: {
                    id: 'pipeline',
                    name: 'Pipeline & CI/CD Agent',
                    icon: '🔄',
                    status: 'idle',
                    description: 'CI/CD pipeline yapılandırır, test yazar, görsel QA yapar',
                    mcp: ['mcpdoc-github-actions', 'mcpdoc-aws'],
                    capabilities: ['generate_cicd_config', 'generate_tests', 'visual_qa', 'deploy', 'rollback'],
                    iam: 'devops-pipeline-agent-role',
                    color: '#34d399',
                    currentTask: null,
                    completedTasks: 0,
                    lastActivity: null,
                    metrics: { successRate: 0, avgDuration: 0 },
                },
                finops: {
                    id: 'finops',
                    name: 'FinOps Agent',
                    icon: '💰',
                    status: 'idle',
                    description: 'Maliyet analizi, bütçe doğrulama ve optimizasyon önerileri',
                    mcp: ['aws-pricing'],
                    capabilities: ['cost_estimation', 'budget_validation', 'cost_optimization'],
                    iam: 'devops-finops-agent-role',
                    color: '#fbbf24',
                    currentTask: null,
                    completedTasks: 0,
                    lastActivity: null,
                    metrics: { successRate: 0, avgDuration: 0 },
                },
                sre: {
                    id: 'sre',
                    name: 'SRE & Self-Healing Agent',
                    icon: '🛡',
                    status: 'idle',
                    description: 'Monitoring, anomali tespiti, RCA ve otonom iyileştirme',
                    mcp: ['aws-cloudwatch'],
                    capabilities: ['monitoring_setup', 'anomaly_detection', 'rca_analysis', 'auto_remediation'],
                    iam: 'devops-sre-agent-role',
                    color: '#f43f5e',
                    currentTask: null,
                    completedTasks: 0,
                    lastActivity: null,
                    metrics: { successRate: 0, avgDuration: 0 },
                },
            },

            activities: [],

            deployments: [],

            finops: {
                monthlyBudget: 500,
                currentCost: 0,
                costBreakdown: [],
                optimizations: [],
                budgetStatus: 'OK',
            },

            incidents: [],

            clipboard: {},

            orchestration: {
                currentFlow: null,
                pattern: null,
                nodes: [],
            },

            stats: {
                activeAgents: 0,
                totalDeploys: 0,
                monthlyCost: 0,
                healEvents: 0,
            },

            system: {
                startedAt: new Date().toISOString(),
                version: '1.0.0',
                status: 'online',
            },
        };
    }

    // ───── Read Operations ─────

    getAgents() {
        return this.state.agents;
    }

    getAgent(id) {
        return this.state.agents[id] || null;
    }

    getActivities(limit = 50) {
        return this.state.activities.slice(-limit).reverse();
    }

    getDeployments(limit = 20) {
        return this.state.deployments.slice(-limit).reverse();
    }

    getFinOps() {
        return this.state.finops;
    }

    getIncidents(limit = 20) {
        return this.state.incidents.slice(-limit).reverse();
    }

    getClipboard() {
        return this.state.clipboard;
    }

    getOrchestration() {
        return this.state.orchestration;
    }

    getStats() {
        // Dinamik hesaplama
        const agents = Object.values(this.state.agents);
        return {
            activeAgents: agents.filter(a => a.status !== 'idle').length,
            totalAgents: agents.length,
            totalDeploys: this.state.deployments.length,
            successfulDeploys: this.state.deployments.filter(d => d.status === 'success').length,
            monthlyCost: this.state.finops.currentCost,
            monthlyBudget: this.state.finops.monthlyBudget,
            healEvents: this.state.incidents.length,
            resolvedIncidents: this.state.incidents.filter(i => i.status === 'resolved').length,
        };
    }

    getFullState() {
        return { ...this.state, stats: this.getStats() };
    }

    // ───── Write Operations ─────

    updateAgent(id, updates) {
        if (!this.state.agents[id]) return null;
        Object.assign(this.state.agents[id], updates);
        this.state.agents[id].lastActivity = new Date().toISOString();
        this._save();
        this.emit('agentUpdated', { id, ...this.state.agents[id] });
        return this.state.agents[id];
    }

    addActivity(activity) {
        const entry = {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString(),
            ...activity,
        };
        this.state.activities.push(entry);
        // Son 200 kaydı tut
        if (this.state.activities.length > 200) {
            this.state.activities = this.state.activities.slice(-200);
        }
        this._save();
        this.emit('newActivity', entry);
        return entry;
    }

    addDeployment(deployment) {
        const entry = {
            id: `dep-${Date.now()}`,
            timestamp: new Date().toISOString(),
            ...deployment,
        };
        this.state.deployments.push(entry);
        this._save();
        this.emit('newDeployment', entry);
        return entry;
    }

    updateFinOps(updates) {
        Object.assign(this.state.finops, updates);
        this._save();
        this.emit('finopsUpdated', this.state.finops);
        return this.state.finops;
    }

    addIncident(incident) {
        const entry = {
            id: `inc-${Date.now()}`,
            timestamp: new Date().toISOString(),
            status: 'active',
            ...incident,
        };
        this.state.incidents.push(entry);
        this._save();
        this.emit('newIncident', entry);
        return entry;
    }

    resolveIncident(id, resolution) {
        const incident = this.state.incidents.find(i => i.id === id);
        if (incident) {
            incident.status = 'resolved';
            incident.resolution = resolution;
            incident.resolvedAt = new Date().toISOString();
            this._save();
            this.emit('incidentResolved', incident);
        }
        return incident;
    }

    updateClipboard(key, value) {
        this.state.clipboard[key] = {
            data: value,
            updatedAt: new Date().toISOString(),
        };
        this._save();
        this.emit('clipboardUpdated', { key, value });
        return this.state.clipboard;
    }

    updateOrchestration(updates) {
        Object.assign(this.state.orchestration, updates);
        this._save();
        this.emit('orchestrationUpdated', this.state.orchestration);
        return this.state.orchestration;
    }

    // ───── Persistence ─────

    _save() {
        this._persist(this.state);
    }

    _persist(data) {
        try {
            fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2), 'utf-8');
        } catch (err) {
            console.error('❌ State yazılamadı:', err.message);
        }
    }
}

module.exports = StateManager;
