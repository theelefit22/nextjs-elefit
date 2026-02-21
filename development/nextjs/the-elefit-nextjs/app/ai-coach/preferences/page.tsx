"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import BottomNavNew from '@/components/BottomNavNew';
import { useAiCoach, HelpType, ActivityLevel } from '@/contexts/AiCoachContext';

export default function Preferences() {
    const router = useRouter();
    const { data, updateData } = useAiCoach();
    const [mounted, setMounted] = useState(false);
    const [helpType, setHelpType] = useState<HelpType>(data.helpType);
    const [activityLevel, setActivityLevel] = useState<ActivityLevel>(data.activityLevel);
    const [workoutDays, setWorkoutDays] = useState(data.workoutDays);
    const [dietary, setDietary] = useState(data.dietaryText);
    const [dietaryTags, setDietaryTags] = useState<string[]>(data.dietaryTags);

    useEffect(() => {
        const t = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(t);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateData({
            helpType,
            activityLevel,
            workoutDays,
            dietaryText: dietary,
            dietaryTags
        });
        router.push('/ai-coach/calories');
    };

    const activityLevels = [
        { id: 'sedentary', label: 'Sedentary', icon: '🪑', desc: 'Little to no exercise' },
        { id: 'light', label: 'Light', icon: '🚶', desc: 'Exercise 1-2 days/week' },
        { id: 'moderate', label: 'Moderate', icon: '🏃', desc: 'Exercise 3-5 days/week' },
        { id: 'active', label: 'Active', icon: '💪', desc: 'Exercise 6-7 days/week' },
        { id: 'very-active', label: 'Very Active', icon: '🔥', desc: 'Intense daily exercise' },
    ];

    const dietTags = ['Veg / Non-veg', 'Vegan', 'No dairy', 'No eggs'];

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

            {/* Desktop Center / Mobile Drawer Container */}
            <div className="relative z-10 flex flex-1 items-end md:items-center justify-center">
                {/* Content Card / Drawer */}
                <div className={`w-full md:max-w-md bg-[#111] rounded-t-[40px] md:rounded-[40px] border-t md:border border-white/10 px-6 pt-2 pb-12 md:pb-20 h-auto overflow-y-auto custom-scrollbar transition-transform duration-500 ease-out ${mounted ? 'translate-y-0' : 'translate-y-full md:translate-y-4'}`}>
                    {/* Drag Handle (Mobile) */}
                    <div className="flex justify-center mb-6 md:hidden sticky top-0 bg-[#111] py-2 z-20">
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
                            <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">Step 3 of 4</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-3/4 rounded-full shadow-[0_0_8px_rgba(204,216,83,0.5)]" />
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="mt-8 space-y-8">
                        <form onSubmit={handleSubmit} className="space-y-10">
                            {/* Help Type */}
                            <div className="space-y-4">
                                <h1 className="text-[20px] font-black text-white tracking-tight leading-tight">What would you like help with?</h1>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'meal', icon: '🍽️', label: 'Meal' },
                                        { id: 'workout', icon: '🏋️', label: 'Workout' },
                                        { id: 'both', icon: '🔥', label: 'Both', badge: 'Best' },
                                    ].map((option) => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => setHelpType(option.id as HelpType)}
                                            className={`relative flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all ${helpType === option.id
                                                ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(204,216,83,0.1)]'
                                                : 'border-[#2d2d2d] bg-black/40 hover:border-[#444]'
                                                }`}
                                        >
                                            {option.badge && (
                                                <span className="absolute -top-1.5 -right-1 rounded-full bg-primary px-2 py-0.5 text-[8px] font-black text-black">
                                                    {option.badge}
                                                </span>
                                            )}
                                            <span className="text-xl">{option.icon}</span>
                                            <span className={`text-[11px] font-black uppercase tracking-tight ${helpType === option.id ? 'text-primary' : 'text-white/40'}`}>
                                                {option.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Activity Level */}
                            <div className="space-y-4">
                                <h2 className="text-[11px] font-black text-white/40 uppercase tracking-widest ml-1">Activity Level</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {activityLevels.map((level) => (
                                        <button
                                            key={level.id}
                                            type="button"
                                            onClick={() => setActivityLevel(level.id as ActivityLevel)}
                                            className={`flex flex-col items-center gap-1 rounded-2xl border p-4 transition-all min-h-[90px] justify-center ${activityLevel === level.id
                                                ? 'border-primary bg-primary/10'
                                                : 'border-[#2d2d2d] bg-black/40 hover:border-[#444]'
                                                }`}
                                        >
                                            <span className="text-xl">{level.icon}</span>
                                            <span className={`text-[11px] font-black uppercase ${activityLevel === level.id ? 'text-primary' : 'text-white'}`}>
                                                {level.label}
                                            </span>
                                            <span className="text-[10px] font-medium text-white/20 text-center leading-tight">
                                                {level.desc}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Workout Days */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <h2 className="text-[11px] font-black text-white/40 uppercase tracking-widest ml-1">Workout days per week</h2>
                                    <span className="text-[11px] font-black text-primary uppercase">{workoutDays} days</span>
                                </div>
                                <div className="space-y-2">
                                    <input
                                        type="range"
                                        min="1"
                                        max="7"
                                        value={workoutDays}
                                        onChange={(e) => setWorkoutDays(Number(e.target.value))}
                                        className="w-full accent-primary bg-white/5 h-1.5 rounded-full appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[10px] font-black text-white/20 uppercase tracking-widest px-1">
                                        <span>1 Day</span>
                                        <span>7 Day</span>
                                    </div>
                                    <p className="text-[11px] font-medium text-white/40 text-center italic">Balanced & sustainable</p>
                                </div>
                            </div>

                            {/* Dietary Preferences */}
                            <div className="space-y-4">
                                <h2 className="text-[11px] font-black text-white/40 uppercase tracking-widest ml-1">Dietary Preferences</h2>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={dietary}
                                        onChange={(e) => setDietary(e.target.value)}
                                        placeholder="Eg., Vegetarian, no dairy"
                                        className="w-full bg-black/40 border border-[#2d2d2d] rounded-2xl p-5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {dietTags.map((tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => {
                                                if (dietaryTags.includes(tag)) {
                                                    setDietaryTags(dietaryTags.filter(t => t !== tag));
                                                } else {
                                                    setDietaryTags([...dietaryTags, tag]);
                                                }
                                            }}
                                            className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-tight transition-all ${dietaryTags.includes(tag)
                                                ? 'bg-white text-black border-white'
                                                : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-primary text-black font-black text-sm rounded-full shadow-[0_4px_15px_rgba(204,216,83,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                Save profile & proceed
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <BottomNavNew />
        </div>
    );
}
