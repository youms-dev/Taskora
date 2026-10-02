import { Button } from "@/components/Button";
import { Container } from "@/components/container";
import { COLORS } from "@/constants/colors";
import { APP_NAME, AUTH_STORAGE } from "@/constants/names";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useAsyncStorage } from "@react-native-async-storage/async-storage";
import MaskedView from "@react-native-masked-view/masked-view";
import { Session } from "@supabase/supabase-js";
import { Image } from "expo-image";
import { authenticateAsync } from "expo-local-authentication";
import { usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";

export default function LockScreen() {
    const [lockText, setLockText] = useState<string>("verrouillée");
    const { theme: appTheme } = useTheme();
    const [theme, setTheme] = useState<typeof appTheme>(appTheme);
    const themeValue = useSharedValue<typeof appTheme>(appTheme);
    const [lock, setLock] = useState<boolean>(false);
    const unlock = useSharedValue<boolean>(false);
    const [user, setUser] = useState<Session["user"] | undefined>(undefined);
    const { setToast } = useToast();
    const [loading, setLoading] = useState<boolean>(false);
    const pathname = usePathname();

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
            withTiming(unlock.value ? COLORS.emerald[500] : (themeValue.value == "dark" ? "white" : "black"), {
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
            withTiming(unlock.value ? COLORS.emerald[500] : (themeValue.value == "dark" ? "white" : "black"), {
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
            withTiming(unlock.value ? COLORS.emerald[500] : (themeValue.value == "dark" ? "white" : "black"), {
                duration: 300,
                easing: Easing.inOut(Easing.quad),
            })
        )
    }));

    useEffect(() => {
        themeValue.value = appTheme;
        setTheme(appTheme);
    }, [appTheme]);

    const handleLocalAuth = async () => {
        const { success } = await authenticateAsync();
        const { setItem } = useAsyncStorage(AUTH_STORAGE);

        if (success) {
            await setItem(JSON.stringify({
                verified: true
            }));
            setToast("Déverrouillé 🔓😉", "success");
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
                            source={require("../../assets/images/logo.png")}
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
        </Container>
    );
}