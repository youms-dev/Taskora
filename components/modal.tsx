import { tabPaths } from "@/constants/names";
import { useTheme } from "@/hooks/use-theme";
import { event, HIDE_NAVBAR, SHOW_NAVBAR } from "@/lib/event-emitter";
import { usePathname } from "expo-router";
import { CSSProperties, ReactNode, RefObject, useEffect, useRef } from "react";
import { BackHandler, DimensionValue, KeyboardAvoidingView, Platform, ScrollView, ScrollViewProps, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { PressableAnimated } from "./pressable-animated";

interface Props extends Omit<ScrollViewProps, "ref"> {
    height?: DimensionValue;
    rounded?: number;
    width?: DimensionValue;
    dragHandler?: ReactNode | false;
    scrollViewClassName?: string;
    contentContainerClassName?: string;
    className?: string;
    animationDuration?: number;
    active?: boolean;
    onClose?: () => void;
    scrollViewRef?: RefObject<ScrollView>;
    containerRef?: RefObject<View>;
    closable?: boolean;
    zIndex?: number;
    background?: CSSProperties["backgroundColor"];
    children?: ReactNode;
}

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
const AnimatedKeyboardAvoidingView = Animated.createAnimatedComponent(KeyboardAvoidingView);

/**
 * Modal component
 * @param height Modal height
 * @default "60%"
 * 
 * @param rounded The number that's used to round the top left and top right modal corner.
 * @default 30
 * 
 * @param width Modal width
 * 
 * @param dragHandler The drag component
 * 
 * @param scrollViewClassName The class that will be used to custom the scrollView
 * @default "w-full h-full"
 * 
 * @param contentContainerClassName The class that will be used to custom the scrollView's content container
 * @default "w-full flex items-center"
 * 
 * @param className The class that will be used to custom the modal container
 * @default "flex items-center border-t-2 dark:border-t-white/20 border-t-black/20 border-transparent dark:bg-white bg-black"
 * 
 * @param animationDuration The duration of the animation
 * @default 200
 * 
 * @param active Define whether the modal is active or not
 * @default false
 * 
 * @param onClose The callback that will be called when the modal is closed
 * 
 * @param containerRef The ref that will be used to access the modal container
 * 
 * @param scrollViewRef The ref that will be used to access the scrollView
 * 
 * @param closable Define whether the modal is closable or not
 * @default true
 * 
 * @param zIndex The z-index of the modal
 * @default 1000
 * 
 * @param background The background color of the modal
 * @default "transparent"
 * 
 * @param children The children of the modal
 * 
 * @returns Modal component 
 */

export const Modal = ({
    height = "60%",
    rounded = 30,
    width,
    dragHandler,
    scrollViewClassName = "w-full h-full dark:bg-black/80 bg-white/80",
    contentContainerClassName = "w-full flex items-center pt-6",
    className = "flex items-center border-t-2 dark:border-t-white/20 border-t-black/20 border-transparent dark:bg-white bg-black",
    animationDuration: modalAnimationDuration = 200,
    active: modalActive,
    onClose,
    containerRef,
    scrollViewRef,
    closable: modalClosable = true,
    zIndex: modalZIndex = 1000,
    background: modalBackground = "transparent",
    children,
    ...rest
}: Props) => {
    const { width: dW, height: dH } = useWindowDimensions();
    const hideValue = useSharedValue<number>(dH);
    const translateY = useSharedValue<number>(dH);
    const duration = useSharedValue<typeof modalAnimationDuration>(200);
    const scroll = useSharedValue<number>(0);
    const scrollGesture = Gesture.Native();
    const active = useSharedValue<boolean>(false);
    const timeout = useRef<ReturnType<typeof setTimeout>>(null);
    const closable = useSharedValue<boolean>(true);
    const zIndex = useSharedValue<number>(1000);
    const background = useSharedValue<typeof modalBackground>("transparent");
    const { theme } = useTheme();
    const dragging = useSharedValue<boolean>(false);
    const appTheme = useSharedValue<typeof theme>(theme);
    const pathname = usePathname();

    const panAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: translateY.value,
            }
        ]
    }));

    const handleClose = () => {
        timeout.current && clearTimeout(timeout.current);
        if (!modalClosable) return;
        translateY.value = withTiming(hideValue.value, {
            duration: 200,
            easing: Easing.inOut(Easing.quad),
        });
        timeout.current = setTimeout(() => {
            onClose && onClose();
        }, Math.ceil(modalAnimationDuration / 2) > 100 ? Math.ceil(modalAnimationDuration / 2) : 100);
    }

    const pan = Gesture.Pan()
        .simultaneousWithExternalGesture(scrollGesture)
        .onUpdate(({ translationY: y }) => {
            if (y > 0 && scroll.value <= 0 && closable.value) {
                dragging.value = true;
                translateY.value = y;
            }
        })
        .onEnd(({ translationY: y }) => {
            dragging.value = false;
            if (scroll.value > 0) {
                translateY.value = withTiming(0, {
                    duration: 200,
                    easing: Easing.inOut(Easing.quad),
                });
                return;
            }
            if (y <= 100) {
                scroll.value = 0;
                translateY.value = withTiming(0, {
                    duration: 200,
                    easing: Easing.inOut(Easing.quad),
                });
                return;
            }
            scroll.value = 0;
            runOnJS(handleClose)();
        });

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (e) => {
            scroll.value = e.contentOffset.y;
        }
    });

    useEffect(() => {
        const backPress = () => {
            if (modalActive) {
                handleClose();
                return true;
            }
            return false;
        }
        const { remove } = BackHandler.addEventListener("hardwareBackPress", backPress);

        active.value = !!modalActive;
        closable.value = !!modalClosable;
        zIndex.value = modalZIndex;
        duration.value = modalAnimationDuration;
        background.value = modalBackground;

        if (modalActive) {
            translateY.value = withTiming(0, {
                duration: 200,
                easing: Easing.inOut(Easing.quad),
            });
            event.emit(HIDE_NAVBAR);
        }
        else {
            handleClose();
            if (tabPaths.includes(pathname)) event.emit(SHOW_NAVBAR);
        }

        return () => remove();
    }, [modalActive, modalClosable, modalZIndex, modalAnimationDuration, modalBackground]);

    const closeAnimation = useAnimatedStyle(() => ({
        pointerEvents: active.value ? "auto" : "none",
    }));

    const backgroundAnimation = useAnimatedStyle(() => ({
        backgroundColor: withTiming(background.value, {
            duration: 200,
            easing: Easing.inOut(Easing.quad),
        }),
    }));

    const dragHandlerAnimation = useAnimatedStyle(() => ({
        backgroundColor: withTiming(dragging.value ?
            (appTheme.value == "dark" ? "rgba(255, 255, 255, 1)" : "rgba(0, 0, 0, 1)")
            :
            (appTheme.value == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .5)"),
            {
                duration: 200,
                easing: Easing.inOut(Easing.quad),
            }
        )
    }));

    useEffect(() => {
        appTheme.value = theme;
    }, [theme]);

    useEffect(() => {
        hideValue.value = dH + (dH * .2);
    }, [dH]);

    return (
        <AnimatedKeyboardAvoidingView
            behavior={Platform.OS == "android" ? "height" : "padding"}
            style={[
                {
                    width: dW,
                    height: dH,
                },
                closeAnimation,
            ]}
            className="absolute left-0 top-0 flex items-center"
        >
            <PressableAnimated
                scale={1}
                style={backgroundAnimation}
                onPress={() => handleClose()}
                className="w-full h-full"
            />

            <GestureDetector gesture={pan}>
                <Animated.View
                    ref={containerRef}
                    style={[
                        {
                            position: "absolute",
                            bottom: 0,
                            width: width ? width : (dW > 500 ? 500 : dW),
                            height,
                            borderTopLeftRadius: rounded,
                            borderTopRightRadius: rounded,
                            overflow: "hidden",
                        },
                        panAnimation,
                    ]}
                    className={className}
                >
                    <View className="w-full h-full flex items-center">
                        <View className="absolute w-full z-[1] dark:bg-black bg-white">
                            <View className=" w-full flex justify-center items-center dark:bg-white/20 bg-black/20">
                                {
                                    typeof dragHandler != "boolean" && (
                                        dragHandler ?
                                            dragHandler
                                            :
                                            (
                                                <Animated.View
                                                    style={dragHandlerAnimation}
                                                    className="w-20 h-2 rounded-2xl my-2"
                                                />
                                            )
                                    )
                                }
                            </View>
                        </View>

                        <GestureDetector gesture={scrollGesture}>
                            <AnimatedScrollView
                                ref={scrollViewRef}
                                {...rest}
                                showsVerticalScrollIndicator={false}
                                onScroll={scrollHandler}
                                scrollEventThrottle={16}
                                className={scrollViewClassName}
                                contentContainerClassName={contentContainerClassName}
                            >
                                {children}
                            </AnimatedScrollView>
                        </GestureDetector>
                    </View>
                </Animated.View>
            </GestureDetector>
        </AnimatedKeyboardAvoidingView>
    );
}