import { OrdersService } from './orders.service';
import { AppGateway } from '../gateway/app.gateway';
export declare class OrdersController {
    private readonly ordersService;
    private readonly gateway;
    constructor(ordersService: OrdersService, gateway: AppGateway);
    create(req: any, body: any): Promise<import("./order.schema").OrderDocument>;
    getActive(req: any): Promise<import("./order.schema").OrderDocument | null>;
    getHistory(req: any): Promise<import("./order.schema").OrderDocument[]>;
    getIncoming(): Promise<import("./order.schema").OrderDocument[]>;
    findOne(id: string): Promise<import("./order.schema").OrderDocument>;
    accept(id: string, req: any): Promise<import("./order.schema").OrderDocument>;
    updateStatus(id: string, req: any, body: {
        status: string;
    }): Promise<import("./order.schema").OrderDocument>;
    cancel(id: string, req: any): Promise<import("./order.schema").OrderDocument>;
    verifyOtp(id: string, req: any, body: {
        otp: string;
    }): Promise<import("./order.schema").OrderDocument>;
    rate(id: string, req: any, body: {
        rating: number;
        feedback?: string;
    }): Promise<import("./order.schema").OrderDocument>;
}
