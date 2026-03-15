"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptionalJwtGuard = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
let OptionalJwtGuard = class OptionalJwtGuard extends (0, passport_1.AuthGuard)('jwt') {
    canActivate(context) {
        return super.canActivate(context);
    }
    handleRequest(err, user, info, context) {
        if (err || info || !user) {
            console.log('[OptionalJwtGuard] Auth Failed/Missing:', { err, info: info?.message, user: !!user });
        }
        if (user)
            return user;
        const request = context.switchToHttp().getRequest();
        const devRole = request.headers['x-dev-role'];
        if (devRole) {
            const fallbackUsers = {
                customer: {
                    userId: '69ae9687937e3edd4b2f466a',
                    phone: '+923001234567',
                    role: 'customer',
                },
                driver: {
                    userId: '69aea534e55cda1c955ad87e',
                    phone: '+923007654321',
                    role: 'driver',
                },
            };
            console.log(`[OptionalJwtGuard] Falling back to devRole: ${devRole}`);
            return fallbackUsers[devRole] || fallbackUsers.customer;
        }
        return null;
    }
};
exports.OptionalJwtGuard = OptionalJwtGuard;
exports.OptionalJwtGuard = OptionalJwtGuard = __decorate([
    (0, common_1.Injectable)()
], OptionalJwtGuard);
//# sourceMappingURL=optional-jwt.guard.js.map