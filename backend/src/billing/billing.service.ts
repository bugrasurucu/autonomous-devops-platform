import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { Plan } from '@prisma/client';

// Stripe Price IDs — set in env
const PRICE_IDS: Partial<Record<Plan, string>> = {
    starter: process.env.STRIPE_PRICE_STARTER ?? 'price_starter_placeholder',
    pro: process.env.STRIPE_PRICE_PRO ?? 'price_pro_placeholder',
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? 'price_enterprise_placeholder',
};

const PLAN_LIMITS: Record<Plan, { deploymentsPerMonth: number; tokenBudget: number; priceUsd: number }> = {
    free:       { deploymentsPerMonth: 3,   tokenBudget: 50_000,    priceUsd: 0  },
    starter:    { deploymentsPerMonth: 20,  tokenBudget: 200_000,   priceUsd: 9  },
    pro:        { deploymentsPerMonth: -1,  tokenBudget: 500_000,   priceUsd: 29 },
    enterprise: { deploymentsPerMonth: -1,  tokenBudget: 5_000_000, priceUsd: 0  },
};

@Injectable()
export class BillingService {
    private readonly logger = new Logger(BillingService.name);
    private stripe: any = null;

    constructor(
        private config: ConfigService,
        private prisma: PrismaService,
        private tenants: TenantsService,
    ) {
        const stripeKey = this.config.get<string>('STRIPE_SECRET_KEY');
        if (stripeKey) {
            try {
                // Dynamic import to avoid hard dependency crash when not installed
                // Install with: npm install stripe
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const Stripe = require('stripe');
                this.stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
                this.logger.log('Stripe initialized');
            } catch {
                this.logger.warn('stripe package not installed — billing disabled');
            }
        } else {
            this.logger.warn('STRIPE_SECRET_KEY not set — billing disabled');
        }
    }

    getPlans() {
        return Object.entries(PLAN_LIMITS).map(([plan, limits]) => ({
            plan,
            ...limits,
            priceId: PRICE_IDS[plan as Plan] ?? null,
        }));
    }

    async createCheckoutSession(orgId: string, plan: Plan, returnUrl: string) {
        if (!this.stripe) throw new BadRequestException('Stripe not configured');
        if (plan === 'free') throw new BadRequestException('Free plan has no checkout');

        const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
        if (!org) throw new BadRequestException('Organization not found');

        const priceId = PRICE_IDS[plan];
        if (!priceId) throw new BadRequestException(`No price configured for plan: ${plan}`);

        let customerId = org.stripeCustomerId;
        if (!customerId) {
            const customer = await this.stripe.customers.create({ metadata: { orgId } });
            customerId = customer.id;
            await this.prisma.organization.update({
                where: { id: orgId },
                data: { stripeCustomerId: customerId },
            });
        }

        const session = await this.stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${returnUrl}?success=true&plan=${plan}`,
            cancel_url: `${returnUrl}?canceled=true`,
            metadata: { orgId, plan },
        });

        return { url: session.url, sessionId: session.id };
    }

    async createPortalSession(orgId: string, returnUrl: string) {
        if (!this.stripe) throw new BadRequestException('Stripe not configured');

        const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
        if (!org?.stripeCustomerId) throw new BadRequestException('No billing account found');

        const session = await this.stripe.billingPortal.sessions.create({
            customer: org.stripeCustomerId,
            return_url: returnUrl,
        });

        return { url: session.url };
    }

    async handleWebhook(rawBody: Buffer, signature: string) {
        if (!this.stripe) return;

        const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
        if (!webhookSecret) return;

        let event: any;
        try {
            event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
        } catch (err) {
            this.logger.error('Stripe webhook signature verification failed', err);
            throw new BadRequestException('Invalid webhook signature');
        }

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const { orgId, plan } = session.metadata ?? {};
                if (orgId && plan) {
                    await this.tenants.updatePlan(orgId, plan as Plan);
                    await this.prisma.organization.update({
                        where: { id: orgId },
                        data: { stripeSubId: session.subscription },
                    });
                    this.logger.log(`Plan upgraded: org=${orgId} plan=${plan}`);
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const sub = event.data.object;
                const org = await this.prisma.organization.findFirst({
                    where: { stripeSubId: sub.id },
                });
                if (org) {
                    await this.tenants.updatePlan(org.id, 'free');
                    this.logger.log(`Subscription cancelled — reverted to free: org=${org.id}`);
                }
                break;
            }
        }
    }
}
