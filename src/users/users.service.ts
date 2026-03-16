import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

    async findById(id: string): Promise<UserDocument> {
        const user = await this.userModel.findById(id);
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async updateMe(userId: string, updates: Partial<User>): Promise<UserDocument> {
        const user = await this.userModel.findByIdAndUpdate(
            userId,
            { $set: updates },
            { returnDocument: 'after' },
        );
        if (!user) throw new NotFoundException('User not found');
        return user;
    }
    
    async addExpoPushToken(userId: string, token: string): Promise<UserDocument> {
        const user = await this.userModel.findByIdAndUpdate(
            userId,
            { $set: { expoPushToken: token } },
            { returnDocument: 'after' },
        );
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async removeExpoPushToken(userId: string, token: string): Promise<UserDocument> {
        const user = await this.userModel.findByIdAndUpdate(
            userId,
            { $unset: { expoPushToken: '' } },
            { returnDocument: 'after' },
        );
        if (!user) throw new NotFoundException('User not found');
        return user;
    }
}
