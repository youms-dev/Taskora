import { monthsTranslation } from "@/constants/calendar";
import { CalendarType } from "@/hooks/agenda/use-calendar";
import { useTheme } from "@/hooks/use-theme";
import { FontAwesome6 } from "@expo/vector-icons";
import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { memo, RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, Text, useWindowDimensions, View } from "react-native";
import Animated, { Easing, FadeInDown, FadeOutDown } from "react-native-reanimated";
import { Modal } from "../modal";
import { PressableAnimated } from "../pressable-animated";
import { TextAnimated } from "../text-animated";

interface Props {
    context: CalendarType;
    date: Date;
    active: boolean;
    onClose: () => void;
    mutation: RefObject<"generate" | "append" | "prepend" | null>;
    animationRef: RefObject<boolean>;
    flatListRef: RefObject<FlatList | null>;
}

export const CalendarSelectDate = memo(({ context, date, active, onClose, mutation, animationRef, flatListRef }: Props) => {
    const { t, i18n } = useTranslation();
    const displayMonths = useMemo(() => monthsTranslation[i18n.language], [i18n.language]);
    const { height: screenHeight } = useWindowDimensions();
    const height = useMemo(() => screenHeight * .25, [screenHeight]);
    const itemHeight = useMemo(() => height / 3, [height]);
    const [currentDate, setCurrentDate] = useState<Date>(date);
    const { theme } = useTheme();
    const monthsFlatListRef = useRef<FlatList>(null);
    const yearsFlatListRef = useRef<FlatList>(null);
    const { years, generateMonths, months } = context;
    const [showSubmitButton, setShowSubmitButton] = useState<boolean>(false);

    const yearsMap = useMemo(() => {
        return (
            new Map(
                years.map((year, index) => [index, year]),
            )
        );
    }, [years]);

    const monthsMap = useMemo(() => {
        return (
            new Map(
                months.map((m, i) => [format(m, "yyyy-MM"), i]),
            )
        );
    }, [months]);

    const onMonthPress = useCallback((index: number) => {
        if (currentDate.getMonth() != index) {
            monthsFlatListRef.current?.scrollToIndex({
                index,
            });
        }
    }, [currentDate]);

    const onYearPress = useCallback((year: number, index: number) => {
        if (currentDate.getFullYear() != year) {
            yearsFlatListRef.current?.scrollToIndex({
                index,
            });
        }
    }, [currentDate]);

    const renderMonths = useCallback(({ item: month, index }: { item: string; index: number; }) => {
        return (
            <Pressable
                onPress={() => onMonthPress(index)}
                style={{
                    height: itemHeight,
                }}
                className="w-full flex flex-row items-center"
            >
                <TextAnimated
                    numberOfLines={1}
                    className="text-2xl"
                >
                    {month}
                </TextAnimated>
            </Pressable>
        );
    }, [displayMonths, itemHeight, onMonthPress]);

    const renderYears = useCallback(({ item: year, index }: { item: number; index: number; }) => {
        return (
            <Pressable
                onPress={() => onYearPress(year, index)}
                style={{
                    height: itemHeight,
                }}
                className="w-full flex flex-row items-center"
            >
                <TextAnimated
                    numberOfLines={1}
                    className="text-2xl"
                >
                    {year}
                </TextAnimated>
            </Pressable>
        );
    }, [displayMonths, itemHeight, onYearPress]);

    const getItemLayout = useCallback((_data: unknown, index: number) => ({
        length: itemHeight,
        offset: index * (itemHeight),
        index,
    }), [itemHeight]);

    const displayedDate = useMemo(() => {
        return monthsTranslation[i18n.language][currentDate.getMonth()] + " " + currentDate.getFullYear();
    }, [i18n.language, currentDate]);

    const onMomentumScrollMonthsEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const y = e.nativeEvent.contentOffset.y;
        const index = Math.round(y / itemHeight);

        setCurrentDate(prev => new Date(prev.getFullYear(), index, prev.getDate()));
    }, [itemHeight]);

    const onMomentumScrollYearsEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const y = e.nativeEvent.contentOffset.y;
        const index = Math.round(y / itemHeight);

        setCurrentDate(prev => new Date(yearsMap.get(index) ?? new Date().getFullYear(), prev.getMonth(), prev.getDate()));
    }, [itemHeight, yearsMap]);

    useEffect(() => {
        if (active) {
            const yearIndex = years.findIndex((year) => year == date.getFullYear());

            monthsFlatListRef.current?.scrollToIndex({
                index: date.getMonth(),
                animated: false,
            });

            yearsFlatListRef.current?.scrollToIndex({
                index: yearIndex == -1 ? 0 : yearIndex,
                animated: false,
            });

            setCurrentDate(date);
        }
    }, [date, years, active]);

    const submitDate = useCallback(() => {
        if (!active || !showSubmitButton || date.getTime() == currentDate.getTime()) {
            setShowSubmitButton(false);
            onClose();

            return;
        }
        const month = monthsMap.get(format(currentDate, "yyyy-MM"));

        if (month) {
            flatListRef.current?.scrollToIndex({
                index: month,
            });
            setShowSubmitButton(false);
            onClose();
        }
        else {
            mutation.current = "generate";
            animationRef.current = true;
            setShowSubmitButton(false);
            onClose();
            generateMonths(currentDate);
        }

    }, [currentDate, active, date, showSubmitButton, monthsMap]);

    useEffect(() => {
        if (active) {
            setShowSubmitButton(format(date, "yyyy-MM") != format(currentDate, "yyyy-MM"));
        }
    }, [currentDate, date, active]);

    return (
        <Modal
            active={active}
            height={screenHeight * .5}
            onClose={onClose}
            scrollableContent={false}
            animationDuration={500}
            closeAnimationDuration={500}
            closable={false}
            dragHandler={(
                <View className="w-full rounded-t-[30px] dark:bg-black bg-white">
                    <View className="w-full flex flex-row justify-between items-center py-2 px-3 pl-5 rounded-t-[30px] dark:bg-white/10 bg-white">
                        <View className="max-w-[80%]">
                            <TextAnimated
                                numberOfLines={1}
                                className="text-2xl font-medium tracking-widest"
                            >
                                {displayedDate}
                            </TextAnimated>
                        </View>

                        <PressableAnimated
                            scale={.95}
                            onPress={onClose}
                            className="size-[45px] flex justify-center items-center bg-black rounded-full"
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
                                className="absolute size-full dark:bg-black/50 bg-black/30 rounded-full"
                            />
                            <FontAwesome6
                                name="xmark"
                                size={25}
                                color="rgba(255, 255, 255, .8)"
                            />
                        </PressableAnimated>
                    </View>
                </View>
            )}
        >
            <View className="size-full flex justify-between items-center dark:bg-white/10 bg-white pt-20 pb-[80px]">
                <View
                    style={{
                        height,
                    }}
                    className="w-full flex flex-row items-center px-5"
                >

                    {/* Months */}

                    <View className="w-1/2 h-full flex items-center px-3">

                        {/* Top gradient */}

                        <View
                            style={{
                                height: itemHeight,
                            }}
                            className="absolute w-full z-[1] pointer-events-none"
                        >
                            <LinearGradient
                                colors={theme == "dark" ?
                                    ["rgba(0, 0, 0, .8)", "rgba(0, 0, 0, .8)", "rgba(0, 0, 0, .2)"]
                                    :
                                    ["rgba(255, 255, 255, .5)", "rgba(255, 255, 255, .5)", "rgba(255, 255, 255, 0)"]
                                }
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                                locations={[0, .6, 1]}
                                className="size-full"
                            >
                                <LinearGradient
                                    colors={theme == "dark" ?
                                        ["rgba(255, 255, 255, .084)", "rgba(255, 255, 255, .084)", "rgba(255, 255, 255, .025)"]
                                        :
                                        ["rgba(255, 255, 255, .5)", "rgba(255, 255, 255, .5)", "rgba(255, 255, 255, 0)"]
                                    }
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                    locations={[0, .6, 1]}
                                    className="size-full"
                                />
                            </LinearGradient>
                        </View>

                        {/* Bottom gradient */}

                        <View
                            style={{
                                height: itemHeight,
                            }}
                            className="absolute bottom-0 w-full z-[1] pointer-events-none"
                        >
                            <LinearGradient
                                colors={theme == "dark" ?
                                    ["rgba(0, 0, 0, .8)", "rgba(0, 0, 0, .8)", "rgba(0, 0, 0, .2)"]
                                    :
                                    ["rgba(255, 255, 255, .5)", "rgba(255, 255, 255, .5)", "rgba(255, 255, 255, 0)"]
                                }
                                start={{ x: 0, y: 1 }}
                                end={{ x: 0, y: 0 }}
                                locations={[0, .6, 1]}
                                className="size-full"
                            >
                                <LinearGradient
                                    colors={theme == "dark" ?
                                        ["rgba(255, 255, 255, .084)", "rgba(255, 255, 255, .084)", "rgba(255, 255, 255, .025)"]
                                        :
                                        ["rgba(255, 255, 255, .5)", "rgba(255, 255, 255, .5)", "rgba(255, 255, 255, 0)"]
                                    }
                                    start={{ x: 0, y: 1 }}
                                    end={{ x: 0, y: 0 }}
                                    locations={[0, .6, 1]}
                                    className="size-full"
                                />
                            </LinearGradient>
                        </View>

                        {/* Months list */}

                        <FlatList
                            ref={monthsFlatListRef}
                            horizontal={false}
                            showsVerticalScrollIndicator={false}
                            updateCellsBatchingPeriod={0}
                            scrollEventThrottle={16}
                            initialNumToRender={12}
                            maxToRenderPerBatch={12}
                            snapToInterval={itemHeight}
                            decelerationRate="fast"
                            removeClippedSubviews={false}
                            data={displayMonths}
                            keyExtractor={(item) => item}
                            renderItem={renderMonths}
                            getItemLayout={getItemLayout}
                            onMomentumScrollEnd={onMomentumScrollMonthsEnd}
                            className="w-full h-full"
                            contentContainerStyle={{
                                paddingVertical: itemHeight,
                            }}
                            contentContainerClassName="w-full flex"
                        />
                    </View>

                    {/* Years */}

                    <View className="w-1/2 h-full flex items-center px-3">

                        {/* Top gradient */}

                        <View
                            style={{
                                height: itemHeight,
                            }}
                            className="absolute w-full z-[1] pointer-events-none"
                        >
                            <LinearGradient
                                colors={theme == "dark" ?
                                    ["rgba(0, 0, 0, .8)", "rgba(0, 0, 0, .8)", "rgba(0, 0, 0, .2)"]
                                    :
                                    ["rgba(255, 255, 255, .5)", "rgba(255, 255, 255, .5)", "rgba(255, 255, 255, 0)"]
                                }
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                                locations={[0, .6, 1]}
                                className="size-full"
                            >
                                <LinearGradient
                                    colors={theme == "dark" ?
                                        ["rgba(255, 255, 255, .084)", "rgba(255, 255, 255, .084)", "rgba(255, 255, 255, .025)"]
                                        :
                                        ["rgba(255, 255, 255, .5)", "rgba(255, 255, 255, .5)", "rgba(255, 255, 255, 0)"]
                                    }
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                    locations={[0, .6, 1]}
                                    className="size-full"
                                />
                            </LinearGradient>
                        </View>

                        {/* Bottom gradient */}

                        <View
                            style={{
                                height: itemHeight,
                            }}
                            className="absolute bottom-0 w-full z-[1] pointer-events-none"
                        >
                            <LinearGradient
                                colors={theme == "dark" ?
                                    ["rgba(0, 0, 0, .8)", "rgba(0, 0, 0, .8)", "rgba(0, 0, 0, .2)"]
                                    :
                                    ["rgba(255, 255, 255, .5)", "rgba(255, 255, 255, .5)", "rgba(255, 255, 255, 0)"]
                                }
                                start={{ x: 0, y: 1 }}
                                end={{ x: 0, y: 0 }}
                                locations={[0, .6, 1]}
                                className="size-full"
                            >
                                <LinearGradient
                                    colors={theme == "dark" ?
                                        ["rgba(255, 255, 255, .084)", "rgba(255, 255, 255, .084)", "rgba(255, 255, 255, .025)"]
                                        :
                                        ["rgba(255, 255, 255, .5)", "rgba(255, 255, 255, .5)", "rgba(255, 255, 255, 0)"]
                                    }
                                    start={{ x: 0, y: 1 }}
                                    end={{ x: 0, y: 0 }}
                                    locations={[0, .6, 1]}
                                    className="size-full"
                                />
                            </LinearGradient>
                        </View>

                        {/* Years list */}

                        <FlatList
                            ref={yearsFlatListRef}
                            horizontal={false}
                            showsVerticalScrollIndicator={false}
                            updateCellsBatchingPeriod={0}
                            scrollEventThrottle={16}
                            windowSize={100}
                            initialNumToRender={100}
                            maxToRenderPerBatch={100}
                            snapToInterval={itemHeight}
                            decelerationRate="fast"
                            removeClippedSubviews={false}
                            data={years}
                            keyExtractor={(item) => String(item)}
                            renderItem={renderYears}
                            getItemLayout={getItemLayout}
                            onMomentumScrollEnd={onMomentumScrollYearsEnd}
                            className="w-full h-full"
                            contentContainerStyle={{
                                paddingVertical: itemHeight,
                            }}
                            contentContainerClassName="w-full flex"
                        />
                    </View>
                </View>

                {/* Submit button */}

                {
                    showSubmitButton && (
                        <Animated.View
                            entering={FadeInDown
                                .duration(300)
                                .easing(Easing.inOut(Easing.quad))
                            }
                            exiting={FadeOutDown
                                .duration(300)
                                .easing(Easing.inOut(Easing.quad))
                            }
                            className="w-2/3 sm:w-[250px] h-[50px]"
                        >
                            <PressableAnimated
                                scale={.95}
                                onPress={submitDate}
                                className="size-full flex justify-center items-center bg-black rounded-3xl"
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
                                    className="absolute size-full dark:bg-black/50 bg-black/30 rounded-3xl"
                                />

                                <Text
                                    numberOfLines={1}
                                    className="text-xl text-white/80 font-bold tracking-wider"
                                >
                                    {t("agenda_modal_submit")}
                                </Text>
                            </PressableAnimated>
                        </Animated.View>
                    )
                }
            </View>
        </Modal>
    );
});