"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
import BottomNavNew from '@/components/BottomNavNew';
import MobileNavDrawer from '@/components/MobileNavDrawer';

export default function Welcome() {
    const router = useRouter();
    const [activeDrawer, setActiveDrawer] = useState<'continue' | 'new' | null>(null);

    const closeDrawer = () => setActiveDrawer(null);

    return (
        <div className="relative min-h-screen w-full bg-black overflow-hidden flex flex-col font-sans">
            {/* Background Image with Dark Gradient Overlay */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: 'url(/sign-up-bg.jpg)',
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90" />
            </div>

            {/* Mobile Top Nav (logo + hamburger) */}
            <MobileNavDrawer />

            {/* Main Content */}
            <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-32 md:pt-20 pb-32">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="space-y-2 mb-10 md:text-center">
                        <h1 className="text-[28px] leading-tight font-black text-white tracking-tight flex items-center justify-center md:justify-center gap-2">
                            Welcome Back! <span className="text-2xl animate-bounce">👋</span>
                        </h1>
                        <p className="text-sm font-medium text-white/50">Ready to continue your fitness journey?</p>
                    </div>

                    {/* Action Cards */}
                    <div className="space-y-4">
                        {/* My Fitness Plan Card */}
                        <button
                            onClick={() => setActiveDrawer('continue')}
                            className="w-full text-left group relative overflow-hidden rounded-[24px] border border-[#2d2d2d] bg-black/40 backdrop-blur-xl p-6 transition-all active:scale-[0.98]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative flex items-center gap-5">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                                    <span className="text-2xl">🏋🏻</span>
                                </div>
                                <div className="flex-1 space-y-0.5">
                                    <h3 className="text-sm font-black text-white tracking-wide">My fitness plan</h3>
                                    <p className="text-[11px] font-bold text-white/40">View your personalized schedule</p>
                                </div>
                                <div className="h-6 w-6 flex items-center justify-center text-white/30 group-hover:text-white transition-colors">
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </button>

                        {/* Start New Plan Card */}
                        <button
                            onClick={() => router.push('/ai-coach/goal')}
                            className="w-full text-left group relative overflow-hidden rounded-[24px] border border-[#2d2d2d] bg-black/40 backdrop-blur-xl p-6 transition-all active:scale-[0.98]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-lime-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative flex items-center gap-5">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                                    <span className="text-2xl">✨</span>
                                </div>
                                <div className="flex-1 space-y-0.5">
                                    <h3 className="text-sm font-black text-white tracking-wide">Start a new plan</h3>
                                    <p className="text-[11px] font-bold text-white/40">Create a fresh fitness goal</p>
                                </div>
                                <div className="h-6 w-6 flex items-center justify-center text-white/30 group-hover:text-white transition-colors">
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Drawers */}
            <div className={`fixed inset-0 z-50 flex items-end md:items-center justify-center transition-opacity duration-300 ${activeDrawer ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {/* Backdrop overlay within centered container */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeDrawer} />

                <div className={`relative w-full md:max-w-md bg-[#111] rounded-t-[40px] md:rounded-[40px] border-t md:border border-white/10 px-6 pt-2 pb-32 md:pb-12 h-[50vh] md:h-auto transition-transform duration-500 ease-out ${activeDrawer ? 'translate-y-0' : 'translate-y-full'}`}>
                    {/* Drag Handle Area */}
                    <div className="w-full pt-2 pb-6 flex justify-center">
                        <div className="w-12 h-1 bg-white/20 rounded-full" />
                    </div>

                    {/* Drawer Content */}
                    <div className="pb-12">
                        {activeDrawer === 'continue' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-3">
                                    <h2 className="text-[22px] font-black text-white tracking-tight">Continue your journey?</h2>
                                    <p className="text-sm font-medium text-white/40 leading-relaxed">
                                        Would you like to view your current plan or change your fitness goal?
                                    </p>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <button
                                        onClick={() => router.push('/schedule')}
                                        className="w-full py-4 bg-primary text-black font-black text-sm rounded-full shadow-[0_4px_15_rgba(204,216,83,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        Continue with current plan
                                    </button>
                                    <button className="w-full py-2 text-primary font-bold text-sm hover:underline">
                                        Change fitness goal
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <BottomNavNew />
        </div>
    );
}
