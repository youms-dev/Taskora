import { daysTranslation } from "@/constants/calendar";
import { COLORS } from "@/constants/colors";
import { ICON_TYPE } from "@/constants/icons";
import { useTasks } from "@/hooks/database/use-tasks";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { TaskType } from "@/types/task";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import clsx from "clsx";
import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, FlatList, Pressable, useWindowDimensions, View } from "react-native";
import Animated, { Easing, FadeIn, FadeInUp, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { Icon } from "../icon";
import { PressableAnimated } from "../pressable-animated";
import { Skeleton } from "../skeleton";
import { TextAnimated } from "../text-animated";

interface Props {
    targetDate: Date | null;
    setTargetDate: (entry: Date | null) => void;
}

export const DateTasks = memo(({ targetDate, setTargetDate }: Props) => {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const { theme } = useTheme();
    const { t, i18n } = useTranslation();
    const [tasks, setTasks] = useState<TaskType[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [tasksCount, setTasksCount] = useState<number>(0);
    const tasksGap = 15;
    const taskHeight = 85;
    const { getTasksByDate, getTasksCountByDate } = useTasks();
    const limit = 10;
    const { setToast } = useToast();
    const active = useSharedValue<boolean>(false);
    const timeout = useRef<ReturnType<typeof setTimeout>>(null);
    const closeTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    const init = useRef<boolean>(true);

    const displayDay = useMemo(() => {
        return !targetDate ? "" : (`${daysTranslation[i18n.language == "fr" ? "fr" : "en"][targetDate.getDay() - 1]}, ${format(targetDate, i18n.language == "fr" ? "dd / MM / yyyy" : "M / dd / yyyy")}`);
    }, [i18n.language, targetDate]);

    const parseDate = useCallback((entry: Date) => {
        const date = new Date(entry);

        return String(date.getHours()).padStart(2, "0") + " : " + String(date.getMinutes()).padStart(2, "0");
    }, []);

    const renderItem = useCallback(({ item: task, index }: { item: TaskType; index: number }) => {
        let iconData: ICON_TYPE | null = null;

        if (task.icon) {
            const data = JSON.parse(task.icon);

            if (data.name && data.packageName) {
                iconData = data;
            }
        }

        return (
            <Animated.View
                entering={FadeInUp
                    .delay(index * 100)
                    .duration(200)
                    .easing(Easing.inOut(Easing.quad))
                }
                style={{
                    height: taskHeight,
                }}
                className="w-full flex flex-row justify-between items-center dark:bg-black bg-[rgba(0,0,0,.05)] rounded-2xl px-3 border-2 dark:border-white/5 border-black/5"
            >
                <View className="w-[20%] flex items-center">
                    {
                        iconData && (
                            <View className="size-[40px] flex justify-center items-center dark:bg-black rounded-full">
                                {
                                    <View className="size-full flex justify-center items-center dark:bg-white/10 bg-white rounded-full border-2 dark:border-white/5 border-black/5">
                                        <Icon
                                            library={iconData.packageName}
                                            name={iconData.name}
                                            size={20}
                                            color={COLORS.emerald[500]}
                                        />
                                    </View>
                                }
                            </View>
                        )
                    }

                    <View className="w-full">
                        <TextAnimated
                            numberOfLines={1}
                            className="text-center opacity-70 tracking-wider"
                        >
                            {parseDate(task.startAt)}
                        </TextAnimated>
                    </View>
                </View>

                <View className="w-[80%] flex gap-1 border-l-2 border-emerald-500/60 px-3">
                    <View className="w-full">
                        <TextAnimated
                            numberOfLines={1}
                            className="text-lg"
                        >
                            {task.title ?? ""}
                        </TextAnimated>
                    </View>

                    <View className="w-full">
                        <View className="w-full flex flex-row items-center gap-3">
                            <TextAnimated
                                numberOfLines={1}
                                className="opacity-70 tracking-wider"
                            >
                                {parseDate(task.startAt)}
                            </TextAnimated>
                            {
                                task.endAt && (
                                    <>
                                        <TextAnimated
                                            numberOfLines={1}
                                            className="opacity-70 tracking-wider"
                                        >
                                            -
                                        </TextAnimated>
                                        <TextAnimated
                                            numberOfLines={1}
                                            className="opacity-70 tracking-wider"
                                        >
                                            {parseDate(task.endAt)}
                                        </TextAnimated>
                                    </>
                                )
                            }
                        </View>
                    </View>
                </View>
            </Animated.View>
        );
    }, []);

    const listFooterComponent = useCallback(() => {
        if (loading) {
            return (
                <View
                    style={{
                        gap: tasksGap,
                    }}
                    className="w-full flex items-center"
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
        if (!loading && tasks.length == 0 && !init.current) {
            return (
                <View className="w-full flex justify-center items-center gap-4 pt-20">
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
    }, [loading, i18n.language, theme, tasks]);

    const handleGetTasks = useCallback(async () => {
        if (loading || !targetDate || !active.value) return;
        setLoading(true);

        try {
            const data = await getTasksByDate(targetDate, limit, tasks.length) as TaskType[];

            setTasks(prev => [...prev, ...data]);
            setLoading(false);
            init.current = false;
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
        const onBackPress = () => {
            if (active.value) {
                handleClose();
                return true;
            }
            return false;
        }
        const { remove } = BackHandler.addEventListener("hardwareBackPress", onBackPress);

        timeout.current && clearTimeout(timeout.current);
        closeTimeout.current && clearTimeout(closeTimeout.current);

        if (targetDate) {
            active.value = true;
            timeout.current = setTimeout(() => {
                handleGetTasksCount();
                handleGetTasks();
            }, 800);
        }

        return () => remove();
    }, [targetDate]);

    const getItemLayout = useCallback((_data: unknown, index: number) => ({
        length: taskHeight + tasksGap,
        offset: index * (tasksGap + taskHeight),
        index,
    }), []);

    const onEndReached = useCallback(() => {
        if (loading || tasks.length >= tasksCount || !active.value) return;
        handleGetTasks();
    }, [loading, tasksCount, tasks]);

    const containerAnimation = useAnimatedStyle(() => ({
        pointerEvents: active.value ? "auto" : "none",
    }));

    const activeAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                scale: active.value ?
                    withSpring(1, {
                        stiffness: 40,
                        damping: 6,
                        mass: 1,
                    })
                    :
                    withTiming(0, {
                        duration: 500,
                        easing: Easing.inOut(Easing.quad),
                    }),
            }
        ]
    }));

    const handleClose = useCallback(() => {
        closeTimeout.current && clearTimeout(closeTimeout.current);
        active.value = false;
        closeTimeout.current = setTimeout(() => {
            setTargetDate(null);
            setTasks([]);
            setTasksCount(0);
            init.current = true;
        }, 500);
    }, []);

    return (
        <Animated.View
            style={[
                {
                    width: screenWidth,
                    height: screenHeight,
                    zIndex: 9999,
                },
                containerAnimation,
            ]}
            className="absolute left-0 top-0 w-full h-full flex justify-center items-center"
        >
            <Pressable
                onPress={handleClose}
                className="absolute left-0 top-0 size-full -z-1"
            />

            <Animated.View
                style={activeAnimation}
                className="sm:w-[500px] w-[90%] sm:h-[500px] h-[65%] dark:bg-black bg-white rounded-2xl"
            >
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
                                onPress={handleClose}
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
                        contentContainerClassName="w-full flex px-3 pt-[65px] pb-[30px]"
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
        </Animated.View>
    );
});