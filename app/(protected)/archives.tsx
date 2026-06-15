import { Checkbox } from "@/components/checkbox";
import { Container } from "@/components/container";
import { PressableAnimated } from "@/components/pressable-animated";
import { Skeleton } from "@/components/skeleton";
import { TextAnimated } from "@/components/text-animated";
import { useTasks } from "@/hooks/database/use-tasks";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { TaskType } from "@/types/task";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, FlatList, Pressable, PressableProps, useWindowDimensions, Vibration, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, Extrapolation, interpolate, runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";

interface TaskCardProps extends Omit<PressableProps, "onLongPress" | "onPress"> {
    task: TaskType;
    onRefresh: (error?: boolean) => void;
    loading: boolean;
    selectedIndex?: number;
    onLongPress?: (task: TaskType) => void;
    selection?: boolean;
    onDelete?: (task: TaskType) => void;
    onUnArchive?: (task: TaskType) => void;
    onPress?: (id: TaskType["idTask"]) => void;
}
const TaskCard = memo(({ task, onRefresh, loading: parentLoading = false, selectedIndex: index = 0, onLongPress, selection: selecting = false, onDelete, onUnArchive, onPress, ...rest }: TaskCardProps) => {
    const translateX = useSharedValue<number>(0);
    const { setToast, setDismiss } = useToast();
    const selected = useSharedValue<boolean>(false);
    const selection = useSharedValue<boolean>(false);
    const { deleteTasks, toggleArchiveTasks } = useTasks();
    const { t } = useTranslation();
    const loadingShared = useSharedValue<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

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
        setDismiss(handleDeleteTask, () => onRefresh(true), 5, 60);
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
        onUnArchive?.(task);
        try {
            setLoading(true);
            await toggleArchiveTasks([task.idTask]);
            setLoading(false);
            setToast(t("archives_unarchive_item"), "default", 2000);
            onRefresh();
        }
        catch (e) {
            onRefresh(true);
            setLoading(false);
            console.log(e);
        }
    }, [onUnArchive, task.idTask, loading, onRefresh]);

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
                                name="unarchive"
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

const FlatListAnimated = Animated.createAnimatedComponent(FlatList);

const LinearGradientAnimated = Animated.createAnimatedComponent(LinearGradient);

export default function Archives() {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(false);
    const loadingRef = useRef<boolean>(false);
    const [tasks, setTasks] = useState<TaskType[]>([]);
    const scrollY = useSharedValue<number>(0);
    const scrollCheckPoint = 50;
    const themeShared = useSharedValue<typeof theme>("dark");
    const headerWidth = useSharedValue<number>(0);
    const { getTasks, getTasksCount, deleteTasks, toggleArchiveTasks } = useTasks();
    const limit = 10;
    const pathname = usePathname();
    const [count, setCount] = useState<number>(0);
    const [processing, setProcessing] = useState<boolean>(false);
    const [tasksSelected, setTasksSelected] = useState<TaskType[]>([]);
    const tasksSelectedShared = useSharedValue<boolean>(false);
    const selectLimit = 50;
    const { width, height } = useWindowDimensions();
    const { setToast, setDismiss } = useToast();
    const dismissTranslateY = 60;
    const tasksTmp = useRef<TaskType[]>([]);

    const onRefreshTask = useCallback((e: boolean = false) => {
        if (e) {
            setCount(prev => prev + 1);
            tasksTmp.current.length > 0 && setTasks(tasksTmp.current);
            tasksTmp.current = [];
        }
        setProcessing(false);
    }, [tasks, processing]);

    const selectMap = useMemo(() => new Map(
        tasksSelected.map((t, i) => [t.idTask, i + 1]),
    ), [tasksSelected]);

    const onLongPressTask = useCallback((task: TaskType) => {
        const exist = selectMap.get(task.idTask);

        if (exist) setTasksSelected(prev => [...prev.filter(t => t.idTask != task.idTask)]);
        else setTasksSelected(prev => [...prev, task]);
    }, [tasksSelected, selectMap]);

    const onPressTask = useCallback(() => {
        selectMap.size == 0 && router.navigate("/");
    }, [selectMap]);

    const taskLoading = useMemo(() => loading || processing, [loading, processing]);

    const onUnArchiveTask = useCallback((task: TaskType) => {
        if (processing || tasksTmp.current.length > 0) return;
        setProcessing(true);
        setCount(prev => prev - 1);
        tasksTmp.current = tasks;
        setTasks(prev => [...prev.filter(t => t.idTask != task.idTask)]);
    }, [tasks, processing]);

    const onDeleteTask = useCallback((task: TaskType) => {
        if (processing || tasksTmp.current.length > 0) return;
        setProcessing(true);
        setCount(prev => prev - 1);
        tasksTmp.current = tasks;
        setTasks(prev => [...prev.filter(t => t.idTask != task.idTask)]);
    }, [tasks, processing]);

    const renderItem = useCallback((task: TaskType) => (
        <TaskCard
            task={task}
            loading={taskLoading}
            selection={selectMap.size > 0}
            selectedIndex={selectMap.get(task.idTask)}
            onRefresh={onRefreshTask}
            onPress={onPressTask}
            onLongPress={onLongPressTask}
            onUnArchive={onUnArchiveTask}
            onDelete={onDeleteTask}
        />
    ), [tasks, onLongPressTask, onPressTask, onRefreshTask, taskLoading, selectMap]);

    const onScroll = useAnimatedScrollHandler({
        onScroll: (e) => {
            const y = e.contentOffset.y;

            scrollY.value = y;
        }
    });

    const descriptionAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: 20,
            }
        ],
        opacity: interpolate(
            scrollY.value,
            [0, scrollCheckPoint],
            [1, 0],
            Extrapolation.CLAMP,
        )
    }));

    const headerAnimation = useAnimatedStyle(() => ({
        borderWidth: 1,
        borderColor: themeShared.value == "dark" ?
            scrollY.value >= scrollCheckPoint ? "rgba(255, 255, 255, .1)" : "rgba(0, 0, 0, 1)"
            :
            scrollY.value >= scrollCheckPoint ? "rgba(0, 0, 0, .1)" : "rgba(255, 255, 255, .1)",
        overflow: themeShared.value == "dark" ?
            scrollY.value >= scrollCheckPoint ? "visible" : "hidden"
            :
            scrollY.value >= scrollCheckPoint ? "hidden" : "visible",

    }));

    const headerBackgroundAnimation = useAnimatedStyle(() => ({
        width: interpolate(
            scrollY.value,
            [0, scrollCheckPoint],
            [50, headerWidth.value],
            Extrapolation.CLAMP,
        )
    }));

    useEffect(() => {
        themeShared.value = theme;
    }, [theme]);

    const handleGetTasks = async (refresh: boolean = false) => {
        if (loadingRef.current || pathname != "/archives") return;
        loadingRef.current = true;
        if (refresh) setProcessing(true);
        else setLoading(true);
        try {
            const data = await getTasks(limit, refresh ? 0 : tasks.length, true) as TaskType[];

            if (refresh) setTasks(data);
            else setTasks(prev => [...prev, ...data.filter(t => !prev.find(e => e.idTask == t.idTask))]);
            loadingRef.current = false;
            setLoading(false);
            setProcessing(false);
        }
        catch (e) {
            loadingRef.current = false;
            setLoading(false);
            setProcessing(false);
            console.log(e);
        }
    }

    const handleGetTasksCount = async () => {
        if (pathname != "/archives") return;
        try {
            const data = await getTasksCount(true) as number;

            setCount(data);
        }
        catch (e) {
            console.log(e);
        }
    }

    const taskSelectedAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: -20,
            },
            {
                translateY: withTiming(tasksSelectedShared.value ? -(height - (height * .95)) : height * .5, {
                    duration: 300,
                    easing: Easing.inOut(Easing.quad),
                }),
            },
        ]
    }));

    const onCheckboxPress = useCallback(() => {
        if (tasksSelected.length == tasks.length) {
            setTasksSelected([]);
        }
        else {
            const selected: TaskType[] = [];
            const tab = [...tasksSelected, ...tasks.filter(t => !tasksSelected.find(e => e.idTask == t.idTask))];

            for (let i = 0; i < selectLimit && i < tab.length; i++) {
                const item = tab[i];

                if (!selected.find(t => t.idTask === item.idTask)) {
                    selected.push(item);
                }
            }
            setTasksSelected([...selected]);
        }
    }, [tasksSelected, tasks]);

    useEffect(() => {
        const onBackPress = () => {
            if (selectMap.size > 0) {
                setTasksSelected([]);
                return true;
            }
            return false;
        }
        const { remove } = BackHandler.addEventListener("hardwareBackPress", onBackPress);

        tasksSelectedShared.value = selectMap.size > 0;

        return () => remove();
    }, [selectMap]);

    const handleUnArchiveTasks = async () => {
        if (tasksSelected.length == 0 || processing) return;
        setProcessing(true);
        const tab = [...tasksSelected];

        setTasks(prev => [...prev.filter(task => !tab.find(t => t.idTask == task.idTask))]);
        setTasksSelected([]);
        setCount(count - tab.length);

        try {
            await toggleArchiveTasks([...tab.map(t => t.idTask)], false);
            setProcessing(false);
        }
        catch (e) {
            console.log(e);
            setCount(count + tab.length);
            setProcessing(false);
            handleGetTasks(true);
            setToast("Une erreur s'est produite", "error");
        }
    }

    const handleDeleteTasks = async (init: boolean = false) => {
        if (selectMap.size == 0 || processing) return;
        setProcessing(true);
        const tab = [...tasksSelected];

        if (init) {
            tasksTmp.current = tasks;
            setTasks(prev => [...prev.filter(task => !tab.find(t => t.idTask == task.idTask))]);
            setTasksSelected([]);
            setCount(prev => prev - tab.length);
            setDismiss(
                () => handleDeleteTasks(),
                () => {
                    if (tasksTmp.current.length > 0) setTasks(tasksTmp.current);
                    tasksTmp.current = [];
                    setCount(prev => prev + tab.length);
                    setProcessing(false);
                },
                5,
                dismissTranslateY,
            );
            return;
        }

        try {
            await deleteTasks([...tab.map(t => t.idTask)]);
            setProcessing(false);
        }
        catch (e) {
            console.log(e);
            if (tasksTmp.current.length > 0) setTasks(tasksTmp.current);
            tasksTmp.current = [];
            setCount(prev => prev + tab.length);
            setProcessing(false);
            setToast("Une erreur s'est produite", "error");
        }
    }

    useEffect(() => {
        handleGetTasksCount();
        handleGetTasks();
    }, []);

    return (
        <Container centerX>
            <View
                style={{
                    transform: [
                        {
                            translateX: 10,
                        },
                        {
                            translateY: 10,
                        },
                    ]
                }}
                className="absolute left-0 top-0 h-[50px] dark:bg-black bg-white rounded-[50px] z-[50]"
            >
                <Animated.View
                    onLayout={(e) => headerWidth.value = e.nativeEvent.layout.width}
                    style={headerAnimation}
                    className="w-full h-full flex flex-row items-center gap-6 rounded-[50px] pr-10 dark:bg-black bg-black/5"
                >
                    <Animated.View
                        style={headerBackgroundAnimation}
                        className="absolute left-0 h-[50px] dark:bg-white/10 bg-white rounded-[50px] -z-[10]"
                    />

                    <PressableAnimated
                        onPress={() => router.back()}
                        className="size-[50px] flex dark:bg-white bg-white rounded-full"
                    >
                        <View className="w-full h-full flex justify-center items-center dark:bg-black/90 bg-white rounded-full border dark:border-0 border-black/20">
                            <Entypo
                                name="chevron-left"
                                size={25}
                                color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                            />
                        </View>
                    </PressableAnimated>

                    <View className="h-full flex justify-center rounded-[50px]">
                        <TextAnimated className="text-xl tracking-widest">
                            {t("archives_title")}
                        </TextAnimated>
                    </View>
                </Animated.View>
            </View>

            <LinearGradientAnimated
                colors={theme == "dark" ? ["rgba(0, 0, 0, 0.8)", "rgba(255, 255, 255, .01)", "rgba(0, 0, 0, 0.8)"] : ["rgba(255, 255, 255, 0.6)", "rgba(0, 0, 0, .1)", "rgba(255, 255, 255, 0.6)"]}
                style={descriptionAnimation}
                className="absolute w-full h-[200px] flex justify-center items-center px-3 dark:bg-white/10 bg-black/10 -z-[10]"
            >
                <TextAnimated className="text-lg opacity-50 text-center">
                    {t("archives_description")}
                </TextAnimated>
            </LinearGradientAnimated>

            <FlatListAnimated
                horizontal={false}
                showsVerticalScrollIndicator={false}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                removeClippedSubviews
                windowSize={5}
                data={tasks}
                keyExtractor={(item) => (item as TaskType).idTask}
                renderItem={({ item }) => renderItem(item as TaskType)}
                scrollEventThrottle={16}
                onScroll={onScroll}
                onEndReachedThreshold={.1}
                onEndReached={() => {
                    if (loading || tasks.length >= count || selectMap.size > 0) return;
                    handleGetTasks();
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
                    )
                }}
                ListEmptyComponent={() => {
                    if (!loading) return (
                        <View className="w-screen flex justify-center items-center gap-4 pt-10">
                            <MaterialCommunityIcons
                                name="archive-remove-outline"
                                size={120}
                                color={theme == "dark" ? "rgba(255, 255, 255, .2)" : "rgba(0, 0, 0, .2)"}
                            />
                            <TextAnimated
                                dark="rgba(255, 255, 255, .5)"
                                light="rgba(0, 0, 0, .5)"
                                className="font-bold text-lg tracking-wider"
                            >
                                {t("archives_no_archives")}
                            </TextAnimated>
                        </View>
                    )
                }}
                className="w-full"
                contentContainerClassName="w-full flex items-center gap-5 px-3 pt-[200px] pb-[50px]"
            />

            <Animated.View
                style={[
                    {
                        maxWidth: width * .9,
                        zIndex: selectMap.size > 0 ? 10 : -10,
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

                    <PressableAnimated onPress={() => handleUnArchiveTasks()}>
                        <MaterialIcons
                            name="unarchive"
                            size={30}
                            color={theme == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .5)"}
                        />
                    </PressableAnimated>

                    <PressableAnimated onPress={() => handleDeleteTasks(true)}>
                        <FontAwesome6
                            name="trash-alt"
                            size={25}
                            color="red"
                        />
                    </PressableAnimated>
                </View>
            </Animated.View>
        </Container>
    );
}