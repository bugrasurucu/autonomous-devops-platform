import {
    Controller,
    Get,
    Post,
    Delete,
    Query,
    UseGuards,
    Request,
    Res,
} from '@nestjs/common';
import { Response } from 'express';
import { GithubService } from './github.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';

@Controller('github')
@UseGuards(JwtAuthGuard)
export class GithubController {
    constructor(
        private githubService: GithubService,
        private config: ConfigService,
    ) { }

    /** Returns the GitHub OAuth authorization URL */
    @Get('oauth-url')
    getOAuthUrl() {
        return { url: this.githubService.getOAuthUrl() };
    }

    /**
     * OAuth callback — GitHub redirects here with ?code=...&state=...
     * After exchanging the code we redirect to the frontend settings page.
     */
    @Get('callback')
    async callback(
        @Request() req: any,
        @Query('code') code: string,
        @Res() res: Response,
    ) {
        try {
            await this.githubService.exchangeCode(req.user.userId, code);
            const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
            return res.redirect(`${frontendUrl}/dashboard/settings?github=connected`);
        } catch (err) {
            const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
            return res.redirect(`${frontendUrl}/dashboard/settings?github=error`);
        }
    }

    /** Returns whether GitHub is connected and the username if so */
    @Get('status')
    getStatus(@Request() req: any) {
        return this.githubService.getStatus(req.user.userId);
    }

    /** Disconnects GitHub by clearing stored token */
    @Delete('disconnect')
    disconnect(@Request() req: any) {
        return this.githubService.disconnect(req.user.userId);
    }

    /** Lists the authenticated user's GitHub repos */
    @Get('repos')
    listRepos(@Request() req: any, @Query('search') search?: string) {
        return this.githubService.listRepos(req.user.userId, search);
    }
}
