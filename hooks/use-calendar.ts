import { addMonths, startOfMonth } from "date-fns";
import { useMemo, useState } from "react";

export const INITIAL_RANGE = 50;

export const useHorizontalCalendar = () => {
    const today = useMemo(() => startOfMonth(new Date()), []);

    const [months, setMonths] = useState<Date[]>(() => Array.from({
        length: INITIAL_RANGE * 2 + 1
    },
        (_, i) => startOfMonth(addMonths(today, i - INITIAL_RANGE))
    ));

    const appendFutureMonths = () => {
        setMonths((prev) => {
            const lastMonth = prev[prev.length - 1];

            const nextMonths = Array.from(
                { length: 20 },
                (_, i) => startOfMonth(addMonths(lastMonth, i + 1))
            );

            return [...prev, ...nextMonths];
        });
    };

    const prependPastMonths = () => {
        setMonths((prev) => {
            const firstMonth = prev[0];

            const previousMonths = Array.from(
                { length: 20 },
                (_, i) => startOfMonth(addMonths(firstMonth, -(i + 1)))
            ).reverse();

            return [...previousMonths, ...prev];
        });
    };

    return {
        months,
        appendFutureMonths,
        prependPastMonths,
    };
};