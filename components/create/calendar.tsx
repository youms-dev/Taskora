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
    onDateChanged: (entry: Date) => void;
    targetDate: Date;
}

export const Calendar = memo(({ onDateChanged, targetDate }: Props) => {
    const { i18n } = useTranslation();
    const { width: screenWidth } = useWindowDimensions();
    const { months, loading, prependPastMonths, appendFutureMonths } = useCalendar(true, targetDate);
    const [currentDate, setCurrentDate] = useState<Date>(targetDate);
    const ref = useRef<FlatList>(null);
    const currentIndex = useRef<number>(INITIAL_RANGE);
    const date = useMemo(() => new Date(), []);
    const mutation = useRef<"append" | "prepend" | "generate">(null);
    const dayWidth = useMemo<number>(() => (screenWidth / 7), [screenWidth]);

    const monthsMap = useMemo(() => {
        return (
            new Map(
                months.map((m, i) => [i, m]),
            )
        );
    }, [months]);

    const days = useMemo(() => (i18n.language == "fr" ?
        ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
        :
        ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    ), [i18n.language]);

    const renderItem = useCallback(({ item: month }: { item: Date; index: number }) => {
        return (
            <View
                style={{
                    width: screenWidth,
                }}
                className="h-full"
            >
                <CalendarDays
                    month={month}
                    width={screenWidth}
                    targetDate={targetDate}
                    onDateChanged={onDateChanged}
                />
            </View>
        );
    }, [screenWidth, onDateChanged, targetDate]);

    const getItemLayout = useCallback((_data: unknown, index: number) => ({
        length: (screenWidth),
        offset: index * (screenWidth),
        index,
    }), [screenWidth]);

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
        const index = Math.round(x / screenWidth);

        currentIndex.current = index;
        setCurrentDate(monthsMap.get(index) ?? new Date());

        if (loading.current || mutation.current) return;

        if (index <= 5) {
            mutation.current = "prepend";
            prependPastMonths();
        }

        else if (index >= months.length - 5) {
            mutation.current = "append";
            appendFutureMonths();
        }
    }, [monthsMap]);

    useEffect(() => {
        if (loading.current && mutation.current == "prepend") {
            ref.current?.scrollToIndex({
                index: currentIndex.current + NUM_TO_ADD,
                animated: false,
            });
            requestAnimationFrame(() => {
                mutation.current = null;
                currentIndex.current = currentIndex.current + NUM_TO_ADD;
                loading.current = false;
                setCurrentDate(monthsMap.get(currentIndex.current) ?? new Date());
            });
        }
        else if (loading.current && mutation.current == "append") {
            loading.current = false;
            mutation.current = null;
        }
    }, [months]);

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
                                width: dayWidth,
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

            <FlatList
                ref={ref}
                horizontal
                pagingEnabled
                decelerationRate="fast"
                scrollEventThrottle={16}
                windowSize={100}
                initialScrollIndex={INITIAL_RANGE}
                initialNumToRender={12}
                maxToRenderPerBatch={12}
                updateCellsBatchingPeriod={0}
                removeClippedSubviews={false}
                showsHorizontalScrollIndicator={false}
                data={months}
                keyExtractor={(item) => item.toISOString()}
                renderItem={renderItem}
                getItemLayout={getItemLayout}
                onMomentumScrollEnd={onMomentumScrollEnd}
                className="w-full h-full"
            />
        </View>
    );
});