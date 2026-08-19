import clsx from "clsx";
import { eachDayOfInterval, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Text } from "react-native";
import { PressableAnimated } from "../pressable-animated";

interface Props {
    month: Date;
    width: number;
    onDateChanged: (entry: Date) => void;
    targetDate: Date;
}

export const CalendarDays = memo(({ month, width, onDateChanged, targetDate }: Props) => {
    const { i18n } = useTranslation();

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
        const isPartOfThisMonth = date.getMonth() == month.getMonth();
        const selected = targetDate.toLocaleString() == date.toLocaleString();

        return (
            <PressableAnimated
                scale={.95}
                onPress={() => {
                    !selected && onDateChanged(date);
                }}
                style={{
                    width: (width / 7),
                }}
                className={clsx(
                    "flex flex-row justify-center rounded-full py-3",
                    isPartOfThisMonth && selected && "bg-emerald-500",
                    !isPartOfThisMonth && selected && "bg-emerald-500/60",
                )}
            >
                <Text className={clsx(
                    "text-xl",
                    date.getDay() != 0 && !selected && "dark:text-white/80 text-black/80",
                    selected && "text-black font-extrabold",
                    !selected && !isPartOfThisMonth && "opacity-50",
                    !selected && date.getDay() == 0 && "text-red-500/60",
                )}>
                    {day}
                </Text>
            </PressableAnimated>
        );
    }, [width, onDateChanged, targetDate]);

    const getItemLayout = useCallback((_data: unknown, index: number) => ({
        length: (width / 7),
        offset: index * (width / 7),
        index,
    }), [width]);

    return (
        <FlatList
            showsVerticalScrollIndicator={false}
            data={days}
            keyExtractor={(item) => item.toISOString()}
            numColumns={7}
            renderItem={renderItem}
            getItemLayout={getItemLayout}
            updateCellsBatchingPeriod={0}
            scrollEventThrottle={16}
            maxToRenderPerBatch={35}
            style={{
                width,
            }}
            className="h-full"
            contentContainerClassName="flex flex-col items-center gap-3 px-3"
        />
    );
});