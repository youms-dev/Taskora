import { CALENDAR_HORIZONTAL_PADDING } from "@/hooks/use-calendar";
import clsx from "clsx";
import { format, isSameMonth, isToday } from "date-fns";
import { memo } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import { generateMonthDays } from "../../utils/calendar";
import { TextAnimated } from "../text-animated";

interface Props {
    month: Date;
};

export const CalendarMonth = memo(({ month }: Props) => {
    const days = generateMonthDays(month);
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const DAY_SIZE = (SCREEN_WIDTH - CALENDAR_HORIZONTAL_PADDING) / 7;

    return (
        <View className="w-screen p-3">

            {/* HEADER */}
            <TextAnimated className="text-lg font-bold mb-3 text-center">
                {format(month, "MMMM yyyy")}
            </TextAnimated>

            {/* WEEK HEADER */}
            <View className="flex-row mb-2">
                {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                    <Text
                        key={`${d}-${i}`}
                        style={{
                            width: DAY_SIZE,
                        }}
                        className="text-center text-gray-500 text-xs"
                    >
                        {d}
                    </Text>
                ))}
            </View>

            {/* GRID */}
            <View className="flex-row flex-wrap">
                {days.map((day) => {
                    const today = isToday(day);

                    return (
                        <View
                            key={day.toISOString()}
                            style={{
                                width: DAY_SIZE,
                                height: DAY_SIZE,
                            }}
                            className="items-center justify-center"
                        >
                            <Text
                                className={clsx(
                                    "text-sm",
                                    today
                                        ? "text-emerald-500"
                                        : "dark:text-white/80 text-black/80"
                                )}
                            >
                                {format(day, "d")}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
});