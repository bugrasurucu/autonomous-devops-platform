"""
Otonom DevOps Platformu — kagent Orkestratörü

NestJS backend tarafından tetiklenir veya standalone çalışır.
kagent API üzerinden gerçek AI ajanlarını koordine eder.
Sıralı, eşzamanlı ve devir teslim (handoff) desenlerini destekler.
"""

import asyncio
import json
import logging
import os
import httpx
from datetime import datetime, timezone
from enum import Enum
from dataclasses import dataclass, field
from typing import Any, Optional
from shared_state import SharedState, MasterClipboard

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(name)s] %(levelname)s: %(message)s')
logger = logging.getLogger("orchestrator")

KAGENT_API_URL = os.getenv("KAGENT_API_URL", "http://kagent-controller.kagent.svc.cluster.local:8083")
KAGENT_NAMESPACE = os.getenv("KAGENT_NAMESPACE", "kagent")


class AgentRole(Enum):
    INFRA     = "infra-agent"
    PIPELINE  = "pipeline-agent"
    FINOPS    = "finops-agent"
    SRE       = "sre-agent"
    BOOTSTRAP = "bootstrap-agent"


class OrchestrationPattern(Enum):
    SEQUENTIAL    = "sequential"
    CONCURRENT    = "concurrent"
    HANDOFF       = "handoff"
    CIRCUIT_BREAKER = "circuit_breaker"


class TaskStatus(Enum):
    PENDING    = "pending"
    RUNNING    = "running"
    COMPLETED  = "completed"
    FAILED     = "failed"
    BLOCKED    = "blocked"
    ROLLED_BACK = "rolled_back"


@dataclass
class AgentTask:
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
    max_retries: int = 3
    retry_backoff_seconds: list = field(default_factory=lambda: [5, 15, 60])
    finops_monthly_budget_usd: float = 500.0
    finops_per_deploy_max_usd: float = 50.0
    sre_max_auto_remediation_per_hour: int = 5
    sre_escalation_after_failures: int = 2


class KagentClient:
    """kagent REST API istemcisi"""

    def __init__(self, base_url: str = KAGENT_API_URL):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=300.0)

    async def invoke_agent(
        self,
        agent_id: str,
        task: str,
        namespace: str = KAGENT_NAMESPACE,
        model: Optional[str] = None,
        max_tokens: int = 4096,
    ) -> dict:
        """kagent agent'ını çağır ve sonucu döndür"""
        session_id = f"sess-{int(datetime.now().timestamp() * 1000)}"
        url = f"{self.base_url}/api/v1/namespaces/{namespace}/agents/{agent_id}/sessions/{session_id}/messages"

        payload: dict = {"content": task, "max_tokens": max_tokens}
        if model:
            payload["model_config"] = {"model": model}

        logger.info(f"  kagent → {agent_id} (session={session_id})")

        try:
            response = await self.client.post(url, json=payload)
            response.raise_for_status()

            # Collect SSE stream
            steps = []
            result_text = ""
            usage = {"model": model or "unknown", "input_tokens": 0, "output_tokens": 0}

            async for line in response.aiter_lines():
                if not line.startswith("data: "):
                    continue
                try:
                    event = json.loads(line[6:])
                    if event.get("type") in ("thought", "reasoning"):
                        steps.append({"type": "reason", "content": event.get("content", "")})
                    elif event.get("type") == "tool_call":
                        steps.append({"type": "act", "tool": event.get("tool_name"), "output": event.get("result")})
                    elif event.get("type") == "observation":
                        steps.append({"type": "observe", "content": event.get("content", "")})
                    if event.get("result"):
                        result_text = event["result"]
                    if event.get("usage"):
                        usage.update(event["usage"])
                except Exception:
                    pass

            return {
                "session_id": session_id,
                "agent_id": agent_id,
                "status": "completed",
                "steps": steps,
                "result": result_text,
                "usage": usage,
            }

        except httpx.HTTPStatusError as e:
            raise RuntimeError(f"kagent API error {e.response.status_code}: {e.response.text}") from e
        except httpx.ConnectError:
            raise RuntimeError(f"kagent API unreachable at {self.base_url}")

    async def close(self):
        await self.client.aclose()


class AgentOrchestrator:
    """
    Çoklu Ajan Orkestratörü — kagent API üzerinden çalışır.
    NestJS DeploymentsService bu sınıfı dolaylı olarak kullanır.
    Standalone test için main() fonksiyonu bulunur.
    """

    def __init__(
        self,
        circuit_breaker_config: Optional[CircuitBreakerConfig] = None,
        kagent_namespace: str = KAGENT_NAMESPACE,
    ):
        self.shared_state = SharedState()
        self.clipboard = MasterClipboard()
        self.circuit_breaker = circuit_breaker_config or CircuitBreakerConfig()
        self.task_history: list[AgentTask] = []
        self.kagent = KagentClient()
        self.namespace = kagent_namespace
        logger.info("🎯 Orkestratör başlatıldı (kagent modu)")

    async def execute_sequential(self, tasks: list[AgentTask]) -> list[AgentTask]:
        """Sıralı zincir — her başarı bir sonrakini tetikler."""
        logger.info(f"📋 Sıralı orkestrasyon: {len(tasks)} görev")
        results = []

        for i, task in enumerate(tasks):
            logger.info(f"  [{i+1}/{len(tasks)}] {task.agent_role.value}: {task.description[:60]}")

            if results and results[-1].status == TaskStatus.COMPLETED:
                task.input_data.update(results[-1].output_data)
                self.clipboard.write(task.agent_role.value, results[-1].output_data)

            result = await self._execute_agent_task(task)
            results.append(result)

            if result.status in (TaskStatus.FAILED, TaskStatus.BLOCKED):
                logger.warning(f"  ⏹ Stopping orchestration: {task.agent_role.value} → {result.status.value}")
                for remaining in tasks[i + 1:]:
                    remaining.status = TaskStatus.BLOCKED
                    results.append(remaining)
                break

        return results

    async def execute_concurrent(self, tasks: list[AgentTask]) -> list[AgentTask]:
        """Eşzamanlı — aynı anda birden fazla ajan."""
        logger.info(f"⚡ Eşzamanlı orkestrasyon: {len(tasks)} görev")
        coroutines = [self._execute_agent_task(task) for task in tasks]
        raw = await asyncio.gather(*coroutines, return_exceptions=True)

        processed = []
        for i, r in enumerate(raw):
            if isinstance(r, Exception):
                tasks[i].status = TaskStatus.FAILED
                tasks[i].error = str(r)
                processed.append(tasks[i])
            else:
                processed.append(r)
        return processed

    async def execute_handoff(self, task: AgentTask, routing_rules: dict) -> AgentTask:
        """İçeriğe göre dinamik ajan yönlendirmesi."""
        target_role = self._route_task(task, routing_rules)
        task.agent_role = target_role
        logger.info(f"🔄 Handoff → {target_role.value}: {task.description[:60]}")
        return await self._execute_agent_task(task)

    def _route_task(self, task: AgentTask, rules: dict = {}) -> AgentRole:  # noqa: ARG002
        desc = task.description.lower()
        routing = {
            AgentRole.SRE:      ["alarm", "down", "error", "crash", "memory", "cpu", "latency", "incident"],
            AgentRole.INFRA:    ["vpc", "ecs", "rds", "s3", "terraform", "infrastructure", "provision"],
            AgentRole.FINOPS:   ["cost", "budget", "pricing", "expensive", "optimize", "maliyet"],
            AgentRole.PIPELINE: ["deploy", "build", "test", "ci", "cd", "pipeline", "release"],
        }
        for role, keywords in routing.items():
            if any(kw in desc for kw in keywords):
                return role
        return AgentRole.BOOTSTRAP

    async def _execute_agent_task(self, task: AgentTask) -> AgentTask:
        task.status = TaskStatus.RUNNING

        try:
            # FinOps devre kesici
            if task.agent_role == AgentRole.FINOPS:
                cost = task.input_data.get("estimated_cost", 0)
                if cost > self.circuit_breaker.finops_per_deploy_max_usd:
                    task.status = TaskStatus.BLOCKED
                    task.error = f"Per-deploy budget exceeded: ${cost} > ${self.circuit_breaker.finops_per_deploy_max_usd}"
                    logger.warning(f"    🛑 FinOps circuit breaker: {task.error}")
                    return task

            # kagent API çağrısı
            kagent_result = await self.kagent.invoke_agent(
                agent_id=task.agent_role.value,
                task=task.description,
                namespace=self.namespace,
                max_tokens=8192 if task.agent_role == AgentRole.INFRA else 4096,
            )

            task.output_data = {
                "agent": task.agent_role.value,
                "status": "success",
                "result": kagent_result.get("result", ""),
                "steps_count": len(kagent_result.get("steps", [])),
                "usage": kagent_result.get("usage", {}),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            task.status = TaskStatus.COMPLETED
            task.completed_at = datetime.now(timezone.utc).isoformat()

            self.clipboard.write(task.agent_role.value, task.output_data)
            self.shared_state.append_log(task.agent_role.value, f"Completed: {task.description[:60]}")

        except Exception as e:
            task.retries += 1
            if task.retries >= task.max_retries:
                task.status = TaskStatus.FAILED
                task.error = str(e)
                logger.error(f"    ❌ Max retries exceeded: {e}")
            else:
                backoff = self.circuit_breaker.retry_backoff_seconds[
                    min(task.retries - 1, len(self.circuit_breaker.retry_backoff_seconds) - 1)
                ]
                logger.warning(f"    🔄 Retry {task.retries}/{task.max_retries}, backoff {backoff}s")
                await asyncio.sleep(backoff)
                return await self._execute_agent_task(task)

        finally:
            self.task_history.append(task)

        return task

    async def deploy_project(self, project_research: dict) -> dict:
        """
        Uçtan uca otonom dağıtım — Drop & Deploy akışı.
        Bootstrap → Infra → FinOps → Pipeline → SRE (sıralı)
        """
        logger.info("🚀 Otonom dağıtım başlıyor...")
        self.clipboard.write("project_research", project_research)

        tasks = [
            AgentTask(
                task_id="bootstrap-001",
                agent_role=AgentRole.BOOTSTRAP,
                description=f"Analyze project '{project_research.get('project_name', 'app')}' and determine AWS architecture",
                input_data=project_research,
            ),
            AgentTask(
                task_id="infra-001",
                agent_role=AgentRole.INFRA,
                description=f"Generate Terraform infrastructure for '{project_research.get('project_name', 'app')}' in {project_research.get('region', 'us-east-1')}",
            ),
            AgentTask(
                task_id="finops-001",
                agent_role=AgentRole.FINOPS,
                description=f"Estimate costs and validate against ${project_research.get('budget', 50)}/deploy budget",
            ),
            AgentTask(
                task_id="pipeline-001",
                agent_role=AgentRole.PIPELINE,
                description=f"Generate GitHub Actions CI/CD pipeline for {project_research.get('github_repo', 'the project')}",
            ),
            AgentTask(
                task_id="sre-001",
                agent_role=AgentRole.SRE,
                description=f"Set up CloudWatch monitoring and self-healing for {project_research.get('project_name', 'app')}",
            ),
        ]

        results = await self.execute_sequential(tasks)

        report = {
            "deployment_id": f"DEP-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}",
            "status": "success" if all(t.status == TaskStatus.COMPLETED for t in results) else "failed",
            "tasks": [
                {
                    "task_id": t.task_id,
                    "agent": t.agent_role.value,
                    "status": t.status.value,
                    "error": t.error,
                    "usage": t.output_data.get("usage"),
                }
                for t in results
            ],
            "shared_state": self.clipboard.read_all(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        logger.info(f"📊 Dağıtım: {report['status']}")
        await self.kagent.close()
        return report

    async def handle_incident(self, incident_data: dict) -> dict:
        """Olay müdahalesi — SRE ve Pipeline eşzamanlı."""
        logger.info(f"🚨 Olay: {incident_data.get('alarm_name', 'unknown')}")

        tasks = [
            AgentTask(
                task_id="sre-incident-001",
                agent_role=AgentRole.SRE,
                description=f"RCA and auto-remediation for: {incident_data.get('alarm_name', 'unknown')} - {incident_data.get('description', '')}",
                input_data=incident_data,
            ),
            AgentTask(
                task_id="pipeline-rollback-001",
                agent_role=AgentRole.PIPELINE,
                description=f"Assess rollback necessity for: {incident_data.get('service', 'unknown')}",
                input_data=incident_data,
            ),
        ]

        results = await self.execute_concurrent(tasks)
        await self.kagent.close()

        return {
            "incident_id": incident_data.get("incident_id", "unknown"),
            "results": [
                {"agent": t.agent_role.value, "status": t.status.value, "output": t.output_data}
                for t in results
            ],
        }


async def main():
    """Standalone test — kagent cluster'ı gerektirir."""
    orchestrator = AgentOrchestrator(
        kagent_namespace=os.getenv("KAGENT_NAMESPACE", "kagent")
    )

    project_research = {
        "project_name": "my-api",
        "project_type": "nodejs",
        "framework": "express",
        "database": "postgresql",
        "has_dockerfile": True,
        "port": 3000,
        "github_repo": "myorg/my-api",
        "region": "us-east-1",
        "environment": "production",
        "budget": 50,
    }

    result = await orchestrator.deploy_project(project_research)
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())
