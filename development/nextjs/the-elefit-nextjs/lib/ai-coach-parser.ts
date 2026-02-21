/**
 * Parser for the AI Coach meal and workout plans.
 */

export interface MealItem {
    name: string;
    quantity: string;
    calories: number;
    macro: string;
}

export type WeeklyMeals = Record<string, Record<string, MealItem[]>>;

export interface WorkoutPlan {
    name: string;
    duration: string;
    exercises: string[];
    isRestDay: boolean;
}

export type WeeklyWorkouts = Record<string, WorkoutPlan>;

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export function parseMealPlan(text: string): WeeklyMeals {
    const meals: WeeklyMeals = {};
    const days = text.split(/Day\s*\d+:/i).filter(d => d.trim());

    days.forEach((dayText, index) => {
        if (index >= 7) return;
        const dayName = DAYS[index];
        meals[dayName] = {};

        const mealSections = dayText.split(/- (Breakfast|Lunch|Snack|Dinner|Snacks)\s*\((\d+)[^)]*\)\s*:/i);

        for (let i = 1; i < mealSections.length; i += 3) {
            let mealType = mealSections[i].trim();
            if (mealType.toLowerCase() === 'snack') mealType = 'Snacks';
            const itemsText = mealSections[i + 2] || '';
            const items: MealItem[] = [];

            // Match "1. Food Name - Quantity - Calories kcal - Macros"
            // Example: "1. Oatmeal - 245 g - 955 kcal - 22g Prot • 8g fat • 48g carbs"
            const itemLines = itemsText.split('\n');
            itemLines.forEach(line => {
                const match = line.match(/^\s*\d+\.\s*(.*?)\s*[—\-–]+\s*(.*?)\s*[—\-–]+\s*(\d+(?:\.\d+)?)\s*kcal\s*[—\-–]+\s*(.*)$/i);
                if (match) {
                    items.push({
                        name: match[1].trim(),
                        quantity: match[2].trim(),
                        calories: parseInt(match[3]),
                        macro: match[4].trim().replace(/\//g, ' • ')
                    });
                } else {
                    // Fallback for simpler format
                    const simpleMatch = line.match(/^\s*\d+\.\s*(.*?)\s*[—\-–]+\s*(.*?)\s*[—\-–]+\s*(\d+(?:\.\d+)?)\s*kcal/i);
                    if (simpleMatch) {
                        items.push({
                            name: simpleMatch[1].trim(),
                            quantity: simpleMatch[2].trim(),
                            calories: parseInt(simpleMatch[3]),
                            macro: 'Modified'
                        });
                    }
                }
            });

            if (items.length > 0) {
                meals[dayName][mealType] = items;
            }
        }
    });

    return meals;
}

export function parseWorkoutPlan(text: string): WeeklyWorkouts {
    const workouts: WeeklyWorkouts = {};
    const days = text.split(/Day\s*\d+:/i).filter(d => d.trim());

    days.forEach((dayText, index) => {
        if (index >= 7) return;
        const dayName = DAYS[index];

        // Match "Workout: Name (Duration)"
        const nameMatch = dayText.match(/Workout:\s*(.*?)\s*(?:\((.*?)\))?\n/i);
        const name = nameMatch ? nameMatch[1].trim() : 'Rest Day';
        const duration = nameMatch && nameMatch[2] ? nameMatch[2].trim() : '0 mins';

        const exercises: string[] = [];
        const exerciseLines = dayText.split('\n');
        exerciseLines.forEach(line => {
            const match = line.match(/^\s*\d+\.\s*(.*?)(?:\s*[—\-–]\s*.*)?$/);
            if (match && !line.toLowerCase().includes('workout:')) {
                exercises.push(match[1].trim());
            }
        });

        const isRestDay = name.toLowerCase().includes('rest') || exercises.length === 0;

        workouts[dayName] = {
            name,
            duration,
            exercises,
            isRestDay
        };
    });

    return workouts;
}
