import { COLORS } from "@/constants/colors"
import { Image } from "expo-image"
import { StatusBar } from "expo-status-bar"
import { useColorScheme } from "nativewind"
import { useEffect, useState } from "react"
import { View } from "react-native"
import { TextGradient } from "./text-gradient"

export const SplashScreen = () => {
    const { colorScheme } = useColorScheme();
    const [theme, setTheme] = useState<"light" | "dark">();

    useEffect(() => {
        setTheme(colorScheme == "dark" ? "dark" : "light");
    }, [colorScheme]);

    return (
        <View className="w-screen h-screen flex justify-center items-center">
            <StatusBar
                style={theme == "dark" ? "light" : "dark"}
                translucent
            />
            <View className="w-full h-full flex justify-center items-center dark:bg-black bg-white">
                <Image
                    source={require("../assets/images/logo.png")}
                    style={{
                        width: 200,
                        height: 200,
                    }}
                />

                <View
                    style={{
                        transform: [
                            {
                                translateY: -60,
                            }
                        ]
                    }}
                    className="absolute bottom-0 w-full flex justify-center items-center"
                >
                    <TextGradient
                        colors={[theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)", COLORS.emerald[500]]}
                        className="text-3xl tracking-widest font-bold"
                    >
                        Taskora
                    </TextGradient>
                </View>
            </View>
        </View>
    )
}