import { Calendar } from "@/components/agenda/calendar";
import { CalendarHeader, THRESHOLD } from "@/components/agenda/calendar-header";
import { CalendarSearch } from "@/components/agenda/calendar-search";
import { CalendarDayEvents } from "@/components/agenda/day-events";
import { Container } from "@/components/container";
import { useCalendar } from "@/hooks/agenda/use-calendar";
import { event, EXPAND_NAVBAR, MINIMIZE_NAVBAR } from "@/lib/event-emitter";
import { startOfMonth } from "date-fns";
import { usePathname } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, useAnimatedReaction, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from "react-native-reanimated";

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
    const translateY = useSharedValue<number>(0);
    const refreshing = useSharedValue<boolean>(false);

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

    const r = (v: any) => console.log(v);

    const panGesture = useMemo(() => {
        return (
            Gesture.Pan()
                .failOffsetX([-5, 5])
                .activeOffsetY(1)
                .onUpdate(({ translationY: y }) => {
                    if (y > 0 && !refreshing.value) {
                        translateY.value = y;
                    }
                })
                .onEnd(({ translationY: y }) => {
                    if (refreshing.value || y < THRESHOLD * .8) {
                        translateY.value = withTiming(0, {
                            duration: 300,
                            easing: Easing.inOut(Easing.quad),
                        });

                        return;
                    }

                    translateY.value = withTiming(THRESHOLD / 2, {
                        duration: 300,
                        easing: Easing.inOut(Easing.quad),
                    });
                    refreshing.value = true;
                })
        );
    }, []);

    useAnimatedReaction(
        () => refreshing.value,
        (next, prev) => {
            if (!next && next != prev) {
                translateY.value = withTiming(0, {
                    duration: 300,
                    easing: Easing.inOut(Easing.quad),
                });
            }
        }
    );

    return (
        <Container centerX>
            <GestureDetector gesture={panGesture}>
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
                        translateY={translateY}
                        refreshing={refreshing}
                    />

                    <Calendar
                        context={context}
                        currentMonth={currentMonth}
                        setCurrentMonth={setCurrentMonth}
                        mutation={mutation}
                        flatListRef={flatListRef}
                        setTargetDate={setDateEvents}
                        refreshing={refreshing}
                    />
                </Animated.View>
            </GestureDetector>

            <CalendarDayEvents
                targetDate={dateEvents}
                setTargetDate={setDateEvents}
                refreshing={refreshing}
            />

            <CalendarSearch active={searchSectionActive} />
        </Container>
    );
}