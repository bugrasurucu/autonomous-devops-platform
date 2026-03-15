import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';
import { AgentsService } from './agents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentsController {
    constructor(private agentsService: AgentsService) { }

    @Get()
    getAgents(@Request() req: any) {
        return this.agentsService.getAgents(req.user.userId);
    }

    @Get(':id')
    getAgent(@Request() req: any, @Param('id') id: string) {
        return this.agentsService.getAgent(req.user.userId, id);
    }

    @Post(':id/trigger')
    triggerAgent(
        @Request() req: any,
        @Param('id') id: string,
        @Body() body: { task?: string },
    ) {
        return this.agentsService.triggerAgent(req.user.userId, id, body.task);
    }

    @Post(':id/complete')
    completeAgent(
        @Request() req: any,
        @Param('id') id: string,
        @Body() body: { output?: string; success?: boolean },
    ) {
        return this.agentsService.completeAgent(
            req.user.userId,
            id,
            body.output,
            body.success ?? true,
        );
    }
}
