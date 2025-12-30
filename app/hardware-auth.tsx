import { Button } from "@/components/Button";
import { Container } from "@/components/container";
import { AppState, Text, View } from "react-native";
import { hasHardwareAsync, isEnrolledAsync, authenticateAsync } from 'expo-local-authentication';
import { Toast, ToastProps } from "@/components/toast";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useAsyncStorage } from "@react-native-async-storage/async-storage";
import { APP_NAME, AUTH_STORAGE } from "@/constants/names";
import { Image } from "expo-image";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useTheme } from "@/hooks/use-theme";
import { colors } from "@/constants/colors";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaskedView from "@react-native-masked-view/masked-view";

export default function HardwareAuth() {
    const [toast, setToast] = useState<Omit<ToastProps, "onCancel">>({
        show: false,
        message: "",
        top: 0,
        type: "default",
    });
    const router = useRouter();
    const unlock = useSharedValue<boolean>(false);
    const { theme } = useTheme();
    const themeValue = useSharedValue<typeof theme>("dark");
    const [lockText, setLockText] = useState<string>("verrouillée");

    useEffect(() => {
        themeValue.value = theme;
    }, [theme]);

    useEffect(() => {
        (async () => {
            const hasHardware = await hasHardwareAsync();
            const hasDatasEnrolled = await isEnrolledAsync();
            const { getItem } = useAsyncStorage(AUTH_STORAGE);
            const exists = await getItem();

            if (!hasHardware || !hasDatasEnrolled || exists == null) {
                router.replace("/app");
            }
            else if (exists != null) {
                handleLocalAuth();
            }
            else {
                router.replace("/app");
            }
        })();
    }, [AppState.currentState]);

    const handleLocalAuth = useCallback(async () => {
        const { success } = await authenticateAsync();
        const { setItem } = useAsyncStorage(AUTH_STORAGE);

        if (success) {
            await setItem(JSON.stringify({
                verified: true
            }));
            setToast({
                show: true,
                message: "Déverrouillé 🔓😉",
                type: "success",
            });
            unlock.value = true;
            setLockText("déverrouillée");
            setTimeout(() => {
                router.replace("/app");
            }, 1500);
        }
    }, [AppState.currentState]);

    const upperHalfAnimation = useAnimatedStyle(() => ({
        transform: [{
            translateY: withDelay(500,
                withTiming(unlock.value ? 20 : 32, {
                    duration: 300,
                    easing: Easing.inOut(Easing.quad)
                })
            )
        }],
        borderColor: withDelay(500,
            withTiming(unlock.value ? colors.emerald[500] : (themeValue.value === "dark" ? "white" : "black"), {
                duration: 300,
                easing: Easing.inOut(Easing.quad)
            })
        )
    }));

    const upperHalfChildAnimation = useAnimatedStyle(() => ({
        transform: [{
            translateY: withDelay(500,
                withTiming(unlock.value ? 0 : 10, {
                    duration: 300,
                    easing: Easing.inOut(Easing.quad)
                })
            )
        }],
        opacity: withDelay(500,
            withTiming(unlock.value ? 1 : 0, {
                duration: 300,
                easing: Easing.inOut(Easing.quad)
            })
        )
    }));

    const lowerHalfAnimation = useAnimatedStyle(() => ({
        backgroundColor: withDelay(500,
            withTiming(unlock.value ? colors.emerald[500] : (themeValue.value === "dark" ? "white" : "black"), {
                duration: 300,
                easing: Easing.inOut(Easing.quad)
            })
        )
    }));

    const animation = useAnimatedStyle(() => {
        if (unlock.value) {
            return ({
                transform: [{
                    scale: withRepeat(
                        withSequence(
                            withTiming(1, {
                                duration: 300,
                                easing: Easing.inOut(Easing.quad)
                            }),
                            withTiming(1.2, {
                                duration: 300,
                                easing: Easing.inOut(Easing.quad)
                            }),
                            withDelay(
                                600,
                                withTiming(1, {
                                    duration: 300,
                                    easing: Easing.inOut(Easing.quad)
                                }),
                            )
                        ),
                        1
                    )
                }]
            });
        }
        else {
            return ({});
        }
    })

    const textAnimation = useAnimatedStyle(() => ({
        backgroundColor: withDelay(500,
            withTiming(unlock.value ? colors.emerald[500] : (themeValue.value === "dark" ? "white" : "black"), {
                duration: 300,
                easing: Easing.inOut(Easing.quad)
            })
        )
    }));

    return (
        <Container center>
            <View className="relative w-full h-full flex justify-center items-center">
                <View className="w-full h-[90%]">
                    <View className="w-full h-1/2 flex justify-center items-center gap-4">
                        <Animated.View
                            style={animation}
                            className="size-[200px] flex justify-center items-center p-10"
                        >
                            <Animated.View
                                style={upperHalfAnimation}
                                className="relative w-[60%] h-[80px] border-[10px] rounded-3xl"
                            >
                                <Animated.View
                                    style={upperHalfChildAnimation}
                                    className="absolute -right-[10.2px] bottom-0 w-[10px] h-[50%] dark:bg-black bg-white"
                                ></Animated.View>
                            </Animated.View>
                            <Animated.View
                                style={lowerHalfAnimation}
                                className="w-[80%] h-[60px] flex justify-center items-center rounded-xl"
                            >
                                <FontAwesome6
                                    name="key"
                                    size={40}
                                    color={unlock.value ? "black" : (theme === "dark" ? "black" : "white")}
                                />
                            </Animated.View>
                        </Animated.View>
                        <View className="w-full flex flex-row justify-center">
                            <MaskedView
                                style={{
                                    width: "90%",
                                    height: 100,
                                    display: "flex",
                                    flexDirection: "row",
                                }}
                                maskElement={(
                                    <View className="w-full h-full flex flex-row justify-center items-center">
                                        <Text className="text-4xl text-transparent font-extrabold">
                                            App {lockText}
                                        </Text>
                                    </View>
                                )}
                            >
                                <View className="flex-1 h-full bg-emerald-500" />
                                <Animated.View
                                    style={textAnimation}
                                    className="flex-1 h-full"
                                />
                            </MaskedView>
                        </View>
                    </View>

                    <View className="w-full h-1/2 flex items-center pt-20">
                        <Button
                            scale={.7}
                            onPress={() => handleLocalAuth()}
                            className="w-[200px] h-[60px]"
                        >
                            <Text className="text-2xl font-bold">Déverrouiller</Text>
                        </Button>
                    </View>
                </View>

                <View className="w-full h-[10%] flex flex-row justify-center items-center gap-3 p-3">
                    <View className="size-[70px] p-1 rounded-full">
                        <Image
                            source={require("../assets/images/logo.jpg")}
                            style={{
                                width: "100%",
                                height: "100%",
                                borderWidth: 2,
                                borderRadius: 9999
                            }}
                        />
                    </View>
                    <Text
                        numberOfLines={1}
                        className="text-2xl dark:text-white text-black font-extrabold"
                    >
                        {APP_NAME}
                    </Text>
                </View>
            </View>

            <Toast
                message={toast.message}
                type={toast.type}
                top={toast.top}
                show={toast.show}
                onCancel={() => setToast({
                    ...toast,
                    show: false,
                })}
            />
        </Container >
    );
}