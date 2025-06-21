import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schemas";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).regex(/[0-9]/)  
});

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email: string, otp: string) {
  try {
    // Check if RESEND_API_KEY is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return false;
    }

    console.log('Attempting to send email to:', email);
    console.log('Using OTP:', otp);

    const result = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>', // Use resend.dev domain for testing
      to: [email], // Array format is recommended
      subject: 'Verify Your Email Address',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #333; text-align: center;">Email Verification</h2>
          <p>Thank you for signing up! Please use the following verification code to complete your registration:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="color: #2563eb; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
        </div>
      `,
    });

    console.log('Email sent successfully:', result);
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

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = signupSchema.parse(body);

        // Check if user already exists
        const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (existingUser.length) {
            return NextResponse.json({ message: 'Email already in use' }, { status: 409 });
        }

        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // First, try to send the email before creating the user
        console.log('Sending verification email...');
        const emailSent = await sendVerificationEmail(email, otp);

        if (!emailSent) {
            console.error('Failed to send verification email, aborting signup');
            return NextResponse.json({ 
                message: 'Failed to send verification email. Please try again later.' 
            }, { status: 500 });
        }

        // Only create user and token if email was sent successfully
        // Explicitly set isActive to false and emailVerified to null
        await db.insert(users).values({
            email,
            password: hashedPassword,
            isActive: false, // Explicitly set to false for unverified users
            emailVerified: null, // Explicitly set to null until verified
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Store verification token
        await db.insert(verificationTokens).values({
            email,
            token: otp,
            type: 'email_verification',
            expiresAt,
            used: false,
        });

        console.log('User created successfully with isActive: false, verification email sent');

        return NextResponse.json({ 
            message: 'User created successfully. Please check your email for verification code.',
            email: email
        }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ 
                message: 'Invalid input', 
                errors: error.errors 
            }, { status: 400 });
        }
        
        console.error('Signup error:', error);
        return NextResponse.json({ 
            message: 'Internal server error' 
        }, { status: 500 });
    }
}