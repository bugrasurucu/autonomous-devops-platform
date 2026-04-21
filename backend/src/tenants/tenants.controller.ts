import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
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

    @Get(':id/members')
    getMembers(@Param('id') id: string) {
        return this.tenantsService.getOrganizationById(id);
    }

    @Post(':id/members')
    invite(
        @Param('id') orgId: string,
        @Body('userId') userId: string,
        @Body('role') role: 'admin' | 'member' | 'viewer',
    ) {
        return this.tenantsService.inviteMember(orgId, userId, role);
    }

    @Delete(':id/members/:userId')
    remove(@Param('id') orgId: string, @Param('userId') userId: string) {
        return this.tenantsService.removeMember(orgId, userId);
    }
}
