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
    const { width: screenWidth } = useWindowDimensions();
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

    const renderItem = useCallback(({ item }: { item: Date }) => (
        <CalendarDay
            active={currentMonth.getTime() == item.getTime()}
            month={item}
        />
    ), [currentMonth]);

    const days = useMemo(() => (i18n.language == "fr" ?
        ["L", "M", "M", "J", "V", "S", "D"]
        :
        ["S", "M", "T", "W", "T", "F", "S"]
    ), [i18n.language]);

    const dayWidth = useMemo(() => ((screenWidth - 24) / 7), [screenWidth]);

    const listContainerAnimation = useAnimatedStyle(() => ({
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
                translateY: 120,
            }
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
                translateY: 120,
            }
        ]
    }));

    const nockMonthsAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: 58,
            },
            {
                translateY: 112,
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
                translateY: 112,
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

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / screenWidth);

        index < months.length && index >= 0 && setCurrentMonth(months[index]);

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
    }

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
    }, [months, loading]);

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

    return (
        <View className="w-screen flex items-center">
            <View className="w-full flex flex-row justify-center items-center gap-3">
                <PressableAnimated
                    scale={.95}
                    onPress={() => {
                        console.log("addable :", addable.current);
                        console.log("target month :", targetMonth.current);
                        console.log("Generating ref :", generating.current);
                        console.log("loading ref :", loadingRef.current);
                        console.log("current index :", indexRef.current);
                        console.log("Prepend :", prepend.current);
                        console.log("Months :", months.map(month => month.toString()));
                        console.log("Years :", years);
                    }}
                    className="w-[100px] h-[40px] flex justify-center items-center border dark:border-white/10 border-black/10 rounded-xl dark:bg-white/10 bg-white"
                >
                    <TextAnimated className="text-2xl font-bold tracking-widest dark:opacity-90 opacity-60">
                        Log
                    </TextAnimated>
                </PressableAnimated>

                <PressableAnimated
                    scale={.95}
                    onPress={() => {
                        reset();
                        generating.current = true;
                        prepend.current = false;
                        loadingRef.current = false;
                        targetMonth.current = null;
                        addable.current = true;
                    }}
                    className="w-[100px] h-[40px] flex justify-center items-center border dark:border-white/10 border-black/10 rounded-xl dark:bg-white/10 bg-white"
                >
                    <TextAnimated className="text-2xl font-bold tracking-widest dark:opacity-90 opacity-60">
                        reset
                    </TextAnimated>
                </PressableAnimated>

                <PressableAnimated
                    scale={.95}
                    // onPress={() => {
                    //     const today = new Date();
                    //     const index = months.findIndex(month => format(month, "MMMM yyyy") == format(today, "MMMM yyyy"));

                    //     flatListRef.current?.scrollToIndex({
                    //         index: index > 0 ? index : INITIAL_RANGE,
                    //         animated: false,
                    //     });
                    // }}
                    onPress={() => {
                        const date = new Date();

                        if (format(currentMonth, "MMMM yyyy") == format(date, "MMMM yyyy")) return;

                        const monthIndex = months.findIndex(m => format(m, "MMMM yyyy") == format(date, "MMMM yyyy"))

                        if (monthIndex == -1) {
                            generating.current = true;
                            addable.current = false;
                            generateMonths("year", date.getFullYear(), currentMonth);
                        }
                        else {
                            flatListRef.current?.scrollToIndex({
                                index: monthIndex,
                            });
                        }
                    }}
                    className="size-[60px] flex items-center border dark:border-white/10 border-black/10 rounded-xl dark:bg-white/10 bg-white"
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
                            size={15}
                            color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                        />
                    </View>

                    <View className="size-full flex flex-row justify-center items-end p-2 pt-6">
                        <TextAnimated className="text-4xl font-bold tracking-widest dark:opacity-90 opacity-60">
                            {new Date().getDate()}
                        </TextAnimated>
                    </View>
                </PressableAnimated>
            </View>

            <View className="w-full flex flex-row justify-center gap-3 px-3 mb-8 mt-5">
                <Pressable onPress={() => {
                    setListActive(true);
                    showMonthsList.value = true;
                    monthsFlatListRef.current?.scrollToIndex({
                        index: currentMonth.getMonth(),
                        animated: false,
                    });
                }}>
                    <TextAnimated className="text-xl font-bold tracking-widest">
                        {monthsTranslation[i18n.language == "fr" ? "fr" : "en"][currentMonth.getMonth()]}
                    </TextAnimated>
                </Pressable>

                <Pressable onPress={() => {
                    setListActive(true);
                    showYearsList.value = true;
                    currentYearIndex > 0 && yearsFlatListRef.current?.scrollToIndex({
                        index: currentYearIndex,
                        animated: false,
                    });
                }}>
                    <TextAnimated className="text-xl font-bold tracking-widest">
                        {currentMonth.getFullYear()}
                    </TextAnimated>
                </Pressable>
            </View>

            <View className="w-full flex flex-row justify-between px-[32px]">
                {
                    days.map((d, i) => (
                        <View
                            key={i}
                            style={{
                                width: dayWidth,
                            }}
                        >
                            <Text className="text-sm dark:text-gray-600 text-gray-400">
                                {d}
                            </Text>
                        </View>
                    ))
                }
            </View>

            <Animated.View
                style={listContainerAnimation}
                className="absolute left-0 top-0 w-screen h-screen flex items-center z-[10]"
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

                <View className="absolute w-[200px] flex">
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
                                initialNumToRender={years.length / 2}
                                removeClippedSubviews={false}
                                maxToRenderPerBatch={years.length / 2}
                                windowSize={Math.ceil(years.length / 2) > 0 ? Math.ceil(years.length / 2) : 1}
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
                windowSize={Math.ceil(months.length) > 0 ? Math.ceil(months.length) : 1}
                maxToRenderPerBatch={Math.ceil(months.length)}
                removeClippedSubviews={false}
                initialScrollIndex={INITIAL_RANGE}
                initialNumToRender={INITIAL_RANGE}
                showsHorizontalScrollIndicator={false}
                data={months}
                renderItem={renderItem}
                keyExtractor={(item) => item.toISOString()}
                getItemLayout={getItemLayout}
                onScroll={handleScroll}
                className="w-full h-full"
                contentContainerClassName="h-full"
            />
        </View>
    );
};