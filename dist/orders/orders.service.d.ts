import { Model } from 'mongoose';
import { OrderDocument } from './order.schema';
import { DriversService } from '../drivers/drivers.service';
import { FirebaseService } from '../firebase/firebase.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class OrdersService {
    private orderModel;
    private driversService;
    private firebaseService;
    private notificationsService;
    constructor(orderModel: Model<OrderDocument>, driversService: DriversService, firebaseService: FirebaseService, notificationsService: NotificationsService);
    private attachDriverProfile;
    createOrder(customerId: string, body: any): Promise<OrderDocument>;
    getActiveOrder(customerId: string): Promise<OrderDocument | null>;
    getHistory(userId: string, role: string): Promise<OrderDocument[]>;
    getIncomingOrders(): Promise<OrderDocument[]>;
    acceptOrder(orderId: string, driverId: string): Promise<OrderDocument>;
    cancelOrder(orderId: string, customerId: string): Promise<OrderDocument>;
    updateStatus(orderId: string, driverId: string, status: string): Promise<OrderDocument>;
    verifyOtpAndComplete(orderId: string, userId: string, _otp: string): Promise<OrderDocument>;
    rateOrder(orderId: string, customerId: string, rating: number, feedback?: string): Promise<OrderDocument>;
    findById(orderId: string): Promise<OrderDocument>;
}
