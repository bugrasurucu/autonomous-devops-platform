import {
    Controller,
    Get,
    Post,
    Delete,
    Query,
    UseGuards,
    Request,
    Res,
    UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { GithubService } from './github.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';

@Controller('github')
export class GithubController {
    constructor(
        private githubService: GithubService,
        private config: ConfigService,
    ) { }

    /** Returns the GitHub OAuth authorization URL */
    @UseGuards(JwtAuthGuard)
    @Get('oauth-url')
    getOAuthUrl(@Request() req: any) {
        return {
            url: this.githubService.getOAuthUrl(req.user.userId),
            configured: this.githubService.isOAuthConfigured(),
        };
    }

    /** Connect GitHub directly with a username (public repos) or Personal Access Token */
    @UseGuards(JwtAuthGuard)
    @Post('connect')
    connect(
        @Request() req: any,
        @Query('username') qUsername?: string,
    ) {
        const body = req.body || {};
        return this.githubService.connectWithTokenOrUsername(req.user.userId, {
            username: body.username || qUsername,
            token: body.token,
        });
    }

    /**
     * OAuth callback — GitHub redirects here with ?code=...&state=...
     * After exchanging the code we redirect to the frontend settings page.
     */
    @Get('callback')
    async callback(
        @Query('code') code: string,
        @Query('state') state: string,
        @Res() res: Response,
    ) {
        try {
            const decodedState = state ? decodeURIComponent(state) : '';
            const userId = this.githubService.verifyOAuthStateToken(decodedState);
            if (!userId) throw new UnauthorizedException('Invalid or expired OAuth state');
            await this.githubService.exchangeCode(userId, code);
            const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
            return res.redirect(`${frontendUrl}/dashboard/settings?github=connected`);
        } catch (err) {
            const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
            return res.redirect(`${frontendUrl}/dashboard/settings?github=error`);
        }
    }

    /** Returns whether GitHub is connected and the username if so */
    @UseGuards(JwtAuthGuard)
    @Get('status')
    getStatus(@Request() req: any) {
        return this.githubService.getStatus(req.user.userId);
    }

    /** Disconnects GitHub by clearing stored token */
    @UseGuards(JwtAuthGuard)
    @Delete('disconnect')
    disconnect(@Request() req: any) {
        return this.githubService.disconnect(req.user.userId);
    }

    /** Lists the authenticated user's GitHub repos */
    @UseGuards(JwtAuthGuard)
    @Get('repos')
    listRepos(@Request() req: any, @Query('search') search?: string) {
        return this.githubService.listRepos(req.user.userId, search);
    }
}
