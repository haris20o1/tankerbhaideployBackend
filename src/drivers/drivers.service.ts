import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Driver, DriverDocument } from './driver.schema';
import { Order, OrderDocument } from '../orders/order.schema';

@Injectable()
export class DriversService {
    constructor(
        @InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    ) { }

    async getMyProfile(userId: string): Promise<any> {
        let driver = await this.driverModel.findOne({ userId }).populate('userId', 'name phone');
        if (!driver) {
            // Auto-create to fix 404 if driver profile is missing
            driver = await this.driverModel.create({ userId });
            driver = await driver.populate('userId', 'name phone');
        }

        // Compute earnings aggregates from completed orders
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const driverUserId = new Types.ObjectId(userId);

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

    async setOnlineStatus(userId: string, isOnline: boolean): Promise<DriverDocument> {
        const driver = await this.driverModel.findOneAndUpdate(
            { userId },
            { $set: { isOnline } },
            { new: true },
        );
        if (!driver) throw new NotFoundException('Driver profile not found');
        return driver;
    }

    async updateLocation(
        userId: string,
        latitude: number,
        longitude: number,
    ): Promise<DriverDocument> {
        const driver = await this.driverModel.findOneAndUpdate(
            { userId },
            { $set: { location: { latitude, longitude } } },
            { new: true },
        );
        if (!driver) throw new NotFoundException('Driver profile not found');
        return driver;
    }

    async findNearbyOnlineDrivers(latitude: number, longitude: number) {
        // Currently: notify ALL online tanker drivers, regardless of distance.
        // (Keep method name for backwards compatibility.)
        return this.driverModel
            .find({ isOnline: true })
            .populate('userId', 'name phone expoPushToken');
    }

    async addEarnings(userId: string, amount: number): Promise<void> {
        await this.driverModel.findOneAndUpdate(
            { userId },
            { $inc: { totalEarnings: amount } },
        );
    }

    async updateRating(userId: string, newRating: number): Promise<void> {
        const driver = await this.driverModel.findOne({ userId });
        if (!driver) return;
        const totalRating = driver.rating * driver.ratingCount + newRating;
        const newCount = driver.ratingCount + 1;
        await this.driverModel.findOneAndUpdate(
            { userId },
            { $set: { rating: totalRating / newCount, ratingCount: newCount } },
        );
    }
}
