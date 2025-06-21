import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users, verificationTokens } from '@/lib/db/schemas';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Zod schema for reset password
const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, otp, newPassword } = resetPasswordSchema.parse(body);

    console.log('Reset password request for email:', email);

    // Check if user exists
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user.length) {
      return NextResponse.json({ 
        message: 'Invalid request' 
      }, { status: 400 });
    }

    // Verify OTP
    const verificationToken = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.email, email),
          eq(verificationTokens.token, otp),
          eq(verificationTokens.type, 'password_reset'),
          eq(verificationTokens.used, false)
        )
      )
      .limit(1);

    if (!verificationToken.length) {
      return NextResponse.json({ 
        message: 'Invalid or expired verification code' 
      }, { status: 400 });
    }

    // Check if token is expired
    const token = verificationToken[0];
    if (new Date() > token.expiresAt) {
      return NextResponse.json({ 
        message: 'Verification code has expired' 
      }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await db
      .update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.email, email));

    // Mark the token as used
    await db
      .update(verificationTokens)
      .set({ used: true })
      .where(eq(verificationTokens.id, token.id));

    // Also mark any other unused password reset tokens for this email as used
    await db
      .update(verificationTokens)
      .set({ used: true })
      .where(
        and(
          eq(verificationTokens.email, email),
          eq(verificationTokens.type, 'password_reset'),
          eq(verificationTokens.used, false)
        )
      );

    console.log('Password reset successful for email:', email);

    return NextResponse.json({ 
      message: 'Password reset successful. You can now log in with your new password.' 
    }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        message: 'Invalid input', 
        errors: error.errors 
      }, { status: 400 });
    }
    
    console.error('Reset password error:', error);
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}