import { useTheme } from "@/hooks/use-theme";
import { CSSProperties, memo, ReactNode, RefObject, useCallback, useEffect, useMemo, useRef } from "react";
import { BackHandler, DimensionValue, KeyboardAvoidingView, Platform, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { AnimatedScrollViewProps, Easing, runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { PressableAnimated } from "./pressable-animated";

interface Props extends Omit<AnimatedScrollViewProps, "ref"> {
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
    scrollViewRef?: RefObject<Animated.ScrollView>;
    containerRef?: RefObject<View>;
    closable?: boolean;
    zIndex?: number;
    background?: CSSProperties["backgroundColor"];
    children?: ReactNode;
    draggingDragHandlerColor?: CSSProperties["backgroundColor"];
    closeAnimationDuration?: number;
}

const AnimatedKeyboardAvoidingView = Animated.createAnimatedComponent(KeyboardAvoidingView);

/**
 * Modal component
 * 
 * @param height
 * @default "60%"
 * 
 * @param rounded The number that's used to round the top left and top right modal corner.
 * @default 30
 * 
 * @param width Modal width
 * 
 * @param dragHandler The drag handler component
 * 
 * @param scrollViewClassName The class list that will be used to custom the scrollView
 * @default "w-full h-full"
 * 
 * @param contentContainerClassName The class list that will be used to custom the scrollView's content container
 * @default "w-full flex items-center"
 * 
 * @param className The class list that will be used to custom the modal container
 * @default "flex items-center border-t-2 dark:border-t-white/20 border-t-black/20 border-transparent dark:bg-white bg-black"
 * 
 * @param animationDuration The animation duration when the modal is getting opened
 * @default 200
 * 
 * @param active Define whether the modal is active or not
 * @default false
 * 
 * @param onClose
 * 
 * @param containerRef The ref that will be used to access to the modal container
 * 
 * @param scrollViewRef The ref that will be used to access to the scrollView
 * 
 * @param closable Define whether the modal is closable or not
 * @default true
 * 
 * @param zIndex
 * @default 1000
 * 
 * @param background
 * @default "transparent"
 * 
 * @param children
 * 
 * @param draggingDragHandlerColor
 * 
 * @param closeAnimationDuration
 * @default 200
 * 
 * @returns Modal component 
 */

export const Modal = memo(({
    height = "60%",
    rounded = 30,
    width,
    dragHandler,
    scrollViewClassName = "w-full h-full dark:bg-black/80 bg-white/80",
    contentContainerClassName = "w-full flex items-center pt-6",
    className = "flex items-center border-t-2 dark:border-t-white/20 border-t-black/20 border-transparent dark:bg-white bg-black",
    animationDuration = 200,
    active: modalActive,
    onClose,
    containerRef,
    scrollViewRef,
    closable: modalClosable = true,
    zIndex = 1000,
    background: modalBackground = "transparent",
    children,
    draggingDragHandlerColor,
    closeAnimationDuration = 200,
    ...rest
}: Props) => {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const hideValue = useSharedValue<number>(screenHeight);
    const translateY = useSharedValue<number>(screenHeight);
    const scroll = useSharedValue<number>(0);
    const scrollGesture = useMemo(() => Gesture.Native(), []);
    const active = useSharedValue<boolean>(false);
    const timeout = useRef<ReturnType<typeof setTimeout>>(null);
    const closable = useSharedValue<boolean>(true);
    const background = useSharedValue<typeof modalBackground>("transparent");
    const { themeShared } = useTheme();
    const dragging = useSharedValue<boolean>(false);
    const draggingDragHandlerColorShared = useSharedValue<typeof draggingDragHandlerColor>(undefined);

    const panAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: translateY.value,
            }
        ]
    }));

    const handleClose = useCallback(() => {
        timeout.current && clearTimeout(timeout.current);
        if (!modalClosable) return;
        translateY.value = withTiming(hideValue.value, {
            duration: closeAnimationDuration,
            easing: Easing.inOut(Easing.quad),
        });
        timeout.current = setTimeout(() => {
            onClose && onClose();
        }, 100);
    }, [modalClosable, closeAnimationDuration, onClose]);

    const pan = useMemo(() => {
        return (
            Gesture.Pan()
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
                })
        );
    }, [handleClose]);

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
        background.value = modalBackground;

        if (modalActive) {
            translateY.value = withTiming(0, {
                duration: animationDuration,
                easing: Easing.inOut(Easing.quad),
            });
        }
        else {
            handleClose();
        }

        return () => remove();
    }, [modalActive, modalClosable, animationDuration, modalBackground]);

    const containerAnimation = useAnimatedStyle(() => ({
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
            (
                draggingDragHandlerColorShared.value ?
                    draggingDragHandlerColorShared.value
                    :
                    (themeShared.value == "dark" ? "rgba(255, 255, 255, 1)" : "rgba(0, 0, 0, 1)")
            )
            :
            (themeShared.value == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .5)")
            ,
            {
                duration: 200,
                easing: Easing.inOut(Easing.quad),
            }
        )
    }));

    useEffect(() => {
        hideValue.value = screenHeight + (screenHeight * .2);
    }, [screenHeight]);

    useEffect(() => {
        draggingDragHandlerColorShared.value = draggingDragHandlerColor;
    }, [draggingDragHandlerColor]);

    return (
        <AnimatedKeyboardAvoidingView
            behavior={Platform.OS == "android" ? "height" : "padding"}
            style={[
                {
                    width: screenWidth,
                    height: screenHeight,
                    zIndex,
                },
                containerAnimation,
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
                            width: width ? width : (screenWidth > 500 ? 500 : screenWidth),
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
                            <View className=" w-full flex justify-center items-center dark:bg-white/20 bg-white">
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
                            <Animated.ScrollView
                                ref={scrollViewRef}
                                {...rest}
                                showsVerticalScrollIndicator={false}
                                onScroll={scrollHandler}
                                scrollEventThrottle={16}
                                className={scrollViewClassName}
                                contentContainerClassName={contentContainerClassName}
                            >
                                {children}
                            </Animated.ScrollView>
                        </GestureDetector>
                    </View>
                </Animated.View>
            </GestureDetector>
        </AnimatedKeyboardAvoidingView>
    );
});