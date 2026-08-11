import { Button } from "@/components/Button";
import { Checkbox } from "@/components/checkbox";
import { Container } from "@/components/container";
import { PressableAnimated } from "@/components/pressable-animated";
import { Select } from "@/components/select";
import { TextAnimated } from "@/components/text-animated";
import { COLORS } from "@/constants/colors";
import { getIcons } from "@/constants/icons";
import { useTheme } from "@/hooks/use-theme";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import clsx from "clsx";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FocusEvent, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, TextInputProps, useWindowDimensions, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

interface Props extends TextInputProps {
    onFocus?: (e?: FocusEvent) => void;
    onBlur?: (e?: FocusEvent) => void;
    value?: string;
    ref?: RefObject<TextInput>;
    label?: string;
    rounded?: number;
    multiline?: boolean;
}

const Input = ({ onFocus, onBlur, value = "", ref: inputRef, label = "", rounded = 16, multiline = false, ...rest }: Props) => {
    const { theme, themeShared } = useTheme();
    const ref = useRef<TextInput>(inputRef?.current);
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
                onFocus={(e) => {
                    focus.value = true;
                    onFocus?.(e);
                }}
                onBlur={(e) => {
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

export default function CreateTaskPage() {
    const { t, i18n } = useTranslation();
    const [target, setTarget] = useState<"task" | "event">("task");
    const targetShared = useSharedValue<typeof target>("task");
    const parentWidth = useSharedValue<number>(0);
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const { theme } = useTheme();
    const router = useRouter();
    const date = useMemo(() => new Date(), []);
    const initialInputsValues = {
        title: "",
        desc: "",
        icon: "",
        date,
        startAt: `${date.getHours() + 1} : ${date.getMinutes()}`,
        endAt: `${date.getHours() + 2} : ${date.getMinutes()}`,
        remindBefore: 30,
    }
    const [inputsValues, setInputsValues] = useState<Omit<typeof initialInputsValues, "endAt"> & { endAt: string | null }>(initialInputsValues);
    const [loading, setLoading] = useState<boolean>(false);

    const markerAnimation = useAnimatedStyle(() => ({
        width: (parentWidth.value / 2) * .9,
        left: 0,
        transform: [
            {
                translateX: withTiming(targetShared.value == "task" ? ((parentWidth.value / 2) * .05) : parentWidth.value / 2 + ((parentWidth.value / 2) * .05), {
                    duration: 500,
                    easing: Easing.inOut(Easing.quad),
                }),
            }
        ]
    }));

    useEffect(() => {
        targetShared.value = target;
    }, [target]);

    const icons = useMemo(() => {
        return getIcons(theme);
    }, [theme]);

    const repeatRange = useMemo(() => {
        return Array(7).fill(0).map((_, i) => i == 0 ? 5 : i * 10)
    }, []);

    return (
        <Container centerX>
            {/* Page background */}

            <View
                style={{
                    height: screenHeight + (screenHeight * .2),
                    transform: [
                        {
                            translateY: -(screenHeight * .1),
                        }
                    ]
                }}
                className="absolute left-0 top-0 w-screen -z-[10] dark:bg-black bg-white"
            >
                <View className="size-full dark:bg-white/10 bg-white" />
            </View>

            {/* Header */}

            <View className="absolute w-full z-[10]">
                <LinearGradient
                    colors={theme == "dark" ?
                        ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(rgba(0, 0, 0, 0))"]
                        :
                        ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(rgba(255, 255, 255, 0))"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    locations={[0, .75, 1]}
                    className="size-full"
                >
                    <LinearGradient
                        colors={theme == "dark" ?
                            ["rgba(255, 255, 255, .1)", "rgba(255, 255, 255, .1)", "rgba(rgba(0, 0, 0, 0))"]
                            :
                            ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(rgba(255, 255, 255, 0))"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        locations={[0, .75, 1]}
                        className="size-full flex items-center pb-10"
                    >
                        {/* Back button */}

                        <View className="w-full flex px-3 py-1">
                            <Pressable
                                onPress={() => router.canGoBack() ? router.back() : router.navigate("/(protected)/(tabs)/")}
                                android_ripple={{
                                    color: theme == "dark" ? "rgba(255, 255, 255, .2)" : "rgba(0, 0, 0, .2)",
                                    foreground: true,
                                    borderless: true,
                                    radius: 24,
                                }}
                                className="size-[50px] dark:bg-black bg-white rounded-full"
                            >
                                <View className="size-full flex justify-center items-center dark:bg-white/5 bg-black/5 rounded-full border dark:border-white/10 border-black/10">
                                    <Entypo
                                        name="chevron-left"
                                        size={25}
                                        color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                                    />
                                </View>
                            </Pressable>
                        </View>

                        {/* Form type */}

                        <View
                            onLayout={(e) => parentWidth.value = e.nativeEvent.layout.width}
                            className="w-full h-[50px] flex flex-row justify-center items-center gap-3 px-3 py-2"
                        >
                            <Animated.View
                                style={markerAnimation}
                                className="absolute h-full bg-emerald-500 rounded-2xl"
                            />

                            <View className="w-[50%] flex flex-row justify-center items-center z-[1]">
                                <PressableAnimated
                                    onPress={() => setTarget("task")}
                                    className="px-5"
                                >
                                    <TextAnimated
                                        dark={target == "task" ? "rgba(0, 0, 0, .8)" : "rgba(255, 255, 255, .8)"}
                                        numberOfLines={1}
                                        className={clsx(
                                            "text-2xl tracking-widest",
                                            target == "task" ? "font-bold" : "font-medium",
                                        )}
                                    >
                                        {t("create_section_1_item_1")}
                                    </TextAnimated>
                                </PressableAnimated>
                            </View>

                            <View className="w-[50%] flex flex-row justify-center items-center z-[1]">
                                <PressableAnimated
                                    onPress={() => setTarget("event")}
                                    className="px-5"
                                >
                                    <TextAnimated
                                        dark={target == "event" ? "rgba(0, 0, 0, .8)" : "rgba(255, 255, 255, .8)"}
                                        numberOfLines={1}
                                        className={clsx(
                                            "text-2xl tracking-widest",
                                            target == "event" ? "font-bold" : "font-medium",
                                        )}
                                    >
                                        {t("create_section_1_item_2")}
                                    </TextAnimated>
                                </PressableAnimated>
                            </View>
                        </View>
                    </LinearGradient>
                </LinearGradient>
            </View>

            {/* Form */}

            <ScrollView
                horizontal={false}
                showsVerticalScrollIndicator={false}
                className="w-full h-full"
                contentContainerClassName="w-full flex items-center gap-6 pt-[120px] pb-[100px] px-3"
            >
                <View className="w-full dark:bg-black bg-white rounded-2xl">
                    <View className="w-full dark:bg-black bg-black/5 p-5 pt-10 rounded-2xl">
                        <KeyboardAvoidingView
                            behavior={Platform.OS == "android" ? "height" : "padding"}
                            className="w-full flex items-center gap-10"
                        >
                            <View className="w-full">
                                <View className="dark:bg-white/10 bg-white rounded-2xl">
                                    <Input
                                        label={t(`create_form_${target}_title`)}
                                        value={inputsValues.title}
                                        onChangeText={(e) => setInputsValues({
                                            ...inputsValues,
                                            title: e,
                                        })}
                                    />
                                </View>
                            </View>

                            <View className="w-full">
                                <View className="dark:bg-white/10 bg-white rounded-2xl">
                                    <Input
                                        label={t("create_form_description")}
                                        multiline
                                        value={inputsValues.desc}
                                        onChangeText={(e) => setInputsValues({
                                            ...inputsValues,
                                            desc: e,
                                        })}
                                    />
                                </View>
                            </View>
                        </KeyboardAvoidingView>

                        <View className="w-full mt-6">
                            <Select
                                open
                                duration={500}
                                header={(
                                    <View className="w-full flex gap-3 pt-[2px]">
                                        <TextAnimated className="text-xl tracking-widest">
                                            {t("create_form_icon")}
                                        </TextAnimated>
                                    </View>
                                )}
                            >
                                <View className="w-full flex flex-row flex-wrap gap-5 pt-5">
                                    {
                                        icons.map((Icon, i) => {
                                            return (
                                                <PressableAnimated
                                                    key={i}
                                                    className={clsx(
                                                        "size-[45px] flex justify-center items-center border rounded-full dark:bg-white/10 bg-white",
                                                        i == 0 ? "border-emerald-500/50" : "dark:border-white/10 border-black/10",
                                                    )}
                                                >
                                                    <Icon color={i == 0 ? COLORS.emerald[500] : undefined} />
                                                </PressableAnimated>
                                            )
                                        })
                                    }
                                </View>
                            </Select>
                        </View>
                    </View>
                </View>

                <View className="w-full dark:bg-black bg-white rounded-2xl">
                    <View className="w-full flex items-center gap-5 dark:bg-black bg-black/5 p-5 rounded-2xl">
                        <View className="w-full flex flex-row items-center gap-2">
                            <View className="w-[10%]">
                                <FontAwesome6
                                    name="calendar-day"
                                    size={22}
                                    color={theme == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .5)"}
                                />
                            </View>

                            <Pressable
                                onPress={() => {

                                }}
                                className="w-[88%] dark:bg-white/10 bg-white rounded-2xl px-5 py-3"
                            >
                                <TextAnimated
                                    numberOfLines={1}
                                    dark={inputsValues.title.trim().length > 0 ? "rgba(255, 255, 255, .8)" : "rgba(255, 255, 255, .4)"}
                                    light={inputsValues.title.trim().length > 0 ? "rgba(0, 0, 0, .8)" : "rgba(0, 0, 0, .4)"}
                                    className={clsx(
                                        "text-xl",
                                        inputsValues.title.trim().length > 0 && "tracking-[4px]",
                                    )}
                                >
                                    {inputsValues.title.trim().length == 0 ? t("create_form_date") : inputsValues.title}
                                </TextAnimated>
                            </Pressable>
                        </View>

                        <View className="w-full flex flex-row items-center gap-[10px]">
                            <View className="w-1/2 flex flex-row gap-2 items-center">
                                <View className="w-[20%]">
                                    <View style={{
                                        transform: [
                                            {
                                                translateX: -2
                                            }
                                        ]
                                    }}>
                                        <Ionicons
                                            name="time-sharp"
                                            size={25}
                                            color={theme == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .5)"}
                                        />
                                    </View>
                                </View>

                                <Pressable
                                    onPress={() => {

                                    }}
                                    className="w-[70%] dark:bg-white/10 bg-white rounded-2xl px-5 py-3"
                                >
                                    <TextAnimated
                                        numberOfLines={1}
                                        dark={inputsValues.desc.trim().length > 0 ? "rgba(255, 255, 255, .8)" : "rgba(255, 255, 255, .4)"}
                                        light={inputsValues.desc.trim().length > 0 ? "rgba(0, 0, 0, .8)" : "rgba(0, 0, 0, .4)"}
                                        className={clsx(
                                            "text-xl",
                                            inputsValues.desc.trim().length > 0 && "tracking-[4px]",
                                        )}
                                    >
                                        {inputsValues.desc.trim().length == 0 ? t("create_form_time") : inputsValues.desc}
                                    </TextAnimated>
                                </Pressable>
                            </View>

                            <View className="w-1/2 flex flex-row gap-2 items-center">
                                <View className="w-[20%]">
                                    <FontAwesome6
                                        name="arrow-right"
                                        size={24}
                                        color={theme == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .5)"}
                                    />
                                </View>

                                <Pressable
                                    onPress={() => {

                                    }}
                                    className="w-[70%] dark:bg-white/10 bg-white rounded-2xl px-5 py-3"
                                >
                                    <TextAnimated
                                        numberOfLines={1}
                                        dark={inputsValues.desc.trim().length > 0 ? "rgba(255, 255, 255, .8)" : "rgba(255, 255, 255, .4)"}
                                        light={inputsValues.desc.trim().length > 0 ? "rgba(0, 0, 0, .8)" : "rgba(0, 0, 0, .4)"}
                                        className={clsx(
                                            "text-xl",
                                            inputsValues.desc.trim().length > 0 && "tracking-[4px]",
                                        )}
                                    >
                                        {inputsValues.desc.trim().length == 0 ? t("create_form_time") : inputsValues.desc}
                                    </TextAnimated>
                                </Pressable>
                            </View>
                        </View>

                        <View className="w-full flex flex-row gap-2">
                            <View className="w-[10%] pt-[10px]">
                                <MaterialCommunityIcons
                                    name="bell-ring"
                                    size={24}
                                    color={theme == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .5)"}
                                />
                            </View>

                            <View className="w-[88%] dark:bg-white/10 bg-white rounded-2xl">
                                <Select
                                    chevronPadding={{
                                        paddingTop: 8,
                                        paddingRight: 5,
                                    }}
                                    header={(
                                        <View className="w-full px-5 py-3 rounded-2xl">
                                            <TextAnimated
                                                numberOfLines={1}
                                                dark={inputsValues.title.trim().length > 0 ? "rgba(255, 255, 255, .8)" : "rgba(255, 255, 255, .4)"}
                                                light={inputsValues.title.trim().length > 0 ? "rgba(0, 0, 0, .8)" : "rgba(0, 0, 0, .4)"}
                                                className={clsx(
                                                    "text-xl",
                                                    inputsValues.title.trim().length > 0 && "tracking-[4px]",
                                                )}
                                            >
                                                {inputsValues.title.trim().length == 0 ? t("create_form_time_before") : inputsValues.title}
                                            </TextAnimated>
                                        </View>
                                    )}
                                >
                                    <View className="w-full flex items-center gap-6 dark:bg-black bg-white px-5 py-3 rounded-2xl mt-1">
                                        {
                                            repeatRange.map((val, i) => (
                                                <Pressable
                                                    key={i}
                                                    className="w-full flex flex-row justify-between items-center"
                                                >
                                                    <TextAnimated
                                                        numberOfLines={1}
                                                        dark={inputsValues.title.trim().length > 0 ? "rgba(255, 255, 255, .8)" : "rgba(255, 255, 255, .4)"}
                                                        light={inputsValues.title.trim().length > 0 ? "rgba(0, 0, 0, .8)" : "rgba(0, 0, 0, .4)"}
                                                        className={clsx(
                                                            "text-xl",
                                                            inputsValues.title.trim().length > 0 && "tracking-[4px]",
                                                        )}
                                                    >
                                                        {t(`create_form_time_before`, { time: val })}
                                                    </TextAnimated>

                                                    <Checkbox
                                                        size={25}
                                                        borderWidth={1}
                                                        borderRadius={5}
                                                        checked
                                                    />
                                                </Pressable>
                                            ))
                                        }
                                    </View>
                                </Select>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <LinearGradient
                colors={theme == "dark" ?
                    ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(rgba(0, 0, 0, 0))"]
                    :
                    ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(rgba(255, 255, 255, 0))"]
                }
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                locations={[0, .3, 1]}
                style={{
                    transform: [
                        {
                            translateY: 30,
                        }
                    ]
                }}
                className="absolute left-0 bottom-0 w-full h-[150px]"
            >
                <LinearGradient
                    colors={theme == "dark" ?
                        ["rgba(255, 255, 255, .1)", "rgba(255, 255, 255, .1)", "rgba(rgba(0, 0, 0, 0))"]
                        :
                        ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(rgba(255, 255, 255, 0))"]
                    }
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    locations={[0, .3, 1]}
                    className="size-full flex justify-center items-center"
                >
                    <Button
                        loading={loading}
                        width={150}
                        loaderSize={25}
                        scale={.95}
                    >
                        <Text className="text-2xl text-black font-bold">
                            {t("create_form_submit")}
                        </Text>
                    </Button>
                </LinearGradient>
            </LinearGradient>
        </Container>
    );
}
