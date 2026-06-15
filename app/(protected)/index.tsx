import { Checkbox } from "@/components/checkbox";
import { Container } from "@/components/container";
import { PageTitle } from "@/components/page-title";
import { PressableAnimated, PressableAnimatedProps } from "@/components/pressable-animated";
import { Skeleton } from "@/components/skeleton";
import { TextAnimated } from "@/components/text-animated";
import { COLORS } from "@/constants/colors";
import { useFolders } from "@/hooks/database/use-folders";
import { useTasks } from "@/hooks/database/use-tasks";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { event, HIDE_NAVBAR, SHOW_NAVBAR } from "@/lib/event-emitter";
import { FolderType } from "@/types/folder";
import { TaskType } from "@/types/task";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Octicons from "@expo/vector-icons/Octicons";
import clsx from "clsx";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import { Component, JSX, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, BackHandler, FlatList, FlatListProps, Keyboard, KeyboardAvoidingView, NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, PressableProps, ScrollView, Text, TextInput, useWindowDimensions, Vibration, View } from "react-native";
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
}
const TaskCard = memo(({ task, onRefresh, loading: parentLoading = false, selectedIndex: index = 0, onLongPress, selection: selecting = false, onDelete, onArchive, onPress, ...rest }: TaskCardProps) => {
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
            setToast(t("tasks_archived_item"), "default", 2000);
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
                if (x >= -100 && x <= 100 && !loadingShared.value && !selected.value && !selection.value) translateX.value = x;
            })
            .onEnd(({ translationX: x }) => {
                if (selected.value || selection.value || loadingShared.value || (x >= -99 && x <= 99)) {
                    translateX.value = withSpring(0, {
                        stiffness: 100,
                        mass: 2,
                        damping: 10,
                    });
                }
                else if (x <= -100) {
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
    getItemLayout: () => {
        length: number;
        offset: number;
        index: number;
    };
    ListEmptyComponent: () => JSX.Element | null | undefined;
    ListFooterComponent: () => JSX.Element | null | undefined;
    handleRef: (ref: Component<AnimatedProps<FlatListProps<unknown>>, any, any> | null) => void;
    loading: boolean;
    currentFolder: boolean;
}

const FolderFlatList = memo(({
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
    currentFolder,
}: FolderFlatListProps) => {
    const handleMomentumScrollBegin = useCallback(() => onMomentumScrollBegin?.(), []);

    const handleMomentumScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => onMomentumScrollEnd(e), []);

    const handleItemLayout = useCallback(() => getItemLayout(), []);

    const handleListEmptyComponent = useCallback(() => ListEmptyComponent(), [loading, currentFolder]);

    const handleListFooterComponent = useCallback(() => ListFooterComponent(), [loading, currentFolder]);

    const gesture = useMemo(() => withGesture, []);

    return (
        <View className="w-screen flex items-center shrink-0">
            <GestureDetector gesture={gesture}>
                <FlatListAnimated
                    ref={handleRef}
                    nestedScrollEnabled
                    horizontal={false}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
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
                    onEndReached={onEndReached}
                    getItemLayout={handleItemLayout}
                    ListEmptyComponent={handleListEmptyComponent}
                    ListFooterComponent={handleListFooterComponent}
                    className="w-full"
                    contentContainerClassName="w-full flex flex-col items-center gap-5 pt-[220px] pb-[100px] px-3"
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
    const syncLoading = useRef<boolean>(false);
    const synced = useRef<boolean>(false);
    const { t } = useTranslation();
    const searchTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    const showScrollButton = useSharedValue<boolean>(false);
    const showButtonTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    const tasksSelectedShared = useSharedValue<boolean>(false);
    const scrollCheckPoint = 100;
    const themeShared = useSharedValue<typeof theme>(theme);
    const showAddTaskButton = useSharedValue<boolean>(true);
    const [folders, setFolders] = useState<FolderType[]>([]);
    const selectLimit = 50;
    const flatListScrollViewRef = useRef<ScrollView>(null);
    const itemHeight = 100;
    const getTaskTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    const scrollTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    const quietProcessing = useSharedValue<boolean>(false);
    const [processing, setProcessing] = useState<boolean>(false);
    const showFilter = useSharedValue<boolean>(true);
    const { syncTasks, getTasks, searchTasks, deleteTasks, toggleArchiveTasks, getTasksCount } = useTasks();
    const [tasksSearch, setTasksSearch] = useState<TaskType[]>([]);
    const searchScrollY = useSharedValue<number>(0);
    const searchScrollCheckPoint = 100;
    const searchSectionActive = useSharedValue<boolean>(false);
    const [isSearchSectionActive, setIsSearchSectionActive] = useState<boolean>(false);
    const [countSearch, setCountSearch] = useState<number>(0);
    const [searchLoading, setSearchLoading] = useState<boolean>(false);
    const [currentFilter, setCurrentFilter] = useState<number>(1);
    const [currentFolder, setCurrentFolder] = useState<FolderType["idFolder"] | null>(null);
    const folderFlatListScrollViewRef = useRef<ScrollView>(null);
    const filterflatListScrollViewRef = useRef<ScrollView>(null);
    const searchFlatListRef = useRef<FlatList>(null);
    const { getFolders } = useFolders();
    const flatListsRef = useRef<{
        id: string;
        value: FlatList;
    }[]>([]);
    const [filterLoading, setFilterLoading] = useState<boolean>(false);
    const loadingRef = useRef<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

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
            setTasksTmp([]);
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
        tasksTmp.length == 0 && setTasksTmp(tasks);
        countTmp == 0 && setCountTmp(count);
        if (entry == null) {
            tasksTmp.length > 0 && setTasks(tasksTmp);
            countTmp > 0 && setCount(countTmp);
            setTasksTmp([]);
            setCountTmp(0);
            setFilterLoading(false);
            return;
        }
        const result = (tasksTmp.length == 0 ? tasks : tasksTmp).filter((task) => task.done == entry);

        setTasks(result);
        setCount(result.length);
        setFilterLoading(false);
    }, [tasksTmp, countTmp, tasks]);

    const handleSearch = useCallback(async (value: string, pagination: boolean = false) => {
        searchTimeout.current && clearTimeout(searchTimeout.current);
        if (pathname != "/" || value.trim().length == 0) {
            setCountSearch(0);
            setTasksSearch([]);
            setSearchLoading(false);
            return;
        }
        if (searchLoading) return;
        setSearchLoading(true);
        searchTimeout.current = setTimeout(async () => {
            try {
                const { data, count } = await searchTasks(value, limit, pagination ? tasksSearch.length : 0) as {
                    data: TaskType[];
                    count: number;
                };

                setCountSearch(count);
                if (pagination) {
                    setTasksSearch(prev => [...prev, ...data.filter((task) => !prev.find(t => t.idTask == task.idTask))]);
                }
                else {
                    setTasksSearch([...data]);
                }
                setSearchLoading(false);
            }
            catch (e) {
                setSearchLoading(false);
                console.log(e);
            }
        }, 100);
    }, [pathname, tasksSearch]);

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
            if (scrollY.value == 0 && !quietProcessing.value) {
                translateY.value = y;
            }
        })
        .onEnd(() => {
            if (scrollY.value > 0 || quietProcessing.value || translateY.value < 90) {
                translateY.value = 0;
            }
            else if (translateY.value >= 90) {
                translateY.value = 180;
                runOnJS(handleGetTasks)(true);
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
            setToast(t(""));
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
        setProcessing(true);
        setCount(prev => prev - 1);
        setTasks(prev => prev.filter(t => t.idTask !== task.idTask));
    }, []);

    const handleTaskPress = useCallback((id: TaskType["idTask"]) => {
        if (processing) return;
        if (selectMap.size == 0) {
            console.log("Pressed", id);
        }
    }, [selectMap.size, processing]);

    const isBlocked = useMemo(() => {
        return (loading || processing || tasksSearch.length > 0 || isSearchSectionActive);
    }, [loading, processing, tasksSearch, isSearchSectionActive]);

    const renderItem = useCallback((task: TaskType) => (
        <TaskCard
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
            await toggleArchiveTasks([...tab.map(t => t.idTask)], true);

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
                    [70, 4],
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
                setCountSearch(0);
                setTasksSearch([]);
                setValue("");
                setSearchLoading(false);
                searchTimeout.current && clearTimeout(searchTimeout.current);
                event.emit(SHOW_NAVBAR);
                return true;
            }
            else if ((tasksTmp.length > 0 && countTmp > 0) || tasksSelected.length > 0) {
                tasksTmp.length > 0 && setTasks(tasksTmp);
                countTmp > 0 && setCount(countTmp);
                setTasksSelected([]);
                setTasksTmp([]);
                setCountTmp(0);
                return true;
            }

            return false;
        });

        searchSectionActive.value = isSearchSectionActive;
        if (isSearchSectionActive && value.trim().length == 0) textInputRef.current?.focus();
        else if (!isSearchSectionActive) {
            textInputRef.current?.blur();
            setValue("");
            setTasksSearch([]);
            setCountSearch(0);
        }

        return () => remove();
    }, [tasksSelected, value, tasksTmp, countTmp, isSearchSectionActive]);

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

    const checkScroll = useCallback((index: number = 0, id: string, y: number) => {
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
        getTaskTimeout.current && clearTimeout(getTaskTimeout.current);
        if (flatListsRef.current.length > 0) {
            const list = flatListsRef.current;

            list.forEach(item => {
                item.value.scrollToOffset({
                    offset: 0,
                    animated: false,
                });
            });
        }
        setTasksSelected([]);
        flatListsRef.current && flatListsRef.current.forEach(item => {
            item.value.scrollToOffset({
                offset: 0,
                animated: false,
            });
        });
        scrollY.value = 0;
    }, [currentFolder]);

    useEffect(() => {
        loadingRef.current = loading;
        quietProcessing.value = processing;
    }, [loading, processing]);

    const handleEndReached = useCallback(() => {
        if (loading || currentFolder) return;
        if (tasksSelected.length == 0 && !processing && tasks.length < count) {
            handleGetTasks();
        }
    }, [loading, tasks, count, tasksSelected]);

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

    useEffect(() => {
        handleGetFolders();
        handleGetTasks();
        handleGetCount();
    }, []);

    return (
        <Container centerX>
            <Animated.View
                style={headerContainerAnimation}
                className="absolute w-full h-[210px] z-[50]"
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
                            setIsSearchSectionActive(true);
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
                            className="w-full flex flex-row items-center gap-5 px-3 py-1"
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
                                        <ScrollView
                                            ref={folderFlatListScrollViewRef}
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            nestedScrollEnabled
                                            snapToOffsets={foldersSnapOffset}
                                            decelerationRate="fast"
                                            className="w-[90%]"
                                            contentContainerClassName="flex flex-row items-center gap-[10px]"
                                        >
                                            <FolderButton
                                                active={!currentFolder}
                                                onPress={() => {
                                                    setCurrentFolder(null);
                                                    flatListScrollViewRef.current?.scrollTo({
                                                        x: 0,
                                                        animated: true,
                                                    });
                                                    folderFlatListScrollViewRef.current?.scrollTo({
                                                        x: 0,
                                                        animated: true,
                                                    });
                                                }}
                                            >
                                                {t("tasks_all_folders")}
                                            </FolderButton>

                                            {
                                                folders.length > 0 && folders.map((folder, i) => (
                                                    <FolderButton
                                                        key={folder.idFolder}
                                                        active={currentFolder == folder.idFolder}
                                                        onPress={() => {
                                                            setCurrentFolder(folder.idFolder);
                                                            flatListScrollViewRef.current?.scrollTo({
                                                                x: (i + 1) * width,
                                                                animated: true,
                                                            });
                                                            folderFlatListScrollViewRef.current?.scrollTo({
                                                                x: i * 100,
                                                                animated: true,
                                                            });
                                                        }}
                                                    >
                                                        {folder.title}
                                                    </FolderButton>
                                                ))
                                            }
                                        </ScrollView>

                                        <PressableAnimated>
                                            <FontAwesome5
                                                name="folder-plus"
                                                size={25}
                                                color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                                            />
                                        </PressableAnimated>
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
                            !loading && (
                                <>
                                    <View className="absolute h-full flex flex-row items-center shrink-0 dark:bg-black bg-white z-[1]">
                                        <View className="h-full flex flex-row items-center gap-2 px-3 dark:bg-black bg-[rgba(0,0,0,.06)]">
                                            <TextAnimated className="text-lg">
                                                {t("tasks_filter")}
                                            </TextAnimated>
                                            <FontAwesome5
                                                name="filter"
                                                size={15}
                                                color={theme === "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .5)"}
                                            />
                                        </View>

                                        <LinearGradient
                                            colors={theme == "dark" ? ["rgba(0, 0, 0, .8)", "rgba(0, 0, 0, .2)"] : ["rgba(255, 255, 255, .8)", "rgba(255, 255, 255, .2)"]}
                                            locations={[0, .9]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={{
                                                transform: [
                                                    {
                                                        translateX: 20,
                                                    }
                                                ],
                                            }}
                                            className="absolute right-0 w-[20px] h-full"
                                        >
                                            <View className="w-full h-full dark:bg-transparent bg-[rgba(0,0,0,.06)]" />
                                        </LinearGradient>
                                    </View>

                                    <View className="absolute right-0 w-[30px] h-full z-[1] dark:bg-black/20 bg-white/20">
                                        <LinearGradient
                                            colors={theme == "dark" ? ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 1)"] : ["rgba(255, 255, 255, .5)", "rgba(255, 255, 255, 1)"]}
                                            locations={[0, .3]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            className="w-full h-full"
                                        >
                                            <LinearGradient
                                                colors={theme == "dark" ? ["rgba(0, 0, 0, .05)", "rgba(0, 0, 0, 1)"] : ["rgba(255, 255, 255, .2)", "rgba(0, 0, 0, .06)"]}
                                                locations={[0, .2]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                className="w-full h-full"
                                            />
                                        </LinearGradient>
                                    </View>
                                </>
                            )
                        }

                        {
                            !loading && (
                                <ScrollView
                                    ref={filterflatListScrollViewRef}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    nestedScrollEnabled
                                    className="w-full"
                                    contentContainerClassName="flex flex-row items-center gap-[10px] pl-[80px] pr-[20px]"
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
                                                    filterflatListScrollViewRef.current?.scrollTo({
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

            <ScrollView
                ref={flatListScrollViewRef}
                horizontal
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                decelerationRate="fast"
                className="w-full mt-3"
                contentContainerClassName="flex flex-row"
            >
                <GestureDetector gesture={panRefresh}>
                    <View className="w-full flex flex-row">
                        {
                            [
                                {
                                    idFolder: "folder_all",
                                    title: "all",
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                },
                                ...folders,
                            ]
                                .map((folder, i) => {
                                    const isActive = currentFolder === null
                                        ? i === 0
                                        : currentFolder === folder.idFolder;

                                    if (!isActive) return (
                                        <View key={folder.idFolder} className="w-screen shrink-0" />
                                    );

                                    return (
                                        <FolderFlatList
                                            key={folder.idFolder}
                                            handleRef={(ref) => {
                                                if (ref) {
                                                    flatListsRef.current[i] = {
                                                        id: folder.idFolder,
                                                        value: ref as FlatList,
                                                    }
                                                }
                                            }}
                                            loading={loading || processing}
                                            withGesture={otherElement}
                                            currentFolder={(currentFolder == folder.idFolder)}
                                            data={i == 0 ? tasks : [...tasks.filter(t => t.idFolder == folder.idFolder)]}
                                            renderItem={renderItem}
                                            onScroll={handleScroll}
                                            onMomentumScrollEnd={(e) => {
                                                const y = e.nativeEvent.contentOffset.y;

                                                checkScroll(i, folder.idFolder, y);
                                            }}
                                            onEndReached={handleEndReached}
                                            getItemLayout={() => ({
                                                length: itemHeight,
                                                offset: i * itemHeight,
                                                index: i,
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
                                                if (loading && !currentFolder) return (
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
                                        />
                                    );
                                })
                        }
                    </View>
                </GestureDetector>
            </ScrollView>

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
                        ref={searchFlatListRef}
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
                        scrollEventThrottle={16}
                        onScroll={onSearchScroll}
                        onMomentumScrollEnd={() => {
                            if (searchScrollY.value > 0 && searchScrollY.value < (searchScrollCheckPoint * .5)) searchFlatListRef.current?.scrollToOffset({
                                offset: 0,
                                animated: true,
                            });
                            else if (searchScrollY.value >= (searchScrollCheckPoint * .5) && searchScrollY.value < searchScrollCheckPoint) searchFlatListRef.current?.scrollToOffset({
                                offset: searchScrollCheckPoint,
                                animated: true,
                            });
                        }}
                        onEndReachedThreshold={.1}
                        onEndReached={() => tasksSearch.length < countSearch && !searchLoading && handleSearch(value, true)}
                        ListEmptyComponent={() => {
                            if (!searchLoading && value.trim().length > 0) {
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
                        ListFooterComponent={searchLoading ? (
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