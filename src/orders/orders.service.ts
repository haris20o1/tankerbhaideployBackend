import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './order.schema';
import { DriversService } from '../drivers/drivers.service';
import { FirebaseService } from '../firebase/firebase.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
    constructor(
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        private driversService: DriversService,
        private firebaseService: FirebaseService,
        private notificationsService: NotificationsService,
    ) { }

    private async attachDriverProfile(order: OrderDocument | null): Promise<OrderDocument | null> {
        if (!order || !order.driverId) return order;

        const driverUserId = (order.driverId as any)._id ?? order.driverId;
        if (!driverUserId) return order;

        try {
            const driver = await this.driversService.getMyProfile(driverUserId.toString());
            (order as any).driverProfile = {
                vehicleNumber: driver.vehicleNumber,
                vehicleType: driver.vehicleType,
                rating: driver.rating,
                ratingCount: driver.ratingCount,
                alternativePhone: driver.alternativePhone,
            };
        } catch {
            // driver profile is optional; do not fail the request
        }

        return order;
    }

    /** Customer creates a new order */
    async createOrder(customerId: string, body: any): Promise<OrderDocument> {
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const order = await this.orderModel.create({
            customerId: new Types.ObjectId(customerId),
            size: body.size,
            quantity: body.quantity,
            totalPrice: body.totalPrice,
            paymentMethod: body.paymentMethod || 'Cash on Delivery',
            location: body.location,
            isEmergency: body.isEmergency || false,
            otp, // Pre-generate OTP; given to customer; driver confirms on arrival
        });
        const populated = await order.populate('customerId', 'name phone');

        // Push notify all online drivers about new order via Expo
        try {
            const nearbyDrivers = await this.driversService.findNearbyOnlineDrivers(
                populated.location.latitude,
                populated.location.longitude,
            );

            const driverUserIds: string[] = nearbyDrivers
                .map((d: any) => d.userId?._id?.toString())
                .filter((id: string | undefined) => !!id) as string[];

            if (driverUserIds.length > 0) {
                await this.notificationsService.sendPushToUsers(
                    driverUserIds,
                    'New Tanker Order',
                    'A new order is available near you',
                    {
                        orderId: (populated._id as any).toString(),
                        isEmergency: String(populated.isEmergency ?? false),
                    }
                );
            }
        } catch (e) {
            // Notification failures should not block order creation
        }

        return populated as OrderDocument;
    }

    /** Customer fetches their active order (any non-completed/cancelled status) */
    async getActiveOrder(customerId: string): Promise<OrderDocument | null> {
        const order = await this.orderModel
            .findOne({
                customerId: new Types.ObjectId(customerId),
                status: { $in: ['pending', 'accepted', 'enRoute', 'arrived'] },
            })
            .populate('driverId', 'name phone')
            .sort({ createdAt: -1 });
        return this.attachDriverProfile(order) as Promise<OrderDocument | null>;
    }

    /** Customer or driver fetches order history */
    async getHistory(userId: string, role: string): Promise<OrderDocument[]> {
        const baseQuery =
            role === 'customer'
                ? { customerId: new Types.ObjectId(userId) }
                : { driverId: new Types.ObjectId(userId) };

        const query = {
            ...baseQuery,
            status: { $in: ['completed', 'cancelled'] },
        };

        return this.orderModel
            .find(query)
            .sort({ createdAt: -1 })
            .limit(50);
    }

    /** Driver fetches pending orders (for them to accept) */
    async getIncomingOrders(): Promise<OrderDocument[]> {
        return this.orderModel
            .find({ status: 'pending' })
            .populate('customerId', 'name phone')
            .sort({ isEmergency: -1, createdAt: 1 }) // emergency first
            .limit(20);
    }

    /** Driver accepts an order */
    async acceptOrder(orderId: string, driverId: string): Promise<OrderDocument> {
        const order = await this.orderModel.findById(orderId);
        if (!order) throw new NotFoundException('Order not found');
        if (order.status !== 'pending')
            throw new BadRequestException('Order is no longer pending');

        order.driverId = new Types.ObjectId(driverId);
        order.status = 'accepted';
        await order.save();
        const populated = await order.populate([
            { path: 'customerId', select: 'name phone' },
            { path: 'driverId', select: 'name phone' },
        ]);
        const withProfile = (await this.attachDriverProfile(populated as OrderDocument)) as OrderDocument;

        // Push notify customer that a driver accepted via Expo
        try {
            const customer: any = withProfile.customerId;
            const customerIdStr: string | undefined = (customer?._id as any)?.toString();

            if (customerIdStr) {
                await this.notificationsService.sendPushToUsers(
                    [customerIdStr],
                    'Tanker Assigned',
                    'Your tanker driver has accepted your order.',
                    {
                        orderId: (withProfile._id as any).toString(),
                        status: withProfile.status,
                    }
                );
            }
        } catch {
            // ignore notification errors
        }

        return withProfile;
    }

    /** Customer cancels/declines an order (before completion) */
    async cancelOrder(orderId: string, customerId: string): Promise<OrderDocument> {
        const order = await this.orderModel.findById(orderId);
        if (!order) throw new NotFoundException('Order not found');
        if (order.customerId.toString() !== customerId) {
            throw new ForbiddenException('Not your order');
        }
        if (['completed', 'cancelled'].includes(order.status)) {
            throw new BadRequestException(`Order already ${order.status}`);
        }

        order.status = 'cancelled';
        await order.save();
        return order;
    }

    /** Driver updates order status (enRoute / arrived) */
    async updateStatus(orderId: string, driverId: string, status: string): Promise<OrderDocument> {
        const validTransitions: Record<string, string[]> = {
            accepted: ['enRoute'],
            enRoute: ['arrived'],
        };

        const order = await this.orderModel.findById(orderId);
        if (!order) throw new NotFoundException('Order not found');
        if (order.driverId?.toString() !== driverId)
            throw new ForbiddenException('Not your order');
        if (!validTransitions[order.status]?.includes(status))
            throw new BadRequestException(
                `Cannot transition from ${order.status} to ${status}`,
            );

        order.status = status as any;
        await order.save();
        return order;
    }

    /** Customer or Driver completes order (OTP disabled) */
    async verifyOtpAndComplete(
        orderId: string,
        userId: string,
        _otp: string, // kept for backward compatibility, ignored
    ): Promise<OrderDocument> {
        const order = await this.orderModel.findById(orderId);
        if (!order) throw new NotFoundException('Order not found');
        
        const isCustomer = order.customerId.toString() === userId;
        const isDriver = order.driverId?.toString() === userId;
        
        if (!isCustomer && !isDriver) {
             throw new ForbiddenException('Not your order');
        }
        
        if (order.status !== 'arrived')
            throw new BadRequestException('Tanker has not arrived yet');

        order.status = 'completed';
        await order.save();

        // Credit driver earnings
        if (order.driverId) {
            await this.driversService.addEarnings(
                order.driverId.toString(),
                order.totalPrice,
            );
        }

        return order;
    }

    /** Customer rates the driver after completion */
    async rateOrder(
        orderId: string,
        customerId: string,
        rating: number,
        feedback?: string,
    ): Promise<OrderDocument> {
        if (rating < 1 || rating > 5)
            throw new BadRequestException('Rating must be between 1 and 5');

        const order = await this.orderModel.findById(orderId);
        if (!order) throw new NotFoundException('Order not found');
        if (order.customerId.toString() !== customerId)
            throw new ForbiddenException('Not your order');
        if (order.status !== 'completed')
            throw new BadRequestException('Order not completed');
        if (order.rating)
            throw new BadRequestException('Already rated');

        order.rating = rating;
        order.ratingFeedback = feedback ?? '';
        await order.save();

        if (order.driverId) {
            await this.driversService.updateRating(order.driverId.toString(), rating);
        }

        return order;
    }

    /** Get a single order by ID */
    async findById(orderId: string): Promise<OrderDocument> {
        const order = await this.orderModel
            .findById(orderId)
            .populate('customerId', 'name phone')
            .populate('driverId', 'name phone');
        if (!order) throw new NotFoundException('Order not found');
        return (await this.attachDriverProfile(order)) as OrderDocument;
    }
}
