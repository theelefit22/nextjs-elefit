"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import BottomNavNew from '@/components/BottomNavNew';
import { useAiCoach } from '@/contexts/AiCoachContext';

export default function Goal() {
    const { data, updateData } = useAiCoach();
    const [goal, setGoal] = useState(data.prompt);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const t = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(t);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (goal.trim()) {
            updateData({ prompt: goal.trim() });
            router.push('/ai-coach/details');
        }
    };

    return (
        <div className="relative h-screen w-full bg-black overflow-hidden flex flex-col font-sans">
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

            {/* Desktop Center / Mobile Drawer Container */}
            <div className="relative z-10 flex flex-1 items-end md:items-center justify-center">
                {/* Content Card / Drawer */}
                <div className={`w-full md:max-w-md bg-[#111] rounded-t-[40px] md:rounded-[40px] border-t md:border border-white/10 px-6 pt-2 pb-12 md:pb-20 h-auto overflow-y-auto custom-scrollbar transition-transform duration-500 ease-out ${mounted ? 'translate-y-0' : 'translate-y-full md:translate-y-4'}`}>
                    {/* Drag Handle (Mobile) */}
                    <div className="flex justify-center mb-6 md:hidden">
                        <div className="w-12 h-1 bg-white/20 rounded-full" />
                    </div>

                    {/* Step Navigation */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => router.back()}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">Step 1 of 4</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-1/4 rounded-full shadow-[0_0_8px_rgba(204,216,83,0.5)]" />
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="mt-10 space-y-6">
                        <div className="flex items-center gap-2">
                            <h1 className="text-[22px] font-black text-white tracking-tight">What's your fitness goal?</h1>
                            <span className="text-xl">🔥</span>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={goal}
                                    onChange={(e) => setGoal(e.target.value)}
                                    placeholder="Lose 6 kg in 3 months"
                                    className="w-full bg-black/40 border border-[#2d2d2d] rounded-2xl p-5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                                />
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-lg">🏋️</span>
                            </div>

                            <button
                                type="submit"
                                disabled={!goal.trim()}
                                className="w-full py-4 bg-primary text-black font-black text-sm rounded-full shadow-[0_4px_15_rgba(204,216,83,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                            >
                                Create my plan
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <BottomNavNew />
        </div>
    );
}
