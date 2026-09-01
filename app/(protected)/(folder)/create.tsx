import { Checkbox } from "@/components/checkbox";
import { Container } from "@/components/container";
import { PressableAnimated } from "@/components/pressable-animated";
import { Select } from "@/components/select";
import { Skeleton } from "@/components/skeleton";
import { TextAnimated } from "@/components/text-animated";
import { COLORS } from "@/constants/colors";
import { useTheme } from "@/hooks/use-theme";
import { TaskType } from "@/types/task";
import { Entypo, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import clsx from "clsx";
import { useRouter } from "expo-router";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, BlurEvent, FlatList, FocusEvent, Keyboard, KeyboardAvoidingView, Platform, Text, TextInput, TextInputProps, Vibration, View } from "react-native";
import Animated, { Easing, FadeIn, FadeInUp, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

interface Props extends TextInputProps {
    onFocus?: (e?: FocusEvent) => void;
    onBlur?: (e?: BlurEvent) => void;
    value?: string;
    ref?: RefObject<TextInput | null>;
    label?: string;
    rounded?: number;
    multiline?: boolean;
}

const Input = ({ onFocus, onBlur, value = "", ref: inputRef, label = "", rounded = 16, multiline = false, ...rest }: Props) => {
    const { theme, themeShared } = useTheme();
    const ref = useRef<TextInput>(null);
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
            ref.current?.blur();
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
                ref={(e) => {
                    if (!inputRef?.current && e) {
                        ref.current = e;
                    }
                    else if (inputRef?.current) {
                        ref.current = inputRef.current;
                    }
                }}
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
};

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

    const getItemLayout = useCallback((_data: ArrayLike<TaskType> | null | undefined, index: number) => ({
        length: taskHeight + tasksGap,
        offset: index * (taskHeight + tasksGap),
        index,
    }), []);

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
                <View className="w-[75] border-2 border-red-500">
                    <TextAnimated
                        numberOfLines={1}
                        className="text-lg"
                    >
                        {task.title ?? task.content ?? ""}
                    </TextAnimated>
                </View>

                <Checkbox
                    checked={index % 2 == 0}
                    onPress={() => { }}
                />
            </Animated.View>
        );
    }, []);

    const listFooterComponent = useCallback(() => {
        // if (loading) {
        if (true) {
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
        return null;
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
                        ref={inputRef}
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
                        <View className="w-full h-[400px] dark:bg-white/10 bg-white rounded-xl">
                            <FlatList
                                horizontal={false}
                                showsVerticalScrollIndicator={false}
                                data={inputsValues.tasks}
                                keyExtractor={(task) => task.idTask}
                                updateCellsBatchingPeriod={0}
                                scrollEventThrottle={16}
                                initialNumToRender={fetchLimit}
                                maxToRenderPerBatch={fetchLimit}
                                getItemLayout={getItemLayout}
                                renderItem={renderItem}
                                ListEmptyComponent={listEmptyComponent}
                                ListFooterComponent={listFooterComponent}
                                className="w-full h-full"
                                contentContainerStyle={{
                                    gap: tasksGap,
                                }}
                                contentContainerClassName="w-full flex px-3 py-10"
                            />
                        </View>
                    </Select>
                </View>

                <PressableAnimated
                    disabled={loading}
                    scale={.95}
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