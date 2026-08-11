import { COLORS } from "@/constants/colors";
import { useTheme } from "@/hooks/use-theme";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useEffect } from "react";
import { ColorValue, DimensionValue, PressableProps } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { PressableAnimated } from "./pressable-animated";

interface Props extends Pick<PressableProps, "onPress"> {
    checked?: boolean;
    size?: DimensionValue;
    borderColor?: ColorValue;
    borderRadius?: number;
    borderWidth?: number;
}

/**
 * 
 * @param checked
 * 
 * @param size
 * @default 35
 * 
 * @param borderColor
 * 
 * @param borderRadius
 * @default 12
 * 
 * @param borderWidth
 * @default 1
 * 
 * @returns 
 */

export const Checkbox = ({ checked, size = 35, borderColor, borderRadius = 12, borderWidth = 2, ...rest }: Props) => {
    const { theme } = useTheme();
    const isChecked = useSharedValue<boolean>(false);

    useEffect(() => {
        isChecked.value = !!checked;
    }, [checked]);

    const checkAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                scale: isChecked.value ?
                    withSpring(1, {
                        stiffness: 100,
                        mass: 1,
                        damping: 7,
                    })
                    :
                    withTiming(0, {
                        duration: 200,
                        easing: Easing.inOut(Easing.quad),
                    })
                ,
            }
        ]
    }));

    return (
        <PressableAnimated
            {...rest}
            scale={.95}
            style={{
                width: size,
                height: size,
                borderWidth,
                borderColor: borderColor ? borderColor : theme == "dark" ? "rgba(255, 255, 255, .2)" : "rgba(0, 0, 0, .2)",
                borderRadius,
            }}
            className="flex justify-center items-center"
        >
            <Animated.View style={checkAnimation}>
                <AntDesign
                    name="check"
                    size={typeof size === "number" ? size * .7 : 20}
                    color={COLORS.emerald[500]}
                />
            </Animated.View>
        </PressableAnimated>
    );
}