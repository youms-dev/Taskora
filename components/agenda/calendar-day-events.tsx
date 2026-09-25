import { daysTranslation } from "@/constants/calendar";
import { COLORS } from "@/constants/colors";
import { ICON_TYPE } from "@/constants/icons";
import { useTasks } from "@/hooks/database/use-tasks";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { event as eventEmitter, EVENTS_CHANGED, TOUCHABLE_NAVBAR, UNTOUCHABLE_NAVBAR } from "@/lib/event-emitter";
import { TaskType as EventType } from "@/types/task";
import { Entypo, FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import clsx from "clsx";
import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { cancelScheduledNotificationAsync, dismissNotificationAsync } from "expo-notifications";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, BackHandler, FlatList, GestureResponderEvent, Pressable, useWindowDimensions, Vibration, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, FadeIn, FadeInUp, SharedValue, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Icon } from "../icon";
import { PressableAnimated } from "../pressable-animated";
import { Skeleton } from "../skeleton";
import { TextAnimated } from "../text-animated";

export const CALENDAR_TASK_HEIGHT = 85;

export const parseCalendarDate = (entry: Date | number) => {
    const date = new Date(entry);

    return String(date.getHours()).padStart(2, "0") + " : " + String(date.getMinutes()).padStart(2, "0");
}

interface Props {
    targetDate: Date | null;
    setTargetDate: (entry: Date | null) => void;
    refreshing: SharedValue<boolean>;
}

export const CalendarDayEvents = memo(({ targetDate, setTargetDate, refreshing }: Props) => {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const { theme } = useTheme();
    const { t, i18n } = useTranslation();
    const [events, setEvents] = useState<EventType[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [eventsCount, setEventsCount] = useState<number>(0);
    const eventsGap = 15;
    const { getTasksByDate: getEventsByDate, getTasksCountByDate: getEventsCountByDate, deleteTasks: deleteEvents } = useTasks();
    const limit = 10;
    const { setToast, setDismiss } = useToast();
    const active = useSharedValue<boolean>(false);
    const timeout = useRef<ReturnType<typeof setTimeout>>(null);
    const closeTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    const position = useSharedValue<{
        x: number;
        y: number;
    } | null>(null);
    const contextMenuWidth = 150;
    const contextMenuHeight = useSharedValue<number>(0);
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
    const [selected, setSelected] = useState<EventType | null>(null);
    const router = useRouter();
    const init = useRef<boolean>(true);
    const eventsTmp = useRef<EventType[]>([]);
    const loadingRef = useRef<boolean>(false);
    const [editable, setEditable] = useState<boolean>(false);

    const displayDay = useMemo(() => {
        return !targetDate ? "" : (`${daysTranslation[i18n.language == "fr" ? "fr" : "en"][targetDate.getDay() > 0 ? targetDate.getDay() - 1 : 0]}, ${format(targetDate, i18n.language == "fr" ? "dd / MM / yyyy" : "M / dd / yyyy")}`);
    }, [i18n.language, targetDate]);

    const onPress = useCallback((event: EventType) => {
        if (selected) return;
        router.navigate({
            pathname: "/(protected)/(task)/[id]",
            params: {
                id: event.idTask,
            }
        });
        handleClose();
    }, [selected]);

    const onLongPress = useCallback((e: GestureResponderEvent, event: EventType) => {
        const { pageX, pageY } = e.nativeEvent;
        const date = new Date();

        setSelected(event);

        if (event.startAt > date.getTime()) {
            setEditable(true);
        }
        else {
            setEditable(false);
        }

        !position.value && Vibration.vibrate(100);
        position.value = {
            x: pageX > (screenWidth / 2) ? pageX - contextMenuWidth : pageX,
            y: pageY > (screenHeight * .7) ? pageY - (contextMenuHeight.value + (contextMenuHeight.value / 2)) : pageY,
        };
        eventEmitter.emit(UNTOUCHABLE_NAVBAR);
    }, [selected, screenHeight, screenHeight]);

    const renderItem = useCallback(({ item: event, index }: { item: EventType; index: number }) => {
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
                    onPress={() => onPress(event)}
                    onLongPress={(e) => onLongPress(e, event)}
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
    }, [selected, onLongPress, onPress]);

    const listFooterComponent = useCallback(() => {
        if (loading && eventsTmp.current.length == 0) {
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

    const listEmptyComponent = useCallback(() => {
        if (!loading && events.length == 0 && !init) {
            return (
                <View className="w-full flex justify-center items-center gap-3 pt-10">
                    <View>
                        <MaterialCommunityIcons
                            name="calendar-remove"
                            size={120}
                            color={theme == "dark" ? "rgba(255, 255, 255, .1)" : "rgba(0, 0, 0, .1)"}
                        />
                    </View>

                    <View>
                        <TextAnimated className="font-bold text-lg tracking-wider opacity-50">
                            {t("agenda_no_event")}
                        </TextAnimated>
                    </View>
                </View>
            );
        }
        return null;
    }, [loading, events, theme]);

    const handleGetEvents = useCallback(async (refresh: boolean = false) => {
        if (loadingRef.current || !targetDate || !active.value) return;
        setLoading(true);

        try {
            const data = await getEventsByDate(targetDate, refresh ? events.length : limit, refresh ? 0 : events.length) as EventType[];

            if (refresh) setEvents(data);
            else setEvents(prev => [...prev, ...data]);
            setLoading(false);
            init.current = false;
        }
        catch (e) {
            setLoading(false);
            setToast(t("sqlite_error"), "error");
        }
    }, [i18n.language, targetDate, events]);

    const handleGetEventsCount = useCallback(async () => {
        if (!targetDate) return;

        try {
            const data = await getEventsCountByDate(targetDate) as number;

            setEventsCount(data);
        }
        catch (e) {
            setToast(t("sqlite_error"), "error");
        }
    }, [i18n.language, targetDate]);

    useEffect(() => {
        const onBackPress = () => {
            if (position.value) {
                setSelected(null);
                position.value = null;
                eventEmitter.emit(TOUCHABLE_NAVBAR);

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
        if (loading || events.length >= eventsCount || !active.value || eventsTmp.current.length > 0) return;
        handleGetEvents();
    }, [loading, eventsCount, events]);

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
        position.value = null;
        setSelected(null);
        closeTimeout.current = setTimeout(() => {
            setTargetDate(null);
            setEvents([]);
            setEventsCount(0);
        }, 500);
        eventEmitter.emit(TOUCHABLE_NAVBAR);
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
                            (y < position.value.y || (y > (position.value.y + contextMenuHeight.value)))
                        )
                    ) {
                        scheduleOnRN(setSelected, null);
                        position.value = null;
                    }
                    else if (
                        (x < viewLayout.value.x || x > (viewLayout.value.x + viewLayout.value.width))
                        ||
                        (y < viewLayout.value.y || (y > (viewLayout.value.y + viewLayout.value.height)))
                    ) {
                        scheduleOnRN(handleClose);
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
        handleClose();
    }, [selected]);

    useEffect(() => {
        const onChange = () => {
            handleGetEventsCount();
            handleGetEvents(true);
            handleClose();
        }

        eventEmitter.addListener(EVENTS_CHANGED, onChange);

        return () => {
            eventEmitter.removeListener(EVENTS_CHANGED);
        }
    }, []);

    const onCreateButtonPress = useCallback(() => {
        if (!targetDate) return;
        router.navigate({
            pathname: "/(protected)/(task)/create",
            params: {
                target: "event",
                date: String(targetDate),
                action: "create",
            },
        });
        handleClose();
    }, [targetDate]);

    const handleDeleteEvent = useCallback(async (entry: EventType | null = null) => {
        if ((loadingRef.current && !entry) || (!loadingRef.current && !selected)) return;

        if (!entry) {
            setLoading(true);
            eventsTmp.current = [...events];
            setEvents(prev => [...prev.filter(e => e.idTask != selected?.idTask)]);
            setEventsCount(prev => prev - 1);
            position.value = null;

            setDismiss(
                () => {
                    handleDeleteEvent(selected);
                },
                () => {
                    if (eventsTmp.current.length > 0) {
                        setEvents(() => {
                            setEventsCount(prev => prev + 1);

                            return [...eventsTmp.current];
                        });
                    }
                    eventsTmp.current = [];
                    setLoading(false);
                },
                5,
                60,
            );
            setSelected(null);

            return;
        }

        try {
            await deleteEvents([entry.idTask]);
            await cancelScheduledNotificationAsync(entry.notificationId);
            await dismissNotificationAsync(entry.notificationId);

            eventsTmp.current = [];
            refreshing.value = true;
            if (events.length < eventsCount && events.length < limit) {
                loadingRef.current = false;
                handleGetEvents(true);
            }
            else {
                setLoading(false);
            }
        }
        catch (e) {
            if (eventsTmp.current.length > 0) {
                setEvents(() => {
                    setEventsCount(prev => prev + 1);

                    return [...eventsTmp.current];
                });
            }
            setLoading(false);
            eventsTmp.current = [];
            setToast(t("sqlite_error"), "error");
            console.log(e);
        }
    }, [setToast, setDismiss, i18n.language, selected, events, eventsCount]);

    useEffect(() => {
        loadingRef.current = loading;
    }, [loading]);

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
                                <View className="max-w-[70%]">
                                    <TextAnimated
                                        numberOfLines={1}
                                        className="text-xl"
                                    >
                                        {displayDay}
                                    </TextAnimated>
                                </View>

                                <View className="flex flex-row items-center gap-6">
                                    <PressableAnimated
                                        scale={.95}
                                        onPress={() => handleGetEvents(true)}
                                    >
                                        {
                                            loading ?
                                                (
                                                    <ActivityIndicator
                                                        size={24}
                                                        color={COLORS.emerald[500]}
                                                    />
                                                )
                                                :
                                                (
                                                    <FontAwesome6
                                                        name="rotate-right"
                                                        size={24}
                                                        color={theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)"}
                                                    />
                                                )
                                        }
                                    </PressableAnimated>

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
                                </View>
                            </LinearGradient>
                        </LinearGradient>

                        <FlatList
                            horizontal={false}
                            showsVerticalScrollIndicator={false}
                            removeClippedSubviews
                            data={events}
                            keyExtractor={(item) => item.idTask}
                            renderItem={renderItem}
                            updateCellsBatchingPeriod={0}
                            scrollEventThrottle={16}
                            onEndReachedThreshold={.1}
                            ListFooterComponent={listFooterComponent}
                            ListEmptyComponent={listEmptyComponent}
                            getItemLayout={getItemLayout}
                            onEndReached={onEndReached}
                            className="w-full h-full"
                            contentContainerStyle={{
                                gap: eventsGap,
                            }}
                            contentContainerClassName="w-full flex px-3 pt-[65px] pb-[50px]"
                        />

                        <View
                            style={{
                                transform: [
                                    {
                                        translateX: -15,
                                    },
                                    {
                                        translateY: -20,
                                    },
                                ]
                            }}
                            className="absolute right-0 bottom-0 z-[20]"
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
                                className="absolute left-0 top-0 size-full rounded-full dark:bg-black/50 bg-black/30"
                            />

                            <PressableAnimated
                                scale={.95}
                                onPress={onCreateButtonPress}
                                className="size-[40px] rounded-full"
                            >
                                <View className="size-full flex justify-center items-center rounded-full bg-emerald-500 border border-black/5">
                                    <FontAwesome5
                                        name="plus"
                                        size={20}
                                        color="black"
                                    />
                                </View>
                            </PressableAnimated>
                        </View>

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

                {/* Context menu */}

                <Animated.View
                    onLayout={(e) => contextMenuHeight.value = e.nativeEvent.layout.height}
                    style={[
                        contextMenuAnimation,
                        {
                            width: contextMenuWidth,
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
                        {
                            editable && (
                                <PressableAnimated
                                    scale={.95}
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
                            )
                        }

                        <PressableAnimated
                            scale={.95}
                            onPress={() => handleDeleteEvent()}
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
                            scale={.95}
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