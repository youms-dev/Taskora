import { monthsTranslation } from "@/constants/calendar";
import { useTasks } from "@/hooks/database/use-tasks";
import { INITIAL_RANGE, useCalendar } from "@/hooks/use-calendar";
import { useTheme } from "@/hooks/use-theme";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { format } from "date-fns";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Text, useWindowDimensions, View } from "react-native";
import { PressableAnimated } from "../pressable-animated";
import { TextAnimated } from "../text-animated";
import { CalendarDay } from "./calendar-day";

export const Calendar = () => {
    const flatListRef = useRef<FlatList<Date>>(null);
    const { months, appendFutureMonths, prependPastMonths } = useCalendar();
    const { width: screenWidth } = useWindowDimensions();
    const { i18n } = useTranslation();
    const [currentMonth, setCurrentMonth] = useState<Date>(months[INITIAL_RANGE]);
    const { getTasks, getTasksByDate } = useTasks();
    const { theme } = useTheme();

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
                        index: index > 0 ? INITIAL_RANGE : index,
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
                <View className="">

                </View>
                <TextAnimated className="text-xl font-bold tracking-widest">
                    {monthsTranslation[i18n.language == "fr" ? "fr" : "en"][currentMonth.getMonth()]}
                </TextAnimated>

                <TextAnimated className="text-xl font-bold tracking-widest">
                    {currentMonth.getFullYear()}
                </TextAnimated>
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