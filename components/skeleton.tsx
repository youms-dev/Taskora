import { useTheme } from "@/hooks/use-theme";
import { LinearGradient } from "expo-linear-gradient";
import { memo, useEffect } from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";

interface Props {
    delay?: number;
}

export const Skeleton = memo(({ delay = 0 }: Props) => {
    const { theme, themeShared } = useTheme();
    const width = useSharedValue<number>(0);
    const animationDelay = useSharedValue<number>(0);

    const slideAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: withSequence(
                    withTiming(-width.value, {
                        duration: 0,
                    }),
                    withDelay(
                        animationDelay.value,
                        withRepeat(
                            withSequence(
                                withTiming(width.value * 2.5, {
                                    duration: 5000,
                                    easing: Easing.inOut(Easing.quad)
                                }),
                                withTiming(-width.value, {
                                    duration: 0,
                                }),
                            ),
                            Infinity,
                        ),
                    ),
                )
            },
            {
                translateY: "-20%",
            },
            {
                skewY: "20deg"
            }
        ]
    }));

    const opacityAnimation = useAnimatedStyle(() => ({
        opacity: withDelay(
            animationDelay.value,
            withRepeat(
                withSequence(
                    withTiming(1, {
                        duration: 1000,
                        easing: Easing.inOut(Easing.linear),
                    }),
                    withDelay(
                        1000,
                        withTiming(themeShared.value == "dark" ? .5 : .05, {
                            duration: 1000,
                            easing: Easing.inOut(Easing.linear),
                        }),
                    ),
                ),
                Infinity,
                true,
            ),
        ),
    }));

    useEffect(() => {
        animationDelay.value = delay;
    }, [delay]);

    return (
        <Animated.View
            style={opacityAnimation}
            onLayout={(e) => width.value = e.nativeEvent.layout.width}
            className="w-full h-full dark:bg-black bg-white overflow-hidden"
        >
            <View className="size-full dark:bg-white/10 bg-white">
                <Animated.View
                    style={slideAnimation}
                    className="absolute left-0 top-0 w-[60px] h-[200%]"
                >
                    <LinearGradient
                        colors={theme == "dark" ?
                            ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, .2)", "rgba(255, 255, 255, 0)"]
                            :
                            ["rgba(0, 0, 0, .02)", "rgba(0, 0, 0, .06)", "rgba(0, 0, 0, .02)"]
                        }
                        start={{ x: 0, y: 1 }}
                        end={{ x: 1, y: 1 }}
                        locations={[0, 0.5, 1]}
                        className="size-full"
                    />
                </Animated.View>
            </View>
        </Animated.View>
    );
});