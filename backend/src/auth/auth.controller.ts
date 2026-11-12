import {
    Controller,
    Post,
    Get,
    Put,
    Delete,
    Body,
    UseGuards,
    Request,
    Res,
    Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    async register(
        @Body() body: { email: string; password: string; name?: string },
    ) {
        return this.authService.register(
            body.email,
            body.password,
            body.name || 'User',
        );
    }

    @Post('login')
    async login(@Body() body: { email: string; password: string; totpCode?: string }) {
        return this.authService.login(body.email, body.password, body.totpCode);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async me(@Request() req: any) {
        return this.authService.getProfile(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Put('profile')
    async updateProfile(
        @Request() req: any,
        @Body() body: { name?: string; company?: string; avatar?: string },
    ) {
        return this.authService.updateProfile(req.user.userId, body);
    }

    @UseGuards(JwtAuthGuard)
    @Put('plan')
    async upgradePlan(
        @Request() req: any,
        @Body() body: { plan: string },
    ) {
        return this.authService.upgradePlan(req.user.userId, body.plan);
    }

    @UseGuards(JwtAuthGuard)
    @Post('change-password')
    async changePassword(
        @Request() req: any,
        @Body() body: { currentPassword?: string; newPassword: string },
    ) {
        return this.authService.changePassword(req.user.userId, body.currentPassword, body.newPassword);
    }

    @UseGuards(JwtAuthGuard)
    @Get('export')
    async exportData(@Request() req: any) {
        return this.authService.exportUserData(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('account')
    async deleteAccount(@Request() req: any) {
        return this.authService.deleteAccount(req.user.userId);
    }

    @Get('sso-providers')
    getSsoProviders() {
        return this.authService.getSsoProviders();
    }

    @UseGuards(JwtAuthGuard)
    @Post('2fa/setup')
    async setupTwoFactor(@Request() req: any) {
        return this.authService.setupTwoFactor(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('2fa/verify')
    async verifyTwoFactor(@Request() req: any, @Body() body: { code: string }) {
        return this.authService.verifyTwoFactor(req.user.userId, body.code);
    }

    @UseGuards(JwtAuthGuard)
    @Post('2fa/disable')
    async disableTwoFactor(@Request() req: any, @Body() body: { code: string }) {
        return this.authService.disableTwoFactor(req.user.userId, body.code);
    }

    @UseGuards(JwtAuthGuard)
    @Get('2fa/status')
    async twoFactorStatus(@Request() req: any) {
        return this.authService.getTwoFactorStatus(req.user.userId);
    }

    @Get('github')
    async githubOAuthLogin(@Request() req: any, @Res() res: any) {
        const url = await this.authService.getGithubOAuthUrl();
        res.redirect(url);
    }

    @Get('github/callback')
    async githubOAuthCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: any) {
        const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
        try {
            const { token } = await this.authService.githubLogin(code, state);
            // Token goes in the URL fragment (never sent to servers / not logged / not leaked via Referer).
            res.redirect(`${frontend}/login#token=${encodeURIComponent(token)}`);
        } catch (err) {
            res.redirect(`${frontend}/login?error=github_failed`);
        }
    }
}
