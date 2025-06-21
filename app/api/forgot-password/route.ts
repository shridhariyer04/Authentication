import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users, verificationTokens } from '@/lib/db/schemas';
import { eq, and } from 'drizzle-orm';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Zod schema for forgot password
const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send password reset OTP email
async function sendPasswordResetEmail(email: string, otp: string) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return false;
    }

    console.log('Sending password reset email to:', email);
    console.log('Using OTP:', otp);

    const result = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: [email],
      subject: 'Password Reset Verification Code',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
          <p>We received a request to reset your password. Use the verification code below to proceed:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="color: #dc2626; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p><strong>If you didn't request a password reset, please ignore this email.</strong></p>
          <p>For security reasons, this code can only be used once.</p>
        </div>
      `,
    });

    console.log('Password reset email sent successfully:', result);
    return true;
  } catch (error) {
    console.error('Password reset email sending failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    console.log('Forgot password request for email:', email);

    // Check if user exists
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user.length) {
      // For security, don't reveal if email exists or not
      return NextResponse.json({ 
        message: 'If an account with this email exists, you will receive a password reset code shortly.' 
      }, { status: 200 });
    }

    // Mark all existing unused password reset tokens for this email as used
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

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Send password reset email
    const emailSent = await sendPasswordResetEmail(email, otp);
    
    if (!emailSent) {
      console.error('Failed to send password reset email');
      return NextResponse.json({ 
        message: 'Failed to send verification email. Please try again later.' 
      }, { status: 500 });
    }

    // Store new password reset token
    await db.insert(verificationTokens).values({
      email,
      token: otp,
      type: 'password_reset',
      expiresAt,
      used: false,
    });

    console.log('Password reset token created and email sent');

    return NextResponse.json({ 
      message: 'If an account with this email exists, you will receive a password reset code shortly.' 
    }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        message: 'Invalid email format', 
        errors: error.errors 
      }, { status: 400 });
    }
    
    console.error('Forgot password error:', error);
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}