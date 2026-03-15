import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT guard — if a valid token is present, it populates req.user.
 * If no token (or invalid), it still allows the request through with a dev user fallback.
 */
@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
    canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }

    // Override to never throw — just attach user if token is valid
    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        if (err || info || !user) {
            console.log('[OptionalJwtGuard] Auth Failed/Missing:', { err, info: info?.message, user: !!user });
        }
        
        // If there's a valid user from the JWT, use it! DO NOT fallback.
        if (user) return user;

        const request = context.switchToHttp().getRequest();
        
        // Only use dev fallback if explicitly requested and missing auth token
        const devRole = request.headers['x-dev-role'];
        if (devRole) {
            // Real Database IDs for hardcoded dev users
            const fallbackUsers = {
                customer: {
                    userId: '69ae9687937e3edd4b2f466a',
                    phone: '+923001234567',
                    role: 'customer',
                },
                driver: {
                    userId: '69aea534e55cda1c955ad87e',
                    phone: '+923007654321',
                    role: 'driver',
                },
            };
            
            console.log(`[OptionalJwtGuard] Falling back to devRole: ${devRole}`);
            return fallbackUsers[devRole] || fallbackUsers.customer;
        }
        
        // If absolutely no auth and no fallback, return null (allow through, handled by endpoints)
        return null;
    }
}
