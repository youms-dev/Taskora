import { COLORS } from "@/constants/colors";
import clsx from "clsx";
import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";

interface Props {
    value?: "light" | 'dark' | "system";
}

export const ThemeCard = ({ value = "system" }: Props) => {
    return (
        <View className="w-full h-full bg-white/20 rounded-2xl">
            {
                value != "system" && (
                    <View className={clsx(
                        "size-full flex flex-col justify-center items-center gap-3 rounded-2xl p-3 border dark:border-white/20 border-black/50",
                        value == "light" && "bg-white",
                        value == "dark" && "bg-black",
                    )}>
                        <View className={clsx(
                            "w-full h-4 rounded-3xl",
                            value == "light" && "bg-black/20",
                            value == "dark" && "bg-white/10",
                        )}></View>
                        <View className={clsx(
                            "w-full h-3 rounded-3xl",
                            value == "light" && "bg-black/20",
                            value == "dark" && "bg-white/10",
                        )}></View>
                        <View className={clsx(
                            "w-full h-3 rounded-3xl",
                            value == "light" && "bg-black/20",
                            value == "dark" && "bg-white/10",
                        )}></View>
                    </View>
                )
            }
            {
                value == "system" && (
                    <LinearGradient
                        colors={["white", "black"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        locations={[.3, .5]}
                        style={{
                            borderRadius: 10
                        }}
                        className="size-full flex flex-col justify-center items-center gap-3 p-3 border dark:border-white/20 border-black/50"
                    >
                        <LinearGradient
                            colors={[COLORS.black[200], COLORS.white[100]]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            locations={[.3, .6]}
                            style={{
                                borderRadius: 20
                            }}
                            className="w-full h-4"
                        >
                        </LinearGradient>
                        <LinearGradient
                            colors={[COLORS.black[200], COLORS.white[100]]}
                            start={{ x: 0, y: -2 }}
                            end={{ x: 1, y: 1 }}
                            locations={[.4, .7]}
                            style={{
                                borderRadius: 20
                            }}
                            className="w-full h-4"
                        >
                        </LinearGradient>
                        <LinearGradient
                            colors={[COLORS.black[200], COLORS.white[100]]}
                            start={{ x: 0, y: -2 }}
                            end={{ x: 1, y: 1 }}
                            locations={[.1, .3]}
                            style={{
                                borderRadius: 20
                            }}
                            className="w-full h-4"
                        >
                        </LinearGradient>
                    </LinearGradient>
                )
            }
        </View >
    );
}