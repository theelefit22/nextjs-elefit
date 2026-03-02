import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WeeklyMeals, WeeklyWorkouts } from './ai-coach-parser';

export interface PDFData {
    headerData: {
        prompt: string;
        calories: number;
        workoutFocus: string;
        genDate: string;
    };
    parsedMeals: WeeklyMeals | null;
    parsedWorkouts: WeeklyWorkouts | null;
    scheduleDates: {
        dayName: string;
        dateNum: string;
        fullDate: Date;
    }[];
}

export const generatePlanPDF = (data: PDFData) => {
    const { headerData, parsedMeals, parsedWorkouts, scheduleDates } = data;
    const doc = new jsPDF();
    const primaryColor = [204, 216, 83]; // #CCD853
    const accentColor = [12, 12, 12]; // Dark background

    // --- PAGE 1: HEADER & SUMMARY ---
    // Background Header
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(0, 0, 210, 50, 'F');

    // Title
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text('ELEFIT', 20, 30);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('YOUR PERSONALIZED FITNESS JOURNEY', 20, 40);

    // Metadata
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setFontSize(10);
    doc.text(`Plan Name: ${headerData.prompt}`, 20, 60);
    doc.text(`Daily Calorie Target: ${headerData.calories} kcal`, 20, 67);
    doc.text(`Workout Focus: ${headerData.workoutFocus}`, 20, 74);
    doc.text(`Date Generated: ${new Date(headerData.genDate).toLocaleDateString()}`, 20, 81);

    // --- MEAL PLAN SECTION ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('WEEKLY MEAL PLAN', 20, 100);

    if (parsedMeals) {
        const mealTableData: any[] = [];
        scheduleDates.forEach((date, index) => {
            const dayMeals = parsedMeals[index] || {};
            const mealTimes = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];

            mealTimes.forEach((time) => {
                const items = dayMeals[time] || [];
                if (items.length > 0) {
                    items.forEach((item, itemIdx) => {
                        mealTableData.push([
                            itemIdx === 0 ? `${date.dayName} (${date.dateNum})` : '',
                            itemIdx === 0 ? time : '',
                            item.name,
                            item.quantity,
                            `${item.calories} kcal`,
                            item.macro
                        ]);
                    });
                }
            });
        });

        autoTable(doc, {
            startY: 110,
            head: [['Day', 'Meal', 'Food Item', 'Qty', 'Cals', 'Macros']],
            body: mealTableData,
            theme: 'striped',
            headStyles: { fillColor: primaryColor as [number, number, number], textColor: [0, 0, 0], fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 25 },
                1: { fontStyle: 'bold', cellWidth: 20 },
                2: { cellWidth: 50 }
            }
        });
    } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('No meal plan data available.', 20, 110);
    }

    // --- WORKOUT PLAN SECTION ---
    let finalY = (doc as any).lastAutoTable.finalY + 20;

    // Check for page overflow
    if (finalY > 250) {
        doc.addPage();
        finalY = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('WEEKLY WORKOUT PLAN', 20, finalY);
    finalY += 10;

    if (parsedWorkouts) {
        scheduleDates.forEach((date, index) => {
            const workout = parsedWorkouts[index];
            if (!workout) return;

            // Check for page overflow
            if (finalY > 260) {
                doc.addPage();
                finalY = 20;
            }

            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text(`${date.dayName} - ${date.dateNum}: ${workout.isRestDay ? 'REST DAY' : workout.name}`, 20, finalY);
            finalY += 6;

            if (!workout.isRestDay) {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 100, 100);
                doc.text(`Duration: ${workout.duration}`, 25, finalY);
                finalY += 6;

                workout.exercises.forEach((ex) => {
                    if (finalY > 280) {
                        doc.addPage();
                        finalY = 20;
                    }
                    doc.setFontSize(9);
                    doc.setTextColor(0, 0, 0);
                    doc.text(`• ${ex}`, 30, finalY);
                    finalY += 5;
                });
            } else {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(150, 150, 150);
                doc.text('Take some time to recover and stay hydrated.', 25, finalY);
                finalY += 8;
            }
            finalY += 6; // Space between days
        });
    } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('No workout plan data available.', 20, finalY);
    }

    // --- FOOTER ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Generated by ELEFIT AI Coach - Fuel Your Ambition', 105, 290, { align: 'center' });
        doc.text(`Page ${i} of ${pageCount}`, 190, 290, { align: 'right' });
    }

    doc.save(`EleFit_Plan_${headerData.prompt.replace(/\s+/g, '_')}.pdf`);
};
