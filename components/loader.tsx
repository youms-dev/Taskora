import Animated, { Easing, useAnimatedStyle, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";

interface Props {
    size?: number;
}

/**
 * 
 * @param size Loader size
 * @default 100
 * 
 * @returns Loader component
 */

export const Loader = ({ size = 100 }: Props) => {
    const rootAnimation = useAnimatedStyle(() => ({
        transform: [{
            rotate: withRepeat(
                withDelay(
                    1000,
                    withSequence(
                        withTiming("0deg", {
                            duration: 3000,
                            easing: Easing.inOut(Easing.linear),
                        }),
                        withTiming("180deg", {
                            duration: 3000,
                            easing: Easing.inOut(Easing.linear),
                        }),
                    ),
                ),
                Infinity,
                true
            ),
        }]
    }));

    const firstChildAnimation = useAnimatedStyle(() => ({
        top: withRepeat(
            withSequence(
                withTiming("-4%", {
                    duration: 1200,
                    easing: Easing.inOut(Easing.quad),
                }),
                withTiming("-4%", {
                    duration: 1200,
                    easing: Easing.inOut(Easing.quad),
                }),
            ),
            Infinity,
            true
        ),
        transform: [
            {
                rotate: withRepeat(
                    withSequence(
                        withTiming("0deg", {
                            duration: 1200,
                            easing: Easing.inOut(Easing.quad)
                        }),
                        withTiming("-120deg", {
                            duration: 1200,
                            easing: Easing.inOut(Easing.quad)
                        }),
                    ),
                    Infinity,
                    true
                )
            },
            {
                perspective: 100,
            },
            {
                rotateX: "60deg",
            },
            {
                rotateY: "55deg",
            },
        ]
    }));

    const lastChildAnimation = useAnimatedStyle(() => ({
        top: withRepeat(
            withSequence(
                withTiming("4%", {
                    duration: 1200,
                    easing: Easing.inOut(Easing.quad),
                }),
                withTiming("4%", {
                    duration: 1200,
                    easing: Easing.inOut(Easing.quad),
                }),
            ),
            Infinity,
            true
        ),
        transform: [
            {
                rotate: withRepeat(
                    withSequence(
                        withTiming("0deg", {
                            duration: 1200,
                            easing: Easing.inOut(Easing.quad)
                        }),
                        withTiming("120deg", {
                            duration: 1200,
                            easing: Easing.inOut(Easing.quad)
                        }),
                    ),
                    Infinity,
                    true
                )
            },
            {
                perspective: 100,
            },
            {
                rotateX: "-60deg",
            },
            {
                rotateY: "55deg",
            },
        ]
    }));

    return (
        <Animated.View
            style={[
                rootAnimation,
                {
                    width: size,
                    height: size,
                }
            ]}
            className="relative flex justify-center items-center"
        >
            <Animated.View
                style={firstChildAnimation}
                className="absolute w-full h-full border-2 dark:border-white border-emerald-500 rounded-full"
            ></Animated.View>
            <Animated.View
                style={lastChildAnimation}
                className="absolute w-full h-full border-2 dark:border-white border-emerald-500 rounded-full"
            ></Animated.View>
        </Animated.View>
    );
}