# 🤖 Agent Capability Cards & A2A Discovery Protocol

Orbitron uses the **A2A (Agent-to-Agent)** communication protocol. A central registry dynamically registers and routes commands across the multi-agent fleet.

---

## 📇 The A2A Agent Card Standard

Every otonom agent exposes its capabilities via the standard `.well-known/agent.json` directory. This card lists their version, communication endpoints, and schema definitions:

```json
{
  "agent_id": "infra-agent",
  "name": "Platform ve Altyapı Ajanı",
  "version": "1.0.0",
  "protocol": "a2a-v1",
  "endpoint": "/agents/infra",
  "capabilities": [
    {
      "name": "generate_terraform",
      "description": "Generates HCL code based on repo research data"
    }
  ],
  "mcp_servers": ["aws-cloud-control", "aws-iac", "aws-terraform"],
  "iam_role": "devops-infra-agent-role"
}
```

---

## 🔌 Model Context Protocol (MCP) Sidecars

LLMs do not have direct access to AWS or GitHub APIs. Modifying agent code to add new tools creates brittle coupling. Orbitron solves this utilizing **MCP Sidecars**:

*   **Isolation:** Tools (pricing APIs, CloudWatch readers, Git managers) run in separate container instances.
*   **Discovery:** When an agent container starts, its sidecars expose their endpoints over standard JSON-RPC.
*   **Security:** If a sidecar container gets compromised, the agent's core code remains isolated.

---

## 📋 Registry API Interface

The `AgentRegistry` class inside the orchestrator provides central access to these agents:

*   `register(agent: AgentCard)`: Registers a new agent to the platform.
*   `discover(agent_id)`: Fetches an agent card and its capabilities.
*   `find_by_capability(cap_name)`: Returns agents that can execute a specific task.
*   `export_agent_json()`: Generates the aggregate platform `.well-known/agent.json` manifest.
