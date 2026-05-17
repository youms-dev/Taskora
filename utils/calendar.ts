import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";

export const generateMonths = (centerDate: Date, range: number = 12) => {
    const months: Date[] = [];

    for (let i = -range; i <= range; i++) {
        const monthDate: Date = startOfMonth(addMonths(centerDate, i));

        months.push(monthDate);
    }

    return months;
};

export const generateMonthDays = (month: Date): Date[] => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });

    return eachDayOfInterval({ start, end });
};