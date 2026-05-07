import { Avatar } from "@/components/avatar";
import { PressableAnimated, PressableAnimatedProps } from "@/components/pressable-animated";
import { TextAnimated } from "@/components/text-animated";
import { COLORS } from "@/constants/colors";
import { useTheme } from "@/hooks/use-theme";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import clsx from "clsx";
import { LinearGradient } from "expo-linear-gradient";
import { Slot, usePathname, useRouter } from "expo-router";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

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
                    focused && "font-extrabold",
                )}
            >
                {name}
            </TextAnimated>
        </PressableAnimated>
    )
}

export default function Layout() {
    const { theme } = useTheme();
    const pathname = usePathname();
    const { t } = useTranslation();
    const router = useRouter();

    return (
        <>
            <Slot />
            <View className="absolute left-0 bottom-2 w-full flex items-center py-2 z-[1000px]">
                <LinearGradient
                    style={{
                        borderRadius: 50,
                    }}
                    colors={theme == "dark" ? ["rgba(0, 0, 0, .5)", "rgba(0, 0, 0, .9)", "rgba(0, 0, 0, .5)"] : ["rgba(255, 255, 255, .5)", "rgba(255, 255, 255, .9)", "rgba(255, 255, 255, .5)"]}
                    className="sm:w-max w-[90%] flex flex-row justify-center items-center gap-8 px-3 py-2 rounded-[50px] border dark:border-white/20 border-black/20"
                >
                    <NavButton
                        name={t("home")}
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

                    <NavButton
                        name={t("profile")}
                        focused={pathname == "/profile"}
                        icon={(
                            <Avatar
                                size={25}
                                scale={1.3}
                                name={{
                                    value: "Youmbi Le-duc",
                                    size: 10,
                                }}
                            />
                        )}
                        onPress={() => router.navigate("/profile")}
                    />
                </LinearGradient>
            </View>
        </>
    )
}