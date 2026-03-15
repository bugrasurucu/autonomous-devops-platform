import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventsGateway } from './events.gateway';

@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (config: ConfigService) => ({
                secret: config.get('JWT_SECRET', 'mission-control-jwt-secret-2026'),
                signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '7d') },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [EventsGateway],
    exports: [EventsGateway],
})
export class GatewayModule { }
