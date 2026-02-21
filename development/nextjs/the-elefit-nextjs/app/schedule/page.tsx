"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ChevronDown, Download, ThumbsUp, ThumbsDown, ArrowLeft } from 'lucide-react';
import BottomNavNew from '@/components/BottomNavNew';
import { Header } from '@/components/Header';
import MobileNavDrawer from '@/components/MobileNavDrawer';
import { useAiCoach } from '@/contexts/AiCoachContext';
import { parseMealPlan, parseWorkoutPlan, WeeklyMeals, WeeklyWorkouts } from '@/lib/ai-coach-parser';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MEAL_TIMES = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];

const MEAL_ICONS: Record<string, string> = {
    Breakfast: '🌅',
    Lunch: '🍽️',
    Snacks: '🥜',
    Dinner: '🌙',
};

const SUGGESTED_PRODUCTS = [
    { name: 'Gym Floor Kettlebells', price: '₹ 2,499.00', image: '🏋️' },
    { name: 'Resistance Bands', price: '₹ 2,499.00', image: '💪' },
    { name: 'Yoga Mat & Strap', price: '₹ 999.00', image: '🧘' },
    { name: 'Dumbbell Set', price: '₹ 5,999.00', image: '⏱️' },
    { name: 'Yoga Straps', price: '₹ 1,099.00', image: '🎯' },
];

import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function Schedule() {
    return (
        <ProtectedRoute>
            <ScheduleContent />
        </ProtectedRoute>
    );
}

function ScheduleContent() {
    const router = useRouter();
    const { data } = useAiCoach();
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<'meals' | 'workout' | 'suggestions'>('meals');
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        Breakfast: true,
        Lunch: true,
        Snacks: true,
        Dinner: true,
        MON: true,
    });

    // Parse plans
    const parsedMeals = useMemo(() => {
        const raw = data.mealPlan || localStorage.getItem('generated_meal_plan_raw');
        return raw ? parseMealPlan(raw) : null;
    }, [data.mealPlan]);

    const parsedWorkouts = useMemo(() => {
        const raw = data.workoutPlan || localStorage.getItem('generated_workout_plan_raw');
        return raw ? parseWorkoutPlan(raw) : null;
    }, [data.workoutPlan]);

    // Calculate dates
    const scheduleDates = useMemo(() => {
        const genDateStr = localStorage.getItem('plan_generation_date');
        const startDate = genDateStr ? new Date(genDateStr) : new Date();

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            return {
                dayName: DAYS[i],
                dateNum: date.getDate().toString().padStart(2, '0'),
                fullDate: date
            };
        });
    }, []);

    const toggleSection = (id: string) => {
        setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handlePrevDay = () => setSelectedDayIndex((prev) => Math.max(0, prev - 1));
    const handleNextDay = () => setSelectedDayIndex((prev) => Math.min(6, prev + 1));

    const CollapsibleSection = ({
        id,
        title,
        icon,
        rightLabel,
        children
    }: {
        id: string;
        title: string;
        icon?: string | React.ReactNode;
        rightLabel?: string;
        children: React.ReactNode;
    }) => {
        const isExpanded = expandedSections[id];
        return (
            <div className={`rounded-2xl border border-[#212121] bg-[#0c0c0c] overflow-hidden transition-all h-fit ${isExpanded ? 'pb-4' : 'pb-0'}`}>
                <button
                    onClick={() => toggleSection(id)}
                    className="flex w-full items-center justify-between p-4 md:p-5 hover:bg-[#1a1a1a] transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <ChevronDown className={`h-4 w-4 text-[#898989] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        <span className="font-bold text-white text-sm md:text-base">{title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {rightLabel && <span className="text-xs text-[#898989] font-medium">{rightLabel}</span>}
                        {icon && (
                            <div className="flex items-center gap-2">
                                {typeof icon === 'string' ? <span className="text-lg md:text-xl">{icon}</span> : icon}
                            </div>
                        )}
                    </div>
                </button>
                <div className={`px-4 md:px-5 space-y-3 overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="pt-2 border-t border-[#212121]">
                        {children}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="relative min-h-screen w-full bg-black text-white selection:bg-primary selection:text-black">
            {/* Subtle Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-[#0D0D0D] pointer-events-none" />

            {/* Desktop Header */}
            <div className="hidden md:block">
                <Header />
            </div>

            {/* Mobile Header with Hamburger */}
            <MobileNavDrawer title="Weekly Schedule" />

            {/* Content Container */}
            <div className="relative z-10 px-4 md:px-8 py-6 md:py-8 pb-40 md:pb-32">
                <div className="mx-auto max-w-7xl space-y-8 md:space-y-10">

                    {/* Date Selector */}
                    <div className="flex items-center justify-between gap-4 py-2">
                        <button
                            onClick={handlePrevDay}
                            disabled={selectedDayIndex === 0}
                            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all flex-shrink-0 ${selectedDayIndex === 0 ? 'text-white/10' : 'text-[#454545] hover:text-white'}`}
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>

                        <div className="flex-1 flex items-center justify-between max-w-xl">
                            {scheduleDates.map((dateObj, idx) => {
                                const isActive = idx === selectedDayIndex;
                                return (
                                    <button
                                        key={dateObj.dayName}
                                        onClick={() => setSelectedDayIndex(idx)}
                                        className="flex flex-col items-center gap-1 flex-shrink-0"
                                    >
                                        {/* Yellow Dot Above */}
                                        <div className={`h-1 w-1 rounded-full bg-primary transition-opacity duration-300 ${isActive ? 'opacity-100 shadow-[0_0_8px_rgba(204,216,83,1)]' : 'opacity-0'}`} />

                                        <p className={`text-base md:text-lg font-bold transition-colors duration-300 ${isActive ? 'text-white' : 'text-[#454545]'}`}>
                                            {dateObj.dateNum}
                                        </p>

                                        <div className="flex flex-col items-center gap-1">
                                            <p className={`text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${isActive ? 'text-white' : 'text-[#454545]'}`}>
                                                {dateObj.dayName}
                                            </p>
                                            {/* Yellow Underline Below */}
                                            <div className={`h-[2px] w-full bg-primary rounded-full transition-all duration-300 ${isActive ? 'opacity-100 w-full shadow-[0_0_4px_rgba(204,216,83,1)]' : 'opacity-0 w-0'}`} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={handleNextDay}
                            disabled={selectedDayIndex === 6}
                            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all flex-shrink-0 ${selectedDayIndex === 6 ? 'text-white/10' : 'text-[#454545] hover:text-white'}`}
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Plan Info */}
                    <div className="rounded-2xl bg-[#0c0c0c] border border-[#212121] px-5 py-4 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <h2 className="font-bold text-white text-sm md:text-lg tracking-tight">
                                {data.prompt?.toUpperCase()} AI Coach Plan
                            </h2>
                            <div className="mt-1.5 flex items-center gap-4">
                                <span className="flex items-center gap-1.5 text-[10px] md:text-xs text-[#898989] font-medium">
                                    <span className="text-xs">📅</span> 7 Days
                                </span>
                                <span className="flex items-center gap-1.5 text-[10px] md:text-xs text-primary font-bold">
                                    <span className="text-xs">🔥</span> {data.calculatedData?.targetCalories || 0} kcal
                                </span>
                            </div>
                        </div>
                        <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 text-primary transition-all hover:bg-primary/10 flex-shrink-0">
                            <Download className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="space-y-6">
                        <div className="flex border-b border-[#212121]">
                            {(['meals', 'workout', 'suggestions'] as const).map((tab) => {
                                const isActive = activeTab === tab;
                                const icons = {
                                    meals: <span className={`text-base ${isActive ? '' : 'grayscale opacity-50'}`}>🍴</span>,
                                    workout: <span className={`text-base ${isActive ? '' : 'grayscale opacity-50'}`}>🏋️</span>,
                                    suggestions: <span className={`text-base ${isActive ? '' : 'grayscale opacity-50'}`}>💡</span>
                                };
                                const labels = {
                                    meals: 'Meal Plans',
                                    workout: 'Workout',
                                    suggestions: 'Plan Suggestions'
                                };
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className="flex-1 relative pb-3 transition-all flex flex-col items-center gap-1"
                                    >
                                        <div className="flex items-center gap-2">
                                            {icons[tab]}
                                            <span className={`text-[11px] md:text-sm font-bold tracking-tight transition-colors ${isActive ? 'text-white' : 'text-[#898989]'}`}>
                                                {labels[tab]}
                                            </span>
                                        </div>
                                        {isActive && (
                                            <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-primary rounded-full shadow-[0_0_8px_rgba(204,216,83,0.5)]" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Content Tabs */}
                    {activeTab === 'meals' ? (
                        <>
                            {/* Goal */}
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-widest text-[#454545]">Goal</span>
                                <span className="h-px w-8 bg-[#212121]" />
                                <span className="text-lg md:text-xl font-black text-primary">🔥 {data.calculatedData?.targetCalories || 0} kcal</span>
                            </div>

                            {/* Meals Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 items-start">
                                {MEAL_TIMES.map((mealTime) => {
                                    const mealsForDay = parsedMeals ? parsedMeals[DAYS[selectedDayIndex]]?.[mealTime] || [] : [];
                                    return (
                                        <CollapsibleSection
                                            key={mealTime}
                                            id={mealTime}
                                            title={mealTime}
                                            icon={MEAL_ICONS[mealTime]}
                                        >
                                            <div className="space-y-4">
                                                {mealsForDay.length > 0 ? (
                                                    mealsForDay.map((item: any, idx: number) => (
                                                        <div key={idx} className="space-y-3 pb-4 border-b border-[#212121] last:border-0 last:pb-0 group">
                                                            <div>
                                                                <p className="font-bold text-white text-xs md:text-sm group-hover:text-primary transition-colors">{item.name}</p>
                                                                <p className="text-[10px] md:text-xs font-bold text-primary mt-0.5">{item.quantity}</p>
                                                            </div>
                                                            <div className="bg-[#111] rounded-xl p-2 md:p-3 border border-[#212121]">
                                                                <p className="text-[10px] md:text-xs text-[#898989] leading-relaxed">
                                                                    {item.calories} kcal • {item.macro}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-[10px] text-[#454545] py-4 text-center">No meals planned for this time.</p>
                                                )}
                                            </div>
                                        </CollapsibleSection>
                                    );
                                })}
                            </div>
                        </>
                    ) : activeTab === 'workout' ? (
                        <>
                            {/* Goal */}
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-widest text-[#454545]">Focus</span>
                                <span className="h-px w-8 bg-[#212121]" />
                                <span className="text-lg md:text-xl font-black text-primary uppercase tracking-tighter">
                                    {data.calculatedData?.workoutFocus || 'GENERAL'}
                                </span>
                            </div>

                            {/* Workout Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 items-start">
                                {(() => {
                                    const workout = parsedWorkouts ? parsedWorkouts[DAYS[selectedDayIndex]] : null;
                                    if (!workout) return <div className="col-span-full py-12 text-center text-white/20">No workout data available</div>;

                                    return (
                                        <CollapsibleSection
                                            key={DAYS[selectedDayIndex]}
                                            id={DAYS[selectedDayIndex]}
                                            title={workout.isRestDay ? 'Rest Day' : 'Main Workout'}
                                            rightLabel={workout.duration}
                                        >
                                            <div className="space-y-4 pt-2">
                                                <div className="group">
                                                    <p className="font-bold text-white text-sm group-hover:text-primary transition-colors">{workout.name}</p>
                                                    <p className="text-xs font-bold text-[#898989] mt-1 flex items-center gap-1.5">
                                                        <span className="text-sm">⏱️</span> {workout.duration}
                                                    </p>
                                                </div>
                                                <div className="bg-[#111] rounded-2xl p-3 border border-[#212121] space-y-2">
                                                    {workout.exercises.map((exercise: string, i: number) => (
                                                        <div key={i} className="flex items-center gap-2.5">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_4px_rgba(204,216,83,0.5)]" />
                                                            <span className="text-xs text-[#898989] font-medium">{exercise}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </CollapsibleSection>
                                    );
                                })()}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-8">
                            {/* Personalized Suggestions Card */}
                            <div className="rounded-2xl border border-[#212121] bg-[#0c0c0c] overflow-hidden">
                                <div className="flex items-center justify-between p-4 border-b border-[#212121]">
                                    <div className="flex items-center gap-3">
                                        <ChevronDown className="h-4 w-4 text-[#898989]" />
                                        <span className="font-bold text-white text-sm">Personalized Suggestions</span>
                                    </div>
                                </div>
                                <div className="p-5 space-y-5">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-primary">Meal Plan Focus</p>
                                            <p className="text-xs text-[#898989]">Consistency is the key to achieving your <span className="text-white font-bold">"{data.targetWeight}kg"</span> goal.</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button className="p-2 rounded-lg bg-[#1a1a1a] text-[#898989] hover:text-white transition-colors">
                                                <ThumbsDown className="h-4 w-4" />
                                            </button>
                                            <button className="p-2 rounded-lg bg-[#1a1a1a] text-[#898989] hover:text-white transition-colors">
                                                <ThumbsUp className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Suggested Products Section */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-white text-sm">Suggested products</h3>
                                    <button className="text-[11px] font-bold text-primary hover:underline transition-all">View all</button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                    {SUGGESTED_PRODUCTS.map((product, idx) => (
                                        <div
                                            key={idx}
                                            className="group rounded-2xl bg-[#0c0c0c] border border-[#212121] p-4 text-center space-y-3 hover:border-primary transition-all cursor-pointer h-fit"
                                        >
                                            <div className="text-4xl py-2">{product.image}</div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-white font-bold line-clamp-1">{product.name}</p>
                                                <p className="text-[10px] text-primary font-black">Rs. {idx === 0 ? '4,000.00' : idx === 1 ? '2,500.00' : '400.00'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Footer Bar */}
            <div className="fixed bottom-[75px] left-0 right-0 z-40 bg-[#1e1e1a] border-t border-[#2d2d2d] px-6 py-4 flex items-center justify-between shadow-[0_-8px_20px_rgba(0,0,0,0.5)]">
                <span className="text-[11px] font-medium text-[#898989]">You can save / edit this plan</span>
                <div className="flex items-center gap-4">
                    <button className="text-[11px] font-bold text-primary hover:underline">Edit</button>
                    <button className="text-[11px] font-bold text-primary hover:underline">Save</button>
                </div>
            </div>

            {/* Bottom Nav */}
            <BottomNavNew />
        </div>
    );
}
