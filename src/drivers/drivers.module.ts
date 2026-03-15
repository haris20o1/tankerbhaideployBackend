import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';
import { Driver, DriverSchema } from './driver.schema';
import { Order, OrderSchema } from '../orders/order.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Driver.name, schema: DriverSchema },
            { name: Order.name, schema: OrderSchema },
        ]),
    ],
    controllers: [DriversController],
    providers: [DriversService],
    exports: [DriversService],
})
export class DriversModule { }
