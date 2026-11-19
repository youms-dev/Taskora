import { Button } from "@/components/button";
import { CodeInput } from "@/components/code-input";
import { Container } from "@/components/container";
import { LocalAuthAnimation } from "@/components/local-auth/lock-animation";
import { Modal } from "@/components/modal";
import { PressableAnimated } from "@/components/pressable-animated";
import { TextAnimated } from "@/components/text-animated";
import { Toggle } from "@/components/toggle";
import { COLORS } from "@/constants/colors";
import { APP_NAME } from "@/constants/names";
import { useAttempts } from "@/hooks/local-auth/use-attempts";
import { useLocalAuth } from "@/hooks/local-auth/use-local-auth";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { Entypo, MaterialCommunityIcons, Octicons } from "@expo/vector-icons";
import clsx from "clsx";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import Animated, { Easing, FadeInDown, FadeOutDown, SlideInLeft } from "react-native-reanimated";

export default function LocalAuthPage() {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const router = useRouter();
    const [modalActive, setModalActive] = useState<boolean>(false);
    const [value, setValue] = useState<string>("");
    const codeRef = useRef<TextInput>(null);
    const { localAuth, save, remove } = useLocalAuth();
    const { setToast } = useToast();
    const [target, setTarget] = useState<"delete" | "disable">("delete");
    const { attempts, decrement, reset } = useAttempts();

    const handleDeleteOrDisable = useCallback(async () => {
        if (!localAuth) return;

        if (value.trim().length < 5) {
            codeRef.current?.focus();
            return;
        }
        else if (value.trim() != localAuth.code) {
            setToast(t("local_auth_400"), "error");
            decrement();
            return;
        }

        if (target == "delete") {
            remove();
        }
        else {
            save({
                ...localAuth,
                enabled: false,
            });
        }
        setTarget("delete");
        setModalActive(false);
        reset();
    }, [value, localAuth, target, decrement]);
    
    const handleToggleLocalAuth = useCallback(async() => {
        if (!localAuth) {
            router.navigate({
                pathname: "/(protected)/(local-auth)/create"
            });

            return;
        }
        else if (localAuth.enabled) {
            setModalActive(true);
            setTarget("disable");
            codeRef.current?.focus();
        }
        else {
            save({
                ...localAuth,
                enabled: true,
            });
        }
    }, [localAuth]);

    useEffect(() => {
        if (!modalActive) {
            setValue("");
            setTarget("delete");
            codeRef.current?.blur();
        }
    }, [modalActive]);

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
                            translateX: 12,
                        },
                        {
                            translateY: 8,
                        },
                    ],
                }}
                className="absolute left-0 top-0 flex flex-row items-center gap-3 pr-5 z-[10] rounded-[50px]"
            >
                <PressableAnimated
                    scale={.95}
                    onPress={() => {
                        if (router.canGoBack()) {
                            router.back();
                        }
                        else {
                            router.dismissTo({
                                pathname: "/(protected)/(tabs)/settings"
                            });
                        }
                    }}
                    className="size-[50px] dark:bg-black bg-white rounded-full"
                >
                    <View className="size-full flex justify-center items-center border-2 dark:border-white/5 border-black/5 rounded-full dark:bg-white/10 bg-white">
                        <Entypo
                            name="chevron-left"
                            size={25}
                            color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                        />
                    </View>
                </PressableAnimated>

                <View className="max-w-[80%]">
                    <TextAnimated
                        numberOfLines={1}
                        ellipsizeMode="middle"
                        className="text-xl tracking-widest"
                    >
                        {t("local_auth_title")}
                    </TextAnimated>
                </View>
            </Animated.View>

            <ScrollView
                horizontal={false}
                showsVerticalScrollIndicator={false}
                className="w-full h-full"
                contentContainerClassName="w-full flex px-3 pt-[80px] pb-[50px]"
            >
                {/* Section 1 */}

                <View className="w-full flex justify-center items-center dark:bg-white/10 bg-white pt-5 rounded-[20px] pb-3">
                    <View className="w-full flex-row justify-center">
                        <LocalAuthAnimation
                            width={screenWidth * .8}
                            height={200}
                        />
                    </View>

                    <View className="w-full flex flex-row justify-center px-5">
                        <TextAnimated className="text-center font-medium tracking-wider opacity-80 leading-[20px]">
                            {t("local_auth_section_1_item_1", { name: APP_NAME })}
                        </TextAnimated>
                    </View>
                </View>

                {/* Section 2 */}

                <View className="w-full flex flex-row justify-between items-center gap-3 dark:bg-white/10 bg-white rounded-2xl mt-6 p-3">
                    <View className="w-[80%]">
                        <TextAnimated className="text-lg">
                            {t("local_auth_section_2_item_1")}
                        </TextAnimated>
                    </View>

                    <View>
                        <Toggle
                            active={localAuth?.enabled}
                            onPress={handleToggleLocalAuth}
                        />
                    </View>
                </View>

                {/* Section 3 */}

                {
                    localAuth && (
                        <Animated.View
                            entering={FadeInDown
                                .duration(300)
                                .easing(Easing.inOut(Easing.quad))
                            }
                            exiting={FadeOutDown
                                .duration(300)
                                .easing(Easing.inOut(Easing.quad))
                            }
                            className="w-full rounded-2xl mt-6"
                        >
                            <View className={clsx(
                                "w-full flex items-center dark:bg-white/10 bg-white p-3 rounded-2xl",
                                !localAuth.enabled && "dark:opacity-60 opacity-40 pointer-events-none",
                            )}>
                                {/* Pin */}

                                <View className="w-full flex items-center">
                                    <View className="w-full flex flex-row items-center gap-3">
                                        <View>
                                            <Octicons
                                                name="number"
                                                size={30}
                                                color={theme == "dark" ? "rgba(255, 255, 255, .3)" : "rgba(0, 0, 0, .3)"}
                                            />
                                        </View>

                                        <View className="w-[85%]">
                                            <TextAnimated
                                                numberOfLines={1}
                                                className="text-lg"
                                            >
                                                {t("local_auth_section_3_item_1")}
                                            </TextAnimated>
                                        </View>
                                    </View>

                                    <View className="w-full flex items-center pt-3 px-3">
                                        <Pressable
                                            onPress={() => router.navigate({
                                                pathname: "/(protected)/(local-auth)/create",
                                                params: {
                                                    action: localAuth && "update",
                                                }
                                            })}
                                            className="flex flex-row items-center gap-3 self-start"
                                        >
                                            <View className="size-[10px] dark:bg-white/10 bg-black/30 rounded-full" />

                                            <View className="max-w-[90%]">
                                                <TextAnimated className="text-lg">
                                                    {t("local_auth_section_3_item_2")}
                                                </TextAnimated>
                                            </View>
                                        </Pressable>

                                        <Pressable
                                            onPress={() => {
                                                setModalActive(true);
                                                codeRef.current?.focus();
                                            }}
                                            className="flex flex-row items-center gap-3 self-start mt-5"
                                        >
                                            <View className="size-[10px] bg-red-500/30 rounded-full" />

                                            <View className="max-w-[90%]">
                                                <Text className="text-lg text-red-500">
                                                    {t("local_auth_section_3_item_3")}
                                                </Text>
                                            </View>
                                        </Pressable>
                                    </View>
                                </View>

                                {/* System auth */}

                                <View className="w-full flex flex-row items-center mt-6">
                                    <View className="w-[80%] flex flex-row items-center gap-3">
                                        <View>
                                            <MaterialCommunityIcons
                                                name="fingerprint"
                                                size={30}
                                                color={theme == "dark" ? "rgba(255, 255, 255, .3)" : "rgba(0, 0, 0, .3)"}
                                            />
                                        </View>

                                        <View className="w-[85%]">
                                            <TextAnimated className="text-lg">
                                                {t("local_auth_section_3_item_4")}
                                            </TextAnimated>
                                        </View>
                                    </View>

                                    <View>
                                        <Toggle
                                            active={localAuth?.systemAuth}
                                            onPress={() => save({
                                                ...localAuth,
                                                systemAuth: !localAuth.systemAuth,
                                            })}
                                        />
                                    </View>
                                </View>
                            </View>
                        </Animated.View>
                    )
                }
            </ScrollView>

            <Modal
                active={modalActive}
                height={screenHeight * .8}
                onClose={() => setModalActive(false)}
                backdropBackground="rgba(0, 0, 0, .2)"
                dragHandlerContainerBackground={theme == "dark" ? "rgba(255, 255, 255, .05)" : "white"}
                className="dark:bg-black bg-white border-2 dark:border-t-white/10 border-t-black/10 border-x-transparent border-b-transparent rounded-t-[30px]"
                contentContainerClassName="w-full min-h-full dark:bg-white/5 bg-white pt-[50px]"
            >
                <View className="w-full flex items-center gap-8 px-3">
                    <View className="w-full flex items-center px-3">
                        <TextAnimated className="text-xl text-center">
                            {t("local_auth_section_3_item_5")}
                        </TextAnimated>
                    </View>

                    <CodeInput
                        ref={codeRef}
                        value={value}
                        setValue={(e) => setValue(e)}
                        onSubmitEditing={handleDeleteOrDisable}
                    />
                </View>

                {
                    attempts <= 5 && (
                        <View className="w-full flex items-center gap-5 px-3 mt-3">
                            <View className="w-full flex items-center gap-3">
                                <Text className="text-xl text-amber-500">
                                    {t("local_auth_attempts_item_1", { number: attempts })}
                                </Text>

                                <Text className="text-xl text-amber-500 text-center">
                                    {t("local_auth_attempts_item_2", { name: APP_NAME })}
                                </Text>
                            </View>
                        </View>
                    )
                }

                <View className="w-full flex items-center mt-[50px]">
                    <Button
                        width={200}
                        height={50}
                        scale={.95}
                        backgroundColor={target == "delete" ?
                            COLORS.red[500]
                            :
                            theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"
                        }
                        onPress={handleDeleteOrDisable}
                    >
                        <Text className={clsx(
                            "text-xl font-bold",
                            target == "delete" ? "text-white" : "dark:text-black/80 text-white/80",
                        )}>
                            {target == "delete" ?
                                t("local_auth_section_3_item_6")
                                :
                                t("local_auth_section_3_item_7")
                            }
                        </Text>
                    </Button>
                </View>
            </Modal>
        </Container>
    );
}