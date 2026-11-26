import { Button } from "@/components/button";
import { CodeInput } from "@/components/code-input";
import { Container } from "@/components/container";
import { Input } from "@/components/input";
import { PressableAnimated } from "@/components/pressable-animated";
import { Rotate } from "@/components/rotate";
import { TextAnimated } from "@/components/text-animated";
import { TextGradient } from "@/components/text-gradient";
import { COLORS } from "@/constants/colors";
import { EMAIL_FORMAT_ERROR, EMAIL_LENGTH_ERROR } from "@/constants/errors";
import { APP_NAME } from "@/constants/names";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/axios";
import { ApiError } from "@/types/errors";
import { Entypo, FontAwesome5, Fontisto } from "@expo/vector-icons";
import clsx from "clsx";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, BackHandler, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, { Easing, FadeInDown, FadeOutDown, SlideInLeft, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

interface Props {
    active: boolean;
    index: number;
}

const Circle = memo(({ active, index }: Props) => {
    const isActive = useSharedValue<boolean>(active);

    useEffect(() => {
        isActive.value = active;
    }, [active]);

    const animation = useAnimatedStyle(() => ({
        width: withTiming(isActive.value ? 50 : 20, {
            duration: 300,
            easing: Easing.inOut(Easing.quad),
        }),
        height: 20,
    }));

    return (
        <Animated.View
            key={index}
            style={animation}
            className={clsx(
                active ? "rounded-3xl bg-emerald-500" : "size-[20px] rounded-full dark:bg-white/10 bg-white",
            )}
        />
    );
})

export default function ResetPassword() {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const { theme } = useTheme();
    const [step, setStep] = useState<number>(1);
    const initialInputsValues = {
        email: "",
        code: "",
        password: "",
        confirmPassword: "",
    }
    const [inputsValues, setInputsValues] = useState<typeof initialInputsValues>(initialInputsValues);
    const emailRef = useRef<TextInput>(null);
    const codeRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);
    const confirmPasswordRef = useRef<TextInput>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const loadingRef = useRef<boolean>(false);
    const { setToast } = useToast();

    useEffect(() => {
        const { remove } = BackHandler.addEventListener("hardwareBackPress", () => {
            if (step == 1) {
                router.dismissTo({
                    pathname: "/",
                });
                return false;
            }
            changeStep("prev");
            return true;
        });

        return () => remove();
    }, [step]);

    const changeStep = useCallback((entry: number | "prev" | "next") => {
        if (typeof entry == "number") {
            setStep(prev => entry > 0 && entry < 4 ? entry : prev);
        }
        else {
            setStep(prev => {
                if (entry == "prev") {
                    return prev > 1 ? prev - 1 : prev;
                }
                else {
                    return prev < 3 ? prev + 1 : prev;
                }
            });
        }
    }, []);

    const handleCheckEmail = useCallback(async () => {
        if (loadingRef.current) return;

        if (inputsValues.email.trim().length == 0) {
            emailRef.current?.focus();
            return;
        }

        try {
            setLoading(true);
            loadingRef.current = true;

            await api.post("/auth/reset-password/check-email", {
                email: inputsValues.email.trim(),
            });

            changeStep("next");
        }
        catch (e) {
            const { status, data } = e as ApiError;

            if (status == 429) {
                setToast(t("reset_password_429"), "error", 5000);
            }
            else if (status == 404) {
                setToast(t("reset_password_404"), "error");
            }
            else if (status == 403) {
                setToast(t("reset_password_403"), "default", 5000);
                if (router.canGoBack()) {
                    router.back();
                }
                else {
                    router.dismissTo({
                        pathname: "/(protected)/(tabs)",
                    });
                }
            }
            else if (status == 400 && data.message && Array.isArray(data.message)) {
                const messages = data.message as Array<string>;

                if (messages.includes(EMAIL_LENGTH_ERROR)) {
                    setToast(t("reset_password_error_email_length"), "error", 5000);
                    emailRef.current?.focus();
                }
                else if (messages.includes(EMAIL_FORMAT_ERROR)) {
                    setToast(t("reset_password_error_email_format"), "error", 5000);
                    emailRef.current?.focus();
                }
                else {
                    setToast(t("error"), "error");
                }
            }
            else {
                setToast(t("error"), "error");
            }
        }
        finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [inputsValues, setToast, i18n.language]);

    const handleResendCode = useCallback(async () => {
        if (loadingRef.current) return;

        if (inputsValues.email.trim().length == 0) {
            changeStep("prev");
            emailRef.current?.focus();
            return;
        }

        try {
            setLoading(true);
            loadingRef.current = true;

            await api.post("/auth/reset-password/resend-code", {
                email: inputsValues.email.trim(),
            });

            setToast(t("reset_password_code_resent"), "success");
        }
        catch (e) {
            const { status } = e as ApiError;

            if (status == 429) {
                setToast(t("reset_password_429"), "error", 5000);
            }
            else if (status == 404) {
                setToast(t("reset_password_404"), "error");
            }
            else {
                setToast(t("error"), "error");
            }
        }
        finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [inputsValues, setToast, i18n.language]);

    const handleCheckCode = useCallback(async () => {
        if (loadingRef.current) return;

        if (inputsValues.email.trim().length == 0) {
            changeStep("prev");
            emailRef.current?.focus();
            return;
        }
        else if (inputsValues.code.trim().length != 5) {
            codeRef.current?.focus();
            return;
        }

        try {
            setLoading(true);
            loadingRef.current = true;

            await api.post("/auth/reset-password/check-code", {
                email: inputsValues.email.trim(),
                code: inputsValues.code.trim(),
            });

            changeStep("next");
        }
        catch (e) {
            const { status } = e as ApiError;

            if (status == 429) {
                setToast(t("reset_password_429"), "error", 5000);
            }
            else if (status == 404) {
                setToast(t("reset_password_code_404"), "error", 5000);
            }
            else if (status == 400) {
                setToast(t("reset_password_code_400"), "error", 5000);
            }
            else {
                setToast(t("error"), "error");
            }
        }
        finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [inputsValues, setToast, i18n.language]);

    const handleResetPassword = useCallback(async () => {
        if (loadingRef.current) return;

        if (inputsValues.password.trim().length < 8) {
            passwordRef.current?.focus();
            return;
        }
        else if (inputsValues.confirmPassword.trim().length == 0) {
            confirmPasswordRef.current?.focus();
            return;
        }
        else if (inputsValues.confirmPassword.trim() != inputsValues.password.trim()) {
            setToast(t("reset_password_mismatch_error"), "warning");
            confirmPasswordRef.current?.focus();
            return;
        }

        try {
            setLoading(true);
            loadingRef.current = true;

            await api.patch("/auth/reset-password", {
                email: inputsValues.email.trim(),
                password: inputsValues.password,
            });

            setToast(t("reset_password_success"), "success", 5000);

            if (router.canGoBack()) {
                router.back();
            }
            else {
                router.dismissTo({
                    pathname: "/(protected)/(tabs)",
                });
            }
        }
        catch (e) {
            console.log(e);
            const { status } = e as ApiError;

            if (status == 429) {
                setToast(t("reset_password_429"), "error", 5000);
            }
            else {
                setToast(t("error"), "error");
            }
        }
        finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [inputsValues, setToast, i18n.language]);

    return (
        <Container centerX>

            {/* Header */}

            <Animated.View
                entering={SlideInLeft
                    .duration(300)
                    .easing(Easing.inOut(Easing.quad))
                }
                style={{
                    transform: [
                        {
                            translateX: 10,
                        },
                        {
                            translateY: 10,
                        },
                    ]
                }}
                className="absolute left-0 top-0 size-[50px] dark:bg-black bg-white rounded-full z-[10]"
            >
                <PressableAnimated
                    scale={.95}
                    onPress={() => {
                        if (router.canGoBack()) {
                            router.back();
                            return;
                        }
                        router.navigate({
                            pathname: "/(protected)/(tabs)",
                        });
                    }}
                    className="size-full rounded-full"
                >
                    <View
                        style={{
                            transform: [
                                {
                                    translateY: 7,
                                },
                            ],
                            filter: "blur(5px)",
                        }}
                        className="absolute left-0 top-0 size-full rounded-full bg-black/20"
                    />

                    <View className="size-full flex justify-center items-center rounded-full dark:bg-white/10 bg-white border dark:border-white/5 border-black/10">
                        <Entypo
                            name="chevron-left"
                            size={30}
                            color={theme == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .5)"}
                        />
                    </View>
                </PressableAnimated>
            </Animated.View>

            {/* Indicators */}

            <View className="left-0 w-full h-[50px] flex flex-row justify-center items-end gap-2 px-3">
                {
                    Array(3).fill(0).map((_, i) => {
                        const active = step == i + 1;

                        return (
                            <Circle
                                key={i}
                                active={active}
                                index={i}
                            />
                        )
                    })
                }
            </View>

            {/* Content */}

            <View className="w-full max-h-[88%] flex items-center">
                <KeyboardAwareScrollView
                    horizontal={false}
                    showsVerticalScrollIndicator={false}
                    bottomOffset={15}
                    className="sm:w-[500px] w-full h-full"
                    contentContainerClassName="w-full"
                >
                    {/* Step 1 */}

                    {
                        step == 1 && (
                            <Animated.View
                                entering={FadeInDown
                                    .duration(300)
                                    .easing(Easing.inOut(Easing.quad))
                                }
                                exiting={FadeOutDown
                                    .duration(300)
                                    .easing(Easing.inOut(Easing.quad))
                                }
                                className="w-full flex items-center px-3"
                            >

                                {/* Section 1 */}

                                <View className="w-full flex flex-row justify-center px-3 mt-[100px] pb-[20px]">
                                    <View className="flex items-center">
                                        <TextAnimated
                                            dark="rgba(255, 255, 255, 1)"
                                            light="rgba(0, 0, 0, 1)"
                                            className="text-3xl font-medium text-center"
                                        >
                                            {t("reset_password_step_1_item_1")}
                                        </TextAnimated>

                                        <View
                                            style={{
                                                transform: [
                                                    {
                                                        rotateX: "80deg"
                                                    },
                                                    {
                                                        translateY: 150,
                                                    },
                                                ],
                                                filter: "blur(25px)",
                                            }}
                                            className="absolute bottom-0 w-full h-[40px] dark:bg-white/50 bg-black/80 rounded-full"
                                        />
                                    </View>
                                </View>

                                {/* Section 2 */}

                                <View className="w-full flex items-center px-3 mt-3">
                                    <TextAnimated className="text-lg text-center">
                                        {t("reset_password_step_1_item_2")}
                                    </TextAnimated>
                                </View>

                                {/* Section 3 */}

                                <View className="w-full flex items-center gap-[50px] px-3 mt-8">
                                    <Input
                                        ref={emailRef}
                                        label="Email"
                                        placeholder="email@example.com"
                                        autoCapitalize="none"
                                        value={inputsValues.email}
                                        onChangeText={(e) => setInputsValues(prev => ({
                                            ...prev,
                                            email: e,
                                        }))}
                                        icon={(
                                            <View
                                                style={{
                                                    transform: [
                                                        {
                                                            translateX: 15,
                                                        },
                                                        {
                                                            translateY: 45,
                                                        },
                                                    ]
                                                }}
                                                className="absolute left-0 top-0 pointer-events-none"
                                            >
                                                <FontAwesome5
                                                    name="envelope-open-text"
                                                    size={22}
                                                    color={theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)"}
                                                />
                                            </View>
                                        )}
                                        onSubmitEditing={handleCheckEmail}
                                    />

                                    <Button
                                        width={200}
                                        height={50}
                                        scale={.95}
                                        loading={loading}
                                        loaderSize={25}
                                        onPress={handleCheckEmail}
                                    >
                                        <Text
                                            numberOfLines={1}
                                            className="text-2xl text-black font-bold"
                                        >
                                            {t("reset_password_step_1_item_3")}
                                        </Text>
                                    </Button>
                                </View>
                            </Animated.View>
                        )
                    }

                    {
                        step == 2 && (
                            <Animated.View
                                entering={FadeInDown
                                    .duration(300)
                                    .easing(Easing.inOut(Easing.quad))
                                }
                                exiting={FadeOutDown
                                    .duration(300)
                                    .easing(Easing.inOut(Easing.quad))
                                }
                                className="w-full flex items-center px-3"
                            >

                                {/* Section 1 */}

                                <View className="w-full flex flex-row justify-center px-3 mt-[100px] pb-[20px]">
                                    <View className="flex items-center">
                                        <TextAnimated
                                            dark="rgba(255, 255, 255, 1)"
                                            light="rgba(0, 0, 0, 1)"
                                            className="text-3xl font-medium text-center"
                                        >
                                            {t("reset_password_step_2_item_1")}
                                        </TextAnimated>

                                        <View
                                            style={{
                                                transform: [
                                                    {
                                                        rotateX: "80deg"
                                                    },
                                                    {
                                                        translateY: 150,
                                                    },
                                                ],
                                                filter: "blur(25px)",
                                            }}
                                            className="absolute bottom-0 w-full h-[40px] dark:bg-white/50 bg-black/80 rounded-full"
                                        />
                                    </View>
                                </View>

                                {/* Section 2 */}

                                <View className="w-full flex items-center px-3 mt-3">
                                    <TextAnimated className="text-lg text-center">
                                        {t("reset_password_step_2_item_2")}
                                    </TextAnimated>

                                    <Text className="text-lg font-bold text-emerald-500">
                                        {inputsValues.email.toLowerCase().trim()}
                                    </Text>
                                </View>

                                {/* Section 3 */}

                                <View className="w-full flex items-center gap-4 px-3 mt-8">
                                    <CodeInput
                                        ref={codeRef}
                                        value={inputsValues.code}
                                        setValue={(e) => setInputsValues(prev => ({
                                            ...prev,
                                            code: e,
                                        }))}
                                        onSubmitEditing={handleCheckCode}
                                    />

                                    <View className="w-full mt-5">
                                        <PressableAnimated
                                            scale={.95}
                                            disabled={loading}
                                            onPress={handleResendCode}
                                            className="flex flex-row flex-wrap items-center gap-5"
                                        >
                                            <TextAnimated className={clsx(
                                                "text-lg",
                                                loading && "opacity-50",
                                            )}>
                                                {t("reset_password_step_2_item_4")}
                                            </TextAnimated>

                                            <Rotate rotate={loading} />
                                        </PressableAnimated>
                                    </View>
                                </View>

                                {/* Section 4 */}

                                <View className="w-full flex flex-row justify-center items-center gap-3 mt-10">
                                    <PressableAnimated
                                        scale={.95}
                                        disabled={loading}
                                        onPress={() => {
                                            changeStep("prev");
                                            setInputsValues(prev => ({
                                                ...prev,
                                                code: "",
                                            }));
                                        }}
                                        className={clsx(
                                            "w-[35%] h-[50px] rounded-2xl dark:bg-black bg-white",
                                            loading && "opacity-50",
                                        )}
                                    >
                                        <View className="w-full h-full flex justify-center items-center dark:bg-white/10 bg-black/80 px-3 rounded-2xl border dark:border-white/5 border-white/5">
                                            {
                                                loading ?
                                                    (
                                                        <ActivityIndicator
                                                            size={30}
                                                            color="rgba(255, 255, 255, .8)"
                                                        />
                                                    )
                                                    :
                                                    (
                                                        <Text
                                                            numberOfLines={1}
                                                            ellipsizeMode="clip"
                                                            className="text-2xl text-white/80 font-medium"
                                                        >
                                                            {t("reset_password_prev")}
                                                        </Text>
                                                    )
                                            }
                                        </View>
                                    </PressableAnimated>

                                    <PressableAnimated
                                        scale={.95}
                                        disabled={loading}
                                        onPress={handleCheckCode}
                                        className={clsx(
                                            "w-[60%] h-[50px] rounded-2xl dark:bg-black bg-white",
                                            loading && "opacity-50",
                                        )}
                                    >
                                        <View className="w-full h-full flex justify-center items-center bg-emerald-500 px-3 rounded-2xl border dark:border-white/5 border-white/5">
                                            {
                                                loading ?
                                                    (
                                                        <ActivityIndicator
                                                            size={30}
                                                            color="rgba(255, 255, 255, .8)"
                                                        />
                                                    )
                                                    :
                                                    (
                                                        <Text
                                                            numberOfLines={1}
                                                            ellipsizeMode="clip"
                                                            className="text-2xl text-black font-extrabold"
                                                        >
                                                            {t("reset_password_step_2_item_3")}
                                                        </Text>
                                                    )
                                            }
                                        </View>
                                    </PressableAnimated>
                                </View>
                            </Animated.View>
                        )
                    }

                    {
                        step == 3 && (
                            <Animated.View
                                entering={FadeInDown
                                    .duration(300)
                                    .easing(Easing.inOut(Easing.quad))
                                }
                                exiting={FadeOutDown
                                    .duration(300)
                                    .easing(Easing.inOut(Easing.quad))
                                }
                                className="w-full flex items-center px-3"
                            >

                                {/* Section 1 */}

                                <View className="w-full flex flex-row justify-center px-3 mt-[100px] pb-[20px]">
                                    <View className="flex items-center">
                                        <TextAnimated
                                            dark="rgba(255, 255, 255, 1)"
                                            light="rgba(0, 0, 0, 1)"
                                            className="text-3xl font-medium text-center"
                                        >
                                            {t("reset_password_step_3_item_1")}
                                        </TextAnimated>

                                        <View
                                            style={{
                                                transform: [
                                                    {
                                                        rotateX: "80deg"
                                                    },
                                                    {
                                                        translateY: 150,
                                                    },
                                                ],
                                                filter: "blur(25px)",
                                            }}
                                            className="absolute bottom-0 w-full h-[40px] dark:bg-white/50 bg-black/80 rounded-full"
                                        />
                                    </View>
                                </View>

                                {/* Section 2 */}

                                <View className="w-full flex items-center mt-8">
                                    <View className="w-full flex items-center gap-8 px-3">
                                        <View className="w-full flex items-center gap-3">
                                            <Input
                                                ref={passwordRef}
                                                label={(t("reset_password_step_3_item_2"))}
                                                placeholder="• • • • • • • •"
                                                value={inputsValues.password}
                                                onChangeText={(e) => setInputsValues(prev => ({
                                                    ...prev,
                                                    password: e,
                                                }))}
                                                eye
                                                icon={(
                                                    <View
                                                        style={{
                                                            transform: [
                                                                {
                                                                    translateX: 15,
                                                                },
                                                                {
                                                                    translateY: 45,
                                                                },
                                                            ]
                                                        }}
                                                        className="absolute left-0 top-0 pointer-events-none"
                                                    >
                                                        <Fontisto
                                                            name="locked"
                                                            size={22}
                                                            color={theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)"}
                                                        />
                                                    </View>
                                                )}
                                            />

                                            <View className="w-full flex flex-row items-center">
                                                <TextAnimated className="text-xl">
                                                    {t("reset_password_step_3_item_5")} :
                                                    &nbsp;
                                                    <Text className={clsx(
                                                        "font-bold",
                                                        inputsValues.password.length >= 8 ? "text-emerald-500" : "text-amber-500",
                                                    )}>
                                                        {inputsValues.password.length}
                                                    </Text>
                                                </TextAnimated>
                                            </View>
                                        </View>

                                        <Input
                                            ref={confirmPasswordRef}
                                            label={(t("reset_password_step_3_item_3"))}
                                            placeholder="• • • • • • • •"
                                            visible={false}
                                            value={inputsValues.confirmPassword}
                                            onChangeText={(e) => setInputsValues(prev => ({
                                                ...prev,
                                                confirmPassword: e,
                                            }))}
                                            icon={(
                                                <View
                                                    style={{
                                                        transform: [
                                                            {
                                                                translateX: 15,
                                                            },
                                                            {
                                                                translateY: 45,
                                                            },
                                                        ]
                                                    }}
                                                    className="absolute left-0 top-0 pointer-events-none"
                                                >
                                                    <Fontisto
                                                        name="locked"
                                                        size={22}
                                                        color={theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)"}
                                                    />
                                                </View>
                                            )}
                                        />
                                    </View>

                                    <View className="w-full flex flex-row justify-center items-center gap-3 mt-10">
                                        <PressableAnimated
                                            scale={.95}
                                            disabled={loading}
                                            onPress={() => changeStep("prev")}
                                            className={clsx(
                                                "w-[35%] h-[50px] rounded-2xl dark:bg-black bg-white",
                                                loading && "opacity-50",
                                            )}
                                        >
                                            <View className="w-full h-full flex justify-center items-center dark:bg-white/10 bg-black/80 px-3 rounded-2xl border dark:border-white/5 border-white/5">
                                                {
                                                    loading ?
                                                        (
                                                            <ActivityIndicator
                                                                size={30}
                                                                color="rgba(255, 255, 255, .8)"
                                                            />
                                                        )
                                                        :
                                                        (
                                                            <Text
                                                                numberOfLines={1}
                                                                ellipsizeMode="clip"
                                                                className="text-2xl text-white/80 font-medium"
                                                            >
                                                                {t("reset_password_prev")}
                                                            </Text>
                                                        )
                                                }
                                            </View>
                                        </PressableAnimated>

                                        <PressableAnimated
                                            scale={.95}
                                            disabled={loading}
                                            onPress={handleResetPassword}
                                            className={clsx(
                                                "w-[60%] h-[50px] rounded-2xl dark:bg-black bg-white",
                                                loading && "opacity-50",
                                            )}
                                        >
                                            <View className="w-full h-full flex justify-center items-center bg-emerald-500 px-3 rounded-2xl border dark:border-white/5 border-white/5">
                                                {
                                                    loading ?
                                                        (
                                                            <ActivityIndicator
                                                                size={30}
                                                                color="rgba(255, 255, 255, .8)"
                                                            />
                                                        )
                                                        :
                                                        (
                                                            <Text
                                                                numberOfLines={1}
                                                                ellipsizeMode="clip"
                                                                className="text-2xl text-black font-extrabold"
                                                            >
                                                                {t("reset_password_step_3_item_4")}
                                                            </Text>
                                                        )
                                                }
                                            </View>
                                        </PressableAnimated>
                                    </View>
                                </View>
                            </Animated.View>
                        )
                    }

                </KeyboardAwareScrollView>
            </View>

            {/* Footer */}

            <View className="w-full flex flex-row justify-center px-3 pb-5">
                <TextGradient
                    colors={[
                        theme == "dark" ?
                            "rgba(255, 255, 255, .8)"
                            :
                            "rgba(0, 0, 0, .8)"
                        ,
                        COLORS.emerald[500],
                    ]}
                    className="text-3xl font-bold"
                >
                    {APP_NAME}
                </TextGradient>
            </View>
        </Container>
    );
}