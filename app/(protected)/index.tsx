import { Container } from "@/components/container";
import { PageTitle } from "@/components/page-title";
import { PressableAnimated } from "@/components/pressable-animated";
import { Skeleton } from "@/components/skeleton";
import { Task } from "@/components/task";
import { TextAnimated } from "@/components/text-animated";
import { COLORS } from "@/constants/colors";
import { useDatabase } from "@/hooks/use-sqlite";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { SQLiteTaskType, TaskType } from "@/types/task";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Octicons from "@expo/vector-icons/Octicons";
import clsx from "clsx";
import { usePathname, useRouter } from "expo-router";
import { memo, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, PressableProps, ScrollView, Text, TextInput, useWindowDimensions, Vibration, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, Extrapolation, interpolate, runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { api } from "../../lib/axios";
import { Checkbox } from "@/components/checkbox";

const FlatListAnimated = Animated.createAnimatedComponent(FlatList);
const PressableToScrollAnimated = Animated.createAnimatedComponent(Pressable);

interface Props extends PressableProps {
    task: TaskType;
    onRefresh: () => void;
    loading: boolean;
    selectedIndex?: number;
    onLongPress?: () => void;
    selection?: boolean;
}
const TaskCard = memo(({ task, onRefresh, loading: parentLoading = false, selectedIndex: index = 0, onLongPress, selection: selecting = false, ...rest }: Props) => {
    const translateX = useSharedValue<number>(0);
    const [height, setHeight] = useState<number>(0);
    const { db } = useDatabase();
    const loading = useSharedValue<boolean>(false);
    const { setToast, setDismiss } = useToast();
    const selected = useSharedValue<boolean>(false);
    const heightShared = useSharedValue<number>(0);
    const selection = useSharedValue<boolean>(false);

    const swipeAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: translateX.value,
            },
        ]
    }));

    const handleDelete = () => {
        if (loading.value) return;
        setDismiss(5, deleteTask);
    }

    const deleteTask = async () => {
        if (loading.value) return;
        try {
            loading.value = true;
            await db!.runAsync(`DELETE FROM task WHERE id_task = ${task.idTask}`);
            onRefresh();
            loading.value = false;
        }
        catch (e) {
            console.log(e);
            loading.value = false;
        }
    }

    const handleArchive = async () => {
        if (loading.value) return;
        try {
            loading.value = true;
            await db!.runAsync(`UPDATE task SET archived = ${1} WHERE id_task = ${task.idTask}`);
            setToast("Archivé");
            onRefresh();
            loading.value = false;
        }
        catch (e) {
            console.log(e);
            loading.value = false;
        }
    }

    const handleLongPress = () => {
        onLongPress && onLongPress();
        Vibration.vibrate(100);
    }

    const pan = Gesture.Race(
        Gesture.LongPress()
            .minDuration(150)
            .onStart(() => {
                runOnJS(handleLongPress)();
            }),
        Gesture.Pan()
            .activeOffsetX([-5, 5])
            .failOffsetY([-10, 10])
            .onUpdate(({ translationX: x }) => {
                if (x >= -100 && x <= 100 && !loading.value && !selected.value && !selection.value) translateX.value = x;
            })
            .onEnd(({ translationX: x }) => {
                if (selected.value || selection.value) return;
                if (x <= -100) {
                    runOnJS(handleArchive)();
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
    );

    const opacityAnimation = useAnimatedStyle(() => ({
        opacity: interpolate(
            translateX.value,
            [-95, 0, 95],
            [1, 0, 1],
            Extrapolation.CLAMP,
        ),
    }));

    useEffect(() => {
        loading.value = parentLoading;
        selected.value = index > 0;
        heightShared.value = height;
        selection.value = selecting;
    }, [parentLoading, index, height, selecting]);

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
                translateY: !selected.value ? heightShared.value : withDelay(
                    100,
                    withSequence(
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
                )
            }
        ]
    }));

    return (
        <GestureDetector gesture={pan}>
            <Pressable
                {...rest}
                onPress={() => console.log("Pressed")}
                style={{
                    width: "100%",
                    height,
                }}
                className="flex flex-row justify-center rounded-2xl p-2"
            >
                <Animated.View
                    style={opacityAnimation}
                    className="w-1/2 h-full flex justify-center bg-red-500 rounded-l-2xl pl-10"
                >
                    <FontAwesome6
                        name="trash-alt"
                        size={30}
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
                            size={40}
                            color="rgba(255, 255, 255, .8)"
                        />
                    </View>
                </Animated.View>

                <Animated.View
                    onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
                    style={swipeAnimation}
                    className="absolute w-[105%] z-10"
                >
                    <Task task={task as TaskType} />
                </Animated.View>

                <Animated.View
                    style={[
                        {
                            height,
                        },
                        selectAnimation,
                    ]}
                    className="absolute w-[105%] h-full flex justify-center items-center z-[20] dark:bg-black/70 bg-white/70 border dark:border-white/20 border-black/20 rounded-2xl"
                >
                    {
                        index > 0 && (
                            <TextAnimated
                                style={textAnimation}
                                className="text-5xl"
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
    const { db } = useDatabase();
    const [sync, setSync] = useState<boolean>(false);
    const otherElement = Gesture.Native();
    const scrollY = useSharedValue<number>(0);
    const translateY = useSharedValue<number>(0);
    const [left, setLeft] = useState<number>(0);
    const sharedLoading = useSharedValue<boolean>(false);
    const flatListRef = useRef<FlatList>(null);
    const [syncLoading, setSyncLoading] = useState<boolean>(false);
    const [flatListContainerWidth, setFlatListContainerWidth] = useState<number>(0);
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

    const syncData = async (position: number = 0) => {
        if (pathname != "/" || syncLoading) return;
        try {
            setSyncLoading(true);
            const { data }: { data: TaskType[] } = await api.post(`/task/list?skip=${position}`);

            if (data.length > 0) {
                await db?.runAsync(`
                    INSERT INTO task(id_task, title, content, done) 
                    VALUES
                    ${(() => {
                        return data.map((item, i) => {
                            const val = `("${item.idTask}", ${item.title ? `${item.title}` : null}, "${item.content}", ${Number(item.done)})${i < data.length - 1 ? "," : ""}`;

                            return val;
                        }).join("");
                    })()}
                    ON CONFLICT(id_task)
                    DO NOTHING;
                `);
            }
            setSync(true);
            setSyncLoading(false);
            console.log("sync");
        }
        catch (e) {
            setSyncLoading(false);
            setSync(false);
            console.log(e);
        }
    }

    const getTasks = async (refresh: boolean = false) => {
        if (pathname != "/" || loading) return;
        setTasksSelected([]);
        setCountTmp(0);
        setTasksTmp([]);
        setValue("");
        try {
            setLoading(true);
            const stmt = await db!.prepareAsync("SELECT * FROM task WHERE archived = $archived ORDER BY updated_at DESC LIMIT $limit OFFSET $offset");
            const execResult = await stmt.executeAsync({
                $archived: 0,
                $limit: limit,
                $offset: refresh ? 0 : tasks.length,
            });
            const data = await execResult.getAllAsync() as SQLiteTaskType[];
            const dataParsed: TaskType[] = data.length > 0 ? data.map((item) => {
                const { id_task, created_at, updated_at, ...rest } = item;

                return ({
                    ...rest,
                    idTask: id_task,
                    createdAt: created_at,
                    updatedAt: updated_at,
                });
            }) : [];

            if (refresh) {
                setTasks(dataParsed);
                tasks.length > 0 && flatListRef.current?.scrollToIndex({
                    index: 0,
                    animated: false,
                });
            }
            else setTasks([...tasks, ...dataParsed.filter(item => ![...tasks.map(e => e.idTask)].includes(item.idTask))]);

            translateY.value = 0;
            setLoading(false);
            if (!sync) syncData(data?.length);
        }
        catch (e) {
            setLoading(false);
            sharedLoading.value = false;
            translateY.value = 0;
            setToast("Aucune connexion internet", "error");
            console.log(e);
        }
    }

    const getCount = async () => {
        if (pathname != "/") return;
        try {
            const data: { count: number; } | undefined | null = await db?.getFirstAsync(`SELECT COUNT(*) as count FROM task WHERE archived = ${0}`);

            data?.count && setCount(data.count);
        }
        catch (e) {
            setToast("Aucune connexion internet", "error");
            console.log(e);
        }
    }

    useEffect(() => {
        // getCount();
        // getTasks();
    }, []);

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

    const handleSearch = async (value: string, pagination: boolean = false) => {
        timeout.current && clearTimeout(timeout.current);
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
                const stmt = await db!.prepareAsync("SELECT * FROM task WHERE title LIKE $like OR content LIKE $like AND archived = $archived ORDER BY updated_at LIMIT $limit OFFSET $offset");
                const countStmt = await db!.prepareAsync("SELECT COUNT(*) as count FROM task WHERE title LIKE $like OR content LIKE $like AND archived = $archived");
                const exec = await stmt.executeAsync({
                    $archived: 0,
                    $like: `%${value}%`,
                    $limit: limit,
                    $offset: pagination ? tasks.length : 0,
                });
                const execCount = await countStmt.executeAsync({
                    $archived: 0,
                    $like: `%${value}%`,
                });
                const data = await exec.getAllAsync() as SQLiteTaskType[];
                const { count } = await execCount.getFirstAsync() as { count: number };

                const dataParsed = data.length > 0 ? data.map(item => {
                    const { id_task, created_at, updated_at, ...rest } = item;

                    return ({
                        ...rest,
                        idTask: id_task,
                        createdAt: created_at,
                        updatedAt: updated_at,
                    } as TaskType);
                }) : [];

                setCount(count);
                if (pagination) {
                    setTasks([...tasks, ...dataParsed.filter((task) => ![...tasks.map(t => t.idTask)].includes(task.idTask))]);
                }
                else {
                    setTasks(dataParsed);
                }
            }
            catch (e) {
                tasksTmp.length > 0 && setTasks(tasksTmp);
                countTmp > 0 && setCount(countTmp);
                console.log(e);
            }
        }, 100);
    }

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

    const handleDelete = async (confirm = false) => {
        const datas = tasksSelected;

        if (tasksSelected.length === 0) return;
        const result = tasks.filter(task => ![...datas.map(data => data.idTask)].includes(task.idTask));

        setTasks(result);
        setTasksSelected([]);

        try {
            await api.delete(`/task/delete`, {
                data: {
                    tasks: [...datas.map((task) => task.idTask)]
                }
            });
            setTasksSelected([]);
            setToast("Tâche(s) supprimée(s)", "success");
            setTimeout(() => {
                router.replace("/");
            }, 500);
        }
        catch (e) {
            setToast("Aucune connexion internet", "error");
            setTasks([...datas, ...tasks]);
        }
    };

    useEffect(() => {
        const { remove } = BackHandler.addEventListener("hardwareBackPress", () => {
            if ((tasksTmp.length > 0 && countTmp > 0) || tasksSelected.length > 0) {
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

        return () => remove();
    }, [tasksSelected, value, tasksTmp]);

    useEffect(() => {
        const { remove } = Keyboard.addListener("keyboardDidHide", () => {
            if (!textInputRef.current) return;
            textInputRef.current.blur();
        });

        return () => remove();
    }, []);

    const pan = Gesture.Pan()
        .simultaneousWithExternalGesture(otherElement)
        .activeOffsetY(50)
        .failOffsetX([-10, 10])
        .onUpdate(({ translationY: y }) => {
            if (scrollY.value == 0 && !sharedLoading.value && !scrolling.value && sharedTextInputValue.value.trim().length == 0) {
                translateY.value = y;
            }
        })
        .onEnd(() => {
            if (sharedLoading.value || sharedTextInputValue.value.trim().length > 0) return;
            if (translateY.value >= 90) {
                translateY.value = 180;
                // runOnJS(getTasks)(true);
                translateY.value = 0;
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
                    [90, 180],
                    Extrapolation.CLAMP,
                ),
            }
        ],
        opacity: sharedLoading.value && translateY.value >= 90 ? withRepeat(
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
                    [70, 100],
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
        sharedLoading.value = loading;
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

    const headerAnimation = useAnimatedStyle(() => ({
        opacity: interpolate(
            scrollY.value,
            [0, scrollCheckPoint * .6],
            [1, 0],
            Extrapolation.CLAMP,
        ),
        width: scrollY.value >= scrollCheckPoint * .6 ? "95%" : "100%",
    }));

    const firstSectionAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: interpolate(
                    scrollY.value,
                    [0, scrollCheckPoint],
                    [55, -70],
                    Extrapolation.CLAMP,
                )
            }
        ],
    }));

    const flatListAnimation = useAnimatedStyle(() => ({
        paddingTop: interpolate(
            scrollY.value,
            [0, scrollCheckPoint],
            [hasFolders.value ? 230 : 190, 0],
            Extrapolation.CLAMP,
        )
    }));

    const textInputAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: interpolate(
                    scrollY.value,
                    [0, scrollCheckPoint * .8],
                    [0, width],
                    Extrapolation.CLAMP,
                )
            }
        ]
    }));

    const filterContainerAnimation = useAnimatedStyle(() => ({
        width: withTiming(scrollY.value >= (scrollCheckPoint * .8) ? (width - width * .05) : width, {
            duration: 200,
            easing: Easing.inOut(Easing.quad),
        }),
        transform: [
            {
                translateY: interpolate(
                    scrollY.value,
                    [0, scrollCheckPoint],
                    [0, 5],
                    Extrapolation.CLAMP,
                )
            }
        ],
    }));

    const subContainerAnimation = useAnimatedStyle(() => ({
        borderWidth: 1,
        borderColor: scrollY.value >= (scrollCheckPoint * .8) ?
            themeShared.value == "dark" ? "rgba(255, 255, 255, .2)" : "rgba(0, 0, 0, .2)"
            :
            themeShared.value == "dark" ? "rgba(0, 0, 0, 1)" : "rgba(255, 255, 255, 0)",
        borderRadius: scrollY.value >= (scrollCheckPoint * .8) ? 20 : 0,
    }));

    const foldersAnimation = useAnimatedStyle(() => ({
        backgroundColor: scrollY.value >= (scrollCheckPoint * .8) ?
            (themeShared.value == "dark" ? "rgba(255, 255, 255, .15)" : "rgba(0, 0, 0, .10)")
            :
            (themeShared.value == "dark" ? "rgba(0, 0, 0, 1)" : "rgba(255, 255, 255, 0)"),
        paddingHorizontal: scrollY.value >= (scrollCheckPoint * .8) ? 5 : 20,
    }));

    const filterAnimation = useAnimatedStyle(() => ({
        backgroundColor: scrollY.value >= (scrollCheckPoint * .8) ?
            (themeShared.value == "dark" ? "rgba(255, 255, 255, .15)" : "rgba(0, 0, 0, .10)")
            :
            (themeShared.value == "dark" ? "rgba(0, 0, 0, 1)" : "rgba(255, 255, 255, 0)"),
    }));

    useEffect(() => {
        themeShared.value = theme;
    }, [theme]);

    return (
        <Container centerX>
            <Animated.View
                style={headerAnimation}
                className="absolute"
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
                style={firstSectionAnimation}
                className="absolute w-full flex items-center z-[10]"
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "android" ? "height" : "padding"}
                    className={clsx(
                        "w-full flex justify-center items-center mb-3 px-2",
                        !loading && tasks.length == 0 && tasksTmp.length == 0 && value.trim().length == 0 && "opacity-50",
                    )}>
                    <Animated.View
                        style={textInputAnimation}
                        className="w-full flex items-center"
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
                            editable={!loading && (tasks.length > 0 || tasksTmp.length > 0)}
                            className="w-full h-16 text-xl dark:text-white/90 text-black dark:bg-white/10 bg-white/85 rounded-2xl pl-3 pr-12 border-b dark:border-white/20 border-black/20"
                        />
                    </Animated.View>
                    <PressableAnimated
                        // onPress={() => {
                        //     handleSearch(value);
                        //     textInputRef.current?.blur();
                        // }}
                        onPress={() => {
                            if (tasks.length > 0) {
                                setTasks([]);
                                setTasksTmp([]);
                                setCount(0);
                                setCountTmp(0);
                            }
                            else getTasks();
                        }}
                        className="absolute top-4 right-5 z-1 active:text-emerald-500 active:scale-[.8]"
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

                <Animated.View
                    style={[filterContainerAnimation]}
                    className="flex items-center gap-1 overflow-hidden"
                >
                    {
                        // folders.length > 0 && (
                        (
                            <Animated.View
                                style={subContainerAnimation}
                                className="w-full dark:bg-black bg-white overflow-hidden"
                            >
                                <Animated.View
                                    style={foldersAnimation}
                                    className="w-full flex flex-row items-center gap-5 py-1"
                                >
                                    {
                                        loading && (
                                            <View className="w-[70%] sm:w-[300px] h-[40px] flex flex-row items-center rounded-3xl overflow-hidden">
                                                <Skeleton />
                                            </View>
                                        )
                                    }
                                    {
                                        !loading && (
                                            <ScrollView
                                                horizontal
                                                showsHorizontalScrollIndicator={false}
                                                className="w-full"
                                                contentContainerClassName="flex flex-row items-center gap-[10px]"
                                            >
                                                {
                                                    Array(5).fill(0).map((_, i) => (
                                                        <PressableAnimated
                                                            key={i}
                                                            scale={.95}
                                                            onPress={() => handleFilter(null)}
                                                            className="w-[100px] flex flex-row justify-center items-center dark:bg-white/20 bg-white/80 py-1 px-3 rounded-xl border dark:border-white/20 border-black/20"
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
                        style={subContainerAnimation}
                        className="w-full dark:bg-black bg-white overflow-hidden"
                    >
                        <Animated.View
                            style={filterAnimation}
                            className="w-full flex flex-row items-center gap-5 px-5 py-1"
                        >
                            <View className="flex flex-row items-center gap-1 shrink-0">
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
                                loading && (
                                    <View className="w-[70%] sm:w-[300px] h-[40px] flex flex-row items-center rounded-3xl overflow-hidden">
                                        <Skeleton />
                                    </View>
                                )
                            }
                            {
                                !loading && (
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        className="w-full"
                                        contentContainerClassName="flex flex-row items-center gap-[10px]"
                                    >
                                        <PressableAnimated
                                            scale={.95}
                                            onPress={() => handleFilter(null)}
                                            className="w-[100px] flex flex-row justify-center items-center dark:bg-white/20 bg-white/80 px-3 py-2 rounded-xl border dark:border-white/20 border-black/20"
                                        >
                                            <TextAnimated className="text-lg">
                                                {t("tasks_filter_all")}
                                            </TextAnimated>
                                        </PressableAnimated>

                                        <PressableAnimated
                                            scale={.95}
                                            onPress={() => handleFilter(true)}
                                            className="w-[100px] flex flex-row justify-center items-center dark:bg-white/20 bg-white/80 px-3 py-2 rounded-xl border dark:border-white/20 border-black/20"
                                        >
                                            <TextAnimated className="text-lg">
                                                {t("tasks_filter_done")}
                                            </TextAnimated>
                                        </PressableAnimated>

                                        <PressableAnimated
                                            scale={.95}
                                            onPress={() => handleFilter(false)}
                                            className="w-[100px] flex flex-row justify-center items-center dark:bg-white/20 bg-white/80 px-3 py-2 rounded-xl border dark:border-white/20 border-black/20"
                                        >
                                            <TextAnimated className="text-lg">
                                                {t("tasks_filter_not_done")}
                                            </TextAnimated>
                                        </PressableAnimated>
                                    </ScrollView>
                                )
                            }
                        </Animated.View>
                    </Animated.View>
                </Animated.View>

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

            <GestureDetector gesture={pan}>
                <ScrollView
                    horizontal
                    className="w-full"
                    contentContainerClassName="w-full"
                >
                    <Animated.View
                        onLayout={(e) => setFlatListContainerWidth(e.nativeEvent.layout.width)}
                        className="w-full flex items-center"
                    >
                        <GestureDetector gesture={otherElement}>
                            <FlatListAnimated
                                ref={flatListRef}
                                nestedScrollEnabled
                                horizontal={false}
                                initialNumToRender={5}
                                showsVerticalScrollIndicator={false}
                                onScroll={handleScroll}
                                onMomentumScrollBegin={() => scrolling.value = true}
                                onMomentumScrollEnd={() => {
                                    scrolling.value = false
                                    if (scrollY.value >= scrollCheckPoint / 2) scrollY.value = withTiming(scrollCheckPoint, {
                                        duration: 200,
                                        easing: Easing.inOut(Easing.quad),
                                    });
                                    else scrollY.value = withTiming(0, {
                                        duration: 200,
                                        easing: Easing.inOut(Easing.quad),
                                    });
                                }}
                                onEndReached={() => value.trim().length == 0 ?
                                    tasks.length < count ? getTasks() : undefined
                                    :
                                    tasks.length < count ? handleSearch(value, true) : undefined
                                }
                                onEndReachedThreshold={.95}
                                scrollEventThrottle={16}
                                data={tasks}
                                keyExtractor={(item) => String((item as TaskType).idTask)}
                                renderItem={({ item: task }) => (
                                    <TaskCard
                                        loading={loading}
                                        task={task as TaskType}
                                        selection={tasksSelected.length > 0}
                                        selectedIndex={(() => {
                                            const child = task as TaskType;
                                            const pos = tasksSelected.findIndex(t => t.idTask == child.idTask);

                                            if (pos != -1) return pos + 1;
                                            return 0;
                                        })()}
                                        onRefresh={() => getTasks(true)}
                                        onLongPress={() => {
                                            const child = task as TaskType;

                                            const pos = tasksSelected.findIndex(t => t.idTask == child.idTask);

                                            if (pos == -1) setTasksSelected([...tasksSelected, task as TaskType]);
                                            else setTasksSelected(tasksSelected.filter(t => t.idTask != child.idTask));
                                        }}
                                    />
                                )}
                                ListEmptyComponent={() => {
                                    if (!loading) {
                                        return (
                                            <View className="w-full flex justify-center items-center gap-4 pt-10">
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
                                    <View className="w-full flex gap-6 px-3 overflow-hidden pt-5">
                                        {
                                            Array(3).fill(0).map((_, i) => (
                                                <View
                                                    key={i}
                                                    style={{
                                                        width: (() => {
                                                            const w = flatListContainerWidth - 30;
                                                            return w - i * 100;
                                                        })(),
                                                        height: (() => {
                                                            const h = 60;
                                                            const hf = h - (15 * i);

                                                            return hf > 0 ? hf : 10;
                                                        })(),
                                                    }}
                                                    className="rounded-2xl overflow-hidden"
                                                >
                                                    <Skeleton />
                                                </View>
                                            ))
                                        }
                                    </View>
                                ) : null}
                                style={flatListAnimation}
                                className="w-full min-h-full"
                                contentContainerClassName="w-full flex flex-col items-center gap-5 pb-[150px] px-3"
                            />
                        </GestureDetector>

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
                    </Animated.View>
                </ScrollView>
            </GestureDetector>

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

                    <PressableAnimated>
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
                    onPress={() => { }}
                    className="size-full flex justify-center items-center rounded-full dark:border-none border border-black/10 dark:bg-black/85 bg-white"
                >
                    <FontAwesome5
                        name="plus"
                        size={20}
                        color={COLORS.emerald[500]}
                    />
                </Pressable>
            </Animated.View>
        </Container>
    );
}