import { DriversService } from './drivers.service';
export declare class DriversController {
    private readonly driversService;
    constructor(driversService: DriversService);
    getMe(req: any): Promise<any>;
    setStatus(req: any, body: {
        isOnline: boolean;
    }): Promise<import("./driver.schema").DriverDocument>;
    updateLocation(req: any, body: {
        latitude: number;
        longitude: number;
    }): Promise<import("./driver.schema").DriverDocument>;
}
