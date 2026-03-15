"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const order_schema_1 = require("./order.schema");
const drivers_service_1 = require("../drivers/drivers.service");
const firebase_service_1 = require("../firebase/firebase.service");
const notifications_service_1 = require("../notifications/notifications.service");
let OrdersService = class OrdersService {
    orderModel;
    driversService;
    firebaseService;
    notificationsService;
    constructor(orderModel, driversService, firebaseService, notificationsService) {
        this.orderModel = orderModel;
        this.driversService = driversService;
        this.firebaseService = firebaseService;
        this.notificationsService = notificationsService;
    }
    async attachDriverProfile(order) {
        if (!order || !order.driverId)
            return order;
        const driverUserId = order.driverId._id ?? order.driverId;
        if (!driverUserId)
            return order;
        try {
            const driver = await this.driversService.getMyProfile(driverUserId.toString());
            order.driverProfile = {
                vehicleNumber: driver.vehicleNumber,
                vehicleType: driver.vehicleType,
                rating: driver.rating,
                ratingCount: driver.ratingCount,
                alternativePhone: driver.alternativePhone,
            };
        }
        catch {
        }
        return order;
    }
    async createOrder(customerId, body) {
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const order = await this.orderModel.create({
            customerId: new mongoose_2.Types.ObjectId(customerId),
            size: body.size,
            quantity: body.quantity,
            totalPrice: body.totalPrice,
            paymentMethod: body.paymentMethod || 'Cash on Delivery',
            location: body.location,
            isEmergency: body.isEmergency || false,
            otp,
        });
        const populated = await order.populate('customerId', 'name phone');
        try {
            const nearbyDrivers = await this.driversService.findNearbyOnlineDrivers(populated.location.latitude, populated.location.longitude);
            const driverUserIds = nearbyDrivers
                .map((d) => d.userId?._id?.toString())
                .filter((id) => !!id);
            if (driverUserIds.length > 0) {
                await this.notificationsService.sendPushToUsers(driverUserIds, 'New Tanker Order', 'A new order is available near you', {
                    orderId: populated._id.toString(),
                    isEmergency: String(populated.isEmergency ?? false),
                });
            }
        }
        catch (e) {
        }
        return populated;
    }
    async getActiveOrder(customerId) {
        const order = await this.orderModel
            .findOne({
            customerId: new mongoose_2.Types.ObjectId(customerId),
            status: { $in: ['pending', 'accepted', 'enRoute', 'arrived'] },
        })
            .populate('driverId', 'name phone')
            .sort({ createdAt: -1 });
        return this.attachDriverProfile(order);
    }
    async getHistory(userId, role) {
        const baseQuery = role === 'customer'
            ? { customerId: new mongoose_2.Types.ObjectId(userId) }
            : { driverId: new mongoose_2.Types.ObjectId(userId) };
        const query = {
            ...baseQuery,
            status: { $in: ['completed', 'cancelled'] },
        };
        return this.orderModel
            .find(query)
            .sort({ createdAt: -1 })
            .limit(50);
    }
    async getIncomingOrders() {
        return this.orderModel
            .find({ status: 'pending' })
            .populate('customerId', 'name phone')
            .sort({ isEmergency: -1, createdAt: 1 })
            .limit(20);
    }
    async acceptOrder(orderId, driverId) {
        const order = await this.orderModel.findById(orderId);
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.status !== 'pending')
            throw new common_1.BadRequestException('Order is no longer pending');
        order.driverId = new mongoose_2.Types.ObjectId(driverId);
        order.status = 'accepted';
        await order.save();
        const populated = await order.populate([
            { path: 'customerId', select: 'name phone' },
            { path: 'driverId', select: 'name phone' },
        ]);
        const withProfile = (await this.attachDriverProfile(populated));
        try {
            const customer = withProfile.customerId;
            const customerIdStr = customer?._id?.toString();
            if (customerIdStr) {
                await this.notificationsService.sendPushToUsers([customerIdStr], 'Tanker Assigned', 'Your tanker driver has accepted your order.', {
                    orderId: withProfile._id.toString(),
                    status: withProfile.status,
                });
            }
        }
        catch {
        }
        return withProfile;
    }
    async cancelOrder(orderId, customerId) {
        const order = await this.orderModel.findById(orderId);
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.customerId.toString() !== customerId) {
            throw new common_1.ForbiddenException('Not your order');
        }
        if (['completed', 'cancelled'].includes(order.status)) {
            throw new common_1.BadRequestException(`Order already ${order.status}`);
        }
        order.status = 'cancelled';
        await order.save();
        return order;
    }
    async updateStatus(orderId, driverId, status) {
        const validTransitions = {
            accepted: ['enRoute'],
            enRoute: ['arrived'],
        };
        const order = await this.orderModel.findById(orderId);
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.driverId?.toString() !== driverId)
            throw new common_1.ForbiddenException('Not your order');
        if (!validTransitions[order.status]?.includes(status))
            throw new common_1.BadRequestException(`Cannot transition from ${order.status} to ${status}`);
        order.status = status;
        await order.save();
        return order;
    }
    async verifyOtpAndComplete(orderId, userId, _otp) {
        const order = await this.orderModel.findById(orderId);
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        const isCustomer = order.customerId.toString() === userId;
        const isDriver = order.driverId?.toString() === userId;
        if (!isCustomer && !isDriver) {
            throw new common_1.ForbiddenException('Not your order');
        }
        if (order.status !== 'arrived')
            throw new common_1.BadRequestException('Tanker has not arrived yet');
        order.status = 'completed';
        await order.save();
        if (order.driverId) {
            await this.driversService.addEarnings(order.driverId.toString(), order.totalPrice);
        }
        return order;
    }
    async rateOrder(orderId, customerId, rating, feedback) {
        if (rating < 1 || rating > 5)
            throw new common_1.BadRequestException('Rating must be between 1 and 5');
        const order = await this.orderModel.findById(orderId);
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.customerId.toString() !== customerId)
            throw new common_1.ForbiddenException('Not your order');
        if (order.status !== 'completed')
            throw new common_1.BadRequestException('Order not completed');
        if (order.rating)
            throw new common_1.BadRequestException('Already rated');
        order.rating = rating;
        order.ratingFeedback = feedback ?? '';
        await order.save();
        if (order.driverId) {
            await this.driversService.updateRating(order.driverId.toString(), rating);
        }
        return order;
    }
    async findById(orderId) {
        const order = await this.orderModel
            .findById(orderId)
            .populate('customerId', 'name phone')
            .populate('driverId', 'name phone');
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        return (await this.attachDriverProfile(order));
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        drivers_service_1.DriversService,
        firebase_service_1.FirebaseService,
        notifications_service_1.NotificationsService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map