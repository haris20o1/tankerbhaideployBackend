import { Controller, Get, Patch, Post, Delete, Body, Request, UseGuards } from '@nestjs/common';
import { OptionalJwtGuard } from '../auth/optional-jwt.guard';
import { UsersService } from './users.service';

@UseGuards(OptionalJwtGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    getMe(@Request() req) {
        return this.usersService.findById(req.user.userId);
    }

    @Patch('me')
    updateMe(@Request() req, @Body() body: { name?: string; expoPushToken?: string }) {
        return this.usersService.updateMe(req.user.userId, body);
    }

    @Post('expo-push-token')
    addExpoPushToken(@Request() req, @Body() body: { token: string }) {
        return this.usersService.addExpoPushToken(req.user.userId, body.token);
    }

    @Delete('expo-push-token')
    removeExpoPushToken(@Request() req, @Body() body: { token: string }) {
        return this.usersService.removeExpoPushToken(req.user.userId, body.token);
    }
}
