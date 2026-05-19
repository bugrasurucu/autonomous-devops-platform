# ⚙️ Custom LLM Routing & API Key Settings

Orbitron allows matching specific models to different devops jobs to optimize performance, speed, and API costs.

---

## 🤖 1. LLM Model Selection Matrix

Administrators can configure which model executes each deployment step:

| Agent / Phase | Recommended Model | Rationale |
|---------------|-------------------|-----------|
| **Auto-Bootstrap**| Gemini 2.5 Flash | High context window allows scanning massive code repositories quickly. |
| **Infra IaC** | Gemini 2.5 Pro | Deep reasoning capabilities are required for complex Terraform configurations. |
| **FinOps Gate** | Gemini 2.5 Flash | Ideal for parsing structural JSON estimates and pricing data. |
| **Pipeline Delivery**| Gemini 2.5 Pro | Handles complex visual UI QA smoke tests and code compilation scripts. |
| **SRE Healing**| Gemini 2.5 Pro | Executes high-level RCA reasoning over logs to formulate fixes. |

---

## 🔑 2. Gemini API Key Configuration

*   **System Credentials:** The primary system model token is configured via the `GEMINI_API_KEY` key inside the root `.env` file.
*   **User API Tokens:** Team members can supply their own personal keys under **Settings > AI Models** to bypass organizational credit limits.
*   **Encryption at Rest:** Personal keys are immediately encrypted using AES-256 before being committed to the database, ensuring developer security.
