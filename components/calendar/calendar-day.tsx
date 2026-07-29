import { COLORS } from "@/constants/colors";
import { useTasks } from "@/hooks/database/use-tasks";
import { TaskType } from "@/types/task";
import clsx from "clsx";
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isToday, startOfMonth, startOfWeek } from "date-fns";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, useWindowDimensions, View } from "react-native";
import { TextAnimated } from "../text-animated";

interface Props {
    active?: boolean;
    month: Date;
};

const generateMonthDays = (month: Date, lang: "en" | 'fr' = "en"): Date[] => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: lang == "en" ? 0 : 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: lang == "en" ? 0 : 1 });

    return eachDayOfInterval({ start, end });
};

export const CalendarDay = memo(({ active, month }: Props) => {
    const { i18n } = useTranslation();
    const days = useMemo(() => generateMonthDays(month, i18n.language == "en" || i18n.language == "fr" ? i18n.language : "en"), [i18n.language, month]);
    const { width: screenWidth } = useWindowDimensions();
    const dayWidth = useMemo(() => ((screenWidth - 24) / 7), [screenWidth]);
    const loading = useRef<boolean>(false);
    const { getTasksByDate } = useTasks();
    const limit = 10;
    const [tasks, setTasks] = useState<Array<Record<number, TaskType[]>>>([]);
    const timeout = useRef<ReturnType<typeof setTimeout>>(0);
    const daysHeight = 100;
    const daysGap = 5;

    const renderItem = useCallback(({ item: day, index }: { item: Date; index: number }) => {
        const today = isToday(day);
        const date = day.getDate();
        const isNotPartOfThisMonth = (String(date).length == 2 && index <= 5) || (String(date).length == 1 && index > days.length / 2);

        if (index >= 35) return (<></>);
        const data = tasks.find(item => item[date]) || {
            [date]: [],
        };

        const dayTasks = data[date] || [];

        return (
            <Pressable
                onPress={() => {
                    // if (date == 1) {
                    //     // console.log(tasks);
                    //     console.log(data);
                    // }
                    // else if (date == 2) {
                    //     handleGetTasks();
                    // }
                    // else if (date == 3) {
                    //     setTasks([]);
                    // }
                    handleGetTasks();
                }}
                style={{
                    width: dayWidth,
                    height: daysHeight,
                }}
                className={clsx(
                    "flex items-center py-2",
                    dayTasks.length > 0 && !isNotPartOfThisMonth && "dark:bg-white/10 bg-white rounded-xl border dark:border-white/10 border-black/20",
                )}
            >
                <TextAnimated
                    dark={today ? COLORS.emerald[500] : "rgba(255, 255, 255, .8)"}
                    light={today ? COLORS.emerald[500] : "rgba(0, 0, 0, .9)"}
                    className={clsx(
                        today && "font-bold tracking-widest",
                        isNotPartOfThisMonth && "opacity-50",
                    )}
                >
                    {date}
                </TextAnimated>

                {
                    dayTasks.length > 0 && !isNotPartOfThisMonth && dayTasks.map(task => (
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
    }, [month, tasks]);

    const handleGetTasks = useCallback(async () => {
        if (loading.current || tasks.length > 0) return;
        timeout.current && clearTimeout(timeout.current);
        timeout.current = setTimeout(async () => {
            loading.current = true;
            try {
                const tasks: Record<number, TaskType[]>[] = [];

                await Promise.all(days.map(async (day, index) => {
                    const date = day.getDate();
                    const isNotPartOfThisMonth = (String(date).length == 2 && index <= 5) || (String(date).length == 1 && index > days.length / 2);

                    if (isNotPartOfThisMonth) return;
                    const data = await getTasksByDate(day, 2, 0) as TaskType[];

                    tasks.push(
                        {
                            [date]: data,
                        }
                    );
                }));

                setTasks(tasks);
                loading.current = false;
            }
            catch (e) {
                loading.current = false;
                console.log(e);
            }
        }, 200);
    }, [month, tasks]);

    useEffect(() => {
        if (active) {
            handleGetTasks();
        }
        else {
            timeout.current && clearTimeout(timeout.current);
        }
    }, [active]);

    return (
        <View className="w-screen h-[70%] px-3 py-2">
            <FlatList
                numColumns={7}
                nestedScrollEnabled
                data={days}
                keyExtractor={(day, i) => (day.toString() + i)}
                renderItem={renderItem}
                getItemLayout={(_, index) => ({
                    length: (dayWidth + daysGap),
                    offset: (dayWidth + daysGap) * index,
                    index,
                })}
                className="w-full h-full"
                contentContainerStyle={{
                    gap: daysGap,
                }}
                contentContainerClassName="w-full min-h-full"
            />
        </View>
    );
});