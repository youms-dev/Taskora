import { addMonths, startOfMonth } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";

export const INITIAL_RANGE = 6;
// export const NUM_TO_ADD = INITIAL_RANGE * 2;
export const NUM_TO_ADD = 6;

export const useCalendar = () => {
    const [months, setMonths] = useState<Date[]>([]);
    const today = useMemo(() => startOfMonth(new Date()), []);
    const loading = useRef<boolean>(false);
    const [years, setYears] = useState<number[]>([]);

    const prependPastMonths = async () => {
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

        console.log("Prepend done");
    };

    const appendFutureMonths = async () => {
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

        console.log("Append done");

    };

    useEffect(() => {
        const years: number[] = [];
        const date = new Date();

        for (let i = date.getFullYear() - 200; i < date.getFullYear() + 200; i++) {
            years.push(i + 1);
        }

        setYears(years);
    }, []);

    const reset = () => {
        const months = Array(INITIAL_RANGE * 2 + 1).fill(0).map((_, i) => {
            return startOfMonth(addMonths(today, i - INITIAL_RANGE));
        });

        setMonths(months);
    }

    const generateMonths = (target: "month" | "year", entry: number, currentDate: Date = new Date(), init: boolean = false) => {
        if (loading.current) return;
        loading.current = true;

        if (target == "month") {
            const targetDate = new Date(currentDate.getFullYear(), entry, 1);

            const months = Array(init ? (INITIAL_RANGE * 2) + 1 : INITIAL_RANGE + 2).fill(0).map((_, i) => {
                return startOfMonth(addMonths(targetDate, i - INITIAL_RANGE));
            });

            setMonths(months);
        }
        else {
            const targetDate = new Date(entry, currentDate.getMonth(), 1);

            const months = Array(init ? (INITIAL_RANGE * 2) + 1 : INITIAL_RANGE + 2).fill(0).map((_, i) => {
                return startOfMonth(addMonths(targetDate, i - INITIAL_RANGE));
            });

            setMonths(months);
        }
        loading.current = false;
    }

    return ({
        months,
        appendFutureMonths,
        prependPastMonths,
        loading,
        reset,
        years,
        generateMonths,
    });
};