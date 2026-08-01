import { useTheme } from "@/hooks/use-theme";
import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";

interface Props {
    value?: "light" | 'dark' | "system";
}

/**
 * 
 * @param value Theme card value
 * @default system
 * 
 * @returns Theme card component
 */

export const ThemeCard = ({ value = "system" }: Props) => {
    const { theme } = useTheme();

    return (
        <View className="w-full h-full dark:bg-black bg-white rounded-2xl">
            {
                value != "system" && (
                    <View
                        style={{
                            backgroundColor: (() => {
                                if (value == "light") return theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .04)";
                                else if (value == "dark") return "rgba(0, 0, 0, 1)";
                            })()
                        }}
                        className="size-full flex flex-col justify-center items-center gap-3 rounded-2xl p-3 border dark:border-white/20 border-black/10"
                    >
                        {
                            Array(3).fill(0).map((_, i) => (
                                <View
                                    key={i}
                                    style={{
                                        backgroundColor: (() => {
                                            if (value == "light") return "rgba(255, 255, 255, 1)";
                                            else if (value == "dark") return theme == "dark" ? "rgba(255, 255, 255, .1)" : "rgba(255, 255, 255, .2)";
                                        })()
                                    }}
                                    className="w-full h-4 rounded-3xl"
                                />
                            ))
                        }
                    </View>
                )
            }
            {
                value == "system" && (
                    <LinearGradient
                        colors={[theme == "dark" ? "rgba(255, 255, 255,.8)" : "rgba(0, 0, 0,.05)", "black"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        locations={[.3, .5]}
                        className="size-full flex flex-col justify-center items-center gap-3 p-3 border dark:border-white/20 border-black/20 overflow-hidden rounded-[10px]"
                    >
                        {
                            Array(3).fill(0).map((_, i) => (
                                <LinearGradient
                                    key={i}
                                    colors={(() => {
                                        if (i <= 1) return ["rgba(255, 255, 255, .8)", theme == "dark" ? "rgba(255, 255, 255, .1)" : "rgba(255, 255, 255, .2)"];
                                        return theme == "dark" ? ["rgba(255, 255, 255, .2)", "rgba(255, 255, 255, .1)"] : ["rgba(255, 255, 255, .3)", "rgba(255, 255, 255, .2)"];
                                    })()}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    locations={(() => {
                                        if (i == 0) return [.2, .6];
                                        else if (i == 1) return [.1, .3];
                                        return [.01, .6];
                                    })()}
                                    className="w-full h-4 rounded-[20px] overflow-hidden"
                                />
                            ))
                        }
                    </LinearGradient>
                )
            }
        </View>
    );
}