"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Login from '@/components/auth/Login';
import Signup from '@/components/auth/Signup';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

import Image from 'next/image';

function AuthContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated, loading: authLoading, userType } = useAuth();

    // Page state
    const [isLogin, setIsLogin] = useState(true);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

    // Check if user should be redirected
    useEffect(() => {
        if (!authLoading && isAuthenticated && userType) {
            const redirectPath = searchParams.get('redirect');
            if (redirectPath) {
                router.replace(redirectPath);
            } else {
                const defaultPath = userType === 'expert' ? '/expert-dashboard' : '/dashboard';
                router.replace(defaultPath);
            }
        }
    }, [isAuthenticated, authLoading, userType, router, searchParams]);

    useEffect(() => {
        const msg = searchParams.get('message');
        const urlMessage = searchParams.get('error') ? 'error' : 'success';
        if (msg) {
            setMessage(decodeURIComponent(msg));
            setMessageType(urlMessage as 'success' | 'error');
        }
        const isSignUpParam = searchParams.get('isSignUp');
        if (isSignUpParam === 'true') {
            setIsLogin(false);
        }
    }, [searchParams]);

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-white font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            {/* Centered Auth Card */}
            <div className="relative w-full max-w-[1000px] min-h-[600px] bg-[#0D0D0D] rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row border border-[#212121]">
                {/* Left Side - Image (Hidden on Mobile) */}
                <div className="relative w-full md:w-1/2 h-[300px] md:h-auto overflow-hidden group">
                    <Image
                        src={isLogin ? "/auth-login.jpeg" : "/auth-signup.jpg"}
                        alt="Auth Background"
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority
                    />
                    {/* Image Overlay with Logo */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 flex flex-col items-center justify-center p-8">
                        <div className="absolute top-10 left-10">
                            <div className="relative w-[120px] h-[40px]">
                                <Image
                                    src="/logo.png"
                                    alt="ELEFIT"
                                    fill
                                    className="object-contain brightness-0 invert"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full md:w-1/2 bg-black/95 backdrop-blur-sm p-8 md:p-12 flex flex-col justify-center relative border-l border-white/5">
                    {/* Message from URL */}
                    {message && (
                        <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
                            {messageType === 'success' ? (
                                <Alert className="border-green-500/50 bg-green-500/10 text-green-400">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <AlertDescription>{message}</AlertDescription>
                                </Alert>
                            ) : (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{message}</AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}

                    {/* Auth Forms */}
                    <div className="w-full animate-in fade-in slide-in-from-right-4 duration-500">
                        {isLogin ? (
                            <Login onSwitchToSignup={() => setIsLogin(false)} />
                        ) : (
                            <Signup onSwitchToLogin={() => setIsLogin(true)} />
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center text-[10px] text-[#666] space-y-1">
                        <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
                        <p>© 2026 ELEFIT. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        }>
            <AuthContent />
        </Suspense>
    );
}
