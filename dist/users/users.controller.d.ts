import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMe(req: any): Promise<import("./user.schema").UserDocument>;
    updateMe(req: any, body: {
        name?: string;
        expoPushToken?: string;
    }): Promise<import("./user.schema").UserDocument>;
    addExpoPushToken(req: any, body: {
        token: string;
    }): Promise<import("./user.schema").UserDocument>;
    removeExpoPushToken(req: any, body: {
        token: string;
    }): Promise<import("./user.schema").UserDocument>;
}
