import { Checkbox } from "@/components/checkbox";
import { Container } from "@/components/container";
import { PressableAnimated } from "@/components/pressable-animated";
import { TasksHeader } from "@/components/tasks/header";
import { Pager } from "@/components/tasks/pager";
import { Search } from "@/components/tasks/search";
import { TextAnimated } from "@/components/text-animated";
import { COLORS } from "@/constants/colors";
import { useFolders } from "@/hooks/database/use-folders";
import { useTasks } from "@/hooks/database/use-tasks";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { FolderType } from "@/types/folder";
import { TaskType } from "@/types/task";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import { Component, JSX, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, FlatList, FlatListProps, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { AnimatedProps, Easing, runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";

const FlatListAnimated = Animated.createAnimatedComponent(FlatList);

const PressableToScrollAnimated = Animated.createAnimatedComponent(Pressable);

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
    const refreshTranslateY = useSharedValue<number>(0);

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
                refreshTranslateY.value = withTiming(0, {
                    duration: 200,
                    easing: Easing.inOut(Easing.quad),
                });
                quietProcessing.value = false;
                loadingRef.current = false;
                setLoading(false);
                setProcessing(false);
            }
            catch (e) {
                refreshTranslateY.value = withTiming(0, {
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
            <TasksHeader
                scrollY={scrollYShared}
                folders={folders}
                currentFolder={currentFolder}
                tasks={tasks}
                loading={loading}
                currentFilter={currentFilter}
                refreshTranslateY={refreshTranslateY}
            />

            {/* {
                filterLoading && (
                    <View className="absolute left-0 top-0 w-screen h-screen flex justify-center items-center dark:bg-black/50 bg-black/20 z-[200]">
                        <ActivityIndicator
                            size={30}
                            color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                        />
                    </View>
                )
            } */}

            <Pager
                scrollY={scrollYShared}
                folders={folders}
                tasks={tasks}
                currentFolder={currentFolder}
                currentFilter={currentFilter}
                loading={loading}
                refreshTranslateY={refreshTranslateY}
                onEndReached={() => { }}
            />

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