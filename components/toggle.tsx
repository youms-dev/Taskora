import { COLORS } from "@/constants/colors";
import { useTheme } from "@/hooks/use-theme";
import { AntDesign } from "@expo/vector-icons";
import { memo, useEffect } from "react";
import { Pressable } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
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
    }));

    const buttonAnimation = useAnimatedStyle(() => ({
        backgroundColor: isActive.value ?
            themeShared.value == "dark" ? "black" : "rgba(0, 0, 0, .8)"
            :
            "rgba(255, 255, 255, .6)"
        ,
    }));

    const animation = useAnimatedStyle(() => ({
        backgroundColor: isActive.value ?
            (themeShared.value === "dark" ? COLORS.emerald[900] : COLORS.emerald[200])
            :
            (themeShared.value === "dark" ? "rgba(255, 255, 255, .2)" : "rgba(0, 0, 0, .2)")
        ,
    }));

    useEffect(() => {
        duration.value = animationDuration;
    }, [animationDuration]);

    const activeAnimation = useAnimatedStyle(() => ({
        opacity: isActive.value ?
            withTiming(1, {
                duration: 300,
                easing: Easing.inOut(Easing.quad),
            })
            :
            0,
        transform: [
            {
                scale: isActive.value ?
                    withSpring(1, {
                        stiffness: 80,
                        damping: 4,
                        mass: 1
                    })
                    :
                    0
            }
        ]
    }));

    return (
        <AnimatedPressable
            {...rest}
            style={animation}
            className="w-[60px] h-[30px] flex shrink-0 justify-center rounded-2xl"
        >
            <Animated.View
                style={translateAnimation}
                className="size-[25px] rounded-full dark:bg-black bg-white"
            >
                <Animated.View
                    style={buttonAnimation}
                    className="size-full flex justify-center items-center rounded-full"
                >
                    <Animated.View style={activeAnimation}>
                        <AntDesign
                            name="check"
                            size={12}
                            color={COLORS.emerald[500]}
                        />
                    </Animated.View>
                </Animated.View>
            </Animated.View>
        </AnimatedPressable>
    );
});