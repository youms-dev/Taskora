import { Button } from "@/components/button";
import { CodeInput } from "@/components/code-input";
import { Container } from "@/components/container";
import { PressableAnimated } from "@/components/pressable-animated";
import { TextAnimated } from "@/components/text-animated";
import { useLocalAuth } from "@/hooks/use-local-auth";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { Entypo } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Text, TextInput, View } from "react-native";
import Animated, { Easing, FadeInDown, FadeOutDown } from "react-native-reanimated";

export default function CreatePage() {
    const initialInputsValue = {
        currentCode: "",
        code: "",
        confirmCode: "",
    }
    const [inputsValues, setInputsValues] = useState<typeof initialInputsValue>(initialInputsValue);
    const [step, setStep] = useState<number>(1);
    const { theme } = useTheme();
    const { t, i18n } = useTranslation();
    const currentCodeRef = useRef<TextInput>(null);
    const codeRef = useRef<TextInput>(null);
    const confirmCodeRef = useRef<TextInput>(null);
    const { setToast } = useToast();
    const { localAuth, save } = useLocalAuth();
    const router = useRouter();
    const params = useLocalSearchParams();

    const handleSubmit = useCallback(async () => {
        if (!localAuth && params.action) return;
        if (inputsValues.code.trim().length == 0) {
            setStep(1);
            return;
        }
        else if (inputsValues.confirmCode.trim().length != 5) {
            confirmCodeRef.current?.focus();
            return;
        }
        else if (inputsValues.code != inputsValues.confirmCode) {
            setToast(t("local_auth_create_400"), "warning");
            return;
        }

        try {
            if (params.action) {
                save({
                    ...localAuth!,
                    code: inputsValues.code,
                });
                setToast(t("local_auth_create_changed"), "success", 5000);
            }
            else {
                save({
                    enabled: true,
                    code: inputsValues.code,
                    systemAuth: false,
                });
                setToast(t("local_auth_create_success"), "success", 5000);
            }
            router.dismissTo("/(protected)/(local-auth)");
        }
        catch { }
    }, [inputsValues, i18n.language, setToast, params, localAuth]);

    useEffect(() => {
        const { remove } = BackHandler.addEventListener("hardwareBackPress", () => {
            if (step > 2) {
                setStep(prev => prev > 1 ? prev - 1 : prev);
                return true;
            }
            router.dismissTo("/(protected)/(local-auth)");
            return true;
        });

        return () => remove();
    }, [step]);

    const handleCheckCode = useCallback(async () => {
        if (!localAuth || !params.action) return;
        if (inputsValues.currentCode.trim().length < 5) {
            currentCodeRef.current?.focus();
            return;
        }
        else if (inputsValues.currentCode.trim() != localAuth.code) {
            setToast(t("local_auth_create_wrong"), "error");
            return;
        }
        setStep(prev => prev + 1);
    }, [localAuth, inputsValues, setToast]);

    useEffect(() => {
        if (!params.action) {
            setStep(prev => prev + 1);
        }
    }, []);

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
                className="absolute left-0 top-0"
            >
                <PressableAnimated
                    scale={.95}
                    onPress={() => router.dismissTo("/(protected)/(local-auth)")}
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

            {
                step == 1 && params.action && (
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
                                {t("local_auth_create_step_1_item_1")}
                            </TextAnimated>
                        </Animated.View>

                        {/* Input */}

                        <View className="w-full flex items-center gap-6 mt-10">
                            <TextAnimated className="text-xl text-center">
                                {t("local_auth_create_step_1_item_2")}
                            </TextAnimated>

                            <CodeInput
                                ref={currentCodeRef}
                                value={inputsValues.currentCode}
                                setValue={(e) => setInputsValues(prev => ({
                                    ...prev,
                                    currentCode: e,
                                }))}
                                onSubmitEditing={handleCheckCode}
                            />
                        </View>

                        {/* Button */}

                        <View className="w-full flex items-center mt-[60px]">
                            <Button
                                width={200}
                                height={50}
                                scale={.95}
                                backgroundColor={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                                onPress={handleCheckCode}
                            >
                                <TextAnimated
                                    dark="rgba(0, 0, 0, .8)"
                                    light="rgba(255, 255, 255, .8)"
                                    className="text-2xl font-bold"
                                >
                                    {t("local_auth_create_next")}
                                </TextAnimated>
                            </Button>
                        </View>
                    </>
                )
            }

            {
                step == 2 && (
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
                                {params.action ?
                                    t("local_auth_create_step_2_item_3")
                                    :
                                    t("local_auth_create_step_2_item_1")
                                }
                            </TextAnimated>
                        </Animated.View>

                        {/* Input */}

                        <View className="w-full flex items-center gap-6 mt-10">
                            <TextAnimated className="text-xl text-center">
                                {t("local_auth_create_step_2_item_2")}
                            </TextAnimated>

                            <CodeInput
                                ref={codeRef}
                                value={inputsValues.code}
                                setValue={(e) => setInputsValues(prev => ({
                                    ...prev,
                                    code: e,
                                }))}
                                onSubmitEditing={() => {
                                    if (inputsValues.code.trim().length == 5) {
                                        setStep(prev => prev + 1);
                                    }
                                }}
                            />
                        </View>

                        {/* Button */}

                        <View className="w-full flex items-center mt-[60px]">
                            <Button
                                width={200}
                                height={50}
                                scale={.95}
                                backgroundColor={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                                onPress={() => {
                                    if (inputsValues.code.trim().length < 5) {
                                        codeRef.current?.focus();
                                    }
                                    else {
                                        setStep(prev => prev + 1);
                                    }
                                }}
                            >
                                <TextAnimated
                                    dark="rgba(0, 0, 0, .8)"
                                    light="rgba(255, 255, 255, .8)"
                                    className="text-2xl font-bold"
                                >
                                    {t("local_auth_create_next")}
                                </TextAnimated>
                            </Button>
                        </View>
                    </>
                )
            }

            {
                step == 3 && (
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
                                {t("local_auth_create_step_3_item_1")}
                            </TextAnimated>
                        </Animated.View>

                        {/* Input */}

                        <View className="w-full flex items-center gap-6 mt-10">
                            <TextAnimated className="text-xl text-center">
                                {t("local_auth_create_step_3_item_2")}
                            </TextAnimated>

                            <CodeInput
                                ref={confirmCodeRef}
                                value={inputsValues.confirmCode}
                                setValue={(e) => setInputsValues(prev => ({
                                    ...prev,
                                    confirmCode: e,
                                }))}
                                onSubmitEditing={handleSubmit}
                            />
                        </View>

                        {/* Button */}

                        <View className="w-full flex flex-row flex-wrap justify-center items-center gap-5 mt-[60px]">
                            <Button
                                width={150}
                                height={50}
                                scale={.95}
                                backgroundColor={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                                onPress={() => setStep(prev => prev - 1)}
                            >
                                <TextAnimated
                                    dark="rgba(0, 0, 0, .8)"
                                    light="rgba(255, 255, 255, .8)"
                                    className="text-2xl font-bold"
                                >
                                    {t("local_auth_create_prev")}
                                </TextAnimated>
                            </Button>

                            <Button
                                width={150}
                                height={50}
                                scale={.95}
                                onPress={handleSubmit}
                            >
                                <Text className="text-2xl font-bold text-black">
                                    {params.action ?
                                        t("local_auth_create_step_3_item_4")
                                        :
                                        t("local_auth_create_step_3_item_3")
                                    }
                                </Text>
                            </Button>
                        </View>
                    </>
                )
            }
        </Container>
    );
}