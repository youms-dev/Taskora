import { memo, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Pressable, Text, useWindowDimensions, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from "react-native-reanimated";
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

/**
 * @param active
 * 
 * @param onCancel
 * 
 * @param onSubmit
 * 
 * @param backdropBackground
 * 
 * @param message
 * 
 * @param cancelLabel
 * 
 * @param submitLabel
 * 
 * @returns Confirm box component
 * 
 */

export const ConfirmBox = memo(({ active: isActive, onCancel, onSubmit, backdropBackground, message, cancelLabel, submitLabel }: Props) => {
    const { t } = useTranslation();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const screenHeightShared = useSharedValue<number>(screenHeight);
    const active = useSharedValue<boolean>(isActive);
    const random = useSharedValue(0);
    const height = useMemo(() => screenHeight + (screenHeight * .2), [screenHeight]);

    const confirmBoxAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                scale: (
                    active.value ?
                        withTiming(1, {
                            duration: 300,
                            easing: Easing.inOut(Easing.quad),
                        })
                        :
                        withDelay(
                            500,
                            withTiming(0),
                        )
                ),
            },
            {
                rotate: (
                    active.value ?
                        withTiming("0deg")
                        :
                        withSequence(
                            withTiming(random.value >= .6 ? "45deg" : "-45deg", {
                                duration: 500,
                                easing: Easing.inOut(Easing.linear),
                            }),
                            withTiming("0deg")
                        )
                ),
            },
            {
                translateY: (
                    active.value ?
                        withTiming(screenHeightShared.value * .05)
                        :
                        withSequence(
                            withTiming(screenHeightShared.value, {
                                duration: 500,
                                easing: Easing.inOut(Easing.linear),
                            }),
                            withTiming(0)
                        )
                ),
            },
        ],
        opacity: (
            active.value ?
                1
                :
                withDelay(
                    200,
                    withTiming(0)
                )
        ),
    }));

    useEffect(() => {
        screenHeightShared.value = screenHeight;
    }, [screenHeight]);

    useEffect(() => {
        active.value = isActive;
        if (isActive) random.value = Math.random();

        const { remove } = BackHandler.addEventListener("hardwareBackPress", () => {
            if (isActive) {
                onCancel();
                return true;
            }
            return false;
        });

        return () => remove();
    }, [isActive, onCancel]);

    return (
        <Animated.View
            style={[
                {
                    width: screenWidth,
                    height,
                    pointerEvents: isActive ? "auto" : "none",
                    transform: [
                        {
                            translateY: -(screenHeight * .2),
                        }
                    ]
                }
            ]}
            className="absolute left-0 top-0 flex justify-center items-center z-[100] px-8"
        >
            {/* Backdrop */}

            {
                isActive && (
                    <Pressable
                        onPress={onCancel}
                        style={{
                            width: screenWidth,
                            height,
                            backgroundColor: (
                                backdropBackground ?
                                    backdropBackground
                                    :
                                    "rgba(0, 0, 0, .2)"
                            ),
                        }}
                        className="absolute left-0 top-0"
                    />
                )
            }

            {/* Box */}

            <Animated.View
                style={confirmBoxAnimation}
                className="w-full sm:w-[500px] rounded-2xl dark:bg-black bg-white z-[10]"
            >

                {/* Shadow */}

                <View
                    style={{
                        transform: [
                            {
                                translateY: 8,
                            },
                        ],
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
                            scale={.95}
                            onPress={onSubmit}
                            className="w-[45%] h-[45px] flex flex-row justify-center items-center rounded-2xl bg-emerald-500"
                        >
                            <Text className="text-black font-bold tracking-wider text-xl">
                                {cancelLabel ?? t("confirm_box_cancel")}
                            </Text>
                        </PressableAnimated>

                        <PressableAnimated
                            scale={.95}
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