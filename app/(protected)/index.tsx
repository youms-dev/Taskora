import { Container } from "@/components/container";
import { PageTitle } from "@/components/page-title";
import { PressableAnimated } from "@/components/pressable-animated";
import { Skeleton } from "@/components/skeleton";
import { Task } from "@/components/task";
import { COLORS } from "@/constants/colors";
import { useDatabase } from "@/hooks/use-sqlite";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { SQLiteTaskType, TaskType } from "@/types/task";
import { checkLength } from "@/utils/tools";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Octicons from "@expo/vector-icons/Octicons";
import { BlurView } from "expo-blur";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import PagerView from "react-native-pager-view";
import Animated, { Easing, Extrapolation, interpolate, runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { api } from "../../lib/axios";
import { TextAnimated } from "@/components/text-animated";
import clsx from "clsx";

const FlatListAnimated = Animated.createAnimatedComponent(FlatList);

export default function Tasks() {
    const pageRef = useRef<PagerView>(null);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
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
    const [tasksPressed, setTasksPressed] = useState<TaskType[]>([]);
    const [allPressed, setAllPressed] = useState<boolean>(false);
    const pathname = usePathname();
    const inputRef = useRef<TextInput>(null);
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

    const handleSubmit = async () => {
        if (value.trim().length == 0) {
            setToast("Veuillez renseigner la description de la tâche !", "warning");
            return;
        }
        else if (!checkLength(value.trim(), [3, null])) {
            setToast("La longueur minimale requise est de 3", "warning");
            return;
        }

        const valueFormatted = value.trim().charAt(0).toUpperCase() + value.trim().slice(1);

        try {
            setLoading(true);
            await api.post("/task/create", {
                content: valueFormatted,
            });
            setToast("Tâche créée 😉", "success");
            setValue("");
            setTimeout(() => {
                router.replace("/");
            }, 500);
            setLoading(false);
        }
        catch (e) {
            const { data } = e as { data: any };

            setLoading(false);
            if (data.message) {
                setToast(data.message, "error");
            }
            else {
                setToast("Une erreur d'est produite", "error");
            }
        }
    }

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
        getCount();
        getTasks();
    }, []);

    const handleFilter = (filter: "all" | "done" | "not done") => {
        if (filter == "all") {
            return setTasksTmp([]);
        }
        else if (filter == "done") {
            const result = tasks.filter((task) => task.done == true);
            if (result.length > 0) {
                return setTasksTmp(result);
            }
            else {
                return setTasksTmp([]);
            }
        }
        else if (filter == "not done") {
            const result = tasks.filter((task) => task.done == false);

            if (result.length > 0) {
                return setTasksTmp(result);
            }
            else {
                return setTasksTmp([]);
            }
        }
    }

    const handleSearch = async (value: string) => {
        timeout.current && clearTimeout(timeout.current);
        if (value.trim().length == 0) {
            setTasks(tasksTmp);
            setTasksTmp([]);
            return;
        }
        timeout.current = setTimeout(async () => {
            const stmt = await db!.prepareAsync("SELECT * FROM task WHERE $title LIKE $like OR content LIKE $like ORDER BY updated_at LIMIT $limit OFFSET $offset");
            const exec = await stmt.executeAsync({
                $title: value,
                $like: value,
                $limit: limit,
                $offset: tasks.length,
            });
            const result = tasks.filter((task) => task.content.toLowerCase().indexOf(value.toLowerCase()) !== -1);

            if (result.length > 0) {
                setTasksTmp(result);
            }
            else {
                setTasksTmp([]);
            }
        }, 200);
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

        const { remove } = BackHandler.addEventListener("hardwareBackPress", () => {
            if (tasksPressed.length > 0) {
                setTasksPressed([]);
                return true;
            }
            return false;
        });

        return () => remove();
    }, [tasksPressed]);

    useEffect(() => {
        const { remove } = Keyboard.addListener("keyboardDidHide", () => {
            if (!inputRef.current) return;
            inputRef.current.blur();
        });

        return () => remove();
    }, []);

    const pan = Gesture.Pan()
        .simultaneousWithExternalGesture(otherElement)
        .activeOffsetY(50)
        .onUpdate(({ translationY: y }) => {
            if (scrollY.value == 0 && !sharedLoading.value && !scrolling.value) {
                translateY.value = y;
            }
        })
        .onEnd(() => {
            if (sharedLoading.value) return;
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

    const handleScroll = useAnimatedScrollHandler({
        onScroll: (e) => {
            scrollY.value = e.contentOffset.y;
        }
    });

    useEffect(() => {
        sharedLoading.value = loading;
    }, [loading]);

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
                    className="w-full flex justify-center items-center my-5 px-2">
                    <TextInput
                        ref={inputRef}
                        placeholder={t("tasks_search")}
                        cursorColor={theme === "dark" ? "white" : COLORS.emerald[500]}
                        placeholderTextColor={theme === "dark" ? "rgba(255, 255, 255, .3)" : "rgba(0, 0, 0, .2)"}
                        value={value}
                        onChange={(e) => handleSearch(e.nativeEvent.text)}
                        onChangeText={(e) => handleSearch(e)}
                        onSubmitEditing={(e) => handleSearch(e.nativeEvent.text)}
                        editable={!loading && tasks.length > 0}
                        className={clsx(
                            "w-full h-16 text-xl dark:text-white/90 text-black dark:bg-white/10 bg-white/85 rounded-2xl pl-3 pr-12 border-b dark:border-white/20 border-black/20",
                            !loading && tasks.length == 0 && tasksTmp.length == 0 && "opacity-60",
                        )}
                    />
                    <Pressable
                        onPress={() => getTasks()}
                        className="absolute top-4 right-5 z-1 active:text-emerald-500 active:scale-[.8]"
                    >
                        <FontAwesome5
                            name="search"
                            size={24}
                            color={theme == "dark" ? "white" : "black"}
                        />
                    </Pressable>
                    {
                        tasksTmp && tasksTmp.length > 0 && (
                            <Text className="absolute left-3 -top-6 text-lg text-emerald-500 font-extrabold tracking-widest">
                                ({tasksTmp.length})
                            </Text>
                        )
                    }
                    {
                        !tasksTmp && (
                            <Text className="absolute left-3 -top-6 text-lg dark:text-white/60 text-black/60 font-extrabold tracking-widest">Aucun élément</Text>
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
                                    scale={.8}
                                    onPress={() => handleFilter("all")}
                                    className="w-[100px] h-12 flex flex-row justify-center items-center dark:bg-white/20 bg-white/80 p-3 rounded-xl border dark:border-white/20 border-black/20"
                                >
                                    <TextAnimated className="text-lg">
                                        {t("tasks_filter_all")}
                                    </TextAnimated>
                                </PressableAnimated>

                                <PressableAnimated
                                    scale={.8}
                                    onPress={() => handleFilter("done")}
                                    className="w-[100px] h-12 flex flex-row justify-center items-center dark:bg-white/20 bg-white/80 p-3 rounded-xl border dark:border-white/20 border-black/20"
                                >
                                    <TextAnimated className="text-lg">
                                        {t("tasks_filter_done")}
                                    </TextAnimated>
                                </PressableAnimated>

                                <PressableAnimated
                                    scale={.8}
                                    onPress={() => handleFilter("not done")}
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
                                onEndReached={() => value.trim().length == 0 && tasks.length < count && getTasks()}
                                onEndReachedThreshold={.95}
                                scrollEventThrottle={16}
                                // data={tasks.length > 0 && tasksTmp && tasksTmp.length == 0 ? tasks : tasksTmp}
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
                                                    {t("tasks_no_tasks")}
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
                onPress={() => setModalVisible(true)}
                className="absolute right-[10px] bottom-[120px] size-[50px] flex justify-center items-center rounded-full border-2 dark:border-white/20 border-black/20 dark:bg-black/60 bg-white/60"
            >
                <FontAwesome5 name="plus" size={20} color={COLORS.emerald[500]} />
            </PressableAnimated>
        </Container >
    );
}