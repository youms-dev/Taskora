import { Button } from "@/components/button";
import { CodeInput } from "@/components/code-input";
import { Container } from "@/components/container";
import { TextAnimated } from "@/components/text-animated";
import { LOCAL_AUTH_STORE } from "@/constants/secure-store";
import { useLocalAuth } from "@/hooks/use-local-auth";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { LocalAuthType } from "@/types/auth";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Text, TextInput, View } from "react-native";
import Animated, { Easing, FadeInDown, FadeOutDown } from "react-native-reanimated";

export default function CreatePage() {
    const initialInputsValue = {
        code: "",
        confirmCode: "",
    }
    const [inputsValues, setInputsValues] = useState<typeof initialInputsValue>(initialInputsValue);
    const [step, setStep] = useState<number>(1);
    const { theme } = useTheme();
    const { t, i18n } = useTranslation();
    const codeRef = useRef<TextInput>(null);
    const confirmCodeRef = useRef<TextInput>(null);
    const { setToast } = useToast();
    const { localAuth, save } = useLocalAuth();
    const router = useRouter();

    const handleSubmit = useCallback(async () => {
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
            save({
                enabled: true,
                code: inputsValues.code,
                systemAuth: false,
            });
            setToast(t("local_auth_create_success"), "success", 5000);
            router.dismissTo("/(protected)/(local-auth)");
        }
        catch { }
    }, [inputsValues, i18n.language, setToast]);

    useEffect(() => {
        const { remove } = BackHandler.addEventListener("hardwareBackPress", () => {
            if (step > 1) {
                setStep(1);
                return true;
            }
            router.dismissTo("/(protected)/(local-auth)");
            return true;
        });

        return () => remove();
    }, [step]);

    return (
        <Container centerX>
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
                                {t("local_auth_create_step_1_item_1")}
                            </TextAnimated>
                        </Animated.View>

                        {/* Input */}

                        <View className="w-full flex items-center gap-6 mt-10">
                            <TextAnimated className="text-xl text-center">
                                {t("local_auth_create_step_1_item_2")}
                            </TextAnimated>

                            <CodeInput
                                ref={codeRef}
                                value={inputsValues.code}
                                setValue={(e) => setInputsValues(prev => ({
                                    ...prev,
                                    code: e,
                                }))}
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
                                    if (inputsValues.code.trim().length == 0) {
                                        codeRef.current?.focus();
                                        return;
                                    }
                                    setStep(2);
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
                                {t("local_auth_create_step_2_item_1")}
                            </TextAnimated>
                        </Animated.View>

                        {/* Input */}

                        <View className="w-full flex items-center gap-6 mt-10">
                            <TextAnimated className="text-xl text-center">
                                {t("local_auth_create_step_2_item_2")}
                            </TextAnimated>

                            <CodeInput
                                ref={confirmCodeRef}
                                value={inputsValues.confirmCode}
                                setValue={(e) => setInputsValues(prev => ({
                                    ...prev,
                                    confirmCode: e,
                                }))}
                            />
                        </View>

                        {/* Button */}

                        <View className="w-full flex flex-row flex-wrap justify-center items-center gap-5 mt-[60px]">
                            <Button
                                width={150}
                                height={50}
                                scale={.95}
                                backgroundColor={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                                onPress={() => setStep(1)}
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
                                    {t("local_auth_create_step_2_item_3")}
                                </Text>
                            </Button>
                        </View>
                    </>
                )
            }
        </Container>
    );
}