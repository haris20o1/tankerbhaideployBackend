import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

export type OrderStatus =
    | 'pending'
    | 'accepted'
    | 'enRoute'
    | 'arrived'
    | 'completed'
    | 'cancelled';

@Schema({ timestamps: true })
export class Order {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    customerId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', default: null })
    driverId: Types.ObjectId;

    @Prop({ required: true })
    size: number; // gallons: 1000 | 2000 | 5000

    @Prop({ required: true, min: 1 })
    quantity: number;

    @Prop({ required: true })
    totalPrice: number;

    @Prop({ default: 'Cash on Delivery' })
    paymentMethod: string;

    @Prop({
        type: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
            address: { type: String },
        },
        required: true,
    })
    location: {
        latitude: number;
        longitude: number;
        address: string;
    };

    @Prop({
        type: String,
        enum: ['pending', 'accepted', 'enRoute', 'arrived', 'completed', 'cancelled'],
        default: 'pending',
    })
    status: OrderStatus;

    @Prop({ default: false })
    isEmergency: boolean;

    @Prop()
    otp: string; // 4-digit code, set when driver accepts

    @Prop({ default: null })
    rating: number; // Customer rating after completion

    @Prop()
    ratingFeedback: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Index for querying pending orders near a location
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ customerId: 1, status: 1 });
OrderSchema.index({ driverId: 1, status: 1 });
