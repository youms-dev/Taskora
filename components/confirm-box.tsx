
import { memo, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, LayoutChangeEvent, Pressable, Text, useWindowDimensions, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { PressableAnimated } from "./pressable-animated";
import { TextAnimated } from "./text-animated";

interface Props {
    active: boolean;
    onCancel: () => void;
    onSubmit: () => void;
    backdropBackground?: string;
    message: string;
    cancelLabel?: string;
    submitLabel?: string;
}

const OPEN_DURATION = 500;
const CLOSE_DURATION = 500;

export const ConfirmBox = memo(({ active: isActive, onCancel, onSubmit, backdropBackground, message, cancelLabel, submitLabel }: Props) => {
    const { t } = useTranslation();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const boxHeight = useSharedValue(0);
    const scale = useSharedValue(isActive ? 1 : 0);
    const opacity = useSharedValue(isActive ? 1 : 0);
    const translateY = useSharedValue(0);
    const rotate = useSharedValue("0deg");
    const backdropOpacity = useSharedValue(isActive ? 1 : 0);

    const onLayout = useCallback((e: LayoutChangeEvent) => {
        boxHeight.value = e.nativeEvent.layout.height;
    }, []);

    const confirmBoxAnimation = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
            { translateY: translateY.value },
            { scale: scale.value },
            { rotate: rotate.value },
        ],
    }));

    const backdropAnimation = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
    }));

    useEffect(() => {
        if (isActive) {
            scale.value = 0;
            opacity.value = 1;
            translateY.value = 20;
            rotate.value = "0deg";

            scale.value = withTiming(1, {
                duration: OPEN_DURATION,
                easing: Easing.out(Easing.quad),
            });

            translateY.value = withTiming(0, {
                duration: OPEN_DURATION,
                easing: Easing.out(Easing.quad),
            });

            rotate.value = withTiming("0deg", {
                duration: OPEN_DURATION,
            });

            backdropOpacity.value = withTiming(1, {
                duration: 200,
            });

            return;
        }

        const randomRotation = Math.random() >= 0.6 ? "45deg" : "-45deg";

        translateY.value = withTiming(screenHeight * .7, {
            duration: CLOSE_DURATION,
            easing: Easing.inOut(Easing.linear),
        });

        rotate.value = withTiming(randomRotation, {
            duration: CLOSE_DURATION,
            easing: Easing.inOut(Easing.linear),
        });

        scale.value = withTiming(0, {
            duration: CLOSE_DURATION,
            easing: Easing.in(Easing.quad),
        });

        opacity.value = withDelay(
            200,
            withTiming(0, {
                duration: 200,
            }),
        );

        backdropOpacity.value = withTiming(0, {
            duration: 200,
        });
    }, [isActive, screenHeight]);

    useEffect(() => {
        if (!isActive) return;

        const subscription = BackHandler.addEventListener(
            "hardwareBackPress",
            () => {
                onCancel();
                return true;
            },
        );

        return () => subscription.remove();
    }, [isActive, onCancel]);

    return (
        <Animated.View
            pointerEvents={isActive ? "auto" : "none"}
            style={{
                width: screenWidth,
                height: screenHeight,
            }}
            className="absolute left-0 top-0 flex justify-center items-center z-[100]"
        >

            {/* Backdrop */}

            <Animated.View
                pointerEvents="none"
                style={[
                    {
                        backgroundColor: backdropBackground ?? "rgba(0, 0, 0, .2)",
                        height: screenHeight + (screenHeight * .1),
                    },
                    backdropAnimation,
                ]}
                className="absolute size-full"
            />

            <Pressable
                onPress={onCancel}
                className="absolute size-full"
            />

            {/* Box */}

            <Animated.View
                onLayout={onLayout}
                style={[
                    confirmBoxAnimation,
                    {
                        width: screenWidth > 600 ? 500 : screenWidth * 0.9,
                    },
                ]}
                className="rounded-2xl dark:bg-black bg-white z-[10]"
            >

                {/* Shadow */}

                <View
                    style={{
                        transform: [{ translateY: 8 }],
                        filter: "blur(5px)",
                    }}
                    className="absolute size-full dark:bg-back/50 bg-black/30 rounded-2xl"
                />

                {/* Content */}

                <View className="w-full flex justify-center items-center gap-5 rounded-2xl border-2 dark:border-white/5 border-black/5 dark:bg-white/10 bg-white px-3 py-6">
                    <TextAnimated className="text-lg text-center">
                        {message}
                    </TextAnimated>

                    {/* Buttons */}

                    <View className="w-full flex flex-row justify-center items-center gap-3">
                        <PressableAnimated
                            scale={0.95}
                            onPress={onCancel}
                            className="w-[45%] h-[45px] flex flex-row justify-center items-center rounded-2xl bg-emerald-500"
                        >
                            <Text className="text-black font-bold tracking-wider text-xl">
                                {cancelLabel ?? t("confirm_box_cancel")}
                            </Text>
                        </PressableAnimated>

                        <PressableAnimated
                            scale={0.95}
                            onPress={onSubmit}
                            className="w-[45%] h-[45px] flex flex-row justify-center items-center rounded-2xl bg-red-500"
                        >
                            <Text className="text-white font-extrabold tracking-wider text-xl">
                                {submitLabel ?? t("confirm_box_submit")}
                            </Text>
                        </PressableAnimated>
                    </View>
                </View>
            </Animated.View>
        </Animated.View>
    );
});
