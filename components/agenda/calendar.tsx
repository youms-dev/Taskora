import { CalendarType, INITIAL_RANGE, NUM_TO_ADD } from "@/hooks/agenda/use-calendar";
import clsx from "clsx";
import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Text, useWindowDimensions, View } from "react-native";
import { Easing, SharedValue, withTiming } from "react-native-reanimated";
import { CalendarDay } from "./calendar-day";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { THRESHOLD } from "./calendar-header";

interface Props {
    context: CalendarType;
    currentMonth: Date;
    setCurrentMonth: (value: Date) => void;
    mutation: RefObject<"append" | "prepend" | "generate" | null>;
    flatListRef: RefObject<FlatList | null>;
    setTargetDate: (entry: Date | null) => void;
    refreshing: SharedValue<boolean>;
    translateY: SharedValue<number>;
}

export const Calendar = ({ context, currentMonth, setCurrentMonth, mutation, flatListRef, setTargetDate, refreshing, translateY }: Props) => {
    const { months, appendFutureMonths, prependPastMonths, loading, years } = context;
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const { i18n } = useTranslation();
    const indexRef = useRef<number>(0);
    const calendarHeight = screenHeight * .8;
    const [calendarWidth, setViewWidth] = useState<number>(screenWidth);

    const monthsMap = useMemo(() => {
        return (
            new Map(
                months.map((m, i) => [i, m]),
            )
        );
    }, [months]);

    const renderItem = useCallback(({ item }: { item: Date }) => (
        <CalendarDay
            active={currentMonth.getTime() == item.getTime()}
            month={item}
            width={calendarWidth}
            height={calendarHeight}
            setTargetDate={setTargetDate}
            refreshing={refreshing}
        />
    ), [currentMonth, calendarWidth, calendarHeight, setTargetDate]);

    const days = useMemo(() => (i18n.language == "fr" ?
        ["L", "M", "M", "J", "V", "S", "D"]
        :
        ["S", "M", "T", "W", "T", "F", "S"]
    ), [i18n.language]);

    const dayWidth = useMemo(() => (screenWidth / 7) - 3, [screenWidth]);

    const onMomentumScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / screenWidth);

        setCurrentMonth(monthsMap.get(index) ?? new Date());
        indexRef.current = index;

        if (loading.current || mutation.current) return;

        if (
            index <= 5
            &&
            (
                (
                    months[0].getMonth() > 0
                    &&
                    months[0].getFullYear() == years[0]
                )
                ||
                months[0].getFullYear() > years[0]
            )
        ) {
            mutation.current = "prepend";
            prependPastMonths();
        }

        if (
            index >= (months.length - 5)
            &&
            (
                (
                    months[months.length - 1].getMonth() < 11
                    &&
                    months[months.length - 1].getFullYear() == years[years.length - 1]
                )
                ||
                months[months.length - 1].getFullYear() < years[years.length - 1]
            )
        ) {
            mutation.current = "append";
            appendFutureMonths();
        }
    }, [monthsMap]);

    const getItemLayout = useCallback((_data: unknown, index: number) => ({
        length: screenWidth,
        offset: screenWidth * index,
        index,
    }), [screenWidth]);

    const displayedDays = useCallback(() => {
        return (
            days.map((d, i) => (
                <View
                    key={i}
                    style={{
                        width: dayWidth,
                    }}
                    className="flex items-center"
                >
                    <Text className={clsx(
                        "text-sm",
                        (i == 0 && i18n.language == "en") || (i == 6 && i18n.language == "fr") ? "dark:text-red-500/50 text-red-500/70" : "dark:text-gray-600 text-gray-500",
                    )}>
                        {d}
                    </Text>
                </View>
            ))
        );
    }, [dayWidth, i18n.language]);

    useEffect(() => {
        if (loading.current && mutation.current == "prepend") {
            const targetIndex = indexRef.current + NUM_TO_ADD;

            flatListRef.current?.scrollToIndex({
                index: targetIndex,
                animated: false,
            });

            requestAnimationFrame(() => {
                setCurrentMonth(monthsMap.get(targetIndex) ?? new Date());
                loading.current = false;
                mutation.current = null;
            });
        }
        else if (loading.current && mutation.current == "append") {
            loading.current = false;
            mutation.current = null;
        }
        else if (loading.current && mutation.current == "generate") {
            flatListRef.current?.scrollToIndex({
                index: INITIAL_RANGE,
                animated: false,
            });
            setCurrentMonth(months[INITIAL_RANGE]);
            mutation.current = null;
            loading.current = false;
        }
    }, [monthsMap]);

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

    return (
        <View className="w-full flex items-center">
            <View className="w-full flex flex-row justify-center mb-2">
                {displayedDays()}
            </View>

            <GestureDetector gesture={panGesture}>
                <FlatList
                    ref={flatListRef}
                    horizontal
                    pagingEnabled
                    scrollEventThrottle={16}
                    windowSize={100}
                    updateCellsBatchingPeriod={0}
                    maxToRenderPerBatch={24}
                    removeClippedSubviews={false}
                    initialScrollIndex={INITIAL_RANGE}
                    initialNumToRender={INITIAL_RANGE}
                    showsHorizontalScrollIndicator={false}
                    data={months}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.toISOString()}
                    getItemLayout={getItemLayout}
                    onMomentumScrollEnd={onMomentumScrollEnd}
                    onLayout={(e) => setViewWidth(e.nativeEvent.layout.width)}
                    className="w-full"
                    style={{
                        height: calendarHeight,
                    }}
                    contentContainerClassName="h-full"
                />
            </GestureDetector>
        </View>
    );
};