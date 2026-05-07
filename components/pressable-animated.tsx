import { useEffect } from "react";
import { PressableProps, Pressable as RNPressable } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

export interface PressableAnimatedProps extends PressableProps {
    children?: React.ReactNode;
    style?: PressableProps["style"];
    scale?: number;
    onPressIn?: PressableProps["onPressIn"];
    onPressOut?: PressableProps["onPressOut"];
}

export const PressableAnimated = ({ children, style, scale = .9, onPressIn, onPressOut, ...rest }: PressableAnimatedProps) => {
    const AnimatedPressable = Animated.createAnimatedComponent(RNPressable);
    const pressed = useSharedValue<boolean>(false);
    const scaleValue = useSharedValue<number>(scale);

    useEffect(() => {
        scaleValue.value = scale;
    }, [scale]);

    const animation = useAnimatedStyle(() => ({
        transform: [{
            scale: withTiming(pressed.value ? scaleValue.value : 1, {
                duration: 300,
                easing: Easing.inOut(Easing.quad)
            })
        }]
    }))

    return (
        <AnimatedPressable
            {...rest}
            onPressIn={(e) => {
                onPressIn && onPressIn(e);
                pressed.value = true;
            }}
            onPressOut={(e) => {
                onPressOut && onPressOut(e);
                pressed.value = false;
            }}
            style={[animation, style]}
        >
            {children}
        </AnimatedPressable>
    );
}