import { Model, Types } from 'mongoose';
import { Driver, DriverDocument } from './driver.schema';
import { OrderDocument } from '../orders/order.schema';
export declare class DriversService {
    private driverModel;
    private orderModel;
    constructor(driverModel: Model<DriverDocument>, orderModel: Model<OrderDocument>);
    getMyProfile(userId: string): Promise<any>;
    setOnlineStatus(userId: string, isOnline: boolean): Promise<DriverDocument>;
    updateLocation(userId: string, latitude: number, longitude: number): Promise<DriverDocument>;
    findNearbyOnlineDrivers(latitude: number, longitude: number): Promise<(import("mongoose").Document<unknown, {}, DriverDocument, {}, import("mongoose").DefaultSchemaOptions> & Driver & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    addEarnings(userId: string, amount: number): Promise<void>;
    updateRating(userId: string, newRating: number): Promise<void>;
}
