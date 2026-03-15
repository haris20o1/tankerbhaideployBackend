import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinOrder(orderId: string, client: Socket): void;
    handleDriverLocation(data: {
        orderId: string;
        latitude: number;
        longitude: number;
    }, client: Socket): void;
}
