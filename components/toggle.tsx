import { COLORS } from "@/constants/colors";
import { useTheme } from "@/hooks/use-theme";
import clsx from "clsx";
import { memo, useEffect } from "react";
import { Pressable } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { PressableAnimatedProps } from "./pressable-animated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props extends Pick<PressableAnimatedProps, "onPress"> {
    active?: boolean;
    animationDuration?: number;
}

/**
 * 
 * @param active
 * @default false
 * 
 * @param animationDuration
 * @default false
 * 
 * @returns Toggle component
 */

export const Toggle = memo(({ active = false, animationDuration = 300, ...rest }: Props) => {
    const isActive = useSharedValue<boolean>(false);
    const { themeShared } = useTheme();
    const duration = useSharedValue<number>(animationDuration);

    useEffect(() => {
        isActive.value = active;
    }, [active]);

    const translateAnimation = useAnimatedStyle(() => ({
        transform: [{
            translateX: withTiming(isActive.value ? "130%" : "10%", {
                duration: duration.value,
                easing: Easing.inOut(Easing.quad),
            }),
        }],
        backgroundColor: withTiming(isActive.value ? COLORS.emerald[500] : "rgba(255, 255, 255, .6)", {
            duration: 300,
            easing: Easing.inOut(Easing.quad),
        }),
    }));

    const animation = useAnimatedStyle(() => ({
        backgroundColor: isActive.value ?
            (themeShared.value === "dark" ? COLORS.emerald[950] : COLORS.emerald[200])
            :
            (themeShared.value === "dark" ? "rgba(255, 255, 255, .2)" : "rgba(0, 0, 0, .2)")
        ,
    }));

    useEffect(() => {
        duration.value = animationDuration;
    }, [animationDuration]);

    return (
        <AnimatedPressable
            {...rest}
            style={animation}
            className="w-[60px] h-[28px] flex shrink-0 justify-center rounded-2xl"
        >
            <Animated.View
                style={translateAnimation}
                className={clsx(
                    "size-[25px] rounded-full",
                )}
            />
        </AnimatedPressable>
    );
});