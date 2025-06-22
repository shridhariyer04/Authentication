// lib/rate-limit.ts
import { db } from '@/lib/db';
import { pgTable, varchar, integer, timestamp, uuid } from 'drizzle-orm/pg-core';
import { eq, and, gt,lt } from 'drizzle-orm';

// Rate limit attempts table schema
export const loginAttempts = pgTable('login_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  identifier: varchar('identifier', { length: 255 }).notNull(), // IP or email
  attempts: integer('attempts').default(0).notNull(),
  lastAttempt: timestamp('last_attempt', { mode: 'date' }).defaultNow(),
  blockedUntil: timestamp('blocked_until', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // Time window in milliseconds
  blockDurationMs: number; // How long to block after max attempts
}

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
  }) {
    this.config = config;
  }

  async checkRateLimit(identifier: string): Promise<{
    allowed: boolean;
    remainingAttempts: number;
    resetTime?: Date;
    blockedUntil?: Date;
  }> {
    try {
      const now = new Date();
      const windowStart = new Date(now.getTime() - this.config.windowMs);

      // Get existing record
      const existing = await db
        .select()
        .from(loginAttempts)
        .where(eq(loginAttempts.identifier, identifier))
        .limit(1);

      if (!existing.length) {
        // No previous attempts
        return {
          allowed: true,
          remainingAttempts: this.config.maxAttempts - 1,
        };
      }

      const record = existing[0];

      // Check if currently blocked
      if (record.blockedUntil && record.blockedUntil > now) {
        return {
          allowed: false,
          remainingAttempts: 0,
          blockedUntil: record.blockedUntil,
        };
      }

      // Check if we're outside the time window (reset attempts)
      if (record.lastAttempt && record.lastAttempt < windowStart) {
        // Reset the counter
        await db
          .update(loginAttempts)
          .set({
            attempts: 0,
            lastAttempt: now,
            blockedUntil: null,
          })
          .where(eq(loginAttempts.id, record.id));

        return {
          allowed: true,
          remainingAttempts: this.config.maxAttempts - 1,
        };
      }

      // Check if we've exceeded max attempts
      if (record.attempts >= this.config.maxAttempts) {
        const blockedUntil = new Date(now.getTime() + this.config.blockDurationMs);
        
        // Update block time
        await db
          .update(loginAttempts)
          .set({ blockedUntil })
          .where(eq(loginAttempts.id, record.id));

        return {
          allowed: false,
          remainingAttempts: 0,
          blockedUntil,
        };
      }

      // Still within limits
      return {
        allowed: true,
        remainingAttempts: this.config.maxAttempts - record.attempts,
        resetTime: new Date(record.lastAttempt!.getTime() + this.config.windowMs),
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // On error, allow the request (fail open)
      return {
        allowed: true,
        remainingAttempts: this.config.maxAttempts,
      };
    }
  }

  async recordAttempt(identifier: string, success: boolean): Promise<void> {
    try {
      const now = new Date();

      // Get existing record
      const existing = await db
        .select()
        .from(loginAttempts)
        .where(eq(loginAttempts.identifier, identifier))
        .limit(1);

      if (!existing.length) {
        // Create new record
        await db.insert(loginAttempts).values({
          identifier,
          attempts: success ? 0 : 1,
          lastAttempt: now,
          blockedUntil: null,
        });
      } else {
        // Update existing record
        const record = existing[0];
        const newAttempts = success ? 0 : record.attempts + 1;

        await db
          .update(loginAttempts)
          .set({
            attempts: newAttempts,
            lastAttempt: now,
            blockedUntil: success ? null : record.blockedUntil,
          })
          .where(eq(loginAttempts.id, record.id));
      }
    } catch (error) {
      console.error('Record attempt error:', error);
    }
  }

 async cleanup(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - this.config.windowMs * 2);
    
    await db
      .delete(loginAttempts)
      .where(
        and(
          eq(loginAttempts.attempts, 0),
          lt(loginAttempts.lastAttempt!, cutoff) // lastAttempt < cutoff
        )
      );
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}
}

// Utility function to get client IP
export function getClientIP(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded 
    ? (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0])
    : req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
   
  return ip.trim();
}

// Create rate limiter instances
export const ipRateLimiter = new RateLimiter({
  maxAttempts: 10, // 10 attempts per IP
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 60 * 60 * 1000, // 1 hour block
});

export const emailRateLimiter = new RateLimiter({
  maxAttempts: 5, // 5 attempts per email
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 30 * 60 * 1000, // 30 minutes block
});