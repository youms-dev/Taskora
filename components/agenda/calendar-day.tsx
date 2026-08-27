import { COLORS } from "@/constants/colors";
import { ICON_TYPE } from "@/constants/icons";
import { useTasks } from "@/hooks/database/use-tasks";
import { TaskType } from "@/types/task";
import clsx from "clsx";
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isToday, startOfMonth, startOfWeek } from "date-fns";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, Text, View } from "react-native";
import { Icon } from "../icon";
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
    setTargetDate: (entry: Date | null) => void;
};

export const CalendarDay = memo(({ active, month, width, height, setTargetDate }: Props) => {
    const { i18n } = useTranslation();
    const days = useMemo(() => generateMonthDays(month, i18n.language == "en" || i18n.language == "fr" ? i18n.language : "en"), [i18n.language, month]);
    const dayWidth = useMemo(() => (width / 7) - 3, [width]);
    const loading = useRef<boolean>(false);
    const { getTasksByDate } = useTasks();
    const limit = 10;
    const [tasks, setTasks] = useState<Map<string, TaskType[]>>(new Map());
    const timeout = useRef<ReturnType<typeof setTimeout>>(0);
    const daysHeight = useMemo(() => {
        return (height / (days.length / 7));
    }, [height, days.length]);
    const daysGap = 5;
    const router = useRouter();

    const renderItem = useCallback(({ item: day, index }: { item: Date; index: number }) => {
        const today = isToday(day);
        const isNotPartOfThisMonth = day.getMonth() != month.getMonth();

        const data = tasks.get(format(day, "dd MMMM yyyy")) ?? [];

        return (
            <Pressable
                onPress={() => {
                    if (data.length > 0) {
                        setTargetDate(day);
                    }
                    else {
                        router.navigate({
                            pathname: "/(protected)/(task)/create",
                            params: {
                                target: "event",
                                date: String(day),
                                action: "create",
                            },
                        });
                    }
                }}
                style={{
                    width: dayWidth,
                    height: daysHeight - daysGap * 2,
                }}
                className={clsx(
                    "flex items-center gap-1 py-2 overflow-hidden rounded-xl border",
                    data.length > 0 && !isNotPartOfThisMonth ? "dark:bg-white/10 bg-white dark:border-white/10 border-black/10" : "dark:bg-white/5 bg-white/40 dark:border-white/5 border-black/5",
                )}
            >
                <Text className={clsx(
                    today && "font-bold tracking-widest text-emerald-500",
                    day.getDay() == 0 && !today && "dark:text-red-500/50 text-red-500/70",
                    !today && day.getDay() > 0 && "dark:text-white/80 text-black/90",
                    isNotPartOfThisMonth && "opacity-40",
                )}>
                    {day.getDate()}
                </Text>

                <View className="w-full flex items-center gap-1">
                    {
                        data.length > 0 && data.map(task => {
                            let iconData: ICON_TYPE | null = null;

                            if (task.icon) {
                                const data = JSON.parse(task.icon);

                                if (data.name && data.packageName) {
                                    iconData = data;
                                }
                            }

                            return (
                                <View
                                    key={task.idTask}
                                    className={clsx(
                                        "w-full h-[30px] flex flex-row gap-1 overflow-hidden",
                                        isNotPartOfThisMonth && "opacity-60",
                                    )}
                                >
                                    <View className={clsx(
                                        "w-full h-full flex justify-center border-l-2 border-emerald-500 px-2",
                                        iconData && "items-center",
                                    )}>
                                        {
                                            iconData ?
                                                (
                                                    <View className="size-[30px] dark:bg-black bg-white rounded-full">
                                                        <View className="size-full flex justify-center items-center dark:bg-black bg-black/5 rounded-full border-2 dark:border-white/5 border-black/5">
                                                            <Icon
                                                                library={iconData.packageName}
                                                                name={iconData.name}
                                                                size={15}
                                                                color={COLORS.emerald[500]}
                                                            />
                                                        </View>
                                                    </View>
                                                )
                                                :
                                                (
                                                    <TextAnimated
                                                        numberOfLines={2}
                                                        ellipsizeMode="clip"
                                                        className="text-sm leading-[14px] opacity-90 tracking-widest"
                                                    >
                                                        {task.title ?? (task.content ?? "")}
                                                    </TextAnimated>
                                                )
                                        }
                                    </View>
                                </View>
                            )
                        })
                    }
                </View>
            </Pressable>
        );
    }, [tasks, dayWidth, daysHeight]);

    const handleGetTasks = useCallback(async () => {
        if (loading.current || tasks.size > 0) return;
        timeout.current && clearTimeout(timeout.current);

        timeout.current = setTimeout(async () => {
            loading.current = true;
            try {
                const tasks: [string, TaskType[]][] = [];
                await Promise.all(days.map(async (day, index) => {
                    const isNotPartOfThisMonth = day.getMonth() != month.getMonth();

                    if (isNotPartOfThisMonth) {
                        return;
                    }
                    const data = await getTasksByDate(day, 2, 0) as TaskType[];

                    tasks.push([format(day, "dd MMMM yyyy"), data]);
                }));

                setTasks(new Map(tasks));
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