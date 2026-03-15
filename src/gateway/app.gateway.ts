import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: { origin: '*' },
    namespace: '/',
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    /** Client joins a room scoped to their orderId so they receive targeted events */
    @SubscribeMessage('join:order')
    handleJoinOrder(
        @MessageBody() orderId: string,
        @ConnectedSocket() client: Socket,
    ) {
        client.join(orderId);
        console.log(`Client ${client.id} joined order room: ${orderId}`);
    }

    /**
     * Driver emits their location update.
     * Server re-broadcasts to the order's room so the customer sees it in real time.
     *
     * Payload: { orderId, latitude, longitude }
     */
    @SubscribeMessage('driver:location')
    handleDriverLocation(
        @MessageBody() data: { orderId: string; latitude: number; longitude: number },
        @ConnectedSocket() client: Socket,
    ) {
        this.server.to(data.orderId).emit('driver:location', {
            latitude: data.latitude,
            longitude: data.longitude,
        });
    }
}
