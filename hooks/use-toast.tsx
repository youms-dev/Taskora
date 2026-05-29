import { TextAnimated } from "@/components/text-animated";
import { COLORS } from "@/constants/colors";
import clsx from "clsx";
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, DimensionValue, Pressable, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

type ToastType = "success" | "error" | "warning" | "default";

const Context = createContext<{
    toast: string;
    setToast: (value: string, type?: ToastType, duration?: number) => void;
    setDismiss: (duration?: number, action?: () => void) => void;
}>({
    toast: "",
    setToast: () => { },
    setDismiss: () => { },
});

interface Props {
    children: ReactNode;
}

export const ToastProvider = ({ children }: Props) => {
    const [text, setText] = useState<string>("");
    const { width, height } = useWindowDimensions();
    const [left, setLeft] = useState<DimensionValue>(0);
    const [type, setType] = useState<ToastType>("default");
    const [hideValue, setHideValue] = useState<number>(0);
    const translateY = useSharedValue<number>(0);
    const timeout = useRef<ReturnType<typeof setTimeout>>(null);
    const refreshTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    const textValue = useSharedValue<string>(text);
    const closeTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    const [dismissBoxLeft, setDismissLeft] = useState<DimensionValue>(0);
    const [dismissHideValue, setDismissHideValue] = useState<number>(0);
    const dismissTranslateY = useSharedValue<number>(0);
    const [count, setCount] = useState<number>(0);
    const dismissInterval = useRef<ReturnType<typeof setInterval>>(null);
    const refreshDismissTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    const closeDismissTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    const { t } = useTranslation();

    const setToast = (value: string, type: ToastType = "default", duration: number = 3000) => {
        closeTimeout.current && clearTimeout(closeTimeout.current);
        refreshTimeout.current && clearTimeout(refreshTimeout.current);
        timeout.current && clearTimeout(timeout.current);
        setText(value);
        setType(type);
        if (text.trim().length > 0) {
            translateY.value = hideValue;
            refreshTimeout.current = setTimeout(() => {
                translateY.value = 0;
            }, 200);
        }
        else {
            refreshTimeout.current = setTimeout(() => {
                translateY.value = 0;
            }, 200);
        }
        timeout.current = setTimeout(() => {
            handleClose();
        }, duration);
    }

    const animation = useAnimatedStyle(() => ({
        transform: [
            {
                scale: withRepeat(
                    withSequence(
                        withTiming(0, {
                            duration: 200,
                            easing: Easing.inOut(Easing.quad),
                        }),
                        withTiming(1, {
                            duration: 200,
                            easing: Easing.inOut(Easing.quad),
                        }),
                    ),
                    1,
                    true,
                )
            },
            {
                translateY: withTiming(translateY.value, {
                    duration: 200,
                    easing: Easing.inOut(Easing.quad),
                }),
            }
        ]
    }));


    const handleClose = () => {
        refreshTimeout.current && clearTimeout(refreshTimeout.current);
        timeout.current && clearTimeout(timeout.current);
        closeTimeout.current && clearTimeout(closeTimeout.current);
        translateY.value = hideValue;
        closeTimeout.current = setTimeout(() => {
            setText("");
            setType("default");
        }, 200);
    }

    const pan = Gesture.Pan()
        .onUpdate(({ translationY: y }) => {
            if (y < 0) translateY.value = y;
        })
        .onEnd(({ translationY: y }) => {
            if (y <= -10) {
                runOnJS(handleClose)();
                return;
            }
            translateY.value = 0;
        });

    useEffect(() => {
        textValue.value = text;
        translateY.value = hideValue;
        dismissTranslateY.value = dismissHideValue;
    }, [text, hideValue, dismissHideValue]);

    const setDismiss = (duration: number = 5, action: () => void = () => {}) => {
        if (duration > 10) {
            throw new Error("Duration too high the max value is 10");
        }
        let i = duration;
        let prevCount = count;

        setCount(i);
        closeDismissTimeout.current && clearTimeout(closeDismissTimeout.current);
        refreshDismissTimeout.current && clearTimeout(refreshDismissTimeout.current);
        dismissInterval.current && clearInterval(dismissInterval.current);
        if (prevCount > 0) {
            dismissTranslateY.value = dismissHideValue;
            refreshDismissTimeout.current = setTimeout(() => {
                dismissTranslateY.value = 0;
            }, 200);
        }
        else {
            refreshDismissTimeout.current = setTimeout(() => {
                dismissTranslateY.value = 0;
            }, 200);
        }
        dismissInterval.current = setInterval(() => {
            setCount(i == duration ? i - 1 : i);
            if (i == 0) {
                dismissInterval.current && clearInterval(dismissInterval.current);
                handleCloseDismiss();
                action();
                return;
            }
            i -= i == duration ? 2 : 1;
        }, 1000);
    }

    const dismissAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                scale: withRepeat(
                    withSequence(
                        withTiming(0, {
                            duration: 200,
                            easing: Easing.inOut(Easing.quad),
                        }),
                        withTiming(1, {
                            duration: 200,
                            easing: Easing.inOut(Easing.quad),
                        }),
                    ),
                    1,
                    true,
                )
            },
            {
                translateY: withTiming(dismissTranslateY.value, {
                    duration: 200,
                    easing: Easing.inOut(Easing.quad),
                }),
            }
        ]
    }));

    const handleCloseDismiss = () => {
        refreshDismissTimeout.current && clearTimeout(refreshDismissTimeout.current);
        dismissInterval.current && clearTimeout(dismissInterval.current);
        closeDismissTimeout.current && clearTimeout(closeDismissTimeout.current);
        dismissTranslateY.value = dismissHideValue;
        closeDismissTimeout.current = setTimeout(() => {
            setCount(0);
        }, 200);
    }

    const dismissPan = Gesture.Pan()
        .onUpdate(({ translationY: y }) => {
            if (y > 0) dismissTranslateY.value = y;
        })
        .onEnd(({ translationY: y }) => {
            if (y >= 10) {
                runOnJS(handleCloseDismiss)();
                return;
            }
            dismissTranslateY.value = 0;
        });

    return (
        <Context.Provider value={{
            toast: text,
            setToast,
            setDismiss,
        }}>
            <GestureDetector gesture={pan}>
                <Animated.View
                    onLayout={(e) => {
                        setLeft((width / 2) - (e.nativeEvent.layout.width / 2));
                        setHideValue(-((height + (height * .1) + e.nativeEvent.layout.height)));
                    }}
                    style={[
                        {
                            left,
                            zIndex: 500,
                        },
                        animation,
                    ]}
                    className={clsx(
                        "absolute top-10 w-11/12 sm:w-[500px] overflow-hidden rounded-2xl",
                        type == "default" && "dark:bg-white bg-black",
                        type == "error" && "bg-red-500",
                        type == "warning" && "bg-amber-500",
                        type == "success" && "bg-emerald-500",
                    )}
                >
                    <View className={clsx(
                        "w-full h-full flex justify-center items-center px-3 py-2 rounded-2xl",
                        type == "default" && "dark:bg-black/80 bg-white/30",
                        type == "error" && "dark:bg-black/90 bg-black/75 border dark:border-red-500/20 border-red-500/80",
                        type == "warning" && "dark:bg-black/90 bg-black/80 border dark:border-amber-500/10 border-amber-500/80",
                        type == "success" && "dark:bg-black/90 bg-black/80 border dark:border-emerald-500/10 border-emerald-500/80",
                    )}>
                        <TextAnimated
                            dark={(() => {
                                if (type == "success") return COLORS.emerald[500];
                                else if (type == "error") return COLORS.red[500];
                                else if (type == "warning") return COLORS.amber[400];
                                else return "rgba(255, 255, 255, .8)";
                            })()}
                            light={(() => {
                                if (type == "success") return COLORS.emerald[500];
                                else if (type == "error") return COLORS.red[500];
                                else if (type == "warning") return COLORS.amber[400];
                                else return "rgba(255, 255, 255, .8)";
                            })()}
                            className="text-xl text-center"
                        >
                            {text}
                        </TextAnimated>
                    </View>
                </Animated.View>
            </GestureDetector>

            <GestureDetector gesture={dismissPan}>
                <Animated.View
                    onLayout={(e) => {
                        setDismissLeft((width / 2) - (e.nativeEvent.layout.width / 2));
                        setDismissHideValue(height + (height * .1) + e.nativeEvent.layout.height);
                    }}
                    style={[
                        {
                            left: dismissBoxLeft,
                            zIndex: 500,
                        },
                        dismissAnimation,
                    ]}
                    className="absolute bottom-[100px] w-11/12 sm:w-[400px] h-[50px] overflow-hidden rounded-2xl dark:bg-white bg-black"
                >
                    <Pressable
                        onPress={() => handleCloseDismiss()}
                        className="w-full h-full flex flex-row justify-center items-center gap-6 px-3 py-2 rounded-2xl dark:bg-black/80 bg-white/30 border dark:border-white/5 border-black/20"
                    >
                        <TextAnimated
                            dark="rgba(255, 255, 255, .8)"
                            light="rgba(255, 255, 255, .8)"
                            className="text-xl text-center"
                        >
                            {t("toast_cancel")}
                        </TextAnimated>
                        <View className="h-full flex justify-center items-center">
                            <ActivityIndicator
                                size={45}
                                color="rgba(255, 255, 255, .8)"
                            />
                            <Animated.Text className="absolute text-xl text-white/80">
                                {count}
                            </Animated.Text>
                        </View>
                    </Pressable>
                </Animated.View>
            </GestureDetector>
            {children}
        </Context.Provider>
    );
}

export const useToast = () => useContext(Context);