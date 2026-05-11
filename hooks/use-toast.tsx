import { TextAnimated } from "@/components/text-animated";
import { COLORS } from "@/constants/colors";
import { BlurView } from "expo-blur";
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { DimensionValue, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

type ToastType = "success" | "error" | "warning" | "default";

const Context = createContext<{
    toast: string;
    setToast: (value: string, type?: ToastType, duration?: number) => void;
}>({
    toast: "",
    setToast: () => { },
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

    const setToast = (value: string, type: ToastType = "default", duration: number = 3000) => {
        closeTimeout.current && clearTimeout(closeTimeout.current);
        refreshTimeout.current && clearTimeout(refreshTimeout.current);
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
    }, [text, hideValue]);

    return (
        <Context.Provider value={{
            toast: text,
            setToast,
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
                    className="absolute top-10 w-11/12 sm:w-[500px] dark:bg-white/50 bg-black/20 rounded-2xl overflow-hidden"
                >
                    <BlurView
                        intensity={100}
                        tint="systemMaterialDark"
                        className="w-full h-full flex justify-center items-center px-3 py-2"
                    >
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
                    </BlurView>
                </Animated.View>
            </GestureDetector>
            {children}
        </Context.Provider>
    );
}

export const useToast = () => useContext(Context);