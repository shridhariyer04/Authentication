import { db } from '@/lib/db';
import { activityLogs } from '../lib/db/schemas/activitylog';
import { NextRequest } from 'next/server';

export type ActivityAction = 
  | 'signup'
  | 'login'
  | 'logout'
  | 'password_reset_request'
  | 'password_reset_complete'
  | 'email_verification'
  | 'profile_update'
  | 'password_change'
  | 'account_activation'
  | 'account_deactivation'
  | 'failed_login'
  | 'rate_limit_exceeded'
  | 'google_signup'
  | 'google_login';

export type ActivityCategory = 'auth' | 'profile' | 'security' | 'verification';

interface LogActivityParams {
  userId?: string;
  action: ActivityAction;
  category: ActivityCategory;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  success?: boolean;
  request?: NextRequest;
}

export class ActivityLogger {
  private static getClientInfo(request?: NextRequest) {
    if (!request) return { ipAddress: null, userAgent: null };

    // Get IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwarded?.split(',')[0] || realIp || 'unknown';

    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'unknown';

    return { ipAddress, userAgent };
  }

  static async logActivity({
    userId,
    action,
    category,
    description,
    ipAddress,
    userAgent,
    metadata,
    success = true,
    request
  }: LogActivityParams) {
    try {
      // Get client info from request if not provided
      const clientInfo = this.getClientInfo(request);
      const finalIpAddress = ipAddress || clientInfo.ipAddress;
      const finalUserAgent = userAgent || clientInfo.userAgent;

      await db.insert(activityLogs).values({
        userId,
        action,
        category,
        description,
        ipAddress: finalIpAddress,
        userAgent: finalUserAgent,
        metadata,
        success,
      });

      console.log(`Activity logged: ${action} for user ${userId || 'anonymous'}`);
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  // Convenience methods for common activities
  static async logSignup(userId: string, email: string, method: 'email' | 'google', request?: NextRequest) {
    await this.logActivity({
      userId,
      action: method === 'google' ? 'google_signup' : 'signup',
      category: 'auth',
      description: `New user signed up with ${method}`,
      metadata: { email, method },
      request,
    });
  }

  static async logLogin(userId: string, email: string, method: 'email' | 'google', request?: NextRequest) {
    await this.logActivity({
      userId,
      action: method === 'google' ? 'google_login' : 'login',
      category: 'auth',
      description: `User logged in with ${method}`,
      metadata: { email, method },
      request,
    });
  }

  static async logFailedLogin(email: string, reason: string, request?: NextRequest) {
    await this.logActivity({
      action: 'failed_login',
      category: 'security',
      description: `Failed login attempt for ${email}`,
      metadata: { email, reason },
      success: false,
      request,
    });
  }

  static async logPasswordReset(email: string, stage: 'request' | 'complete', request?: NextRequest) {
    await this.logActivity({
      action: stage === 'request' ? 'password_reset_request' : 'password_reset_complete',
      category: 'security',
      description: stage === 'request' 
        ? `Password reset requested for ${email}`
        : `Password reset completed for ${email}`,
      metadata: { email },
      request,
    });
  }

  static async logEmailVerification(userId: string, email: string, request?: NextRequest) {
    await this.logActivity({
      userId,
      action: 'email_verification',
      category: 'verification',
      description: `Email verified for ${email}`,
      metadata: { email },
      request,
    });
  }

  static async logProfileUpdate(userId: string, changes: string[], request?: NextRequest) {
    await this.logActivity({
      userId,
      action: 'profile_update',
      category: 'profile',
      description: `Profile updated: ${changes.join(', ')}`,
      metadata: { changes },
      request,
    });
  }

  static async logRateLimitExceeded(email: string, limitType: 'ip' | 'email', request?: NextRequest) {
    await this.logActivity({
      action: 'rate_limit_exceeded',
      category: 'security',
      description: `Rate limit exceeded for ${email} (${limitType})`,
      metadata: { email, limitType },
      success: false,
      request,
    });
  }

  static async logLogout(userId: string, request?: NextRequest) {
    await this.logActivity({
      userId,
      action: 'logout',
      category: 'auth',
      description: 'User logged out',
      request,
    });
  }
}