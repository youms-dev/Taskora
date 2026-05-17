import { COLORS } from "@/constants/colors";
import { useTheme } from "@/hooks/use-theme";
import clsx from "clsx";
import { useEffect } from "react";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { PressableAnimated, PressableAnimatedProps } from "./pressable-animated";

interface Props extends Pick<PressableAnimatedProps, "onPress"> {
    active?: boolean;
}

/**
 * 
 * @param active Whether the toggle is active
 * @default false
 * 
 * @param onChange Toggle on change
 * 
 * @returns Toggle component
 */

export const Toggle = ({ active = false, ...rest }: Props) => {
    const isActive = useSharedValue<boolean>(false);
    const { theme } = useTheme();
    const appTheme = useSharedValue<typeof theme>("dark");

    useEffect(() => {
        isActive.value = active;
    }, [active]);

    useEffect(() => {
        appTheme.value = theme;
    }, [theme]);

    const translateAnimation = useAnimatedStyle(() => ({
        transform: [{
            translateX: withTiming(isActive.value ? "130%" : "10%", {
                duration: 300,
                easing: Easing.inOut(Easing.quad),
            }),
        }],
        backgroundColor: withTiming(isActive.value ? COLORS.emerald[500] : "rgba(255, 255, 255, .6)", {
            duration: 300,
            easing: Easing.inOut(Easing.quad),
        }),
    }));

    const animation = useAnimatedStyle(() => ({
        backgroundColor: withTiming(isActive.value ? (appTheme.value === "dark" ? COLORS.emerald[900] : COLORS.emerald[100]) : (appTheme.value === "dark" ? "rgba(255, 255, 255, .2)" : "rgba(0, 0, 0, .2)"), {
            duration: 300,
            easing: Easing.inOut(Easing.quad),
        }),
    }));

    return (
        <PressableAnimated
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
        </PressableAnimated>
    );
}