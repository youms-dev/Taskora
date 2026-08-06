import { PressableAnimated } from "@/components/pressable-animated";
import { TextAnimated } from "@/components/text-animated";
import { COLORS } from "@/constants/colors";
import { useTheme } from "@/hooks/use-theme";
import { event, EXPAND_NAVBAR, HIDE_NAVBAR, MINIMIZE_NAVBAR, SHOW_NAVBAR } from "@/lib/event-emitter";
import Entypo from "@expo/vector-icons/Entypo";
import Feather from '@expo/vector-icons/Feather';
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Fontisto from '@expo/vector-icons/Fontisto';
import clsx from "clsx";
import { Tabs, usePathname, useRouter } from "expo-router";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, PressableProps, useWindowDimensions, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

interface IconProps extends PressableProps {
    focused?: boolean;
    name: string;
    icon: ReactNode;
}

const NavButton = ({ name, focused, icon, ...rest }: IconProps) => {
    return (
        <Pressable
            {...rest}
            className="w-[25%] h-full flex justify-center items-center"
        >
            <View className="flex justify-center items-center py-1">
                {icon}
            </View>

            <TextAnimated
                numberOfLines={1}
                dark={focused ? COLORS.emerald[500] : "rgba(255, 255, 255, 0.8)"}
                light={focused ? COLORS.emerald[500] : "rgba(0, 0, 0, 0.8)"}
                className={clsx(
                    "text-sm",
                    focused && "font-extrabold",
                )}
            >
                {name}
            </TextAnimated>
        </Pressable>
    )
}

export default function Layout() {
    const { theme } = useTheme();
    const pathname = usePathname();
    const { t } = useTranslation();
    const router = useRouter();
    const hide = useSharedValue<boolean>(false);
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const navWidth = useSharedValue<number>(0);
    const shareScreenHeight = useSharedValue<number>(screenHeight);
    const sharedScreenWidth = useSharedValue<typeof screenWidth>(0);
    const minimizeShared = useSharedValue<boolean>(false);
    const timeout = useRef<ReturnType<typeof setTimeout>>(null);
    const [minimize, setMinimize] = useState<boolean>(false);
    const navHeight = useSharedValue<number>(0);
    const tabChangeTimeout = useRef<ReturnType<typeof setTimeout>>(null);

    useEffect(() => {
        const onOpen = () => {
            hide.value = true;
        }
        const onClose = () => {
            hide.value = false;
        }

        const onMinimize = () => {
            setMinimize(true);
        }

        const onExpand = () => {
            setMinimize(false);
        }

        event.addListener(SHOW_NAVBAR, onClose);
        event.addListener(HIDE_NAVBAR, onOpen);

        event.addListener(MINIMIZE_NAVBAR, onMinimize);
        event.addListener(EXPAND_NAVBAR, onExpand);

        return () => {
            event.removeAllListeners(HIDE_NAVBAR);
            event.removeAllListeners(SHOW_NAVBAR);
            event.removeAllListeners(MINIMIZE_NAVBAR);
            event.removeAllListeners(EXPAND_NAVBAR);
        }
    }, []);

    const navContainerAnimation = useAnimatedStyle(() => ({
        right: minimizeShared.value ?
            withTiming(10, {
                duration: 500,
                easing: Easing.inOut(Easing.quad),
            })
            :
            ((sharedScreenWidth.value / 2) - (navWidth.value / 2))
        ,
        width: withTiming(minimizeShared.value ?
            45
            :
            (sharedScreenWidth.value <= 500 ? (sharedScreenWidth.value * .92) : 380),
            {
                duration: 200,
                easing: Easing.inOut(Easing.quad),
            }
        ),
        height: withTiming(minimizeShared.value ?
            45
            :
            navHeight.value,
            {
                duration: 200,
                easing: Easing.inOut(Easing.quad),
            }
        ),
        transform: [
            {
                translateY: withTiming(hide.value ? shareScreenHeight.value : -25, {
                    duration: 200,
                    easing: Easing.inOut(Easing.quad),
                }),
            }
        ],
        borderRadius: minimizeShared.value ? 9999 : 50,
    }));

    useEffect(() => {
        sharedScreenWidth.value = screenWidth;
        shareScreenHeight.value = screenHeight;
    }, [screenWidth, screenHeight]);

    useEffect(() => {
        minimizeShared.value = minimize;
    }, [minimize]);

    useEffect(() => {
        timeout.current && clearTimeout(timeout.current);

        if (!minimize && pathname == "/agenda") {
            timeout.current = setTimeout(() => {
                !minimize && setMinimize(true);
            }, 3000);
        }
        else if (pathname != "/agenda") {
            setMinimize(false);
        }
    }, [minimize, pathname]);

    const navAnimation = useAnimatedStyle(() => ({
        opacity: minimizeShared.value ? 0 : withTiming(1, {
            duration: 600,
            easing: Easing.inOut(Easing.quad),
        }),
    }));

    const navShadowAnimation = useAnimatedStyle(() => ({
        opacity: minimizeShared.value ? 0 : withTiming(1, {
            duration: 600,
            easing: Easing.inOut(Easing.quad),
        }),
    }));

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarHideOnKeyboard: true,
            }}
            tabBar={() => (
                <Animated.View
                    style={[
                        navContainerAnimation,
                    ]}
                    className="absolute bottom-0 z-[9999]"
                >
                    <PressableAnimated
                        onPress={() => setMinimize(false)}
                        style={{
                            zIndex: minimize ? 1 : -1,
                            opacity: minimize ? 1 : 0,
                        }}
                        className="absolute dark:bg-black bg-white rounded-full"
                    >
                        <View className="size-full flex justify-center items-center dark:bg-white/10 bg-black/80 rounded-full p-3">
                            <Feather
                                name="maximize-2"
                                size={20}
                                color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(255, 255, 255, .8)"}
                            />
                        </View>
                    </PressableAnimated>

                    <Animated.View
                        onLayout={(e) => {
                            navWidth.value = e.nativeEvent.layout.width;
                            navHeight.value = e.nativeEvent.layout.height;
                        }}
                        style={[
                            {
                                zIndex: minimize ? -1 : 1,
                            },
                            navAnimation,
                        ]}
                        className="absolute dark:bg-black bg-white rounded-[50px] shrink-0"
                    >
                        <View className="w-full flex-row justify-center items-center px-3 py-2 dark:bg-white/10 bg-white rounded-[50px] border dark:border-white/20 border-black/20">
                            <Animated.View
                                style={[
                                    {
                                        transform: [
                                            {
                                                translateY: 10,
                                            }
                                        ],
                                        filter: "blur(5px)"
                                    },
                                    navShadowAnimation,
                                ]}
                                className="absolute bottom-0 w-[105%] h-full bg-black/30 -z-[1] rounded-[50px]"
                            />

                            <NavButton
                                name={t("nav_tasks")}
                                focused={pathname == "/"}
                                icon={(
                                    <FontAwesome6
                                        name="list-check"
                                        size={25}
                                        color={pathname == "/" ? "rgb(16, 185, 129)" : (theme === "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)")}
                                    />
                                )}
                                onPress={() => {
                                    tabChangeTimeout.current && clearTimeout(tabChangeTimeout.current);
                                    tabChangeTimeout.current = setTimeout(() => {
                                        pathname != "/" && router.navigate("/");
                                    }, 250);
                                }}
                            />

                            <NavButton
                                name={t("agenda")}
                                focused={pathname == "/agenda"}
                                icon={(
                                    <Fontisto
                                        name="calendar"
                                        size={25}
                                        color={pathname == "/agenda" ? "rgb(16, 185, 129)" : (theme === "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)")}
                                    />
                                )}
                                onPress={() => {
                                    tabChangeTimeout.current && clearTimeout(tabChangeTimeout.current);
                                    tabChangeTimeout.current = setTimeout(() => {
                                        pathname != "/agenda" && router.navigate("/agenda");
                                    }, 250);
                                }}
                            />

                            <NavButton
                                name={t("notifications")}
                                focused={pathname == "/notifications"}
                                icon={(
                                    <Entypo
                                        name="bell"
                                        size={25}
                                        color={pathname == "/notifications" ? "rgb(16, 185, 129)" : (theme === "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)")}
                                    />
                                )}
                                onPress={() => {
                                    tabChangeTimeout.current && clearTimeout(tabChangeTimeout.current);
                                    tabChangeTimeout.current = setTimeout(() => {
                                        pathname != "/notifications" && router.navigate("/notifications");
                                    }, 250);
                                }}
                            />

                            <NavButton
                                name={t("settings")}
                                focused={pathname == "/settings"}
                                icon={(
                                    <FontAwesome6
                                        name="gears"
                                        size={25}
                                        color={pathname == "/settings" ? "rgb(16, 185, 129)" : (theme === "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)")}
                                    />
                                )}
                                onPress={() => {
                                    tabChangeTimeout.current && clearTimeout(tabChangeTimeout.current);
                                    tabChangeTimeout.current = setTimeout(() => {
                                        pathname != "/settings" && router.navigate("/settings");
                                    }, 250);
                                }}
                            />
                        </View>
                    </Animated.View>
                </Animated.View>
            )}
        >
            <Tabs.Screen name="index" />

            <Tabs.Screen
                name="agenda"
                options={{
                    lazy: false,
                }}
            />

            <Tabs.Screen name="notifications" />

            <Tabs.Screen name="settings" />
        </Tabs>
    )
}