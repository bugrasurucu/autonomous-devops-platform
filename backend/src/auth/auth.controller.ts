import {
    Controller,
    Post,
    Get,
    Put,
    Body,
    UseGuards,
    Request,
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
    async login(@Body() body: { email: string; password: string }) {
        return this.authService.login(body.email, body.password);
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
}
