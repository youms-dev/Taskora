import { monthsTranslation } from "@/constants/calendar";
import { useTasks } from "@/hooks/database/use-tasks";
import { INITIAL_RANGE, useCalendar } from "@/hooks/use-calendar";
import { useTheme } from "@/hooks/use-theme";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, Text, useWindowDimensions, View } from "react-native";
import { PressableAnimated } from "../pressable-animated";
import { TextAnimated } from "../text-animated";
import { CalendarDay } from "./calendar-day";
import AntDesign from "@expo/vector-icons/AntDesign";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

export const Calendar = () => {
    const flatListRef = useRef<FlatList<Date>>(null);
    const { months, appendFutureMonths, prependPastMonths } = useCalendar();
    const { width: screenWidth } = useWindowDimensions();
    const { i18n } = useTranslation();
    const [currentMonth, setCurrentMonth] = useState<Date>(months[INITIAL_RANGE]);
    const { getTasksByDate } = useTasks();
    const { theme } = useTheme();
    const showMonthsList = useSharedValue<boolean>(false);
    const monthsFlatListRef = useRef<FlatList>(null);
    const [years, setYears] = useState<number[]>([]);
    const showYearsList = useSharedValue<boolean>(true);
    const yearsFlatListRef = useRef<FlatList>(null);

    const renderItem = useCallback(({ item }: { item: Date }) => (
        <CalendarDay
            active={currentMonth.getTime() == item.getTime()}
            month={item}
        />
    ), [currentMonth]);

    const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / screenWidth);

        setCurrentMonth(months[index]);
        // futur
        if (index > months.length - 10) {
            appendFutureMonths();
        }

        // passé
        if (index < 10) {
            prependPastMonths();

            requestAnimationFrame(() => {
                flatListRef.current?.scrollToOffset({
                    offset: offsetX + screenWidth * 20,
                    animated: false,
                });
            });
        }
    };

    const days = useMemo(() => (i18n.language == "fr" ?
        ["L", "M", "M", "J", "V", "S", "D"]
        :
        ["S", "M", "T", "W", "T", "F", "S"]
    ), [i18n.language]);

    const dayWidth = useMemo(() => ((screenWidth - 24) / 7), [screenWidth]);

    const handleGetTasks = async (month: Date) => {
        try {
            const data = await getTasksByDate(month, 10, 0);

            console.log(data);
        }
        catch (e) {
            console.log(e);
        }
    };

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
                withTiming(200, {
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
                translateX: 80,
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
        const monthIndex = months.findIndex(month => format(month, "MMMM yyyy") == format(currentDate, "MMMM yyyy"));

        return (
            <Pressable
                onPress={() => {
                    showMonthsList.value = false;
                    flatListRef.current?.scrollToIndex({
                        index: monthIndex > 0 ? monthIndex : INITIAL_RANGE,
                        animated: true,
                    });
                }}
                className="w-full flex flex-row justify-between items-center gap-3"
            >
                <TextAnimated className="text-xl tracking-widest">
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
        const currentDate = new Date(year, 0, 1);
        const yearIndex = months.findIndex(month => +format(month, "yyyy") == +format(currentDate, "yyyy"));

        return (
            <Pressable
                onPress={() => {
                    showYearsList.value = false;
                    flatListRef.current?.scrollToIndex({
                        index: yearIndex > 0 ? yearIndex : INITIAL_RANGE,
                        animated: true,
                    });
                }}
                className="w-full flex flex-row justify-between items-center gap-3"
            >
                <TextAnimated className="text-xl tracking-widest">
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

    useEffect(() => {
        if (months.length > 0) {
            const years: number[] = months.map(month => +format(month, "yyyy"));
            const yearsFiltered = years.filter((year, i) => {
                return i == 0 || year != years[i - 1];
            });

            setYears(yearsFiltered);
        }
    }, [months]);

    return (
        <View className="w-screen flex items-center">
            {/* <PressableAnimated
                onPress={() => {
                    console.log(currentMonth.toString());
                }}
                className="w-[100px] h-[50px] flex justify-center items-center bg-red-500 rounded-2xl"
            >
                <Text className="text-2xl text-white">Clique</Text>
            </PressableAnimated> */}

            <PressableAnimated
                scale={.95}
                onPress={() => {
                    const today = new Date();
                    const index = months.findIndex(month => format(month, "MMMM yyyy") == format(today, "MMMM yyyy"));

                    flatListRef.current?.scrollToIndex({
                        index: index > 0 ? index : INITIAL_RANGE,
                        animated: true,
                    });
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

            <View className="w-full flex flex-row justify-center gap-3 px-3 mb-8 mt-5">
                <Pressable onPress={() => {
                    showMonthsList.value = true;
                    monthsFlatListRef.current?.scrollToIndex({
                        index: currentMonth.getMonth(),
                        animated: true,
                    });
                }}>
                    <TextAnimated className="text-xl font-bold tracking-widest">
                        {monthsTranslation[i18n.language == "fr" ? "fr" : "en"][currentMonth.getMonth()]}
                    </TextAnimated>
                </Pressable>

                <Pressable onPress={() => {
                    showYearsList.value = true;
                    // monthsFlatListRef.current?.scrollToIndex({
                    //     index: currentMonth.getMonth(),
                    //     animated: true,
                    // });

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
                        showMonthsList.value = false;
                        showYearsList.value = false;
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
                        <View className="size-full flex items-center dark:bg-white/10 bg-white rounded-xl border dark:border-white/10 border-white p-2 px-3 overflow-hidden">
                            <FlatList
                                ref={monthsFlatListRef}
                                showsVerticalScrollIndicator={false}
                                initialScrollIndex={currentMonth.getMonth()}
                                data={monthsTranslation[currentLanguage]}
                                keyExtractor={(month) => month}
                                renderItem={renderMonthsListItem}
                                getItemLayout={(_, index) => ({
                                    length: 30,
                                    offset: 30 * index,
                                    index,
                                })}
                                className="absolute w-full h-[200px]"
                                contentContainerClassName="flex gap-3 py-2"
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
                        <View className="size-full flex items-center dark:bg-white/10 bg-white rounded-xl border dark:border-white/10 border-white p-2 px-3 overflow-hidden">
                            <FlatList
                                ref={yearsFlatListRef}
                                showsVerticalScrollIndicator={false}
                                initialScrollIndex={currentMonth.getMonth()}
                                data={years}
                                keyExtractor={(year) => String(year)}
                                renderItem={renderYearsListItem}
                                getItemLayout={(_, index) => ({
                                    length: 30,
                                    offset: 30 * index,
                                    index,
                                })}
                                className="absolute w-full h-[200px]"
                                contentContainerClassName="flex gap-3 py-2"
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
                windowSize={INITIAL_RANGE / 2}
                maxToRenderPerBatch={INITIAL_RANGE / 2}
                removeClippedSubviews={false}
                initialScrollIndex={INITIAL_RANGE}
                initialNumToRender={INITIAL_RANGE}
                showsHorizontalScrollIndicator={false}
                data={months}
                renderItem={renderItem}
                keyExtractor={(item) => item.toISOString()}
                getItemLayout={(_, index) => ({
                    length: screenWidth,
                    offset: screenWidth * index,
                    index,
                })}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                className="w-full h-full"
                contentContainerClassName="h-full"
            />
        </View>
    );
};