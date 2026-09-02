import { Checkbox } from "@/components/checkbox";
import { Container } from "@/components/container";
import { PressableAnimated } from "@/components/pressable-animated";
import { Select } from "@/components/select";
import { Skeleton } from "@/components/skeleton";
import { TextAnimated } from "@/components/text-animated";
import { COLORS } from "@/constants/colors";
import { useFolders } from "@/hooks/database/use-folders";
import { useTasks } from "@/hooks/database/use-tasks";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { event, FOLDER_CREATED } from "@/lib/event-emitter";
import { TaskType } from "@/types/task";
import { Entypo, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import clsx from "clsx";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, BlurEvent, FlatList, FocusEvent, Keyboard, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, TextInputProps, Vibration, View } from "react-native";
import Animated, { Easing, FadeIn, FadeInUp, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

interface Props extends TextInputProps {
    onFocus?: (e?: FocusEvent) => void;
    onBlur?: (e?: BlurEvent) => void;
    value?: string;
    label?: string;
    rounded?: number;
    multiline?: boolean;
}

const Input = forwardRef<TextInput, Props>(({ onFocus, onBlur, value = "", label = "", rounded = 16, multiline = false, ...rest }: Props, ref) => {
    const { theme, themeShared } = useTheme();
    const inputRef = useRef<TextInput>(null);
    const focus = useSharedValue<boolean>(false);
    const valueShared = useSharedValue<string>("");

    const labelAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: withTiming((focus.value || valueShared.value.trim().length > 0) ? 0 : 16, {
                    duration: 200,
                    easing: Easing.inOut(Easing.quad),
                }),
            },
            {
                translateY: withTiming((focus.value || valueShared.value.trim().length > 0) ? -25 : 10, {
                    duration: 200,
                    easing: Easing.inOut(Easing.quad),
                }),
            },
        ],
        opacity: withTiming((focus.value || valueShared.value.trim().length > 0) ? .5 : 1, {
            duration: 200,
            easing: Easing.inOut(Easing.quad),
        }),
    }));

    useEffect(() => {
        const onHide = () => {
            inputRef.current?.blur();
        }
        const { remove } = Keyboard.addListener("keyboardDidHide", onHide);

        return () => remove();
    }, []);

    const focusAnimation = useAnimatedStyle(() => ({
        borderWidth: 1,
        borderColor: focus.value ?
            (themeShared.value == "dark" ? "rgba(255, 255, 255, .1)" : "rgba(0, 0, 0, .2)")
            :
            "rgba(0, 0, 0, 0)"
    }));

    useEffect(() => {
        valueShared.value = value;
    }, [value]);

    const handleRef = useCallback((input: TextInput | null) => {
        inputRef.current = input;

        if (typeof ref === "function") {
            ref(input);
        } else if (ref) {
            ref.current = input;
        }
    }, [ref]);

    return (
        <Animated.View
            style={[
                {
                    borderRadius: rounded,
                },
                focusAnimation,
            ]}
            className="w-full"
        >
            <TextInput
                {...rest}
                // ref={(e) => {
                //     if (!inputRef?.current && e) {
                //         ref.current = e;
                //     }
                //     else if (inputRef?.current) {
                //         ref.current = inputRef.current;
                //     }
                // }}
                ref={handleRef}
                onFocus={(e: FocusEvent) => {
                    focus.value = true;
                    onFocus?.(e);
                }}
                onBlur={(e: BlurEvent) => {
                    focus.value = false;
                    onBlur?.(e);
                }}
                value={value}
                cursorColor={theme == "dark" ? "rgba(255, 255, 255, .5)" : COLORS.emerald[500]}
                textAlignVertical="top"
                multiline={multiline}
                style={{
                    minHeight: multiline ? 80 : 40,
                    maxHeight: 200,
                    borderRadius: rounded,
                }}
                className="w-full dark:text-white/80 text-black/80 text-xl px-5"
            />

            {
                label && (
                    <TextAnimated
                        style={labelAnimation}
                        className="absolute text-xl tracking-wide"
                    >
                        {label}
                    </TextAnimated>
                )
            }
        </Animated.View>
    );
});

export default function CreateFolderPager() {
    const { theme } = useTheme();
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const inputRef = useRef<TextInput>(null);
    const initialInputValues: {
        title: string;
        tasks: TaskType[];
    } = {
        title: "",
        tasks: [],
    };
    const [inputsValues, setInputsValues] = useState<typeof initialInputValues>(initialInputValues);
    const titleLengthLimit = 50;
    const [loading, setLoading] = useState<boolean>(false);
    const fetchLimit = 10;
    const taskHeight = 60;
    const tasksGap = 10;
    const [tasksCount, setTasksCount] = useState<number>(0);
    const [tasks, setTasks] = useState<TaskType[]>([]);
    const { getTasks, getTasksCount } = useTasks();
    const { setToast } = useToast();
    const { createFolder } = useFolders();

    const selectMap = useMemo(() => {
        return (
            new Map(
                inputsValues.tasks.map(t => [t.idTask, t]),
            )
        )
    }, [inputsValues.tasks]);

    const getItemLayout = useCallback((_data: ArrayLike<TaskType> | null | undefined, index: number) => ({
        length: taskHeight + tasksGap,
        offset: index * (taskHeight + tasksGap),
        index,
    }), []);

    const handlePress = useCallback((task: TaskType) => {
        if (selectMap.has(task.idTask)) {
            setInputsValues(prev => ({
                ...prev,
                tasks: [...prev.tasks.filter(t => t.idTask != task.idTask)],
            }));
        }
        else {
            setInputsValues(prev => ({
                ...prev,
                tasks: [...prev.tasks, task],
            }));
        }
    }, [selectMap]);

    const renderItem = useCallback(({ item: task, index }: { item: TaskType; index: number }) => {
        return (
            <Animated.View
                entering={FadeInUp
                    .delay(index * 100)
                    .duration(300)
                    .easing(Easing.inOut(Easing.quad))
                }
                style={{
                    height: taskHeight,
                }}
                className="w-full"
            >
                <Pressable
                    onPress={() => handlePress(task)}
                    className="w-full h-full flex flex-row justify-between items-center"
                >
                    <View className="w-[85%]">
                        <TextAnimated
                            numberOfLines={1}
                            className="text-lg"
                        >
                            {task.title ?? task.content ?? ""}
                        </TextAnimated>
                    </View>

                    <Checkbox
                        checked={selectMap.has(task.idTask)}
                        borderRadius={5}
                        size={30}
                        onPress={() => handlePress(task)}
                    />
                </Pressable>
            </Animated.View>
        );
    }, [selectMap, handlePress]);

    const listFooterComponent = useCallback(() => {
        if (loading) {
            return (
                <View
                    style={{
                        gap: tasksGap,
                    }}
                    className="w-full flex items-center"
                >
                    {
                        Array(3).fill(0).map((_, i) => (
                            <Animated.View
                                key={i}
                                entering={FadeIn
                                    .delay(i * 100)
                                    .duration(300)
                                    .easing(Easing.inOut(Easing.quad))
                                }
                                style={{
                                    height: taskHeight
                                }}
                                className="w-full rounded-2xl overflow-hidden dark:bg-black bg-black/10"
                            >
                                <Skeleton delay={i * 200} />
                            </Animated.View>
                        ))
                    }
                </View>
            );
        }
        return null;
    }, [loading]);

    const listEmptyComponent = useCallback(() => {
        if (!loading) {
            return (
                <View className="w-full flex justify-center items-center gap-4 pt-10">
                    <MaterialIcons
                        name="playlist-remove"
                        size={100}
                        color={theme == "dark" ? "rgba(255, 255, 255, .1)" : "rgba(0, 0, 0, .1)"}
                    />
                    <Text className="dark:text-white/50 text-black/50 font-bold text-lg tracking-wider">
                        {t("tasks_search_tasks_empty")}
                    </Text>
                </View>
            );
        }
        return null;
    }, [loading, i18n.language, theme]);

    const handleGetTasks = useCallback(async () => {
        if (loading) return;

        try {
            setLoading(true);
            const data = await getTasks(fetchLimit, tasks.length, null, "task") as TaskType[];

            setTasks(prev => {
                return [...prev, ...data.filter(t => !prev.find(task => task.idTask == t.idTask))];
            });
            setLoading(false);
        }
        catch (e) {
            setLoading(false);
            setToast(t("sqlite_error"), "error");
            console.log(e);
        }
    }, [i18n.language, tasks.length, loading]);

    const handleGetTasksCount = useCallback(async () => {
        try {
            const count = await getTasksCount(null) as number;

            setTasksCount(count);
        }
        catch (e) {
            setToast(t("sqlite_error"), "error");
            console.log(e);
        }
    }, [i18n.language, tasks.length]);

    const onEdnReached = useCallback(async () => {
        if (loading || tasks.length >= tasksCount) return;
        handleGetTasks();
    }, [i18n.language, tasks.length]);

    useEffect(() => {
        handleGetTasksCount();
        handleGetTasks();
    }, []);

    const handleSubmit = useCallback(async () => {
        if (loading) return;
        if (inputsValues.title.trim().length == 0) {
            inputRef.current?.focus();
            return;
        }

        try {
            setLoading(true);

            await createFolder(inputsValues.title.trim().slice(0, titleLengthLimit), inputsValues.tasks.map(t => t.idTask));

            setLoading(false);
            event.emit(FOLDER_CREATED);
            setToast(t("create_folder_success"), "success");
            setInputsValues(initialInputValues);
        }
        catch (e) {
            setLoading(false);
            setToast(t("sqlite_error"), "error");
            console.log(e);
        }
    }, [loading, inputsValues]);

    return (
        <Container centerX>
            <View className="w-full flex flex-row items-center gap-2 px-3 py-2 mb-10">
                <PressableAnimated
                    scale={.95}
                    onPress={() => {
                        if (router.canGoBack()) {
                            router.back();
                        }
                        else {
                            router.navigate({
                                pathname: "/(protected)/(tabs)",
                            });
                        }
                    }}
                    className="size-[50px] dark:bg-black bg-white rounded-full"
                >
                    <View className="size-full flex justify-center items-center dark:bg-white/10 bg-white rounded-full border-2 dark:border-white/5 border-black/5">
                        <Entypo
                            name="chevron-left"
                            size={25}
                            color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                        />
                    </View>
                </PressableAnimated>

                <View className="w-[80%]">
                    <TextAnimated
                        numberOfLines={1}
                        className="text-xl text-center"
                    >
                        {t("create_folder_title")}
                    </TextAnimated>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS == "android" ? "height" : "padding"}
                className="w-full flex items-center px-3"
            >
                <View className="w-full dark:bg-white/10 bg-white rounded-2xl">
                    <Input
                        // ref={inputRef}
                        ref={(e) => {
                            inputRef.current = e;
                        }}
                        label={t("create_folder_form_title")}
                        value={inputsValues.title}
                        onChangeText={(e) => {
                            if (e.length > titleLengthLimit) {
                                Vibration.vibrate(200);
                            }
                            else {
                                setInputsValues((prev) => ({
                                    ...prev,
                                    title: e.slice(0, titleLengthLimit),
                                }));
                            }
                        }}
                    />
                </View>

                <View className="w-full flex flex-row items-center gap-2 mt-5 px-3">
                    <TextAnimated
                        numberOfLines={1}
                        className="text-lg tracking-widest"
                    >
                        {t("create_folder_form_title_length")} :
                    </TextAnimated>

                    <Text
                        numberOfLines={1}
                        className="text-lg tracking-widest text-emerald-500 font-medium"
                    >
                        {inputsValues.title.length} / {titleLengthLimit}
                    </Text>
                </View>

                <View className="w-full mt-5 px-3">
                    <Select
                        header={(
                            <View className="w-full">
                                <TextAnimated className="text-lg">
                                    {t("create_folder_form_add_tasks")}
                                </TextAnimated>
                            </View>
                        )}
                    >
                        <View className="w-full h-[400px] dark:bg-white/10 bg-white rounded-xl overflow-hidden">
                            <View className="absolute left-0 top-0 w-full h-[30px] z-[1]">
                                <LinearGradient
                                    colors={theme == "dark" ?
                                        ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)"]
                                        :
                                        ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                                    }
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                    locations={[0, .6, 1]}
                                    className="size-full"
                                >
                                    <LinearGradient
                                        colors={theme == "dark" ?
                                            ["rgba(255, 255, 255, .1)", "rgba(255, 255, 255, .1)", "rgba(255, 255, 255, 0)"]
                                            :
                                            ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                                        }
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 0, y: 1 }}
                                        locations={[0, .6, 1]}
                                        className="size-full"
                                    />
                                </LinearGradient>
                            </View>

                            <FlatList
                                horizontal={false}
                                showsVerticalScrollIndicator={false}
                                data={tasks}
                                keyExtractor={(task) => task.idTask}
                                updateCellsBatchingPeriod={0}
                                scrollEventThrottle={16}
                                onEndReachedThreshold={.1}
                                initialNumToRender={fetchLimit}
                                maxToRenderPerBatch={fetchLimit}
                                getItemLayout={getItemLayout}
                                renderItem={renderItem}
                                ListEmptyComponent={listEmptyComponent}
                                ListFooterComponent={listFooterComponent}
                                onEndReached={onEdnReached}
                                className="w-full h-full"
                                contentContainerStyle={{
                                    gap: tasksGap,
                                }}
                                contentContainerClassName="w-full flex px-3 py-5"
                            />

                            <View className="absolute left-0 bottom-0 w-full h-[30px] z-[1]">
                                <LinearGradient
                                    colors={theme == "dark" ?
                                        ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)"]
                                        :
                                        ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                                    }
                                    start={{ x: 0, y: 1 }}
                                    end={{ x: 0, y: 0 }}
                                    locations={[0, .6, 1]}
                                    className="size-full"
                                >
                                    <LinearGradient
                                        colors={theme == "dark" ?
                                            ["rgba(255, 255, 255, .1)", "rgba(255, 255, 255, .1)", "rgba(255, 255, 255, 0)"]
                                            :
                                            ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                                        }
                                        start={{ x: 0, y: 1 }}
                                        end={{ x: 0, y: 0 }}
                                        locations={[0, .6, 1]}
                                        className="size-full"
                                    />
                                </LinearGradient>
                            </View>
                        </View>
                    </Select>
                </View>

                <PressableAnimated
                    disabled={loading}
                    scale={.95}
                    onPress={() => handleSubmit()}
                    className={clsx(
                        "w-[200px] h-[50px] flex flex-row justify-center items-center bg-emerald-500 px-3 rounded-2xl mt-10",
                        loading && "opacity-60",
                    )}
                >
                    {
                        loading ?
                            (
                                <ActivityIndicator
                                    size={25}
                                    color="black"
                                />
                            )
                            :
                            (
                                <View className="w-full flex flex-row justify-center items-center gap-2">
                                    <View>
                                        <Text
                                            numberOfLines={1}
                                            className="text-2xl text-black font-bold"
                                        >
                                            {t("create_folder_form_submit")}
                                        </Text>
                                    </View>

                                    <View>
                                        <MaterialCommunityIcons
                                            name="folder-plus"
                                            size={30}
                                            color="black"
                                        />
                                    </View>
                                </View>
                            )
                    }
                </PressableAnimated>
            </KeyboardAvoidingView>
        </Container>
    );
}