import { addMonths, startOfMonth } from "date-fns";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

const Context = createContext<{
    months: Date[];
    appendFutureMonths: () => void;
    prependPastMonths: () => void;
}>({
    months: [],
    appendFutureMonths: () => { },
    prependPastMonths: () => { },
});

export const INITIAL_RANGE = 50;

interface Props {
    children: ReactNode;
}

export const CalendarProvider = ({ children }: Props) => {
    const [months, setMonths] = useState<Date[]>([]);
    const today = useMemo(() => startOfMonth(new Date()), []);

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

    useEffect(() => {
        setMonths(() => Array.from({
            length: INITIAL_RANGE * 2 + 1
        },
            (_, i) => startOfMonth(addMonths(today, i - INITIAL_RANGE))
        ));
    }, []);

    return (
        <Context.Provider value={{
            months,
            appendFutureMonths,
            prependPastMonths,
        }}>
            {children}
        </Context.Provider>
    );
};

export const useCalendar = () => useContext(Context);