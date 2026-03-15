"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const optional_jwt_guard_1 = require("../auth/optional-jwt.guard");
const orders_service_1 = require("./orders.service");
const app_gateway_1 = require("../gateway/app.gateway");
let OrdersController = class OrdersController {
    ordersService;
    gateway;
    constructor(ordersService, gateway) {
        this.ordersService = ordersService;
        this.gateway = gateway;
    }
    async create(req, body) {
        if (!req.user || !req.user.userId) {
            throw new common_1.UnauthorizedException('User not authenticated for creating orders');
        }
        const order = await this.ordersService.createOrder(req.user.userId, body);
        this.gateway.server.emit('order:new', { orderId: order._id.toString(), order });
        return order;
    }
    getActive(req) {
        if (!req.user || !req.user.userId) {
            throw new common_1.UnauthorizedException('User not authenticated for fetching active order');
        }
        return this.ordersService.getActiveOrder(req.user.userId);
    }
    getHistory(req) {
        if (!req.user || !req.user.userId) {
            throw new common_1.UnauthorizedException('User not authenticated for fetching order history');
        }
        return this.ordersService.getHistory(req.user.userId, req.user.role);
    }
    getIncoming() {
        return this.ordersService.getIncomingOrders();
    }
    findOne(id) {
        return this.ordersService.findById(id);
    }
    async accept(id, req) {
        if (!req.user || !req.user.userId) {
            throw new common_1.UnauthorizedException('User not authenticated for accepting orders');
        }
        const order = await this.ordersService.acceptOrder(id, req.user.userId);
        this.gateway.server.to(id).emit('order:accepted', {
            orderId: id,
            driverId: req.user.userId,
            status: 'accepted',
        });
        this.gateway.server.emit('order:removed', { orderId: id });
        return order;
    }
    async updateStatus(id, req, body) {
        if (!req.user || !req.user.userId) {
            throw new common_1.UnauthorizedException('User not authenticated for updating order status');
        }
        const order = await this.ordersService.updateStatus(id, req.user.userId, body.status);
        this.gateway.server.to(id).emit('order:status', {
            orderId: id,
            status: order.status,
        });
        return order;
    }
    async cancel(id, req) {
        if (!req.user || !req.user.userId) {
            throw new common_1.UnauthorizedException('User not authenticated for cancelling orders');
        }
        const order = await this.ordersService.cancelOrder(id, req.user.userId);
        this.gateway.server.to(id).emit('order:cancelled', {
            orderId: id,
            status: order.status,
        });
        this.gateway.server.emit('order:removed', { orderId: id });
        return order;
    }
    async verifyOtp(id, req, body) {
        if (!req.user || !req.user.userId) {
            throw new common_1.UnauthorizedException('User not authenticated for completing orders');
        }
        const order = await this.ordersService.verifyOtpAndComplete(id, req.user.userId, body.otp);
        this.gateway.server.to(id).emit('order:completed', { orderId: id });
        return order;
    }
    rate(id, req, body) {
        if (!req.user || !req.user.userId) {
            throw new common_1.UnauthorizedException('User not authenticated for rating orders');
        }
        return this.ordersService.rateOrder(id, req.user.userId, body.rating, body.feedback);
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('active'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getActive", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)('incoming'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getIncoming", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/accept'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "accept", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)(':id/verify-otp'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "verifyOtp", null);
__decorate([
    (0, common_1.Post)(':id/rate'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "rate", null);
exports.OrdersController = OrdersController = __decorate([
    (0, common_1.UseGuards)(optional_jwt_guard_1.OptionalJwtGuard),
    (0, common_1.Controller)('orders'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService,
        app_gateway_1.AppGateway])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map