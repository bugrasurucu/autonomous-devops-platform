import {
    Controller,
    Get,
    Put,
    Post,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
    constructor(private settingsService: SettingsService) { }

    @Get('models')
    getModels(@Request() req: any) {
        return this.settingsService.getModels(req.user.plan);
    }

    @Get('agent-models')
    getAgentModels(@Request() req: any) {
        return this.settingsService.getAgentModels(req.user.userId);
    }

    @Put('agent-models/:agentId')
    updateAgentModel(
        @Request() req: any,
        @Param('agentId') agentId: string,
        @Body() body: { model?: string; temperature?: number; maxTokens?: number; customPrompt?: string; enabled?: boolean },
    ) {
        return this.settingsService.updateAgentModel(req.user.userId, agentId, body);
    }

    @Get('api-keys')
    getApiKeys(@Request() req: any) {
        return this.settingsService.getApiKeys(req.user.userId);
    }

    @Post('api-keys')
    createApiKey(
        @Request() req: any,
        @Body() body: { provider: string; key: string; label?: string },
    ) {
        return this.settingsService.createApiKey(
            req.user.userId,
            body.provider,
            body.key,
            body.label,
        );
    }

    @Delete('api-keys/:id')
    deleteApiKey(@Request() req: any, @Param('id') id: string) {
        return this.settingsService.deleteApiKey(req.user.userId, id);
    }

    @Get('usage')
    getUsage(@Request() req: any) {
        return this.settingsService.getUsage(req.user.userId);
    }
}
