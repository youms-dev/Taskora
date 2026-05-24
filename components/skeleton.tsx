import { useTheme } from "@/hooks/use-theme";
import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";

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
    }));

    const animation = useAnimatedStyle(() => ({
        opacity: withRepeat(
            withSequence(
                withTiming(.5, {
                    duration: 1000,
                    easing: Easing.inOut(Easing.linear),
                }),
                withDelay(
                    500,
                    withTiming(1, {
                        duration: 1000,
                        easing: Easing.inOut(Easing.linear),
                    }),
                )
            ),
            Infinity,
            true,
        )
    }));

    return (
        <Animated.View
            style={animation}
            className="w-full h-full dark:bg-white/20 bg-black/20 overflow-hidden"
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
        </Animated.View>
    );
}