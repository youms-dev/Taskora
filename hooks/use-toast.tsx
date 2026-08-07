import { TextAnimated } from "@/components/text-animated";
import { COLORS } from "@/constants/colors";
import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";
import clsx from "clsx";
import { Image } from "expo-image";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, BackHandler, Pressable, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, Extrapolation, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useTheme } from "./use-theme";

type ToastType = "success" | "error" | "warning" | "default";

const Context = createContext<{
    toast: string;
    setToast: (value: string, type?: ToastType, duration?: number) => void;
    setDismiss: (action?: (() => void) | null, reverse?: (() => void) | null, duration?: number, position?: number) => void;
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
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const [type, setType] = useState<ToastType>("default");
    const translateY = useSharedValue<number>(-screenHeight);
    const timeout = useRef<ReturnType<typeof setTimeout>>(null);
    const loadTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    const textValue = useSharedValue<string>(text);
    const closeTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    const dismissTranslateY = useSharedValue<number>(screenHeight);
    const [count, setCount] = useState<number>(0);
    const dismissInterval = useRef<ReturnType<typeof setInterval>>(null);
    const refreshDismissTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    const closeDismissTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    const { t } = useTranslation();
    const [reverseAction, setReverseAction] = useState<(() => void) | null>(null);
    const [available, setAvailable] = useState<boolean>(true);
    const toastPosition = useSharedValue<number>(0);
    const toastHideValue = useSharedValue<number>(-screenHeight);
    const dismissPosition = useSharedValue<number>(0);
    const dismissHideValue = useSharedValue<number>(screenHeight);
    const { theme } = useTheme();
    const screenWidthShared = useSharedValue<number>(0);
    const screenWHeightShared = useSharedValue<number>(0);
    const typeShared = useSharedValue<typeof type>("default");

    const setToast = useCallback((value: string, type: ToastType = "default", duration: number = 3000) => {
        closeTimeout.current && clearTimeout(closeTimeout.current);
        loadTimeout.current && clearTimeout(loadTimeout.current);
        timeout.current && clearTimeout(timeout.current);
        setText(value);
        setType(type);
        if (text.trim().length > 0) {
            translateY.value = withTiming(-200, {
                duration: 200,
                easing: Easing.inOut(Easing.quad),
            });
            loadTimeout.current = setTimeout(() => {
                translateY.value = withTiming(0, {
                    duration: 200,
                    easing: Easing.inOut(Easing.quad),
                });
            }, 200);
        }
        else {
            loadTimeout.current = setTimeout(() => {
                translateY.value = withTiming(0, {
                    duration: 200,
                    easing: Easing.inOut(Easing.quad),
                });
            }, 200);
        }
        timeout.current = setTimeout(() => {
            handleClose();
        }, duration);
    }, [text]);

    const toastAnimation = useAnimatedStyle(() => ({
        left: toastPosition.value,
        // transform: [
        //     {
        //         translateY: interpolate(
        //             translateY.value,
        //             [0, -100],
        //             [0, -100],
        //             Extrapolation.CLAMP,
        //         ),
        //     }
        // ]
        transform: [
            {
                translateY: 0,
            }
        ]
    }));

    const handleClose = useCallback(() => {
        loadTimeout.current && clearTimeout(loadTimeout.current);
        timeout.current && clearTimeout(timeout.current);
        closeTimeout.current && clearTimeout(closeTimeout.current);
        translateY.value = withTiming(toastHideValue.value, {
            duration: 200,
            easing: Easing.inOut(Easing.quad),
        });
        closeTimeout.current = setTimeout(() => {
            setText("");
            setType("default");
        }, 200);
    }, []);

    const pan = useMemo(() => {
        return (
            Gesture.Pan()
                .onUpdate(({ translationY: y }) => {
                    if (y < 0) translateY.value = y;
                })
                .onEnd(({ translationY: y }) => {
                    if (y <= -10) {
                        runOnJS(handleClose)();
                        return;
                    }
                    translateY.value = 0;
                })
        );
    }, [handleClose]);

    useEffect(() => {
        textValue.value = text;
    }, [text]);

    const setDismiss = useCallback((action: (() => void) | null = null, reverse: (() => void) | null = null, duration: number = 5, position: number = 0) => {
        if (duration > 10) {
            throw new Error("Duration too high.\nThe max value is 10");
        }
        if (!available) return;
        let i = duration;

        setCount(i);
        reverse && setReverseAction(() => reverse);
        setAvailable(false);
        closeDismissTimeout.current && clearTimeout(closeDismissTimeout.current);
        refreshDismissTimeout.current && clearTimeout(refreshDismissTimeout.current);
        dismissInterval.current && clearInterval(dismissInterval.current);
        refreshDismissTimeout.current = setTimeout(() => {
            dismissTranslateY.value = withTiming(position, {
                duration: 200,
                easing: Easing.inOut(Easing.quad),
            });
        }, 200);
        dismissInterval.current = setInterval(() => {
            setCount(i == duration ? i - 1 : i);
            if (i == 0) {
                dismissInterval.current && clearInterval(dismissInterval.current);
                action && action();
                handleCloseDismiss();
                return;
            }
            i -= i == duration ? 2 : 1;
        }, 800);
    }, []);

    const dismissAnimation = useAnimatedStyle(() => ({
        left: dismissPosition.value,
        transform: [
            {
                translateY: interpolate(
                    dismissTranslateY.value,
                    [0, screenWHeightShared.value],
                    [0, screenWHeightShared.value],
                    Extrapolation.CLAMP,
                ),
            }
        ]
    }));

    const handleCloseDismiss = useCallback((reverse: boolean = false) => {
        refreshDismissTimeout.current && clearTimeout(refreshDismissTimeout.current);
        dismissInterval.current && clearTimeout(dismissInterval.current);
        closeDismissTimeout.current && clearTimeout(closeDismissTimeout.current);
        dismissTranslateY.value = withTiming(dismissHideValue.value, {
            duration: 200,
            easing: Easing.inOut(Easing.quad),
        });
        closeDismissTimeout.current = setTimeout(() => {
            setCount(0);
            reverse && reverseAction && reverseAction();
            setAvailable(true);
        }, 200);
    }, [reverseAction]);

    const dismissPan = useMemo(() => {
        return (
            Gesture.Pan()
                .onUpdate(({ translationY: y }) => {
                    if (y > 0) dismissTranslateY.value = y;
                })
                .onEnd(({ translationY: y }) => {
                    if (y >= 10) {
                        runOnJS(handleCloseDismiss)(true);
                        return;
                    }
                    dismissTranslateY.value = 0;
                })
        );
    }, [handleCloseDismiss]);

    useEffect(() => {
        const onBackPress = () => {
            if (count > 0) {
                handleCloseDismiss(true);
                return true;
            }
            return false;
        }
        const { remove } = BackHandler.addEventListener("hardwareBackPress", onBackPress);

        return () => remove();
    }, [count]);

    useEffect(() => {
        screenWidthShared.value = screenWidth;
        screenWHeightShared.value = screenHeight;
    }, [screenWidth, screenHeight]);

    const indicatorAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                scale: typeShared.value == "success" ?
                    withSequence(
                        withTiming(0, {
                            duration: 200,
                            easing: Easing.inOut(Easing.quad),
                        }),
                        withTiming(1.4, {
                            duration: 200,
                            easing: Easing.inOut(Easing.quad),
                        }),
                        withTiming(.6, {
                            duration: 200,
                            easing: Easing.inOut(Easing.quad),
                        }),
                        withTiming(1, {
                            duration: 200,
                            easing: Easing.inOut(Easing.quad),
                        }),
                    )
                    :
                    1,
            },
            {
                translateX: (typeShared.value == "error" || typeShared.value == "warning") ?
                    withSequence(
                        withRepeat(
                            withSequence(
                                withTiming(-10, {
                                    duration: 100,
                                    easing: Easing.inOut(Easing.quad),
                                }),
                                withTiming(10, {
                                    duration: 100,
                                    easing: Easing.inOut(Easing.quad),
                                }),
                            ),
                            3,
                            true
                        ),
                        withTiming(0, {
                            duration: 100,
                            easing: Easing.inOut(Easing.quad),
                        }),
                    )
                    :
                    0,
            }
        ]
    }));

    useEffect(() => {
        typeShared.value = type;
    }, [type]);

    return (
        <Context.Provider value={{
            toast: text,
            setToast,
            setDismiss,
        }}>
            {/* {children} */}

            {/* Toast */}

            <GestureDetector gesture={pan}>
                <Animated.View
                    onLayout={(e) => {
                        toastPosition.value = ((screenWidth / 2) - (e.nativeEvent.layout.width / 2));
                        toastHideValue.value = (-((screenHeight + (screenHeight * .1) + e.nativeEvent.layout.height)));
                    }}
                    style={[
                        toastAnimation,
                        {
                            zIndex: 500,
                        },
                    ]}
                    className="absolute top-10 w-11/12 sm:w-[500px] flex flex-row gap-2"
                >
                    <View className="size-[45px] shrink-0 dark:bg-black bg-white rounded-full">
                        <View
                            style={{
                                transform: [
                                    {
                                        translateY: 5,
                                    },
                                ],
                                filter: "blur(5px)",
                            }}
                            className="absolute left-0 top-0 size-full rounded-full bg-black/30"
                        />

                        <View className="size-full flex justify-center items-center dark:bg-white/10 bg-white rounded-full border dark:border-white/5 border-black/10">
                            <Image
                                source={require("../assets/images/logo.png")}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                }}
                            />
                        </View>
                    </View>

                    <View className={clsx(
                        "w-[70%] rounded-2xl mt-1",
                        type == "default" && "dark:bg-black bg-white",
                        type == "error" && "bg-red-500",
                        type == "warning" && "bg-amber-500",
                        type == "success" && "bg-emerald-500",
                    )}>
                        <View className={clsx(
                            "w-full h-full flex flex-row px-3 py-2 rounded-2xl",
                            type == "default" && "dark:bg-white/10 bg-black/60 border dark:border-white/5 border-white/5",
                            type == "error" && "dark:bg-black/90 bg-black/75 border dark:border-red-500/20 border-red-500/80",
                            type == "warning" && "dark:bg-black/90 bg-black/80 border dark:border-amber-500/10 border-amber-500/80",
                            type == "success" && "dark:bg-black/90 bg-black/80 border dark:border-emerald-500/10 border-emerald-500/80",
                        )}>

                            <View className="">
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
                                    className="text-xl"
                                >
                                    {text}
                                </TextAnimated>
                            </View>
                        </View>
                    </View>

                    <View className="size-[45px] rounded-full">
                        <View
                            style={{
                                transform: [
                                    {
                                        translateY: 5,
                                    },
                                ],
                                filter: "blur(5px)",
                            }}
                            className="absolute left-0 top-0 size-full rounded-full bg-black/30"
                        />

                        <View className="size-full shrink-0 dark:bg-black bg-white rounded-full">
                            <View className={clsx(
                                "size-full flex justify-center items-center rounded-full border dark:border-white/5 border-black/10",
                                // type == "error" && "dark:bg-red-500/10 bg-red-500/10",
                                // type == "warning" && "dark:bg-yellow-500/15 bg-yellow-500/10",
                                // type == "success" && "dark:bg-emerald-500/10 bg-emerald-500/10",
                                "dark:bg-emerald-500/10 bg-emerald-500/10",
                            )}>
                                <Animated.View style={indicatorAnimation}>
                                    {
                                        // type == "error" && (
                                        (
                                            <AntDesign
                                                name="check"
                                                size={25}
                                                color={COLORS.emerald[500]}
                                            />
                                        )
                                    }

                                    {
                                        type == "error" && (
                                            <View className="dark:opacity-70 opacity-100">
                                                <Entypo
                                                    name="cross"
                                                    size={35}
                                                    color="red"
                                                />
                                            </View>
                                        )
                                    }

                                    {
                                        type == "warning" && (
                                            <View className="dark:opacity-70 opacity-100">
                                                <Entypo
                                                    name="warning"
                                                    size={25}
                                                    color={COLORS.amber[400]}
                                                />
                                            </View>
                                        )
                                    }

                                </Animated.View>
                            </View>
                        </View>
                    </View>
                </Animated.View>
            </GestureDetector>

            {/* Dismiss */}

            <GestureDetector gesture={dismissPan}>
                <Animated.View
                    onLayout={(e) => {
                        dismissPosition.value = ((screenWidth / 2) - (e.nativeEvent.layout.width / 2));
                        dismissHideValue.value = (screenHeight + (screenHeight * .1) + e.nativeEvent.layout.height);
                    }}
                    style={[
                        dismissAnimation,
                        {
                            zIndex: 500,
                        },
                    ]}
                    className="absolute bottom-[100px] w-8/12 sm:w-[250px] h-[50px] rounded-2xl dark:bg-black bg-white"
                >
                    <View
                        style={{
                            transform: [
                                {
                                    translateY: 10,
                                }
                            ],
                            filter: "blur(5px)"
                        }}
                        className="absolute left-0 bottom-0 w-full h-full rounded-2xl bg-black/20"
                    />

                    <Pressable
                        onPress={() => handleCloseDismiss(true)}
                        className="w-full h-full flex flex-row justify-center items-center gap-6 px-3 py-2 rounded-2xl dark:bg-white/10 bg-white border dark:border-white/10 border-black/15"
                    >
                        <TextAnimated
                            dark="rgba(255, 255, 255, .6)"
                            light="rgba(0, 0, 0, .8)"
                            className="text-xl text-center font-medium"
                        >
                            {t("toast_cancel")}
                        </TextAnimated>

                        <View className="h-full flex justify-center items-center">
                            <ActivityIndicator
                                size={45}
                                color={theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .4)"}
                            />

                            <TextAnimated
                                dark="rgba(255, 255, 255, .6)"
                                light="rgba(0, 0, 0, .8)"
                                className="absolute text-lg"
                            >
                                {count}
                            </TextAnimated>
                        </View>
                    </Pressable>
                </Animated.View>
            </GestureDetector>
        </Context.Provider>
    );
}

export const useToast = () => useContext(Context);