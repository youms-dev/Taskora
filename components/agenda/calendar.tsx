import { monthsTranslation } from "@/constants/calendar";
import { INITIAL_RANGE, NUM_TO_ADD, useCalendar } from "@/hooks/agenda/use-calendar";
import { useTheme } from "@/hooks/use-theme";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import clsx from "clsx";
import { format, startOfMonth } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, Text, useWindowDimensions, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { PressableAnimated } from "../pressable-animated";
import { TextAnimated } from "../text-animated";
import { CalendarDay } from "./calendar-day";

export const Calendar = () => {
    const flatListRef = useRef<FlatList<Date>>(null);
    const { months, appendFutureMonths, prependPastMonths, loading, reset, years, generateMonths } = useCalendar();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const { i18n } = useTranslation();
    const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
    const { theme } = useTheme();
    const showMonthsList = useSharedValue<boolean>(false);
    const monthsFlatListRef = useRef<FlatList>(null);
    const showYearsList = useSharedValue<boolean>(false);
    const yearsFlatListRef = useRef<FlatList>(null);
    const loadingRef = useRef<boolean>(false);
    const indexRef = useRef<number>(0);
    const prepend = useRef<boolean>(false);
    const monthHeight = 30;
    const monthsGap = 12;
    const yearHeight = 30;
    const yearsGap = 12;
    const [listActive, setListActive] = useState<boolean>(false);
    const generating = useRef<boolean>(false);
    const targetMonth = useRef<Date>(null);
    const addable = useRef<boolean>(true);
    const addableTimeout = useRef<ReturnType<typeof setTimeout>>(null);

    const mounted = useRef<boolean>(false);
    const mutation = useRef<"append" | "prepend" | "generate">(null);
    const calendarHeight = screenHeight * .8;
    const [calendarWidth, setViewWidth] = useState<number>(screenWidth);

    const monthsMap = useMemo(() => {
        return (
            new Map(
                months.map((m, i) => [i, m]),
            )
        );
    }, [months]);

    if (!mounted.current) {
        mutation.current = "generate";
        generateMonths("month", new Date().getMonth(), new Date());
        mounted.current = true;
    }

    const renderItem = useCallback(({ item }: { item: Date }) => (
        <CalendarDay
            active={currentMonth.getTime() == item.getTime()}
            month={item}
            width={calendarWidth}
            height={calendarHeight}
        />
    ), [currentMonth, calendarWidth, calendarHeight]);

    const days = useMemo(() => (i18n.language == "fr" ?
        ["L", "M", "M", "J", "V", "S", "D"]
        :
        ["S", "M", "T", "W", "T", "F", "S"]
    ), [i18n.language]);

    const dayWidth = useMemo(() => (screenWidth / 7), [screenWidth]);

    const listsContainerAnimation = useAnimatedStyle(() => ({
        opacity: (showMonthsList.value || showYearsList.value) ? 1 : 0,
        pointerEvents: (showMonthsList.value || showYearsList.value) ? "auto" : "none",
    }));

    const monthsListAnimation = useAnimatedStyle(() => ({
        opacity: showMonthsList.value ?
            withTiming(1, {
                duration: 200,
                easing: Easing.inOut(Easing.quad),
            })
            :
            0,
        height: showMonthsList.value ?
            withDelay(
                0,
                withTiming(200, {
                    duration: 400,
                    easing: Easing.inOut(Easing.quad),
                })
            )
            :
            0,
        transform: [
            {
                translateX: 15,
            },
            {
                translateY: 75,
            },
        ]
    }));

    const yearsListAnimation = useAnimatedStyle(() => ({
        opacity: showYearsList.value ?
            withTiming(1, {
                duration: 200,
                easing: Easing.inOut(Easing.quad),
            })
            :
            0,
        height: showYearsList.value ?
            withDelay(
                0,
                withTiming(205, {
                    duration: 400,
                    easing: Easing.inOut(Easing.quad),
                })
            )
            :
            0,
        transform: [
            {
                translateX: 50,
            },
            {
                translateY: 70,
            }
        ]
    }));

    const nockMonthsAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: 30,
            },
            {
                translateY: 65,
            },
            {
                rotate: "45deg",
            },
        ],
        opacity: showMonthsList.value ?
            withTiming(1, {
                duration: 200,
                easing: Easing.inOut(Easing.quad),
            })
            :
            0,
    }));

    const nockYearsAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: 95,
            },
            {
                translateY: 60,
            },
            {
                rotate: "45deg",
            },
        ],
        opacity: showYearsList.value ?
            withTiming(1, {
                duration: 200,
                easing: Easing.inOut(Easing.quad),
            })
            :
            0,
    }));

    const renderMonthsListItem = useCallback(({ item: month, index }: { item: string, index: number }) => {
        const year = currentMonth.getFullYear();
        const currentDate = new Date(year, index, 1);
        const monthIndex = months.findIndex(m => format(m, "MMMM yyyy") == format(currentDate, "MMMM yyyy"));

        return (
            <Pressable
                onPress={() => {
                    showMonthsList.value = false;
                    setListActive(false);

                    if (currentMonth.getMonth() == index) return;

                    if (monthIndex == -1) {
                        generating.current = true;
                        addable.current = false;
                        generateMonths("month", index, currentMonth);
                    }
                    else {
                        targetMonth.current = new Date(currentMonth.getFullYear(), index, currentMonth.getDate());
                        flatListRef.current?.scrollToIndex({
                            index: monthIndex,
                        });
                    }
                }}
                className="w-full h-[30px] flex flex-row justify-between items-center gap-3"
            >
                <TextAnimated className={clsx(
                    "text-xl tracking-widest",
                    currentMonth.getMonth() == index && "font-extrabold tracking-widest",
                )}>
                    {month}
                </TextAnimated>

                {
                    currentMonth.getMonth() == index && (
                        <View className="opacity-80">
                            <AntDesign
                                name="check"
                                size={20}
                                color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                            />
                        </View>
                    )
                }
            </Pressable>
        );
    }, [currentMonth]);

    const currentLanguage = useMemo(() => i18n.language == "fr" ? "fr" : "en", [i18n]);

    const renderYearsListItem = useCallback(({ item: year }: { item: number, index: number }) => {
        const yearIndex = months.findIndex(month => month.getFullYear() == year);

        return (
            <Pressable
                onPress={() => {
                    showYearsList.value = false;
                    setListActive(false);

                    if (currentMonth.getFullYear() == year) return;

                    if (yearIndex == -1) {
                        generating.current = true;
                        addable.current = false;
                        generateMonths("year", year, currentMonth);
                    }
                    else {
                        flatListRef.current?.scrollToIndex({
                            index: yearIndex,
                        });
                    }
                }}
                className="w-full h-[30px] flex flex-row justify-between items-center gap-3"
            >
                <TextAnimated className={clsx(
                    "text-xl tracking-widest",
                    currentMonth.getFullYear() == year && "font-extrabold tracking-widest",
                )}>
                    {year}
                </TextAnimated>

                {
                    currentMonth.getFullYear() == year && (
                        <View className="opacity-80">
                            <AntDesign
                                name="check"
                                size={20}
                                color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                            />
                        </View>
                    )
                }
            </Pressable>
        );
    }, [currentMonth]);

    const onMomentumScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / screenWidth);

        setCurrentMonth(monthsMap.get(index) ?? new Date());

        indexRef.current = index;

        if (loadingRef.current || generating.current || !addable.current) return;

        if (
            index < INITIAL_RANGE
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
            console.log("prepend");
            loadingRef.current = true;
            prepend.current = true;
            prependPastMonths();
        }

        if (
            index >= (months.length - INITIAL_RANGE)
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
            console.log("append");
            loadingRef.current = true;
            appendFutureMonths();
        }
    }, [monthsMap]);

    useEffect(() => {
        addableTimeout.current && clearTimeout(addableTimeout.current);
        if (!loading && loadingRef.current && prepend.current) {
            const targetIndex = indexRef.current + NUM_TO_ADD;

            if (targetMonth.current) {
                const index = months.findIndex(m => format(m, "MMMM yyyy") == format(targetMonth.current!, "MMMM yyyy"));

                if (index == -1) {
                    flatListRef.current?.scrollToIndex({
                        index: targetIndex,
                        animated: false,
                    });
                }
                else {
                    flatListRef.current?.scrollToIndex({
                        index,
                        animated: false,
                    });
                }
            }
            else {
                flatListRef.current?.scrollToIndex({
                    index: targetIndex,
                    animated: false,
                });
            }
            targetMonth.current = null;
            loadingRef.current = false;
            prepend.current = false;
        }
        else if (!loading && loadingRef.current && !prepend.current) {
            targetMonth.current = null;
            loadingRef.current = false;
        }
        else if (generating.current) {
            setCurrentMonth(months[INITIAL_RANGE]);
            generating.current = false;
            loadingRef.current = false;
            flatListRef.current?.scrollToIndex({
                index: INITIAL_RANGE,
                animated: false,
            });
            addableTimeout.current = setTimeout(() => {
                addable.current = true;
            }, 500);
        }
    }, [months]);

    const currentYearIndex = useMemo(() => {
        const index = years.findIndex(year => year == currentMonth.getFullYear());

        return index != -1 ? index : 0;
    }, [currentMonth]);

    useEffect(() => {
        const onBackPress = () => {
            if (listActive) {
                setListActive(false);
                showMonthsList.value = false;
                showYearsList.value = false;

                monthsFlatListRef.current?.scrollToIndex({
                    index: currentMonth.getMonth(),
                    animated: false,
                });
                currentYearIndex > 0 && yearsFlatListRef.current?.scrollToIndex({
                    index: currentYearIndex,
                    animated: false,
                });

                return true;
            }
            return false;
        }

        const { remove } = BackHandler.addEventListener("hardwareBackPress", onBackPress);

        return () => remove();
    }, [listActive]);

    const monthsGetItemLayout = useCallback((data: unknown, index: number) => ({
        length: (monthHeight + monthsGap),
        offset: (monthHeight + monthsGap) * index,
        index,
    }), [monthHeight, monthsGap]);

    const yearsGetItemLayout = useCallback((data: unknown, index: number) => ({
        length: (yearHeight + yearsGap),
        offset: (yearHeight + yearsGap) * index,
        index,
    }), [yearHeight, yearsGap]);

    const getItemLayout = useCallback((data: unknown, index: number) => ({
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
                        width: dayWidth - 1,
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

    return (
        <View className="w-full flex items-center">
            <View className="w-full flex flex-row justify-between mb-3 py-2">
                <View className="w-[60%] h-full flex flex-row items-center gap-3 px-3">
                    <Pressable
                        onPress={() => {
                            setListActive(true);
                            showMonthsList.value = true;
                            monthsFlatListRef.current?.scrollToIndex({
                                index: currentMonth.getMonth(),
                                animated: false,
                            });
                        }}
                        className="max-w-[50%]"
                    >
                        <TextAnimated
                            numberOfLines={1}
                            className="text-2xl font-bold tracking-widest"
                        >
                            {monthsTranslation[i18n.language == "fr" ? "fr" : "en"][currentMonth.getMonth()]}
                        </TextAnimated>
                    </Pressable>

                    <Pressable
                        onPress={() => {
                            setListActive(true);
                            showYearsList.value = true;
                            currentYearIndex > 0 && yearsFlatListRef.current?.scrollToIndex({
                                index: currentYearIndex,
                                animated: false,
                            });
                        }}
                        className="max-w-[30%]"
                    >
                        <TextAnimated
                            numberOfLines={1}
                            className="text-2xl font-bold tracking-widest"
                        >
                            {currentMonth.getFullYear()}
                        </TextAnimated>
                    </Pressable>
                </View>

                <View className="w-[35%] h-full flex flex-row justify-end items-center gap-8 px-3">
                    <PressableAnimated onPress={() => {
                    }}>
                        <FontAwesome5
                            name="search"
                            size={25}
                            color={theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)"}
                        />
                    </PressableAnimated>

                    <PressableAnimated
                        scale={.95}
                        onPress={() => {
                            console.log(months.length);
                        }}
                        // onPress={() => {
                        //     const date = new Date();

                        //     if (format(currentMonth, "MMMM yyyy") == format(date, "MMMM yyyy")) return;

                        //     const monthIndex = months.findIndex(m => format(m, "MMMM yyyy") == format(date, "MMMM yyyy"))

                        //     if (monthIndex == -1) {
                        //         generating.current = true;
                        //         addable.current = false;
                        //         generateMonths("year", date.getFullYear(), currentMonth);
                        //     }
                        //     else {
                        //         flatListRef.current?.scrollToIndex({
                        //             index: monthIndex,
                        //         });
                        //     }
                        // }}
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

            <View className="w-full flex flex-row justify-center mb-2">
                {displayedDays()}
            </View>

            <Animated.View
                style={listsContainerAnimation}
                className="absolute left-0 top-0 w-screen h-screen flex z-[10]"
            >
                <Pressable
                    onPress={() => {
                        setListActive(false);
                        showMonthsList.value = false;
                        showYearsList.value = false;

                        monthsFlatListRef.current?.scrollToIndex({
                            index: currentMonth.getMonth(),
                            animated: false,
                        });
                        currentYearIndex > 0 && yearsFlatListRef.current?.scrollToIndex({
                            index: currentYearIndex,
                            animated: false,
                        });
                    }}
                    className="w-full h-full dark:bg-black/50"
                />

                <View className="absolute w-[200px]">
                    <Animated.View
                        style={nockMonthsAnimation}
                        className="absolute left-0 top-0 size-[30px] dark:bg-black bg-white"
                    >
                        <View className="size-full dark:bg-white/10 bg-white border dark:border-white/10 border-black/10" />
                    </Animated.View>

                    <Animated.View
                        style={monthsListAnimation}
                        className="dark:bg-black bg-black rounded-xl z-[1px]"
                    >
                        <View
                            style={{
                                transform: [
                                    {
                                        translateY: 8,
                                    }
                                ],
                                filter: "blur(5px)"
                            }}
                            className="absolute bottom-0 w-full h-full bg-black/30 -z-[1] rounded-xl"
                        />

                        <View className="size-full flex items-center dark:bg-white/10 bg-white rounded-xl border dark:border-white/10 border-white p-2 px-3 overflow-hidden">
                            <FlatList
                                ref={monthsFlatListRef}
                                showsVerticalScrollIndicator={false}
                                initialScrollIndex={currentMonth.getMonth()}
                                data={monthsTranslation[currentLanguage]}
                                keyExtractor={(month) => month}
                                renderItem={renderMonthsListItem}
                                getItemLayout={monthsGetItemLayout}
                                scrollEventThrottle={16}
                                updateCellsBatchingPeriod={0}
                                removeClippedSubviews={false}
                                className="absolute w-full h-[200px]"
                                contentContainerStyle={{
                                    gap: monthsGap,
                                }}
                                contentContainerClassName="flex py-2"
                            />
                        </View>
                    </Animated.View>
                </View>

                <View className="absolute w-[150px] flex">
                    <Animated.View
                        style={nockYearsAnimation}
                        className="absolute left-0 top-0 size-[30px] dark:bg-black bg-white"
                    >
                        <View className="size-full dark:bg-white/10 bg-white border dark:border-white/10 border-black/10" />
                    </Animated.View>

                    <Animated.View
                        style={yearsListAnimation}
                        className="dark:bg-black bg-black rounded-xl z-[1px]"
                    >
                        <View
                            style={{
                                transform: [
                                    {
                                        translateY: 8,
                                    }
                                ],
                                filter: "blur(5px)"
                            }}
                            className="absolute bottom-0 w-full h-full bg-black/30 -z-[1] rounded-xl"
                        />

                        <View className="size-full flex items-center dark:bg-white/10 bg-white rounded-xl border dark:border-white/10 border-white p-2 px-3 overflow-hidden">
                            <FlatList
                                ref={yearsFlatListRef}
                                showsVerticalScrollIndicator={false}
                                data={years}
                                keyExtractor={(year) => String(year)}
                                renderItem={renderYearsListItem}
                                initialScrollIndex={currentYearIndex}
                                scrollEventThrottle={16}
                                initialNumToRender={200}
                                removeClippedSubviews={false}
                                maxToRenderPerBatch={100}
                                windowSize={100}
                                updateCellsBatchingPeriod={0}
                                className="absolute w-full h-[200px]"
                                getItemLayout={yearsGetItemLayout}
                                contentContainerStyle={{
                                    gap: yearsGap,
                                }}
                                contentContainerClassName="flex py-2"
                            />
                        </View>
                    </Animated.View>
                </View>
            </Animated.View>

            <FlatList
                ref={flatListRef}
                horizontal
                pagingEnabled
                scrollEventThrottle={16}
                windowSize={100}
                updateCellsBatchingPeriod={0}
                maxToRenderPerBatch={12}
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
        </View>
    );
};