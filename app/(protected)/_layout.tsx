import { PressableAnimated, PressableAnimatedProps } from "@/components/pressable-animated";
import { TextAnimated } from "@/components/text-animated";
import { COLORS } from "@/constants/colors";
import { tabPaths } from "@/constants/names";
import { useTheme } from "@/hooks/use-theme";
import { event, MODAL_CLOSED, MODAL_OPEN } from "@/lib/event-emitter";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Fontisto from '@expo/vector-icons/Fontisto';
import clsx from "clsx";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, usePathname, useRouter } from "expo-router";
import { ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useWindowDimensions, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

interface IconProps extends PressableAnimatedProps {
    focused?: boolean;
    name: string;
    icon: ReactNode;
}

const NavButton = ({ name, focused, icon, ...rest }: IconProps) => {
    return (
        <PressableAnimated
            {...rest}
            scale={.8}
            className="flex justify-center items-center"
        >
            <View className="w-max flex justify-center items-center px-8 py-1">
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
        </PressableAnimated>
    )
}

const LinearGradientAnimated = Animated.createAnimatedComponent(LinearGradient);

export default function Layout() {
    const { theme } = useTheme();
    const pathname = usePathname();
    const { t } = useTranslation();
    const router = useRouter();
    const hide = useSharedValue<boolean>(false);
    const { width, height } = useWindowDimensions();
    const [navWidth, setNavWidth] = useState<number>(0);
    const [navLeft, setNavLeft] = useState<number>(0);
    const deviceHeight = useSharedValue<number>(height);

    useEffect(() => {
        const onOpen = () => {
            hide.value = true;
        }
        const onClose = () => {
            if (tabPaths.includes(pathname)) hide.value = false;
        }

        event.addListener(MODAL_OPEN, onOpen);
        event.addListener(MODAL_CLOSED, onClose);

        return () => {
            event.removeAllListeners(MODAL_OPEN);
            event.removeAllListeners(MODAL_CLOSED);
        }
    }, []);

    const animation = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: withTiming(hide.value ? deviceHeight.value : -30, {
                    duration: 200,
                    easing: Easing.inOut(Easing.quad),
                }),
            }
        ],
    }));

    useEffect(() => {
        setNavLeft((width / 2) - (navWidth / 2));
        deviceHeight.value = height;
    }, [width, navWidth, height]);

    useEffect(() => {
        if (tabPaths.includes(pathname)) hide.value = false;
        else hide.value = true;
    }, [pathname]);

    return (
        <>
            <Stack screenOptions={{
                headerShown: false,
            }}>
                <Stack.Screen
                    name="index"
                    options={{
                        animation: "fade",
                    }}
                />

                <Stack.Screen
                    name="[id]"
                    options={{
                        animation: "fade",
                    }}
                />

                <Stack.Screen
                    name="agenda"
                    options={{
                        animation: "fade",
                    }}
                />

                <Stack.Screen
                    name="notifications"
                    options={{
                        animation: "fade",
                    }}
                />

                <Stack.Screen
                    name="settings"
                    options={{
                        animation: "fade",
                    }}
                />

                <Stack.Screen name="profile" />

                <Stack.Screen
                    name="lock-screen"
                    options={{
                        animation: "fade_from_bottom",
                    }}
                />
            </Stack>

            {/* <Slot /> */}

            <LinearGradientAnimated
                onLayout={(e) => setNavWidth(e.nativeEvent.layout.width)}
                style={[
                    {
                        left: navLeft,
                    },
                    animation,
                ]}
                colors={theme == "dark" ? ["rgba(0, 0, 0, .5)", "rgba(0, 0, 0, .9)", "rgba(0, 0, 0, .5)"] : ["rgba(255, 255, 255, .9)", "rgba(255, 255, 255, .9)", "rgba(255, 255, 255, .9)"]}
                className="absolute bottom-0 sm:w-max w-[95%] flex flex-row justify-center items-center px-3 py-2 rounded-[50px] border dark:border-white/20 border-black/20 overflow-hidden z-[1000]"
            >
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
                    onPress={() => router.navigate("/")}
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
                    onPress={() => router.navigate("/agenda")}
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
                    onPress={() => router.navigate("/notifications")}
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
                    onPress={() => router.navigate("/settings")}
                />
            </LinearGradientAnimated>
        </>
    )
}