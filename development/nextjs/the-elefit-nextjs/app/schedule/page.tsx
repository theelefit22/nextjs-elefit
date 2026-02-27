"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ChevronDown, Download, ThumbsUp, ThumbsDown, ArrowLeft } from 'lucide-react';
import BottomNavNew from '@/components/BottomNavNew';
import { Header } from '@/components/Header';
import MobileNavDrawer from '@/components/MobileNavDrawer';
import { useAiCoach } from '@/contexts/AiCoachContext';
import { parseMealPlan, parseWorkoutPlan, WeeklyMeals, WeeklyWorkouts } from '@/lib/ai-coach-parser';
import { saveUserPlan, getPlanById, getCurrentUser } from '@/shared/firebase';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
    const searchParams = useSearchParams();
    const planId = searchParams.get('planId');
    const [savedPlanData, setSavedPlanData] = useState<any>(null);
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<'meals' | 'workout' | 'suggestions'>('meals');
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        Breakfast: true,
        Lunch: true,
        Snacks: true,
        Dinner: true,
        MON: true,
    });
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [planName, setPlanName] = useState('My Custom Plan');
    const [isSaving, setIsSaving] = useState(false);
    const [isPlanSaved, setIsPlanSaved] = useState(false);

    // Fetch plan if planId is present
    useEffect(() => {
        if (planId) {
            const fetchPlan = async () => {
                const user = getCurrentUser();
                if (user) {
                    const fetchedPlan = await getPlanById(user.uid, planId);
                    if (fetchedPlan) {
                        setSavedPlanData(fetchedPlan);
                    }
                }
            };
            fetchPlan();
        }
    }, [planId]);

    // Parse plans
    const parsedMeals = useMemo<WeeklyMeals | null>(() => {
        const raw = savedPlanData?.mealPlan || data.mealPlan || localStorage.getItem('generated_meal_plan_raw');
        return raw ? parseMealPlan(raw) : null;
    }, [data.mealPlan, savedPlanData]);

    const parsedWorkouts = useMemo<WeeklyWorkouts | null>(() => {
        const raw = savedPlanData?.workoutPlan || data.workoutPlan || localStorage.getItem('generated_workout_plan_raw');
        return raw ? parseWorkoutPlan(raw) : null;
    }, [data.workoutPlan, savedPlanData]);

    // Plan header data (either from saved plan or current context)
    const headerData = {
        prompt: savedPlanData?.name || data.prompt || "AI Coach",
        calories: savedPlanData?.calculatedData?.targetCalories || data.calculatedData?.targetCalories || 0,
        workoutFocus: savedPlanData?.calculatedData?.workoutFocus || data.calculatedData?.workoutFocus || 'GENERAL',
        genDate: savedPlanData?.planGenerationDate || localStorage.getItem('plan_generation_date')
    };

    // Calculate dates
    const scheduleDates = useMemo(() => {
        const genDateStr = headerData.genDate;
        const startDate = genDateStr ? new Date(genDateStr) : new Date();
        const shortDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            return {
                dayName: shortDays[date.getDay()],
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
        const iconLabel = id === 'Breakfast' ? '☀️' : id === 'Lunch' ? '🍽️' : id === 'Snacks' ? '🍯' : id === 'Dinner' ? '🌙' : icon;

        return (
            <div className={`rounded-2xl border border-[#212121] bg-[#0c0c0c] overflow-hidden transition-all h-fit ${isExpanded ? 'pb-4' : 'pb-0 shadow-[0_8px_20px_rgba(0,0,0,0.3)]'}`}>
                <button
                    onClick={() => toggleSection(id)}
                    className="flex w-full items-center justify-between p-4 md:p-5 hover:bg-[#1a1a1a] transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <ChevronDown className={`h-4 w-4 text-[#898989] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        <span className="font-bold text-[#898989] text-[11px] md:text-xs uppercase tracking-[0.1em]">{title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {rightLabel && <span className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-widest">{rightLabel}</span>}
                        <div className="flex items-center gap-2">
                            <span className="text-base md:text-lg grayscale-0">{iconLabel}</span>
                        </div>
                    </div>
                </button>
                <div className={`px-4 md:px-5 space-y-3 overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="pt-2">
                        {children}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="relative min-h-screen w-full bg-[#0c0c0c] text-white selection:bg-primary selection:text-black">
            {/* Desktop Header */}
            <div className="hidden md:block">
                <Header />
            </div>

            {/* Mobile Header with Hamburger */}
            <MobileNavDrawer title="Weekly Schedule" />

            {/* Content Container */}
            <div className="relative z-10 px-4 md:px-8 py-6 md:py-8 pb-40 md:pb-32">
                <div className="mx-auto max-w-7xl">

                    {/* Page Header */}
                    <div className="relative flex items-center justify-center md:mb-12 mb-8">
                        {/* Back Arrow - Responsive Position */}
                        <button
                            onClick={() => router.back()}
                            className="absolute md:left-0 left-0 h-10 w-10 flex items-center justify-center rounded-full md:bg-primary bg-transparent md:text-black text-white hover:bg-primary/90 transition-all md:shadow-[0_0_15px_rgba(204,216,83,0.3)]"
                        >
                            <ArrowLeft className="h-6 w-6" />
                        </button>

                        {/* Title - Responsive Alignment */}
                        <div className="flex items-center gap-3 md:justify-center w-full max-sm:pl-10">
                            <span className="text-2xl hidden md:inline">📅</span>
                            <h1 className="text-xl md:text-3xl font-bold tracking-tight text-white">Weekly Schedule</h1>
                        </div>
                    </div>
                    {/* Date Selector Navigation */}
                    <div className="flex items-center justify-between md:justify-center gap-4 md:gap-8 mb-12">
                        <button
                            onClick={handlePrevDay}
                            disabled={selectedDayIndex === 0}
                            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all flex-shrink-0 ${selectedDayIndex === 0 ? 'text-white/10' : 'text-[#898989] hover:text-white'}`}
                        >
                            <ChevronLeft className="h-8 w-8" />
                        </button>

                        <div className="flex items-center justify-between md:justify-center gap-4 md:gap-8 overflow-x-auto no-scrollbar pb-2 flex-grow max-w-xl">
                            {scheduleDates.map((dateObj, idx) => {
                                const isActive = idx === selectedDayIndex;
                                return (
                                    <button
                                        key={dateObj.dayName}
                                        onClick={() => setSelectedDayIndex(idx)}
                                        className="flex flex-col items-center gap-2 transition-opacity duration-300 flex-shrink-0"
                                    >
                                        {/* Yellow Dot Above */}
                                        <div className={`h-1.5 w-1.5 rounded-full bg-primary transition-all duration-300 ${isActive ? 'scale-100 opacity-100 shadow-[0_0_8px_rgba(204,216,83,1)]' : 'scale-0 opacity-0'}`} />

                                        <div className="flex flex-col items-center">
                                            <span className={`text-lg md:text-xl font-bold transition-colors ${isActive ? 'text-white' : 'text-[#454545]'}`}>
                                                {dateObj.dateNum}
                                            </span>
                                            <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${isActive ? 'text-white md:text-[#898989]' : 'text-[#454545]'}`}>
                                                {dateObj.dayName}
                                            </span>
                                        </div>

                                        {/* Yellow Underline Below */}
                                        <div className={`h-[2px] rounded-full bg-primary transition-all duration-300 ${isActive ? 'w-full opacity-100' : 'w-0 opacity-0'}`} />
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={handleNextDay}
                            disabled={selectedDayIndex === 6}
                            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all flex-shrink-0 ${selectedDayIndex === 6 ? 'text-white/10' : 'text-[#898989] hover:text-white'}`}
                        >
                            <ChevronRight className="h-8 w-8" />
                        </button>
                    </div>

                    {/* Main Plan Container "Plan Box" */}
                    <div className="rounded-[32px] bg-[#111111] border border-[#212121] overflow-hidden shadow-2xl">

                        {/* Plan Header section in plan box */}
                        <div className="bg-[#1a1c14] border-b border-[#212121] px-6 md:px-8 py-6 flex items-center justify-between gap-6">
                            <div className="space-y-2">
                                <h2 className="text-sm md:text-lg font-bold text-white tracking-tight">
                                    {headerData.prompt}
                                </h2>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 bg-[#0c0c0c] px-3 py-1 rounded-lg border border-[#212121]">
                                        <span className="text-sm">🗓️</span>
                                        <span className="text-[10px] md:text-xs text-[#898989] font-bold uppercase tracking-wider">Duration: <span className="text-primary">7 Days</span></span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-[#0c0c0c] px-3 py-1 rounded-lg border border-[#212121]">
                                        <span className="text-sm">🔥</span>
                                        <span className="text-[10px] md:text-xs text-primary font-black uppercase tracking-wider">{headerData.calories} kcal</span>
                                    </div>
                                </div>
                            </div>

                            <button className="flex items-center justify-center h-10 w-10 md:w-auto md:h-auto md:bg-transparent md:border md:border-primary/30 text-primary font-bold text-xs uppercase tracking-widest md:px-6 md:py-2.5 rounded-xl hover:bg-primary/5 transition-all group">
                                <Download className="h-5 w-5 md:h-4 md:w-4 group-hover:translate-y-0.5 transition-transform" />
                                <span className="hidden md:inline ml-2">Download</span>
                            </button>
                        </div>

                        {/* Centered Tabs inside container */}
                        <div className="bg-[#0c0c0c]/50 px-4 md:px-8 py-4 border-b border-[#212121]">
                            <div className="flex items-center justify-between md:justify-center gap-6 md:gap-12">
                                {(['meals', 'workout', 'suggestions'] as const).map((tab) => {
                                    const isActive = activeTab === tab;
                                    const labels = { meals: 'Meal Plans', workout: 'Workout', suggestions: 'Plan Suggestions' };
                                    const icons = { meals: '🍴', workout: '🏋️', suggestions: '💡' };

                                    return (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className="group relative py-2 flex flex-col md:flex-row items-center gap-1 md:gap-2"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`text-base transition-opacity ${isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`}>{icons[tab]}</span>
                                                <span className={`text-[10px] md:text-[11px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] transition-colors ${isActive ? 'text-primary' : 'text-[#898989] group-hover:text-white'}`}>
                                                    {labels[tab]}
                                                </span>
                                            </div>
                                            {isActive && (
                                                <div className="absolute -bottom-4 left-0 right-0 h-[3px] bg-primary rounded-full shadow-[0_0_8px_rgba(204,216,83,0.5)]" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Content Body */}
                        <div className="p-6 md:p-8 space-y-12">
                            {activeTab === 'meals' ? (
                                <>
                                    {/* Goal */}
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-xs font-bold uppercase tracking-widest text-[#454545]">Goal</span>
                                        <span className="h-px w-8 bg-[#212121]" />
                                        <span className="text-lg md:text-xl font-black text-primary">🔥 {headerData.calories} kcal</span>
                                    </div>

                                    {/* Meals Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 items-start">
                                        {MEAL_TIMES.map((mealTime) => {
                                            const mealsForDay = parsedMeals ? parsedMeals[selectedDayIndex]?.[mealTime] || [] : [];
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
                                                                    <div className="space-y-1">
                                                                        <p className="font-black text-white text-sm tracking-tight">{item.name}</p>
                                                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">{item.quantity}</p>
                                                                    </div>
                                                                    <div className="bg-[#1a1a1a] rounded-xl p-3 border border-[#212121]/50">
                                                                        <p className="text-[10px] font-bold text-[#898989] uppercase tracking-wider flex items-center gap-2">
                                                                            <span>🔥 {item.calories} KCAL</span>
                                                                            <span className="h-1 w-1 rounded-full bg-[#454545]" />
                                                                            <span>💪 {item.macro}</span>
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
                                            {headerData.workoutFocus}
                                        </span>
                                    </div>

                                    {/* Workout Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 items-start">
                                        {(() => {
                                            const workout = parsedWorkouts ? parsedWorkouts[selectedDayIndex] : null;
                                            if (!workout) return <div key="empty" className="col-span-full py-12 text-center text-white/20">No workout data available</div>;

                                            return (
                                                <CollapsibleSection
                                                    key={selectedDayIndex}
                                                    id={`workout-${selectedDayIndex}`}
                                                    title={workout.isRestDay ? 'Rest Day' : 'Workout Focus'}
                                                    rightLabel={workout.duration}
                                                    icon="🏋️"
                                                >
                                                    <div className="space-y-6 pt-2">
                                                        <div className="group space-y-2">
                                                            <p className="font-black text-white text-base tracking-tight leading-tight group-hover:text-primary transition-colors">{workout.name}</p>
                                                            <div className="flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-[#212121]/50 w-fit">
                                                                <span className="text-sm">⏱️</span>
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-[#898989]">{workout.duration}</p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {workout.exercises.map((exercise: string, i: number) => (
                                                                <div key={i} className="flex items-center gap-3 group/ex">
                                                                    <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(204,216,83,0.5)] transition-transform group-hover/ex:scale-125" />
                                                                    <span className="text-xs text-[#898989] font-bold group-hover/ex:text-white transition-colors">{exercise}</span>
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
                </div>

                {/* Action Footer Bar */}
                {
                    !planId && !isPlanSaved && (
                        <div className="fixed bottom-[75px] left-0 right-0 z-40 bg-[#1e1e1a] border-t border-[#2d2d2d] px-6 py-4 flex items-center justify-between shadow-[0_-8px_20px_rgba(0,0,0,0.5)]">
                            <span className="text-[11px] font-medium text-[#898989]">You can save / edit this plan</span>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => router.push('/ai-coach/goal')}
                                    className="text-[11px] font-bold text-primary hover:underline"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => setIsSaveModalOpen(true)}
                                    className="text-[11px] font-bold text-primary hover:underline"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    )
                }

                {/* Save Modal */}
                {
                    isSaveModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                            <div className="w-full max-w-sm rounded-[32px] border border-[#212121] bg-[#0c0c0c] p-8 shadow-2xl">
                                <h3 className="text-lg font-bold text-white mb-2 text-center">Save with name</h3>
                                <p className="text-xs text-[#898989] mb-6 text-center">Pick a name to find this later in your profile</p>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#454545] ml-1">Plan Name</label>
                                        <Input
                                            value={planName}
                                            onChange={(e) => setPlanName(e.target.value)}
                                            placeholder="e.g. 12 Week Shred"
                                            className="bg-[#111] border-[#212121] text-white h-12 rounded-2xl focus:ring-primary"
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsSaveModalOpen(false)}
                                            className="flex-1 bg-transparent border-[#212121] text-[#898989] hover:bg-white/5 h-12 rounded-2xl font-bold"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={async () => {
                                                const user = getCurrentUser();
                                                if (user) {
                                                    setIsSaving(true);
                                                    try {
                                                        const mealPlanRaw = data.mealPlan || localStorage.getItem('generated_meal_plan_raw');
                                                        const workoutPlanRaw = data.workoutPlan || localStorage.getItem('generated_workout_plan_raw');

                                                        await saveUserPlan(user.uid, planName, {
                                                            mealPlan: mealPlanRaw,
                                                            workoutPlan: workoutPlanRaw,
                                                            calculatedData: data.calculatedData,
                                                            planGenerationDate: localStorage.getItem('plan_generation_date')
                                                        });
                                                        setIsSaveModalOpen(false);
                                                        setIsPlanSaved(true);
                                                        // Success toast would go here
                                                        alert('Plan saved successfully!');
                                                    } catch (e) {
                                                        alert('Failed to save plan');
                                                    } finally {
                                                        setIsSaving(false);
                                                    }
                                                }
                                            }}
                                            disabled={isSaving}
                                            className="flex-1 bg-primary text-black hover:bg-primary/90 h-12 rounded-2xl font-bold"
                                        >
                                            {isSaving ? 'Saving...' : 'Save'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Bottom Nav */}
                <BottomNavNew />
            </div>
        </div>
    );
}
