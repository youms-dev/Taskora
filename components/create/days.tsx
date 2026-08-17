import { useTheme } from "@/hooks/use-theme";
import clsx from "clsx";
import { eachDayOfInterval, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Text, useWindowDimensions } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { PressableAnimated } from "../pressable-animated";

export const PADDING_X = 3;

interface Props {
    month: Date;
}

export const CalendarDays = ({ month }: Props) => {
    const { i18n } = useTranslation();
    const { width: screenWidth } = useWindowDimensions();
    const [selected, setSelected] = useState<number | null>(null);
    const selectedShared = useSharedValue<typeof selected>(null);
    const { theme } = useTheme();

    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(month), { weekStartsOn: i18n.language == "en" ? 0 : 1 });
        const end = endOfWeek(endOfMonth(month), { weekStartsOn: i18n.language == "en" ? 0 : 1 });
        const days = eachDayOfInterval({
            start,
            end,
        });

        return days;
    }, [i18n.language, month]);

    const renderItem = useCallback(({ item: date, index }: { item: Date; index: number }) => {
        const day = date.getDate();
        const isNotPartOfThisMonth = (String(day).length == 2 && index <= 5) || (String(day).length == 1 && index > days.length / 2);

        return (
            <PressableAnimated
                scale={.95}
                onPress={() => {
                    if (selected == index) {
                        setSelected(null);
                    }
                    else {
                        setSelected(index);
                    }
                }}
                style={{
                    width: (screenWidth / 7) - PADDING_X,
                }}
                className={clsx(
                    "flex flex-row justify-center rounded-full py-3",
                    !isNotPartOfThisMonth && selected == index && "bg-emerald-500",
                    isNotPartOfThisMonth && selected == index && "bg-emerald-500/60",
                )}
            >
                <Text className={clsx(
                    "text-xl",
                    date.getDay() != 0 && selected != index && "dark:text-white/80 text-black/80",
                    selected == index && "text-black font-extrabold",
                    selected != index && isNotPartOfThisMonth && date.getDay() != 0 && "opacity-30",
                    selected != index && isNotPartOfThisMonth && date.getDay() == 0 && "opacity-50",
                    selected != index && date.getDay() == 0 && "text-red-500/60",
                )}>
                    {day}
                </Text>
            </PressableAnimated>
        );
    }, [screenWidth, selected]);

    const getItemLayout = useCallback((_data: unknown, index: number) => ({
        length: (screenWidth / 7) - PADDING_X,
        offset: index * ((screenWidth / 7) - PADDING_X),
        index,
    }), [screenWidth]);

    useEffect(() => {
        selectedShared.value = selected;
    }, [selected]);

    return (
        <FlatList
            showsVerticalScrollIndicator={false}
            data={days}
            keyExtractor={(item) => item.toISOString()}
            numColumns={7}
            renderItem={renderItem}
            getItemLayout={getItemLayout}
            className="w-full h-full"
            contentContainerClassName="flex gap-3 px-3"
        />
    );
}