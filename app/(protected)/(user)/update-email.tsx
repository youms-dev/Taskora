import { Button } from "@/components/button";
import { CodeInput } from "@/components/code-input";
import { Container } from "@/components/container";
import { Input } from "@/components/input";
import { OAuthButton } from "@/components/oauth-button";
import { PressableAnimated } from "@/components/pressable-animated";
import { Rotate } from "@/components/rotate";
import { TextAnimated } from "@/components/text-animated";
import { COLORS } from "@/constants/colors";
import { EMAIL_FORMAT_ERROR, EMAIL_LENGTH_ERROR } from "@/constants/errors";
import { APP_NAME } from "@/constants/names";
import { useAuth } from "@/hooks/auth-provider";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/axios";
import { AUTH_PROVIDER } from "@/types/database/user";
import { ApiError } from "@/types/errors";
import { Entypo, FontAwesome6, Fontisto } from "@expo/vector-icons";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import clsx from "clsx";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, { Easing, FadeInDown, FadeOutDown, SlideInRight, SlideOutLeft } from "react-native-reanimated";

export default function UpdateEmailPage() {
    const initialInputsValue = {
        email: "",
        code: "",
        password: "",
        oauthEmail: "" as string | null | undefined,
    }
    const [inputsValues, setInputsValues] = useState<typeof initialInputsValue>(initialInputsValue);
    const [step, setStep] = useState<number>(1);
    const { theme } = useTheme();
    const { t, i18n } = useTranslation();
    const emailRef = useRef<TextInput>(null);
    const codeRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);
    const { setToast } = useToast();
    const router = useRouter();
    const provider = useRef<AUTH_PROVIDER>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const { auth, user, updateAuth } = useAuth();
    const loadingRef = useRef<boolean>(false);

    const finalize = useCallback(async (email: string) => {
        if (!user) return;
        updateAuth(email, "email", provider.current);
        setToast(t("update_email_success"), "success");
        router.back();
    }, [auth]);

    const handleSendCode = useCallback(async (oauth: typeof provider.current) => {
        if (!auth || loadingRef.current) return;

        if (!oauth && inputsValues.email.trim().length == 0) {
            emailRef.current?.focus();
            return;
        }

        try {
            setLoading(true);
            loadingRef.current = true;

            if (oauth) {
                provider.current = oauth;
                await GoogleSignin.signOut();
                const { data, type } = await GoogleSignin.signIn();

                if (type == "success" && data?.user?.email) {
                    setInputsValues(prev => ({
                        ...prev,
                        oauthEmail: data.user.email.trim(),
                    }));

                    await api.post("/user/change-email/check-email", {
                        email: data.user.email.trim(),
                    });
                    changeStep("next");
                }
            }
            else {
                provider.current = null;
                setInputsValues(prev => ({
                    ...prev,
                    oauthEmail: null,
                }));
                await api.post("/user/change-email/check-email", {
                    email: inputsValues.email.trim(),
                });
                changeStep("next");
            }
        }
        catch (e) {
            const { status, data } = e as ApiError;

            if (status == 429) {
                setToast(t("update_email_429"), "error", 5000);
            }
            else if (status == 409) {
                setToast(t("update_email_409"), "error", 5000);
            }
            else if (status == 400 && data.message && Array.isArray(data.message)) {
                const messages = data.message as Array<string>;

                if (messages.includes(EMAIL_LENGTH_ERROR)) {
                    setToast(t("update_email_error_email_length"), "error", 5000);
                    emailRef.current?.focus();
                }
                else if (messages.includes(EMAIL_FORMAT_ERROR)) {
                    setToast(t("update_email_error_email_format"), "error", 5000);
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
    }, [inputsValues, i18n.language, setToast, auth]);

    const handleCheckCode = useCallback(async () => {
        if (!auth || loadingRef.current || inputsValues.oauthEmail?.trim().length == 0) return;

        if (inputsValues.code.trim().length != 5) {
            codeRef.current?.focus();
            return;
        }

        try {
            setLoading(true);
            loadingRef.current = true;

            const { data } = await api.patch("/user/change-email/check-code", {
                email: (provider.current ? inputsValues.oauthEmail : inputsValues.email)?.trim(),
                code: inputsValues.code.trim(),
                provider: provider.current,
            });

            if (typeof data == "object" && "email" in data) {
                await finalize(data.email);
            }
            else {
                changeStep(3);
            }
        }
        catch (e) {
            const { status } = e as ApiError;


            if (status == 429) {
                setToast(t("update_email_429"), "error", 5000);
            }
            else if (status == 409) {
                setToast(t("update_email_409"), "error", 5000);
            }
            else if (status == 404) {
                setToast(t("update_email_404"), "error", 5000);
            }
            else if (status == 400) {
                setToast(t("update_email_400"), "error", 5000);
            }
            else {
                setToast(t("error"), "error");
            }
        }
        finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [inputsValues, i18n.language, setToast, auth]);

    const handleResendCode = useCallback(async () => {
        if (!auth || loadingRef.current) return;

        try {
            setLoading(true);
            loadingRef.current = true;

            await api.post("/user/change-email/resend-code", {
                email: auth.user.email,
            });

            setToast(t("update_email_code_resent"), "success");
        }
        catch (e) {
            const { status } = e as ApiError;

            if (status == 429) {
                setToast(t("update_email_429"), "error", 5000);
            }
            else {
                setToast(t("error"), "error");
            }
        }
        finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [i18n.language, setToast, auth]);

    const handleAddPassword = useCallback(async () => {
        if (!auth || loadingRef.current) return;

        if (inputsValues.password.trim().length < 8) {
            passwordRef.current?.focus();
            return;
        }

        try {
            setLoading(true);
            loadingRef.current = true;

            const { data } = await api.patch("/user/change-email/add-password", {
                email: inputsValues.email.trim(),
                password: inputsValues.password,
            });

            await finalize(data.email);
        }
        catch (e) {
            const { status } = e as ApiError;

            if (status == 429) {
                setToast(t("update_email_429"), "error", 5000);
            }
            else {
                setToast(t("error"), "error");
            }
        }
        finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [inputsValues, i18n.language, setToast, auth]);

    const changeStep = useCallback((entry: "next" | "prev" | number) => {
        if (typeof entry == "number") {
            setStep(prev => {
                if (entry >= 1 && entry <= 4) {
                    return entry;
                }
                return prev;
            });

            return;
        }
        setStep(prev => {
            if (entry == "next") {
                return prev < 4 ? prev + 1 : prev;
            }
            else {
                return prev > 1 ? prev - 1 : prev;
            }
        });
    }, []);

    useEffect(() => {
        const { remove } = BackHandler.addEventListener("hardwareBackPress", () => {
            if (step > 1) {
                if (step == 3) {
                    changeStep(1);
                }
                else {
                    changeStep("prev");
                }
                setInputsValues(prev => ({
                    ...prev,
                    code: "",
                }));

                return true;
            }

            return false;
        });

        return () => remove();
    }, [step, changeStep]);

    return (
        <Container centerX>

            {/* Head */}

            <View
                style={{
                    transform: [
                        {
                            translateX: 15,
                        },
                        {
                            translateY: 10,
                        },
                    ]
                }}
                className="absolute left-0 top-0 z-[10]"
            >
                <PressableAnimated
                    scale={.95}
                    onPress={() => router.back()}
                    className="size-[50px] rounded-full dark:bg-black bg-white"
                >
                    <View className="size-full flex justify-center items-center rounded-full dark:bg-white/10 bg-white border-2 dark:border-white/5 border-black/5">
                        <Entypo
                            name="chevron-left"
                            size={25}
                            color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                        />
                    </View>
                </PressableAnimated>
            </View>

            <KeyboardAwareScrollView
                showsVerticalScrollIndicator={false}
                className="w-full h-full"
                contentContainerClassName="w-full items-center"
            >
                {
                    step == 1 && (
                        <>

                            {/* Title */}

                            <Animated.View
                                entering={FadeInDown
                                    .duration(300)
                                    .easing(Easing.inOut(Easing.quad))
                                }
                                exiting={FadeOutDown
                                    .duration(300)
                                    .easing(Easing.inOut(Easing.quad))
                                }
                                className="w-full flex items-center gap-5 px-3 mt-[100px]"
                            >
                                <TextAnimated className="text-3xl font-bold text-center">
                                    {t("update_email_step_1_item_1")}
                                </TextAnimated>
                            </Animated.View>

                            {/* Input */}

                            <View className="w-full flex items-center gap-10 mt-10 px-3">
                                <TextAnimated className="text-xl text-center">
                                    {t("update_email_step_1_item_2")}
                                </TextAnimated>

                                <View className="sm:w-[500px] w-full flex items-center px-3">
                                    <Input
                                        ref={emailRef}
                                        placeholder="email@example.com"
                                        autoCapitalize="none"
                                        value={inputsValues.email}
                                        onChangeText={(e) => setInputsValues(prev => ({
                                            ...prev,
                                            email: e,
                                        }))}
                                        onSubmitEditing={() => handleSendCode(null)}
                                        icon={(
                                            <View
                                                style={{
                                                    transform: [
                                                        {
                                                            translateX: 15,
                                                        },
                                                        {
                                                            translateY: 15,
                                                        },
                                                    ]
                                                }}
                                                className="absolute left-0 top-0 pointer-events-none"
                                            >
                                                <FontAwesome6
                                                    name="envelope-open-text"
                                                    size={22}
                                                    color={theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)"}
                                                />
                                            </View>
                                        )}
                                    />
                                </View>
                            </View>

                            {/* Button */}

                            <View className="w-full flex items-center mt-[50px]">
                                <Button
                                    width={200}
                                    height={50}
                                    scale={.95}
                                    loaderSize={25}
                                    loading={loading}
                                    onPress={() => handleSendCode(null)}
                                >
                                    <Text className="text-2xl font-bold text-black">
                                        {t("update_email_step_1_item_3")}
                                    </Text>
                                </Button>
                            </View>

                            {/* Line */}

                            <View className="w-full flex flex-row justify-between items-center mt-8 px-3">
                                <LinearGradient
                                    colors={theme == "dark" ?
                                        ["rgba(0, 0, 0, 1)", COLORS.emerald[700]]
                                        :
                                        ["rgba(255, 255, 255, 1)", COLORS.emerald[500]]
                                    }
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    locations={[.3, .8]}
                                    className="w-[40%] h-[2px]"
                                >
                                    <LinearGradient
                                        colors={theme == "dark" ?
                                            ["rgba(255, 255, 255, .1)", COLORS.emerald[700]]
                                            :
                                            ["rgba(0, 0, 0, .2)", COLORS.emerald[500]]
                                        }
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        locations={[.3, .8]}
                                        className="size-full"
                                    />
                                </LinearGradient>

                                <View className="w-[20%] px-2">
                                    <TextAnimated
                                        numberOfLines={1}
                                        ellipsizeMode="clip"
                                        className="text-lg text-center"
                                    >
                                        {t("auth_item_2")}
                                    </TextAnimated>
                                </View>

                                <LinearGradient
                                    colors={theme == "dark" ?
                                        ["rgba(0, 0, 0, 1)", COLORS.emerald[700]]
                                        :
                                        ["rgba(255, 255, 255, 1)", COLORS.emerald[500]]
                                    }
                                    start={{ x: 1, y: 0 }}
                                    end={{ x: 0, y: 0 }}
                                    locations={[.3, .8]}
                                    className="w-[40%] h-[2px]"
                                >
                                    <LinearGradient
                                        colors={theme == "dark" ?
                                            ["rgba(255, 255, 255, .1)", COLORS.emerald[700]]
                                            :
                                            ["rgba(0, 0, 0, .2)", COLORS.emerald[500]]
                                        }
                                        start={{ x: 1, y: 0 }}
                                        end={{ x: 0, y: 0 }}
                                        locations={[.3, .8]}
                                        className="size-full"
                                    />
                                </LinearGradient>
                            </View>

                            {/* OAuth */}

                            <View className="sm:w-[500px] w-full px-5 mt-10">
                                <OAuthButton
                                    name="Google"
                                    icon="google"
                                    loading={loading}
                                    onPress={() => handleSendCode(AUTH_PROVIDER.GOOGLE)}
                                />
                            </View>
                        </>
                    )
                }

                {
                    step == 2 && (
                        <>

                            {/* Title */}

                            <Animated.View
                                entering={SlideInRight
                                    .duration(300)
                                    .easing(Easing.inOut(Easing.quad))
                                }
                                exiting={SlideOutLeft
                                    .duration(300)
                                    .easing(Easing.inOut(Easing.quad))
                                }
                                className="w-full flex items-center gap-5 px-3 mt-[100px]"
                            >
                                <TextAnimated className="text-3xl font-bold text-center">
                                    {t("update_email_step_2_item_1")}
                                </TextAnimated>
                            </Animated.View>

                            {/* Input */}

                            <View className="w-full flex items-center gap-6 mt-10">
                                <View className="w-full flex items-center gap-3">
                                    <TextAnimated className="text-xl text-center">
                                        {t("update_email_step_2_item_2")}
                                    </TextAnimated>

                                    <Text className="text-xl text-center text-emerald-500 font-medium">
                                        {auth?.user.email}
                                    </Text>
                                </View>

                                <CodeInput
                                    ref={codeRef}
                                    value={inputsValues.code}
                                    setValue={(e) => setInputsValues(prev => ({
                                        ...prev,
                                        code: e,
                                    }))}
                                    onSubmitEditing={handleCheckCode}
                                />

                                <View className="sm:w-[500px] w-full px-5 mt-3">
                                    <PressableAnimated
                                        scale={.95}
                                        disabled={loading}
                                        onPress={handleResendCode}
                                        className={clsx(
                                            "flex flex-row items-center gap-3",
                                            loading && "opacity-60",
                                        )}
                                    >
                                        <TextAnimated className="text-lg">
                                            {t("update_email_step_2_item_4")}
                                        </TextAnimated>

                                        <Rotate rotate={loading} />
                                    </PressableAnimated>
                                </View>
                            </View>

                            {/* Button */}

                            <View className="w-full flex flex-row flex-wrap justify-center items-center gap-5 mt-[50px]">
                                <Button
                                    width={150}
                                    height={50}
                                    scale={.95}
                                    loaderSize={25}
                                    loading={loading}
                                    backgroundColor={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                                    onPress={() => changeStep("prev")}
                                >
                                    <TextAnimated
                                        dark="rgba(0, 0, 0, .8)"
                                        light="rgba(255, 255, 255, .8)"
                                        className="text-2xl font-bold"
                                    >
                                        {t("update_email_prev")}
                                    </TextAnimated>
                                </Button>

                                <Button
                                    width={150}
                                    height={50}
                                    scale={.95}
                                    loaderSize={25}
                                    loading={loading}
                                    onPress={handleCheckCode}
                                >
                                    <Text className="text-2xl font-bold text-black">
                                        {t("update_email_step_2_item_3")}
                                    </Text>
                                </Button>
                            </View>
                        </>
                    )
                }

                {
                    step == 3 && (
                        <>

                            {/* Head */}

                            <Animated.View
                                entering={SlideInRight
                                    .duration(300)
                                    .easing(Easing.inOut(Easing.quad))
                                }
                                exiting={SlideOutLeft
                                    .duration(300)
                                    .easing(Easing.inOut(Easing.quad))
                                }
                                className="w-full flex flex-row justify-center items-center gap-5 px-3 mt-[100px]"
                            >
                                <View className="flex flex-row items-center gap-3 px-10 py-1 border border-amber-400/20 dark:bg-amber-400/10 bg-amber-500/20 rounded-3xl">
                                    <Entypo
                                        name="warning"
                                        size={20}
                                        color={theme == "dark" ? COLORS.amber[400] : COLORS.amber[500]}
                                    />

                                    <Text className="text-xl font-medium text-center dark:text-amber-400 text-amber-500">
                                        {t("update_email_step_3_item_1")}
                                    </Text>
                                </View>
                            </Animated.View>

                            {/* Message */}

                            <View className="w-full flex items-center px-5 mt-10">
                                <TextAnimated className="text-xl text-center leading-[35px]">
                                    {t("update_email_step_3_item_2", { name: APP_NAME })}
                                </TextAnimated>
                            </View>

                            {/* Button */}

                            <View className="w-full flex flex-row flex-wrap justify-center items-center gap-5 mt-[50px]">
                                <Button
                                    width={150}
                                    height={50}
                                    scale={.95}
                                    loaderSize={25}
                                    loading={loading}
                                    backgroundColor={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                                    onPress={() => changeStep(1)}
                                >
                                    <TextAnimated
                                        dark="rgba(0, 0, 0, .8)"
                                        light="rgba(255, 255, 255, .8)"
                                        className="text-2xl font-bold"
                                    >
                                        {t("update_email_prev")}
                                    </TextAnimated>
                                </Button>

                                <Button
                                    width={150}
                                    height={50}
                                    scale={.95}
                                    loaderSize={25}
                                    loading={loading}
                                    onPress={() => changeStep("next")}
                                >
                                    <Text className="text-2xl font-bold text-black">
                                        {t("update_email_step_3_item_3")}
                                    </Text>
                                </Button>
                            </View>
                        </>
                    )
                }

                {
                    step == 4 && (
                        <>

                            {/* Title */}

                            <Animated.View
                                entering={SlideInRight
                                    .duration(300)
                                    .easing(Easing.inOut(Easing.quad))
                                }
                                exiting={SlideOutLeft
                                    .duration(300)
                                    .easing(Easing.inOut(Easing.quad))
                                }
                                className="w-full flex items-center gap-5 px-3 mt-[100px]"
                            >
                                <TextAnimated className="text-3xl font-bold text-center">
                                    {t("update_email_step_4_item_1")}
                                </TextAnimated>
                            </Animated.View>

                            {/* Input */}

                            <View className="w-full flex items-center gap-10 mt-10 px-3">
                                <TextAnimated className="text-xl text-center">
                                    {t("update_email_step_4_item_2")}
                                </TextAnimated>

                                <View className="sm:w-[500px] w-full flex items-center gap-3 px-3">
                                    <Input
                                        ref={passwordRef}
                                        label=""
                                        placeholder="• • • • • • • •"
                                        value={inputsValues.password}
                                        onChangeText={(e) => setInputsValues(prev => ({
                                            ...prev,
                                            password: e,
                                        }))}
                                        onSubmitEditing={() => changeStep("next")}
                                        eye
                                        eyeYPosition={15}
                                        icon={(
                                            <View
                                                style={{
                                                    transform: [
                                                        {
                                                            translateX: 15,
                                                        },
                                                        {
                                                            translateY: 15,
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

                                    <View className="w-full flex flex-row items-center gap-5">
                                        <TextAnimated className="text-lg">
                                            <Text>
                                                {t("update_email_step_4_item_4")} :
                                            </Text>
                                            &nbsp;
                                            <Text className={clsx(
                                                "font-bold",
                                                inputsValues.password.trim().length >= 8 ? "text-emerald-500" : "text-amber-500"
                                            )}>
                                                {inputsValues.password.length}
                                            </Text>
                                        </TextAnimated>
                                    </View>
                                </View>
                            </View>

                            {/* Button */}

                            <View className="w-full flex flex-row flex-wrap justify-center items-center gap-5 mt-[50px]">
                                <Button
                                    width={150}
                                    height={50}
                                    scale={.95}
                                    loaderSize={25}
                                    loading={loading}
                                    backgroundColor={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                                    onPress={() => changeStep("prev")}
                                >
                                    <TextAnimated
                                        dark="rgba(0, 0, 0, .8)"
                                        light="rgba(255, 255, 255, .8)"
                                        className="text-2xl font-bold"
                                    >
                                        {t("update_email_prev")}
                                    </TextAnimated>
                                </Button>

                                <Button
                                    width={150}
                                    height={50}
                                    scale={.95}
                                    loaderSize={25}
                                    loading={loading}
                                    onPress={handleAddPassword}
                                >
                                    <Text className="text-2xl font-bold text-black">
                                        {t("update_email_step_4_item_5")}
                                    </Text>
                                </Button>
                            </View>
                        </>
                    )
                }
            </KeyboardAwareScrollView>
        </Container>
    );
}