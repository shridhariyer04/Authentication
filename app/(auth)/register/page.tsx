"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn, getSession } from "next-auth/react";

const signupSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(8, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});

type SignupForm = z.infer<typeof signupSchema>;
type OtpForm = z.infer<typeof otpSchema>;

export default function Register() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [step, setStep] = useState<"signup" | "verify">("signup");
  const [userEmail, setUserEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  // Form for OTP verification
  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
  });

  const onSignupSubmit = async (data: SignupForm) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Signup Failed");
      setUserEmail(data.email);
      setSuccess(
        "Account created! Please check your email for verification code."
      );
      setStep("verify");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
  };

  const onOtpSubmit = async (data: OtpForm) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, otp: data.otp }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Verification failed");

      setSuccess("Email verified successfully! Redirecting to dashboard");
      setTimeout(() => {
        router.push("/dashboard?verified=true");
      }, 2000);
    } catch (error: any) {
      setError(error.message || "Verification failed");
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to resend OTP");

      setSuccess("New verification code sent to your email");
    } catch (error: any) {
      setError(error.message || "Failed to resend OTP");
    } finally {
      setIsResending(false);
    }
  };

  // Updated handleGoogleSignIn function for your register component
const handleGoogleSignIn = async () => {
  setIsGoogleLoading(true);
  setError("");
  setSuccess("");
  
  try {
    const result = await signIn('google', {
      redirect: false, // Handle redirect manually
    });

    if (result?.error) {
      setError(`Google sign-in failed: ${result.error}`);
    } else if (result?.ok) {
      // Wait a moment for the session to be established
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if sign-in was successful by getting the session
      const session = await getSession();
      if (session?.user) {
        setSuccess("Successfully signed in with Google! Redirecting...");
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setError("Sign-in succeeded but session not created. Please try again.");
      }
    } else {
      setError("Google sign-in was cancelled or failed.");
    }
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    setError("An unexpected error occurred during Google sign-in.");
  } finally {
    setIsGoogleLoading(false);
  }
};

  const handleBackToSignup = () => {
    setStep('signup');
    setError("");
    setSuccess("");
    otpForm.reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 w-full max-w-md">
        {step === 'signup' ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Create your account</h1>
              <p className="text-sm text-gray-600">Please fill in your information to get started</p>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">
                {success}
              </div>
            )}

            {/* Google Sign-in Button */}
            <button 
              type="button" 
              onClick={handleGoogleSignIn} 
              disabled={isGoogleLoading || signupForm.formState.isSubmitting}
              className="w-full bg-white text-gray-700 font-medium py-3 px-4 rounded-md border border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isGoogleLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC04" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  {...signupForm.register('email')}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
                {signupForm.formState.errors.email && (
                  <p className="text-red-600 text-sm mt-1">{signupForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  {...signupForm.register('password')}
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Create a password"
                />
                {signupForm.formState.errors.password && (
                  <p className="text-red-600 text-sm mt-1">{signupForm.formState.errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  {...signupForm.register('confirmPassword')}
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm your password"
                />
                {signupForm.formState.errors.confirmPassword && (
                  <p className="text-red-600 text-sm mt-1">{signupForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <button 
                type="submit" 
                disabled={signupForm.formState.isSubmitting || isGoogleLoading}
                className="w-full bg-blue-600 text-white font-medium py-2.5 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {signupForm.formState.isSubmitting ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            {/* Sign in link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button 
                  onClick={() => router.push('/login')}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Verify your email</h1>
              <p className="text-sm text-gray-600">
                We've sent a verification code to <span className="font-medium">{userEmail}</span>
              </p>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">
                {success}
              </div>
            )}

            <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Verification code
                </label>
                <input
                  id="otp"
                  {...otpForm.register('otp')}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  autoFocus
                  className="w-full px-3 py-3 text-center text-lg font-mono border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  onPaste={(e) => {
                    // Handle paste event to extract only numbers
                    e.preventDefault();
                    const paste = e.clipboardData.getData('text');
                    const numbers = paste.replace(/\D/g, '').slice(0, 6);
                    otpForm.setValue('otp', numbers);
                  }}
                  onInput={(e) => {
                    // Only allow numbers
                    const target = e.target as HTMLInputElement;
                    target.value = target.value.replace(/\D/g, '');
                  }}
                />
                {otpForm.formState.errors.otp && (
                  <p className="text-red-600 text-sm mt-1">{otpForm.formState.errors.otp.message}</p>
                )}
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 text-white font-medium py-2.5 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={otpForm.formState.isSubmitting}
              >
                {otpForm.formState.isSubmitting ? 'Verifying...' : 'Verify email'}
              </button>

              <div className="space-y-3">
                <button 
                  type="button" 
                  onClick={handleResendOtp} 
                  disabled={isResending}
                  className="w-full bg-white text-gray-700 font-medium py-2.5 px-4 rounded-md border border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isResending ? 'Sending...' : 'Resend code'}
                </button>
                
                <button 
                  type="button" 
                  onClick={handleBackToSignup} 
                  className="w-full text-gray-600 font-medium py-2 px-4 hover:text-gray-800 transition-colors"
                >
                  ← Back to sign up
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}