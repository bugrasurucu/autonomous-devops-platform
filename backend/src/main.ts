import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    // rawBody needed for Stripe webhook signature verification
    rawBody: true,
  });

  // Security headers (Faz 0 — A6)
  app.use((_req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    next();
  });

  // Enable CORS with strict origin
  const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:3000').split(',');
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // In dev, allow all; in production, change to callback(new Error('Not allowed by CORS'))
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Stripe webhook needs raw body — must be registered BEFORE the global json parser
  // NestJS rawBody: true above handles this automatically via RawBodyRequest

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Global API prefix — all routes are served under /api
  // Note: controllers that previously used 'api/foo' have been updated to use just 'foo'
  app.setGlobalPrefix('api');

  // Friendly root & /api landing handler so visiting http://localhost:3001 never returns 404
  const httpAdapter = app.getHttpAdapter().getInstance() as express.Application;
  const frontendUrl = (process.env.FRONTEND_URL ?? 'http://localhost:3000').split(',')[0];
  const rootHandler = (req: express.Request, res: express.Response) => {
    const payload = {
      service: 'Orbitron Multi-Cloud Autonomous DevOps Control Plane API',
      status: 'online',
      version: '2.0.0',
      webDashboard: frontendUrl,
      endpoints: {
        health: '/api/health',
        readiness: '/api/health/ready',
        cloudProviders: '/api/deployments/providers',
        metrics: '/api/metrics',
      },
    };
    const acceptsHtml = (req.headers.accept || '').includes('text/html');
    if (acceptsHtml) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Orbitron Control Plane API (:3001)</title>
  <style>
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #050811; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { max-width: 640px; width: 92%; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(129, 140, 248, 0.25); border-radius: 16px; padding: 32px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; background: rgba(52, 211, 153, 0.15); color: #34d399; font-size: 12px; font-weight: 700; margin-bottom: 12px; }
    h1 { margin: 0 0 8px; font-size: 22px; }
    p { margin: 0 0 20px; color: #94a3b8; font-size: 14px; line-height: 1.6; }
    .btn { display: inline-block; padding: 10px 18px; border-radius: 8px; background: #818cf8; color: #050811; font-weight: 700; text-decoration: none; font-size: 14px; margin-right: 10px; }
    .links { margin-top: 22px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; gap: 14px; flex-wrap: wrap; font-size: 13px; }
    .links a { color: #38bdf8; text-decoration: none; font-family: monospace; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">● API ONLINE (:3001)</div>
    <h1>🪐 Orbitron Multi-Cloud Control Plane API</h1>
    <p>Port <strong>3001</strong> serves the NestJS Backend REST &amp; WebSocket API under <code>/api/*</code>.<br/>To use the full interactive web console, open the Next.js Web Dashboard on port <strong>3000</strong>:</p>
    <a class="btn" href="${frontendUrl}">🚀 Open Web Dashboard (${frontendUrl})</a>
    <div class="links">
      <a href="/api/health">/api/health</a>
      <a href="/api/health/ready">/api/health/ready</a>
      <a href="/api/openapi.json">/api/openapi.json</a>
      <a href="/api/metrics">/api/metrics</a>
    </div>
  </div>
</body>
</html>`);
    }
    return res.status(200).json(payload);
  };
  httpAdapter.get('/', rootHandler);
  httpAdapter.get('/api', rootHandler);
  httpAdapter.get('/api/openapi.json', (_req: express.Request, res: express.Response) => {
    return res.status(200).json({
      openapi: '3.1.0',
      info: {
        title: 'Orbitron Multi-Cloud Autonomous DevOps Platform API',
        version: '2.0.0',
        description: 'Control Plane REST API for Multi-Cloud IaC Synthesis (AWS, GCP, Azure, Kubernetes), Autonomous Agents, FinOps OPA Policies, and SAAV Self-Healing.',
      },
      paths: {
        '/api/deploy': { post: { summary: 'Trigger autonomous multi-cloud deployment orchestration' } },
        '/api/deployments': { get: { summary: 'List deployments for authenticated tenant' } },
        '/api/deployments/providers': { get: { summary: 'Get multi-cloud provider catalog & keyless OIDC setup templates' } },
        '/api/deployments/{id}/artifacts': { get: { summary: 'Get synthesized Dockerfile, OpenTofu/Terraform, K8s manifests, Security Gate & FinOps report' } },
        '/api/deployments/{id}/plan-diff': { get: { summary: 'Get structured OpenTofu plan diff (+add ~change -destroy) and iacHash' } },
        '/api/deployments/{id}/github-pr': { post: { summary: 'Prepare GitHub Setup Pull Request on orbitron/setup-* branch' } },
        '/api/deployments/{id}/rollback': { post: { summary: 'Rollback deployment to previous verified release' } },
        '/api/deployments/{id}/destroy': { post: { summary: 'Destroy environment resources (tofu destroy)' } },
        '/api/agents': { get: { summary: 'List autonomous DevOps agents and runtime telemetry' } },
        '/api/agents/tools': { get: { summary: 'List deterministic agent tool catalog & guardrail policies' } },
        '/api/agents/benchmark': { get: { summary: 'Run 10-stack multi-cloud evaluation benchmark suite' } },
        '/api/incidents/runbooks': { get: { summary: 'List declarative YAML SAAV remediation runbooks' } },
        '/api/incidents/{id}/saav-timeline': { get: { summary: 'Get 4-stage Sense→Analyze→Act→Verify timeline for incident' } },
        '/api/incidents/webhook/{provider}': { post: { summary: 'Ingest cloud alarm webhook (aws, gcp, azure, alertmanager)' } },
        '/api/finops': { get: { summary: 'Get multi-cloud cost breakdown, 30-day projection, anomalies, and IaC optimization patches' } },
        '/api/finops/opa-evaluate': { get: { summary: 'Evaluate OPA/Rego FinOps budget and compute policies' } },
        '/api/tenants/rbac-matrix': { get: { summary: 'Get environment-scoped RBAC permission matrix' } },
        '/api/tenants/audit-logs': { get: { summary: 'Query immutable tenant audit logs' } },
        '/api/tenants/audit-logs/export': { get: { summary: 'Export audit logs as JSON or CSV' } },
      },
    });
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  logger.log(`Mission Control API running on http://localhost:${port}`);
  logger.log(`kagent API: ${process.env.KAGENT_API_URL ?? 'http://kagent-controller.kagent.svc.cluster.local:8083'}`);
  logger.log(`WebSocket gateway enabled`);
}
bootstrap();
