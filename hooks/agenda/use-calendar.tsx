import { addMonths, startOfMonth } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";

export const INITIAL_RANGE = 6;
export const NUM_TO_ADD = 3;

export const useCalendar = () => {
    const [months, setMonths] = useState<Date[]>([]);
    const today = useMemo(() => startOfMonth(new Date()), []);
    const [loading, setLoading] = useState<boolean>(false);
    const loadingRef = useRef<boolean>(false);
    const [years, setYears] = useState<number[]>([]);

    const prependPastMonths = async () => {
        setLoading(true);
        if (loadingRef.current || months[0].getFullYear() < years[0]) {
            setLoading(false);
            return;
        }
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
        setLoading(false);
    };

    const appendFutureMonths = async () => {
        setLoading(true);
        if (loadingRef.current || months[months.length - 1].getFullYear() > years[years.length - 1]) {
            setLoading(false);
            return;
        }
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

        setLoading(false);
    };

    useEffect(() => {
        const months = Array(INITIAL_RANGE * 2 + 1).fill(0).map((_, i) => {
            return startOfMonth(addMonths(today, i - INITIAL_RANGE));
        });
        const years: number[] = [];
        const date = new Date();

        setMonths(months);

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

    useEffect(() => {
        loadingRef.current = loading;
    }, [loading]);

    const generateMonths = (target: "month" | "year", entry: number, currentDate: Date = new Date()) => {
        setLoading(true);
        if (loadingRef.current) {
            setLoading(false);
            return;
        }

        if (target == "year" && !years.includes(entry)) {
            throw new Error("The given entry doesn't exists in the current years range");
        }

        if (target == "month") {
            const targetDate = new Date(currentDate.getFullYear(), entry, 1);

            const months = Array(INITIAL_RANGE + 2).fill(0).map((_, i) => {
                return startOfMonth(addMonths(targetDate, i - INITIAL_RANGE));
            });

            setMonths(months);
        }
        else {
            const targetDate = new Date(entry, currentDate.getMonth(), 1);

            const months = Array(INITIAL_RANGE + 2).fill(0).map((_, i) => {
                return startOfMonth(addMonths(targetDate, i - INITIAL_RANGE));
            });

            setMonths(months);
        }
        setLoading(false);
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