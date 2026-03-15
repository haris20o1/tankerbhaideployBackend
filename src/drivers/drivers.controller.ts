import { Controller, Get, Patch, Body, Request, UseGuards } from '@nestjs/common';
import { OptionalJwtGuard } from '../auth/optional-jwt.guard';
import { DriversService } from './drivers.service';

@UseGuards(OptionalJwtGuard)
@Controller('drivers')
export class DriversController {
    constructor(private readonly driversService: DriversService) { }

    /** GET /drivers/me — driver's own profile + stats */
    @Get('me')
    getMe(@Request() req) {
        return this.driversService.getMyProfile(req.user.userId);
    }

    /** PATCH /drivers/me/status — go online / offline */
    @Patch('me/status')
    setStatus(@Request() req, @Body() body: { isOnline: boolean }) {
        return this.driversService.setOnlineStatus(req.user.userId, body.isOnline);
    }

    /** PATCH /drivers/me/location — update GPS position */
    @Patch('me/location')
    updateLocation(
        @Request() req,
        @Body() body: { latitude: number; longitude: number },
    ) {
        return this.driversService.updateLocation(
            req.user.userId,
            body.latitude,
            body.longitude,
        );
    }
}
