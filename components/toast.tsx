import { Dimensions, Text } from "react-native";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { ScrollView } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useEffect, useState } from "react";
import clsx from "clsx";

export type ToastType = "default" | "error" | "warning" | "success";

export interface ToastProps {
    message: string;
    show?: boolean;
    onCancel: () => void;
    top?: number;
    type?: ToastType;
}

export const Toast = ({ message, show = false, onCancel, top = 0, type = "default" }: ToastProps) => {
    const { width, height } = Dimensions.get("window");
    const translationY = useSharedValue<number>(0);
    const [text, setText] = useState<string>("");
    const deviceHeight = useSharedValue<number>(0);
    const isShow = useSharedValue<boolean>(false);

    useEffect(() => {
        deviceHeight.value = height;
    }, [height]);

    const animation = useAnimatedStyle(() => ({
        transform: [{
            translateY: withTiming(show ? 0 : -deviceHeight.value * .5, {
                duration: 300,
                easing: Easing.inOut(Easing.quad),
            })
        }]
    }));

    const panAnimation = useAnimatedStyle(() => ({
        transform: [{
            translateY: withTiming(translationY.value, {
                duration: 200,
                easing: Easing.inOut(Easing.quad),
            })
        }]
    }))

    const cancel = () => {
        onCancel();
        setTimeout(() => {
            translationY.value = 0;
        }, 1000);
    }

    const pan = Gesture.Pan()
        .onUpdate(({ translationY: y }) => {
            if (y > 0 && y < 20 || y < 0) {
                translationY.value = y;
            }
        })
        .onEnd(({ translationY: y }) => {
            if (y < -50) {
                translationY.value = y;
                runOnJS(cancel)();
            }
            else {
                translationY.value = 0;
            }
        })

    useEffect(() => {
        isShow.value = show;
        if (show) {
            setText(message);
            const timeout = setTimeout(() => {
                onCancel();
                setTimeout(() => {
                    setText("");
                }, 500);
                clearTimeout(timeout);
            }, 5000);
        }
    }, [show]);

    if (text.trim().length > 0) {
        return (
            <Animated.View
                style={[{
                    top,
                    width,
                }, animation]}
                className="absolute left-0 max-h-[200px] flex justify-center items-center p-5 overflow-hidden z-[100px]"
            >
                <GestureDetector gesture={pan}>
                    <Animated.View
                        style={panAnimation}
                        className="flex justify-center items-center gap-2 border-2 dark:border-white/20 border-black/20 dark:bg-black/85 bg-white/85 rounded-2xl p-3 overflow-hidden"
                    >
                        <ScrollView>
                            <Text
                                className={clsx(
                                    "text-lg font-semibold",
                                    type === "default" && "dark:text-white text-black",
                                    type === "error" && "text-red-500",
                                    type === "success" && "text-emerald-500",
                                    type === "warning" && "text-amber-400",
                                )}
                            >
                                {message}
                            </Text>
                        </ScrollView>
                    </Animated.View>
                </GestureDetector>
            </Animated.View>
        );
    }
    return null;
}