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
exports.DriversService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const driver_schema_1 = require("./driver.schema");
const order_schema_1 = require("../orders/order.schema");
let DriversService = class DriversService {
    driverModel;
    orderModel;
    constructor(driverModel, orderModel) {
        this.driverModel = driverModel;
        this.orderModel = orderModel;
    }
    async getMyProfile(userId) {
        let driver = await this.driverModel.findOne({ userId }).populate('userId', 'name phone');
        if (!driver) {
            driver = await this.driverModel.create({ userId });
            driver = await driver.populate('userId', 'name phone');
        }
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const driverUserId = new mongoose_2.Types.ObjectId(userId);
        const [todayAgg, weekAgg, monthAgg] = await Promise.all([
            this.orderModel.aggregate([
                { $match: { driverId: driverUserId, status: 'completed', createdAt: { $gte: startOfToday } } },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } },
            ]),
            this.orderModel.aggregate([
                { $match: { driverId: driverUserId, status: 'completed', createdAt: { $gte: sevenDaysAgo } } },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } },
            ]),
            this.orderModel.aggregate([
                { $match: { driverId: driverUserId, status: 'completed', createdAt: { $gte: startOfMonth } } },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } },
            ]),
        ]);
        const todayEarnings = todayAgg[0]?.total || 0;
        const weeklyEarnings = weekAgg[0]?.total || 0;
        const monthlyEarnings = monthAgg[0]?.total || 0;
        const dto = {
            ...driver.toObject(),
            todayEarnings,
            weeklyEarnings,
            monthlyEarnings,
        };
        return dto;
    }
    async setOnlineStatus(userId, isOnline) {
        const driver = await this.driverModel.findOneAndUpdate({ userId }, { $set: { isOnline } }, { new: true });
        if (!driver)
            throw new common_1.NotFoundException('Driver profile not found');
        return driver;
    }
    async updateLocation(userId, latitude, longitude) {
        const driver = await this.driverModel.findOneAndUpdate({ userId }, { $set: { location: { latitude, longitude } } }, { new: true });
        if (!driver)
            throw new common_1.NotFoundException('Driver profile not found');
        return driver;
    }
    async findNearbyOnlineDrivers(latitude, longitude) {
        return this.driverModel
            .find({ isOnline: true })
            .populate('userId', 'name phone expoPushToken');
    }
    async addEarnings(userId, amount) {
        await this.driverModel.findOneAndUpdate({ userId }, { $inc: { totalEarnings: amount } });
    }
    async updateRating(userId, newRating) {
        const driver = await this.driverModel.findOne({ userId });
        if (!driver)
            return;
        const totalRating = driver.rating * driver.ratingCount + newRating;
        const newCount = driver.ratingCount + 1;
        await this.driverModel.findOneAndUpdate({ userId }, { $set: { rating: totalRating / newCount, ratingCount: newCount } });
    }
};
exports.DriversService = DriversService;
exports.DriversService = DriversService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(driver_schema_1.Driver.name)),
    __param(1, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], DriversService);
//# sourceMappingURL=drivers.service.js.map