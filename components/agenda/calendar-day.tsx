import { useTasks } from "@/hooks/database/use-tasks";
import { TaskType } from "@/types/task";
import clsx from "clsx";
import { eachDayOfInterval, endOfMonth, endOfWeek, isToday, startOfMonth, startOfWeek } from "date-fns";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, Text, View } from "react-native";
import { TextAnimated } from "../text-animated";

const generateMonthDays = (month: Date, lang: "en" | 'fr' = "en"): Date[] => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: lang == "en" ? 0 : 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: lang == "en" ? 0 : 1 });

    return eachDayOfInterval({ start, end });
};

interface Props {
    active?: boolean;
    month: Date;
    width: number;
    height: number;
};

export const CalendarDay = memo(({ active, month, width, height }: Props) => {
    const { i18n } = useTranslation();
    const days = useMemo(() => generateMonthDays(month, i18n.language == "en" || i18n.language == "fr" ? i18n.language : "en"), [i18n.language, month]);
    const dayWidth = useMemo(() => ((width - 5) / 7), [width]);
    const loading = useRef<boolean>(false);
    const { getTasksByDate } = useTasks();
    const limit = 10;
    const [tasks, setTasks] = useState<Map<number, TaskType[]>>(new Map());
    const timeout = useRef<ReturnType<typeof setTimeout>>(0);
    const daysHeight = useMemo(() => {
        return (height / (days.length / 7));
    }, [height, days.length]);
    const daysGap = 5;

    const renderItem = useCallback(({ item: day, index }: { item: Date; index: number }) => {
        const today = isToday(day);
        const monthDay = day.getDate();
        const isNotPartOfThisMonth = (String(monthDay).length == 2 && index <= 5) || (String(monthDay).length == 1 && index > days.length / 2);

        const data = tasks.get(monthDay) ?? [];

        return (
            <Pressable
                onPress={() => {
                    // if (monthDay == 1) {
                    //     // console.log(tasks);
                    //     console.log(data);
                    // }
                    // else if (monthDay == 2) {
                    //     handleGetTasks();
                    // }
                    // else if (monthDay == 3) {
                    //     setTasks([]);
                    // }
                    handleGetTasks();
                }}
                style={{
                    width: dayWidth,
                    height: daysHeight - daysGap * 2,
                }}
                className={clsx(
                    "flex items-center py-2 overflow-hidden rounded-xl border",
                    data.length > 0 && !isNotPartOfThisMonth ? "dark:bg-white/10 bg-white dark:border-white/10 border-black/10" : "dark:bg-white/5 bg-white/40 dark:border-white/5 border-black/5",
                )}
            >
                <Text className={clsx(
                    today && "font-bold tracking-widest text-emerald-500",
                    day.getDay() == 0 && !today && "dark:text-red-500/50 text-red-500/70",
                    !today && day.getDay() > 0 && "dark:text-white/80 text-black/90",
                    isNotPartOfThisMonth && "opacity-40",
                )}>
                    {monthDay}
                </Text>

                {
                    data.length > 0 && data.map(task => (
                        <View
                            key={task.idTask}
                            className="w-full h-[30px] flex flex-row gap-1 overflow-hidden mb-1"
                        >
                            <View className="w-[2px] h-full bg-emerald-500" />
                            <View className="w-[85%] h-full flex justify-center">
                                <TextAnimated
                                    numberOfLines={2}
                                    ellipsizeMode="clip"
                                    className="text-sm leading-[14px] opacity-90 tracking-widest"
                                >
                                    {task.title ?? task.content}
                                </TextAnimated>
                            </View>
                        </View>
                    ))
                }
            </Pressable>
        );
    }, [tasks, daysHeight]);

    const handleGetTasks = useCallback(async () => {
        if (loading.current || tasks.size > 0) return;
        timeout.current && clearTimeout(timeout.current);
        timeout.current = setTimeout(async () => {
            loading.current = true;
            try {
                const tasks: [number, TaskType[]][] = [];

                await Promise.all(days.map(async (day, index) => {
                    const monthDay = day.getDate();
                    const isNotPartOfThisMonth = (String(monthDay).length == 2 && index <= 5) || (String(monthDay).length == 1 && index > days.length / 2);

                    if (isNotPartOfThisMonth) return;
                    const data = await getTasksByDate(day, 2, 0) as TaskType[];

                    tasks.push([monthDay, data]);
                }));

                setTasks(new Map(
                    tasks.map(item => item)
                ));
                loading.current = false;
            }
            catch (e) {
                loading.current = false;
                console.log(e);
            }
        }, 100);
    }, [month, tasks]);

    useEffect(() => {
        if (active) {
            handleGetTasks();
        }
        else {
            timeout.current && clearTimeout(timeout.current);
        }
    }, [active]);

    const getItemLayout = useCallback((_data: unknown, index: number) => ({
        length: (dayWidth + daysGap),
        offset: (dayWidth + daysGap) * index,
        index,
    }), [dayWidth]);

    return (
        <View
            style={{
                width,
            }}
            className="h-full"
        >
            <FlatList
                numColumns={7}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                data={days}
                keyExtractor={(day, i) => (day.toString() + i)}
                renderItem={renderItem}
                getItemLayout={getItemLayout}
                updateCellsBatchingPeriod={0}
                maxToRenderPerBatch={31}
                initialNumToRender={31}
                className="w-full h-full"
                contentContainerStyle={{
                    gap: daysGap,
                }}
                contentContainerClassName="flex items-center"
            />
        </View>
    );
});