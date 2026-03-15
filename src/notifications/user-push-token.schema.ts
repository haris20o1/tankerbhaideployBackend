import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserPushTokenDocument = UserPushToken & Document;

@Schema({ timestamps: true })
export class UserPushToken {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    expoPushToken: string;
}

export const UserPushTokenSchema = SchemaFactory.createForClass(UserPushToken);

UserPushTokenSchema.index({ userId: 1, expoPushToken: 1 }, { unique: true });
