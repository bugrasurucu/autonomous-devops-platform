import { Controller, Get, Post, Body, Headers, RawBodyRequest, Req, UseGuards, Request } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantsService } from '../tenants/tenants.service';
import { Plan } from '@prisma/client';

@Controller('billing')
export class BillingController {
    constructor(
        private billing: BillingService,
        private tenants: TenantsService,
    ) {}

    @Get('plans')
    getPlans() {
        return this.billing.getPlans();
    }

    @Get('invoices')
    @UseGuards(JwtAuthGuard)
    async getInvoices(@Request() req: any) {
        const org = await this.tenants.getOrCreateOrgForUser(req.user.userId);
        return this.billing.getInvoices(org.id, req.user.userId);
    }

    @Post('checkout')
    @UseGuards(JwtAuthGuard)
    async checkout(
        @Request() req: any,
        @Body('plan') plan: Plan,
        @Body('returnUrl') returnUrl: string,
    ) {
        const org = await this.tenants.getOrCreateOrgForUser(req.user.userId);
        return this.billing.createCheckoutSession(org.id, plan, returnUrl, req.user.userId);
    }

    @Post('portal')
    @UseGuards(JwtAuthGuard)
    async portal(@Request() req: any, @Body('returnUrl') returnUrl: string) {
        const org = await this.tenants.getOrCreateOrgForUser(req.user.userId);
        return this.billing.createPortalSession(org.id, returnUrl);
    }

    // Stripe sends raw body — must be registered before global json parser in main.ts
    @Post('webhook')
    async webhook(
        @Req() req: RawBodyRequest<any>,
        @Headers('stripe-signature') signature: string,
    ) {
        await this.billing.handleWebhook(req.rawBody!, signature);
        return { received: true };
    }
}
