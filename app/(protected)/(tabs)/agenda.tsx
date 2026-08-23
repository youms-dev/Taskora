import { Calendar } from "@/components/agenda/calendar";
import { CalendarHeader } from "@/components/agenda/header";
import { Container } from "@/components/container";
import { useCalendar } from "@/hooks/agenda/use-calendar";
import { event, EXPAND_NAVBAR, MINIMIZE_NAVBAR } from "@/lib/event-emitter";
import { startOfMonth } from "date-fns";
import { usePathname } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { FlatList } from "react-native";

export default function Agenda() {
    const pathname = usePathname();
    const context = useCalendar();
    const monthsFlatListRef = useRef<FlatList>(null);
    const yearsFlatListRef = useRef<FlatList>(null);
    const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
    const mutation = useRef<"append" | "prepend" | "generate">(null);
    const flatListRef = useRef<FlatList<Date>>(null);

    useEffect(() => {
        if (pathname == "/agenda") {
            event.emit(MINIMIZE_NAVBAR);
        }

        return () => {
            event.emit(EXPAND_NAVBAR);
        }
    }, [pathname]);

    return (
        <Container centerX>
            <CalendarHeader
                context={context}
                currentMonth={currentMonth}
                monthsFlatListRef={monthsFlatListRef}
                yearsFlatListRef={yearsFlatListRef}
                mutation={mutation}
                flatListRef={flatListRef}
            />

            <Calendar
                context={context}
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                mutation={mutation}
                flatListRef={flatListRef}
            />
        </Container>
    );
}