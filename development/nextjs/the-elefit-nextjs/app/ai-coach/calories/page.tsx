"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import BottomNavNew from '@/components/BottomNavNew';
import { useAiCoach } from '@/contexts/AiCoachContext';

export default function Calories() {
    const router = useRouter();
    const { data, updateData } = useAiCoach();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [calorieData, setCalorieData] = useState({
        dailyCalories: 0,
        proteinGrams: 0,
        carbsGrams: 0,
        fatGrams: 0,
    });

    useEffect(() => {
        const t = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(t);
    }, []);

    useEffect(() => {
        // Only fetch if we have the minimum required data
        if (!data.age || !data.currentWeight || !data.height || !data.gender || !data.activityLevel || !data.prompt) {
            console.log("Waiting for context data...", {
                age: data.age,
                weight: data.currentWeight,
                height: data.height,
                gender: data.gender,
                activity: data.activityLevel,
                prompt: !!data.prompt
            });
            return;
        }

        const fetchInitialTargets = async () => {
            try {
                setLoading(true);
                setError(null);

                // Prepare timeline weeks
                let timelineWeeks = parseInt(data.timelineValue) || 12;
                if (data.timelineUnit === 'months') {
                    timelineWeeks *= 4;
                }

                console.log("Fetching targets with data:", data);

                const response = await fetch('http://localhost:8000/user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userDetails: {
                            age: data.age,
                            weight: data.currentWeight,
                            height: data.height,
                            gender: data.gender,
                            activityLevel: data.activityLevel,
                            healthGoals: data.prompt,
                            targetWeight: data.targetWeight || data.currentWeight,
                            timelineWeeks: timelineWeeks
                        },
                        prompt: data.prompt
                    }),
                });

                if (!response.ok) {
                    const errorJson = await response.json().catch(() => ({}));
                    const errorText = errorJson.detail || await response.text() || 'Failed to fetch profile targets';
                    throw new Error(errorText);
                }

                const result = await response.json();
                console.log("Fetch targets result:", result);

                // Update component state
                setCalorieData({
                    dailyCalories: result.targetCalories,
                    proteinGrams: result.macros.protein_g,
                    carbsGrams: result.macros.carbs_g,
                    fatGrams: result.macros.fat_g
                });

                // Save results in context for the next steps
                updateData({
                    calculatedData: {
                        tdee: result.tdee,
                        targetCalories: result.targetCalories,
                        proteinGrams: result.macros.protein_g,
                        carbsGrams: result.macros.carbs_g,
                        fatGrams: result.macros.fat_g,
                        workoutFocus: result.WorkoutFocus,
                        capped: result.capped
                    }
                });

                setLoading(false);
            } catch (err) {
                console.error("Error fetching targets:", err);
                setError(err instanceof Error ? err.message : "Calculation failed");
                setLoading(false);
            }
        };

        fetchInitialTargets();
    }, [data.age, data.currentWeight, data.height, data.gender, data.activityLevel, data.prompt, data.timelineValue, data.timelineUnit]);

    const handleContinue = async () => {
        try {
            setLoading(true);
            setError(null);
            updateData({ mealPlan: null, workoutPlan: null });

            // 1. Generate Meal Plan
            const mealResponse = await fetch('http://localhost:8000/mealplan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetCalories: data.calculatedData?.targetCalories,
                    dietaryRestrictions: data.dietaryTags,
                    healthGoals: data.prompt,
                    prompt: data.prompt,
                    targetWeight: data.targetWeight,
                    timelineWeeks: data.timelineUnit === 'months' ? parseInt(data.timelineValue) * 4 : parseInt(data.timelineValue),
                    weight: data.currentWeight,
                    capped: data.calculatedData?.capped
                }),
            });

            if (!mealResponse.ok) throw new Error('Meal plan generation failed');

            // Read meal stream
            const mealReader = mealResponse.body?.getReader();
            let mealText = '';
            if (mealReader) {
                while (true) {
                    const { done, value } = await mealReader.read();
                    if (done) break;
                    mealText += new TextDecoder().decode(value);
                }
            }

            // 2. Generate Workout Plan
            const workoutResponse = await fetch('http://localhost:8000/workoutplan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    goal: data.prompt,
                    workoutFocus: data.calculatedData?.workoutFocus,
                    days: data.workoutDays,
                    targetWeight: data.targetWeight,
                    timelineWeeks: data.timelineUnit === 'months' ? parseInt(data.timelineValue) * 4 : parseInt(data.timelineValue),
                    prompt: data.prompt
                }),
            });

            if (!workoutResponse.ok) throw new Error('Workout plan generation failed');

            // Read workout stream
            const workoutReader = workoutResponse.body?.getReader();
            let workoutText = '';
            if (workoutReader) {
                while (true) {
                    const { done, value } = await workoutReader.read();
                    if (done) break;
                    workoutText += new TextDecoder().decode(value);
                }
            }

            // 3. Store results and redirect
            localStorage.setItem('generated_meal_plan_raw', mealText);
            localStorage.setItem('generated_workout_plan_raw', workoutText);
            localStorage.setItem('plan_generation_date', new Date().toISOString());

            updateData({
                mealPlan: mealText,
                workoutPlan: workoutText
            });

            router.push('/schedule');
        } catch (err) {
            console.error("Plan generation error:", err);
            setError(err instanceof Error ? err.message : "Generation failed");
            setLoading(false);
        }
    };

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
                            <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">Step 4 of 4</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-full rounded-full shadow-[0_0_8px_rgba(204,216,83,0.5)]" />
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="mt-8 space-y-8">
                        <div className="space-y-2">
                            <h1 className="text-[20px] font-black text-white tracking-tight leading-tight">
                                Your personalized daily calorie target is
                            </h1>
                            <p className="text-[13px] font-medium text-white/40 leading-relaxed">
                                Based on your profile and goals
                            </p>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                                <p className="text-xs text-red-500 font-bold uppercase tracking-widest mb-1">Error</p>
                                <p className="text-[13px] text-white/60 leading-relaxed">{error}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-3 text-[11px] font-black text-primary uppercase tracking-widest hover:underline"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}

                        {loading ? (
                            <div className="space-y-6">
                                <div className="h-32 rounded-3xl bg-white/5 animate-pulse flex flex-col items-center justify-center p-6 text-center">
                                    <p className="text-primary font-black text-sm uppercase tracking-widest animate-pulse">
                                        {data.mealPlan ? 'Finalizing...' : (calorieData.dailyCalories > 0 ? 'Generating Your Plan...' : 'Calculating Macros...')}
                                    </p>
                                    <p className="text-white/40 text-[11px] mt-2">
                                        {data.mealPlan ? 'Creating your workout schedule' : 'AI is crafting your personalized meal plan'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Large Calorie Display */}
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-primary/5 rounded-[32px] blur-2xl group-hover:bg-primary/10 transition-all" />
                                    <div className="relative bg-black/40 border border-[#2d2d2d] rounded-[32px] p-8 flex flex-col items-center justify-center text-center">
                                        <span className="text-[56px] font-black text-primary tracking-tighter leading-none">
                                            {calorieData.dailyCalories}
                                        </span>
                                        <span className="text-[13px] font-black text-white/40 uppercase tracking-[0.2em] mt-2">
                                            kcal / day
                                        </span>
                                    </div>
                                </div>

                                {/* Macros Grid */}
                                <div className="grid grid-cols-3 gap-3">
                                    {/* Protein */}
                                    <div className="bg-black/40 border border-[#2d2d2d] rounded-2xl p-4 flex flex-col items-center gap-1">
                                        <span className="text-[18px] font-black text-white">{calorieData.proteinGrams}g</span>
                                        <span className="text-[10px] font-black text-[#FF6B6B] uppercase tracking-wider">Protein</span>
                                    </div>
                                    {/* Carbs */}
                                    <div className="bg-black/40 border border-[#2d2d2d] rounded-2xl p-4 flex flex-col items-center gap-1">
                                        <span className="text-[18px] font-black text-white">{calorieData.carbsGrams}g</span>
                                        <span className="text-[10px] font-black text-[#4ECDC4] uppercase tracking-wider">Carbs</span>
                                    </div>
                                    {/* Fat */}
                                    <div className="bg-black/40 border border-[#2d2d2d] rounded-2xl p-4 flex flex-col items-center gap-1">
                                        <span className="text-[18px] font-black text-white">{calorieData.fatGrams}g</span>
                                        <span className="text-[10px] font-black text-[#FFD93D] uppercase tracking-wider">Fat</span>
                                    </div>
                                </div>

                                {/* Info Note */}
                                <div className="flex gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                    <span className="text-lg">💡</span>
                                    <p className="text-[11px] font-medium text-white/60 leading-normal">
                                        This plan is designed to help you lose ~0.5kg per week. Adjust as needed based on your progress.
                                    </p>
                                </div>

                                <button
                                    onClick={handleContinue}
                                    className="w-full py-4 bg-primary text-black font-black text-sm rounded-full shadow-[0_4px_15px_rgba(204,216,83,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    Generate my plan
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <BottomNavNew />
        </div>
    );
}
