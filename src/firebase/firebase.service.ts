import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
    onModuleInit() {
        if (admin.apps.length === 0) {
            const projectId = process.env.FIREBASE_PROJECT_ID;
            const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
            const privateKey = process.env.FIREBASE_PRIVATE_KEY;
            if (!projectId || !clientEmail || !privateKey) {
                console.warn('[Firebase] Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY in .env');
                return;
            }
            try {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId,
                        clientEmail,
                        privateKey: privateKey.replace(/\\n/g, '\n'),
                    }),
                });
                console.log('[Firebase] Initialized successfully');
            } catch (error) {
                console.warn('[Firebase] Init failed:', error?.message || error);
            }
        }
    }

    async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
        return admin.auth().verifyIdToken(idToken);
    }

    /**
     * Send a push notification to one or more FCM device tokens.
     * Safely no-ops if Firebase is not configured or tokens is empty.
     */
    async sendPush(
        tokens: string[],
        notification: { title: string; body: string },
        data?: Record<string, string>,
    ): Promise<void> {
        if (!tokens || tokens.length === 0) return;
        if (admin.apps.length === 0) {
            // Firebase not initialized (e.g. placeholder .env) — avoid throwing.
            console.warn('Skipping push send because Firebase is not initialized.');
            return;
        }

        try {
            const result = await admin.messaging().sendEachForMulticast({
                tokens,
                notification,
                data,
            });
            console.log(`[Firebase] Push sent to ${result.successCount}/${tokens.length} device(s)`);
            if (result.failureCount > 0) {
                result.responses.forEach((r, i) => {
                    if (!r.success) console.warn('[Firebase] Send failed for token', i, r.error?.message);
                });
            }
        } catch (error) {
            console.warn('[Firebase] Failed to send push:', error?.message || error);
        }
    }
}
