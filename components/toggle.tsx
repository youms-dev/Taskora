import { COLORS } from "@/constants/colors";
import { useTheme } from "@/hooks/use-theme";
import clsx from "clsx";
import { useEffect } from "react";
import { Pressable } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

interface Props {
    active?: boolean;
    onChange: () => void;
}

const PressableAnimated = Animated.createAnimatedComponent(Pressable);

export const Toggle = ({ active = false, onChange }: Props) => {
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
            onPress={() => onChange()}
            style={animation}
            className={clsx(
                "w-[60px] h-[28px] flex justify-center rounded-2xl",
            )}
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