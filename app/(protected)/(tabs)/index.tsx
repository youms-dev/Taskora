import { Checkbox } from "@/components/checkbox";
import { Container } from "@/components/container";
import { PressableAnimated } from "@/components/pressable-animated";
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, BackHandler, FlatList, Pressable, useWindowDimensions, View } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import Animated, { Easing, Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated";

const PressableToScrollAnimated = Animated.createAnimatedComponent(Pressable);

export default function Tasks() {
    const { width, height } = useWindowDimensions();
    const { setToast, setDismiss } = useToast();
    const [value, setValue] = useState<string>("");
    const router = useRouter();
    const { theme, themeShared } = useTheme();
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
    const syncLoading = useRef<boolean>(false);
    const synced = useRef<boolean>(false);
    const { t } = useTranslation();
    const showScrollButton = useSharedValue<boolean>(false);
    const showButtonTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    const tasksSelectedShared = useSharedValue<boolean>(false);
    const scrollCheckPoint = 100;
    const showAddTaskButton = useSharedValue<boolean>(true);
    const [folders, setFolders] = useState<FolderType[]>([]);
    const selectLimit = 50;
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

    const selectMap = useMemo(() => new Map(
        tasksSelected.map((t, i) => [t.idTask, i + 1]),
    ), [tasksSelected]);


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
        // handleGetTasks();
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

    useEffect(() => {
        tasksSelectedShared.value = selectMap.size > 0;
    }, [selectMap]);

    useEffect(() => {
        if (pathname == "/") {
            handleGetFolders();
            // handleGetCount();
            // handleGetTasks(tasks.length > 0);
        }
    }, [pathname]);

    const r = (c: any, p: any) => {
        console.log("Previous theme :", p);
        console.log("Current theme :", c);
    }

    return (
        <Container centerX>

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

                    {/* <PressableAnimated onPress={() => handleArchive()}> */}
                    <PressableAnimated onPress={() => { }}>
                        <MaterialIcons
                            name="archive"
                            size={30}
                            color={theme == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .5)"}
                        />
                    </PressableAnimated>

                    {/* <PressableAnimated onPress={() => handleDelete()}> */}
                    <PressableAnimated onPress={() => { }}>
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