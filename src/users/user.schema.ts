import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true })
    phone: string;

    @Prop()
    name: string;

    @Prop()
    city?: string;

    @Prop()
    address?: string;

    @Prop()
    profilePic?: string;

    @Prop({ required: true, enum: ['customer', 'driver'] })
    role: string;

    @Prop()
    expoPushToken?: string; // Single Expo Push Token for this user's active device

    @Prop({ default: true })
    isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
