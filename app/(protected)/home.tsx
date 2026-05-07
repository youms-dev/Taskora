import { Button } from "@/components/Button";
import { Container } from "@/components/container";
import { Input } from "@/components/input";
import { Message, MessageProps } from "@/components/message";
import { Modal } from "@/components/modal";
import { NavButton } from "@/components/nav-bar";
import { PageTitle } from "@/components/page-title";
import { PressableAnimated } from "@/components/pressable";
import { Skeleton } from "@/components/skeleton";
import { Task } from "@/components/task";
import { ThemeCard } from "@/components/theme-card";
import { Toast, ToastType } from "@/components/toast";
import { Toggle } from "@/components/toggle";
import { colors } from "@/constants/colors";
import { AUTH_STORAGE, CONFIRM_STORAGE, THEME_STORAGE } from "@/constants/names";
import { useAuth } from "@/hooks/auth-provider";
import { useTheme } from "@/hooks/use-theme";
import { Task as TaskType } from "@/types/task";
import { checkLength } from "@/utils/tools";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useAsyncStorage } from "@react-native-async-storage/async-storage";
import clsx from "clsx";
import { hasHardwareAsync, isEnrolledAsync } from "expo-local-authentication";
import { router, usePathname, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Dimensions, FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import PagerView from "react-native-pager-view";
import Animated, { Easing, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { api } from "../../lib/axios";
import { supabase } from "../../lib/supabase";

const List = () => {
    const { height } = Dimensions.get("window");
    const { theme } = useTheme();
    const [loading, setLoading] = useState<boolean>(false);
    const [tasks, setTasks] = useState<TaskType[]>([]);
    const [tasksFilter, setTasksFilter] = useState<TaskType[] | null>([]);
    const [value, setValue] = useState<string>("");
    const perPage = 10;
    const [count, setCount] = useState<number>(0);
    const [tasksPressed, setTasksPressed] = useState<TaskType[]>([]);
    const [allPressed, setAllPressed] = useState<boolean>(false);
    const router = useRouter();
    const [toast, setToast] = useState<{
        show: boolean;
        message: string;
        type: ToastType;
    }>({
        show: false,
        message: "",
        type: "default",
    });
    const pathname = usePathname();
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const inputRef = useRef<TextInput>(null);
    const [message, setMessage] = useState<MessageProps>({
        show: false,
        message: "",
        onCancel: () => { },
        action: () => { },
    });

    const getTasks = async () => {
        try {
            if (loading || tasks.length >= perPage) return;
            setLoading(true);
            const { data } = await api.post(`/task/list?skip=${tasks.length}&take=${perPage}`);

            setTasks([...tasks, ...data]);
            setLoading(false);
        }
        catch (e) {
            setToast({
                message: "Aucune connexion internet",
                show: true,
                type: "error",
            });
            console.log(e);
        }
    }

    const handleRefresh = async () => {
        setTasks([]);
        setTasksPressed([]);
        try {
            setRefreshing(true);
            const { data } = await api.post(`/task/list?skip=0&take=${tasks.length}`);

            setTasks(data);
            setRefreshing(false);
        }
        catch (e) {
            setToast({
                message: "Aucune connexion internet",
                show: true,
                type: "error",
            });
        }
    }

    const getCount = async () => {
        try {
            const { data } = await api.post("/task/count");
            setCount(data);
        }
        catch (e) {
            setToast({
                message: "Aucune connexion internet",
                show: true,
                type: "error",
            });
        }
    }

    useEffect(() => {
        getTasks();
        getCount();
    }, [pathname]);

    const handleFilter = (filter: "all" | "done" | "not done") => {
        if (filter == "all") {
            return setTasksFilter([]);
        }
        else if (filter == "done") {
            const result = tasks.filter((task) => task.done == true);
            if (result.length > 0) {
                return setTasksFilter(result);
            }
            else {
                return setTasksFilter(null);
            }
        }
        else if (filter == "not done") {
            const result = tasks.filter((task) => task.done == false);

            if (result.length > 0) {
                return setTasksFilter(result);
            }
            else {
                return setTasksFilter(null);
            }
        }
    }

    const handleSearch = (value: string) => {
        if (value.trim().length == 0) {
            setTasksFilter([]);
            return;
        }
        const result = tasks.filter((task) => task.content.toLowerCase().indexOf(value.toLowerCase()) !== -1);

        if (result.length > 0) {
            setTasksFilter(result);
        }
        else {
            setTasksFilter(null);
        }
    }

    useEffect(() => {
        handleSearch(value);
    }, [value]);

    const animation = useAnimatedStyle(() => ({
        bottom: withTiming(tasksPressed.length > 0 ? height - height * 68.5 / 100 : -height * .5, {
            duration: 300,
            easing: Easing.inOut(Easing.quad),
        }),
    }))

    const handleDelete = async (confirm = false) => {
        const { getItem } = useAsyncStorage(CONFIRM_STORAGE);
        const exists = await getItem();
        const datas = tasksPressed;

        if (tasksPressed.length === 0) return;
        if (!confirm && exists != null) {
            setMessage({
                show: true,
                message: `Êtes-vous sûr de vouloir effectuer cette suppression ?`,
                action: () => handleDelete(true),
                bottom: 72,
                onCancel: () => {
                    setMessage({
                        ...message,
                        show: false,
                    });
                },
            });
            return;
        }
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
            setToast({
                show: true,
                message: "Tâche(s) supprimée(s)",
                type: "success"
            });
            setTimeout(() => {
                router.replace("/");
            }, 500);
        }
        catch (e) {
            setToast({
                message: "Aucune connexion internet",
                show: true,
                type: "error",
            });
            setTasks([...datas, ...tasks]);
        }
    };

    useEffect(() => {
        if (tasksFilter && value.trim().length > 0) {
            if (tasksPressed.length === tasksFilter.length) {
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

    return (
        <View className="relative w-full flex flex-col items-center">
            <KeyboardAvoidingView
                behavior={Platform.OS === "android" ? "padding" : "height"}
                className="relative w-full flex justify-center items-center my-5 px-2">
                <TextInput
                    ref={inputRef}
                    placeholder="Rechercher..."
                    cursorColor={theme === "dark" ? "white" : colors.emerald[500]}
                    placeholderTextColor={theme === "dark" ? colors.white[300] : colors.black[500]}
                    value={value}
                    onChange={(e) => setValue(e.nativeEvent.text)}
                    editable={!loading && !refreshing && tasks.length > 0}
                    className='w-full h-16 border-b-2 text-xl dark:text-white/90 text-black dark:bg-white/10 bg-black/15 rounded-2xl pl-3 pr-12 font-bold'
                />
                <Pressable
                    onPress={() => console.log(height)}
                    className="absolute top-4 right-5 z-1 active:text-emerald-500 active:scale-[.8]"
                >
                    <FontAwesome5
                        name="search"
                        size={24}
                        color={theme == "dark" ? "white" : "black"}
                    />
                </Pressable>
                {
                    tasksFilter && tasksFilter.length > 0 && (
                        <Text className="absolute left-3 -top-6 text-lg text-emerald-500 font-extrabold tracking-widest">
                            ({tasksFilter.length})
                        </Text>
                    )
                }
                {
                    !tasksFilter && (
                        <Text className="absolute left-3 -top-6 text-lg dark:text-white/60 text-black/60 font-extrabold tracking-widest">Aucun élément</Text>
                    )
                }
            </KeyboardAvoidingView>
            <View className="w-full flex flex-row items-center gap-5 px-5 mb-5">
                <View className="flex flex-row items-center gap-1">
                    <Text className="text-lg dark:text-white text-black">Filtre</Text>
                    <FontAwesome5 name="filter" size={15} color={theme === "dark" ? "white" : "black"} />
                </View>
                <ScrollView
                    horizontal
                    contentContainerStyle={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                    }}
                    className="w-full"
                >
                    {
                        loading && (
                            <View className="w-[270px] h-[40px] flex flex-row items-center">
                                <Skeleton />
                            </View>
                        )
                    }
                    {
                        !loading && (
                            <>
                                <PressableAnimated
                                    scale={.8}
                                    onPress={() => handleFilter("all")}
                                    className="w-auto h-12 flex flex-row justify-center items-center dark:bg-white/20 bg-black/20 p-3 rounded-xl border dark:border-white/20 border-black/20"
                                >
                                    <Text className="text-lg dark:text-white text-black">Toutes</Text>
                                </PressableAnimated>

                                <PressableAnimated
                                    scale={.8}
                                    onPress={() => handleFilter("done")}
                                    className="w-auto h-12 flex flex-row justify-center items-center dark:bg-white/20 bg-black/20 p-3 rounded-xl border dark:border-white/20 border-black/20"
                                >
                                    <Text className="text-lg dark:text-white text-black">Faites</Text>
                                </PressableAnimated>

                                <PressableAnimated
                                    scale={.8}
                                    onPress={() => handleFilter("not done")}
                                    className="w-auto h-12 flex flex-row justify-center items-center dark:bg-white/20 bg-black/20 p-3 rounded-xl border dark:border-white/20 border-black/20"
                                >
                                    <Text className="text-lg dark:text-white text-black">En attentes</Text>
                                </PressableAnimated>
                            </>
                        )
                    }
                </ScrollView>
            </View>
            <View
                className="w-full h-full flex flex-col items-center gap-5 px-3 pt-2"
            >
                <FlatList
                    data={tasks.length > 0 && tasksFilter && tasksFilter.length == 0 ? tasks : tasksFilter}
                    keyExtractor={(item) => String(item.idTask)}
                    renderItem={({ item: task }) => (
                        <Task
                            key={task.idTask!}
                            task={task}
                            selected={tasksPressed.find((t) => task.idTask == t.idTask) != null}
                            selectedNumber={tasksPressed.indexOf(task) !== -1 ? tasksPressed.indexOf(task) + 1 : undefined}
                            longPress={() => {
                                const element = tasksPressed.indexOf(task);

                                if (element !== -1) {
                                    setTasksPressed(tasksPressed.filter((item) => item.idTask !== task.idTask));
                                }
                                else {
                                    setTasksPressed([...tasksPressed, task])
                                }
                            }}
                        />
                    )}
                    ListEmptyComponent={() => {
                        if (!loading && !refreshing) {
                            return (
                                <View className="w-full flex justify-center items-center gap-4 pt-20">
                                    <Text className="text-5xl animate-bounce">🔍</Text>
                                    <Text className="dark:text-white/70 text-black/40 font-bold text-lg tracking-wider">Aucune tâche pour l'instant</Text>
                                </View>
                            );
                        }
                    }}
                    onEndReached={() => value.trim().length == 0 && !refreshing && tasks.length < count && getTasks()}
                    onEndReachedThreshold={.9}
                    ListFooterComponent={loading ? <ActivityIndicator size="large" color={theme === "dark" ? "white" : colors.emerald[500]} /> : null}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => value.trim().length == 0 && handleRefresh()}
                            tintColor={theme == "dark" ? "white" : "black"}
                            colors={[theme === "dark" ? "white" : "black", colors.emerald[500]]}
                            progressBackgroundColor={"transparent"}
                        />
                    }
                    className="w-full"
                    contentContainerClassName="w-full flex flex-col items-center gap-5 pb-[400px]"
                />
                {
                    !loading && tasks.length == 0 && (
                        <View className="flex flex-row gap-2">
                            <Text className="text-lg dark:text-white/70 text-black/80 font-bold">Aucune tâche pour l&rsquo;instant</Text>
                            <Text className="text-2xl animate-bounce">🥲</Text>
                        </View>
                    )
                }
            </View>

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
                            if (value.trim().length > 0 && tasksFilter) {
                                if (tasksFilter.length === tasksPressed.length) {
                                    setTasksPressed([]);
                                }
                                else {
                                    setTasksPressed(tasksFilter);
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
                                <FontAwesome5 name="check" size={25} color={colors.emerald[500]} />
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

            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onCancel={() => setToast({
                    ...toast,
                    show: false,
                })}
            />

            <Message
                show={message.show}
                message={message.message}
                bottom={message.bottom}
                onCancel={() => message.onCancel()}
                action={() => message.action()}
            />
        </View>
    );
}

const Settings = () => {
    const { theme: appTheme, setTheme } = useTheme();
    const [currentTheme, setCurrentTheme] = useState<string>("");
    const [auth, setAuth] = useState<{
        exists: boolean;
        active: boolean;
    }>({
        exists: false,
        active: false,
    });
    const [message, setMessage] = useState<MessageProps>({
        show: false,
        message: "",
        action: () => { },
        onCancel: () => { },
    });
    const [confirm, setConfirm] = useState<boolean>(false);
    const { user, loading } = useAuth();
    const [theme, setAppTheme] = useState<typeof appTheme | "system">(appTheme);

    const handleTheme = (value: typeof theme | "system") => {
        setTheme(value);

        if (value == "light") setCurrentTheme("Clair");
        if (value == "dark") setCurrentTheme("Sombre");
        if (value == "system") setCurrentTheme("Système");
    }

    useEffect(() => {
        (async () => {
            const { getItem } = useAsyncStorage(THEME_STORAGE);
            const { getItem: getLocalAuth } = useAsyncStorage(AUTH_STORAGE);
            const themeSaved = await getItem();
            const hasHardware = await hasHardwareAsync();
            const isEnrolled = await isEnrolledAsync();
            const saveValue = await getLocalAuth();
            const { getItem: confirmItem } = useAsyncStorage(CONFIRM_STORAGE);
            const exists = await confirmItem();

            if (themeSaved && ["light", "dark", "system"].includes(themeSaved)) {
                if (themeSaved == "light") setCurrentTheme("Clair");
                else if (themeSaved == "dark") setCurrentTheme("Sombre");
                else setCurrentTheme("Système");
            }

            if (hasHardware && isEnrolled) {
                setAuth({
                    ...auth,
                    exists: true,
                });

                if (saveValue) {
                    setAuth({
                        exists: true,
                        active: true
                    });
                }
            }

            if (exists != null) {
                setConfirm(true);
            }
            else {
                setConfirm(false);
            }
        })();
    }, [auth.active, confirm]);

    const handleLocalAuthToggle = async () => {
        const { setItem, removeItem } = useAsyncStorage(AUTH_STORAGE);

        if (auth.active) {
            await removeItem();
            setAuth({
                ...auth,
                active: false,
            });
        }
        else {
            setAuth({
                ...auth,
                active: true,
            });
            await setItem(JSON.stringify({
                verified: false,
            }));
            // router.replace("/hardware-auth");
        }
    }

    const handleSignOut = async () => {
        const { getItem, setItem } = useAsyncStorage(AUTH_STORAGE);
        const exists = await getItem();

        if (exists != null) {
            await setItem(JSON.stringify({
                verified: false
            }));
        }
        supabase.auth.signOut();
    }

    const handleConfirmToggle = async () => {
        const { setItem, removeItem } = useAsyncStorage(CONFIRM_STORAGE);

        if (confirm) {
            await removeItem();
            setConfirm(false);
        }
        else {
            await setItem("true");
            setConfirm(true);
        }
    }

    useEffect(() => {
        setTheme(appTheme);
    }, [appTheme]);

    return (
        <View className="w-full flex items-center">
            <ScrollView
                horizontal={false}
                contentContainerClassName="w-full flex flex-col items-center pb-[100px]"
                className="w-full"
            >
                <View
                    className="w-[97%] flex flex-col mt-8 dark:bg-white/10 bg-black/10 p-3 rounded-2xl"
                >
                    <View className="flex flex-row items-center gap-3">
                        <Text className="dark:text-white text-black text-xl">Thème : </Text>
                        <Text className="text-emerald-500 text-xl font-extrabold tracking-[2px]">{currentTheme}</Text>
                    </View>
                    <View className="w-full pb-10 flex flex-row flex-wrap items-center gap-[30px_8px]">
                        <PressableAnimated
                            onPress={() => handleTheme("light")}
                        >
                            <Animated.View
                                className="size-[110px] flex flex-col items-center gap-2 p-3"
                            >
                                <View className="w-full flex flex-row">
                                    <View
                                        style={{
                                            borderRadius: 50,
                                        }}
                                        className={clsx(
                                            "size-8 flex flex-row justify-center items-center p-[5px]",
                                            "dark:bg-white/20 bg-black/20 dark:border-0 border-2 border-white/20"
                                        )}
                                    >
                                        {
                                            appTheme == "light" && (
                                                <View style={{ borderRadius: 50 }} className="size-full bg-emerald-500"></View>
                                            )
                                        }
                                    </View>
                                </View>
                                <ThemeCard value="light" />
                            </Animated.View>
                        </PressableAnimated>

                        <PressableAnimated
                            onPress={() => handleTheme("dark")}
                        >
                            <Animated.View
                                className="size-[110px] flex flex-col items-center gap-2 p-3"
                            >
                                <View className="w-full flex flex-row">
                                    <View
                                        style={{
                                            borderRadius: 50,
                                        }}
                                        className={clsx(
                                            "size-8 flex flex-row justify-center items-center p-[5px]",
                                            "dark:bg-white/20 bg-black/20 dark:border-0 border-2 border-white/20"
                                        )}
                                    >
                                        {
                                            appTheme == "dark" && (
                                                <View style={{ borderRadius: 50 }} className="size-full bg-emerald-500"></View>
                                            )
                                        }
                                    </View>
                                </View>
                                <ThemeCard value="dark" />
                            </Animated.View>
                        </PressableAnimated>

                        <PressableAnimated
                            onPress={() => handleTheme("system")}
                        >
                            <Animated.View
                                className="size-[110px] flex flex-col items-center gap-2 p-3"
                            >
                                <View className="w-full flex flex-row">
                                    <View
                                        style={{
                                            borderRadius: 50,
                                        }}
                                        className={clsx(
                                            "size-8 flex flex-row justify-center items-center p-[5px]",
                                            "dark:bg-white/20 bg-black/20 dark:border-0 border-2 border-white/20"
                                        )}
                                    >
                                        {
                                            theme == "system" && (
                                                <View style={{ borderRadius: 50 }} className="size-full bg-emerald-500"></View>
                                            )
                                        }
                                    </View>
                                </View>
                                <ThemeCard value="system" />
                            </Animated.View>
                        </PressableAnimated>
                    </View>
                </View>

                <View className="w-[97%] flex flex-col gap-3 dark:bg-white/10 bg-black/10 mt-6 p-5 rounded-2xl">
                    <View className="w-full flex flex-row items-center gap-3 overflow-hidden">
                        <View className="flex flex-row items-center gap-3">
                            <FontAwesome6 name="user-large" size={20} color={theme == "dark" ? "white" : "black"} />
                            <Text className="w-max dark:text-white text-black text-xl">Nom :</Text>
                        </View>
                        {
                            loading && (
                                <View className="w-[220px] h-[30px]">
                                    <Skeleton />
                                </View>
                            )
                        }
                        {
                            !loading && (
                                <Text
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                    className="w-3/4 text-emerald-500 text-xl tracking-widest font-bold"
                                >
                                    {user?.user_metadata.name}
                                </Text>
                            )
                        }
                    </View>
                </View>

                <View className="w-[97%] flex flex-col gap-3 dark:bg-white/10 bg-black/10 mt-6 p-5 rounded-2xl">
                    <View className="w-full flex flex-row items-center gap-3 overflow-hidden">
                        <View className="flex flex-row items-center gap-3">
                            <FontAwesome5 name="envelope-open-text" size={20} color={theme == "dark" ? "white" : "black"} />
                            <Text className="w-max dark:text-white text-black text-xl">Email :</Text>
                        </View>
                        {
                            loading && (
                                <View className="w-[220px] h-[30px]">
                                    <Skeleton />
                                </View>
                            )
                        }
                        {
                            !loading && (
                                <Text
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                    className="w-3/4 text-emerald-500 text-xl tracking-widest font-bold"
                                >
                                    {user?.email}
                                </Text>
                            )
                        }
                    </View>
                </View>

                {
                    auth.exists && (
                        <View className="w-[97%] flex flex-row flex-wrap justify-between gap-3 dark:bg-white/10 bg-black/10 mt-6 p-5 rounded-2xl">
                            <Text className="text-xl dark:text-white text-black">Verrouillage de l'app</Text>
                            <Toggle
                                active={auth.active}
                                onChange={() => handleLocalAuthToggle()}
                            />
                        </View>
                    )
                }

                <View className="w-[97%] flex flex-row flex-wrap justify-between gap-3 dark:bg-white/10 bg-black/10 mt-6 p-5 rounded-2xl">
                    <Text className="text-xl dark:text-white text-black">Confirmation avant suppression</Text>
                    <Toggle
                        active={confirm}
                        onChange={() => handleConfirmToggle()}
                    />
                </View>

                <View className="w-[97%] flex flex-col gap-3 dark:bg-white/10 bg-black/10 mt-6 p-5 rounded-2xl">
                    <PressableAnimated
                        onPress={() => setMessage({
                            show: true,
                            message: "Êtes-vous sûr de vouloir vous déconnecter ?",
                            bottom: 90,
                            onCancel: () => setMessage({
                                ...message,
                                show: false,
                            }),
                            action: () => handleSignOut(),
                        })}
                        className="flex flex-row items-center self-start shrink gap-3"
                    >
                        <FontAwesome5 name="sign-out-alt" size={20} color="red" />
                        <Text className="w-max text-red-500 text-xl">Déconnexion</Text>
                    </PressableAnimated>
                </View>
            </ScrollView>

            <Message
                show={message.show}
                message={message.message}
                bottom={message.bottom}
                onCancel={() => message.onCancel()}
                action={() => message.action()}
            />
        </View>
    );
}

export default function Home() {
    const [currentPage, setCurrentPage] = useState<number>(0);
    const pageRef = useRef<PagerView>(null);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const { height } = Dimensions.get("window");
    const [loading, setLoading] = useState<boolean>(false);
    const [toast, setToast] = useState<{
        message: string;
        show: boolean;
        type?: ToastType;
        top?: number;
    }>({
        message: "",
        show: false,
        type: "default",
        top: 0,
    });
    const [value, setValue] = useState<string>("");
    const router = useRouter();

    const handleChangePage = (value: number) => {
        if (!pageRef.current) return;

        pageRef.current.setPageWithoutAnimation(value);
    }

    const handleSubmit = async () => {
        if (value.trim().length == 0) {
            setToast({
                message: "Veuillez renseigner la description de la tâche !",
                show: true,
                type: "warning",
            });
            return;
        }
        else if (!checkLength(value.trim(), [3, null])) {
            setToast({
                message: "La longueur minimale requise est de 3",
                show: true,
                type: "warning",
            });
            return;
        }

        const valueFormatted = value.trim().charAt(0).toUpperCase() + value.trim().slice(1);

        try {
            setLoading(true);
            await api.post("/task/create", {
                content: valueFormatted,
            });
            setToast({
                message: "Tâche créée 😉",
                show: true,
                type: "success",
            });
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
                setToast({
                    message: data.message,
                    show: true,
                    type: "error",
                });
            }
            else {
                setToast({
                    message: "Une erreur d'est produite",
                    show: true,
                    type: "error",
                });
            }
        }
    }

    return (
        <Container>
            <PageTitle page={currentPage} />
            <PagerView
                ref={pageRef}
                initialPage={0}
                onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
                style={{ flex: 1 }}
            >
                <List />
                <Settings />
            </PagerView>

            {
                currentPage === 0 && (
                    <PressableAnimated
                        onPress={() => setModalVisible(true)}
                        style={{
                            top: height - height * 25 / 100
                        }}
                        className="absolute left-4 size-[50px] flex justify-center items-center border-2 dark:border-white/20 border-black/20 dark:bg-black/60 bg-white/60 rounded-full"
                    >
                        <FontAwesome5 name="plus" size={20} color={colors.emerald[500]} />
                    </PressableAnimated>
                )
            }

            <Modal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "android" ? "padding" : "height"}
                    className="w-full h-full flex items-center gap-8 pt-8 px-3"
                >
                    <View className="w-full flex flex-row justify-center">
                        <Text className="text-2xl text-emerald-500 font-bold tracking-widest">Ajoutez votre tâche</Text>
                    </View>
                    <Input
                        placeholder="Description"
                        big
                        value={value}
                        onChange={(e) => setValue(e.nativeEvent.text)}
                    />
                    <Button
                        loading={loading}
                        loaderSize={30}
                        scale={.8}
                        onPress={() => handleSubmit()}
                        className="w-[300px] h-[60px]"
                    >
                        <Text className="text-2xl text-black font-bold tracking-widest">Ajouter</Text>
                        <FontAwesome5 name="plus" size={20} color="black" />
                    </Button>
                </KeyboardAvoidingView>
            </Modal>
            <Toast
                show={toast.show}
                message={toast.message}
                onCancel={() => setToast({
                    ...toast,
                    show: false,
                })}
                top={toast.top}
                type={toast.type}
            />

            <View className="absolute left-0 bottom-0 w-full flex flex-row justify-center items-center py-3 z-[100px]">
                <View className="w-[90%] h-auto flex flex-row justify-evenly items-center p-3 rounded-[50px] dark:bg-black/90 bg-white/90 border-2 dark:border-white/20 border-black/20">
                    <NavButton name="Accueil" focused={currentPage === 0} icon="list-check" onPress={() => handleChangePage(0)} />
                    <NavButton name="Paramètres" focused={currentPage === 1} icon="gears" onPress={() => handleChangePage(1)} />
                </View>
            </View>
        </Container>
    );
}