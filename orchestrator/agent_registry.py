"""
Agent Registry — A2A Protokolü ile Ajan Keşfi ve Kayıt Sistemi

.well-known/agent.json sözleşmesi üzerinden ajan özelliklerini
ve uç noktalarını yönetir. Google ADK uyumlu.
"""

import json
from dataclasses import dataclass, field, asdict
from typing import Optional
from datetime import datetime, timezone


@dataclass
class AgentCapability:
    """Ajan yeteneği tanımı"""
    name: str
    description: str
    input_schema: dict = field(default_factory=dict)
    output_schema: dict = field(default_factory=dict)


@dataclass
class AgentCard:
    """
    A2A Agent Card — .well-known/agent.json formatı
    
    Her ajan kendi yeteneklerini, uç noktalarını ve
    iletişim protokollerini bu kart ile tanımlar.
    """
    agent_id: str
    name: str
    description: str
    version: str = "1.0.0"
    protocol: str = "a2a-v1"
    endpoint: str = ""
    capabilities: list[AgentCapability] = field(default_factory=list)
    mcp_servers: list[str] = field(default_factory=list)
    iam_role: str = ""
    max_concurrent_tasks: int = 1
    retry_policy: dict = field(default_factory=lambda: {
        "max_retries": 3,
        "backoff_seconds": [5, 15, 60]
    })

    def to_json(self) -> str:
        return json.dumps(asdict(self), indent=2, ensure_ascii=False)

    @classmethod
    def from_json(cls, data: dict) -> "AgentCard":
        caps = [AgentCapability(**c) for c in data.pop("capabilities", [])]
        return cls(**data, capabilities=caps)


class AgentRegistry:
    """
    Ajan Kayıt Sistemi
    
    Tüm uzman ajanları merkezi olarak yönetir.
    A2A protokolü ile ajan keşfi sağlar.
    """

    def __init__(self):
        self._agents: dict[str, AgentCard] = {}
        self._register_default_agents()

    def _register_default_agents(self):
        """Platform varsayılan ajanlarını kaydet"""
        
        # Infra Agent
        self.register(AgentCard(
            agent_id="infra-agent",
            name="Platform ve Altyapı Ajanı",
            description="AWS altyapısını Terraform/CDK ile kodlar ve provizyonlar",
            endpoint="/agents/infra",
            capabilities=[
                AgentCapability(
                    name="generate_terraform",
                    description="Proje gereksinimlerine göre Terraform HCL kodu üretir",
                    input_schema={"type": "object", "properties": {"project_research": {"type": "object"}}},
                    output_schema={"type": "object", "properties": {"terraform_dir": {"type": "string"}}},
                ),
                AgentCapability(
                    name="provision_resources",
                    description="terraform apply ile AWS kaynaklarını provizyonlar",
                ),
                AgentCapability(
                    name="security_scan",
                    description="Checkov ile güvenlik taraması yapar",
                ),
            ],
            mcp_servers=["aws-cloud-control", "aws-iac", "aws-terraform"],
            iam_role="devops-infra-agent-role",
        ))

        # Pipeline Agent
        self.register(AgentCard(
            agent_id="pipeline-agent",
            name="Boru Hattı ve CI/CD Ajanı",
            description="CI/CD pipeline yapılandırır, test yazar, görsel QA yapar",
            endpoint="/agents/pipeline",
            capabilities=[
                AgentCapability(name="generate_cicd_config", description="GitHub Actions/CodePipeline YAML üretir"),
                AgentCapability(name="generate_tests", description="Birim ve entegrasyon testleri yazar"),
                AgentCapability(name="visual_qa", description="Browser Subagent ile görsel doğrulama"),
                AgentCapability(name="deploy", description="Staging/production dağıtımı"),
                AgentCapability(name="rollback", description="Önceki sürüme geri alma"),
            ],
            mcp_servers=["mcpdoc-github-actions", "mcpdoc-aws"],
            iam_role="devops-pipeline-agent-role",
        ))

        # FinOps Agent
        self.register(AgentCard(
            agent_id="finops-agent",
            name="Finansal Operasyonlar Ajanı",
            description="Maliyet analizi, bütçe doğrulama ve optimizasyon önerileri",
            endpoint="/agents/finops",
            capabilities=[
                AgentCapability(name="cost_estimation", description="Infracost ile maliyet tahmini"),
                AgentCapability(name="budget_validation", description="Bütçe eşik kontrolü"),
                AgentCapability(name="cost_optimization", description="Maliyet optimizasyon önerileri"),
            ],
            mcp_servers=["aws-pricing"],
            iam_role="devops-finops-agent-role",
            max_concurrent_tasks=3,
        ))

        # SRE Agent
        self.register(AgentCard(
            agent_id="sre-agent",
            name="SRE ve Self-Healing Ajanı",
            description="Monitoring, anomali tespiti, kök neden analizi ve otonom iyileştirme",
            endpoint="/agents/sre",
            capabilities=[
                AgentCapability(name="monitoring_setup", description="CloudWatch dashboard ve alarm kurulumu"),
                AgentCapability(name="anomaly_detection", description="Metrik anomali tespiti"),
                AgentCapability(name="rca_analysis", description="Kök neden analizi (RAG destekli)"),
                AgentCapability(name="auto_remediation", description="Otonom iyileştirme aksiyonları"),
                AgentCapability(name="incident_report", description="Olay raporu üretimi"),
            ],
            mcp_servers=["aws-cloudwatch"],
            iam_role="devops-sre-agent-role",
        ))

    def register(self, agent: AgentCard) -> None:
        """Yeni ajan kaydet"""
        self._agents[agent.agent_id] = agent

    def discover(self, agent_id: str) -> Optional[AgentCard]:
        """Ajan keşfi — A2A well-known endpoint"""
        return self._agents.get(agent_id)

    def list_agents(self) -> list[dict]:
        """Tüm ajanları listele"""
        return [
            {
                "id": a.agent_id,
                "name": a.name,
                "capabilities": [c.name for c in a.capabilities],
                "mcp_servers": a.mcp_servers,
            }
            for a in self._agents.values()
        ]

    def find_by_capability(self, capability: str) -> list[AgentCard]:
        """Yeteneğe göre ajan ara"""
        return [
            agent for agent in self._agents.values()
            if any(c.name == capability for c in agent.capabilities)
        ]

    def export_agent_json(self) -> str:
        """
        .well-known/agent.json formatında dışa aktar
        A2A protokolü standardı
        """
        return json.dumps({
            "protocol": "a2a-v1",
            "platform": "autonomous-devops",
            "version": "1.0.0",
            "agents": [asdict(a) for a in self._agents.values()],
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }, indent=2, ensure_ascii=False)
