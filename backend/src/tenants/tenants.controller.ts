import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantsController {
    constructor(private tenantsService: TenantsService) {}

    @Post()
    create(@Request() req: any, @Body('name') name: string) {
        return this.tenantsService.createOrganization(req.user.userId, name);
    }

    @Get('me')
    async getMine(@Request() req: any) {
        const org = await this.tenantsService.getOrCreateOrgForUser(req.user.userId);
        return this.tenantsService.getOrganizationById(org.id);
    }

    @Get('rbac-matrix')
    getRbacMatrix() {
        return this.tenantsService.getRbacMatrix();
    }

    @Get('audit-logs')
    getAuditLogs(@Request() req: any, @Query('limit') limit?: string) {
        return this.tenantsService.getAuditLogs(req.user.userId, limit ? parseInt(limit, 10) : 50);
    }

    @Get('audit-logs/export')
    exportAuditLogs(@Request() req: any, @Query('format') format?: 'json' | 'csv') {
        return this.tenantsService.exportAuditLogs(req.user.userId, format === 'csv' ? 'csv' : 'json');
    }

    @Get(':id/members')
    getMembers(@Param('id') id: string) {
        return this.tenantsService.getOrganizationById(id);
    }

    @Post(':id/members')
    invite(
        @Param('id') orgId: string,
        @Body() body: { userId?: string; email?: string; role?: 'admin' | 'member' | 'viewer' },
    ) {
        return this.tenantsService.inviteMember(orgId, body.email || body.userId || '', body.role || 'member');
    }

    @Delete(':id/members/:userId')
    remove(@Param('id') orgId: string, @Param('userId') userId: string) {
        return this.tenantsService.removeMember(orgId, userId);
    }
}
