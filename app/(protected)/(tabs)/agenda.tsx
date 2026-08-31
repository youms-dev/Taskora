import { Calendar } from "@/components/agenda/calendar";
import { CalendarDayEvents } from "@/components/agenda/day-events";
import { CalendarHeader } from "@/components/agenda/header";
import { CalendarSearch } from "@/components/agenda/search";
import { Container } from "@/components/container";
import { useCalendar } from "@/hooks/agenda/use-calendar";
import { event, EXPAND_NAVBAR, MINIMIZE_NAVBAR } from "@/lib/event-emitter";
import { startOfMonth } from "date-fns";
import { usePathname } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { FlatList } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from "react-native-reanimated";

export default function Agenda() {
    const pathname = usePathname();
    const context = useCalendar();
    const monthsFlatListRef = useRef<FlatList>(null);
    const yearsFlatListRef = useRef<FlatList>(null);
    const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
    const mutation = useRef<"append" | "prepend" | "generate">(null);
    const flatListRef = useRef<FlatList<Date>>(null);
    const timeout = useRef<ReturnType<typeof setTimeout>>(null);
    const animation = useSharedValue<boolean>(false);
    const animationRef = useRef<boolean>(false);
    const [dateEvents, setDateEvents] = useState<Date | null>(null);
    const searchSectionActive = useSharedValue<boolean>(false);

    useEffect(() => {
        if (pathname == "/agenda") {
            event.emit(MINIMIZE_NAVBAR);
        }

        return () => {
            event.emit(EXPAND_NAVBAR);
        }
    }, [pathname]);

    useEffect(() => {
        timeout.current && clearTimeout(timeout.current);
        if (animationRef.current) {
            animation.value = true;
            timeout.current = setTimeout(() => {
                animation.value = false;
                animationRef.current = false;
            }, 200);
        }
    }, [context.months]);

    const generateAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                scale: animation.value ?
                    withSequence(
                        withTiming(.5, {
                            duration: 500,
                            easing: Easing.inOut(Easing.quad),
                        }),
                        withDelay(
                            200,
                            withSpring(1, {
                                stiffness: 100,
                                damping: 8,
                                mass: 1,
                            }),
                        )
                    )
                    :
                    1
            }
        ]
    }));

    return (
        <Container centerX>
            <Animated.View
                style={generateAnimation}
                className="w-full flex items-center"
            >
                <CalendarHeader
                    context={context}
                    currentMonth={currentMonth}
                    monthsFlatListRef={monthsFlatListRef}
                    yearsFlatListRef={yearsFlatListRef}
                    mutation={mutation}
                    flatListRef={flatListRef}
                    animationRef={animationRef}
                    searchSectionActive={searchSectionActive}
                />

                <Calendar
                    context={context}
                    currentMonth={currentMonth}
                    setCurrentMonth={setCurrentMonth}
                    mutation={mutation}
                    flatListRef={flatListRef}
                    setTargetDate={setDateEvents}
                />
            </Animated.View>

            <CalendarDayEvents
                targetDate={dateEvents}
                setTargetDate={setDateEvents}
            />

            <CalendarSearch active={searchSectionActive} />
        </Container>
    );
}