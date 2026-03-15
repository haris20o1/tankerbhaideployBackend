import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DriverDocument = Driver & Document;

@Schema({ timestamps: true })
export class Driver {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
    userId: Types.ObjectId;

    @Prop({ default: false })
    isOnline: boolean;

    @Prop({
        type: {
            latitude: Number,
            longitude: Number,
        },
        default: { latitude: 33.6844, longitude: 73.0479 },
    })
    location: {
        latitude: number;
        longitude: number;
    };

    @Prop({ default: 0 })
    totalEarnings: number;

    @Prop({ default: 5.0 })
    rating: number;

    @Prop({ default: 0 })
    ratingCount: number;

    @Prop()
    vehicleNumber?: string;

    @Prop()
    vehicleType?: string; // e.g. '1000 Gallon Tanker'

    @Prop()
    alternativePhone?: string;

    @Prop({ type: [Number], default: [] })
    tankSizes?: number[];
}

export const DriverSchema = SchemaFactory.createForClass(Driver);
