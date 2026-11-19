import { Button } from "@/components/button";
import { CodeInput } from "@/components/code-input";
import { Container } from "@/components/container";
import { Input } from "@/components/input";
import { PressableAnimated } from "@/components/pressable-animated";
import { TextAnimated } from "@/components/text-animated";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { Entypo, FontAwesome6, Fontisto } from "@expo/vector-icons";
import clsx from "clsx";
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

    const handleSubmit = useCallback(async () => {
        if (inputsValues.code.trim().length == 0) {
            setStep(1);
            return;
        }

        try {
            router.back();
        }
        catch { }
    }, [inputsValues, i18n.language, setToast]);

    useEffect(() => {
        const { remove } = BackHandler.addEventListener("hardwareBackPress", () => {
            if (step > 1) {
                setStep(prev => prev > 1 ? prev - 1 : prev);
                return true;
            }

            return false;
        });

        return () => remove();
    }, [step]);

    const changeStep = useCallback((entry: "next" | "prev") => {
        setStep(prev => {
            if (entry == "next") {
                return prev < 3 ? prev + 1 : prev;
            }
            else {
                return prev > 1 ? prev - 1 : prev;
            }
        })
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
                                        value={inputsValues.email}
                                        onChangeText={(e) => setInputsValues(prev => ({
                                            ...prev,
                                            email: e,
                                        }))}
                                        onSubmitEditing={() => changeStep("next")}
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
                                    onPress={() => changeStep("next")}
                                >
                                    <Text className="text-2xl font-bold text-black">
                                        {t("update_email_step_1_item_3")}
                                    </Text>
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
                                        {"youms.vantablack@gmail.com"}
                                    </Text>
                                </View>

                                <CodeInput
                                    ref={codeRef}
                                    value={inputsValues.code}
                                    setValue={(e) => setInputsValues(prev => ({
                                        ...prev,
                                        code: e,
                                    }))}
                                    onSubmitEditing={() => changeStep("next")}
                                />
                            </View>

                            {/* Button */}

                            <View className="w-full flex flex-row flex-wrap justify-center items-center gap-5 mt-[60px]">
                                <Button
                                    width={150}
                                    height={50}
                                    scale={.95}
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
                                    onPress={() => changeStep("next")}
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
                                    {t("update_email_step_3_item_1")}
                                </TextAnimated>
                            </Animated.View>

                            {/* Input */}

                            <View className="w-full flex items-center gap-10 mt-10 px-3">
                                <TextAnimated className="text-xl text-center">
                                    {t("update_email_step_3_item_2")}
                                </TextAnimated>

                                <View className="sm:w-[500px] w-full flex items-center gap-3 px-3">
                                    <Input
                                        ref={emailRef}
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
                                                {t("update_email_step_3_item_4")} :
                                            </Text>
                                            &nbsp;
                                            <Text className={clsx(
                                                "font-bold",
                                                inputsValues.password.trim().length > 8 ? "text-emerald-500" : "text-amber-500"
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
                                // onPress={handleSubmit}
                                >
                                    <Text className="text-2xl font-bold text-black">
                                        {t("update_email_step_3_item_5")}
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