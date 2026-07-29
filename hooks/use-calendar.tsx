import { addMonths, startOfMonth } from "date-fns";
import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";

const Context = createContext<{
    months: Date[];
    appendFutureMonths: () => void;
    prependPastMonths: () => void;
    loading: boolean;
    reset: () => void;
    years: number[];
    generateMonths: (target: "month" | "year", entry: number, currentDate?: Date) => void;
}>({
    months: [],
    appendFutureMonths: () => { },
    prependPastMonths: () => { },
    loading: false,
    reset: () => { },
    years: [],
    generateMonths: () => { },
});

export const INITIAL_RANGE = 5;
export const NUM_TO_ADD = 12;

interface Props {
    children: ReactNode;
}

export const CalendarProvider = ({ children }: Props) => {
    const [months, setMonths] = useState<Date[]>([]);
    const today = useMemo(() => startOfMonth(new Date()), []);
    const [loading, setLoading] = useState<boolean>(false);
    const loadingRef = useRef<boolean>(false);
    const [years, setYears] = useState<number[]>([]);

    // const appendFutureMonths = async () => {
    //     if (loadingRef.current || months[months.length - 1].getFullYear() >= years[years.length - 1]) return;
    //     setLoading(true);

    //     setMonths((prev) => {
    //         const lastMonth = prev[prev.length - 1];

    //         const nextMonths = Array.from(
    //             { length: NUM_TO_ADD },
    //             (_, i) => startOfMonth(addMonths(lastMonth, i + 1))
    //         );

    //         return [...prev, ...nextMonths];
    //     });

    //     console.log("Append done");

    //     setLoading(false);
    // };

    const appendFutureMonths = async () => {
        if (loadingRef.current || months[months.length - 1].getFullYear() >= years[years.length - 1]) return;
        setLoading(true);
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

    //    const prependPastMonths = async () => {
    //     if (loadingRef.current || months[0].getFullYear() <= years[0]) return;
    //     setLoading(true);

    //     setMonths((prev) => {
    //         const firstMonth = prev[0];

    //         const previousMonths = Array.from(
    //             { length: NUM_TO_ADD },
    //             (_, i) => startOfMonth(addMonths(firstMonth, -(i + 1)))
    //         ).reverse();

    //         return [...previousMonths, ...prev];
    //     });

    //     console.log("Prepend done");
    //     setLoading(false);
    // };

    const prependPastMonths = async () => {
        if (loadingRef.current || months[0].getFullYear() <= years[0]) return;
        setLoading(true);
        const firstMonth = months[0];
        const previousMonths: Date[] = [];

        for (let i = 0; i < NUM_TO_ADD; i++) {
            const m = startOfMonth(addMonths(firstMonth, -(i + 1)));

            if (m.getFullYear() >= years[0]) {
                previousMonths.push(m);
            }
        }

        setMonths((prev) => [...previousMonths, ...prev]);

        console.log("Prepend done");
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
        if (target == "year" && !years.includes(entry)) {
            throw new Error("The given entry doesn't exists in the current years range");
        }

        if (target == "month") {
            const date = new Date();
            const targetDate = new Date(date.getFullYear(), entry, 1);

            const months = Array(INITIAL_RANGE * 2 + 1).fill(0).map((_, i) => {
                return startOfMonth(addMonths(targetDate, i - INITIAL_RANGE));
            });

            setMonths(months);
        }
        else {
            const targetDate = new Date(entry, currentDate.getMonth(), 1);

            const months = Array(INITIAL_RANGE * 2 + 1).fill(0).map((_, i) => {
                return startOfMonth(addMonths(targetDate, i - INITIAL_RANGE));
            });

            setMonths(months);
        }
    }

    return (
        <Context.Provider value={{
            months,
            appendFutureMonths,
            prependPastMonths,
            loading,
            reset,
            years,
            generateMonths,
        }}>
            {children}
        </Context.Provider>
    );
};

export const useCalendar = () => useContext(Context);