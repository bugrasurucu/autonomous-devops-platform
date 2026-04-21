import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { KagentBridgeService } from './kagent-bridge.service';
import { ConfigService } from '@nestjs/config';

@Controller('kagent')
@UseGuards(JwtAuthGuard)
export class KagentBridgeController {
    constructor(
        private readonly kagent: KagentBridgeService,
        private readonly config: ConfigService,
    ) {}

    @Get('status')
    getStatus() {
        const available = this.kagent.isKagentAvailable();
        return {
            available,
            mode: available ? 'real' : 'simulated',
            clusterUrl: this.config.get('KAGENT_API_URL', 'http://kagent-controller.kagent.svc.cluster.local:8083'),
            description: available
                ? 'Connected to a live Kubernetes cluster with kagent installed'
                : 'Running in simulation mode — no Kubernetes cluster required for development',
            k8sRequired: true,
            k8sReason: [
                'Each tenant gets an isolated Kubernetes namespace for multi-tenancy',
                'kagent runs as a K8s Custom Resource (CRD) providing agent scheduling and tool execution',
                'Horizontal Pod Autoscaling ensures agents scale with workload',
                'K8s RBAC enforces least-privilege per agent, satisfying compliance requirements',
                'Cluster-native networking enables secure MCP server sidecar injection',
            ],
        };
    }
}
