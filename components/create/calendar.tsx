import { INITIAL_RANGE, NUM_TO_ADD, useCalendar } from "@/hooks/agenda/use-calendar";
import Entypo from "@expo/vector-icons/Entypo";
import clsx from "clsx";
import { format } from "date-fns";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, Text, useWindowDimensions, View } from "react-native";
import { PressableAnimated } from "../pressable-animated";
import { TextAnimated } from "../text-animated";
import { CalendarDays } from "./days";

interface Props {
    targetDate: Date;
    onDateChanged: (entry: Date) => void;
}

export const Calendar = memo(({ onDateChanged, targetDate }: Props) => {
    const { i18n } = useTranslation();
    const { width: screenWidth } = useWindowDimensions();
    const [dayWidth, setDayWidth] = useState<number>(screenWidth / 7);
    const { months, generateMonths, loading: hookLoading, prependPastMonths, appendFutureMonths } = useCalendar(false);
    const [currentDate, setCurrentDate] = useState<Date>(targetDate);
    const ref = useRef<FlatList>(null);
    const currentIndex = useRef<number>(INITIAL_RANGE);
    const [width, setWidth] = useState<number>(screenWidth);
    const monthsMap = useMemo(() => {
        return (
            new Map(
                months.map((m, i) => [i, m]),
            )
        );
    }, [months]);
    const mounted = useRef<boolean>(false);
    const date = useMemo(() => new Date(), []);
    const mutation = useRef<"append" | "prepend" | "generate">(null);

    if (monthsMap.size == 0) {
        mutation.current = "generate";
        generateMonths("month", targetDate.getMonth(), targetDate);
    }

    const days = useMemo(() => (i18n.language == "fr" ?
        ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
        :
        ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    ), [i18n.language]);

    useEffect(() => {
        setDayWidth(screenWidth / 7);
    }, [screenWidth]);

    const renderItem = useCallback(({ item: month }: { item: Date; index: number }) => {
        return (
            <View
                style={{
                    width,
                }}
                className="h-full"
            >
                <CalendarDays
                    month={month}
                    width={width}
                    targetDate={targetDate}
                    onDateChanged={onDateChanged}
                />
            </View>
        );
    }, [width, onDateChanged, targetDate]);

    const getItemLayout = useCallback((_data: unknown, index: number) => ({
        length: (width),
        offset: index * (width),
        index,
    }), [width]);

    const handleScroll = useCallback((direction: "left" | "right" = "right") => {
        if (direction == "right" && currentIndex.current < months.length - 1) {
            ref.current?.scrollToIndex({
                index: currentIndex.current + 1,
            });
            currentIndex.current += 1;
        }
        else if (direction == "left" && currentIndex.current > 0) {
            ref.current?.scrollToIndex({
                index: currentIndex.current - 1,
            });
            currentIndex.current -= 1;
        }
    }, [months.length]);

    const onMomentumScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const x = e.nativeEvent.contentOffset.x;
        const index = Math.round(x / width);

        setCurrentDate(monthsMap.get(index) ?? new Date());
        currentIndex.current = index;

        if (hookLoading.current || mutation.current) return;

        if (index <= 5) {
            mutation.current = "prepend";
            prependPastMonths();
        }

        else if (index >= months.length - 5) {
            mutation.current = "append";
            appendFutureMonths();
        }
    }, [width, monthsMap]);

    useEffect(() => {
        if (!mounted.current && mutation.current == "generate" && width != 0 && months.length > 0) {
            requestAnimationFrame(() => {
                ref.current?.scrollToIndex({
                    index: INITIAL_RANGE,
                    animated: false,
                });
                mounted.current = true;
                mutation.current = null;
            });
        }

        if (hookLoading.current && mutation.current == "prepend") {
            ref.current?.scrollToIndex({
                index: currentIndex.current + NUM_TO_ADD,
                animated: false,
            });
            mutation.current = null;
            currentIndex.current = currentIndex.current + NUM_TO_ADD;
            hookLoading.current = false;
        }
        else if (hookLoading.current && mutation.current == "append") {
            hookLoading.current = false;
            mutation.current = null;
        }
    }, [months, width]);

    const goBackToday = useCallback(() => {
        const index = months.findIndex(m => m.getMonth() == date.getMonth() && m.getFullYear() == date.getFullYear());

        if (index != -1) {
            ref.current?.scrollToIndex({
                index,
            });
        }
    }, [months]);

    return (
        <View className="w-full h-full flex items-center">
            <View className="w-full flex flex-row justify-between items-center gap-2 mb-5 mt-3 px-3">
                <View className="size-[35px] dark:bg-black bg-white rounded-full">
                    <PressableAnimated
                        onPress={() => handleScroll("left")}
                        className="size-full flex justify-center items-center dark:bg-white/10 bg-black/80 rounded-full border border-white/5"
                    >
                        <Entypo
                            name="chevron-left"
                            size={25}
                            color="rgba(255, 255, 255, .8)"
                        />
                    </PressableAnimated>
                </View>

                <Pressable
                    onPress={goBackToday}
                    className="w-[60%] flex flex-row justify-center items-center px-3"
                >
                    <TextAnimated
                        numberOfLines={1}
                        className="text-lg font-medium"
                    >
                        {format(currentDate, "MMMM yyyy")}
                    </TextAnimated>
                </Pressable>

                <View className="size-[35px] dark:bg-black bg-white rounded-full">
                    <PressableAnimated
                        onPress={() => handleScroll("right")}
                        className="size-full flex justify-center items-center dark:bg-white/10 bg-black/80 rounded-full border border-white/5"
                    >
                        <Entypo
                            name="chevron-right"
                            size={25}
                            color="rgba(255, 255, 255, .8)"
                        />
                    </PressableAnimated>
                </View>
            </View>

            <View className="w-full flex flex-row justify-center mb-5">
                {
                    days.map((d, i) => (
                        <View
                            key={i}
                            style={{
                                width: dayWidth - 1,
                            }}
                            className="w-full flex flex-row justify-center items-center"
                        >
                            <Text
                                numberOfLines={1}
                                className={clsx(
                                    (i18n.language == "en" && i == 0) || (i18n.language == "fr" && i == 6) ? "text-red-500/60" : "dark:text-gray-600 text-gray-500",
                                )}
                            >
                                {d}
                            </Text>
                        </View>
                    ))
                }
            </View>

            <View className="w-full">
                <FlatList
                    ref={ref}
                    horizontal
                    pagingEnabled
                    decelerationRate="fast"
                    scrollEventThrottle={16}
                    windowSize={100}
                    initialNumToRender={12}
                    maxToRenderPerBatch={12}
                    updateCellsBatchingPeriod={0}
                    removeClippedSubviews={false}
                    data={months}
                    keyExtractor={(item) => item.toISOString()}
                    renderItem={renderItem}
                    getItemLayout={getItemLayout}
                    onMomentumScrollEnd={onMomentumScrollEnd}
                    onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
                    className="w-full h-full"
                />
            </View>
        </View>
    );
});