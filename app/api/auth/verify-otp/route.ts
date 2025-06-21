import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users, verificationTokens } from '@/lib/db/schemas';
import { eq, and } from 'drizzle-orm';

// Zod schema for OTP verification
const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6).regex(/^\d+$/, "OTP must be 6 digits"),
});

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { email, otp } = verifyOtpSchema.parse(body);

    console.log('OTP verification request for email:', email, 'OTP:', otp);

    // Check if user exists
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user.length) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if user is already verified (check both isActive and emailVerified)
    if (user[0].isActive || user[0].emailVerified) {
      return NextResponse.json({ message: 'Email already verified' }, { status: 400 });
    }

    // Find valid verification token
    const verificationToken = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.email, email),
          eq(verificationTokens.token, otp),
          eq(verificationTokens.type, 'email_verification'),
          eq(verificationTokens.used, false)
        )
      )
      .limit(1);

    if (!verificationToken.length) {
      return NextResponse.json({ 
        message: 'Invalid or expired verification code' 
      }, { status: 400 });
    }

    // Check if token has expired
    const token = verificationToken[0];
    if (new Date() > token.expiresAt) {
      return NextResponse.json({ 
        message: 'Verification code has expired' 
      }, { status: 400 });
    }

    // Mark token as used
    await db
      .update(verificationTokens)
      .set({ used: true })
      .where(eq(verificationTokens.id, token.id));

    // Update user verification status with local timezone
    const now = new Date();
    // Convert to IST (India Standard Time) - UTC+5:30
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istTime = new Date(now.getTime() + istOffset);
    
    await db
      .update(users)
      .set({ 
        isActive: true,
        emailVerified: istTime, // Use IST time
        updatedAt: istTime
      })
      .where(eq(users.email, email));

    console.log('Email verified successfully for:', email);

    return NextResponse.json({ 
      message: 'Email verified successfully' 
    }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        message: 'Invalid input', 
        errors: error.errors 
      }, { status: 400 });
    }
    
    console.error('OTP verification error:', error);
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}