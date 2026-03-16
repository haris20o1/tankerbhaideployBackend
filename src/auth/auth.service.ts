import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { FirebaseService } from '../firebase/firebase.service';
import { User, UserDocument } from '../users/user.schema';
import { Driver, DriverDocument } from '../drivers/driver.schema';
import { Otp, OtpDocument } from './otp.schema';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
        @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
        private firebaseService: FirebaseService,
        private jwtService: JwtService,
    ) { }

    /**
     * Generate and store a 6-digit OTP for the given phone number.
     * In production, integrate an SMS provider (Twilio, etc.) to send the SMS.
     * In development, the code is returned in the response for easy testing.
     */
    async sendOtp(phone: string): Promise<{ message: string; devCode?: string }> {
        if (!phone) throw new BadRequestException('phone is required');

        // Invalidate any previous unused OTP for this phone
        await this.otpModel.deleteMany({ phone });

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        await this.otpModel.create({ phone, code, expiresAt });

        // TODO: Replace with real SMS provider (Twilio, etc.) in production
        console.log(`[OTP] Code for ${phone}: ${code}`);

        return {
            message: 'OTP sent successfully',
            devCode: code, // Remove in production – only for development testing
        };
    }

    /**
     * Verify a 6-digit OTP code for the given phone.
     * If valid, creates or finds the user account and returns a JWT.
     */
    async verifyOtpCode(
        phone: string,
        code: string,
        role: string,
        signupPayload?: any,
        expoPushToken?: string,
    ) {
        const otpRecord = await this.otpModel.findOne({ phone, used: false });

        if (!otpRecord) {
            throw new UnauthorizedException('OTP not found or already used. Please request a new code.');
        }
        if (otpRecord.expiresAt < new Date()) {
            await this.otpModel.deleteOne({ _id: otpRecord._id });
            throw new UnauthorizedException('OTP has expired. Please request a new code.');
        }
        if (otpRecord.code !== code) {
            throw new UnauthorizedException('Incorrect OTP code.');
        }

        // Mark OTP as used
        await this.otpModel.updateOne({ _id: otpRecord._id }, { used: true });

        // If signup payload provided, create the account
        if (signupPayload) {
            return this.signup({ ...signupPayload, phoneNumber: phone, expoPushToken });
        }

        // Otherwise just login
        const normalizedRole = ['customer', 'driver'].includes(role) ? role : 'customer';
        return this.generateAuthResponse(phone, normalizedRole, expoPushToken);
    }

    async verifyAndLogin(idToken: string, role: string, expoPushToken?: string, signupPayload?: any) {
        if (!['customer', 'driver'].includes(role)) {
            throw new BadRequestException('Role must be customer or driver');
        }

        try {
            // 1. Verify token with Firebase
            const decodedToken = await this.firebaseService.verifyIdToken(idToken);
            const phone = decodedToken.phone_number;

            if (!phone) {
                throw new UnauthorizedException('No phone number found in token');
            }

            // 2. If it's a new user signing up, route to the signup flow using the verified phone
            if (signupPayload) {
                return this.signup({ ...signupPayload, phoneNumber: phone, expoPushToken });
            }

            // 3. Login flow - check the user actually exists first
            const existingUser = await this.userModel.findOne({ phone });
            if (!existingUser) {
                throw new NotFoundException('No account found for this number. Please sign up first.');
            }

            // 4. Return the login response using the role stored in the database (not the requested role)
            return this.generateAuthResponse(phone, existingUser.role, expoPushToken);

        } catch (error) {
            // Re-throw NestJS HTTP exceptions directly (don't wrap them)
            if (error?.status) throw error;
            console.error('[FIREBASE VERIFY ERROR]', error);
            throw new UnauthorizedException('Invalid Firebase Token: ' + error.message);
        }
    }

    async devLogin(phone: string, role: string, expoPushToken?: string) {
        // Development bypass for Firebase logging in directly via phone number
        if (!phone) {
            throw new UnauthorizedException('Phone number is required for dev login');
        }
        return this.generateAuthResponse(phone, role, expoPushToken);
    }

    /**
     * Signup with full profile data (customer or tanker driver).
     * Accepts roles like "USER" | "TANKER_USER" or "customer" | "driver".
     */
    async signup(payload: any) {
        const {
            name,
            phoneNumber: rawPhone,
            idToken,
            role,
            city,
            address,
            profilePic,
            tankerInfo,
            expoPushToken,
        } = payload || {};

        let phoneNumber = rawPhone;

        // If idToken is provided (Firebase OTP flow), verify it and extract the phone
        if (idToken) {
            try {
                const decoded = await this.firebaseService.verifyIdToken(idToken);
                if (decoded.phone_number) {
                    phoneNumber = decoded.phone_number;
                }
            } catch (e) {
                throw new BadRequestException('Invalid Firebase ID token during signup');
            }
        }

        if (!phoneNumber) {
            throw new BadRequestException('phoneNumber is required');
        }

        const normalizedRole =
            role === 'TANKER_USER' || role === 'driver' ? 'driver' : 'customer';

        // If user already exists, reject the signup and tell them to login
        const existing = await this.userModel.findOne({ phone: phoneNumber });
        if (existing) {
            throw new ConflictException(
                `An account already exists for this number as a ${existing.role}. Please use the Login screen instead.`
            );
        }

        // Create base user
        const user = await this.userModel.create({
            phone: phoneNumber,
            role: normalizedRole,
            name,
            city,
            address,
            profilePic,
            expoPushToken: expoPushToken || undefined,
        });

        // If tanker driver, also create a driver profile
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

        // Reuse existing JWT response helper
        return this.generateAuthResponse(phoneNumber, normalizedRole, expoPushToken);
    }

    private async generateAuthResponse(phone: string, role: string, expoPushToken?: string) {
        if (!['customer', 'driver'].includes(role)) {
            throw new BadRequestException('Role must be customer or driver');
        }

        // Upsert user in MongoDB
        let user = await this.userModel.findOne({ phone });
        if (!user) {
            user = await this.userModel.create({
                phone,
                role,
                expoPushToken: expoPushToken || undefined,
            });

            // If driver, create driver profile too
            if (role === 'driver') {
                await this.driverModel.create({ userId: user._id });
            }
        } else if (expoPushToken) {
            // Always keep the latest Expo push token
            user.expoPushToken = expoPushToken;
            await user.save();
        }

        // 3. Issue JWT
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
}
