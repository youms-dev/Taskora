import { Dimensions, Text, View } from "react-native";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { PressableAnimated } from "./pressable-animated";
import { ScrollView } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useEffect } from "react";
export interface MessageProps {
    message: string;
    show?: boolean;
    bottom?: number;
    action: () => void;
    onCancel: () => void;
}

export const Message = ({ message, show = false, onCancel, action, bottom = 97 }: MessageProps) => {
    const { width, height } = Dimensions.get("window");
    const translationY = useSharedValue<number>(0);
    const isShow = useSharedValue<boolean>(false);
    const deviceHeight = useSharedValue<number>(0);

    useEffect(() => {
        deviceHeight.value = height;
    }, [height]);

    const animation = useAnimatedStyle(() => ({
        transform: [{
            translateY: withTiming(isShow.value ? 0 : deviceHeight.value * .5, {
                duration: 300,
                easing: Easing.inOut(Easing.quad),
            })
        }]
    }))

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
            if (y < 0 && y > -10 || y > 0) {
                translationY.value = y;
            }
        })
        .onEnd(({ translationY: y }) => {
            if (y >= 70) {
                translationY.value = y;
                runOnJS(cancel)();
            }
            else {
                translationY.value = 0;
            }
        })

    useEffect(() => {
        isShow.value = show;
    }, [show]);

    return (
        <Animated.View
            style={[{
                bottom: height - ((height * bottom) / 100),
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
                            className="text-lg dark:text-white text-black font-semibold"
                        >
                            {message}
                        </Text>
                    </ScrollView>

                    <View className="w-full flex flex-row flex-wrap items-center gap-3">
                        <PressableAnimated
                            scale={.8}
                            onPress={() => onCancel()}
                            className="w-[150px] h-[45px] flex justify-center items-center p-3 border dark:border-white/20 border-black/20 bg-red-500 rounded-2xl"
                        >
                            <Text className="text-lg text-white font-bold">Annuler</Text>
                        </PressableAnimated>
                        <PressableAnimated
                            scale={.8}
                            onPress={() => {
                                action();
                                onCancel();
                            }}
                            className="w-[150px] h-[45px] flex justify-center items-center p-3 border dark:border-white/20 border-black/20 bg-emerald-500 rounded-2xl"
                        >
                            <Text className="text-lg text-black font-bold">Valider</Text>
                        </PressableAnimated>
                    </View>
                </Animated.View>
            </GestureDetector>
        </Animated.View>
    );
}