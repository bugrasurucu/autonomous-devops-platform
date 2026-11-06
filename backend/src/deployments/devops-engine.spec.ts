import { evaluateSecurityGate, calculateMultiCloudCostReport } from './devops-engine';
import { CLOUD_PROVIDER_CATALOG, buildStructuredPlanDiff } from '../providers/cloud-provider.registry';
import {
    evaluateToolGuardrail,
    executeDeterministicAgentTool,
    runMultiStackBenchmarkSuite,
} from '../agents/agent-tools.registry';
import { encryptSecret, decryptSecret, signOAuthState, verifyOAuthState } from '../common/crypto.util';

describe('Orbitron Autonomous DevOps Engine & Multi-Cloud Verification Suite', () => {
    describe('Phase 0 — AES-256-GCM Encryption & Signed OAuth CSRF State', () => {
        const testSecret = 'orbitron-unit-test-encryption-key-32b';

        it('encrypts and decrypts secrets symmetrically using AES-256-GCM', () => {
            const plain = 'gho_secret_github_token_12345';
            const cipher = encryptSecret(plain, testSecret);
            expect(cipher.startsWith('v2:')).toBe(true);
            expect(decryptSecret(cipher, testSecret)).toBe(plain);
        });

        it('signs and verifies OAuth state with user binding', () => {
            const state = signOAuthState('usr_test_01', testSecret);
            const verifiedUserId = verifyOAuthState(state, testSecret);
            expect(verifiedUserId).toBe('usr_test_01');
        });
    });

    describe('Phase 1 & 2 — Security Gate, Multi-Cloud Cost Engine & OpenTofu Plan Diff', () => {
        const sampleFiles = [
            {
                name: 'Dockerfile',
                content: 'FROM node:20-alpine\nUSER orbitron\nEXPOSE 3000\nHEALTHCHECK CMD wget -qO- http://localhost:3000/api/health || exit 1\nCMD ["node","dist/main.js"]',
            },
            {
                name: 'terraform/main.tf',
                content: 'terraform {\n  required_providers {\n    aws = { source = "hashicorp/aws", version = "~> 5.0" }\n  }\n}\nresource "aws_db_instance" "db" {\n  storage_encrypted = true\n}',
            },
            {
                name: 'k8s/manifest.yaml',
                content: 'resources:\n  requests:\n    cpu: "250m"\n    memory: "256Mi"\n  limits:\n    cpu: "500m"\n    memory: "512Mi"\nreadinessProbe:\n  httpGet:\n    path: /api/health\n    port: 3000',
            },
            {
                name: '.github/workflows/orbitron-ci-cd.yml',
                content: 'permissions:\n  id-token: write\nsteps:\n  - name: Trivy\n    uses: aquasecurity/trivy-action@master',
            },
        ];

        it('passes deterministic security gate for hardened DevOps artifacts', () => {
            const report = evaluateSecurityGate(sampleFiles, 'aws');
            expect(report.status).toBe('PASSED');
            expect(report.score).toBeGreaterThanOrEqual(85);
            expect(report.failedCount).toBe(0);
        });

        it('computes multi-cloud cost comparison across AWS, GCP, Azure, and Kubernetes', () => {
            const cost = calculateMultiCloudCostReport('gcp', 'production', 150, ['postgresql']);
            expect(cost.selectedProvider).toBe('gcp');
            expect(cost.withinBudget).toBe(true);
            expect(cost.providerComparison.length).toBe(4);
        });

        it('generates structured OpenTofu plan diff with SHA-256 iacHash', () => {
            const diff = buildStructuredPlanDiff({
                provider: 'azure',
                projectName: 'orbitron-api',
                environment: 'production',
                region: 'azure-westeurope',
                hasDatabase: true,
                files: sampleFiles,
            });
            expect(diff.iacHash).toHaveLength(16);
            expect(diff.summary.add).toBeGreaterThanOrEqual(3);
            expect(CLOUD_PROVIDER_CATALOG.azure.id).toBe('azure');
        });
    });

    describe('Phase 3 — Agent Tool Guardrails & 10-Stack Regression Benchmark', () => {
        it('blocks unauthorized or destructive production tool invocations without approval', () => {
            const unauthorized = evaluateToolGuardrail('finops-agent', 'cloud.destroy', { environment: 'production' });
            expect(unauthorized.allowed).toBe(false);

            const unapprovedDestroy = evaluateToolGuardrail('infra-agent', 'cloud.destroy', { environment: 'production' });
            expect(unapprovedDestroy.allowed).toBe(false);
            expect(unapprovedDestroy.requiresApproval).toBe(true);

            const approvedDestroy = evaluateToolGuardrail('infra-agent', 'cloud.destroy', {
                environment: 'production',
                approvedByHuman: true,
            });
            expect(approvedDestroy.allowed).toBe(true);
        });

        it('executes deterministic agent tools and passes 10-stack benchmark suite at 100%', () => {
            const planExec = executeDeterministicAgentTool('iac.plan', { provider: 'gcp', projectName: 'demo-service' });
            expect(planExec.output).toContain('OpenTofu Plan');

            const benchmark = runMultiStackBenchmarkSuite();
            expect(benchmark.totalArchetypes).toBe(10);
            expect(benchmark.passRatePercent).toBe(100);
        });
    });
});
