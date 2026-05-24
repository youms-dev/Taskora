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
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Octicons from "@expo/vector-icons/Octicons";
import clsx from "clsx";
import { BlurView } from "expo-blur";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, Extrapolation, interpolate, runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { api } from "../../lib/axios";

const FlatListAnimated = Animated.createAnimatedComponent(FlatList);
const ScrollPressableAnimated = Animated.createAnimatedComponent(Pressable);

export default function Tasks() {
    const { width, height } = useWindowDimensions();
    const { setToast } = useToast();
    const [value, setValue] = useState<string>("");
    const router = useRouter();
    const { theme } = useTheme();
    const [loading, setLoading] = useState<boolean>(false);
    const [tasks, setTasks] = useState<TaskType[]>([]);
    const [tasksTmp, setTasksTmp] = useState<TaskType[]>([]);
    const limit = 10;
    const [count, setCount] = useState<number>(0);
    const [countTmp, setCountTmp] = useState<number>(0);
    const [tasksPressed, setTasksPressed] = useState<TaskType[]>([]);
    const [allPressed, setAllPressed] = useState<boolean>(false);
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
    const showButton = useSharedValue<boolean>(false);
    const showButtonTimeout = useRef<ReturnType<typeof setTimeout>>(null);

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
        try {
            setLoading(true);
            const stmt = await db!.prepareAsync("SELECT * FROM task ORDER BY updated_at DESC LIMIT $limit OFFSET $offset");
            const execResult = await stmt.executeAsync({
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
                flatListRef.current?.scrollToIndex({
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
            const data: { count: number; } | undefined | null = await db?.getFirstAsync("SELECT COUNT(*) as count FROM task");

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
                const stmt = await db!.prepareAsync("SELECT * FROM task WHERE title LIKE $like OR content LIKE $like ORDER BY updated_at LIMIT $limit OFFSET $offset");
                const countStmt = await db!.prepareAsync("SELECT COUNT(*) as count FROM task WHERE title LIKE $like OR content LIKE $like");
                const exec = await stmt.executeAsync({
                    $like: `%${value}%`,
                    $limit: limit,
                    $offset: pagination ? tasks.length : 0,
                });
                const execCount = await countStmt.executeAsync({
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

    const animation = useAnimatedStyle(() => ({
        bottom: withTiming(tasksPressed.length > 0 ? height - height * 68.5 / 100 : -height * .5, {
            duration: 300,
            easing: Easing.inOut(Easing.quad),
        }),
    }))

    const handleDelete = async (confirm = false) => {
        const datas = tasksPressed;

        if (tasksPressed.length === 0) return;
        const result = tasks.filter(task => ![...datas.map(data => data.idTask)].includes(task.idTask));

        setTasks(result);
        setTasksPressed([]);

        try {
            await api.delete(`/task/delete`, {
                data: {
                    tasks: [...datas.map((task) => task.idTask)]
                }
            });
            setTasksPressed([]);
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
            if (tasksTmp.length > 0 && countTmp > 0) {
                setTasks(tasksTmp);
                setCount(countTmp);
                setTasksPressed([]);
                setTasksTmp([]);
                setCountTmp(0);
                setValue("");
                return true;
            }

            return false;
        });

        if (tasksTmp && value.trim().length > 0) {
            if (tasksPressed.length === tasksTmp.length) {
                setAllPressed(true);
            }
        }
        else {
            if (tasksPressed.length === tasks.length) {
                setAllPressed(true);
            }
            else {
                setAllPressed(false);
            }
        }

        sharedTextInputValue.value = value;

        return () => remove();
    }, [tasksPressed, value, tasksTmp]);

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
        .onUpdate(({ translationY: y }) => {
            if (scrollY.value == 0 && !sharedLoading.value && !scrolling.value && sharedTextInputValue.value.trim().length == 0) {
                translateY.value = y;
            }
        })
        .onEnd(() => {
            if (sharedLoading.value || sharedTextInputValue.value.trim().length > 0) return;
            if (translateY.value >= 90) {
                translateY.value = 180;
                runOnJS(getTasks)(true);
            }
            else {
                translateY.value = 0;
            }
        })

    const panAnimation = useAnimatedStyle(() => ({
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

    const toggleShowButton = () => {
        showButtonTimeout.current && clearTimeout(showButtonTimeout.current);
        showButton.value = true;
        showButtonTimeout.current = setTimeout(() => {
            showButton.value = false;
        }, 1500);
    }

    const handleScroll = useAnimatedScrollHandler({
        onScroll: (e) => {
            const y = e.contentOffset.y;

            scrollY.value = y;
            if (y > 0) {
                runOnJS(toggleShowButton)();
            }
            else {
                showButton.value = false;
            }
        }
    });

    useEffect(() => {
        sharedLoading.value = loading;
    }, [loading]);

    const scrollButtonAnimation = useAnimatedStyle(() => ({
        opacity: withTiming(showButton.value ? 1 : 0, {
            duration: 300,
            easing: Easing.inOut(Easing.quad),
        }),
        pointerEvents: showButton.value ? "auto" : "none",
    }));

    return (
        <Container centerX>
            <PageTitle
                title="Liste des tâches"
                icon={(
                    <FontAwesome6
                        name="list-check"
                        size={20}
                        color={COLORS.emerald[500]}
                    />
                )}
            />
            <View className="relative w-full flex flex-col items-center">
                <KeyboardAvoidingView
                    behavior={Platform.OS === "android" ? "height" : "padding"}
                    className={clsx(
                        "w-full flex justify-center items-center my-5 px-2",
                        !loading && tasks.length == 0 && tasksTmp.length == 0 && value.trim().length == 0 && "opacity-50",
                    )}>
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
                    <PressableAnimated
                        onPress={() => {
                            handleSearch(value);
                            textInputRef.current?.blur();
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

                <View className="w-full flex flex-row items-center gap-5 px-5 mb-5">
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
                                    className="w-[100px] h-12 flex flex-row justify-center items-center dark:bg-white/20 bg-white/80 p-3 rounded-xl border dark:border-white/20 border-black/20"
                                >
                                    <TextAnimated className="text-lg">
                                        {t("tasks_filter_all")}
                                    </TextAnimated>
                                </PressableAnimated>

                                <PressableAnimated
                                    scale={.95}
                                    onPress={() => handleFilter(true)}
                                    className="w-[100px] h-12 flex flex-row justify-center items-center dark:bg-white/20 bg-white/80 p-3 rounded-xl border dark:border-white/20 border-black/20"
                                >
                                    <TextAnimated className="text-lg">
                                        {t("tasks_filter_done")}
                                    </TextAnimated>
                                </PressableAnimated>

                                <PressableAnimated
                                    scale={.95}
                                    onPress={() => handleFilter(false)}
                                    className="w-[100px] h-12 flex flex-row justify-center items-center dark:bg-white/20 bg-white/80 p-3 rounded-xl border dark:border-white/20 border-black/20"
                                >
                                    <TextAnimated className="text-lg">
                                        {t("tasks_filter_not_done")}
                                    </TextAnimated>
                                </PressableAnimated>
                            </ScrollView>
                        )
                    }
                </View>

                <Animated.View
                    onLayout={(e) => setLeft((width / 2) - (e.nativeEvent.layout.width / 2))}
                    style={[
                        panAnimation,
                        {
                            left,
                        }
                    ]}
                    className="absolute z-[100] rounded-full overflow-hidden pointer-events-none"
                >
                    <BlurView
                        intensity={100}
                        experimentalBlurMethod="dimezisBlurView"
                        tint={theme == "dark" ? "systemChromeMaterialDark" : "systemChromeMaterialLight"}
                        className="size-full flex justify-center items-center rounded-full"
                    >
                        <View className="size-full flex justify-center items-center dark:bg-white/20 bg-black/10 p-4">
                            <Octicons
                                name="tasklist"
                                size={25}
                                color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                            />
                        </View>
                    </BlurView>

                    <Animated.View
                        style={showRefreshAnimation}
                        className="absolute size-full z-[1] rounded-full overflow-hidden"
                    >
                        <BlurView
                            intensity={100}
                            experimentalBlurMethod="dimezisBlurView"
                            tint={theme == "dark" ? "systemChromeMaterialDark" : "systemChromeMaterialLight"}
                            className="size-full flex justify-center items-center"
                        >
                            <View className="size-full dark:bg-white/20 bg-black/20" />
                        </BlurView>
                    </Animated.View>
                </Animated.View>

                <GestureDetector gesture={pan}>
                    <View
                        onLayout={(e) => setFlatListContainerWidth(e.nativeEvent.layout.width)}
                        className="w-full"
                    >
                        <GestureDetector gesture={otherElement}>
                            <FlatListAnimated
                                ref={flatListRef}
                                horizontal={false}
                                onScroll={handleScroll}
                                onMomentumScrollBegin={() => scrolling.value = true}
                                onMomentumScrollEnd={() => scrolling.value = false}
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
                                    <Task
                                        key={(task as TaskType).idTask}
                                        task={task as TaskType}
                                        selected={tasksPressed.find((t) => (task as TaskType).idTask == t.idTask) != null}
                                        selectedNumber={tasksPressed.indexOf((task as TaskType)) !== -1 ? tasksPressed.indexOf((task as TaskType)) + 1 : undefined}
                                        longPress={() => {
                                            const element = tasksPressed.indexOf((task as TaskType));

                                            if (element !== -1) {
                                                setTasksPressed(tasksPressed.filter((item) => item.idTask !== (task as TaskType).idTask));
                                            }
                                            else {
                                                setTasksPressed([...tasksPressed, (task as TaskType)])
                                            }
                                        }}
                                    />
                                )}
                                ListEmptyComponent={() => {
                                    if (!loading) {
                                        return (
                                            <View className="w-full flex justify-center items-center gap-4 pt-20">
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
                                className="w-full"
                                contentContainerStyle={{
                                    paddingBottom: 500,
                                }}
                                contentContainerClassName="w-full flex flex-col items-center gap-5 pb-[400px] px-3"
                            />
                        </GestureDetector>
                    </View>
                </GestureDetector>

                <ScrollPressableAnimated
                    onPress={() => flatListRef.current?.scrollToIndex({
                        index: 0,
                        animated: true,
                    })}
                    style={[
                        {
                            bottom: 0,
                            transform: [
                                {
                                    translateY: -290,
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
                </ScrollPressableAnimated>

                <Animated.View
                    style={[{
                        width: 90,
                        zIndex: tasksPressed.length > 0 ? 10 : -10,
                    }, animation]}
                    className="absolute right-22 w-auto flex flex-row items-center gap-5"
                >
                    <View className="flex flex-row items-center gap-3">
                        <View className="flex flex-row items-start gap-3">
                            <Text className="text-lg dark:text-white text-black font-bold">Sélectionnés</Text>
                            <Text className="text-lg dark:text-white text-black font-bold">
                                ({tasksPressed.length})
                            </Text>
                        </View>
                        <PressableAnimated
                            onPress={() => {
                                if (value.trim().length > 0 && tasksTmp) {
                                    if (tasksTmp.length === tasksPressed.length) {
                                        setTasksPressed([]);
                                    }
                                    else {
                                        setTasksPressed(tasksTmp);
                                    }
                                }
                                else {
                                    if (tasks.length === tasksPressed.length) {
                                        setTasksPressed([]);
                                    }
                                    else {
                                        setTasksPressed(tasks);
                                    }
                                }
                            }}
                            className="size-[40px] flex justify-center items-center border-2 dark:border-white/20 border-black/20 rounded-xl"
                        >
                            {
                                allPressed && (
                                    <FontAwesome5 name="check" size={25} color={COLORS.emerald[500]} />
                                )
                            }
                        </PressableAnimated>
                    </View>
                    <PressableAnimated
                        onPress={() => handleDelete()}
                    >
                        <FontAwesome6 name="trash-alt" size={30} color="red" />
                    </PressableAnimated>
                </Animated.View>
            </View >

            <PressableAnimated
                onPress={() => { }}
                className="absolute right-[10px] bottom-[120px] size-[50px] flex justify-center items-center rounded-full border-2 dark:border-white/20 border-black/20 dark:bg-black/60 bg-white/60"
            >
                <FontAwesome5 name="plus" size={20} color={COLORS.emerald[500]} />
            </PressableAnimated>
        </Container >
    );
}