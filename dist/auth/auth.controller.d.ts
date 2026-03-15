import { AuthService } from './auth.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    verifyOtp(dto: VerifyOtpDto & {
        expoPushToken?: string;
    }): Promise<{
        accessToken: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            phone: string;
            role: string;
            name: string;
        };
    }>;
    devLogin(body: {
        phone: string;
        role: string;
        expoPushToken?: string;
    }): Promise<{
        accessToken: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            phone: string;
            role: string;
            name: string;
        };
    }>;
    signup(body: any): Promise<{
        accessToken: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            phone: string;
            role: string;
            name: string;
        };
    }>;
    sendOtp(body: {
        phone: string;
    }): Promise<{
        message: string;
        devCode?: string;
    }>;
    verifyOtpCode(body: {
        phone: string;
        code: string;
        role: string;
        signupPayload?: any;
        expoPushToken?: string;
    }): Promise<{
        accessToken: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            phone: string;
            role: string;
            name: string;
        };
    }>;
}
