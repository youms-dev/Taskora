import { Button } from "@/components/Button";
import { Container } from "@/components/container";
import { LayoutComponent } from "@/components/layout";
import { Loader } from "@/components/loader";
import { Toast, ToastProps } from "@/components/toast";
import { colors } from "@/constants/colors";
import { APP_NAME, AUTH_STORAGE } from "@/constants/names";
import { useTheme } from "@/hooks/use-theme";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useAsyncStorage } from "@react-native-async-storage/async-storage";
import MaskedView from "@react-native-masked-view/masked-view";
import { Session } from "@supabase/supabase-js";
import { Image } from "expo-image";
import { authenticateAsync } from "expo-local-authentication";
import { Stack, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { AppState, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { supabase } from "./lib/supabase";

export default function Layout() {
    const [loading, setLoading] = useState<boolean>(true);
    const [user, setUser] = useState<Session["user"] | undefined>(undefined);
    const pathname = usePathname();
    const [lock, setLock] = useState<boolean>(false);
    const [toast, setToast] = useState<Omit<ToastProps, "onCancel">>({
        show: false,
        message: "",
        top: 0,
        type: "default",
    });
    const unlock = useSharedValue<boolean>(false);
    const { theme: appTheme } = useTheme();
    const themeValue = useSharedValue<typeof appTheme>(appTheme);
    const [lockText, setLockText] = useState<string>("verrouillée");
    const [theme, setTheme] = useState<typeof appTheme>(appTheme);

    useEffect(() => {
        themeValue.value = appTheme;
        setTheme(appTheme);
    }, [appTheme]);

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
            withTiming(unlock.value ? colors.emerald[500] : (themeValue.value == "dark" ? "white" : "black"), {
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
            withTiming(unlock.value ? colors.emerald[500] : (themeValue.value == "dark" ? "white" : "black"), {
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
            withTiming(unlock.value ? colors.emerald[500] : (themeValue.value == "dark" ? "white" : "black"), {
                duration: 300,
                easing: Easing.inOut(Easing.quad),
            })
        )
    }));

    const handleLocalAuth = async () => {
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
                setLock(false);
            }, 1500);
        }
    }

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setUser(data.session?.user);
            setLoading(false);
        });

        const { data } = supabase.auth.onAuthStateChange((_, session) => {
            setUser(session?.user);
        });

        return () => data.subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const checkLocalAuth = async () => {
            const { getItem } = useAsyncStorage(AUTH_STORAGE);
            const auth = await getItem();

            if (auth != null) {
                const { verified } = JSON.parse(auth);

                if (!verified && !["/login", "/register"].includes(pathname)) {
                    setLock(true);
                    setLockText("verrouillée");
                    handleLocalAuth();
                    unlock.value = false;
                }
            }
        }

        checkLocalAuth();
    }, [pathname]);

    useEffect(() => {
        const changeAuthState = async () => {
            const { getItem, setItem } = useAsyncStorage(AUTH_STORAGE);
            const auth = await getItem();

            if (
                auth != null
                &&
                (
                    AppState.currentState === "background"
                    ||
                    AppState.currentState === "inactive"
                )
            ) {
                await setItem(JSON.stringify({
                    verified: false,
                }));
                setLock(true);
                setLockText("verrouillée");
                unlock.value = false;
            }
        }
        const { remove } = AppState.addEventListener("change", changeAuthState);

        return () => remove();
    }, []);

    return (
        <LayoutComponent>
            {
                loading && (
                    <Container centerX>
                        <View className="w-full h-full flex justify-center items-center">
                            <View className="size-[100px]">
                                <Loader />
                            </View>
                        </View>
                    </Container>
                )
            }

            {
                !loading && lock && (
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
                )
            }

            {
                !loading && !lock && (
                    <Stack screenOptions={{
                        headerShown: false,
                        gestureEnabled: true,
                        gestureDirection: "horizontal",
                        animation: "slide_from_right",
                        animationDuration: 300,
                    }}>

                        <Stack.Protected guard={user && !user.user_metadata.name ? true : false}>
                            <Stack.Screen name="onboarding" />
                        </Stack.Protected>

                        <Stack.Protected guard={user ? false : true}>
                            <Stack.Screen
                                name="(auth)"
                                options={{
                                    animation: "fade",
                                }}
                            />
                        </Stack.Protected>

                        <Stack.Protected guard={user ? true : false}>
                            <Stack.Screen name="index" />
                        </Stack.Protected>

                        <Stack.Protected guard={user ? true : false}>
                            <Stack.Screen
                                name="[id]"
                                options={{
                                    animation: "slide_from_left",
                                }}
                            />
                        </Stack.Protected>

                    </Stack>
                )
            }
        </LayoutComponent>
    )
}