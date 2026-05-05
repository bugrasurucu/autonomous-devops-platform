import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('incidents')
@UseGuards(JwtAuthGuard)
export class IncidentsController {
    constructor(private incidentsService: IncidentsService) { }

    @Get()
    findAll(@Request() req: any, @Query('limit') limit?: string) {
        return this.incidentsService.findAll(
            req.user.userId,
            limit ? parseInt(limit) : 20,
        );
    }

    @Post()
    create(
        @Request() req: any,
        @Body() body: { title: string; description?: string; severity?: string },
    ) {
        return this.incidentsService.create(
            req.user.userId,
            body.title,
            body.description,
            body.severity,
        );
    }

    @Post('simulate')
    simulate(@Request() req: any) {
        return this.incidentsService.simulate(req.user.userId);
    }

    @Post(':id/resolve')
    resolve(
        @Request() req: any,
        @Param('id') id: string,
        @Body() body: { resolution?: string },
    ) {
        return this.incidentsService.resolve(req.user.userId, id, body.resolution);
    }

    @Get('stats')
    getStats(@Request() req: any) {
        return this.incidentsService.getStats(req.user.userId);
    }
}
