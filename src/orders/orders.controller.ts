import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    Request,
    UseGuards,
    UnauthorizedException,
} from '@nestjs/common';
import { OptionalJwtGuard } from '../auth/optional-jwt.guard';
import { OrdersService } from './orders.service';
import { AppGateway } from '../gateway/app.gateway';

@UseGuards(OptionalJwtGuard)
@Controller('orders')
export class OrdersController {
    constructor(
        private readonly ordersService: OrdersService,
        private readonly gateway: AppGateway,
    ) { }

    /** POST /orders — customer creates order */
    @Post()
    async create(@Request() req, @Body() body: any) {
        if (!req.user || !req.user.userId) {
            throw new UnauthorizedException('User not authenticated for creating orders');
        }
        const order = await this.ordersService.createOrder(req.user.userId, body);
        // Notify all online drivers of new pending order
        this.gateway.server.emit('order:new', { orderId: (order._id as any).toString(), order });
        return order;
    }

    /** GET /orders/active — customer's current active order */
    @Get('active')
    getActive(@Request() req) {
        if (!req.user || !req.user.userId) {
            throw new UnauthorizedException('User not authenticated for fetching active order');
        }
        return this.ordersService.getActiveOrder(req.user.userId);
    }

    /** GET /orders/history — completed orders for the logged-in user */
    @Get('history')
    getHistory(@Request() req) {
        if (!req.user || !req.user.userId) {
            throw new UnauthorizedException('User not authenticated for fetching order history');
        }
        return this.ordersService.getHistory(req.user.userId, req.user.role);
    }

    /** GET /orders/incoming — pending orders for drivers */
    @Get('incoming')
    getIncoming() {
        return this.ordersService.getIncomingOrders();
    }

    /** GET /orders/:id — single order detail */
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.ordersService.findById(id);
    }

    /** PATCH /orders/:id/accept — driver accepts order */
    @Patch(':id/accept')
    async accept(@Param('id') id: string, @Request() req) {
        if (!req.user || !req.user.userId) {
            throw new UnauthorizedException('User not authenticated for accepting orders');
        }
        const order = await this.ordersService.acceptOrder(id, req.user.userId);
        // Notify the customer room
        this.gateway.server.to(id).emit('order:accepted', {
            orderId: id,
            driverId: req.user.userId,
            status: 'accepted',
        });
        
        // Notify all clients to remove from incoming lists
        this.gateway.server.emit('order:removed', { orderId: id });
        return order;
    }

    /** PATCH /orders/:id/status — driver updates to enRoute / arrived */
    @Patch(':id/status')
    async updateStatus(
        @Param('id') id: string,
        @Request() req,
        @Body() body: { status: string },
    ) {
        if (!req.user || !req.user.userId) {
            throw new UnauthorizedException('User not authenticated for updating order status');
        }
        const order = await this.ordersService.updateStatus(id, req.user.userId, body.status);
        // Notify customer room
        this.gateway.server.to(id).emit('order:status', {
            orderId: id,
            status: order.status,
        });
        return order;
    }

    /** POST /orders/:id/cancel — customer declines/cancels order */
    @Post(':id/cancel')
    async cancel(
        @Param('id') id: string,
        @Request() req,
    ) {
        if (!req.user || !req.user.userId) {
            throw new UnauthorizedException('User not authenticated for cancelling orders');
        }
        const order = await this.ordersService.cancelOrder(id, req.user.userId);
        // Notify both customer & driver listening on this order room
        this.gateway.server.to(id).emit('order:cancelled', {
            orderId: id,
            status: order.status,
        });

        // Notify all clients to remove from incoming lists
        this.gateway.server.emit('order:removed', { orderId: id });
        return order;
    }

    /** POST /orders/:id/verify-otp — customer completes delivery */
    @Post(':id/verify-otp')
    async verifyOtp(
        @Param('id') id: string,
        @Request() req,
        @Body() body: { otp: string },
    ) {
        if (!req.user || !req.user.userId) {
            throw new UnauthorizedException('User not authenticated for completing orders');
        }
        const order = await this.ordersService.verifyOtpAndComplete(
            id,
            req.user.userId,
            body.otp,
        );
        this.gateway.server.to(id).emit('order:completed', { orderId: id });
        return order;
    }

    /** POST /orders/:id/rate — customer rates driver */
    @Post(':id/rate')
    rate(
        @Param('id') id: string,
        @Request() req,
        @Body() body: { rating: number; feedback?: string },
    ) {
        if (!req.user || !req.user.userId) {
            throw new UnauthorizedException('User not authenticated for rating orders');
        }
        return this.ordersService.rateOrder(id, req.user.userId, body.rating, body.feedback);
    }
}
