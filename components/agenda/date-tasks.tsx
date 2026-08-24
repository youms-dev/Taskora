import { daysTranslation } from "@/constants/calendar";
import { useTasks } from "@/hooks/database/use-tasks";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { TaskType } from "@/types/task";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { format, transpose } from "date-fns";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Translation, useTranslation } from "react-i18next";
import { FlatList, useWindowDimensions, View } from "react-native";
import Animated, { Easing, FadeIn } from "react-native-reanimated";
import { PressableAnimated } from "../pressable-animated";
import { Skeleton } from "../skeleton";
import { TextAnimated } from "../text-animated";
import { LinearGradient } from "expo-linear-gradient";
import { getIcons } from "@/constants/icons";
import clsx from "clsx";
import { COLORS } from "@/constants/colors";

export const DateTasks = memo(() => {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const targetDate = new Date();
    const { theme } = useTheme();
    const { t, i18n } = useTranslation();
    const [tasks, setTasks] = useState<TaskType[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [tasksCount, setTasksCount] = useState<number>(0);
    const tasksGap = 15;
    const taskHeight = 100;
    const { getTasksByDate, getTasksCountByDate } = useTasks();
    const limit = 10;
    const { setToast } = useToast();
    const viewWidth = useMemo(() => screenWidth * .9, [screenWidth]);

    console.log("\n");
    console.log("\n");

    const displayDay = useMemo(() => {
        return (`${daysTranslation[i18n.language == "fr" ? "fr" : "en"][targetDate.getDay() - 1]}, ${format(targetDate, i18n.language == "fr" ? "dd / MM / yyyy" : "M / dd / yyyy")}`);
    }, [i18n.language]);

    const iconsMap = useMemo(() => {
        return (
            new Map(
                getIcons(theme).map((item) => {
                    const [key] = Object.keys(item);
                    const [value] = Object.values(item);

                    return [key, value];
                }),
            )
        );
    }, [theme]);

    const renderItem = useCallback(({ item: task }: { item: TaskType; index: number }) => {
        const Icon = iconsMap.get(task.icon ?? "");

        return (
            <View
                style={{
                    height: taskHeight,
                }}
                className="w-full flex flex-row justify-between items-center dark:bg-black bg-[rgba(0,0,0,.05)] rounded-2xl px-3"
            >
                {
                    Icon && (
                        <View className="size-[45px] flex justify-center items-center">
                            {
                                <Icon
                                    color={COLORS.emerald[500]}
                                    parentSize={45}
                                />
                            }
                        </View>
                    )
                }

                <View className={clsx(
                    task.icon ? "w-[83%]" : "w-full"
                )}>
                    <TextAnimated
                        numberOfLines={1}
                        className="text-lg"
                    >
                        {task.title ?? ""}
                    </TextAnimated>
                </View>
            </View>
        );
    }, []);

    const listFooterComponent = useCallback(() => {
        if (loading) {
            return (
                <View
                    style={{
                        width: viewWidth,
                        gap: tasksGap,
                    }}
                    className="flex items-center px-3"
                >
                    {
                        Array(3).fill(0).map((_, i) => (
                            <Animated.View
                                key={i}
                                entering={FadeIn
                                    .delay(i * 100)
                                    .duration(300)
                                    .easing(Easing.inOut(Easing.quad))
                                }
                                style={{
                                    height: taskHeight
                                }}
                                className="w-full rounded-2xl overflow-hidden"
                            >
                                <Skeleton delay={i * 200} />
                            </Animated.View>
                        ))
                    }
                </View>
            );
        }
        return null;
    }, [loading]);

    const listEmptyComponent = useCallback(() => {
        if (!loading && tasks.length == 0) {
            return (
                <View
                    style={{
                        width: viewWidth,
                    }}
                    className="flex justify-center items-center gap-4 pt-20"
                >
                    <MaterialIcons
                        name="playlist-remove"
                        size={100}
                        color={theme == "dark" ? "rgba(255, 255, 255, .2)" : "rgba(0, 0, 0, .2)"}
                    />
                    <TextAnimated
                        dark="rgba(255, 255, 255, .5)"
                        light="rgba(0, 0, 0, .5)"
                        className="font-bold text-lg tracking-wider"
                    >
                        {t("tasks_no_tasks")}
                    </TextAnimated>
                </View>
            );
        }
        return null;
    }, [loading, i18n.language, theme, viewWidth, tasks]);

    const handleGetTasks = useCallback(async () => {
        if (loading || !targetDate) return;
        setLoading(true);

        try {
            const data = await getTasksByDate(targetDate, limit, tasks.length) as TaskType[];

            setTasks(data);
            setLoading(false);
        }
        catch (e) {
            setLoading(false);
            setToast(t("sqlite_error"), "error");
            console.log(e);
        }
    }, [loading, i18n.language, targetDate, tasks]);

    const handleGetTasksCount = useCallback(async () => {
        if (loading || !targetDate) return;

        try {
            const data = await getTasksCountByDate(targetDate) as number;

            setTasksCount(data);
        }
        catch (e) {
            console.log(e);
        }
    }, [loading, i18n.language, targetDate]);

    useEffect(() => {
        if (targetDate) {
            handleGetTasksCount();
            handleGetTasks();
        }
        // }, [targetDate]);
    }, []);

    const getItemLayout = useCallback((_data: unknown, index: number) => ({
        length: taskHeight + tasksGap,
        offset: index * (tasksGap + taskHeight),
        index,
    }), []);

    const onEndReached = useCallback(() => {
        if (loading || tasks.length >= tasksCount) return;
        // handleGetTasks();
    }, [loading, tasksCount, tasks]);

    return (
        <View
            style={{
                width: screenWidth,
                height: screenHeight,
                zIndex: 9999,
            }}
            className="absolute left-0 top-0 w-full h-full flex justify-center items-center"
        >
            <Animated.View className="sm:w-[500px] w-[90%] sm:h-[500px] h-[65%] dark:bg-black bg-white rounded-2xl">
                <View
                    style={{
                        transform: [
                            {
                                translateY: 8
                            }
                        ],
                        filter: "blur(5px)"
                    }}
                    className="absolute size-full dark:bg-black/50 bg-black/30 rounded-2xl -z-1"
                />

                <View className="size-full dark:bg-white/5 bg-white rounded-2xl border-2 dark:border-white/5 border-black/10">
                    <LinearGradient
                        colors={theme == "dark" ?
                            ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)"]
                            :
                            ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        locations={[0, .6, 1]}
                        className="absolute left-0 top-0 w-full z-[10] rounded-t-2xl overflow-hidden"
                    >
                        <LinearGradient
                            colors={theme == "dark" ?
                                ["rgba(255, 255, 255, .05)", "rgba(255, 255, 255, .05)", "rgba(255, 255, 255, 0)"]
                                :
                                ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            locations={[0, .6, 1]}
                            className="w-full flex flex-row justify-between items-center px-3 pt-2 pb-8"
                        >
                            <View className="max-w-[80%]">
                                <TextAnimated
                                    numberOfLines={1}
                                    className="text-xl"
                                >
                                    {displayDay}
                                </TextAnimated>
                            </View>

                            <PressableAnimated
                                className="size-[40px] shrink-0 dark:bg-black bg-white rounded-full"
                            >
                                <View className="size-full flex justify-center items-center dark:bg-white/10 bg-black/80 rounded-full">
                                    <FontAwesome6
                                        name="xmark"
                                        size={24}
                                        color="rgba(255, 255, 255, .8)"
                                    />
                                </View>
                            </PressableAnimated>
                        </LinearGradient>
                    </LinearGradient>

                    <FlatList
                        horizontal={false}
                        showsVerticalScrollIndicator={false}
                        removeClippedSubviews
                        data={tasks}
                        keyExtractor={(item) => item.idTask}
                        renderItem={renderItem}
                        updateCellsBatchingPeriod={0}
                        scrollEventThrottle={16}
                        onEndReachedThreshold={.1}
                        ListEmptyComponent={listEmptyComponent}
                        ListFooterComponent={listFooterComponent}
                        getItemLayout={getItemLayout}
                        onEndReached={onEndReached}
                        className="w-full h-full"
                        contentContainerStyle={{
                            gap: tasksGap,
                        }}
                        contentContainerClassName="flex px-3 pt-[65px] pb-[30px]"
                    />

                    <LinearGradient
                        colors={theme == "dark" ?
                            ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)"]
                            :
                            ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                        }
                        locations={[0, .6, 1]}
                        start={{ x: 0, y: 1 }}
                        end={{ x: 0, y: 0 }}
                        className="absolute left-0 bottom-0 w-full h-[35px] z-[10] overflow-hidden rounded-b-2xl"
                    >
                        <LinearGradient
                            colors={theme == "dark" ?
                                ["rgba(255, 255, 255, .05)", "rgba(255, 255, 255, .05)", "rgba(255, 255, 255, 0)"]
                                :
                                ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                            }
                            locations={[0, .6, 1]}
                            start={{ x: 0, y: 1 }}
                            end={{ x: 0, y: 0 }}
                            className="size-full"
                        />
                    </LinearGradient>
                </View>
            </Animated.View>
        </View>
    );
});