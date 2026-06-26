import { INITIAL_RANGE, useHorizontalCalendar } from "@/hooks/use-calendar";
import { useCallback, useMemo, useRef, useState } from "react";
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Text, useWindowDimensions, View } from "react-native";
import { CalendarDay } from "./calendar-day";
import { PressableAnimated } from "../pressable-animated";
import { TextAnimated } from "../text-animated";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { monthsTranslation } from "@/constants/calendar";

export const Calendar = () => {
    const flatListRef = useRef<FlatList<Date>>(null);
    const { months, appendFutureMonths, prependPastMonths } = useHorizontalCalendar();
    const { width } = useWindowDimensions();
    const { i18n } = useTranslation();
    const [currentMonth, setCurrentMonth] = useState<number>(months[INITIAL_RANGE].getMonth());

    const renderItem = useCallback(({ item }: { item: Date }) => (
        <CalendarDay month={item} />
    ), []);

    const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / width);

        setCurrentMonth(months[index].getMonth());
        // futur
        if (index > months.length - 10) {
            appendFutureMonths();
        }

        // passé
        if (index < 10) {
            prependPastMonths();

            requestAnimationFrame(() => {
                flatListRef.current?.scrollToOffset({
                    offset: offsetX + width * 20,
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

    return (
        <View className="w-full flex items-center">
            <View className="w-full flex flex-row justify-center px-3 mb-8 mt-5">
                <TextAnimated className="text-xl font-bold tracking-widest">
                    {monthsTranslation[i18n.language == "fr" ? "fr" : "en"][currentMonth]}
                </TextAnimated>
            </View>

            <View className="w-full flex flex-row justify-between px-[32px]">
                {
                    days.map((d, i) => (
                        <Text
                            key={i}
                            className="text-sm text-gray-600"
                        >
                            {d}
                        </Text>
                    ))
                }
            </View>

            <FlatList
                ref={flatListRef}
                data={months}
                horizontal
                pagingEnabled
                renderItem={renderItem}
                keyExtractor={(item) => item.toISOString()}
                showsHorizontalScrollIndicator={false}
                getItemLayout={(_, index) => ({
                    length: width,
                    offset: width * index,
                    index,
                })}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                windowSize={10}
                maxToRenderPerBatch={10}
                removeClippedSubviews={false}
                initialScrollIndex={INITIAL_RANGE}
                className="w-full h-full"
            />
        </View>
    );
};