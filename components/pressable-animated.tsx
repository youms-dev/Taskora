import { memo, useEffect } from "react";
import { Pressable, PressableProps } from "react-native";
import Animated, { AnimatedProps, Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

export interface PressableAnimatedProps extends AnimatedProps<PressableProps> {
    children?: React.ReactNode;
    style?: PressableProps["style"];
    scale?: number;
    onPressIn?: PressableProps["onPressIn"];
    onPressOut?: PressableProps["onPressOut"];
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * 
 * @param children Pressable animated children
 * 
 * @param style Pressable animated style
 * 
 * @param scale Pressable animated scale
 * @default 0.9
 * 
 * @param onPressIn Pressable animated on in
 * 
 * @param onPressOut Pressable animated on out
 * 
 * @returns Pressable animated component
 */


export const PressableAnimated = memo(({ children, style, scale: scaleProps = .9, onPressIn, onPressOut, ...rest }: PressableAnimatedProps) => {
    const pressed = useSharedValue<boolean>(false);
    const scale = useSharedValue<number>(1);

    useEffect(() => {
        scale.value = scaleProps;
    }, [scaleProps]);

    const animation = useAnimatedStyle(() => ({
        transform: [{
            scale: withTiming(pressed.value ? scale.value : 1, {
                duration: 200,
                easing: Easing.inOut(Easing.quad)
            }),
        }]
    }));

    return (
        <AnimatedPressable
            {...rest}
            onPressIn={(e) => {
                pressed.value = true;
                onPressIn && onPressIn(e);
            }}
            onPressOut={(e) => {
                pressed.value = false;
                onPressOut && onPressOut(e);
            }}
            style={[animation, style]}
        >
            {children}
        </AnimatedPressable>
    );
});