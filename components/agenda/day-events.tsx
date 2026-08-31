import { daysTranslation } from "@/constants/calendar";
import { COLORS } from "@/constants/colors";
import { ICON_TYPE } from "@/constants/icons";
import { useTasks } from "@/hooks/database/use-tasks";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { TaskType } from "@/types/task";
import { Entypo, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import clsx from "clsx";
import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, FlatList, Pressable, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, FadeIn, FadeInUp, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import { Icon } from "../icon";
import { PressableAnimated } from "../pressable-animated";
import { Skeleton } from "../skeleton";
import { TextAnimated } from "../text-animated";

export const CALENDAR_TASK_HEIGHT = 85;

export const parseCalendarDate = (entry: Date) => {
    const date = new Date(entry);

    return String(date.getHours()).padStart(2, "0") + " : " + String(date.getMinutes()).padStart(2, "0");
}

interface Props {
    targetDate: Date | null;
    setTargetDate: (entry: Date | null) => void;
}

export const CalendarDayEvents = memo(({ targetDate, setTargetDate }: Props) => {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const { theme } = useTheme();
    const { t, i18n } = useTranslation();
    const [event, setEvents] = useState<TaskType[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [eventsCount, setEventsCount] = useState<number>(0);
    const eventsGap = 15;
    const { getTasksByDate: getEventsByDate, getTasksCountByDate: getEventsCountByDate } = useTasks();
    const limit = 10;
    const { setToast } = useToast();
    const active = useSharedValue<boolean>(false);
    const timeout = useRef<ReturnType<typeof setTimeout>>(null);
    const closeTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    const position = useSharedValue<{
        x: number;
        y: number;
    } | null>(null);
    const contextMenuWidth = 150;
    const contextMenuHeight = 130;
    const viewLayout = useSharedValue<{
        x: number;
        y: number;
        width: number,
        height: number,
    }>({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    });
    const [selected, setSelected] = useState<TaskType | null>(null);
    const router = useRouter();

    const displayDay = useMemo(() => {
        return !targetDate ? "" : (`${daysTranslation[i18n.language == "fr" ? "fr" : "en"][targetDate.getDay() > 0 ? targetDate.getDay() - 1 : 0]}, ${format(targetDate, i18n.language == "fr" ? "dd / MM / yyyy" : "M / dd / yyyy")}`);
    }, [i18n.language, targetDate]);

    const renderItem = useCallback(({ item: event, index }: { item: TaskType; index: number }) => {
        let iconData: ICON_TYPE | null = null;

        if (event.icon) {
            const data = JSON.parse(event.icon);

            if (data.name && data.packageName) {
                iconData = data;
            }
        }

        return (
            <Animated.View entering={FadeInUp
                .delay(index * 100)
                .duration(200)
                .easing(Easing.inOut(Easing.quad))
            }>
                <Pressable
                    delayLongPress={150}
                    onPress={() => {
                        if (selected) return;
                        router.navigate({
                            pathname: "/(protected)/(task)/[id]",
                            params: {
                                id: event.idTask,
                            }
                        });
                        handleClose();
                    }}
                    onLongPress={(e) => {
                        const { pageX, pageY } = e.nativeEvent;

                        setSelected(event);
                        position.value = {
                            x: pageX > (screenWidth / 2) ? pageX - contextMenuWidth : pageX,
                            y: pageY > (screenHeight * .7) ? pageY - (contextMenuHeight + (contextMenuHeight / 2)) : pageY,
                        };
                    }}
                    style={{
                        height: CALENDAR_TASK_HEIGHT,
                    }}
                    className={clsx(
                        "w-full flex flex-row justify-between items-center dark:bg-black bg-[rgba(0,0,0,.05)] rounded-2xl px-3 border-2",
                        selected?.idTask == event.idTask ? "dark:border-emerald-500/20 border-emerald-500/50" : "dark:border-white/5 border-black/5"
                    )}
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
                                {parseCalendarDate(event.startAt)}
                            </TextAnimated>
                        </View>
                    </View>

                    <View className="w-[80%] flex gap-1 border-l-2 border-emerald-500/60 px-3">
                        <View className="w-full">
                            <TextAnimated
                                numberOfLines={1}
                                className="text-lg"
                            >
                                {event.title ?? ""}
                            </TextAnimated>
                        </View>

                        <View className="w-full">
                            <View className="w-full flex flex-row items-center gap-3">
                                <TextAnimated
                                    numberOfLines={1}
                                    className="opacity-70 tracking-wider"
                                >
                                    {parseCalendarDate(event.startAt)}
                                </TextAnimated>
                                {
                                    event.endAt && (
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
                                                {parseCalendarDate(event.endAt)}
                                            </TextAnimated>
                                        </>
                                    )
                                }
                            </View>
                        </View>
                    </View>
                </Pressable>
            </Animated.View>
        );
    }, [screenWidth, screenHeight, selected]);

    const listFooterComponent = useCallback(() => {
        if (loading) {
            return (
                <View
                    style={{
                        gap: eventsGap,
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
                                    height: CALENDAR_TASK_HEIGHT
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

    const handleGetEvents = useCallback(async () => {
        if (loading || !targetDate || !active.value) return;
        setLoading(true);

        try {
            const data = await getEventsByDate(targetDate, limit, event.length) as TaskType[];

            setEvents(prev => [...prev, ...data]);
            setLoading(false);
        }
        catch (e) {
            setLoading(false);
            setToast(t("sqlite_error"), "error");
        }
    }, [loading, i18n.language, targetDate, event]);

    const handleGetEventsCount = useCallback(async () => {
        if (loading || !targetDate) return;

        try {
            const data = await getEventsCountByDate(targetDate) as number;

            setEventsCount(data);
        }
        catch (e) {
            setToast(t("sqlite_error"), "error");
        }
    }, [loading, i18n.language, targetDate]);

    useEffect(() => {
        const onBackPress = () => {
            if (position.value) {
                setSelected(null);
                position.value = null;
                return true;
            }
            else if (active.value) {
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
                handleGetEventsCount();
                handleGetEvents();
            }, 800);
        }

        return () => remove();
    }, [targetDate]);

    const getItemLayout = useCallback((_data: unknown, index: number) => ({
        length: CALENDAR_TASK_HEIGHT + eventsGap,
        offset: index * (eventsGap + CALENDAR_TASK_HEIGHT),
        index,
    }), []);

    const onEndReached = useCallback(() => {
        if (loading || event.length >= eventsCount || !active.value) return;
        handleGetEvents();
    }, [loading, eventsCount, event]);

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
            setEvents([]);
            setEventsCount(0);
        }, 500);
    }, []);

    const contextMenuAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: position.value ?
                    withTiming(position.value.x, {
                        duration: 200,
                        easing: Easing.inOut(Easing.quad),
                    })
                    :
                    0
            },
            {
                translateY: position.value ?
                    withTiming(position.value.y, {
                        duration: 200,
                        easing: Easing.inOut(Easing.quad),
                    })
                    :
                    0
            },
            {
                scale: position.value ?
                    withSpring(1, {
                        stiffness: 80,
                        damping: 8,
                        mass: 1,
                    })
                    :
                    0
            },
        ],
        opacity: position.value ?
            withDelay(
                100,
                withTiming(1, {
                    duration: 250,
                    easing: Easing.inOut(Easing.quad),
                })
            )
            :
            0,
    }));

    const tapGesture = useMemo(() => {
        return (
            Gesture.Tap()
                .maxDistance(1)
                .maxDuration(100)
                .onEnd(({ x, y }) => {
                    if (
                        position.value
                        &&
                        (
                            (x < position.value.x || x > (position.value.x + contextMenuWidth))
                            ||
                            (y < position.value.y || (y > (position.value.y + contextMenuHeight)))
                        )
                    ) {
                        runOnJS(setSelected)(null);
                        position.value = null;
                    }
                    else if (
                        (x < viewLayout.value.x || x > (viewLayout.value.x + viewLayout.value.width))
                        ||
                        (y < viewLayout.value.y || (y > (viewLayout.value.y + viewLayout.value.height)))
                    ) {
                        runOnJS(handleClose)();
                    }
                })
        );
    }, []);

    const handleContextMenuButtonPress = useCallback((entry: "edit" | "duplicate") => {
        if (!selected) return;
        router.navigate({
            pathname: "/(protected)/(task)/create",
            params: {
                target: "event",
                action: entry,
                date: selected.startAt.toString(),
                data: JSON.stringify(selected),
            }
        });
    }, [selected]);

    return (
        <GestureDetector gesture={tapGesture}>
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
                <Animated.View
                    onLayout={(e) => {
                        viewLayout.value = ({
                            x: e.nativeEvent.layout.x,
                            y: e.nativeEvent.layout.y,
                            width: e.nativeEvent.layout.width,
                            height: e.nativeEvent.layout.height,
                        });
                    }}
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
                            data={event}
                            keyExtractor={(item) => item.idTask}
                            renderItem={renderItem}
                            updateCellsBatchingPeriod={0}
                            scrollEventThrottle={16}
                            onEndReachedThreshold={.1}
                            ListFooterComponent={listFooterComponent}
                            getItemLayout={getItemLayout}
                            onEndReached={onEndReached}
                            className="w-full h-full"
                            contentContainerStyle={{
                                gap: eventsGap,
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

                <Animated.View
                    style={[
                        contextMenuAnimation,
                        {
                            width: contextMenuWidth,
                            height: contextMenuHeight,
                        }
                    ]}
                    className="absolute left-0 top-0 dark:bg-black bg-white rounded-2xl"
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
                        className="absolute left-0 top-0 size-full bg-black/30"
                    />

                    <View className="size-full flex items-center gap-3 px-3 py-5 dark:bg-white/10 bg-white rounded-2xl border-2 dark:border-white/5 border-black/5">
                        <PressableAnimated
                            onPress={() => handleContextMenuButtonPress("edit")}
                            className="w-full flex flex-row items-center"
                        >
                            <View className="w-[30%]">
                                <MaterialCommunityIcons
                                    name="calendar-edit"
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
                            onPress={() => { }}
                            className="w-full flex flex-row items-center"
                        >
                            <View className="w-[30%]">
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
                            onPress={() => handleContextMenuButtonPress("duplicate")}
                            className="w-full flex flex-row items-center"
                        >
                            <View className="w-[30%]">
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
        </GestureDetector>
    );
});