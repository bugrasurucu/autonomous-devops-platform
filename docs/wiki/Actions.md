# 🎬 Automated CI/CD Actions & Visual QA Testing

Orbitron automates delivery pipelines. It utilizes a combination of traditional GitHub Actions runners and a **Browser Subagent** visual validation engine.

---

## 📦 GitHub Actions Workflows

The repository runs two primary CI/CD configurations:

### 1. Continuous Integration (`.github/workflows/ci.yml`)
*   Runs on every pull request or merge target commit on the `main` branch.
*   **Backend Node Validation:** Sets up a PostgreSQL database instance in the runner, executes Prisma database seed testing, compiles NestJS routes, and runs unit tests.
*   **Frontend client verification:** Verifies TypeScript compiler integrity and runs Next.js production builds (`next build`).

### 2. Continuous Delivery (`.github/workflows/cd.yml`)
*   Executes on successful version tag additions.
*   Compiles optimized production images utilizing multi-stage Dockerfiles.
*   Pushes these images to the GitHub Container Registry (GHCR) (`ghcr.io/bugrasurucu/autonomous-devops-platform`).

---

## 👁️ Visual QA via the Browser Subagent

Testing that code compiles is not enough. Orbitron verifies that the UI is visually correct:

1.  **Sandbox Launch:** The Pipeline Agent spins up the frontend codebase inside a temporary container.
2.  **Browser Subagent Navigation:** The agent opens the preview page utilizing a headless Chromium engine.
3.  **UI Verification:** The agent clicks tabs, fills forms, and checks layouts to confirm:
    *   No blank screens or deadlocks occur.
    *   Responsive menus expand correctly.
    *   CSS styles render as expected.
4.  **Reporting:** If any rendering error or 500 code is detected, the subagent blocks the pipeline and captures a screenshot of the issue.
