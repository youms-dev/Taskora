import { useTheme } from "@/hooks/use-theme";
import { CSSProperties, useEffect } from "react";
import { TextProps } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

interface Props extends TextProps {
    children: string | number;
    dark?: CSSProperties["color"];
    light?: CSSProperties["color"];
    style?: TextProps["style"];
}

/**
 * 
 * @param children Text animated children
 * 
 * @param dark Text animated dark color
 * @default rgba(255, 255, 255, .8)
 * 
 * @param light Text animated light color
 * @default rgba(0, 0, 0, .0)
 * 
 * @param style Text animated style
 * @returns Text animated component
 */



export const TextAnimated = ({ children, dark = "rgba(255, 255, 255, .8)", light = "rgba(0, 0, 0, .0)", style, ...rest }: Props) => {
    const { theme: appTheme } = useTheme();
    const theme = useSharedValue<typeof appTheme>(appTheme);
    const darkColor = useSharedValue<typeof dark>(dark);
    const lightColor = useSharedValue<typeof light>(light);

    useEffect(() => {
        theme.value = appTheme;
        darkColor.value = dark;
        lightColor.value = light;
    }, [appTheme, dark, light]);

    const animation = useAnimatedStyle(() => ({
        color: withTiming(theme.value == "dark" ? darkColor.value : lightColor.value, {
            duration: 200,
            easing: Easing.inOut(Easing.quad),
        }),
    }));

    return (
        <Animated.Text
            {...rest}
            style={[animation, style]}
        >
            {children}
        </Animated.Text>
    );
}