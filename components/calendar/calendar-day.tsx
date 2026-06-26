import { COLORS } from "@/constants/colors";
import clsx from "clsx";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isToday, startOfMonth, startOfWeek } from "date-fns";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Text, useWindowDimensions, View } from "react-native";
import { PressableAnimated } from "../pressable-animated";
import { TextAnimated } from "../text-animated";

interface Props {
    month: Date;
};

const generateMonthDays = (month: Date, lang: "en" | 'fr' = "en"): Date[] => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: lang == "en" ? 0 : 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: lang == "en" ? 0 : 1 });
    // const start = startOfMonth(month);
    // const end = endOfMonth(month);

    return eachDayOfInterval({ start, end });
};

export const CalendarDay = memo(({ month }: Props) => {
    const { i18n } = useTranslation();
    const days = generateMonthDays(month, i18n.language == "en" || i18n.language == "fr" ? i18n.language : "en");
    const { width: screenWidth } = useWindowDimensions();
    const day_width = (screenWidth - 24) / 7;

    return (
        <View className="w-screen h-[88%] px-3 py-2">
            {/* <PressableAnimated
                scale={.95}
                onPress={() => {
                    // console.log(month.toDateString());
                    // console.log(days.map(d => d.toDateString()));
                    console.log((new Date()).toDateString());
                    console.log(generateMonthDays(addMonths(new Date(), 0)).map(d => d.toDateString()));
                }}
                className="w-[200px] h-[60px] flex justify-center items-center rounded-2xl bg-red-500"
            >
                <Text className="text-2xl text-white font-bold">
                    Clique
                </Text>
            </PressableAnimated> */}

            {/* GRID */}
            <View className="flex-row flex-wrap gap-[10px_0]">
                {
                    days.map((day, i) => {
                        const today = isToday(day);
                        const isNotPartOfThisMonth = (format(day, "d").length == 2 && i <= 5) || (format(day, "d").length == 1 && i > days.length / 2);
                        // console.log(isNotPartOfThisMonth)
                        if (i >= 35) return;

                        return (
                            <View
                                key={day.toISOString()}
                                style={{
                                    width: day_width,
                                    height: "45%",
                                }}
                                className="flex items-center py-2"
                            >
                                <TextAnimated
                                    dark={today ? COLORS.emerald[500] : "rgba(255, 255, 255, .8)"}
                                    light={today ? COLORS.emerald[500] : "rgba(0, 0, 0, .9)"}
                                    className={clsx(
                                        today && "font-bold tracking-widest",
                                        // (format(day, "d").length == 2 && i <= 5) && "opacity-50",
                                        isNotPartOfThisMonth && "opacity-50",
                                    )}
                                >
                                    {format(day, "d")}
                                </TextAnimated>
                            </View>
                        );
                    })
                }
            </View>
        </View>
    );
});