import { COLORS } from "@/constants/colors";
import { useTheme } from "@/hooks/use-theme";
import { FontAwesome6 } from "@expo/vector-icons";
import clsx from "clsx";
import { memo, useEffect } from "react";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

interface Props {
    rotate?: boolean;
}

export const Rotate = memo(({ rotate }: Props) => {
    const rotation = useSharedValue<number>(0);
    const { theme } = useTheme();

    const rotateAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                rotate: `${rotation.value}deg`,
            }
        ]
    }));

    useEffect(() => {
        if (rotate) {
            rotation.value = withRepeat(
                withTiming(360, {
                    duration: 1000,
                    easing: Easing.linear,
                }),
                -1,
                false,
            );
        }
        else {
            rotation.value = 0;
        }
    }, [rotate]);

    return (
        <Animated.View
            style={rotateAnimation}
            className={clsx(
                "pointer-events-none",
                rotate && "opacity-50",
            )}
        >
            <FontAwesome6
                name="rotate-right"
                size={22}
                color={rotate ?
                    COLORS.emerald[500]
                    :
                    theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"
                }
            />
        </Animated.View>
    );
});