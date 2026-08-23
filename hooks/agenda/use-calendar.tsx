import { addMonths, startOfMonth } from "date-fns";
import { useCallback, useMemo, useRef, useState } from "react";

export const INITIAL_RANGE = 12;
export const NUM_TO_ADD = INITIAL_RANGE;

const buildInitialYears = (): number[] => {
    const years: number[] = [];
    const date = new Date();

    for (let i = date.getFullYear() - 200; i < date.getFullYear() + 200; i++) {
        years.push(i + 1);
    }

    return years;
};

const buildInitialMonths = (): Date[] => {
    const today = startOfMonth(new Date());
    return Array(INITIAL_RANGE * 2 + 1).fill(0).map((_, i) => {
        return startOfMonth(addMonths(today, i - INITIAL_RANGE));
    });
};

export const useCalendar = (init: boolean = true) => {
    const [months, setMonths] = useState<Date[]>(() => init ? buildInitialMonths() : []);
    const loading = useRef<boolean>(false);
    const years = useMemo<number[]>(() => buildInitialYears(), []);

    const prependPastMonths = useCallback(async () => {
        if (loading.current || months[0].getFullYear() < years[0]) return;
        loading.current = true;

        const firstMonth = months[0];
        const previousMonths: Date[] = [];

        for (let i = 0; i < NUM_TO_ADD; i++) {
            const m = startOfMonth(addMonths(firstMonth, -(i + 1)));

            if (m.getFullYear() >= years[0]) {
                previousMonths.push(m);
            }
        }

        setMonths((prev) => [...previousMonths.reverse(), ...prev]);
    }, [months, years]);

    const appendFutureMonths = useCallback(async () => {
        if (loading.current || months[months.length - 1].getFullYear() > years[years.length - 1]) return;
        loading.current = true;

        const lastMonth = months[months.length - 1];
        const nextMonths: Date[] = [];

        for (let i = 0; i < NUM_TO_ADD; i++) {
            const m = startOfMonth(addMonths(lastMonth, i + 1));

            if (m.getFullYear() <= years[years.length - 1]) {
                nextMonths.push(m);
            }
        }
        setMonths((prev) => [...prev, ...nextMonths]);
    }, [months, years]);

    const generateMonths = useCallback((target: "month" | "year", entry: number, currentDate: Date = new Date()) => {
        if (loading.current) return;
        loading.current = true;

        if (target == "month") {
            const targetDate = new Date(currentDate.getFullYear(), entry, 1);

            const months = Array((INITIAL_RANGE * 2) + 1).fill(0).map((_, i) => {
                return startOfMonth(addMonths(targetDate, i - INITIAL_RANGE));
            });

            setMonths(months);
        }
        else {
            const targetDate = new Date(entry, currentDate.getMonth(), 1);

            const months = Array((INITIAL_RANGE * 2) + 1).fill(0).map((_, i) => {
                return startOfMonth(addMonths(targetDate, i - INITIAL_RANGE));
            });

            setMonths(months);
        }
    }, []);

    return ({
        months,
        appendFutureMonths,
        prependPastMonths,
        loading,
        years,
        generateMonths,
    });
};

export type CalendarType = ReturnType<typeof useCalendar>;