import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { FirebaseModule } from '../firebase/firebase.module';
import { User, UserSchema } from '../users/user.schema';
import { Driver, DriverSchema } from '../drivers/driver.schema';
import { Otp, OtpSchema } from './otp.schema';

@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'tankerbhai_secret',
            signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '30d') as any },
        }),
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Driver.name, schema: DriverSchema },
            { name: Otp.name, schema: OtpSchema },
        ]),
        FirebaseModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [JwtModule, PassportModule],
})
export class AuthModule { }
