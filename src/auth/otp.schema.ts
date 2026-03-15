import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpDocument = Otp & Document;

@Schema({ timestamps: true })
export class Otp {
    @Prop({ required: true })
    phone: string;

    @Prop({ required: true })
    code: string;

    @Prop({ required: true })
    expiresAt: Date;

    @Prop({ default: false })
    used: boolean;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

// TTL index: MongoDB auto-deletes expired OTP documents
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
