import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private transporter: nodemailer.Transporter;
    private from: string;
    private devMode = false;

    constructor(private config: ConfigService) {}

    async onModuleInit() {
        const host = this.config.get<string>('SMTP_HOST');

        if (!host) {
            // Dev fallback: Ethereal (fake SMTP — previews at ethereal.email)
            this.devMode = true;
            const testAccount = await nodemailer.createTestAccount();
            this.transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                auth: { user: testAccount.user, pass: testAccount.pass },
            });
            this.from = `"Orbitron" <noreply@orbitron.dev>`;
            this.logger.warn(`📧 Email dev mode — previews at ethereal.email (user: ${testAccount.user})`);
        } else {
            this.transporter = nodemailer.createTransport({
                host,
                port: this.config.get<number>('SMTP_PORT', 587),
                secure: this.config.get<boolean>('SMTP_SECURE', false),
                auth: {
                    user: this.config.get('SMTP_USER'),
                    pass: this.config.get('SMTP_PASS'),
                },
            });
            this.from = this.config.get('SMTP_FROM', '"Orbitron" <noreply@orbitron.dev>');
            this.logger.log(`📧 Email transport ready (host: ${host})`);
        }
    }

    private async send(to: string, subject: string, html: string) {
        try {
            const info = await this.transporter.sendMail({ from: this.from, to, subject, html });
            if (this.devMode) {
                const previewUrl = nodemailer.getTestMessageUrl(info);
                this.logger.log(`📧 Email preview: ${previewUrl}`);
            }
            return info;
        } catch (err: any) {
            this.logger.error(`Failed to send email to ${to}: ${err.message}`);
        }
    }

    async sendWelcome(email: string, name: string) {
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
            .container { max-width: 560px; margin: 40px auto; background: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155; }
            .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center; }
            .logo { font-size: 28px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
            .logo span { opacity: 0.7; font-weight: 400; font-size: 14px; display: block; margin-top: 4px; }
            .body { padding: 32px; }
            h1 { font-size: 22px; font-weight: 700; color: #f1f5f9; margin: 0 0 12px; }
            p { font-size: 15px; color: #94a3b8; line-height: 1.6; margin: 0 0 16px; }
            .cta { display: block; text-align: center; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; margin: 24px 0; }
            .features { display: grid; gap: 12px; margin: 24px 0; }
            .feature { background: #0f172a; border-radius: 8px; padding: 12px 16px; border-left: 3px solid #6366f1; }
            .feature strong { color: #818cf8; }
            .footer { padding: 20px 32px; border-top: 1px solid #334155; font-size: 12px; color: #475569; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">⊙ ORBITRON<span>Autonomous DevOps Platform</span></div>
            </div>
            <div class="body">
              <h1>Welcome aboard, ${name}! 🚀</h1>
              <p>You're now part of the future of infrastructure automation. Your Orbitron account is ready — here's what you can do:</p>
              <div class="features">
                <div class="feature"><strong>🏗 Infrastructure Agent</strong> — Terraform, CDK, CloudFormation, Checkov</div>
                <div class="feature"><strong>🔄 Pipeline Agent</strong> — GitHub Actions CI/CD with visual QA</div>
                <div class="feature"><strong>💰 FinOps Agent</strong> — Real-time cost estimation &amp; budget control</div>
                <div class="feature"><strong>🛡 SRE Agent</strong> — Self-healing SAAV cycle, anomaly detection</div>
              </div>
              <a href="${this.config.get('APP_URL', 'http://localhost:3000')}/dashboard" class="cta">Go to Dashboard →</a>
              <p style="font-size: 13px; color: #64748b;">Your infrastructure is now in orbit. If you have questions, reply to this email.</p>
            </div>
            <div class="footer">© ${new Date().getFullYear()} Orbitron — Autonomous DevOps Platform</div>
          </div>
        </body>
        </html>`;

        return this.send(email, '🚀 Welcome to Orbitron — Your infrastructure, in orbit', html);
    }

    async sendAgentComplete(
        email: string,
        agentName: string,
        taskSummary: string,
        status: 'completed' | 'failed' = 'completed',
    ) {
        const statusEmoji = status === 'completed' ? '✅' : '❌';
        const statusColor = status === 'completed' ? '#34d399' : '#f87171';
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
            .container { max-width: 560px; margin: 40px auto; background: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155; }
            .header { background: linear-gradient(135deg, #1e293b, #0f172a); padding: 20px 32px; border-bottom: 1px solid #334155; display: flex; align-items: center; gap: 12px; }
            .logo { font-size: 18px; font-weight: 800; color: #818cf8; }
            .body { padding: 32px; }
            h1 { font-size: 20px; font-weight: 700; color: #f1f5f9; margin: 0 0 8px; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: ${statusColor}20; color: ${statusColor}; border: 1px solid ${statusColor}40; margin-bottom: 20px; }
            .summary { background: #0f172a; border-radius: 8px; padding: 16px; border: 1px solid #334155; font-size: 14px; color: #cbd5e1; line-height: 1.6; }
            .cta { display: block; text-align: center; padding: 12px 24px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px; margin: 24px 0 0; }
            .footer { padding: 16px 32px; border-top: 1px solid #334155; font-size: 12px; color: #475569; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">⊙ ORBITRON</div>
            </div>
            <div class="body">
              <h1>${statusEmoji} Agent Task ${status === 'completed' ? 'Completed' : 'Failed'}</h1>
              <span class="badge">${agentName}</span>
              <div class="summary">${taskSummary}</div>
              <a href="${this.config.get('APP_URL', 'http://localhost:3000')}/dashboard/agents" class="cta">View Agent Dashboard →</a>
            </div>
            <div class="footer">© ${new Date().getFullYear()} Orbitron</div>
          </div>
        </body>
        </html>`;

        return this.send(email, `${statusEmoji} ${agentName} — Task ${status}`, html);
    }
}
