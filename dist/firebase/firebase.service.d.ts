import { OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
export declare class FirebaseService implements OnModuleInit {
    onModuleInit(): void;
    verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken>;
    sendPush(tokens: string[], notification: {
        title: string;
        body: string;
    }, data?: Record<string, string>): Promise<void>;
}
