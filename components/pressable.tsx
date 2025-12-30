import { useEffect } from "react";
import { PressableProps } from "react-native";
import { Pressable as RNPressable } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

export interface PressableAnimatedProps extends PressableProps {
    children?: React.ReactNode;
    style?: PressableProps["style"];
    scale?: number;
}

export const PressableAnimated = ({ children, style, scale = .3, ...rest }: PressableAnimatedProps) => {
    const AnimatedPressable = Animated.createAnimatedComponent(RNPressable);
    const pressed = useSharedValue<boolean>(false);
    const scaleValue = useSharedValue<number>(0);

    useEffect(() => {
        scaleValue.value = scale;
    }, [scale]);

    const animation = useAnimatedStyle(() => ({
        transform: [{
            scale: withTiming(pressed.value ? (scaleValue.value ? scaleValue.value : .3) : 1, {
                duration: 300,
                easing: Easing.inOut(Easing.quad)
            })
        }]
    }))

    const tap = Gesture.Pan()
        .onBegin(() => {
            pressed.value = true;
        })
        .onFinalize(() => {
            pressed.value = false;
        })

    return (
        <GestureDetector gesture={tap}>
            <AnimatedPressable
                {...rest}
                style={[animation, style]}
            >
                {children}
            </AnimatedPressable>
        </GestureDetector>
    );
}