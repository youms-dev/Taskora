import { useCalendar } from "@/hooks/agenda/use-calendar";
import { useTheme } from "@/hooks/use-theme";
import Entypo from "@expo/vector-icons/Entypo";
import clsx from "clsx";
import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Text, useWindowDimensions, View } from "react-native";
import { PressableAnimated } from "../pressable-animated";
import { TextAnimated } from "../text-animated";
import { CalendarDays, PADDING_X } from "./days";

export const Calendar = () => {
    const { t, i18n } = useTranslation();
    const [dayWidth, setDayWidth] = useState<number>(0);
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const { theme } = useTheme();
    const { months } = useCalendar();

    const days = useMemo(() => (i18n.language == "fr" ?
        ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
        :
        ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    ), [i18n.language]);

    useEffect(() => {
        setDayWidth((screenWidth / 7) - PADDING_X);
    }, [screenWidth]);

    const renderItem = useCallback(({ item: month, index }: { item: Date; index: number }) => {
        return (
            <View
                style={{
                    width: screenWidth,
                }}
                className="h-full"
            >
                <CalendarDays month={month} />
            </View>
        );
    }, [months]);

    const getItemLayout = useCallback((_data: unknown, index: number) => ({
        length: (screenWidth - PADDING_X),
        offset: index * (screenWidth - PADDING_X),
        index,
    }), [screenWidth]);

    return (
        <View className="size-full flex items-center">
            <View className="w-full flex flex-row justify-between items-center gap-2 mb-5 mt-3 px-3">
                <View className="size-[35px] dark:bg-black bg-white rounded-full">
                    <PressableAnimated className="size-full flex justify-center items-center dark:bg-white/10 bg-black/80 rounded-full border border-white/5">
                        <Entypo
                            name="chevron-left"
                            size={25}
                            color="rgba(255, 255, 255, .8)"
                        />
                    </PressableAnimated>
                </View>

                <View className="w-[60%] flex flex-row justify-center items-center px-3">
                    <TextAnimated
                        numberOfLines={1}
                        className="text-lg font-medium"
                    >
                        {format(currentDate, "MMMM yyyy")}
                    </TextAnimated>
                </View>

                <View className="size-[35px] dark:bg-black bg-white rounded-full">
                    <PressableAnimated className="size-full flex justify-center items-center dark:bg-white/10 bg-black/80 rounded-full border border-white/5">
                        <Entypo
                            name="chevron-right"
                            size={25}
                            color="rgba(255, 255, 255, .8)"
                        />
                    </PressableAnimated>
                </View>
            </View>

            <View className="w-full flex flex-row justify-center px-3 mb-5">
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

            <View className="w-full">
                <FlatList
                    horizontal
                    pagingEnabled
                    decelerationRate="fast"
                    scrollEventThrottle={16}
                    windowSize={100}
                    initialNumToRender={12}
                    maxToRenderPerBatch={12}
                    updateCellsBatchingPeriod={1}
                    removeClippedSubviews={false}
                    data={months}
                    keyExtractor={(item) => item.toISOString()}
                    renderItem={renderItem}
                    getItemLayout={getItemLayout}
                    className="w-full h-full"
                />
            </View>
        </View>
    );
}