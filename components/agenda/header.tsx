import { monthsTranslation } from "@/constants/calendar";
import { CalendarType } from "@/hooks/agenda/use-calendar";
import { useTheme } from "@/hooks/use-theme";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import clsx from "clsx";
import { format, startOfMonth } from "date-fns";
import { memo, RefObject, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, FlatList, Pressable, View } from "react-native";
import Animated, { Easing, SharedValue, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { PressableAnimated } from "../pressable-animated";
import { TextAnimated } from "../text-animated";
import { event, HIDE_NAVBAR } from "@/lib/event-emitter";

interface Props {
    context: Pick<CalendarType, "months" | "years" | "generateMonths" | "loading">;
    monthsFlatListRef: RefObject<FlatList | null>;
    yearsFlatListRef: RefObject<FlatList | null>;
    currentMonth: Date;
    mutation: RefObject<"append" | "prepend" | "generate" | null>;
    flatListRef: RefObject<FlatList | null>;
    animationRef: RefObject<boolean>;
    searchSectionActive: SharedValue<boolean>;
}

export const CalendarHeader = memo(({ context, monthsFlatListRef, yearsFlatListRef, currentMonth, mutation, flatListRef, animationRef, searchSectionActive }: Props) => {
    const { theme } = useTheme();
    const showYearsList = useSharedValue<boolean>(false);
    const { months, years, generateMonths } = context;
    const { i18n } = useTranslation();
    const monthHeight = 30;
    const monthsGap = 12;
    const yearHeight = 30;
    const yearsGap = 12;
    const [listActive, setListActive] = useState<boolean>(false);
    const showMonthsList = useSharedValue<boolean>(false);
    const date = useMemo(() => new Date(), []);

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
        const currentDate = new Date(currentMonth.getFullYear(), index, 1);
        const monthData = monthsMap.get(currentDate.toLocaleString());

        return (
            <Pressable
                onPress={() => {
                    showMonthsList.value = false;
                    setListActive(false);
                    if (currentMonth.getMonth() == index) return;

                    if (!monthData) {
                        mutation.current = "generate";
                        animationRef.current = true;
                        generateMonths("month", index, currentMonth);
                    }
                    else {
                        flatListRef.current?.scrollToIndex({
                            index: monthData.index,
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
    }, [currentMonth, monthsMap]);

    const currentLanguage = useMemo(() => i18n.language == "fr" ? "fr" : "en", [i18n]);

    const renderYearsListItem = useCallback(({ item: year }: { item: number, index: number }) => {
        const date = new Date(year, currentMonth.getMonth(), currentMonth.getDate());
        const yearData = monthsMap.get(startOfMonth(date).toLocaleString());

        return (
            <Pressable
                onPress={() => {
                    showYearsList.value = false;
                    setListActive(false);

                    if (currentMonth.getFullYear() == year) return;

                    if (!yearData) {
                        mutation.current = "generate";
                        animationRef.current = true;
                        generateMonths("year", year, currentMonth);
                    }
                    else {
                        flatListRef.current?.scrollToIndex({
                            index: yearData?.index,
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
    }, [currentMonth, monthsMap]);

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

    const currentYearIndex = useMemo(() => {
        const index = years.findIndex(year => year == currentMonth.getFullYear());

        return index != -1 ? index : 0;
    }, [currentMonth]);

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

    return (
        <View className="w-full">
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
                        className="max-w-[70%]"
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
                        event.emit(HIDE_NAVBAR);
                        searchSectionActive.value = true;
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
                            if (format(currentMonth, "MMMM yyyy") == format(date, "MMMM yyyy")) return;
                            const month = monthsMap.get(startOfMonth(date).toLocaleString());

                            if (!month) {
                                mutation.current = "generate";
                                animationRef.current = true;
                                generateMonths("year", date.getFullYear());
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