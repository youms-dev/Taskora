import clsx from "clsx";
import { useEffect } from "react";
import { BackHandler, Dimensions, Pressable, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

interface Props {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

/**
 * 
 * @param visible Modal visible
 * @default false
 * 
 * @param onClose Whether the modal is closed
 * @default false
 * 
 * @param children Modal children
 * @returns Modal component
 */

export const Modal = ({ visible = false, onClose, children }: Props) => {
    const { width, height } = Dimensions.get("window");
    const translateY = useSharedValue<number>(0);
    const isVisible = useSharedValue<boolean>(false);
    const deviceHeight = useSharedValue<number>(0);

    useEffect(() => {
        deviceHeight.value = height;
    }, [height]);
    
    const animation = useAnimatedStyle(() => ({
        transform: [{
            translateY: withTiming(isVisible.value ? 0 : deviceHeight.value * 2, {
                duration: 500,
                easing: Easing.inOut(Easing.quad),
            })
        }],
    }))
    
    useEffect(() => {
        isVisible.value = visible;
        const onBackPress = () => {
            if (visible) {
                onClose();
                return true;
            }
            return false;
        };

        const { remove } = BackHandler.addEventListener(
            "hardwareBackPress",
            onBackPress
        );

        return () => remove();
    }, [visible]);

    const closeModal = () => {
        onClose();
        setTimeout(() => {
            translateY.value = 0;
        }, 500);
    };

    const pan = Gesture.Pan()
        .onUpdate(({ translationY: y }) => {
            if (y < 0 && y > -20) {
                translateY.value = y;
            }
            else if (y >= 0) {
                translateY.value = y;
            }
        })
        .onEnd(({ translationY: y }) => {
            if (y >= 200) {
                translateY.value = y;
                runOnJS(closeModal)();
            }
            else {
                translateY.value = 0;
            }
        })

    const translateAnimation = useAnimatedStyle(() => ({
        transform: [{
            translateY: withTiming(translateY.value, {
                duration: 100,
                easing: Easing.inOut(Easing.quad),
            })
        }],
    }))

    return (
        <Animated.View
            style={[{
                width,
                height: height - 256
            }, animation]}
            className={clsx(
                "absolute left-0 top-0 flex items-center z-[500px]"
            )}
        >
            <Pressable
                onPress={() => onClose()}
                className="w-full h-[35%]"
            ></Pressable>
            <GestureDetector gesture={pan}>
                <Animated.View
                    style={translateAnimation}
                    className="w-full h-full flex items-center dark:bg-black bg-white"
                >
                    <View className="w-full h-6 flex justify-center items-center dark:bg-white/10 bg-black/10">
                        <View className="w-16 h-2 dark:bg-white/30 bg-black/30 rounded-2xl"></View>
                    </View>
                    <View className="w-full h-full flex items-center">
                        {children}
                    </View>
                </Animated.View>
            </GestureDetector>
        </Animated.View>
    );
}