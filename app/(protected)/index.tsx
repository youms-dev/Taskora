import { Checkbox } from "@/components/checkbox";
import { Container } from "@/components/container";
import { PageTitle } from "@/components/page-title";
import { PressableAnimated } from "@/components/pressable-animated";
import { Skeleton } from "@/components/skeleton";
import { TextAnimated } from "@/components/text-animated";
import { COLORS } from "@/constants/colors";
import { useTasks } from "@/hooks/use-task";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { event, HIDE_NAVBAR, SHOW_NAVBAR } from "@/lib/event-emitter";
import { TaskType } from "@/types/task";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Octicons from "@expo/vector-icons/Octicons";
import clsx from "clsx";
import { usePathname, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, PressableProps, ScrollView, Text, TextInput, useWindowDimensions, Vibration, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, Extrapolation, interpolate, runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated";

const FlatListAnimated = Animated.createAnimatedComponent(FlatList);
const PressableToScrollAnimated = Animated.createAnimatedComponent(Pressable);

interface TaskCardProps extends Omit<PressableProps, "onLongPress" | "onPress"> {
    task: TaskType;
    onRefresh: (error?: boolean) => void;
    loading: boolean;
    selectedIndex?: number;
    onLongPress?: (task: TaskType) => void;
    selection?: boolean;
    onDelete?: (task: TaskType) => void;
    onArchive?: (task: TaskType) => void;
    onPress?: (id: TaskType["idTask"]) => void;
}
const TaskCard = memo(({ task, onRefresh, loading: parentLoading = false, selectedIndex: index = 0, onLongPress, selection: selecting = false, onDelete, onArchive, onPress, ...rest }: TaskCardProps) => {
    const translateX = useSharedValue<number>(0);
    const loading = useSharedValue<boolean>(false);
    const { setToast, setDismiss } = useToast();
    const selected = useSharedValue<boolean>(false);
    const selection = useSharedValue<boolean>(false);
    const { deleteTasks, archiveTasks } = useTasks();

    const swipeAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: translateX.value,
            },
        ]
    }));

    const handleDelete = useCallback(() => {
        if (loading.value) return;
        onDelete?.(task);
        setDismiss(handleDeleteTask, () => onRefresh(true));
    }, [onDelete, task, onRefresh, setDismiss]);

    const handleDeleteTask = useCallback(async () => {
        if (loading.value) return;
        try {
            loading.value = true;
            await deleteTasks([task.idTask]);
            loading.value = false;
            onRefresh();
        }
        catch (e) {
            onRefresh(true);
            loading.value = false;
            console.log(e);
        }
    }, [task.idTask, onRefresh]);

    const handleArchive = useCallback(async (taskToArchive: TaskType) => {
        if (loading.value) return;
        onArchive?.(taskToArchive);
        try {
            loading.value = true;
            await archiveTasks([task.idTask]);
            loading.value = false;
        }
        catch (e) {
            onRefresh(true);
            loading.value = false;
            console.log(e);
        }
    }, [onArchive, task.idTask, onRefresh, setToast]);

    const handleLongPressLocal = useCallback(() => {
        onLongPress && onLongPress(task);
        Vibration.vibrate(100);
    }, [onLongPress, task]);

    const handlePressLocal = useCallback(() => {
        onPress && onPress(task.idTask);
    }, [onPress, task.idTask]);

    const gesturesList = useMemo(() => Gesture.Race(
        Gesture.LongPress()
            .minDuration(150)
            .onStart(() => {
                runOnJS(handleLongPressLocal)();
            }),
        Gesture.Pan()
            .activeOffsetX([-5, 5])
            .failOffsetY([-10, 10])
            .onUpdate(({ translationX: x }) => {
                if (x >= -100 && x <= 100 && !loading.value && !selected.value && !selection.value) translateX.value = x;
            })
            .onEnd(({ translationX: x }) => {
                if (selected.value || selection.value || loading.value) return;
                if (x <= -100) {
                    runOnJS(handleArchive)(task);
                }
                else if (x >= 100) {
                    runOnJS(handleDelete)();
                }
                translateX.value = withSpring(0, {
                    stiffness: 100,
                    mass: 2,
                    damping: 10,
                });
            })
    ), [handleLongPressLocal, handleArchive, handleDelete, task.idTask, parentLoading, index, selecting]);

    const opacityAnimation = useAnimatedStyle(() => ({
        opacity: interpolate(
            translateX.value,
            [-95, 0, 95],
            [1, 0, 1],
            Extrapolation.CLAMP,
        ),
    }));

    useEffect(() => {
        loading.value = !!parentLoading;
        if (selected.value !== (index > 0)) selected.value = index > 0;
        if (selection.value !== selecting) selection.value = selecting;
    }, [parentLoading, index, selecting]);

    const selectAnimation = useAnimatedStyle(() => ({
        opacity: withTiming(selected.value ? 1 : 0, {
            duration: 200,
            easing: Easing.inOut(Easing.linear),
        }),
        pointerEvents: selected.value ? "auto" : "none",
    }));

    const textAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: !selected.value ? "100%" : withSequence(
                    withTiming(-20, {
                        duration: 200,
                        easing: Easing.inOut(Easing.quad),
                    }),
                    withTiming(20, {
                        duration: 200,
                        easing: Easing.inOut(Easing.quad),
                    }),
                    withTiming(0, {
                        duration: 200,
                        easing: Easing.inOut(Easing.quad),
                    }),
                ),
            }
        ]
    }));

    return (
        <GestureDetector gesture={gesturesList}>
            <Pressable
                {...rest}
                onPress={handlePressLocal}
                className="w-full h-[100px] flex justify-center items-center rounded-2xl"
            >
                <Animated.View
                    style={swipeAnimation}
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
                </Animated.View>

                <View className="w-full h-full flex flex-row justify-center items-center p-2 rounded-2xl pointer-events-none">
                    <Animated.View
                        style={opacityAnimation}
                        className="w-1/2 h-full flex justify-center bg-red-500 rounded-l-2xl pl-10"
                    >
                        <FontAwesome6
                            name="trash-alt"
                            size={25}
                            color="rgba(255, 255, 255, .8)"
                        />
                    </Animated.View>

                    <Animated.View
                        style={opacityAnimation}
                        className="w-1/2 h-full dark:bg-white/50 bg-black rounded-r-2xl overflow-hidden"
                    >
                        <View className="w-full h-full flex justify-center items-end pr-10 dark:bg-transparent bg-white/30">
                            <MaterialCommunityIcons
                                name="archive-arrow-down"
                                size={30}
                                color="rgba(255, 255, 255, .8)"
                            />
                        </View>
                    </Animated.View>
                </View>

                <Animated.View
                    style={selectAnimation}
                    className="absolute w-full h-[100%] flex justify-center items-center z-[20] dark:bg-black/70 bg-white/70 border dark:border-white/20 border-black/20 rounded-2xl"
                >
                    {
                        index > 0 && (
                            <TextAnimated
                                style={textAnimation}
                                className="absolute text-4xl"
                            >
                                {index}
                            </TextAnimated>
                        )
                    }
                </Animated.View>
            </Pressable>
        </GestureDetector>
    );
});

export default function Tasks() {
    const { width, height } = useWindowDimensions();
    const { setToast, setDismiss } = useToast();
    const [value, setValue] = useState<string>("");
    const router = useRouter();
    const { theme } = useTheme();
    const [loading, setLoading] = useState<boolean>(false);
    const [tasks, setTasks] = useState<TaskType[]>([]);
    const [tasksTmp, setTasksTmp] = useState<TaskType[]>([]);
    const limit = 10;
    const [count, setCount] = useState<number>(0);
    const [countTmp, setCountTmp] = useState<number>(0);
    const [tasksSelected, setTasksSelected] = useState<TaskType[]>([]);
    const pathname = usePathname();
    const textInputRef = useRef<TextInput>(null);
    const otherElement = Gesture.Native();
    const scrollY = useSharedValue<number>(0);
    const translateY = useSharedValue<number>(0);
    const [left, setLeft] = useState<number>(0);
    const flatListRef = useRef<FlatList>(null);
    const syncLoading = useRef<boolean>(false);
    const sync = useRef<boolean>(false);
    const { t } = useTranslation();
    const scrolling = useSharedValue<boolean>(false);
    const timeout = useRef<ReturnType<typeof setTimeout>>(null);
    const sharedTextInputValue = useSharedValue<string>("");
    const showScrollButton = useSharedValue<boolean>(false);
    const showButtonTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    const tasksSelectedShared = useSharedValue<boolean>(false);
    const scrollCheckPoint = 100;
    const themeShared = useSharedValue<typeof theme>(theme);
    const showAddTaskButton = useSharedValue<boolean>(true);
    const [folders, setFolders] = useState<[]>([]);
    const hasFolders = useSharedValue<boolean>(true);
    const selectLimit = 50;
    const scrollViewRef = useRef<ScrollView>(null);
    const itemHeight = 100;
    const [headerHeight, setHeaderHeight] = useState<number>(0);
    const getTaskTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    const scrollTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    const quietProcessing = useSharedValue<boolean>(false);
    const [processing, setProcessing] = useState<boolean>(false);
    const showFilter = useSharedValue<boolean>(true);
    const { syncTasks, getTasks, searchTasks, deleteTasks, archiveTasks, getTasksCount } = useTasks();
    const [tasksSearch, setTasksSearch] = useState<TaskType[]>([]);
    const searchScrollY = useSharedValue<number>(0);
    const searchScrollCheckPoint = 100;
    const searchSectionActive = useSharedValue<boolean>(false);
    const [isSearchSectionActive, setIsSearchSectionActive] = useState<boolean>(false);

    const syncData = useCallback(async (position: number = 0) => {
        if (pathname != "/" || syncLoading.current) return;
        try {
            syncLoading.current = true;
            await syncTasks(position);
            sync.current = true;
            syncLoading.current = false;
            console.log("sync");
        }
        catch (e) {
            syncLoading.current = false;
            sync.current = false;
            console.log(e);
        }
    }, [pathname]);

    const getTasksTest = async (refresh: boolean = false) => {
        if (pathname != "/" || loading) return;
        try {
            const data = await getTasks(100, 0);

            console.log(data);
        }
        catch (e) {
            setToast("Test échoué", "error");
            console.log(e);
        }
    }

    const handleGetTasks = useCallback(async (refresh: boolean = false) => {
        getTaskTimeout.current && clearTimeout(getTaskTimeout.current);
        if (pathname != "/" || loading) return;

        getTaskTimeout.current = setTimeout(async () => {
            setTasksSelected([]);
            setCountTmp(0);
            setTasksTmp([]);
            setValue("");

            try {
                !refresh && setLoading(true);
                const data = await getTasks(limit, refresh ? 0 : tasks.length) as TaskType[];

                if (refresh) setTasks(data);
                else setTasks(prev => [...prev, ...data.filter(item => !prev.find(t => t.idTask == item.idTask))]);

                translateY.value = 0;
                if (!sync.current) syncData(data.length);
                setLoading(false);
                setProcessing(false);
            }
            catch (e) {
                setLoading(false);
                setProcessing(false);
                translateY.value = 0;
                setToast("Aucune connexion internet", "error");
                console.log(e);
            }
        }, 0);
    }, [pathname, tasks.length]);

    const handleGetCount = useCallback(async () => {
        if (pathname != "/") return;
        try {
            const data = await getTasksCount() as number;

            setCount(data);
        }
        catch (e) {
            setToast("Aucune connexion internet", "error");
            console.log(e);
        }
    }, [pathname]);

    const handleFilter = (entry: null | boolean) => {
        tasksTmp.length == 0 && setTasksTmp(tasks);
        countTmp == 0 && setCountTmp(count);
        if (entry == null) {
            tasksTmp.length > 0 && setTasks(tasksTmp);
            countTmp > 0 && setCount(countTmp);
            setTasksTmp([]);
            setCountTmp(0);
            return;
        }
        const result = (tasksTmp.length == 0 ? tasks : tasksTmp).filter((task) => task.done == entry);

        setTasks(result);
        setCount(result.length);
    }

    const handleSearch = useCallback(async (value: string, pagination: boolean = false) => {
        timeout.current && clearTimeout(timeout.current);
        setTasksSelected([]);
        if (pathname != "/" || value.trim().length == 0) {
            tasksTmp.length > 0 && setTasks(tasksTmp);
            countTmp > 0 && setCount(countTmp);
            setTasksTmp([]);
            setCountTmp(0);
            return;
        }
        timeout.current = setTimeout(async () => {
            tasksTmp.length == 0 && setTasksTmp(tasks);
            countTmp == 0 && setCountTmp(count);
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
            }
            catch (e) {
                tasksTmp.length > 0 && setTasks(tasksTmp);
                countTmp > 0 && setCount(countTmp);
                setTasksTmp([]);
                setCountTmp(0);
                console.log(e);
            }
        }, 100);
    }, [pathname, tasksTmp, countTmp, tasksSelected]);

    const taskSelectedAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: -20,
            },
            {
                translateY: withTiming(tasksSelectedShared.value ? -(height - (height * .9)) : height * .5, {
                    duration: 300,
                    easing: Easing.inOut(Easing.quad),
                }),
            },
        ]
    }));


    useEffect(() => {
        const { remove } = Keyboard.addListener("keyboardDidHide", () => {
            if (!textInputRef.current) return;
            textInputRef.current.blur();
        });

        return () => remove();
    }, []);

    const panRefresh = Gesture.Pan()
        .simultaneousWithExternalGesture(otherElement)
        .activeOffsetY(50)
        .failOffsetX([-10, 10])
        .onUpdate(({ translationY: y }) => {
            if (scrollY.value == 0 && !scrolling.value && sharedTextInputValue.value.trim().length == 0) {
                translateY.value = y;
            }
        })
        .onEnd(() => {
            if (translateY.value >= 90) {
                translateY.value = 180;
                scrollY.value == 0 && !quietProcessing.value && runOnJS(handleGetTasks)(true);
            }
            else {
                translateY.value = 0;
            }
        })

    const refreshPanAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: interpolate(
                    translateY.value,
                    [0, 90],
                    [160, 230],
                    Extrapolation.CLAMP,
                ),
            }
        ],
        opacity: quietProcessing.value && translateY.value >= 90 ? withRepeat(
            withSequence(
                withTiming(.5, {
                    duration: 1000,
                    easing: Easing.inOut(Easing.quad),
                }),
                withDelay(
                    300,
                    withTiming(1, {
                        duration: 1000,
                        easing: Easing.inOut(Easing.quad),
                    }),
                )
            ),
            Infinity,
            true,
        )
            :
            sharedTextInputValue.value.trim().length > 0 || translateY.value == 0 ? 0 : 1,
    }));

    const showRefreshAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: interpolate(
                    translateY.value,
                    [60, 100],
                    [0, 150],
                    Extrapolation.CLAMP,
                ),
            }
        ]
    }));

    const toggleShowScrollButton = () => {
        showButtonTimeout.current && clearTimeout(showButtonTimeout.current);
        showScrollButton.value = true;
        showButtonTimeout.current = setTimeout(() => {
            showScrollButton.value = false;
        }, 500);
    }

    const checkScroll = (y: number) => {
        scrollTimeout.current && clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => {
            if (y >= (scrollCheckPoint * .3) && y <= scrollCheckPoint + 50) flatListRef.current?.scrollToOffset({
                offset: scrollCheckPoint + 50,
                animated: true,
            });
            else if (y < (scrollCheckPoint * .3)) flatListRef.current?.scrollToOffset({
                offset: 0,
                animated: true,
            });
        }, 10);
    }

    const handleScroll = useAnimatedScrollHandler({
        onScroll: (e) => {
            const y = e.contentOffset.y;

            if (y >= 0 && y <= scrollY.value) {
                showAddTaskButton.value = true;
            }
            else {
                showAddTaskButton.value = false;
            }

            if (y > 0 && y < scrollY.value) {
                runOnJS(toggleShowScrollButton)();
            }
            else {
                showScrollButton.value = false;
            }
            scrollY.value = y;
        }
    });

    useEffect(() => {
        tasksSelectedShared.value = tasksSelected.length > 0;
    }, [loading, tasksSelected]);

    const scrollButtonAnimation = useAnimatedStyle(() => ({
        opacity: withTiming(showScrollButton.value ? 1 : 0, {
            duration: 300,
            easing: Easing.inOut(Easing.quad),
        }),
        pointerEvents: showScrollButton.value ? "auto" : "none",
    }));

    const addTaskButtonAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: tasksSelectedShared.value ?
                    withTiming(100, {
                        duration: 200,
                        easing: Easing.inOut(Easing.quad),
                    })
                    :
                    withSpring(-20, {
                        stiffness: 30,
                        mass: 1,
                        damping: 5,
                    }),
            },
            {
                translateY: showAddTaskButton.value ?
                    withSpring(-120, {
                        stiffness: 50,
                        mass: 1,
                        damping: 6,
                    })
                    :
                    withTiming(height * .2, {
                        duration: 200,
                        easing: Easing.inOut(Easing.linear),
                    })
            },
        ],
    }));

    useEffect(() => {
        themeShared.value = theme;
    }, [theme]);

    const handleDelete = async (init: boolean = true) => {
        if (tasksSelected.length == 0) return;
        setProcessing(true);
        const tab = [...tasksSelected];

        if (init) {
            const filter = tasks.filter(t => !tab.find(e => e.idTask == t.idTask));

            setTasks(filter);
            setDismiss(
                () => handleDelete(false),
                () => {
                    handleGetTasks(true);
                });
            return;
        }
        try {
            await deleteTasks([...tab.map(t => t.idTask)]);

            setCount(count - tab.length);
            setTasksSelected([]);
            handleGetTasks(true);
        }
        catch (e) {
            console.log(e);
            handleGetTasks(true);
            setToast("Une erreur s'est produite", "error");
        }
    }


    const selectMap = useMemo(() => new Map(
        tasksSelected.map((t, i) => [t.idTask, i + 1]),
    ), [tasksSelected]);

    const handleLongPress = useCallback((task: TaskType) => {
        setTasksSelected(prev => {
            const pos = prev.findIndex(t => t.idTask == task.idTask);

            if (pos == -1) return [...prev, task];
            else return prev.filter(t => t.idTask != task.idTask);
        });
    }, []);

    const handleDeleteTask = useCallback((task: TaskType) => {
        setProcessing(true);
        setCount(prev => prev - 1);
        setTasks((prev) => [...prev.filter(t => t.idTask != task.idTask)]);
    }, []);

    const handleRefresh = useCallback((e: boolean = false) => {
        if (e) {
            setCount(prev => prev + 1);
            handleGetTasks(true);
        }
        else {
            setProcessing(false);
        }
    }, []);

    const handleArchiveTask = useCallback((task: TaskType) => {
        setCount(prev => prev - 1);
        setTasks(prev => prev.filter(t => t.idTask !== task.idTask));
    }, []);

    const handleTaskPress = useCallback((id: TaskType["idTask"]) => {
        if (processing) return;
        if (selectMap.size == 0) {
            console.log("Pressed", id);
        }
    }, [selectMap.size, processing]);

    const renderItem = useCallback((task: TaskType) => (
        <TaskCard
            loading={loading || processing}
            task={task}
            selection={selectMap.size > 0}
            selectedIndex={selectMap.get(task.idTask) ?? 0}
            onPress={handleTaskPress}
            onRefresh={handleRefresh}
            onLongPress={handleLongPress}
            onDelete={handleDeleteTask}
            onArchive={handleArchiveTask}
        />
    ), [selectMap, loading, processing, handleRefresh, handleLongPress, handleDeleteTask, handleArchiveTask, handleTaskPress]);

    const headerContainerAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: interpolate(
                    scrollY.value,
                    [0, scrollCheckPoint],
                    [0, -120],
                    Extrapolation.CLAMP,
                )
            }
        ]
    }));

    const headerAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: interpolate(
                    scrollY.value,
                    [0, scrollCheckPoint],
                    [0, 150],
                    Extrapolation.CLAMP,
                )
            }
        ],
        opacity: interpolate(
            scrollY.value,
            [0, scrollCheckPoint],
            [1, 0],
            Extrapolation.CLAMP,
        ),
        zIndex: scrollY.value >= scrollCheckPoint * .1 ? -10 : 0,
    }));

    const fakeInputAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: interpolate(
                    scrollY.value,
                    [0, scrollCheckPoint],
                    [0, -100],
                    Extrapolation.CLAMP,
                )
            }
        ],
        opacity: interpolate(
            scrollY.value,
            [0, scrollCheckPoint],
            [1, 0],
            Extrapolation.CLAMP,
        ),
        zIndex: scrollY.value >= scrollCheckPoint * .1 ? -10 : 0,
    }));

    const stickyAnimation = useAnimatedStyle(() => ({
        width: withSpring(scrollY.value >= scrollCheckPoint * .5 ? "95%" : "100%", {
            stiffness: 500,
            mass: 1,
            damping: 10,
        }),
        backgroundColor: themeShared.value == "dark" ? "black" : "white",
    }));

    const folderAnimation = useAnimatedStyle(() => ({
        backgroundColor: scrollY.value >= scrollCheckPoint * .5 ?
            (themeShared.value == "dark" ? "rgba(255, 255, 255, .15)" : "rgba(0, 0, 0, .15)")
            :
            (themeShared.value == "dark" ? "rgba(0, 0, 0, 1)" : "rgba(0, 0, 0, .05)")
        ,
        borderWidth: 1,
        borderColor: scrollY.value >= scrollCheckPoint * .5 ?
            (themeShared.value == "dark" ? "rgba(255, 255, 255, .2)" : "rgba(0, 0, 0, .2)")
            :
            (themeShared.value == "dark" ? "rgba(0, 0, 0, 1)" : "rgba(0, 0, 0, .05)")
        ,
        borderRadius: scrollY.value >= scrollCheckPoint * .5 ? 20 : 0,
    }));

    useEffect(() => {
        quietProcessing.value = processing;
    }, [processing]);

    const filterAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: interpolate(
                    scrollY.value,
                    [0, scrollCheckPoint],
                    [0, width],
                    Extrapolation.CLAMP,
                )
            }
        ],
        opacity: (scrollY.value == 0 && showFilter.value) ? 1 : .3,
        pointerEvents: (scrollY.value == 0 && showFilter.value) ? "auto" : "none",
    }));

    const handleArchive = async () => {
        setProcessing(true);
        const tab = [...tasksSelected];
        try {
            await archiveTasks([...tab.map(t => t.idTask)]);

            setCount(count - tab.length);
            setTasksSelected([]);
            handleGetTasks(true);
            setToast(t("tasks_archived"), "success");
        }
        catch (e) {
            console.log(e);
            handleGetTasks(true);
            setToast("Une erreur s'est produite", "error");
        }
    }

    const onSearchScroll = useAnimatedScrollHandler({
        onScroll: (e) => {
            const y = e.contentOffset.y;

            searchScrollY.value = y;
        }
    })

    const textInputAnimation = useAnimatedStyle(() => ({
        width: interpolate(
            searchScrollY.value,
            [0, searchScrollCheckPoint],
            [width, width * .8],
            Extrapolation.CLAMP,
        ),
        transform: [
            {
                translateY: interpolate(
                    searchScrollY.value,
                    [0, searchScrollCheckPoint],
                    [70, 0],
                    Extrapolation.CLAMP,
                )
            }
        ],
        borderWidth: 1,
        borderColor: themeShared.value == "dark" ?
            "rgba(255,255, 255, .1)"
            :
            (searchScrollY.value >= searchScrollCheckPoint ? "rgba(0, 0, 0, .1)" : "rgba(0, 0, 0, 0)"),
        borderRadius: 30,
    }));

    const searchHeaderAnimation = useAnimatedStyle(() => ({
        backgroundColor: themeShared.value == "dark"
            ?
            "rgba(0, 0, 0, .5)"
            :
            (searchScrollY.value >= searchScrollCheckPoint ? "rgba(255, 255, 255, .6)" : "rgba(255, 255, 255, 0)")
    }));

    const searchSectionAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: searchSectionActive.value ? withTiming(0, {
                    duration: 200,
                    easing: Easing.inOut(Easing.quad),
                }) : 50,
            }
        ],
        opacity: searchSectionActive.value ? withTiming(1, {
            duration: 200,
            easing: Easing.inOut(Easing.linear),
        }) : 0,
        zIndex: searchSectionActive.value ? 100 : -100,
    }));

    useEffect(() => {
        const { remove } = BackHandler.addEventListener("hardwareBackPress", () => {
            if (isSearchSectionActive) {
                setIsSearchSectionActive(false);
                event.emit(SHOW_NAVBAR);
                return true;
            }
            else if ((tasksTmp.length > 0 && countTmp > 0) || tasksSelected.length > 0) {
                tasksTmp.length > 0 && setTasks(tasksTmp);
                countTmp > 0 && setCount(countTmp);
                setTasksSelected([]);
                setTasksTmp([]);
                setCountTmp(0);
                setValue("");
                return true;
            }

            return false;
        });

        sharedTextInputValue.value = value;
        showFilter.value = value.trim().length == 0;
        searchSectionActive.value = isSearchSectionActive;
        if (isSearchSectionActive) textInputRef.current?.focus();
        else {
            textInputRef.current?.blur();
            setValue("");
            setTasksSearch([]);
        }

        return () => remove();
    }, [tasksSelected, value, tasksTmp, isSearchSectionActive]);

    useEffect(() => {
        // handleGetTasks();
        // handleGetCount();
    }, []);

    return (
        <Container centerX>
            <Animated.View
                onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
                style={headerContainerAnimation}
                className="absolute w-full z-[50]"
            >
                <Animated.View
                    style={headerAnimation}
                    className="w-full flex items-center"
                >
                    <PageTitle>
                        <View className="w-full flex flex-row items-center gap-2 overflow-hidden">
                            <FontAwesome6
                                name="list-check"
                                size={20}
                                color={COLORS.emerald[500]}
                            />
                            <Text
                                numberOfLines={1}
                                className="text-2xl text-emerald-500 font-bold"
                            >
                                {t("tasks_page_title")}
                            </Text>
                        </View>
                    </PageTitle>
                </Animated.View>

                <Animated.View
                    style={fakeInputAnimation}
                    className="w-full flex items-center px-3"
                >
                    <Pressable
                        onPress={() => {
                            if (tasks.length == 0) return;
                            setIsSearchSectionActive(true);
                            event.emit(HIDE_NAVBAR);
                        }}
                        className={clsx(
                            "w-full h-16 flex flex-row items-center my-3 px-2 dark:text-white/90 text-black dark:bg-white/10 bg-white/85 rounded-2xl border-b dark:border-white/20 border-black/20 pl-4 pr-12",
                            !loading && tasks.length == 0 && tasksTmp.length == 0 && value.trim().length == 0 && "opacity-50",
                        )}
                    >
                        <TextAnimated className="opacity-40 text-lg">
                            {t("tasks_search")}
                        </TextAnimated>
                        <PressableAnimated
                            // onPress={() => {
                            //     handleSearch(value);
                            //     textInputRef.current?.blur();
                            // }}
                            onPress={() => {
                                // if (tasks.length > 0) {
                                //     setTasks([]);
                                //     setTasksTmp([]);
                                //     setCount(0);
                                //     setCountTmp(0);
                                // }
                                // else getTasks();
                                getTasksTest();
                                console.log(loading);
                                console.log(processing);
                            }}
                            className="absolute top-4 right-5 z-[1]"
                        >
                            <FontAwesome5
                                name="search"
                                size={24}
                                color={theme == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .6)"}
                            />
                        </PressableAnimated>
                    </Pressable>
                </Animated.View>

                <View className="w-full flex items-center gap-1">
                    {
                        // folders.length > 0 && (
                        (
                            <Animated.View
                                style={stickyAnimation}
                                className="flex items-center"
                            >
                                <Animated.View
                                    style={folderAnimation}
                                    className="w-full flex flex-row items-center gap-5 px-3 py-1"
                                >
                                    {
                                        loading && !processing && (
                                            <View className="w-[70%] sm:w-[300px] h-[30px] flex flex-row items-center rounded-3xl overflow-hidden">
                                                <Skeleton />
                                            </View>
                                        )
                                    }
                                    {
                                        !loading && (
                                            <ScrollView
                                                horizontal
                                                showsHorizontalScrollIndicator={false}
                                                nestedScrollEnabled
                                                className="w-full"
                                                contentContainerClassName="flex flex-row items-center gap-[10px]"
                                            >
                                                {
                                                    Array(5).fill(0).map((_, i) => (
                                                        <PressableAnimated
                                                            key={i}
                                                            scale={.95}
                                                            onPress={() => scrollViewRef.current?.scrollTo({
                                                                x: i * width,
                                                                animated: true,
                                                            })}
                                                            className="w-[100px] flex flex-row justify-center items-center dark:bg-white/20 bg-white/80 px-3 rounded-xl border dark:border-white/20 border-black/20"
                                                        >
                                                            <TextAnimated className="text-lg">
                                                                {t("folder")}
                                                            </TextAnimated>
                                                        </PressableAnimated>
                                                    ))
                                                }
                                            </ScrollView>
                                        )
                                    }
                                </Animated.View>
                            </Animated.View>
                        )
                    }

                    <Animated.View
                        style={filterAnimation}
                        className="w-full flex flex-row items-center gap-3 px-3 py-1"
                    >
                        <View className="w-[20%] flex flex-row items-center gap-2 shrink-0">
                            <TextAnimated className="text-lg">
                                {t("tasks_filter")}
                            </TextAnimated>
                            <FontAwesome5
                                name="filter"
                                size={15}
                                color={theme === "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .5)"}
                            />
                        </View>
                        {
                            loading && !processing && tasks.length == 0 && (
                                <View className="w-[50%] sm:w-[200px] h-[30px] flex flex-row items-center rounded-3xl overflow-hidden">
                                    <Skeleton />
                                </View>
                            )
                        }

                        {
                            !loading && (
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    nestedScrollEnabled
                                    className="w-full"
                                    contentContainerClassName="flex flex-row items-center gap-[10px]"
                                >
                                    <PressableAnimated
                                        scale={.95}
                                        onPress={() => handleFilter(null)}
                                        className="w-[100px] flex flex-row justify-center items-center dark:bg-white/20 bg-white/80 px-3 rounded-xl border dark:border-white/20 border-black/20"
                                    >
                                        <TextAnimated className="text-lg">
                                            {t("tasks_filter_all")}
                                        </TextAnimated>
                                    </PressableAnimated>

                                    <PressableAnimated
                                        scale={.95}
                                        onPress={() => handleFilter(true)}
                                        className="w-[100px] flex flex-row justify-center items-center dark:bg-white/20 bg-white/80 px-3 rounded-xl border dark:border-white/20 border-black/20"
                                    >
                                        <TextAnimated className="text-lg">
                                            {t("tasks_filter_done")}
                                        </TextAnimated>
                                    </PressableAnimated>

                                    <PressableAnimated
                                        scale={.95}
                                        onPress={() => handleFilter(false)}
                                        className="w-[100px] flex flex-row justify-center items-center dark:bg-white/20 bg-white/80 px-3 rounded-xl border dark:border-white/20 border-black/20"
                                    >
                                        <TextAnimated className="text-lg">
                                            {t("tasks_filter_not_done")}
                                        </TextAnimated>
                                    </PressableAnimated>
                                </ScrollView>
                            )
                        }
                    </Animated.View>
                </View>

                <Animated.View
                    onLayout={(e) => setLeft((width / 2) - (e.nativeEvent.layout.width / 2))}
                    style={[
                        refreshPanAnimation,
                        {
                            left,
                        }
                    ]}
                    className="absolute z-[100] rounded-full overflow-hidden pointer-events-none dark:bg-white bg-black"
                >
                    <View className="size-full flex justify-center items-center rounded-full dark:bg-black/80 bg-white p-4">
                        <Octicons
                            name="tasklist"
                            size={25}
                            color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                        />
                    </View>

                    <Animated.View
                        style={showRefreshAnimation}
                        className="absolute size-full flex justify-center items-center z-[1] rounded-full overflow-hidden dark:bg-white bg-black"
                    >
                        <View className="size-full dark:bg-black/90 bg-white/80" />
                    </Animated.View>
                </Animated.View>
            </Animated.View>

            <ScrollView
                ref={scrollViewRef}
                horizontal
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                pagingEnabled
                className="w-full mt-3"
                contentContainerClassName="flex flex-row"
            >
                <GestureDetector gesture={panRefresh}>
                    <View className="w-full flex flex-row">
                        <View className="w-screen flex items-center shrink-0">
                            <GestureDetector gesture={otherElement}>
                                <FlatListAnimated
                                    ref={flatListRef}
                                    nestedScrollEnabled
                                    horizontal={false}
                                    initialNumToRender={10}
                                    maxToRenderPerBatch={5}
                                    windowSize={5}
                                    removeClippedSubviews
                                    showsVerticalScrollIndicator={false}
                                    data={tasks}
                                    keyExtractor={(item) => String((item as TaskType).idTask)}
                                    renderItem={({ item }) => renderItem(item as TaskType)}
                                    onScroll={handleScroll}
                                    onMomentumScrollBegin={() => scrolling.value = true}
                                    onMomentumScrollEnd={(e) => {
                                        const y = e.nativeEvent.contentOffset.y;

                                        scrolling.value = false;
                                        checkScroll(y);
                                    }}
                                    onEndReachedThreshold={.1}
                                    scrollEventThrottle={16}
                                    onEndReached={() => {
                                        if (loading) return;
                                        if (tasksSelected.length == 0 && !processing) {
                                            if (value.trim().length == 0) {
                                                tasks.length < count ? handleGetTasks() : undefined
                                            }
                                            else {
                                                tasks.length < count ? handleSearch(value, true) : undefined
                                            }
                                        }
                                    }}
                                    getItemLayout={(_, index) => ({
                                        length: itemHeight,
                                        offset: index * itemHeight,
                                        index,
                                    })}
                                    ListEmptyComponent={() => {
                                        if (!loading) {
                                            return (
                                                <View className="w-screen flex justify-center items-center gap-4 pt-10">
                                                    <MaterialIcons
                                                        name="playlist-remove"
                                                        size={120}
                                                        color={theme == "dark" ? "rgba(255, 255, 255, .2)" : "rgba(0, 0, 0, .2)"}
                                                    />
                                                    <Text className="dark:text-white/50 text-black/50 font-bold text-lg tracking-wider">
                                                        {value.trim().length > 0 ? t("tasks_search_tasks_empty") : t("tasks_no_tasks")}
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
                                        paddingTop: headerHeight + 10,
                                    }}
                                    contentContainerClassName="w-full flex flex-col items-center gap-5 pb-[110px] px-3"
                                />
                            </GestureDetector>
                        </View>
                    </View>
                </GestureDetector>
            </ScrollView>

            <PressableToScrollAnimated
                onPress={() => flatListRef.current?.scrollToIndex({
                    index: 0,
                    animated: true,
                })}
                style={[
                    {
                        bottom: 0,
                        transform: [
                            {
                                translateY: tasksSelected.length > 0 ? -height * .17 : -height * .1,
                            }
                        ]
                    },
                    scrollButtonAnimation,
                ]}
                className="absolute dark:bg-black bg-white rounded-full overflow-hidden"
            >
                <View className="size-full dark:bg-white/20 bg-black/50 p-2">
                    <Ionicons
                        name="chevron-up-sharp"
                        size={30}
                        color={theme == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(255, 255, 255, .8)"}
                    />
                </View>
            </PressableToScrollAnimated>

            <Animated.View
                style={[
                    {
                        maxWidth: width * .9,
                        zIndex: tasksSelected.length > 0 ? 10 : -10,
                    },
                    taskSelectedAnimation,
                ]}
                className="absolute right-0 bottom-0 dark:bg-white bg-black rounded-2xl overflow-hidden"
            >
                <View className="w-full h-full flex flex-row items-center gap-5 dark:bg-black/80 bg-white rounded-2xl px-3 py-1 border-none border border-black/20">
                    <View className="flex flex-row items-center gap-3">
                        <TextAnimated className="text-lg font-bold">
                            {t("tasks_selected")}
                        </TextAnimated>
                        <TextAnimated className="text-lg font-bold">
                            ({tasksSelected.length})
                        </TextAnimated>
                    </View>

                    <Checkbox
                        checked={tasksSelected.length == selectLimit || tasksSelected.length == tasks.length}
                        onPress={() => {
                            if (tasksSelected.length == tasks.length) {
                                setTasksSelected([]);
                            }
                            else {
                                const selected = [...tasksSelected];

                                for (let i = 0; i < selectLimit && i < tasks.length; i++) {
                                    const item = tasks[i];

                                    if (!selected.find(t => t.idTask === item.idTask)) {
                                        selected.push(item);
                                    }
                                }

                                setTasksSelected(selected);
                            }
                        }}
                    />

                    <PressableAnimated onPress={() => handleArchive()}>
                        <MaterialCommunityIcons
                            name="archive-arrow-down"
                            size={30}
                            color={theme == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .5)"}
                        />
                    </PressableAnimated>

                    <PressableAnimated onPress={() => handleDelete()}>
                        <FontAwesome6
                            name="trash-alt"
                            size={25}
                            color="red"
                        />
                    </PressableAnimated>
                </View>
            </Animated.View>

            <Animated.View
                style={addTaskButtonAnimation}
                className="absolute right-0 bottom-0 size-[50px] dark:bg-white bg-black rounded-full"
            >
                <Pressable
                    onPress={() => {
                        if (tasks.length > 0) {
                            setTasks([]);
                            setTasksTmp([]);
                            setCount(0);
                            setCountTmp(0);
                        }
                        else getTasks();
                    }}
                    className="size-full flex justify-center items-center rounded-full dark:border-none border border-black/10 dark:bg-black/85 bg-white"
                >
                    <FontAwesome5
                        name="plus"
                        size={20}
                        color={COLORS.emerald[500]}
                    />
                </Pressable>
            </Animated.View>

            {/*Search section*/}

            <Animated.View
                style={searchSectionAnimation}
                className="absolute left-0 top-0 w-screen h-screen dark:bg-black bg-white"
            >
                <View className="w-full h-full flex items-center dark:bg-black bg-[rgba(0,0,0,.05)]">
                    <Animated.View
                        style={searchHeaderAnimation}
                        className="absolute left-0 top-0 w-full flex flex-row justify-between px-3 py-2 z-[10]"
                    >
                        <PressableAnimated
                            onPress={() => {
                                setIsSearchSectionActive(false);
                                event.emit(SHOW_NAVBAR);
                            }}
                            className="border dark:border-white/15 border-black/20 dark:bg-black bg-white rounded-full"
                        >
                            <View className="flex flex-row gap-3 px-3 py-2 dark:bg-white/10 bg-white rounded-full">
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
                                        // handleSearch(e);
                                    }}
                                    // onSubmitEditing={() => handleSearch(value)}
                                    className="w-full h-16 text-xl dark:text-white/90 text-black dark:bg-white/10 bg-white rounded-2xl pl-6 pr-12 border-b dark:border-white/20 border-black/20"
                                />
                                <PressableAnimated
                                    onPress={() => {
                                        tasks.length > 0 ? setTasks([]) : handleGetTasks();
                                    }}
                                    className="absolute top-4 right-5 z-[1]"
                                >
                                    <FontAwesome5
                                        name="search"
                                        size={24}
                                        color={theme == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .6)"}
                                    />
                                </PressableAnimated>

                                {
                                    tasksTmp.length > 0 && (
                                        <Text className="absolute left-3 -top-6 text-lg text-emerald-500 font-extrabold tracking-widest">
                                            {count}
                                        </Text>
                                    )
                                }
                            </KeyboardAvoidingView>
                        </Animated.View>
                    </Animated.View>

                    <FlatListAnimated
                        horizontal={false}
                        windowSize={5}
                        removeClippedSubviews
                        initialNumToRender={10}
                        maxToRenderPerBatch={10}
                        getItemLayout={(_, index) => ({
                            length: 100,
                            offset: index * 100,
                            index,
                        })}
                        data={tasksSearch}
                        keyExtractor={(task) => (task as TaskType).idTask}
                        renderItem={({ item }) => renderItem(item as TaskType)}
                        onScroll={onSearchScroll}
                        scrollEventThrottle={16}
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
                        contentContainerClassName="w-full flex items-center gap-5 pt-[150px] pb-[120px] px-3"
                    />
                </View>
            </Animated.View>
        </Container>
    );
}