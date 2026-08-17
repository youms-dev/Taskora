import { Checkbox } from "@/components/checkbox";
import { Container } from "@/components/container";
import { Calendar } from "@/components/create/calendar";
import { TimePager } from "@/components/create/time-pager";
import { Modal } from "@/components/modal";
import { PressableAnimated } from "@/components/pressable-animated";
import { Select } from "@/components/select";
import { TextAnimated } from "@/components/text-animated";
import { daysTranslation } from "@/constants/calendar";
import { COLORS } from "@/constants/colors";
import { getIcons } from "@/constants/icons";
import { useTheme } from "@/hooks/use-theme";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import clsx from "clsx";
import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FocusEvent, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, TextInputProps, useWindowDimensions, View } from "react-native";
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
        title: null,
        desc: "",
        icon: null,
        date,
        startAt: `${String(date.getHours() + 1).padStart(2, "0")} : ${String(date.getMinutes()).padStart(2, "0")}`,
        endAt: `${String(date.getHours() + 2).padStart(2, "0")} : ${String(date.getMinutes()).padStart(2, "0")}`,
        remindBefore: 30,
    }
    const [inputsValues, setInputsValues] = useState<
        Omit<typeof initialInputsValues, "endAt" | "title" | "remindBefore" | "icon">
        &
        {
            title: string | null;
            icon: string | null;
            remindBefore: number | null;
            endAt: string | null;
        }
    >(initialInputsValues);
    const [loading, setLoading] = useState<boolean>(false);
    const [timeModal, setTimeModal] = useState<{
        target: "start" | "end";
        active: boolean;
    }>({
        target: "start",
        active: false,
    });
    const [dateModalOpened, setDateModalOpened] = useState<boolean>(true);
    const [listHeight, setListHeight] = useState<number>(0);

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

    const handleTime = useCallback((entry: string, target: "hour" | "minute" = "hour") => {
        setInputsValues((prev) => {
            if (timeModal.target === "start") {
                const [hour, min] = prev.startAt.split(":");

                return {
                    ...prev,
                    startAt: target === "hour" ?
                        `${entry.trim()} : ${min.trim()}`
                        :
                        `${hour.trim()} : ${entry.trim()}`,
                };
            }

            if (timeModal.target === "end") {
                if (!prev.endAt) {
                    return {
                        ...prev,
                        endAt: target === "hour" ?
                            `${entry.trim()} : 00`
                            :
                            `00 : ${entry.trim()}`,
                    };
                }

                const [hour, min] = prev.endAt.split(":");

                return {
                    ...prev,
                    endAt:
                        target === "hour" ?
                            `${entry.trim()} : ${min.trim()}`
                            :
                            `${hour.trim()} : ${entry.trim()}`,
                };
            }

            return prev;
        });
    }, [timeModal]);

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
                                        value={inputsValues.title ?? undefined}
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
                                // open
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
                                        icons.map((item, i) => {
                                            const [data] = Object.entries(item);
                                            const [key, Icon] = data;

                                            return (
                                                <PressableAnimated
                                                    key={String(key + i)}
                                                    scale={.95}
                                                    onPress={() => {
                                                        if (inputsValues.icon && inputsValues.icon == key) {
                                                            setInputsValues({
                                                                ...inputsValues,
                                                                icon: null,
                                                            });
                                                        }
                                                        else {
                                                            setInputsValues({
                                                                ...inputsValues,
                                                                icon: key,
                                                            });
                                                        }
                                                    }}
                                                    className={clsx(
                                                        "size-[45px] flex justify-center items-center border rounded-full dark:bg-white/10 bg-white",
                                                        inputsValues.icon && inputsValues.icon == key ? "border-emerald-500/50" : "dark:border-white/10 border-black/10",
                                                    )}
                                                >
                                                    <Icon color={inputsValues.icon && inputsValues.icon == key ? COLORS.emerald[500] : undefined} />
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
                                onPress={() => setDateModalOpened(true)}
                                className="w-[88%] dark:bg-white/10 bg-white rounded-2xl px-5 py-3"
                            >
                                <TextAnimated
                                    numberOfLines={1}
                                    className={clsx(
                                        "text-xl",
                                        String(inputsValues.date).trim().length > 0 ? "tracking-wide" : "opacity-50",
                                    )}
                                >
                                    {
                                        String(inputsValues.date).trim().length == 0 ?
                                            t("create_form_date")
                                            :
                                            `${daysTranslation[i18n.language][inputsValues.date.getDay()]},  ${format(inputsValues.date, i18n.language == "en" ? "M / dd / yyyy" : "dd / MM / yyyy")}`
                                    }
                                </TextAnimated>
                            </Pressable>
                        </View>

                        <View className={clsx(
                            "w-full flex flex-row items-center",
                            target == "task" ? "gap-5" : "gap-[10px]",
                        )}>
                            <View className={clsx(
                                "flex flex-row gap-2 items-center",
                                target == "task" ? "w-full" : "w-1/2",
                            )}>
                                <View className={clsx(
                                    target == "task" ? "w-[10%]" : "w-[20%]",
                                )}>
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
                                        setTimeModal({
                                            target: "start",
                                            active: true,
                                        });
                                    }}
                                    className={clsx(
                                        "dark:bg-white/10 bg-white rounded-2xl px-5 py-3",
                                        target == "task" ? "w-[88%]" : "w-[70%]",
                                    )}
                                >
                                    <TextAnimated
                                        numberOfLines={1}
                                        className="text-xl"
                                    >
                                        {inputsValues.startAt}
                                    </TextAnimated>
                                </Pressable>
                            </View>

                            {
                                target == "event" && (
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
                                                setTimeModal({
                                                    target: "end",
                                                    active: true,
                                                });
                                            }}
                                            className="w-[70%] dark:bg-white/10 bg-white rounded-2xl px-5 py-3"
                                        >
                                            <TextAnimated
                                                numberOfLines={1}
                                                className="text-xl"
                                            >
                                                {!inputsValues.endAt ? t("create_form_time") : inputsValues.endAt}
                                            </TextAnimated>
                                        </Pressable>
                                    </View>
                                )
                            }
                        </View>

                        {
                            target == "event" && (
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
                                                        dark={inputsValues.remindBefore && inputsValues.remindBefore > 0 ? "rgba(255, 255, 255, .8)" : "rgba(255, 255, 255, .4)"}
                                                        light={inputsValues.remindBefore && inputsValues.remindBefore > 0 ? "rgba(0, 0, 0, .8)" : "rgba(0, 0, 0, .4)"}
                                                        className="text-xl tracking-widest"
                                                    >
                                                        {
                                                            !inputsValues.remindBefore ?
                                                                t("create_form_time_before")
                                                                :
                                                                t(`create_form_time_before`, { time: inputsValues.remindBefore })
                                                        }
                                                    </TextAnimated>
                                                </View>
                                            )}
                                        >
                                            <View className="w-full flex items-center gap-6 dark:bg-black bg-white px-5 py-3 rounded-2xl">
                                                {
                                                    repeatRange.map((val, i) => (
                                                        <Pressable
                                                            key={i}
                                                            onPress={() => setInputsValues({
                                                                ...inputsValues,
                                                                remindBefore: val,
                                                            })}
                                                            className="w-full flex flex-row justify-between items-center"
                                                        >
                                                            <TextAnimated
                                                                numberOfLines={1}
                                                                dark="rgba(255, 255, 255, .8)"
                                                                light="rgba(0, 0, 0, .8)"
                                                                className="text-xl"
                                                            >
                                                                {t(`create_form_time_before`, { time: val })}
                                                            </TextAnimated>

                                                            <Checkbox
                                                                size={25}
                                                                borderWidth={1}
                                                                borderRadius={5}
                                                                checked={inputsValues.remindBefore == val}
                                                                onPress={() => setInputsValues({
                                                                    ...inputsValues,
                                                                    remindBefore: val,
                                                                })}
                                                            />
                                                        </Pressable>
                                                    ))
                                                }
                                            </View>
                                        </Select>
                                    </View>
                                </View>
                            )
                        }
                    </View>
                </View>
            </ScrollView>

            {/* Form submit button */}

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
                    <PressableAnimated
                        scale={.95}
                        disabled={loading}
                        onPress={() => {
                            console.log("inputs values :", inputsValues);
                        }}
                        className={clsx(
                            "w-[80%] sm:w-[300px] h-[50px] dark:bg-black bg-white rounded-3xl",
                            loading && "opacity-50",
                        )}
                    >
                        <View
                            style={{
                                transform: [
                                    {
                                        translateY: 8,
                                    }
                                ],
                                filter: "blur(5px)",
                            }}
                            className={clsx(
                                "size-full rounded-3xl",
                                loading ? "dark:bg-black/50 bg-black/10" : "dark:bg-back/50 bg-black/30",
                            )}
                        />

                        <View className="absolute w-full h-full dark:bg-black bg-white rounded-3xl z-[1]">
                            <View className="size-full flex flex-row justify-center items-center px-3 py-2 rounded-3xl border dark:border-white/5 border-black/10 dark:bg-black bg-white">
                                {
                                    loading ?
                                        (
                                            <ActivityIndicator
                                                size={30}
                                                color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .9)"}
                                            />
                                        )
                                        :
                                        (
                                            <TextAnimated
                                                numberOfLines={1}
                                                dark="rgba(255, 255, 255, .9)"
                                                light="rgba(0, 0, 0, .9)"
                                                className="text-2xl font-bold"
                                            >
                                                {t("create_form_submit")}
                                            </TextAnimated>
                                        )
                                }
                            </View>
                        </View>
                    </PressableAnimated>
                </LinearGradient>
            </LinearGradient>

            {/* Time modal */}

            <Modal
                active={timeModal.active}
                animationDuration={500}
                onClose={() => setTimeModal({
                    ...timeModal,
                    active: false,
                })}
                height={screenHeight * .45}
                backdropBackground={theme == "dark" ? "rgba(0, 0, 0, .2)" : "rgba(0, 0, 0, .5)"}
                className="flex items-center border-2 dark:border-white/10 border-black/10 border-x-transparent border-b-transparent dark:bg-black bg-white"
                rounded={20}
                closeAnimationDuration={600}
                closable={false}
                scrollableContent={false}
                dragHandler={(
                    <View className="w-full dark:bg-black bg-white">
                        <View className="size-full flex flex-row justify-between items-center pt-6 pb-2 dark:bg-white/5 bg-white rounded-t-[20px]">
                            <View className="w-[80%] px-3">
                                <TextAnimated
                                    numberOfLines={1}
                                    className="text-xl tracking-wide"
                                >
                                    {t("create_form_time")}
                                </TextAnimated>
                            </View>

                            <View className="w-[20%] flex items-end px-3">
                                <PressableAnimated
                                    onPress={() => {
                                        setTimeModal({
                                            ...timeModal,
                                            active: false,
                                        });
                                    }}
                                    className="size-[45px] rounded-full"
                                >
                                    <View
                                        style={{
                                            transform: [
                                                {
                                                    translateY: 6,
                                                }
                                            ],
                                            filter: "blur(5px)",
                                        }}
                                        className="absolute left-0 top-0 size-full bg-black/30 rounded-full"
                                    />

                                    <View className="size-full dark:bg-black bg-white rounded-full">
                                        <View className="size-full flex justify-center items-center dark:bg-white/10 bg-white border dark:border-white/10 border-black/10 rounded-full">
                                            <FontAwesome6
                                                name="xmark"
                                                size={25}
                                                color={theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)"}
                                            />
                                        </View>
                                    </View>
                                </PressableAnimated>
                            </View>
                        </View>
                    </View>
                )}
            >
                <View className="w-full h-full pt-[80px] pb-[80px] dark:bg-white/5 bg-white">
                    <View
                        onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}
                        className="size-full flex flex-row justify-center gap-[20px] px-5"
                    >
                        <View className="w-[100px] h-full">
                            <TimePager
                                height={listHeight}
                                onIndexChanged={handleTime}
                                initialIndex={timeModal.target == "start" ?
                                    (Number(inputsValues.startAt.split(":").shift()) ?? 0)
                                    :
                                    (
                                        inputsValues.endAt ?
                                            Number(inputsValues.endAt.split(":").shift()) ?? 0
                                            :
                                            0
                                    )
                                }
                            />
                        </View>

                        <View className="h-full flex justify-center items-center pb-1">
                            <TextAnimated
                                numberOfLines={1}
                                className="text-4xl font-bold"
                            >
                                :
                            </TextAnimated>
                        </View>

                        <View className="w-[100px] h-full">
                            <TimePager
                                height={listHeight}
                                target="minutes"
                                onIndexChanged={handleTime}
                                initialIndex={timeModal.target == "start" ?
                                    (Number(inputsValues.startAt.split(":").pop()) ?? 0)
                                    :
                                    (
                                        inputsValues.endAt ?
                                            Number(inputsValues.endAt.split(":").pop()) ?? 0
                                            :
                                            0
                                    )
                                }
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Date modal */}

            <Modal
                active={dateModalOpened}
                animationDuration={500}
                onClose={() => setDateModalOpened(false)}
                height={screenHeight * .6}
                backdropBackground={theme == "dark" ? "rgba(0, 0, 0, .2)" : "rgba(0, 0, 0, .5)"}
                className="flex items-center border-2 dark:border-white/10 border-black/10 border-x-transparent border-b-transparent dark:bg-black bg-white"
                rounded={20}
                closeAnimationDuration={600}
                scrollableContent={false}
                dragHandler={(
                    <View className="w-full dark:bg-black bg-white">
                        <View className="size-full flex flex-row justify-between items-center pt-6 pb-2 dark:bg-white/5 bg-white rounded-t-[20px]">
                            <View className="w-[80%] px-3">
                                <TextAnimated
                                    numberOfLines={1}
                                    className="text-xl tracking-wide"
                                >
                                    {t("create_form_date")}
                                </TextAnimated>
                            </View>

                            <View className="w-[20%] flex items-end px-3">
                                <PressableAnimated
                                    onPress={() => setDateModalOpened(false)}
                                    className="size-[45px] rounded-full"
                                >
                                    <View
                                        style={{
                                            transform: [
                                                {
                                                    translateY: 6,
                                                }
                                            ],
                                            filter: "blur(5px)",
                                        }}
                                        className="absolute left-0 top-0 size-full bg-black/30 rounded-full"
                                    />

                                    <View className="size-full dark:bg-black bg-white rounded-full">
                                        <View className="size-full flex justify-center items-center dark:bg-white/10 bg-white border dark:border-white/10 border-black/10 rounded-full">
                                            <FontAwesome6
                                                name="xmark"
                                                size={25}
                                                color={theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)"}
                                            />
                                        </View>
                                    </View>
                                </PressableAnimated>
                            </View>
                        </View>
                    </View>
                )}
            >
                <View className="w-full h-full flex items-center pt-[80px] pb-[80px] dark:bg-white/5 bg-white">
                    <Calendar />
                </View>
            </Modal>
        </Container>
    )
}
