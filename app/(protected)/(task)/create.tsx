import { Container } from "@/components/container";
import { PressableAnimated } from "@/components/pressable-animated";
import { Select } from "@/components/select";
import { TextAnimated } from "@/components/text-animated";
import { COLORS } from "@/constants/colors";
import { getIcons } from "@/constants/icons";
import { useTheme } from "@/hooks/use-theme";
import Entypo from "@expo/vector-icons/Entypo";
import clsx from "clsx";
import { useRouter } from "expo-router";
import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FocusEvent, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, TextInputProps, useWindowDimensions, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

interface Props extends TextInputProps {
    onFocus?: (e?: FocusEvent) => void;
    onBlur?: (e?: FocusEvent) => void;
    value?: string;
    ref?: RefObject<TextInput>;
}

const Input = ({ onFocus, onBlur, value = "", ref: inputRef, ...rest }: Props) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const ref = useRef<TextInput>(inputRef?.current);
    const focus = useSharedValue<boolean>(false);

    const titleAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: withTiming(focus.value ? 0 : 16, {
                    duration: 200,
                    easing: Easing.inOut(Easing.quad),
                }),
            },
            {
                translateY: withTiming(focus.value ? -25 : 14, {
                    duration: 200,
                    easing: Easing.inOut(Easing.quad),
                }),
            },
        ]
    }));

    useEffect(() => {
        const onHide = () => {
            ref.current?.blur();
        }
        const { remove } = Keyboard.addListener("keyboardDidHide", onHide);

        return () => remove();
    }, []);

    return (
        <View className="w-full">
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
                className="w-full h-[50px] dark:bg-white/10 bg-white rounded-2xl dark:text-white/80 text-black/80 text-xl px-5"
            />

            <TextAnimated
                style={titleAnimation}
                className="absolute text-xl tracking-widest"
            >
                {t("create_form_title")}
            </TextAnimated>
        </View>
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

            <View
                style={{
                    height: screenHeight - 110,
                    transform: [
                        {
                            translateY: 110,
                        }
                    ]
                }}
                className="absolute left-0 top-0 w-full dark:bg-black bg-white rounded-t-[30px]"
            >
                <ScrollView
                    horizontal={false}
                    showsVerticalScrollIndicator={false}
                    className="w-full h-full dark:bg-black bg-[rgba(0,0,0,.06)] rounded-t-[30px]"
                    contentContainerClassName="w-full flex items-center px-5 pt-12 pb-[100px]"
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS == "android" ? "height" : "padding"}
                        className="w-full"
                    >
                        <Input />
                    </KeyboardAvoidingView>

                    <View className="w-full mt-6">
                        <Select
                            open
                            duration={500}
                            header={(
                                <View className="w-full flex gap-3 pt-[3px]">
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

                </ScrollView>
            </View>
        </Container>
    );
}
