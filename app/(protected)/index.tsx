import { Button } from "@/components/Button";
import { Container } from "@/components/container";
import { Input } from "@/components/input";
import { Message, MessageProps } from "@/components/message";
import { Modal } from "@/components/modal";
import { PageTitle } from "@/components/page-title";
import { PressableAnimated } from "@/components/pressable-animated";
import { Skeleton } from "@/components/skeleton";
import { Task } from "@/components/task";
import { COLORS } from "@/constants/colors";
import { CONFIRM_STORAGE } from "@/constants/names";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { Task as TaskType } from "@/types/task";
import { checkLength } from "@/utils/tools";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useAsyncStorage } from "@react-native-async-storage/async-storage";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import PagerView from "react-native-pager-view";
import Animated, { Easing, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { api } from "../../lib/axios";

export default function Home() {
    const pageRef = useRef<PagerView>(null);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const { height } = useWindowDimensions();
    const { setToast } = useToast();
    const [value, setValue] = useState<string>("");
    const router = useRouter();
    const { theme } = useTheme();
    const [loading, setLoading] = useState<boolean>(false);
    const [tasks, setTasks] = useState<TaskType[]>([]);
    const [tasksFilter, setTasksFilter] = useState<TaskType[] | null>([]);
    const perPage = 10;
    const [count, setCount] = useState<number>(0);
    const [tasksPressed, setTasksPressed] = useState<TaskType[]>([]);
    const [allPressed, setAllPressed] = useState<boolean>(false);
    const pathname = usePathname();
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const inputRef = useRef<TextInput>(null);
    const [message, setMessage] = useState<MessageProps>({
        show: false,
        message: "",
        onCancel: () => { },
        action: () => { },
    });

    const handleSubmit = async () => {
        if (value.trim().length == 0) {
            setToast("Veuillez renseigner la description de la tâche !","warning");
            return;
        }
        else if (!checkLength(value.trim(), [3, null])) {
            setToast("La longueur minimale requise est de 3","warning");
            return;
        }

        const valueFormatted = value.trim().charAt(0).toUpperCase() + value.trim().slice(1);

        try {
            setLoading(true);
            await api.post("/task/create", {
                content: valueFormatted,
            });
            setToast("Tâche créée 😉","success");
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
                setToast(data.message,"error");
            }
            else {
                setToast("Une erreur d'est produite","error");
            }
        }
    }

    const getTasks = async () => {
        try {
            if (loading || tasks.length >= perPage) return;
            setLoading(true);
            const { data } = await api.post(`/task/list?skip=${tasks.length}&take=${perPage}`);

            setTasks([...tasks, ...data]);
            setLoading(false);
        }
        catch (e) {
            setToast("Aucune connexion internet","error");
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
            setToast("Aucune connexion internet","error");
        }
    }

    const getCount = async () => {
        try {
            const { data } = await api.post("/task/count");
            setCount(data);
        }
        catch (e) {
            setToast("Aucune connexion internet","error");
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
            setToast("Tâche(s) supprimée(s)","success");
            setTimeout(() => {
                router.replace("/");
            }, 500);
        }
        catch (e) {
            setToast("Aucune connexion internet","error");
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
                    behavior={Platform.OS === "android" ? "padding" : "height"}
                    className="relative w-full flex justify-center items-center my-5 px-2">
                    <TextInput
                        ref={inputRef}
                        placeholder="Rechercher..."
                        cursorColor={theme === "dark" ? "white" : COLORS.emerald[500]}
                        placeholderTextColor={theme === "dark" ? COLORS.white[300] : COLORS.black[500]}
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
                        ListFooterComponent={loading ? <ActivityIndicator size="large" color={theme === "dark" ? "white" : COLORS.emerald[500]} /> : null}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={() => value.trim().length == 0 && handleRefresh()}
                                tintColor={theme == "dark" ? "white" : "black"}
                                colors={[theme === "dark" ? "white" : "black", COLORS.emerald[500]]}
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

                <Message
                    show={message.show}
                    message={message.message}
                    bottom={message.bottom}
                    onCancel={() => message.onCancel()}
                    action={() => message.action()}
                />
            </View>

            <PressableAnimated
                onPress={() => setModalVisible(true)}
                style={{
                    top: height - height * 25 / 100
                }}
                className="absolute left-4 size-[50px] flex justify-center items-center border-2 dark:border-white/20 border-black/20 dark:bg-black/60 bg-white/60 rounded-full"
            >
                <FontAwesome5 name="plus" size={20} color={COLORS.emerald[500]} />
            </PressableAnimated>

            <Modal
                active={modalVisible}
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
        </Container>
    );
}