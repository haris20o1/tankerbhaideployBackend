import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyOtpDto {
    @IsString()
    @IsNotEmpty()
    idToken: string; // Firebase ID token from client

    @IsString()
    @IsNotEmpty()
    role: string; // 'customer' | 'driver'
}
