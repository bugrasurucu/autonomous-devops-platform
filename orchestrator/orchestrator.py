"""
Otonom DevOps Platformu — Çoklu Ajan Orkestratörü

Bu modül, uzman ajanlar (Infra, Pipeline, FinOps, SRE) arasındaki
iletişimi ve görev dağıtımını yönetir. Sıralı, eşzamanlı ve
devir teslim (handoff) orkestrasyon desenlerini destekler.

Google ADK ve A2A protokolü üzerinden çalışır.
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from enum import Enum
from dataclasses import dataclass, field
from typing import Any, Optional
from shared_state import SharedState, MasterClipboard

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(name)s] %(levelname)s: %(message)s')
logger = logging.getLogger("orchestrator")


class AgentRole(Enum):
    """Uzman ajan rolleri"""
    INFRA = "infra-agent"
    PIPELINE = "pipeline-agent"
    FINOPS = "finops-agent"
    SRE = "sre-agent"
    BOOTSTRAP = "auto-bootstrap"


class OrchestrationPattern(Enum):
    """Orkestrasyon desenleri"""
    SEQUENTIAL = "sequential"      # Sıralı zincir
    CONCURRENT = "concurrent"      # Eşzamanlı
    HANDOFF = "handoff"           # Devir teslim
    CIRCUIT_BREAKER = "circuit_breaker"  # Devre kesici


class TaskStatus(Enum):
    """Görev durumları"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    BLOCKED = "blocked"
    ROLLED_BACK = "rolled_back"


@dataclass
class AgentTask:
    """Bir ajana atanan görev"""
    task_id: str
    agent_role: AgentRole
    description: str
    input_data: dict = field(default_factory=dict)
    status: TaskStatus = TaskStatus.PENDING
    output_data: dict = field(default_factory=dict)
    error: Optional[str] = None
    retries: int = 0
    max_retries: int = 3
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_at: Optional[str] = None


@dataclass
class CircuitBreakerConfig:
    """Devre kesici konfigürasyonu"""
    max_retries: int = 3
    retry_backoff_seconds: list = field(default_factory=lambda: [5, 15, 60])
    finops_monthly_budget_usd: float = 500.0
    finops_per_deploy_max_usd: float = 50.0
    sre_max_auto_remediation_per_hour: int = 5
    sre_escalation_after_failures: int = 2


class AgentOrchestrator:
    """
    Çoklu Ajan Orkestratörü
    
    A2A protokolü üzerinden uzman ajanları koordine eder.
    Master Clipboard (paylaşılan durum) üzerinden veri akışını yönetir.
    """

    def __init__(self, circuit_breaker_config: Optional[CircuitBreakerConfig] = None):
        self.shared_state = SharedState()
        self.clipboard = MasterClipboard()
        self.circuit_breaker = circuit_breaker_config or CircuitBreakerConfig()
        self.task_history: list[AgentTask] = []
        self.agents: dict[AgentRole, dict] = {}
        self._register_default_agents()
        logger.info("🎯 Orkestratör başlatıldı")

    def _register_default_agents(self):
        """Varsayılan ajan kayıtları"""
        for role in AgentRole:
            self.agents[role] = {
                "role": role.value,
                "status": "idle",
                "capabilities": self._get_agent_capabilities(role),
                "mcp_servers": self._get_agent_mcp_servers(role),
            }

    def _get_agent_capabilities(self, role: AgentRole) -> list[str]:
        """Her ajanın yeteneklerini döndür"""
        capabilities = {
            AgentRole.BOOTSTRAP: ["repo_research", "architecture_analysis", "agent_dispatch"],
            AgentRole.INFRA: ["terraform_generate", "cdk_generate", "checkov_scan", "resource_provision"],
            AgentRole.PIPELINE: ["cicd_config", "test_generation", "visual_qa", "docker_build", "deployment"],
            AgentRole.FINOPS: ["cost_estimation", "budget_validation", "optimization_recommendations"],
            AgentRole.SRE: ["monitoring_setup", "anomaly_detection", "rca_analysis", "auto_remediation", "rollback"],
        }
        return capabilities.get(role, [])

    def _get_agent_mcp_servers(self, role: AgentRole) -> list[str]:
        """Her ajanın kullandığı MCP sunucularını döndür"""
        mcp_mapping = {
            AgentRole.BOOTSTRAP: ["aws-cloud-control", "aws-iac", "mcpdoc-aws"],
            AgentRole.INFRA: ["aws-cloud-control", "aws-iac", "aws-terraform", "mcpdoc-aws"],
            AgentRole.PIPELINE: ["mcpdoc-github-actions", "mcpdoc-aws"],
            AgentRole.FINOPS: ["aws-pricing", "mcpdoc-aws"],
            AgentRole.SRE: ["aws-cloudwatch", "mcpdoc-aws"],
        }
        return mcp_mapping.get(role, [])

    async def execute_sequential(self, tasks: list[AgentTask]) -> list[AgentTask]:
        """
        Sıralı Orkestrasyon — Ajanlar doğrusal zincirde çalışır.
        Her aşamanın başarısı bir sonrakini tetikler.
        """
        logger.info(f"📋 Sıralı orkestrasyon başlıyor: {len(tasks)} görev")
        results = []

        for i, task in enumerate(tasks):
            logger.info(f"  [{i+1}/{len(tasks)}] {task.agent_role.value}: {task.description}")
            
            # Önceki görevin çıktısını girdi olarak aktar
            if results and results[-1].status == TaskStatus.COMPLETED:
                task.input_data.update(results[-1].output_data)
                self.clipboard.write(task.agent_role.value, results[-1].output_data)

            result = await self._execute_agent_task(task)
            results.append(result)

            if result.status == TaskStatus.FAILED:
                logger.error(f"  ❌ {task.agent_role.value} başarısız: {result.error}")
                # Devre kesici — kalan görevleri iptal et
                for remaining in tasks[i+1:]:
                    remaining.status = TaskStatus.BLOCKED
                    results.append(remaining)
                break

            if result.status == TaskStatus.BLOCKED:
                logger.warning(f"  ⏸️ {task.agent_role.value} bloklandı (bütçe/güvenlik)")
                break

        return results

    async def execute_concurrent(self, tasks: list[AgentTask]) -> list[AgentTask]:
        """
        Eşzamanlı Orkestrasyon — Aynı girdi birden fazla ajana gönderilir.
        Hız kritik durumlarda (olay müdahalesi) kullanılır.
        """
        logger.info(f"⚡ Eşzamanlı orkestrasyon başlıyor: {len(tasks)} görev")
        
        coroutines = [self._execute_agent_task(task) for task in tasks]
        results = await asyncio.gather(*coroutines, return_exceptions=True)
        
        processed = []
        for result in results:
            if isinstance(result, Exception):
                task = AgentTask(
                    task_id="error",
                    agent_role=AgentRole.BOOTSTRAP,
                    description="Error",
                    status=TaskStatus.FAILED,
                    error=str(result)
                )
                processed.append(task)
            else:
                processed.append(result)
        
        return processed

    async def execute_handoff(self, task: AgentTask, routing_rules: dict) -> AgentTask:
        """
        Devir Teslim (Handoff) — Görev içeriğine göre dinamik yönlendirme.
        Merkezi orkestratör, görev içeriğini analiz ederek uygun ajana devreder.
        """
        logger.info(f"🔄 Devir teslim analizi: {task.description}")
        
        # Görev içeriğini analiz et ve uygun ajanı seç
        target_role = self._route_task(task, routing_rules)
        task.agent_role = target_role
        
        logger.info(f"  → Yönlendirme: {target_role.value}")
        return await self._execute_agent_task(task)

    def _route_task(self, task: AgentTask, rules: dict) -> AgentRole:
        """Görev içeriğine göre ajan yönlendirmesi"""
        description_lower = task.description.lower()
        
        # Anahtar kelime tabanlı yönlendirme
        routing = {
            AgentRole.SRE: ["alarm", "down", "error", "crash", "memory", "cpu", "latency", "incident"],
            AgentRole.INFRA: ["vpc", "ecs", "rds", "s3", "terraform", "infrastructure", "provision"],
            AgentRole.FINOPS: ["cost", "budget", "pricing", "expensive", "optimize", "maliyet"],
            AgentRole.PIPELINE: ["deploy", "build", "test", "ci", "cd", "pipeline", "release"],
        }
        
        for role, keywords in routing.items():
            if any(kw in description_lower for kw in keywords):
                return role
        
        # Varsayılan: Bootstrap
        return AgentRole.BOOTSTRAP

    async def _execute_agent_task(self, task: AgentTask) -> AgentTask:
        """
        Tek bir ajan görevini yürüt (devre kesici mantığı ile).
        Gerçek implementasyonda bu, ilgili Antigravity skill'ini tetikler.
        """
        task.status = TaskStatus.RUNNING
        self.agents[task.agent_role]["status"] = "running"
        
        try:
            # Simüle edilmiş ajan yürütmesi
            # Gerçek implementasyonda: Antigravity Agent Manager API çağrısı
            logger.info(f"    🤖 {task.agent_role.value} çalıştırılıyor...")
            
            # FinOps devre kesici kontrolü
            if task.agent_role == AgentRole.FINOPS:
                cost_result = task.input_data.get("estimated_cost", 0)
                if cost_result > self.circuit_breaker.finops_monthly_budget_usd:
                    task.status = TaskStatus.BLOCKED
                    task.error = f"Bütçe aşımı: ${cost_result} > ${self.circuit_breaker.finops_monthly_budget_usd}"
                    logger.warning(f"    🛑 FinOps devre kesici tetiklendi: {task.error}")
                    return task

            # Görev çıktısını Shared State'e yaz
            task.output_data = {
                "agent": task.agent_role.value,
                "status": "success",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            task.status = TaskStatus.COMPLETED
            task.completed_at = datetime.now(timezone.utc).isoformat()
            
            self.clipboard.write(task.agent_role.value, task.output_data)
            self.shared_state.append_log(task.agent_role.value, f"Görev tamamlandı: {task.description}")
            
        except Exception as e:
            task.retries += 1
            if task.retries >= task.max_retries:
                task.status = TaskStatus.FAILED
                task.error = str(e)
                logger.error(f"    ❌ Maksimum deneme aşıldı: {e}")
            else:
                backoff = self.circuit_breaker.retry_backoff_seconds[
                    min(task.retries - 1, len(self.circuit_breaker.retry_backoff_seconds) - 1)
                ]
                logger.warning(f"    🔄 Tekrar deneniyor ({task.retries}/{task.max_retries}), bekleme: {backoff}s")
                await asyncio.sleep(backoff)
                return await self._execute_agent_task(task)
        
        finally:
            self.agents[task.agent_role]["status"] = "idle"
            self.task_history.append(task)
        
        return task

    async def deploy_project(self, project_research: dict) -> dict:
        """
        Uçtan uca otonom dağıtım — "Drop and Deploy" ana iş akışı.
        
        Orkestrasyon sırası:
        1. Infra Agent → Altyapı kodu üret ve provizyonla
        2. FinOps Agent → Maliyet analizi ve bütçe doğrulama
        3. Pipeline Agent → CI/CD yapılandır ve ilk dağıtımı yap
        4. SRE Agent → Monitoring ve self-healing kur
        """
        logger.info("🚀 Otonom dağıtım başlıyor...")
        self.clipboard.write("project_research", project_research)

        tasks = [
            AgentTask(
                task_id="infra-001",
                agent_role=AgentRole.INFRA,
                description="AWS altyapısını kodla ve provizyonla (VPC, ECS, RDS)",
                input_data=project_research,
            ),
            AgentTask(
                task_id="finops-001",
                agent_role=AgentRole.FINOPS,
                description="Terraform planının maliyet analizini yap ve bütçeyi doğrula",
            ),
            AgentTask(
                task_id="pipeline-001",
                agent_role=AgentRole.PIPELINE,
                description="CI/CD pipeline yapılandır ve ilk dağıtımı gerçekleştir",
            ),
            AgentTask(
                task_id="sre-001",
                agent_role=AgentRole.SRE,
                description="CloudWatch monitoring ve self-healing altyapısını kur",
            ),
        ]

        results = await self.execute_sequential(tasks)

        # Sonuç raporu
        report = {
            "deployment_id": f"DEP-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}",
            "status": "success" if all(t.status == TaskStatus.COMPLETED for t in results) else "failed",
            "tasks": [
                {
                    "task_id": t.task_id,
                    "agent": t.agent_role.value,
                    "status": t.status.value,
                    "error": t.error,
                }
                for t in results
            ],
            "shared_state": self.clipboard.read_all(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        logger.info(f"📊 Dağıtım sonucu: {report['status']}")
        return report

    async def handle_incident(self, incident_data: dict) -> dict:
        """
        Olay müdahalesi — SRE ve Pipeline ajanları eşzamanlı çalışır.
        
        SRE: Kök neden analizi + otomatik iyileştirme
        Pipeline: Gerekirse rollback hazırlığı
        """
        logger.info(f"🚨 Olay müdahalesi başlıyor: {incident_data.get('alarm_name', 'unknown')}")

        tasks = [
            AgentTask(
                task_id="sre-incident-001",
                agent_role=AgentRole.SRE,
                description="Kök neden analizi yap ve otomatik iyileştirme uygula",
                input_data=incident_data,
            ),
            AgentTask(
                task_id="pipeline-rollback-001",
                agent_role=AgentRole.PIPELINE,
                description="Rollback hazırlığı yap (gerekirse önceki sürüme dön)",
                input_data=incident_data,
            ),
        ]

        results = await self.execute_concurrent(tasks)

        return {
            "incident_id": incident_data.get("incident_id", "unknown"),
            "results": [
                {"agent": t.agent_role.value, "status": t.status.value, "output": t.output_data}
                for t in results
            ],
        }


# Ana giriş noktası
async def main():
    """Orkestratör demo çalışması"""
    orchestrator = AgentOrchestrator()

    # Örnek proje araştırma çıktısı
    project_research = {
        "project_type": "nodejs",
        "framework": "express",
        "database": "mongodb",
        "has_dockerfile": True,
        "port": 3000,
        "env_vars": ["MONGO_URI", "JWT_SECRET", "PORT"],
        "test_framework": "jest",
        "estimated_resources": {
            "compute": "ECS Fargate",
            "database": "DocumentDB",
            "networking": "VPC + ALB",
            "storage": "S3",
        },
    }

    # Uçtan uca dağıtım
    result = await orchestrator.deploy_project(project_research)
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())
