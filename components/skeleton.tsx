import { useTheme } from "@/hooks/use-theme";
import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, withRepeat, withSequence, withTiming } from "react-native-reanimated";

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export const Skeleton = () => {
    const { theme } = useTheme();

    const linearAnimation = useAnimatedStyle(() => ({
        left: withRepeat(
            withSequence(
                withTiming("-150%", {
                    duration: 1,
                }),
                withTiming("150%", {
                    duration: 3000,
                    easing: Easing.inOut(Easing.quad)
                }),
            ),
            Infinity,
        ),
    }))

    return (
        <View
            className="relative w-full h-full dark:bg-white/20 bg-black/20 rounded-3xl overflow-hidden"
        >
            <AnimatedLinearGradient
                colors={["rgba(255, 255, 255, 0)", theme === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(255, 255, 255, 0.8)", "rgba(255, 255, 255, 0)"]}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 1 }}
                locations={[0, 0.5, 1]}
                style={linearAnimation}
                className="absolute top-[-50%] w-[50px] h-[200%] skew-y-[30deg]"
            >
            </AnimatedLinearGradient>
        </View>
    );
}