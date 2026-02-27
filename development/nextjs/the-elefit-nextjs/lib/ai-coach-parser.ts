/**
 * Parser for the AI Coach meal and workout plans.
 */

export interface MealItem {
    name: string;
    quantity: string;
    calories: number;
    macro: string;
}

export type WeeklyMeals = Record<string, MealItem[]>[];

export interface WorkoutPlan {
    name: string;
    duration: string;
    exercises: string[];
    isRestDay: boolean;
}

export type WeeklyWorkouts = WorkoutPlan[];

export function parseMealPlan(text: string): WeeklyMeals {
    const weeklyMeals: WeeklyMeals = [];
    // Split by Day X markers, keeping the marker in the segment
    const daySegments = text.split(/(?=Day\s*\d+[:\s\u2013\u2014-])/i).filter(d => d.trim());

    daySegments.forEach((dayText, index) => {
        if (index >= 7) return;
        const dayMeals: Record<string, MealItem[]> = {};

        const mealSections = dayText.split(/\- (Breakfast|Lunch|Snack|Dinner|Snacks)\s*\((\d+)[^)]*\)\s*:/i);

        for (let i = 1; i < mealSections.length; i += 3) {
            let mealType = mealSections[i].trim();
            if (mealType.toLowerCase() === 'snack') mealType = 'Snacks';
            const itemsText = mealSections[i + 2] || '';
            const items: MealItem[] = [];

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
                dayMeals[mealType] = items;
            }
        }
        weeklyMeals.push(dayMeals);
    });

    // Ensure we have 7 days
    while (weeklyMeals.length < 7) weeklyMeals.push({});
    return weeklyMeals;
}

export function parseWorkoutPlan(text: string): WeeklyWorkouts {
    const weeklyWorkouts: WeeklyWorkouts = [];
    // Split by Day X markers, keeping the marker in the segment
    const daySegments = text.split(/(?=Day\s*\d+[:\s\u2013\u2014-])/i).filter(d => d.trim());

    daySegments.forEach((dayText, index) => {
        if (index >= 7) return;

        // Backend format: "Day 1 – [Muscle Focus or Rest Day]:"
        // Regex to extract focus after the dash/marker
        const headerMatch = dayText.match(/Day\s*\d+.*?[—\-–\u2013\u2014]\s*(.*?):/i);
        let name = headerMatch ? headerMatch[1].trim() : '';

        // Fallback for "Workout: Name (Duration)"
        if (!name || name.toLowerCase().includes('day')) {
            const workoutMatch = dayText.match(/Workout:\s*(.*?)\s*(?:\((.*?)\))?\n/i);
            if (workoutMatch) {
                name = workoutMatch[1].trim();
            }
        }

        if (!name) name = 'Rest Day';

        const durationMatch = dayText.match(/\((.*?mins?)\)/i);
        const duration = durationMatch ? durationMatch[1].trim() : '0 mins';

        const exercises: string[] = [];
        const lines = dayText.split('\n');
        lines.forEach(line => {
            // Match numbered items but ignore header/summary lines
            const exMatch = line.match(/^\s*\d+\.\s*(.*?)(?:\s*[—\-–\u2013\u2014]\s*.*)?$/);
            if (exMatch && !line.toLowerCase().includes('day') && !line.toLowerCase().includes('workout:')) {
                exercises.push(exMatch[1].trim());
            }
        });

        const isRestDay = name.toLowerCase().includes('rest') || exercises.length === 0;

        weeklyWorkouts.push({
            name: isRestDay ? 'Rest Day' : name,
            duration: isRestDay ? '0 mins' : duration,
            exercises,
            isRestDay
        });
    });

    // Ensure we have 7 days
    while (weeklyWorkouts.length < 7) {
        weeklyWorkouts.push({
            name: 'Rest Day',
            duration: '0 mins',
            exercises: [],
            isRestDay: true
        });
    }

    return weeklyWorkouts;
}
