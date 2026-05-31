import { useTheme } from "@/hooks/use-theme";
import Entypo from "@expo/vector-icons/Entypo";
import { ReactNode, useEffect, useState } from "react";
import { LayoutChangeEvent, Pressable, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

interface Props {
    children?: ReactNode;
    open?: boolean;
    header: ReactNode;
}

/**
 * 
 * @param children
 * 
 * @param open
 * @default false
 * 
 * @param header Define the header of the select
 * 
 * @returns 
 */

export const Select = ({ open: selectOpen = false, children, header }: Props) => {
    const active = useSharedValue(!!selectOpen);
    const contentHeight = useSharedValue(0);
    const [measuredHeight, setMeasuredHeight] = useState(0);
    const { theme } = useTheme();

    useEffect(() => {
        active.value = selectOpen;
    }, [selectOpen]);

    useEffect(() => {
        contentHeight.value = measuredHeight;
    }, [measuredHeight]);

    const iconAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                rotate: withTiming(
                    active.value ? "90deg" : "0deg",
                    {
                        duration: 200,
                        easing: Easing.inOut(Easing.quad),
                    }
                ),
            },
        ],
    }));

    const contentAnimation = useAnimatedStyle(() => ({
        height: withTiming(active.value ? contentHeight.value : 0, {
            duration: 200,
            easing: Easing.inOut(Easing.quad),
        }),
        overflow: "hidden",
    }));

    const onLayout = (e: LayoutChangeEvent) => {
        setMeasuredHeight(e.nativeEvent.layout.height);
    };

    return (
        <View className="w-full items-center">
            <Pressable
                onPress={() => {
                    active.value = !active.value;
                }}
                className="w-full flex-row justify-between"
            >
                <View className="w-[70%]">
                    {header}
                </View>

                <View className="w-[20%] flex-row justify-end">
                    <Animated.View style={iconAnimation}>
                        <Entypo
                            name="chevron-right"
                            size={30}
                            color={theme == "dark" ? "rgba(255,255,255,.5)" : "rgba(0, 0, 0, .5)"}
                        />
                    </Animated.View>
                </View>
            </Pressable>

            <Animated.View
                style={contentAnimation}
                className="w-full"
            >
                <View
                    onLayout={onLayout}
                    className="absolute w-full"
                >
                    {children}
                </View>
            </Animated.View>
        </View>
    );
};