import { useTheme } from "@/hooks/use-theme";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import clsx from "clsx";
import { Text } from "react-native";
import { Pressable, PressableProps, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

interface IconProps extends PressableProps {
    focused?: boolean;
    name: string;
    icon: string;
}

export const NavButton = ({ name, focused = false, icon, ...rest }: IconProps) => {
    const pressed = useSharedValue<boolean>(false);
    const { theme } = useTheme();

    const tap = Gesture.Tap()
        .onBegin(() => {
            pressed.value = true;
        })
        .onFinalize(() => {
            pressed.value = false;
        })

    const animation = useAnimatedStyle(() => ({
        transform: [{
            scale: withTiming(pressed.value ? .2 : 1, {
                duration: 300,
                easing: Easing.inOut(Easing.quad),
            }),
        }]
    }))

    return (
        <Pressable {...rest}>
            <GestureDetector gesture={tap}>
                <Animated.View
                    style={animation}
                    className="transition-default w-full h-full flex justify-center items-center"
                >
                    <View className={clsx(
                        "transition-default w-max flex justify-center items-center px-8 py-1",
                        focused && "bg-emerald-500/30 rounded-xl",
                    )}>
                        <FontAwesome6 name={icon} size={25} color={focused ? "rgb(16, 185, 129)" : (theme === "dark" ? "white" : "black")} />
                    </View>
                    <Text
                        className={clsx(
                            "transition-default text-lg",
                            focused ? "font-extrabold text-emerald-500" : "dark:text-white text-black",
                        )}
                    >
                        {name}
                    </Text>
                </Animated.View>
            </GestureDetector>
        </Pressable>
    )
}