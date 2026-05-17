import clsx from "clsx";
import { useEffect } from "react";
import { PressableProps, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { PressableAnimated } from "./pressable-animated";

interface Props extends Pick<PressableProps, "onPress"> {
    closed?: boolean;
}

/**
 * 
 * @param closed It's a boolean value that define whether the eye is closed or not
 * 
 * @returns Your eye component
 */

export const Eye = ({ closed: eyeClosed, ...rest }: Props) => {
    const closed = useSharedValue<typeof eyeClosed>(!!eyeClosed);

    useEffect(() => {
        closed.value = !!eyeClosed;
    }, [eyeClosed]);

    const animation = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: closed.value ? 0 : withRepeat(
                    withSequence(
                        withTiming(-13, {
                            duration: 1000,
                            easing: Easing.inOut(Easing.quad),
                        }),
                        withDelay(
                            1000,
                            withTiming(0, {
                                duration: 1000,
                                easing: Easing.inOut(Easing.quad),
                            }),
                        ),
                    ),
                    Infinity,
                    true,
                ),
            }
        ]
    }));

    return (
        <PressableAnimated
            {...rest}
            className={clsx(
                "w-[35px] h-[20px] flex justify-center items-center border border-x-transparent rounded-full overflow-hidden",
                eyeClosed ? "dark:bg-white/80 bg-black/80 dark:border-y-white/20 border-y-black/20" : "dark:border-y-white border-y-black",
            )}
        >
            <Animated.View
                style={animation}
                className={clsx(
                    "absolute size-full rounded-full",
                    !eyeClosed && "dark:bg-white bg-black",
                )}
            />
            {
                !eyeClosed && (
                    <View className="size-3 dark:bg-white bg-black rounded-full" />
                )
            }
        </PressableAnimated>
    );
}