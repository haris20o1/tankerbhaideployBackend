import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
export declare class UsersService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    findById(id: string): Promise<UserDocument>;
    updateMe(userId: string, updates: Partial<User>): Promise<UserDocument>;
    addExpoPushToken(userId: string, token: string): Promise<UserDocument>;
    removeExpoPushToken(userId: string, token: string): Promise<UserDocument>;
}
