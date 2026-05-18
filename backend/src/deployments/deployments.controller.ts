import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    Query,
    UseGuards,
    Request,
    Delete,
} from '@nestjs/common';
import { DeploymentsService } from './deployments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class DeploymentsController {
    constructor(private deploymentsService: DeploymentsService) { }

    @Post('deploy')
    create(
        @Request() req: any,
        @Body()
        body: {
            projectName: string;
            region?: string;
            environment?: string;
            budget?: number;
            sourceType?: string;
            sourceValue?: string;
        },
    ) {
        return this.deploymentsService.create(req.user.userId, body);
    }

    @Get('deployments')
    findAll(@Request() req: any, @Query('limit') limit?: string) {
        return this.deploymentsService.findAll(
            req.user.userId,
            limit ? parseInt(limit) : 20,
        );
    }

    @Get('deployments/:id')
    findOne(@Request() req: any, @Param('id') id: string) {
        return this.deploymentsService.findOne(req.user.userId, id);
    }

    @Post('deployments/:id/stop')
    stop(@Request() req: any, @Param('id') id: string) {
        return this.deploymentsService.stop(req.user.userId, id);
    }

    @Delete('deployments/:id')
    delete(@Request() req: any, @Param('id') id: string) {
        return this.deploymentsService.delete(req.user.userId, id);
    }
}
