import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    /**
     * POST /auth/verify-otp
     * Client sends Firebase ID token (after OTP verification on device).
     * Returns our JWT + user profile.
     */
    @Post('verify-otp')
    verifyOtp(@Body() dto: VerifyOtpDto & { expoPushToken?: string; signupPayload?: any }) {
        return this.authService.verifyAndLogin(dto.idToken, dto.role, dto.expoPushToken, dto.signupPayload);
    }

    /**
     * POST /auth/dev-login
     * Bypass Firebase for development.
     */
    @Post('dev-login')
    devLogin(@Body() body: { phone: string; role: string; expoPushToken?: string }) {
        return this.authService.devLogin(body.phone, body.role, body.expoPushToken);
    }

    /**
     * POST /auth/signup
     * Create a new customer or tanker driver account and return JWT + user.
     * Accepts payloads like:
     *  - Customer: { name, phoneNumber, role: "USER", city, address, profilePic }
     *  - Tanker Driver: { name, phoneNumber, role: "TANKER_USER", city, address, profilePic, tankerInfo: {...} }
     */
    @Post('signup')
    signup(@Body() body: any) {
        return this.authService.signup(body);
    }

    /**
     * POST /auth/send-otp
     * Send a 6-digit OTP to the given phone number.
     * Returns devCode in the response (remove in production).
     */
    @Post('send-otp')
    sendOtp(@Body() body: { phone: string }) {
        return this.authService.sendOtp(body.phone);
    }

    /**
     * POST /auth/verify-otp-code
     * Verify the OTP code and issue a JWT.
     * For login: { phone, code, role }
     * For signup: { phone, code, role, signupPayload: { name, city, ... } }
     */
    @Post('verify-otp-code')
    verifyOtpCode(@Body() body: {
        phone: string;
        code: string;
        role: string;
        signupPayload?: any;
        expoPushToken?: string;
    }) {
        return this.authService.verifyOtpCode(
            body.phone,
            body.code,
            body.role,
            body.signupPayload,
            body.expoPushToken,
        );
    }
}
