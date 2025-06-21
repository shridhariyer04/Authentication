import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users, verificationTokens } from '../../../../lib/db/schemas';
import { eq, and } from 'drizzle-orm';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Zod schema for resend OTP
const resendOtpSchema = z.object({
  email: z.string().email(),
});

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email via Resend
async function sendVerificationEmail(email: string, otp: string) {
  try {
    // Check if RESEND_API_KEY is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return false;
    }

    console.log('Attempting to resend email to:', email);
    console.log('Using new OTP:', otp);

    const result = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>', // Use resend.dev domain for testing
      to: [email], // Array format is recommended
      subject: 'New Verification Code',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #333; text-align: center;">New Verification Code</h2>
          <p>Here's your new verification code:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="color: #2563eb; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
        </div>
      `,
    });

    console.log('Resend email sent successfully:', result);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return false;
  }
}

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { email } = resendOtpSchema.parse(body);

    console.log('Resend OTP request for email:', email);

    // Check if user exists and is not yet verified
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user.length) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (user[0].isActive) {
      return NextResponse.json({ message: 'Email already verified' }, { status: 400 });
    }

    // Mark all existing unused tokens for this email as used
    await db
      .update(verificationTokens)
      .set({ used: true })
      .where(
        and(
          eq(verificationTokens.email, email),
          eq(verificationTokens.type, 'email_verification'),
          eq(verificationTokens.used, false)
        )
      );

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Send verification email first
    const emailSent = await sendVerificationEmail(email, otp);
    
    if (!emailSent) {
      console.error('Failed to send resend verification email');
      return NextResponse.json({ 
        message: 'Failed to send verification email. Please try again later.' 
      }, { status: 500 });
    }

    // Store new verification token only if email was sent successfully
    await db.insert(verificationTokens).values({
      email,
      token: otp,
      type: 'email_verification',
      expiresAt,
      used: false,
    });

    console.log('New verification token created and email sent');

    return NextResponse.json({ 
      message: 'New verification code sent to your email' 
    }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        message: 'Invalid input', 
        errors: error.errors 
      }, { status: 400 });
    }
    
    console.error('Resend OTP error:', error);
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}