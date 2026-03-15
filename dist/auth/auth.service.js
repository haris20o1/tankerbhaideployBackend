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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const jwt_1 = require("@nestjs/jwt");
const firebase_service_1 = require("../firebase/firebase.service");
const user_schema_1 = require("../users/user.schema");
const driver_schema_1 = require("../drivers/driver.schema");
const otp_schema_1 = require("./otp.schema");
let AuthService = class AuthService {
    userModel;
    driverModel;
    otpModel;
    firebaseService;
    jwtService;
    constructor(userModel, driverModel, otpModel, firebaseService, jwtService) {
        this.userModel = userModel;
        this.driverModel = driverModel;
        this.otpModel = otpModel;
        this.firebaseService = firebaseService;
        this.jwtService = jwtService;
    }
    async sendOtp(phone) {
        if (!phone)
            throw new common_1.BadRequestException('phone is required');
        await this.otpModel.deleteMany({ phone });
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await this.otpModel.create({ phone, code, expiresAt });
        console.log(`[OTP] Code for ${phone}: ${code}`);
        return {
            message: 'OTP sent successfully',
            devCode: code,
        };
    }
    async verifyOtpCode(phone, code, role, signupPayload, expoPushToken) {
        const otpRecord = await this.otpModel.findOne({ phone, used: false });
        if (!otpRecord) {
            throw new common_1.UnauthorizedException('OTP not found or already used. Please request a new code.');
        }
        if (otpRecord.expiresAt < new Date()) {
            await this.otpModel.deleteOne({ _id: otpRecord._id });
            throw new common_1.UnauthorizedException('OTP has expired. Please request a new code.');
        }
        if (otpRecord.code !== code) {
            throw new common_1.UnauthorizedException('Incorrect OTP code.');
        }
        await this.otpModel.updateOne({ _id: otpRecord._id }, { used: true });
        if (signupPayload) {
            return this.signup({ ...signupPayload, phoneNumber: phone, expoPushToken });
        }
        const normalizedRole = ['customer', 'driver'].includes(role) ? role : 'customer';
        return this.generateAuthResponse(phone, normalizedRole, expoPushToken);
    }
    async verifyAndLogin(idToken, role, expoPushToken) {
        if (!['customer', 'driver'].includes(role)) {
            throw new common_1.BadRequestException('Role must be customer or driver');
        }
        try {
            const decodedToken = await this.firebaseService.verifyIdToken(idToken);
            const phone = decodedToken.phone_number;
            if (!phone) {
                throw new common_1.UnauthorizedException('No phone number found in token');
            }
            return this.generateAuthResponse(phone, role, expoPushToken);
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid Firebase Token', error.message);
        }
    }
    async devLogin(phone, role, expoPushToken) {
        if (!phone) {
            throw new common_1.UnauthorizedException('Phone number is required for dev login');
        }
        return this.generateAuthResponse(phone, role, expoPushToken);
    }
    async signup(payload) {
        const { name, phoneNumber: rawPhone, idToken, role, city, address, profilePic, tankerInfo, expoPushToken, } = payload || {};
        let phoneNumber = rawPhone;
        if (idToken) {
            try {
                const decoded = await this.firebaseService.verifyIdToken(idToken);
                if (decoded.phone_number) {
                    phoneNumber = decoded.phone_number;
                }
            }
            catch (e) {
                throw new common_1.BadRequestException('Invalid Firebase ID token during signup');
            }
        }
        if (!phoneNumber) {
            throw new common_1.BadRequestException('phoneNumber is required');
        }
        const normalizedRole = role === 'TANKER_USER' || role === 'driver' ? 'driver' : 'customer';
        const existing = await this.userModel.findOne({ phone: phoneNumber });
        if (existing) {
            return this.generateAuthResponse(phoneNumber, existing.role, expoPushToken);
        }
        const user = await this.userModel.create({
            phone: phoneNumber,
            role: normalizedRole,
            name,
            city,
            address,
            profilePic,
            expoPushToken: expoPushToken || undefined,
        });
        if (normalizedRole === 'driver') {
            await this.driverModel.create({
                userId: user._id,
                vehicleNumber: tankerInfo?.vehicleNo,
                vehicleType: tankerInfo?.tankSize
                    ? `Tanker ${tankerInfo.tankSize.join('/')}`
                    : undefined,
                alternativePhone: tankerInfo?.alternativePhone,
                tankSizes: tankerInfo?.tankSize ?? [],
            });
        }
        return this.generateAuthResponse(phoneNumber, normalizedRole, expoPushToken);
    }
    async generateAuthResponse(phone, role, expoPushToken) {
        if (!['customer', 'driver'].includes(role)) {
            throw new common_1.BadRequestException('Role must be customer or driver');
        }
        let user = await this.userModel.findOne({ phone });
        if (!user) {
            user = await this.userModel.create({
                phone,
                role,
                expoPushToken: expoPushToken || undefined,
            });
            if (role === 'driver') {
                await this.driverModel.create({ userId: user._id });
            }
        }
        else if (expoPushToken) {
            user.expoPushToken = expoPushToken;
            await user.save();
        }
        const payload = {
            sub: user._id.toString(),
            phone: user.phone,
            role: user.role,
        };
        return {
            accessToken: this.jwtService.sign(payload),
            user: {
                id: user._id,
                phone: user.phone,
                role: user.role,
                name: user.name,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(driver_schema_1.Driver.name)),
    __param(2, (0, mongoose_1.InjectModel)(otp_schema_1.Otp.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        firebase_service_1.FirebaseService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map