import { Checkbox } from "@/components/checkbox";
import { Container } from "@/components/container";
import { PageTitle } from "@/components/page-title";
import { PressableAnimated, PressableAnimatedProps } from "@/components/pressable-animated";
import { Skeleton } from "@/components/skeleton";
import { Search } from "@/components/task/search";
import { TextAnimated } from "@/components/text-animated";
import { COLORS } from "@/constants/colors";
import { useFolders } from "@/hooks/database/use-folders";
import { useTasks } from "@/hooks/database/use-tasks";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { event, HIDE_NAVBAR, SHOW_NAVBAR } from "@/lib/event-emitter";
import { FolderType } from "@/types/folder";
import { TaskType } from "@/types/task";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Octicons from "@expo/vector-icons/Octicons";
import clsx from "clsx";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import { Component, JSX, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, BackHandler, FlatList, FlatListProps, NativeScrollEvent, NativeSyntheticEvent, Pressable, PressableProps, ScrollView, Text, useWindowDimensions, Vibration, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { AnimatedProps, Easing, Extrapolation, interpolate, runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated";

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
    height?: number;
}
const TaskCard = memo(({ task, onRefresh, loading: parentLoading = false, selectedIndex: index = 0, onLongPress, selection: selecting = false, onDelete, onArchive, onPress, height, ...rest }: TaskCardProps) => {
    const translateX = useSharedValue<number>(0);
    const { setToast, setDismiss } = useToast();
    const selected = useSharedValue<boolean>(false);
    const selection = useSharedValue<boolean>(false);
    const { deleteTasks, toggleArchiveTasks } = useTasks();
    const { t } = useTranslation();
    const [loading, setLoading] = useState<boolean>(false);
    const loadingShared = useSharedValue<boolean>(false);

    const swipeAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: translateX.value,
            },
        ]
    }));

    const handleDelete = useCallback(() => {
        if (loading) return;
        onDelete?.(task);
        setDismiss(handleDeleteTask, () => onRefresh(true));
    }, [onDelete, task, onRefresh, loading]);

    const handleDeleteTask = useCallback(async () => {
        if (loading) return;
        try {
            setLoading(true);
            await deleteTasks([task.idTask]);
            setLoading(false);
            onRefresh();
        }
        catch (e) {
            onRefresh(true);
            setLoading(false);
            console.log(e);
        }
    }, [task, onRefresh, loading]);

    const handleArchive = useCallback(async () => {
        if (loading) return;
        onArchive?.(task);
        try {
            setLoading(true);
            await toggleArchiveTasks([task.idTask], true);
            setLoading(false);
            setToast(t("tasks_archived_item"), "default");
            onRefresh();
        }
        catch (e) {
            onRefresh(true);
            setLoading(false);
            console.log(e);
        }
    }, [onArchive, task, loading]);

    const handleLongPressLocal = useCallback(() => {
        if (!loading) {
            onLongPress && onLongPress(task);
            Vibration.vibrate(100);
        }
    }, [onLongPress, task]);

    const handlePress = useCallback(() => {
        onPress && onPress(task.idTask);
    }, [onPress, task]);

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
                if (x >= -100 && x <= 100 && !loadingShared.value && !selected.value && !selection.value) translateX.value = x;
            })
            .onEnd(({ translationX: x }) => {
                translateX.value = withSpring(0, {
                    stiffness: 100,
                    mass: 2,
                    damping: 10,
                });

                if (selected.value || selection.value || loadingShared.value || (x >= -99 && x <= 99)) return;

                if (x <= -100) {
                    runOnJS(handleArchive)();
                }
                else if (x >= 100) {
                    runOnJS(handleDelete)();
                }
            })
    ), [handleLongPressLocal, handleArchive, handleDelete]);

    const opacityAnimation = useAnimatedStyle(() => ({
        opacity: interpolate(
            translateX.value,
            [-95, 0, 95],
            [1, 0, 1],
            Extrapolation.CLAMP,
        ),
    }));

    useEffect(() => {
        loadingShared.value = !!parentLoading || loading;
        if (selected.value !== (index > 0)) selected.value = index > 0;
        if (selection.value !== selecting) selection.value = selecting;
    }, [parentLoading, index, selecting, loading]);

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
                onPress={handlePress}
                style={{
                    height,
                }}
                className="w-full flex justify-center items-center rounded-2xl"
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
                            <MaterialIcons
                                name="archive"
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

interface FolderButtonProps extends PressableAnimatedProps {
    children: Array<string> | string;
    active?: boolean;
}

const FolderButton = memo(({ children, active = false, ...rest }: FolderButtonProps) => {
    const { theme } = useTheme();

    return (
        <PressableAnimated
            {...rest}
            style={{
                backgroundColor: active ?
                    (theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)")
                    :
                    (theme == "dark" ? "rgba(255, 255, 255, .2)" : "rgba(255, 255, 255, .8)")
            }}
            className="min-w-[100px] flex flex-row justify-center items-center dark:bg-white/20 bg-white/80 px-3 rounded-xl border dark:border-white/20 border-black/20"
        >
            <TextAnimated
                dark={active ? "rgba(0, 0, 0, .8)" : "rgba(255, 255, 255, .8)"}
                light={active ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                className={clsx(
                    "text-lg",
                    active && "font-bold",
                )}
            >
                {children}
            </TextAnimated>
        </PressableAnimated>
    );
});

interface FolderFlatListProps {
    withGesture: ReturnType<typeof Gesture.Native>;
    data: TaskType[];
    renderItem: (item: TaskType) => JSX.Element;
    onScroll: ReturnType<typeof useAnimatedScrollHandler>;
    onMomentumScrollBegin?: () => void;
    onMomentumScrollEnd: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
    onEndReached: () => void;
    getItemLayout: (data?: TaskType[] | null, index?: number) => {
        length: number;
        offset: number;
        index: number;
    };
    ListEmptyComponent: () => JSX.Element | null | undefined;
    ListFooterComponent: () => JSX.Element | null | undefined;
    handleRef: (ref: Component<AnimatedProps<FlatListProps<unknown>>, any, any> | null) => void;
    loading: boolean;
    onContentSizeChange: (contentWidth: number, contentHeight: number) => void;
    gap?: number;
}

const TaskFlatList = memo(({
    withGesture,
    data,
    renderItem,
    onScroll,
    onMomentumScrollBegin,
    onMomentumScrollEnd,
    onEndReached,
    getItemLayout,
    ListEmptyComponent,
    ListFooterComponent,
    handleRef,
    loading,
    onContentSizeChange,
    gap,
}: FolderFlatListProps) => {
    const handleMomentumScrollBegin = useCallback(() => onMomentumScrollBegin?.(), [onMomentumScrollBegin]);

    const handleMomentumScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => onMomentumScrollEnd(e), [onMomentumScrollEnd]);

    const handleItemLayout = useCallback((data: null, index: number) => getItemLayout(data, index), [getItemLayout]);

    const handleListEmptyComponent = useCallback(() => ListEmptyComponent(), [loading]);

    const handleListFooterComponent = useCallback(() => ListFooterComponent(), [loading]);

    const handleContentSize = useCallback((x: number, y: number) => onContentSizeChange(x, y), [onContentSizeChange]);

    return (
        <View className="w-screen flex items-center shrink-0">
            <GestureDetector gesture={withGesture}>
                <FlatListAnimated
                    ref={handleRef}
                    nestedScrollEnabled
                    horizontal={false}
                    initialNumToRender={10}
                    maxToRenderPerBatch={20}
                    windowSize={10}
                    removeClippedSubviews
                    showsVerticalScrollIndicator={false}
                    data={data}
                    keyExtractor={(item) => String((item as TaskType).idTask)}
                    renderItem={({ item }) => renderItem(item as TaskType)}
                    onEndReachedThreshold={.1}
                    scrollEventThrottle={16}
                    onScroll={onScroll}
                    onMomentumScrollBegin={handleMomentumScrollBegin}
                    onMomentumScrollEnd={handleMomentumScrollEnd}
                    onContentSizeChange={handleContentSize}
                    onEndReached={onEndReached}
                    getItemLayout={(data, index) => handleItemLayout(data as any, index)}
                    ListEmptyComponent={handleListEmptyComponent}
                    ListFooterComponent={handleListFooterComponent}
                    className="w-full"
                    contentContainerStyle={{
                        gap,
                    }}
                    contentContainerClassName="w-full flex flex-col items-center pt-[220px] pb-[100px] px-3"
                />
            </GestureDetector>
        </View>
    );
});

export default function Tasks() {
    const { width, height } = useWindowDimensions();
    const { setToast, setDismiss } = useToast();
    const [value, setValue] = useState<string>("");
    const router = useRouter();
    const { theme } = useTheme();
    const [tasks, setTasks] = useState<TaskType[]>([]);
    const tasksTmp = useRef<TaskType[]>([]);
    const limit = 10;
    const [count, setCount] = useState<number>(0);
    const [countTmp, setCountTmp] = useState<number>(0);
    const [tasksSelected, setTasksSelected] = useState<TaskType[]>([]);
    const pathname = usePathname();
    const otherElement = Gesture.Native();
    const scrollYShared = useSharedValue<number>(0);
    const translateY = useSharedValue<number>(0);
    const [left, setLeft] = useState<number>(0);
    const syncLoading = useRef<boolean>(false);
    const synced = useRef<boolean>(false);
    const { t } = useTranslation();
    const showScrollButton = useSharedValue<boolean>(false);
    const showButtonTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    const tasksSelectedShared = useSharedValue<boolean>(false);
    const scrollCheckPoint = 100;
    const themeShared = useSharedValue<typeof theme>(theme);
    const showAddTaskButton = useSharedValue<boolean>(true);
    const [folders, setFolders] = useState<FolderType[]>([]);
    const selectLimit = 50;
    const tasksFlatListRef = useRef<FlatList>(null);
    const taskHeight = 100;
    const tasksGap = 20;
    const getTaskTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    const scrollTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    const quietProcessing = useSharedValue<boolean>(false);
    const [processing, setProcessing] = useState<boolean>(false);
    const showFilter = useSharedValue<boolean>(true);
    const { syncTasks, getTasks, searchTasks, deleteTasks, toggleArchiveTasks, getTasksCount } = useTasks();
    const [tasksSearch, setTasksSearch] = useState<TaskType[]>([]);
    const [searchSectionActive, setSearchSectionActive] = useState<boolean>(false);
    const [countSearch, setCountSearch] = useState<number>(0);
    const [searchLoading, setSearchLoading] = useState<boolean>(false);
    const [currentFilter, setCurrentFilter] = useState<number>(1);
    const [currentFolder, setCurrentFolder] = useState<FolderType["idFolder"] | null>(null);
    const foldersFlatListRef = useRef<FlatList>(null);
    const filterScrollViewRef = useRef<ScrollView>(null);
    const { getFolders } = useFolders();
    const flatListsRef = useRef<{
        id: string;
        value: FlatList;
    }[]>([]);
    const [filterLoading, setFilterLoading] = useState<boolean>(false);
    const loadingRef = useRef<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const contentsSize = useRef<number[]>([]);
    const [scrollY, setScrollY] = useState<number>(0);

    const syncData = useCallback(async (position: number = 0) => {
        if (pathname != "/" || syncLoading.current) return;
        try {
            syncLoading.current = true;
            await syncTasks(position);
            synced.current = true;
            syncLoading.current = false;
            console.log("synced");
        }
        catch (e) {
            syncLoading.current = false;
            synced.current = false;
            console.log(e);
        }
    }, [pathname]);

    const handleGetTasks = useCallback(async (refresh: boolean = false) => {
        getTaskTimeout.current && clearTimeout(getTaskTimeout.current);
        if (pathname != "/" || loadingRef.current || processing) {
            return;
        }

        getTaskTimeout.current = setTimeout(async () => {
            setTasksSelected([]);
            setCountTmp(0);
            tasksTmp.current = [];
            setValue("");

            try {
                if (refresh) {
                    quietProcessing.value = true;
                    setProcessing(true);
                }
                else {
                    loadingRef.current = true;
                    setLoading(true);
                }
                const data = await getTasks(limit, refresh ? 0 : tasks.length) as TaskType[];

                if (refresh) setTasks(data);
                else setTasks(prev => [...prev, ...data.filter(item => !prev.find(t => t.idTask == item.idTask))]);

                if (!synced.current) syncData(data.length);
                translateY.value = withTiming(0, {
                    duration: 200,
                    easing: Easing.inOut(Easing.quad),
                });
                quietProcessing.value = false;
                loadingRef.current = false;
                setLoading(false);
                setProcessing(false);
            }
            catch (e) {
                translateY.value = withTiming(0, {
                    duration: 200,
                    easing: Easing.inOut(Easing.quad),
                });
                setLoading(false);
                setProcessing(false);
                setToast("Aucune connexion internet", "error");
                console.log(e);
            }
        }, 0);
    }, [pathname, tasks, loading, processing]);

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

    const handleFilter = useCallback((entry: null | boolean) => {
        if (filterLoading) return;
        setFilterLoading(true);
        if (tasksTmp.current.length == 0) tasksTmp.current = tasks;
        countTmp == 0 && setCountTmp(count);
        if (entry == null) {
            tasksTmp.current.length > 0 && setTasks(tasksTmp.current);
            countTmp > 0 && setCount(countTmp);
            tasksTmp.current = [];
            setCountTmp(0);
            setFilterLoading(false);
            return;
        }
        const result = (tasksTmp.current.length == 0 ? tasks : tasksTmp.current).filter((task) => task.done == entry);

        setTasks(result);
        setCount(result.length);
        setFilterLoading(false);
    }, [countTmp, tasks]);

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

    const panRefresh = useMemo(() => Gesture.Pan()
        .simultaneousWithExternalGesture(otherElement)
        .activeOffsetY(50)
        .failOffsetX([-10, 10])
        .onUpdate(({ translationY: y }) => {
            if (scrollYShared.value == 0 && !quietProcessing.value) {
                translateY.value = y;
            }
        })
        .onEnd(() => {
            if (scrollYShared.value > 0 || quietProcessing.value || translateY.value < 90) {
                translateY.value = 0;
            }
            else if (translateY.value >= 90) {
                translateY.value = 180;
                runOnJS(handleGetTasks)(true);
            }
        }), []);

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
            translateY.value == 0 ? 0 : 1,
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

    const setScrollYValue = (value: number) => setScrollY(value);

    const handleScroll = useAnimatedScrollHandler({
        onScroll: (e) => {
            const y = e.contentOffset.y;

            if (y >= 0 && y <= scrollYShared.value) {
                showAddTaskButton.value = true;
            }
            else {
                showAddTaskButton.value = false;
            }

            if (y > 0 && y < scrollYShared.value) {
                runOnJS(toggleShowScrollButton)();
            }
            else {
                showScrollButton.value = false;
            }
            scrollYShared.value = y;
            runOnJS(setScrollYValue)(y);
        }
    });

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

    const selectMap = useMemo(() => new Map(
        tasksSelected.map((t, i) => [t.idTask, i + 1]),
    ), [tasksSelected]);

    const handleRefresh = useCallback((e: boolean = false) => {
        if (e) {
            setCount(prev => prev + 1);
            tasksTmp.current.length > 0 && setTasks([...tasksTmp.current]);
        }
        tasksTmp.current = [];
        setProcessing(false);
    }, []);

    const handleArchiveTask = useCallback((task: TaskType) => {
        if (processing || tasksTmp.current.length > 0) return;
        setProcessing(true);
        tasksTmp.current = [...tasks];
        setCount(prev => prev - 1);
        if ((tasks.length * 100) <= (height + 100) && tasks.length < count) handleGetTasks();
        setTasks(prev => [...prev.filter(t => t.idTask !== task.idTask)]);
    }, [processing, tasks, height, count]);

    const handleDeleteTask = useCallback((task: TaskType) => {
        if (processing || tasksTmp.current.length > 0) return;
        setProcessing(true);
        tasksTmp.current = [...tasks];
        setCount(prev => prev - 1);
        if ((tasks.length * 100) <= (height + 100) && tasks.length < count) handleGetTasks();
        setTasks(prev => [...prev.filter(t => t.idTask !== task.idTask)]);
    }, [processing, tasks, height, count]);

    const handleLongPress = useCallback((task: TaskType) => {
        setTasksSelected(prev => {
            const pos = prev.findIndex(t => t.idTask == task.idTask);

            if (pos == -1) return [...prev, task];
            else return prev.filter(t => t.idTask != task.idTask);
        });
    }, []);

    const handleTaskPress = useCallback((id: TaskType["idTask"]) => {
        if (processing || selectMap.size > 0) return;
        console.log("Pressed", id);
    }, [selectMap, processing]);

    const isBlocked = useMemo(() => {
        return (loading || processing || searchSectionActive);
    }, [processing, searchSectionActive]);

    const renderItem = useCallback((task: TaskType) => (
        <TaskCard
            height={taskHeight}
            loading={isBlocked}
            task={task}
            selection={selectMap.size > 0}
            selectedIndex={selectMap.get(task.idTask) ?? 0}
            onPress={handleTaskPress}
            onRefresh={handleRefresh}
            onLongPress={handleLongPress}
            onDelete={handleDeleteTask}
            onArchive={handleArchiveTask}
        />
    ), [selectMap, handleRefresh, handleLongPress, handleDeleteTask, handleArchiveTask, handleTaskPress, isBlocked]);

    const headerContainerAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: interpolate(
                    scrollYShared.value,
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
                    scrollYShared.value,
                    [0, scrollCheckPoint],
                    [0, 150],
                    Extrapolation.CLAMP,
                )
            }
        ],
        opacity: interpolate(
            scrollYShared.value,
            [0, scrollCheckPoint],
            [1, 0],
            Extrapolation.CLAMP,
        ),
    }));

    const fakeInputAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: interpolate(
                    scrollYShared.value,
                    [0, scrollCheckPoint],
                    [0, -100],
                    Extrapolation.CLAMP,
                )
            }
        ],
        opacity: interpolate(
            scrollYShared.value,
            [0, scrollCheckPoint],
            [1, 0],
            Extrapolation.CLAMP,
        ),
    }));

    const stickyAnimation = useAnimatedStyle(() => ({
        width: withSpring(scrollYShared.value >= scrollCheckPoint * .5 ? "95%" : "100%", {
            stiffness: 500,
            mass: 1,
            damping: 10,
        }),
        backgroundColor: themeShared.value == "dark" ? "black" : "white",
        borderRadius: scrollYShared.value >= scrollCheckPoint * .5 ? 20 : 0,
    }));

    const folderAnimation = useAnimatedStyle(() => ({
        backgroundColor: scrollYShared.value >= scrollCheckPoint * .5 ?
            (themeShared.value == "dark" ? "rgba(255, 255, 255, .15)" : "rgba(0, 0, 0, .15)")
            :
            (themeShared.value == "dark" ? "rgba(0, 0, 0, 1)" : "rgba(0, 0, 0, .06)")
        ,
        borderWidth: 1,
        borderColor: scrollYShared.value >= scrollCheckPoint * .5 ?
            (themeShared.value == "dark" ? "rgba(255, 255, 255, .2)" : "rgba(0, 0, 0, .2)")
            :
            (themeShared.value == "dark" ? "rgba(0, 0, 0, 1)" : "rgba(0, 0, 0, .03)")
        ,
        borderRadius: scrollYShared.value >= scrollCheckPoint * .5 ? 20 : 0,
    }));

    const filterAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: interpolate(
                    scrollYShared.value,
                    [0, scrollCheckPoint],
                    [0, width],
                    Extrapolation.CLAMP,
                )
            }
        ],
        opacity: (scrollYShared.value == 0 && showFilter.value) ? 1 : .3,
        pointerEvents: (scrollYShared.value == 0 && showFilter.value) ? "auto" : "none",
    }));

    const handleArchive = async () => {
        if (tasksSelected.length == 0 || processing || loading) return;
        setProcessing(true);
        const tab = [...tasksSelected];

        tasksTmp.current = tasks;
        setTasks(prev => [...prev.filter(t => !tab.find(e => e.idTask == t.idTask))]);
        setTasksSelected([]);
        setCount(prev => prev - tab.length);

        try {
            await toggleArchiveTasks([...tab.map(t => t.idTask)], true);
            setProcessing(false);
            handleGetTasks(true);
        }
        catch (e) {
            console.log(e);
            setProcessing(false);
            setCount(prev => prev + tab.length);
            tasksTmp.current.length > 0 && setTasks(tasksTmp.current);
            tasksTmp.current = [];
            setToast("Une erreur s'est produite", "error");
        }
    }

    const handleDelete = async (init: boolean = true) => {
        if (tasksSelected.length == 0 || processing || loading) return;
        setProcessing(true);
        const tab = [...tasksSelected];

        if (init) {
            tasksTmp.current = tasks;
            setTasks(prev => [...prev.filter(t => !tab.find(e => e.idTask == t.idTask))]);
            setTasksSelected([]);
            setCount(prev => prev - tab.length);
            setDismiss(
                () => handleDelete(false),
                () => {
                    setCount(prev => prev + tab.length);
                    tasksTmp.current.length > 0 && setTasks(tasksTmp.current);
                    tasksTmp.current = [];
                    setProcessing(false);
                });
            return;
        }
        try {
            await deleteTasks([...tab.map(t => t.idTask)]);
            setProcessing(false);
            handleGetTasks(true);
        }
        catch (e) {
            console.log(e);
            setProcessing(false);
            setCount(prev => prev + tab.length);
            tasksTmp.current.length > 0 && setTasks(tasksTmp.current);
            tasksTmp.current = [];
            setToast("Une erreur s'est produite", "error");
        }
    }

    useEffect(() => {
        const { remove } = BackHandler.addEventListener("hardwareBackPress", () => {
            if ((tasksTmp.current.length > 0 && countTmp > 0) || selectMap.size > 0) {
                tasksTmp.current.length > 0 && setTasks(tasksTmp.current);
                countTmp > 0 && setCount(countTmp);
                setTasksSelected([]);
                tasksTmp.current = [];
                setCountTmp(0);
                selectMap.clear();

                return true;
            }

            return false;
        });

        return () => remove();
    }, [tasksSelected, countTmp, selectMap]);

    const foldersSnapOffset = useMemo(() => {
        const tab: number[] = [];

        for (let i = 0; i <= folders.length; i++) {
            tab.push(i * 100);
        }

        return tab;
    }, [folders]);

    const handleGetFolders = useCallback(async () => {
        if (pathname != "/") return;
        try {
            const data = await getFolders() as FolderType[];

            setFolders(data);
        }
        catch (e) {
            console.log(e);
        }
    }, [pathname]);

    const checkScroll = useCallback((index: number = 0, y: number) => {
        scrollTimeout.current && clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => {
            if (y >= (scrollCheckPoint * .3) && y <= scrollCheckPoint + 50) flatListsRef.current[index]?.value.scrollToOffset({
                offset: scrollCheckPoint + 50,
                animated: true,
            });
            else if (y < (scrollCheckPoint * .3)) flatListsRef.current[index]?.value.scrollToOffset({
                offset: 0,
                animated: true,
            });
        }, 100);
    }, [folders, tasks]);

    useEffect(() => {
        loadingRef.current = loading;
        quietProcessing.value = processing;
    }, [loading, processing]);

    const handleEndReached = useCallback(() => {
        if (loading || currentFolder || tasks.length >= count || processing) return;
        handleGetTasks();
    }, [loading, tasks, count]);

    const currentIndex = useMemo(() => {
        if (!currentFolder) return 0;
        const i = flatListsRef.current.findIndex(f => f.id == currentFolder);

        return i <= 0 ? 0 : i;
    }, [folders, currentFolder]);

    const onCheckboxPress = useCallback(() => {
        const folderTasks = currentFolder ? tasks.filter(t => t.idFolder == currentFolder) : [];

        if (
            (tasksSelected.length == tasks.length && !currentFolder)
            ||
            (tasksSelected.length == folderTasks.length && currentFolder)
        ) {
            setTasksSelected([]);
        }
        else {
            const firstFolder = currentFolder == null;
            const selected: TaskType[] = [];
            const tab = firstFolder ?
                [...tasks]
                :
                [...tasksSelected, ...tasks.filter(t => t.idFolder == currentFolder && !tasksSelected.find(e => e.idTask == t.idTask))]
                ;

            for (let i = 0; i < selectLimit && i < tab.length; i++) {
                const item = tab[i];

                if (!selected.find(t => t.idTask === item.idTask)) {
                    selected.push(item);
                }
            }
            setTasksSelected([...selected]);
        }
    }, [tasksSelected, tasks, currentFolder]);

    const folderDataMap = useMemo(() => {
        const map = new Map(
            folders.map(folder => [folder.idFolder, tasks.filter(t => t.idFolder == folder.idFolder)]),
        );

        return map;
    }, [tasks, folders]);

    const onFolderPress = useCallback((folder: FolderType, index: number) => {
        if ((!currentFolder && index == 0) || (currentFolder && folder.idFolder == currentFolder)) return;
        setCurrentFolder(index == 0 ? null : folder.idFolder);
        setTasksSelected([]);
        flatListsRef.current && flatListsRef.current.forEach(item => {
            item.value.scrollToOffset({
                offset: 0,
                animated: false,
            });
        });
        tasksFlatListRef.current?.scrollToOffset({
            offset: index == 0 ? 0 : (index * width),
            animated: true,
        });
        foldersFlatListRef.current?.scrollToOffset({
            offset: index == 0 ? 0 : (index * 100),
            animated: true,
        });

        if (contentsSize.current[index] < height) {
            flatListsRef.current && flatListsRef.current[index]?.value.scrollToOffset({
                offset: 0,
                animated: true,
            });
        }
        else {
            flatListsRef.current && flatListsRef.current[index]?.value.scrollToOffset({
                offset: scrollCheckPoint,
                animated: true,
            });
        }
    }, [folders, height, currentFolder]);

    const foldersRenderItem = useCallback((folder: FolderType, index: number) => {
        const isActive = index === 0 ? currentFolder === null : currentFolder === folder.idFolder;

        return (
            <FolderButton
                key={folder.idFolder}
                active={isActive}
                onPress={() => onFolderPress(folder, index)}
            >
                {index == 0 ? t("tasks_all_folders") : folder.title}
            </FolderButton>
        );
    }, [folders, currentFolder, onFolderPress]);

    const tasksRenderItem = useCallback((folder: FolderType, index: number) => {
        return (
            <TaskFlatList
                key={folder.idFolder}
                handleRef={(ref) => {
                    if (ref) {
                        flatListsRef.current[index] = {
                            id: folder.idFolder,
                            value: ref as FlatList,
                        }
                    }
                }}
                loading={loading || processing}
                withGesture={otherElement}
                data={index == 0 ? tasks : (folderDataMap.get(folder.idFolder) ?? [])}
                renderItem={renderItem}
                onScroll={handleScroll}
                onMomentumScrollEnd={(e) => {
                    const y = e.nativeEvent.contentOffset.y;

                    checkScroll(index, y);
                }}
                onEndReached={() => index == 0 && handleEndReached()}
                onContentSizeChange={(_, y) => contentsSize.current[index] = y}
                getItemLayout={(_, index?: number) => ({
                    length: (taskHeight + tasksGap),
                    offset: (index ?? 0) * (taskHeight + tasksGap),
                    index: (index ?? 0),
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
                                <TextAnimated
                                    dark="rgba(255, 255, 255, .5)"
                                    light="rgba(0, 0, 0, .5)"
                                    className="font-bold text-lg tracking-wider"
                                >
                                    {value.trim().length > 0 ? t("tasks_search_tasks_empty") : t("tasks_no_tasks")}
                                </TextAnimated>
                            </View>
                        );
                    }
                }}
                ListFooterComponent={() => {
                    if (loading) return (
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
                    );
                }}
                gap={tasksGap}
            />
        );
    }, [tasks, selectMap, loading, processing, checkScroll, folderDataMap]);

    useEffect(() => {
        tasksSelectedShared.value = selectMap.size > 0;
    }, [selectMap]);

    useEffect(() => {
        if (pathname == "/") {
            handleGetFolders();
            handleGetCount();
            handleGetTasks(tasks.length > 0);
        }
    }, [pathname]);

    return (
        <Container centerX>
            <Animated.View
                style={headerContainerAnimation}
                className="absolute w-full h-[210px] z-[50]"
            >
                <LinearGradient
                    colors={theme == "dark" ?
                        ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .6)", "rgba(0, 0, 0, 0)"]
                        :
                        ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    locations={[0, .8, 1]}
                    className="w-full h-full"
                >
                    <LinearGradient
                        colors={theme == "dark" ?
                            ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .6)", "rgba(0, 0, 0, 0)"]
                            :
                            ["rgba(0, 0, 0, .06)", "rgba(0, 0, 0, .06)", "rgba(255, 255, 255, .2)"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        locations={[0, .8, 1]}
                        className="w-full h-full"
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
                                    setTasksSelected([]);
                                    setSearchSectionActive(true);
                                    event.emit(HIDE_NAVBAR);
                                }}
                                className="w-full h-16 flex flex-row items-center my-3 px-2 dark:text-white/90 text-black dark:bg-white/10 bg-white/85 rounded-2xl border-b dark:border-white/20 border-black/20 pl-4 pr-12"
                            >
                                <TextAnimated className="opacity-40 text-lg">
                                    {t("tasks_search")}
                                </TextAnimated>
                                <View className="absolute top-4 right-5 -z-[1] pointer-events-none">
                                    <FontAwesome5
                                        name="search"
                                        size={24}
                                        color={theme == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .6)"}
                                    />
                                </View>
                            </Pressable>
                        </Animated.View>

                        <View className="w-full flex items-center gap-1">
                            <Animated.View
                                style={stickyAnimation}
                                className="flex items-center"
                            >
                                <Animated.View
                                    style={folderAnimation}
                                    className="w-full flex flex-row items-center gap-5 px-3 py-1 overflow-hidden"
                                >
                                    {
                                        loading && !processing && tasks.length == 0 && (
                                            <View className="w-[70%] sm:w-[300px] h-[30px] flex flex-row items-center rounded-3xl overflow-hidden">
                                                <Skeleton />
                                            </View>
                                        )
                                    }

                                    {
                                        (!loading || tasks.length > 0) && (
                                            <>
                                                <FlatList
                                                    ref={foldersFlatListRef}
                                                    horizontal
                                                    showsHorizontalScrollIndicator={false}
                                                    nestedScrollEnabled
                                                    snapToOffsets={foldersSnapOffset}
                                                    decelerationRate="fast"
                                                    data={[
                                                        {
                                                            idFolder: "all_folders",
                                                            title: "all",
                                                            createdAt: new Date(),
                                                            updatedAt: new Date(),
                                                        } as FolderType,
                                                        ...folders,
                                                    ]}
                                                    keyExtractor={(folder) => folder.idFolder}
                                                    renderItem={({ item, index }) => foldersRenderItem(item, index)}
                                                    className="w-[90%]"
                                                    contentContainerClassName="flex flex-row items-center gap-[10px] pr-[50px]"
                                                />

                                                <LinearGradient
                                                    colors={
                                                        scrollY >= scrollCheckPoint * .5 ?
                                                            (
                                                                theme == "dark" ?
                                                                    ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .8)", "rgba(0, 0, 0, 0)"]
                                                                    :
                                                                    ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                                                            )
                                                            :
                                                            (
                                                                theme == "dark" ?
                                                                    ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .8)", "rgba(0, 0, 0, 0)"]
                                                                    :
                                                                    ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                                                            )
                                                    }
                                                    start={{ x: 1, y: 0 }}
                                                    end={{ x: 0, y: 0 }}
                                                    locations={[.5, .6, 1]}
                                                    className="absolute right-0 top-0 z-[10]"
                                                >
                                                    <LinearGradient
                                                        colors={
                                                            scrollY >= scrollCheckPoint * .5 ?
                                                                (
                                                                    theme == "dark" ?
                                                                        ["rgba(255, 255, 255, .2)", "rgba(255, 255, 255, .2)", "rgba(255, 255, 255, 0)"]
                                                                        :
                                                                        ["rgba(0, 0, 0, .1)", "rgba(0, 0, 0, .1)", "rgba(255, 255, 255, .2)"]
                                                                )
                                                                :
                                                                (
                                                                    theme == "dark" ?
                                                                        ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .8)", "rgba(0, 0, 0, 0)"]
                                                                        :
                                                                        ["rgba(0, 0, 0, .06)", "rgba(0, 0, 0, .06)", "rgba(255, 255, 255, .0)"]
                                                                )
                                                        }
                                                        start={{ x: 1, y: 0 }}
                                                        end={{ x: 0, y: 0 }}
                                                        locations={[.5, .6, 1]}
                                                        className="w-full h-full flex justify-center items-center pl-10 pr-3 py-1"
                                                    >
                                                        <PressableAnimated>
                                                            <FontAwesome5
                                                                name="folder-plus"
                                                                size={25}
                                                                color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                                                            />
                                                        </PressableAnimated>
                                                    </LinearGradient>
                                                </LinearGradient>
                                            </>
                                        )
                                    }
                                </Animated.View>
                            </Animated.View>

                            <Animated.View
                                style={filterAnimation}
                                className="w-full flex flex-row items-center gap-3 px-3 py-1"
                            >
                                {
                                    loading && !processing && tasks.length == 0 && (
                                        <View className="w-[50%] sm:w-[200px] h-[30px] flex flex-row items-center rounded-3xl overflow-hidden">
                                            <Skeleton />
                                        </View>
                                    )
                                }

                                {
                                    (!loading || tasks.length > 0) && (
                                        <LinearGradient
                                            colors={theme == "dark" ?
                                                ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)"]
                                                :
                                                ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                                            }
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            locations={theme == "dark" ? [.5, .7, 1] : [.5, .8, 1]}
                                            className="absolute left-0 top-0 z-[1]"
                                        >
                                            <LinearGradient
                                                colors={theme == "dark" ?
                                                    ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)"]
                                                    :
                                                    ["rgba(0, 0, 0, .06)", "rgba(0, 0, 0, .06)", "rgba(255, 255, 255, .2)"]
                                                }
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                locations={theme == "dark" ? [.5, .7, 1] : [.5, .8, 1]}
                                                className="w-[100px] h-full flex flex-row items-center gap-2 px-3 py-1"
                                            >
                                                <TextAnimated className="text-lg">
                                                    {t("tasks_filter")}
                                                </TextAnimated>

                                                <FontAwesome5
                                                    name="filter"
                                                    size={15}
                                                    color={theme === "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .5)"}
                                                />
                                            </LinearGradient>
                                        </LinearGradient>
                                    )
                                }

                                {
                                    (!loading || tasks.length > 0) && (
                                        <ScrollView
                                            ref={filterScrollViewRef}
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            nestedScrollEnabled
                                            className="w-full"
                                            contentContainerClassName="flex flex-row items-center gap-[10px] pl-[85px] pr-[30px]"
                                        >
                                            {
                                                [
                                                    t("tasks_filter_all"),
                                                    t("tasks_filter_done"),
                                                    t("tasks_filter_not_done"),
                                                ].map((item, i) => (
                                                    <PressableAnimated
                                                        key={i}
                                                        scale={.95}
                                                        onPress={() => {
                                                            setCurrentFilter(i + 1);
                                                            handleFilter(i == 0 ? null : (i == 1 ? true : false));
                                                            filterScrollViewRef.current?.scrollTo({
                                                                x: i * 100,
                                                                animated: true,
                                                            });
                                                        }}
                                                        style={{
                                                            backgroundColor: currentFilter == (i + 1) ?
                                                                (theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)")
                                                                :
                                                                (theme == "dark" ? "rgba(255, 255, 255, .2)" : "rgba(255, 255, 255, .8)")
                                                        }}
                                                        className="w-[100px] flex flex-row justify-center items-center px-3 rounded-xl border dark:border-white/20 border-black/20"
                                                    >
                                                        <TextAnimated
                                                            dark={currentFilter == (i + 1) ? "rgba(0, 0, 0, .8)" : "rgba(255, 255, 255, .8)"}
                                                            light={currentFilter == (i + 1) ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                                                            className={clsx(
                                                                "text-lg",
                                                                currentFilter == i + 1 && "font-bold",
                                                            )}
                                                        >
                                                            {item}
                                                        </TextAnimated>
                                                    </PressableAnimated>
                                                ))
                                            }
                                        </ScrollView>
                                    )
                                }

                                <LinearGradient
                                    colors={theme == "dark" ?
                                        ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .5)", "rgba(0, 0, 0, 0)"]
                                        :
                                        ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, .8)", "rgba(255, 255, 255, 0)"]
                                    }
                                    start={{ x: 1, y: 0 }}
                                    end={{ x: 0, y: 0 }}
                                    locations={[.5, .6, 1]}
                                    className="absolute right-0 h-full z-[1]"
                                >
                                    <LinearGradient
                                        colors={theme == "dark" ?
                                            ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .5)", "rgba(0, 0, 0, 0)"]
                                            :
                                            ["rgba(0, 0, 0, .06)", "rgba(0, 0, 0, .06)", "rgba(0, 0, 0, 0)"]
                                        }
                                        start={{ x: 1, y: 0 }}
                                        end={{ x: 0, y: 0 }}
                                        locations={[.5, .6, 1]}
                                        className="w-[50px] h-full"
                                    />
                                </LinearGradient>
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
                    </LinearGradient>
                </LinearGradient>
            </Animated.View>

            {
                filterLoading && (
                    <View className="absolute left-0 top-0 w-screen h-screen flex justify-center items-center dark:bg-black/50 bg-black/20 z-[200]">
                        <ActivityIndicator
                            size={30}
                            color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                        />
                    </View>
                )
            }

            <GestureDetector gesture={panRefresh}>
                <FlatList
                    ref={tasksFlatListRef}
                    horizontal
                    scrollEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    nestedScrollEnabled
                    pagingEnabled
                    decelerationRate="fast"
                    initialNumToRender={1}
                    maxToRenderPerBatch={1}
                    removeClippedSubviews
                    data={[
                        {
                            idFolder: "all_folder",
                            title: "all",
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        } as FolderType,
                        ...folders,
                    ]}
                    keyExtractor={(item) => item.idFolder}
                    renderItem={({ item, index }) => tasksRenderItem(item, index)}
                    getItemLayout={(_, index) => ({
                        length: width,
                        offset: index * width,
                        index,
                    })}
                    className="w-full"
                    contentContainerClassName="flex flex-row"
                />
            </GestureDetector>

            <PressableToScrollAnimated
                onPress={() => flatListsRef.current[currentIndex].value.scrollToOffset({
                    offset: 0,
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
                    },
                    taskSelectedAnimation,
                ]}
                className="absolute right-0 bottom-0 dark:bg-black bg-white rounded-2xl"
            >
                <View
                    style={{
                        transform: [
                            {
                                translateY: 10,
                            }
                        ],
                        filter: "blur(5px)"
                    }}
                    className="absolute bottom-0 w-[100%] h-full bg-black/30 -z-[1] rounded-[50px]"
                />

                <View className="w-full h-full flex flex-row items-center gap-5 dark:bg-white/20 bg-white rounded-2xl px-3 py-1 dark:border-white/10 border border-black/20">
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
                        onPress={() => onCheckboxPress()}
                    />

                    <PressableAnimated onPress={() => handleArchive()}>
                        <MaterialIcons
                            name="archive"
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
                className="absolute right-0 bottom-0 size-[50px] dark:bg-black bg-white rounded-full"
            >
                <View
                    style={{
                        transform: [
                            {
                                translateY: 5,
                            }
                        ],
                        filter: "blur(5px)"
                    }}
                    className="absolute bottom-0 w-full h-full bg-black/20 -z-[1] rounded-full"
                />

                <Pressable
                    onPress={() => {
                        // if (tasks.length > 0) {
                        //     setTasks([]);
                        //     tasksTmp.current = [];
                        //     setCount(0);
                        //     setCountTmp(0);
                        // }
                        // else getTasks();
                    }}
                    className="size-full flex justify-center items-center rounded-full border dark:border-white/10 border-black/10 dark:bg-white/15 bg-white"
                >
                    <FontAwesome5
                        name="plus"
                        size={20}
                        color={COLORS.emerald[500]}
                    />
                </Pressable>
            </Animated.View>

            <LinearGradient
                colors={theme == "dark" ?
                    ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .5)", "rgba(0, 0, 0, 0)"]
                    :
                    ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                }
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                className="absolute left-0 bottom-0 w-full z-[10]"
            >
                <LinearGradient
                    colors={theme == "dark" ?
                        ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .5)", "rgba(0, 0, 0, 0)"]
                        :
                        ["rgba(0, 0, 0, .06)", "rgba(0, 0, 0, .06)", "rgba(255, 255, 255, .2)"]
                    }
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    className="w-full h-[50px]"
                />
            </LinearGradient>

            {/* Search component */}

            <Search
                active={searchSectionActive}
                onClose={() => setSearchSectionActive(false)}
            />
        </Container>
    );
}