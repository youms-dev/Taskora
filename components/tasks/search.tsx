import { COLORS } from "@/constants/colors";
import { useTasks } from "@/hooks/database/use-tasks";
import { useTasksData } from "@/hooks/tasks/use-tasks-data";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { event, SHOW_NAVBAR } from "@/lib/event-emitter";
import { TaskType } from "@/types/task";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname } from "expo-router";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, PressableProps, Text, TextInput, useWindowDimensions, View } from "react-native";
import Animated, { Easing, Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { PressableAnimated } from "../pressable-animated";
import { Skeleton } from "../skeleton";
import { TextAnimated } from "../text-animated";

const FlatListAnimated = Animated.createAnimatedComponent(FlatList);

interface TaskCardProps extends Omit<PressableProps, "onLongPress" | "onPress"> {
    task: TaskType;
    onPress: (id: TaskType["idTask"]) => void;
    height: number;
}

const TaskCard = memo(({ task, onPress, height, ...rest }: TaskCardProps) => {
    const { setToast } = useToast();
    const { t } = useTranslation();

    return (
        <Pressable
            {...rest}
            onPress={() => onPress(task.idTask)}
            style={{
                height,
            }}
            className="w-full flex justify-center items-center rounded-2xl"
        >
            <View
                className="absolute w-full h-full dark:bg-black bg-white border dark:border-white/20 border-black/20 rounded-2xl z-[1]"
            >
                <View className="w-full h-full flex items-center gap-2 rounded-2xl py-2 px-3 dark:bg-white/10 bg-white">
                    {
                        task.title && (
                            <View className="w-full border-b dark:border-b-white/10 border-b-black/10 pb-1">
                                <TextAnimated
                                    numberOfLines={1}
                                    className="text-lg tracking-widest"
                                >
                                    {task.title}
                                </TextAnimated>
                            </View>
                        )
                    }

                    <View className="w-full">
                        <TextAnimated
                            numberOfLines={2}
                            className="text-lg dark:opacity-70 opacity-60"
                        >
                            {task.content}
                        </TextAnimated>
                    </View>
                </View>
            </View>
        </Pressable>
    );
});

export const TasksSearch = memo(() => {
    const { searchSectionActive, setSearchSectionActive } = useTasksData();
    const { theme } = useTheme();
    const scrollY = useSharedValue<number>(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollCheckPoint = 100;
    const { width: screenWidth } = useWindowDimensions();
    const screenWidthShared = useSharedValue<typeof screenWidth>(0);
    const themeShared = useSharedValue<typeof theme>("dark");
    const sectionActive = useSharedValue<typeof searchSectionActive>(false);
    const textInputRef = useRef<TextInput>(null);
    const [value, setValue] = useState<string>("");
    const searchTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const limit = 10;
    const { searchTasks } = useTasks();
    const { } = useToast();
    const [count, setCount] = useState<number>(0);
    const [tasks, setTasks] = useState<TaskType[]>([]);
    const pathname = usePathname();
    const { t } = useTranslation();
    const taskHeight = 100;
    const tasksGap = 20;

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
            [screenWidthShared.value, screenWidthShared.value * .8],
            Extrapolation.CLAMP,
        ),
        transform: [
            {
                translateX: interpolate(
                    scrollY.value,
                    [0, scrollCheckPoint],
                    [0, -5],
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
                translateY: sectionActive.value ? withTiming(0, {
                    duration: 200,
                    easing: Easing.inOut(Easing.quad),
                }) : 50,
            }
        ],
        opacity: sectionActive.value ? withTiming(1, {
            duration: 200,
            easing: Easing.inOut(Easing.linear),
        }) : 0,
        zIndex: sectionActive.value ? 100 : -100,
    }));

    useEffect(() => {
        screenWidthShared.value = screenWidth;
    }, [screenWidth]);

    useEffect(() => {
        themeShared.value = theme;
    }, [theme]);

    const handleSearch = useCallback(async (value: string, pagination: boolean = false) => {
        searchTimeout.current && clearTimeout(searchTimeout.current);
        if (pathname != "/" || value.trim().length == 0) {
            setCount(0);
            setTasks([]);
            setLoading(false);
            return;
        }
        if (loading) return;
        setLoading(true);
        searchTimeout.current = setTimeout(async () => {
            try {
                const { data, count } = await searchTasks(value, limit, pagination ? tasks.length : 0) as {
                    data: TaskType[];
                    count: number;
                };

                setCount(count);
                if (pagination) {
                    setTasks(prev => [...prev, ...data.filter((task) => !prev.find(t => t.idTask == task.idTask))]);
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
    }, [pathname, tasks]);

    const renderItem = useCallback((task: TaskType) => (
        <TaskCard
            height={taskHeight}
            task={task}
            onPress={() => { }}
        />
    ), [tasks, taskHeight]);

    useEffect(() => {
        const { remove } = Keyboard.addListener("keyboardDidHide", () => {
            if (!textInputRef.current) return;
            textInputRef.current.blur();
        });

        return () => remove();
    }, []);

    useEffect(() => {
        const { remove } = BackHandler.addEventListener("hardwareBackPress", () => {
            if (searchSectionActive) {
                searchTimeout.current && clearTimeout(searchTimeout.current);
                textInputRef.current?.blur();
                setSearchSectionActive(false);
                setCount(0);
                setTasks([]);
                setValue("");
                setLoading(false);
                event.emit(SHOW_NAVBAR);

                return true;
            }

            return false;
        });

        sectionActive.value = searchSectionActive;

        if (!searchSectionActive) {
            searchTimeout.current && clearTimeout(searchTimeout.current);
            textInputRef.current?.blur();
            setSearchSectionActive(false);
            setCount(0);
            setTasks([]);
            setValue("");
            setLoading(false);
            event.emit(SHOW_NAVBAR);
        }
        else {
            textInputRef.current?.focus();
        }

        return () => {
            remove();
            searchTimeout.current && clearTimeout(searchTimeout.current);
        };
    }, [searchSectionActive]);
    
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
                        <PressableAnimated
                            onPress={() => {
                                setSearchSectionActive(false);
                                event.emit(SHOW_NAVBAR);
                            }}
                            className="border dark:border-white/15 border-black/20 dark:bg-black bg-white rounded-full"
                        >
                            <View className="flex flex-row gap-3 p-3 dark:bg-white/10 bg-white rounded-full">
                                <Entypo
                                    name="chevron-left"
                                    size={30}
                                    color={theme == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .5)"}
                                />
                            </View>
                        </PressableAnimated>

                        <Animated.View
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
                                    className="w-full h-16 text-xl dark:text-white/90 text-black dark:bg-white/10 bg-white rounded-2xl pl-6 pr-12 border-b dark:border-white/20 border-black/20"
                                />

                                <PressableAnimated
                                    onPress={() => value.trim().length == 0 ? textInputRef.current?.focus() : handleSearch(value)}
                                    className="absolute top-4 right-5 z-[1]"
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

                <FlatListAnimated
                    ref={flatListRef}
                    horizontal={false}
                    showsVerticalScrollIndicator={false}
                    windowSize={limit}
                    removeClippedSubviews
                    initialNumToRender={limit}
                    maxToRenderPerBatch={limit * 2}
                    getItemLayout={(_, index) => ({
                        length: (taskHeight + tasksGap),
                        offset: index * (taskHeight + tasksGap),
                        index,
                    })}
                    data={tasks}
                    keyExtractor={(task) => (task as TaskType).idTask}
                    renderItem={({ item }) => renderItem(item as TaskType)}
                    scrollEventThrottle={16}
                    onScroll={onSearchScroll}
                    onMomentumScrollEnd={() => {
                        if (scrollY.value > 0 && scrollY.value < (scrollCheckPoint * .5)) flatListRef.current?.scrollToOffset({
                            offset: 0,
                            animated: true,
                        });
                        else if (scrollY.value >= (scrollCheckPoint * .5) && scrollY.value < scrollCheckPoint) flatListRef.current?.scrollToOffset({
                            offset: scrollCheckPoint,
                            animated: true,
                        });
                    }}
                    onEndReachedThreshold={.1}
                    onEndReached={() => tasks.length < count && !loading && handleSearch(value, true)}
                    ListEmptyComponent={() => {
                        if (!loading && value.trim().length > 0) {
                            return (
                                <View className="w-screen flex justify-center items-center gap-4 pt-10">
                                    <MaterialIcons
                                        name="playlist-remove"
                                        size={120}
                                        color={theme == "dark" ? "rgba(255, 255, 255, .2)" : "rgba(0, 0, 0, .2)"}
                                    />
                                    <Text className="dark:text-white/50 text-black/50 font-bold text-lg tracking-wider">
                                        {t("tasks_search_tasks_empty")}
                                    </Text>
                                </View>
                            );
                        }
                    }}
                    ListFooterComponent={loading ? (
                        <View className="w-screen flex gap-6 px-3 overflow-hidden pt-5">
                            {
                                Array(3).fill(0).map((_, i) => (
                                    <View
                                        key={i}
                                        className="w-full h-[100px] rounded-2xl overflow-hidden"
                                    >
                                        <Skeleton />
                                    </View>
                                ))
                            }
                        </View>
                    ) : null}
                    className="w-full"
                    contentContainerStyle={{
                        gap: tasksGap,
                    }}
                    contentContainerClassName="w-full flex items-center pt-[150px] pb-[120px] px-3"
                />

                <LinearGradient
                    colors={theme == "dark" ?
                        ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)"]
                        :
                        ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                    }
                    locations={[.5, .6, 1]}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    style={{
                        transform: [
                            {
                                translateY: -10,
                            }
                        ]
                    }}
                    className="absolute left-0 bottom-0 w-full z-[10]"
                >
                    <LinearGradient
                        colors={theme == "dark" ?
                            ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, .8)", "rgba(0, 0, 0, 0)"]
                            :
                            ["rgba(0, 0, 0, .06)", "rgba(0, 0, 0, .06)", "rgba(0, 0, 0, 0)"]
                        }
                        locations={[.5, .6, 1]}
                        start={{ x: 0, y: 1 }}
                        end={{ x: 0, y: 0 }}
                        className="w-full h-[100px]"
                    />
                </LinearGradient>
            </View>
        </Animated.View>
    );
});