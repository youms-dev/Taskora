import { useTheme } from "@/hooks/use-theme";
import Entypo from "@expo/vector-icons/Entypo";
import clsx from "clsx";
import { memo, ReactNode, useEffect, useState } from "react";
import { LayoutChangeEvent, Pressable, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

interface Props {
    children?: ReactNode;
    open?: boolean;
    header: ReactNode;
    chevronColor?: string;
    duration?: number;
    rotationDuration?: number;
    chevronPadding?: number | {
        paddingLeft?: number;
        paddingRight?: number;
        paddingTop?: number;
        paddingBottom?: number;
    };
    chevron?: boolean;
    onChange?: (value?: boolean) => void;
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
 * @param chevronColor
 * 
 * @param duration Animation duration
 * 
 * @param rotationDuration
 * 
 * @param chevronPadding
 * 
 * @param chevron Define whether there is a chevron or not
 * 
 * @param onChange The handler to call when the open state changes
 * 
 * @returns The Select component
 */

export const Select = memo(({ open: selectOpen = false, children, header, chevronColor, duration: durationProps = 200, rotationDuration: rotationDurationProps = 200, chevronPadding = 0, chevron = true, onChange }: Props) => {
    const active = useSharedValue(!!selectOpen);
    const contentHeight = useSharedValue(0);
    const [measuredHeight, setMeasuredHeight] = useState(0);
    const { theme } = useTheme();
    const duration = useSharedValue<number>(durationProps);
    const rotationDuration = useSharedValue<number>(rotationDurationProps);
    const chevronWidth = useSharedValue<number>(0);

    useEffect(() => {
        active.value = selectOpen;
        onChange?.(selectOpen);
    }, [selectOpen, onChange]);

    useEffect(() => {
        contentHeight.value = measuredHeight;
    }, [measuredHeight]);

    const rotationAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                rotate: withTiming(
                    active.value ? "90deg" : "0deg",
                    {
                        duration: rotationDuration.value,
                        easing: Easing.inOut(Easing.quad),
                    }
                ),
            },
        ],
    }));

    const contentAnimation = useAnimatedStyle(() => ({
        height: withTiming(active.value ? contentHeight.value : 0, {
            duration: duration.value,
            easing: Easing.inOut(Easing.quad),
        }),
        overflow: "hidden",
    }));

    const onLayout = (e: LayoutChangeEvent) => {
        setMeasuredHeight(e.nativeEvent.layout.height);
    };

    useEffect(() => {
        duration.value = durationProps;
        rotationDuration.value = rotationDurationProps;
    }, [durationProps, rotationDurationProps]);

    return (
        <View className="w-full items-center">
            <Pressable
                onPress={() => {
                    active.value = !active.value;
                    onChange?.(!active.value);
                }}
                className="w-full flex-row justify-between"
            >
                <View className={clsx(
                    chevron ? "w-[85%]" : "w-full",
                )}>
                    {header}
                </View>

                {
                    chevron && (
                        <View className="h-full flex-row justify-end">
                            <Animated.View
                                onLayout={(e) => chevronWidth.value = e.nativeEvent.layout.width}
                                style={[
                                    rotationAnimation,
                                    {
                                        padding: typeof chevronPadding == "number" ? chevronPadding : null,
                                        paddingLeft: typeof chevronPadding == "object" ? chevronPadding?.paddingLeft : null,
                                        paddingRight: typeof chevronPadding == "object" ? chevronPadding?.paddingRight : null,
                                        paddingBottom: typeof chevronPadding == "object" ? chevronPadding?.paddingBottom : null,
                                        paddingTop: typeof chevronPadding == "object" ? chevronPadding?.paddingTop : null,
                                    },
                                ]}
                            >
                                <Entypo
                                    name="chevron-right"
                                    size={30}
                                    color={chevronColor ? chevronColor : (theme == "dark" ? "rgba(255,255,255,.5)" : "rgba(0, 0, 0, .5)")}
                                />
                            </Animated.View>
                        </View>
                    )
                }

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
});