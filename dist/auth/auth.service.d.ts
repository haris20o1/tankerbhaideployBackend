import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { FirebaseService } from '../firebase/firebase.service';
import { UserDocument } from '../users/user.schema';
import { DriverDocument } from '../drivers/driver.schema';
import { OtpDocument } from './otp.schema';
export declare class AuthService {
    private userModel;
    private driverModel;
    private otpModel;
    private firebaseService;
    private jwtService;
    constructor(userModel: Model<UserDocument>, driverModel: Model<DriverDocument>, otpModel: Model<OtpDocument>, firebaseService: FirebaseService, jwtService: JwtService);
    sendOtp(phone: string): Promise<{
        message: string;
        devCode?: string;
    }>;
    verifyOtpCode(phone: string, code: string, role: string, signupPayload?: any, expoPushToken?: string): Promise<{
        accessToken: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            phone: string;
            role: string;
            name: string;
        };
    }>;
    verifyAndLogin(idToken: string, role: string, expoPushToken?: string): Promise<{
        accessToken: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            phone: string;
            role: string;
            name: string;
        };
    }>;
    devLogin(phone: string, role: string, expoPushToken?: string): Promise<{
        accessToken: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            phone: string;
            role: string;
            name: string;
        };
    }>;
    signup(payload: any): Promise<{
        accessToken: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            phone: string;
            role: string;
            name: string;
        };
    }>;
    private generateAuthResponse;
}
