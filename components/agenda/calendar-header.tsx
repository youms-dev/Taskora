import { monthsTranslation } from "@/constants/calendar";
import { CalendarType } from "@/hooks/agenda/use-calendar";
import { useTheme } from "@/hooks/use-theme";
import { event, HIDE_NAVBAR } from "@/lib/event-emitter";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { format, startOfMonth } from "date-fns";
import { memo, RefObject, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, useWindowDimensions, View } from "react-native";
import Animated, { Easing, Extrapolation, interpolate, SharedValue, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { PressableAnimated } from "../pressable-animated";
import { TextAnimated } from "../text-animated";

export const THRESHOLD = 100;

interface Props {
    context: Pick<CalendarType, "months" | "years" | "generateMonths" | "loading">;
    currentMonth: Date;
    mutation: RefObject<"append" | "prepend" | "generate" | null>;
    flatListRef: RefObject<FlatList | null>;
    animationRef: RefObject<boolean>;
    searchSectionActive: SharedValue<boolean>;
    translateY: SharedValue<number>;
    refreshing: SharedValue<boolean>;
    openDateList: (value: boolean) => void;
}

export const CalendarHeader = memo(({ context, currentMonth, mutation, flatListRef, animationRef, searchSectionActive, translateY, refreshing, openDateList }: Props) => {
    const { theme } = useTheme();
    const { months, generateMonths } = context;
    const { i18n } = useTranslation();
    const date = useMemo(() => new Date(), []);
    const refreshControlWidth = useSharedValue<number>(0);
    const { width: screenWidth } = useWindowDimensions();
    const screenWidthShared = useSharedValue<number>(screenWidth);

    const monthsMap = useMemo(() => {
        return (
            new Map(
                months.map((m, i) => [m.toLocaleString(), {
                    index: i,
                    date: m,
                }]),
            )
        );
    }, [months]);

    const displayedDate = useMemo(() => {
        return monthsTranslation[i18n.language][currentMonth.getMonth()] + " " + currentMonth.getFullYear();
    }, [i18n.language, currentMonth]);

    const refreshControlAnimation = useAnimatedStyle(() => ({
        left: (screenWidthShared.value / 2) - (refreshControlWidth.value / 2),
        top: 0,
        transform: [
            {
                translateY: interpolate(
                    translateY.value,
                    [0, THRESHOLD],
                    [10, THRESHOLD],
                    Extrapolation.CLAMP,
                ),
            },
        ],
        opacity: (refreshing.value && translateY.value > 0 ?
            withRepeat(
                withSequence(
                    withTiming(1, {
                        duration: 300,
                        easing: Easing.inOut(Easing.linear),
                    }),
                    withDelay(
                        500,
                        withTiming(.5, {
                            duration: 300,
                            easing: Easing.inOut(Easing.linear),
                        }),
                    )
                ),
                Infinity,
                true,
            )
            :
            (
                translateY.value > 0 ?
                    1
                    :
                    withTiming(0, {
                        duration: 300,
                        easing: Easing.inOut(Easing.linear),
                    })
            )
        ),
    }));

    useEffect(() => {
        screenWidthShared.value = screenWidth;
    }, [screenWidth]);

    return (
        <View className="w-full">
            <View className="w-full flex flex-row justify-between mb-3 py-2">

                {/* Displayed date */}

                <View className="w-[60%] h-full flex flex-row items-center gap-3 px-3">
                    <PressableAnimated
                        scale={.95}
                        onPress={() => {
                            openDateList(true);
                            event.emit(HIDE_NAVBAR);
                        }}
                    >
                        <TextAnimated
                            numberOfLines={1}
                            className="text-2xl font-medium tracking-widest"
                        >
                            {displayedDate}
                        </TextAnimated>
                    </PressableAnimated>
                </View>

                {/* Search button & today button */}

                <View className="w-[35%] h-full flex flex-row justify-end items-center gap-8 px-3">

                    {/* Search button */}

                    <PressableAnimated onPress={() => {
                        event.emit(HIDE_NAVBAR);
                        searchSectionActive.value = true;
                    }}>
                        <FontAwesome5
                            name="search"
                            size={25}
                            color={theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)"}
                        />
                    </PressableAnimated>

                    {/* Today button */}

                    <PressableAnimated
                        scale={.95}
                        onPress={() => {
                            if (format(currentMonth, "MMMM yyyy") == format(date, "MMMM yyyy")) return;
                            const month = monthsMap.get(startOfMonth(date).toLocaleString());

                            if (!month) {
                                mutation.current = "generate";
                                animationRef.current = true;
                                generateMonths(date);
                            }
                            else {
                                flatListRef.current?.scrollToIndex({
                                    index: +month.index,
                                });
                            }
                        }}
                        className="size-[50px] flex items-center border dark:border-white/10 border-black/10 rounded-xl dark:bg-white/10 bg-white"
                    >
                        <View
                            style={{
                                transform: [
                                    {
                                        translateX: 6,
                                    },
                                    {
                                        translateY: 6,
                                    }
                                ]
                            }}
                            className="absolute left-0 top-0 opacity-50"
                        >
                            <FontAwesome5
                                name="calendar-day"
                                size={10}
                                color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                            />
                        </View>

                        <View className="size-full flex flex-row justify-center items-end p-2 pt-5">
                            <TextAnimated className="text-2xl font-bold tracking-widest dark:opacity-90 opacity-60">
                                {new Date().getDate()}
                            </TextAnimated>
                        </View>
                    </PressableAnimated>
                </View>
            </View>

            {/* Refresh control */}

            <Animated.View
                onLayout={(e) => refreshControlWidth.value = e.nativeEvent.layout.width}
                style={refreshControlAnimation}
                className="absolute dark:bg-black bg-white rounded-full z-[100]"
            >
                <View
                    style={{
                        transform: [
                            {
                                translateY: 8,
                            },
                        ],
                        filter: "blur(5px)",
                    }}
                    className="absolute left-0 top-0 size-full dark:bg-black/50 bg-black/30 rounded-full"
                />

                <View className="size-full flex justify-center items-center dark:bg-white/10 bg-white rounded-full p-3 border dark:border-white/5 border-black/5">
                    <MaterialCommunityIcons
                        name="calendar-sync"
                        size={30}
                        color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                    />
                </View>
            </Animated.View>
        </View>
    );
}, (prev, next) => (
    Object.is(prev.context.generateMonths, next.context.generateMonths)
    &&
    Object.is(prev.context.months, next.context.months)
    &&
    Object.is(prev.context.years, next.context.years)
    &&
    Object.is(prev.currentMonth, next.currentMonth)
));