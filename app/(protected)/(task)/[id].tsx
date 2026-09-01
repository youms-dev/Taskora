import { Container } from "@/components/container";
import { Icon } from "@/components/icon";
import { Loader } from "@/components/loader";
import { PressableAnimated } from "@/components/pressable-animated";
import { TextAnimated } from "@/components/text-animated";
import { daysTranslation, monthsTranslation } from "@/constants/calendar";
import { COLORS } from "@/constants/colors";
import { ICON_TYPE } from "@/constants/icons";
import { useTasks } from "@/hooks/database/use-tasks";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { TaskType } from "@/types/task";
import { Entypo, FontAwesome, FontAwesome6, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import clsx from "clsx";
import { eachDayOfInterval, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Animated, { Easing, Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

interface Props {
    entry: Date | number;
}

const Decrement = memo(({ entry }: Props) => {
    const interval = useRef<ReturnType<typeof setInterval>>(null);
    const entryFormatted = useMemo(() => new Date(entry), [entry]);
    const [remaining, setRemaining] = useState<string>(() => String(entryFormatted.getHours()).padStart(2, "0") + " : " + String(entryFormatted.getMinutes()).padStart(2, "0"));

    useEffect(() => {
        interval.current && clearInterval(interval.current);
        let hours = entryFormatted.getMinutes();
        let mins = entryFormatted.getSeconds();

        interval.current = setInterval(() => {
            if (mins > 0) {
                mins--;
                setRemaining(String(hours).padStart(2, "0") + " : " + String(mins).padStart(2, "0"));
            }
            else if (hours == 0 && mins == 0) {
                interval.current && clearInterval(interval.current);
            }
            else {
                mins = 59;
                hours > 0 ? hours -= 1 : null;
                setRemaining(String(hours).padStart(2, "0") + " : " + String(mins).padStart(2, "0"));
            }
        }, 1000);

        return () => {
            interval.current && clearInterval(interval.current);
        }
    }, [entryFormatted]);

    return (
        <Text>
            {remaining}
        </Text>
    );
});

export default function Task() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(true);
    const { setToast } = useToast();
    const [task, setTask] = useState<TaskType | null>(null);
    const { theme } = useTheme();
    const { getTask } = useTasks();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const { t, i18n } = useTranslation();
    const ref = useRef<Animated.ScrollView>(null);
    const mapDateFormat = "dd/MM/yyyy";
    const systemDate = useMemo(() => new Date(), []);
    const taskPlannedDateFormatted = useMemo(() => new Date(task?.startAt ?? systemDate), [task]);
    const scrollCheckPoint = 200;
    const scrollY = useSharedValue<number>(0);
    const contextMenuActive = useSharedValue<boolean>(false);

    const iconData = useMemo(() => {
        if (!task || !task.icon) return null;
        let data = JSON.parse(task.icon) as ICON_TYPE;

        if (data.name && data.packageName) {
            return data;
        }
        return null;
    }, [task]);

    const displayedDate = useMemo(() => {
        if (!task) return "";
        const date = taskPlannedDateFormatted;

        return daysTranslation[i18n.language == "fr" ? "fr" : "en"][date.getDay() > 0 ? date.getDay() - 1 : 0] + ", " + format(date, i18n.language == "fr" ? "dd / MM / yyyy" : "M / dd / yyyy");
    }, [i18n.language, task]);

    const displayedMonth = useMemo(() => {
        if (!task) return "";
        const date = taskPlannedDateFormatted;

        return monthsTranslation[i18n.language == "fr" ? "fr" : "en"][date.getMonth()] + ", " + format(date, "yyyy");
    }, [i18n.language, task]);

    const days = useMemo(() => {
        if (!task) return [];
        const start = startOfWeek(startOfMonth(systemDate), {
            weekStartsOn: i18n.language == "fr" ? 1 : 0,
        });
        const end = endOfWeek(endOfMonth(systemDate), {
            weekStartsOn: i18n.language == "fr" ? 1 : 0,
        });

        return eachDayOfInterval({
            start,
            end,
        });
    }, [task, i18n.language]);

    const daysMap = useMemo(() => {
        return (
            new Map(
                days.map((d, i) => [format(d, mapDateFormat), {
                    data: d,
                    index: i,
                }]),
            )
        );
    }, [task, i18n.language]);

    const dayWidth = useMemo(() => {
        return screenWidth / 7;
    }, [screenWidth]);

    const displayedStartTime = useMemo(() => {
        if (!task) return "";
        const date = new Date(task.startAt);

        return String(date.getHours()).padStart(2, "0") + " : " + String(date.getMinutes()).padStart(2, "0");
    }, [task]);

    const displayedEndTime = useMemo(() => {
        if (!task || task.type != "event" || !task.endAt) return "";
        const date = new Date(task.endAt);

        return String(date.getHours()).padStart(2, "0") + " : " + String(date.getMinutes()).padStart(2, "0");
    }, [task]);

    const taskDone = useMemo(() => {
        return Boolean(task?.done);
    }, [task]);

    const taskArchived = useMemo(() => {
        return Boolean(task?.archived);
    }, [task]);

    if (!id) {
        if (router.canGoBack()) {
            router.back();
        }
        else {
            router.navigate({
                pathname: "/(protected)/(tabs)",
            });
        }
    }

    const handleGetTask = useCallback(async () => {
        try {
            const data = await getTask(id) as TaskType;

            setLoading(false);
            setTask(data);
        }
        catch (e) {
            setLoading(false);
            if (router.canGoBack()) {
                router.back();
            }
            else {
                router.navigate({
                    pathname: "/(protected)/(tabs)",
                });
            }
        }
    }, []);

    useEffect(() => {
        handleGetTask();
    }, []);

    useEffect(() => {
        if (task) {
            const date = taskPlannedDateFormatted;
            const index = (((daysMap.get(format(date, mapDateFormat))?.index ?? 0) * dayWidth) - (dayWidth * 3));

            ref.current?.scrollTo({
                x: index,
                animated: false,
            });
        }
    }, [task, screenWidth]);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: ((e) => {
            const y = e.contentOffset.y;

            scrollY.value = y;
        }),
    });

    const opacityAnimation = useAnimatedStyle(() => ({
        opacity: interpolate(
            scrollY.value,
            [0, scrollCheckPoint * .2],
            [1, 0],
            Extrapolation.CLAMP,
        )
    }));

    const displayedTimeLeft = useMemo(() => {
        if (
            taskPlannedDateFormatted.getMonth() > systemDate.getMonth()
            &&
            taskPlannedDateFormatted.getFullYear() == systemDate.getFullYear()
        ) {
            const diff = taskPlannedDateFormatted.getMonth() - systemDate.getMonth();

            return (`${String(diff)} ${t("[id]_months", { many: diff > 1 ? "s" : "" })}`);
        }
        else if (taskPlannedDateFormatted.getFullYear() > systemDate.getFullYear()) {
            const diff = taskPlannedDateFormatted.getFullYear() - systemDate.getFullYear();

            return (`${String(diff)} ${t("[id]_years", { many: diff > 1 ? "s" : "" })}`);
        }
        else if (
            taskPlannedDateFormatted.getMonth() == systemDate.getMonth()
            &&
            taskPlannedDateFormatted.getFullYear() == systemDate.getFullYear()
        ) {
            const daysDiff = Math.abs(taskPlannedDateFormatted.getDate() - systemDate.getDate());

            if (daysDiff > 0) {
                return (`${String(daysDiff)} ${t("[id]_days", { many: daysDiff > 1 ? "s" : "" })}`);
            }
            else {
                const hoursDiff = Math.abs(taskPlannedDateFormatted.getHours() - systemDate.getHours());

                if (hoursDiff > 1) {
                    return (`${String(hoursDiff)} ${t("[id]_hours", { many: hoursDiff > 1 ? "s" : "" })}`);
                }
                else {
                    const diff = Math.abs(taskPlannedDateFormatted.getTime() - systemDate.getTime());

                    return (
                        <Decrement entry={diff} />
                    );
                }
            }
        }
    }, [taskPlannedDateFormatted, i18n.language]);

    const handleContextMenuButtonPress = useCallback((value: "duplicate" | "edit") => {
        if (!task) return;
        router.navigate({
            pathname: "/(protected)/(task)/create",
            params: {
                target: task.type,
                action: value,
                date: taskPlannedDateFormatted.toString(),
                data: JSON.stringify(task),
            }
        });
        contextMenuActive.value = false;
    }, [task]);

    const contextMenuContainerAnimation = useAnimatedStyle(() => ({
        pointerEvents: contextMenuActive.value ? "auto" : "none",
    }));

    const contextMenuAnimation = useAnimatedStyle(() => ({
        perspective: "1200px",
        transform: [
            {
                rotateX: contextMenuActive.value ?
                    withTiming("0deg", {
                        duration: 500,
                        easing: Easing.inOut(Easing.quad),
                    })
                    :
                    withTiming("90deg", {
                        duration: 200,
                        easing: Easing.inOut(Easing.quad),
                    })
            },
            {
                rotateY: "0deg",
            },
            {
                translateX: -15,
            },
            {
                translateY: 10,
            },
        ],
    }));

    useEffect(() => {
        const onBackPress = () => {
            if (contextMenuActive.value) {
                contextMenuActive.value = false;

                return true;
            }
            return false;
        }
        const { remove } = BackHandler.addEventListener("hardwareBackPress", onBackPress);

        return () => remove();
    }, []);

    if (loading) {
        return (
            <Container centerX>
                <View className="size-full flex justify-center items-center">
                    <Loader />
                </View>
            </Container>
        );
    }
    else if (!task) {
        return null;
    }

    return (
        <Container centerX>
            <View
                style={{
                    width: screenWidth,
                    height: screenHeight + (screenHeight * .2),
                    transform: [
                        {
                            translateY: -screenHeight * .1
                        }
                    ]
                }}
                className="absolute left-0 top-0 dark:bg-black bg-white -z-[10]"
            >
                <View className="size-full dark:bg-white/5 bg-black/5" />
            </View>

            <View className="size-full">
                {/* Header */}

                <View className="absolute left-0 top-0 w-full z-[10]">
                    <LinearGradient
                        colors={theme == "dark" ?
                            ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)"]
                            :
                            ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        locations={[0, .6, 1]}
                        className="w-full"
                    >
                        <LinearGradient
                            colors={theme == "dark" ?
                                ["rgba(255, 255, 255, .05)", "rgba(255, 255, 255, .05)", "rgba(255, 255, 255, 0)"]
                                :
                                ["rgba(0, 0, 0, .05)", "rgba(0, 0, 0, .05)", "rgba(0, 0, 0, 0)"]
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            locations={[0, .6, 1]}
                            className="w-full flex flex-row justify-between gap-2 items-center px-3 pb-5"
                        >
                            <PressableAnimated
                                scale={.95}
                                onPress={() => {
                                    if (router.canGoBack()) {
                                        router.back();
                                    }
                                    else {
                                        router.navigate({
                                            pathname: "/(protected)/(tabs)",
                                        })
                                    }
                                }}
                                className="size-[50px] dark:bg-black bg-white rounded-full"
                            >
                                <View className="size-full dark:bg-black bg-white border-2 dark:border-white/5 border-black/5 rounded-full flex justify-center items-center">
                                    <Entypo
                                        name="chevron-left"
                                        size={25}
                                        color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                                    />
                                </View>
                            </PressableAnimated>

                            <Animated.View
                                style={{}}
                                className="w-[70%] flex flex-row justify-center items-center gap-3"
                            >
                                {
                                    iconData && (
                                        <View className="size-[40px] dark:bg-black bg-white rounded-full">
                                            <View className="size-full flex justify-center items-center dark:bg-white/10 bg-white rounded-full border-2 dark:border-white/5 border-black/5">
                                                <Icon
                                                    library={iconData.packageName}
                                                    name={iconData.name}
                                                    size={20}
                                                    color={COLORS.emerald[500]}
                                                />
                                            </View>
                                        </View>
                                    )
                                }

                                <View className={clsx(iconData && "max-w-[80%]")}>
                                    <TextAnimated
                                        numberOfLines={1}
                                        className="text-xl text-center tracking-widest"
                                    >
                                        {displayedDate}
                                    </TextAnimated>
                                </View>
                            </Animated.View>

                            <PressableAnimated
                                onPress={() => contextMenuActive.value = true}
                                className="w-[10%] flex items-center"
                            >
                                <FontAwesome6
                                    name="ellipsis-vertical"
                                    size={25}
                                    color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                                />
                            </PressableAnimated>
                        </LinearGradient>
                    </LinearGradient>
                </View>

                {/* Context menu */}

                <Animated.View
                    style={contextMenuContainerAnimation}
                    className="absolute left-0 top-0 size-full z-[100]"
                >
                    <Pressable
                        onPress={() => {
                            contextMenuActive.value = false;
                        }}
                        className="size-full"
                    />

                    <Animated.View
                        style={contextMenuAnimation}
                        className="absolute right-0 top-0 dark:bg-black bg-white z-[10] rounded-2xl"
                    >
                        <View
                            style={{
                                transform: [
                                    {
                                        translateY: 8,
                                    },
                                ],
                                filter: "blur(5px)",
                            }}
                            className="absolute size-full dark:bg-black/50 bg-black/30 rounded-2xl"
                        />

                        <View className="w-[200px] flex items-center gap-3 dark:bg-white/10 bg-white px-3 py-3 rounded-2xl border-2 dark:border-white/5 border-black/5">
                            <PressableAnimated
                                scale={.95}
                                onPress={() => handleContextMenuButtonPress("edit")}
                                className="w-full flex flex-row items-center"
                            >
                                <View className="w-[20%]">
                                    <MaterialCommunityIcons
                                        // name={task.type == "task" ? "playlist-edit" : "calendar-edit"}
                                        name={"calendar-edit"}
                                        size={25}
                                        color={theme == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .5)"}
                                    />
                                </View>

                                <View className="w-[60%]">
                                    <TextAnimated className="text-lg font-medium tracking-wider">
                                        {t("agenda_edit_event")}
                                    </TextAnimated>
                                </View>
                            </PressableAnimated>

                            <PressableAnimated
                                scale={.95}
                                onPress={() => { }}
                                className="w-full flex flex-row items-center"
                            >
                                <View className="w-[20%]">
                                    <Entypo
                                        name="trash"
                                        size={20}
                                        color={theme == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .5)"}
                                    />
                                </View>

                                <View className="w-[60%]">
                                    <TextAnimated className="text-lg font-medium tracking-wider">
                                        {t("agenda_delete_event")}
                                    </TextAnimated>
                                </View>
                            </PressableAnimated>

                            <PressableAnimated
                                scale={.95}
                                onPress={() => handleContextMenuButtonPress("duplicate")}
                                className="w-full flex flex-row items-center"
                            >
                                <View className="w-[20%]">
                                    <Ionicons
                                        name="duplicate"
                                        size={20}
                                        color={theme == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .5)"}
                                    />
                                </View>

                                <View className="w-[60%]">
                                    <TextAnimated className="text-lg font-medium tracking-wider">
                                        {t("agenda_duplicate_event")}
                                    </TextAnimated>
                                </View>
                            </PressableAnimated>
                        </View>
                    </Animated.View>
                </Animated.View>

                <Animated.View
                    style={[
                        {
                            transform: [
                                {
                                    translateY: 60,
                                }
                            ]
                        },
                        opacityAnimation,
                    ]}
                    className="absolute w-full h-[150px] flex justify-center items-center gap-6 z-[10] pointer-events-none"
                >
                    {/* Calendar */}

                    <View className="w-full flex flex-row justify-center items-center gap-5 px-3">
                        <View>
                            <FontAwesome
                                name="calendar"
                                size={20}
                                color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                            />
                        </View>

                        <View>
                            <TextAnimated className="text-lg font-medium tracking-widest">
                                {displayedMonth}
                            </TextAnimated>
                        </View>
                    </View>

                    {/* Data */}

                    <View className="w-full">
                        <ScrollView
                            ref={ref}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            scrollEnabled={false}
                            className="w-full"
                            contentContainerClassName="flex flex-row items-center"
                        >
                            {
                                days.map((day, i) => {
                                    const mapIndex = daysMap.get(format(taskPlannedDateFormatted, mapDateFormat))?.index ?? 0;
                                    const distance = Math.abs(i - mapIndex);
                                    const effect = Math.max(
                                        0.2,
                                        1 - distance * 0.20,
                                    );

                                    return (
                                        <View
                                            key={i}
                                            style={{
                                                width: dayWidth,
                                                transform: [
                                                    {
                                                        scale: effect,
                                                    }
                                                ],
                                                opacity: effect,
                                            }}
                                            className="flex justify-center items-center gap-2"
                                        >
                                            <TextAnimated
                                                numberOfLines={1}
                                                className="text-3xl font-medium"
                                            >
                                                {day.getDate()}
                                            </TextAnimated>

                                            <TextAnimated
                                                numberOfLines={1}
                                                className="text-lg"
                                            >
                                                {(daysTranslation[i18n.language == "fr" ? "fr" : "en"][day.getDay() > 0 ? day.getDay() - 1 : 0]).slice(0, 3)}
                                            </TextAnimated>
                                        </View>
                                    );
                                })
                            }
                        </ScrollView>
                    </View>
                </Animated.View>

                <Animated.ScrollView
                    horizontal={false}
                    showsVerticalScrollIndicator={false}
                    scrollEventThrottle={16}
                    onScroll={scrollHandler}
                    className="size-full"
                    contentContainerStyle={{
                        paddingTop: scrollCheckPoint,
                    }}
                    contentContainerClassName="w-full flex items-center"
                >
                    <View
                        style={{
                            paddingBottom: scrollCheckPoint,
                        }}
                        className="w-full min-h-full dark:bg-white/5 bg-white rounded-t-[40px] px-3"
                    >
                        <View className={clsx(
                            "w-full flex items-center",
                            task.type == "event" ? "flex-col-reverse" : "pt-6",
                        )}>
                            <View className={clsx(
                                "w-full flex flex-row flex-wrap items-center px-3",
                                task.type == "event" ? "gap-6" : "justify-between gap-[10px_0px]",
                            )}>
                                <View className={clsx(
                                    "flex flex-row items-center shrink-0",
                                    task.type == "task" ? "w-[30%] gap-3" : "gap-5",
                                )}>
                                    {
                                        ((task.type == "task" && task.done) || (task.type == "event")) && (
                                            <>
                                                <View>
                                                    <MaterialCommunityIcons
                                                        name="clock-time-four"
                                                        size={25}
                                                        color={COLORS.emerald[500]}
                                                    />
                                                </View>

                                                <TextAnimated
                                                    numberOfLines={1}
                                                    className="text-lg tracking-widest opacity-80"
                                                >
                                                    {displayedStartTime}
                                                </TextAnimated>
                                            </>
                                        )
                                    }
                                </View>

                                <View className={clsx(
                                    "flex flex-row items-center shrink-0",
                                    task.type == "event" && "gap-5",
                                )}>
                                    {
                                        task.type == "task" && taskDone && (
                                            <View className="flex flex-row items-center gap-3">
                                                <View>
                                                    <Text
                                                        numberOfLines={1}
                                                        className="text-lg text-emerald-500"
                                                    >
                                                        {t("[id]_task_done")}
                                                    </Text>
                                                </View>

                                                <View>
                                                    <Entypo
                                                        name="check"
                                                        size={25}
                                                        color={COLORS.emerald[500]}
                                                    />
                                                </View>
                                            </View>
                                        )
                                    }

                                    {
                                        task.type == "event" && (
                                            <>
                                                <View>
                                                    <FontAwesome6
                                                        name="arrow-right"
                                                        size={25}
                                                        color={COLORS.emerald[500]}
                                                    />
                                                </View>

                                                <TextAnimated className="text-lg tracking-widest opacity-80">
                                                    {displayedEndTime}
                                                </TextAnimated>
                                            </>
                                        )
                                    }
                                </View>

                                {
                                    task.type == "task" && taskArchived && (
                                        <View className="flex justify-center items-center px-3 pb-2 dark:bg-white/10 bg-black/5 rounded-2xl border dark:border-white/5 border-black/5 pr-4 pt-4">
                                            <View
                                                style={{
                                                    transform: [
                                                        {
                                                            translateX: -5
                                                        }
                                                    ]
                                                }}
                                                className="absolute right-0 top-0 opacity-60"
                                            >
                                                <Entypo
                                                    name="price-tag"
                                                    size={15}
                                                    color={COLORS.emerald[500]}
                                                />
                                            </View>

                                            <TextAnimated
                                                numberOfLines={1}
                                                className="opacity-60"
                                            >
                                                {t("[id]_archived")}
                                            </TextAnimated>
                                        </View>
                                    )
                                }
                            </View>

                            <View className={clsx(
                                "w-full flex flex-row flex-wrap items-center gap-2 pt-3 pr-3 mb-3",
                                task.type == "task" && !taskDone && "justify-between",
                                task.type == "event" && !taskDone && "justify-end",
                            )}>
                                {
                                    task.type == "task" && !taskDone && (
                                        <View className="w-[30%] flex flex-row items-center gap-3 shrink-0">
                                            <View>
                                                <MaterialCommunityIcons
                                                    name="clock-time-four"
                                                    size={25}
                                                    color={COLORS.emerald[500]}
                                                />
                                            </View>

                                            <TextAnimated className="text-lg tracking-widest opacity-80">
                                                {displayedStartTime}
                                            </TextAnimated>
                                        </View>
                                    )
                                }

                                {
                                    !taskDone && (
                                        <View className={clsx(
                                            "flex flex-row justify-end gap-3 pl-3",
                                            task.type == "task" ? "border-l-2 border-emerald-500" : "dark:bg-white/5 bg-white px-3 py-2 rounded-2xl border dark:border-white/5 border-black/5",
                                        )}>
                                            <View className="flex flex-row items-center gap-2">
                                                <View>
                                                    <MaterialCommunityIcons
                                                        name="timer-sand"
                                                        size={25}
                                                        color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                                                    />
                                                </View>

                                                <Text className="dark:text-white/80 text-black/90 text-lg tracking-widest opacity-80">
                                                    {displayedTimeLeft ?? ""}
                                                </Text>
                                            </View>

                                            <View className="flex flex-row items-center">
                                                <TextAnimated
                                                    numberOfLines={1}
                                                    className="text-lg tracking-widest"
                                                >
                                                    {t("[id]_remaining_time")}
                                                </TextAnimated>
                                            </View>
                                        </View>
                                    )
                                }
                            </View>
                        </View>

                        {
                            task.title && (
                                <View className="w-full mt-5 border-b-2 dark:border-white/10 border-black/10 pb-3 px-2">
                                    <TextAnimated className="text-lg">
                                        {task.title}
                                    </TextAnimated>
                                </View>
                            )
                        }

                        {
                            task.content && (
                                <View className="w-full mt-5">
                                    <View className="absolute left-0 top-0 w-[2px] h-full flex items-center dark:bg-white/40 bg-black/50">
                                        <View className="absolute size-[15px] bg-emerald-500 rounded-full" />
                                    </View>

                                    <View className="w-full pt-5 pb-3 px-2 pl-4">
                                        <TextAnimated className="text-lg">
                                            {task.content}
                                        </TextAnimated>
                                    </View>
                                </View>
                            )
                        }
                    </View>
                </Animated.ScrollView>

                {
                    !taskDone && task.type == "task" && (
                        <View
                            style={{
                                transform: [
                                    {
                                        translateX: -20,
                                    },
                                    {
                                        translateY: -50,
                                    },
                                ]
                            }}
                            className="absolute right-0 bottom-0 z-[20]"
                        >
                            <PressableAnimated
                                scale={.95}
                                className="flex items-center rounded-2xl"
                            >
                                <View
                                    style={{
                                        transform: [
                                            {
                                                translateY: 8,
                                            }
                                        ],
                                        filter: "blur(5px)",
                                    }}
                                    className="absolute size-full bg-black/50 rounded-2xl"
                                />

                                <View className="flex flex-row justify-center items-center bg-emerald-500 border-2 border-black/10 px-5 py-3 rounded-2xl">
                                    <Text className="text-black font-bold text-2xl tracking-widest">
                                        {t("[id]_submit")}
                                    </Text>
                                </View>
                            </PressableAnimated>
                        </View>
                    )
                }

                <View
                    style={{
                        transform: [
                            {
                                translateY: 20,
                            }
                        ]
                    }}
                    className="absolute left-0 bottom-0 w-full h-[40px]"
                >
                    <LinearGradient
                        colors={theme == "dark" ?
                            ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)"]
                            :
                            ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", " rgba(255, 255, 255, 0)"]
                        }
                        start={{ x: 0, y: 1 }}
                        end={{ x: 0, y: 0 }}
                        locations={[0, .6, 1]}
                        className="size-full"
                    >
                        <LinearGradient
                            colors={theme == "dark" ?
                                ["rgba(255, 255, 255, .1)", "rgba(255, 255, 255, .1)", "rgba(255, 255, 255, 0)"]
                                :
                                ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", " rgba(255, 255, 255, 0)"]
                            }
                            start={{ x: 0, y: 1 }}
                            end={{ x: 0, y: 0 }}
                            locations={[0, .6, 1]}
                            className="size-full"
                        />
                    </LinearGradient>
                </View>
            </View>
        </Container>
    );
};