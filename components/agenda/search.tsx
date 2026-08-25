import { COLORS } from "@/constants/colors";
import { ICON_TYPE } from "@/constants/icons";
import { CalendarType } from "@/hooks/agenda/use-calendar";
import { useTasks } from "@/hooks/database/use-tasks";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { event, SHOW_NAVBAR } from "@/lib/event-emitter";
import { TaskType } from "@/types/task";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { memo, RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, PressableProps, Text, TextInput, useWindowDimensions, View } from "react-native";
import Animated, { Easing, Extrapolation, FadeIn, FadeInUp, FadeOut, interpolate, runOnJS, SharedValue, useAnimatedProps, useAnimatedReaction, useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Icon } from "../icon";
import { PressableAnimated } from "../pressable-animated";
import { Skeleton } from "../skeleton";
import { TextAnimated } from "../text-animated";
import { CALENDAR_TASK_HEIGHT, parseCalendarDate } from "./date-tasks";

interface EventCardProps extends PressableProps {
    task: TaskType;
    index: number;
}

const EventCard = memo(({ task, index, ...rest }: EventCardProps) => {
    let iconData: ICON_TYPE | null = null;

    if (task.icon) {
        const data = JSON.parse(task.icon);

        if (data.name && data.packageName) {
            iconData = data;
        }
    }

    return (
        <Animated.View
            style={{
                height: CALENDAR_TASK_HEIGHT,
            }}
            className="w-full flex flex-row justify-between items-center dark:bg-white/5 bg-white rounded-2xl px-3 border-2 dark:border-white/5 border-black/5"
        >
            <View className="w-[20%] flex items-center">
                {
                    iconData && (
                        <View className="size-[40px] flex justify-center items-center dark:bg-black rounded-full">
                            {
                                <View className="size-full flex justify-center items-center dark:bg-white/10 bg-black/5 rounded-full border-2 dark:border-white/5 border-black/5">
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
                        {parseCalendarDate(task.startAt)}
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
                            {parseCalendarDate(task.startAt)}
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
                                        {parseCalendarDate(task.endAt)}
                                    </TextAnimated>
                                </>
                            )
                        }
                    </View>
                </View>
            </View>
        </Animated.View>
    );
});

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
    active: SharedValue<boolean>;
    context: Pick<CalendarType, "generateMonths" | "months">
    mutation: RefObject<"append" | "prepend" | "generate" | null>;
    flatListRef: RefObject<FlatList | null>;
    animationRef: RefObject<boolean>;
}

export const CalendarSearch = memo(({ active, context, mutation, flatListRef: calendar, animationRef }: Props) => {
    const { theme } = useTheme();
    const scrollY = useSharedValue<number>(0);
    const flatListRef = useAnimatedRef<Animated.FlatList>();
    const scrollCheckPoint = 100;
    const { width: screenWidth } = useWindowDimensions();
    const screenWidthShared = useSharedValue<typeof screenWidth>(0);
    const themeShared = useSharedValue<typeof theme>("dark");
    const textInputRef = useRef<TextInput>(null);
    const [value, setValue] = useState<string>("");
    const searchTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const limit = 10;
    const { searchTasks } = useTasks();
    const { } = useToast();
    const [count, setCount] = useState<number>(0);
    const [tasks, setTasks] = useState<TaskType[]>([]);
    const { t, i18n } = useTranslation();
    const tasksGap = 20;
    const textInputWidth = useSharedValue<number>(0);
    const { generateMonths, months } = context;

    const monthsMap = useMemo(() => {
        return (
            new Map(
                months.map((m, i) => [format(m, "MMMM yyyy"), {
                    data: m,
                    index: i,
                }]),
            )
        );
    }, [months]);

    const tasksMap = useMemo(() => {
        return (
            new Map(
                tasks.map((t) => [t.idTask, t])
            )
        );
    }, [tasks]);

    const onSearchScroll = useAnimatedScrollHandler({
        onScroll: (e) => {
            const y = e.contentOffset.y;

            scrollY.value = y;
        }
    });

    const textInputAnimation = useAnimatedStyle(() => ({
        width: interpolate(
            scrollY.value,
            [0, scrollCheckPoint],
            [screenWidthShared.value * .95, screenWidthShared.value * .8],
            Extrapolation.CLAMP,
        ),
        transform: [
            {
                translateX: interpolate(
                    scrollY.value,
                    [0, scrollCheckPoint],
                    [-((screenWidthShared.value / 2) - (textInputWidth.value / 2)), -5],
                    Extrapolation.CLAMP,
                )
            },
            {
                translateY: interpolate(
                    scrollY.value,
                    [0, scrollCheckPoint],
                    [70, 4],
                    Extrapolation.CLAMP,
                )
            }
        ],
        borderWidth: 1,
        borderColor: themeShared.value == "dark" ?
            "rgba(255,255, 255, .1)"
            :
            (scrollY.value >= scrollCheckPoint ? "rgba(0, 0, 0, .1)" : "rgba(0, 0, 0, 0)"),
        borderRadius: 30,
    }));

    const searchSectionAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: active.value ? withTiming(0, {
                    duration: 500,
                    easing: Easing.inOut(Easing.quad),
                }) : 50,
            }
        ],
        opacity: active.value ? withTiming(1, {
            duration: 500,
            easing: Easing.inOut(Easing.linear),
        }) : 0,
        zIndex: active.value ? 100 : -100,
    }));

    useEffect(() => {
        screenWidthShared.value = screenWidth;
    }, [screenWidth]);

    useEffect(() => {
        themeShared.value = theme;
    }, [theme]);

    const handleSearch = useCallback(async (value: string, pagination: boolean = false) => {
        searchTimeout.current && clearTimeout(searchTimeout.current);
        if (value.trim().length == 0) {
            setCount(0);
            setTasks([]);
            setLoading(false);
            return;
        }
        if (loading) return;
        setLoading(true);
        searchTimeout.current = setTimeout(async () => {
            try {
                const { data, count } = await searchTasks(value, limit, pagination ? tasksMap.size : 0, false, "event") as {
                    data: TaskType[];
                    count: number;
                };

                setCount(count);
                if (pagination) {
                    setTasks(prev => [...prev, ...data.filter((task) => !tasksMap.get(task.idTask))]);
                }
                else {
                    setTasks([...data]);
                }
                setLoading(false);
            }
            catch (e) {
                setLoading(false);
                console.log(e);
            }
        }, 100);
    }, [tasksMap]);

    const renderItem = useCallback(({ item: task, index }: { item: TaskType; index: number }) => {
        const targetDate = new Date(task.plannedDate);
        const mapData = monthsMap.get(format(targetDate, "MMMM yyyy"));

        return (
            <AnimatedPressable
                entering={FadeInUp
                    .delay(index * 100)
                    .springify()
                    .stiffness(100)
                    .damping(5)
                    .mass(1)
                }
                exiting={FadeOut
                    .duration(500)
                    .easing(Easing.inOut(Easing.quad))
                }
                onPress={() => {
                    if (mapData) {
                        calendar.current?.scrollToIndex({
                            index: mapData.index,
                        });
                    }
                    else {
                        animationRef.current = true;
                        mutation.current = "generate";
                        generateMonths("month", targetDate.getMonth());
                    }
                    handleClose();
                }}
                className="w-full"
            >
                <EventCard
                    task={task}
                    index={index}
                />
            </AnimatedPressable>
        )
    }, [monthsMap]);

    const listFooterComponent = useCallback(() => {
        if (loading) {
            return (
                <View
                    style={{
                        gap: tasksGap,
                    }}
                    className="w-screen flex items-center px-3"
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
        if (!loading && value.trim().length > 0) {
            return (
                <View className="w-screen flex justify-center items-center gap-4 pt-10">
                    <MaterialIcons
                        name="playlist-remove"
                        size={120}
                        color={theme == "dark" ? "rgba(255, 255, 255, .1)" : "rgba(0, 0, 0, .1)"}
                    />
                    <Text className="dark:text-white/50 text-black/50 font-bold text-lg tracking-wider">
                        {t("tasks_search_tasks_empty")}
                    </Text>
                </View>
            );
        }
        return null;
    }, [loading, i18n.language, value, theme]);

    useEffect(() => {
        const { remove } = Keyboard.addListener("keyboardDidHide", () => {
            if (!textInputRef.current) return;
            textInputRef.current.blur();
        });

        return () => remove();
    }, []);

    useEffect(() => {
        const { remove } = BackHandler.addEventListener("hardwareBackPress", () => {
            if (active.value) {
                searchTimeout.current && clearTimeout(searchTimeout.current);
                textInputRef.current?.blur();
                setCount(0);
                setTasks([]);
                setValue("");
                setLoading(false);
                active.value = false;
                event.emit(SHOW_NAVBAR);

                return true;
            }

            return false;
        });


        return () => {
            remove();
            searchTimeout.current && clearTimeout(searchTimeout.current);
        };
    }, []);

    const onMomentumScrollEnd = useAnimatedProps(() => ({
        onMomentumScrollEnd: () => {
            if (scrollY.value > 0 && scrollY.value < (scrollCheckPoint * .5)) {
                flatListRef.current?.scrollToOffset({
                    offset: 0,
                    animated: true,
                });
            }
            else if (scrollY.value >= (scrollCheckPoint * .5) && scrollY.value < scrollCheckPoint) {
                flatListRef.current?.scrollToOffset({
                    offset: scrollCheckPoint,
                    animated: true,
                });
            }
        }
    }));

    const getItemLayout = useCallback((data: any, index: number) => ({
        length: (CALENDAR_TASK_HEIGHT + tasksGap),
        offset: index * (CALENDAR_TASK_HEIGHT + tasksGap),
        index,
    }), [CALENDAR_TASK_HEIGHT, tasksGap]);

    const onEndReached = useCallback(() => {
        if (tasks.length < count && !loading) {
            handleSearch(value, true);
        }
    }, [tasks, count, loading]);

    const handleClose = useCallback(() => {
        searchTimeout.current && clearTimeout(searchTimeout.current);
        textInputRef.current?.blur();
        setCount(0);
        setTasks([]);
        setValue("");
        setLoading(false);
        active.value = false;
        event.emit(SHOW_NAVBAR);
    }, []);

    const handleFocus = useCallback(() => {
        textInputRef.current?.focus();
    }, []);

    useAnimatedReaction(
        () => active.value,
        (next, prev) => {
            if (next != prev && !next) {
                runOnJS(handleClose)();
            }
            else if (next != prev && next) {
                runOnJS(handleFocus)();
            }
        }
    )

    return (
        <Animated.View
            style={searchSectionAnimation}
            className="absolute left-0 top-0 w-screen h-screen dark:bg-black bg-white"
        >
            <View className="w-full h-full flex items-center dark:bg-black bg-[rgba(0,0,0,.05)]">
                <LinearGradient
                    colors={theme == "dark" ?
                        ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .8)", "rgba(0, 0, 0, 0)"]
                        :
                        ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    locations={[.5, .6, 1]}
                    className="absolute left-0 top-0 w-full z-[10]"
                >
                    <LinearGradient
                        colors={theme == "dark" ?
                            ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .8)", "rgba(0, 0, 0, 0)"]
                            :
                            ["rgba(0, 0, 0, .06)", "rgba(0, 0, 0, .06)", "rgba(255, 255, 255, .2)"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        locations={[.5, .6, 1]}
                        className="w-full flex flex-row justify-between px-3 pt-2 pb-8"
                    >
                        <Pressable
                            onPress={() => {
                                active.value = false;
                                event.emit(SHOW_NAVBAR);
                            }}
                            android_ripple={{
                                color: theme == "dark" ? "rgba(255, 255, 255, .2))" : "rgba(0, 0, 0, .1)",
                                foreground: true,
                                borderless: true,
                                radius: 25,
                            }}
                            className="dark:bg-black bg-white rounded-full"
                        >
                            <View className="flex flex-row gap-3 p-3 dark:bg-white/10 bg-white rounded-full border  dark:border-white/10 border-black/10">
                                <Entypo
                                    name="chevron-left"
                                    size={30}
                                    color={theme == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .5)"}
                                />
                            </View>
                        </Pressable>

                        <Animated.View
                            onLayout={(e) => textInputWidth.value = e.nativeEvent.layout.width}
                            style={textInputAnimation}
                            className="absolute right-0 top-0 w-[80%] flex items-center overflow-hidden"
                        >
                            <KeyboardAvoidingView
                                behavior={Platform.OS === "android" ? "height" : "padding"}
                                className="w-full flex items-center px-2 dark:bg-black bg-white"
                            >
                                <TextInput
                                    ref={textInputRef}
                                    placeholder={t("tasks_search")}
                                    cursorColor={theme === "dark" ? "white" : COLORS.emerald[500]}
                                    placeholderTextColor={theme === "dark" ? "rgba(255, 255, 255, .3)" : "rgba(0, 0, 0, .3)"}
                                    value={value}
                                    onChangeText={(e) => {
                                        setValue(e);
                                        handleSearch(e);
                                    }}
                                    onSubmitEditing={() => handleSearch(value)}
                                    className="w-full h-16 text-xl dark:text-white/90 text-black dark:bg-white/10 bg-white rounded-2xl pl-6 pr-14 border-b dark:border-white/20 border-black/20"
                                />

                                <PressableAnimated
                                    onPress={() => value.trim().length == 0 ? textInputRef.current?.focus() : handleSearch(value)}
                                    className="absolute top-4 right-6 z-[1]"
                                >
                                    <FontAwesome5
                                        name="search"
                                        size={24}
                                        color={theme == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .6)"}
                                    />
                                </PressableAnimated>
                            </KeyboardAvoidingView>
                        </Animated.View>
                    </LinearGradient>
                </LinearGradient>

                <Animated.FlatList
                    ref={flatListRef}
                    horizontal={false}
                    showsVerticalScrollIndicator={false}
                    windowSize={limit}
                    removeClippedSubviews
                    initialNumToRender={limit}
                    maxToRenderPerBatch={Math.round(tasks.length / 2)}
                    getItemLayout={getItemLayout}
                    data={tasks}
                    keyExtractor={(task) => (task as TaskType).idTask}
                    renderItem={renderItem}
                    scrollEventThrottle={16}
                    onScroll={onSearchScroll}
                    animatedProps={onMomentumScrollEnd}
                    onEndReachedThreshold={.1}
                    onEndReached={onEndReached}
                    ListEmptyComponent={listEmptyComponent}
                    ListFooterComponent={listFooterComponent}
                    className="w-full"
                    contentContainerStyle={{
                        gap: tasksGap,
                    }}
                    contentContainerClassName="w-full flex items-center pt-[150px] pb-[120px] px-3"
                />

                <LinearGradient
                    colors={theme == "dark" ?
                        ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .6)", "rgba(0, 0, 0, 0)"]
                        :
                        ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                    }
                    locations={[.5, .6, 1]}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    style={{
                        transform: [
                            {
                                translateY: -35,
                            }
                        ]
                    }}
                    className="absolute left-0 bottom-0 w-full z-[10]"
                >
                    <LinearGradient
                        colors={theme == "dark" ?
                            ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, .6)", "rgba(0, 0, 0, 0)"]
                            :
                            ["rgba(0, 0, 0, .06)", "rgba(0, 0, 0, .06)", "rgba(0, 0, 0, 0)"]
                        }
                        locations={[.5, .6, 1]}
                        start={{ x: 0, y: 1 }}
                        end={{ x: 0, y: 0 }}
                        className="w-full h-[50px]"
                    />
                </LinearGradient>
            </View>
        </Animated.View>
    );
}, (prev, next) => (
    Object.is(prev.context.months, next.context.months)
));