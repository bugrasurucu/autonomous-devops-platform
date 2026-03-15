import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: '/',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(EventsGateway.name);
    private userSockets = new Map<string, Set<string>>();

    constructor(private jwtService: JwtService) { }

    async handleConnection(client: Socket) {
        try {
            const token =
                client.handshake.auth?.token ||
                client.handshake.query?.token;

            if (!token) {
                client.emit('auth_error', { message: 'Token required' });
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token as string);
            const userId = payload.sub;

            (client as any).userId = userId;
            client.join(`user:${userId}`);

            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());
            }
            this.userSockets.get(userId)!.add(client.id);

            this.logger.log(`Client connected: ${client.id} (user: ${userId})`);
            client.emit('connected', { message: 'Connected to Mission Control' });
        } catch (error) {
            client.emit('auth_error', { message: 'Invalid token' });
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const userId = (client as any).userId;
        if (userId && this.userSockets.has(userId)) {
            this.userSockets.get(userId)!.delete(client.id);
            if (this.userSockets.get(userId)!.size === 0) {
                this.userSockets.delete(userId);
            }
        }
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('ping')
    handlePing() {
        return { event: 'pong', data: { time: Date.now() } };
    }

    // Safe emit helper — prevents crash if server not initialized
    private emitToUser(userId: string, event: string, data: any) {
        if (this.server) {
            this.server.to(`user:${userId}`).emit(event, data);
        }
    }

    @OnEvent('agent.updated')
    handleAgentUpdated(data: { userId: string; agent: any }) {
        this.emitToUser(data.userId, 'AGENT_UPDATED', data.agent);
    }

    @OnEvent('activity.new')
    handleNewActivity(data: { userId: string;[key: string]: any }) {
        const { userId, ...activityData } = data;
        this.emitToUser(userId, 'NEW_ACTIVITY', activityData);
    }

    @OnEvent('orchestration.updated')
    handleOrchestrationUpdated(data: { userId: string;[key: string]: any }) {
        const { userId, ...orchestrationData } = data;
        this.emitToUser(userId, 'ORCHESTRATION_UPDATED', orchestrationData);
    }

    @OnEvent('deploy.completed')
    handleDeployCompleted(data: { userId: string;[key: string]: any }) {
        const { userId, ...deployData } = data;
        this.emitToUser(userId, 'DEPLOY_COMPLETED', deployData);
    }

    @OnEvent('error.new')
    handleErrorEvent(data: { userId: string; error: any }) {
        this.emitToUser(data.userId, 'ERROR', data.error);
    }
}
