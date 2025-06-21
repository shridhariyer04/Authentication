"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import Link from "next/link"

const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address")
})

const resetPasswordSchema = z.object({
    otp: z.string().length(6, "OTP must be 6 digits"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password")
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export default function ForgotPassword() {
    const router = useRouter()
    const [step, setStep] = useState<'email' | 'reset'>('email')
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const emailForm = useForm<ForgotPasswordForm>({
        resolver: zodResolver(forgotPasswordSchema),
    })

    const resetForm = useForm<ResetPasswordForm>({
        resolver: zodResolver(resetPasswordSchema),
    })

    const onEmailSubmit = async (data: ForgotPasswordForm) => {
        setError('')
        setSuccess('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: data.email }),
            })

            const result = await response.json()

            if (response.ok) {
                setEmail(data.email)
                setStep('reset')
                setSuccess(result.message)
            } else {
                setError(result.message || 'Something went wrong')
            }
        } catch (error) {
            setError('Network error. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const onResetSubmit = async (data: ResetPasswordForm) => {
        setError('')
        setSuccess('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    otp: data.otp,
                    newPassword: data.newPassword,
                }),
            })

            const result = await response.json()

            if (response.ok) {
                setSuccess(result.message)
                setTimeout(() => {
                    router.push('/login')
                }, 2000)
            } else {
                setError(result.message || 'Something went wrong')
            }
        } catch (error) {
            setError('Network error. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const resendOTP = async () => {
        setError('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            })

            const result = await response.json()

            if (response.ok) {
                setSuccess('New verification code sent to your email')
            } else {
                setError(result.message || 'Failed to resend code')
            }
        } catch (error) {
            setError('Network error. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">
                        {step === 'email' ? 'Forgot Password' : 'Reset Password'}
                    </h1>
                    <p className="text-gray-600 mt-2">
                        {step === 'email' 
                            ? 'Enter your email to receive a verification code'
                            : 'Enter the code sent to your email and your new password'
                        }
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 text-center">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4 text-center">
                        {success}
                    </div>
                )}

                {step === 'email' ? (
                    <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                {...emailForm.register("email")}
                                type="email"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="you@example.com"
                            />
                            {emailForm.formState.errors.email && (
                                <p className="mt-1 text-sm text-red-600">
                                    {emailForm.formState.errors.email.message}
                                </p>
                            )}
                        </div>

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? "Sending..." : "Send Verification Code"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Verification Code
                            </label>
                            <input
                                {...resetForm.register("otp")}
                                type="text"
                                maxLength={6}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-center text-2xl tracking-widest"
                                placeholder="000000"
                            />
                            {resetForm.formState.errors.otp && (
                                <p className="mt-1 text-sm text-red-600">
                                    {resetForm.formState.errors.otp.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                New Password
                            </label>
                            <input
                                {...resetForm.register("newPassword")}
                                type="password"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Enter new password"
                            />
                            {resetForm.formState.errors.newPassword && (
                                <p className="mt-1 text-sm text-red-600">
                                    {resetForm.formState.errors.newPassword.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm New Password
                            </label>
                            <input
                                {...resetForm.register("confirmPassword")}
                                type="password"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Confirm new password"
                            />
                            {resetForm.formState.errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">
                                    {resetForm.formState.errors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? "Resetting..." : "Reset Password"}
                        </button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={resendOTP}
                                disabled={isLoading}
                                className="text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50"
                            >
                                Didn't receive the code? Resend
                            </button>
                        </div>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <Link 
                        href="/login" 
                        className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        ← Back to Login
                    </Link>
                </div>
            </div>
        </div>
    )
}