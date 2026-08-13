import { useTheme } from "@/hooks/use-theme";
import { memo, ReactNode, useCallback, useEffect, useMemo, useRef } from "react";
import { BackHandler, DimensionValue, KeyboardAvoidingView, Platform, Pressable, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { AnimatedScrollViewProps, Easing, runOnJS, useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

interface Props extends AnimatedScrollViewProps {
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
    closable?: boolean;
    zIndex?: number;
    backdropBackground?: string;
    children?: ReactNode;
    draggingDragHandlerColor?: string;
    closeAnimationDuration?: number;
    dragHandlerContainerBackground?: string;
    dragHandlerBackground?: string;
}

const AnimatedKeyboardAvoidingView = Animated.createAnimatedComponent(KeyboardAvoidingView);

const PressableAnimated = Animated.createAnimatedComponent(Pressable);

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
 * @default "flex items-center dark:bg-black bg-white"
 * 
 * @param animationDuration The animation duration when the modal is getting opened
 * @default 200
 * 
 * @param active Define whether the modal is active or not
 * @default false
 * 
 * @param onClose
 * 
 * @param closable Define whether the modal is closable or not
 * @default true
 * 
 * @param zIndex
 * @default 1000
 * 
 * @param backdropBackground
 * @default "transparent"
 * 
 * @param children
 * 
 * @param draggingDragHandlerColor
 * 
 * @param closeAnimationDuration
 * @default 200
 * 
 * @param dragHandlerContainerBackground
 * 
 * @param dragHandlerBackground
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
    className = "flex items-center dark:bg-black bg-white",
    animationDuration = 200,
    active: modalActive,
    onClose,
    closable: modalClosable = true,
    zIndex = 1000,
    backdropBackground = "transparent",
    children,
    draggingDragHandlerColor,
    closeAnimationDuration = 200,
    dragHandlerContainerBackground: dragHandlerContainerBackgroundProps = "",
    dragHandlerBackground: dragHandlerBackgroundProps = "",
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
    const { themeShared } = useTheme();
    const dragging = useSharedValue<boolean>(false);
    const draggingDragHandlerColorShared = useSharedValue<typeof draggingDragHandlerColor>(undefined);
    const scrolling = useSharedValue<boolean>(false);
    const ref = useAnimatedRef<Animated.ScrollView>();
    const dragHandlerContainerBackground = useSharedValue<typeof dragHandlerContainerBackgroundProps>("");
    const dragHandlerBackground = useSharedValue<typeof dragHandlerBackgroundProps>("");

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
        }, closeAnimationDuration * .5);
    }, [modalClosable, closeAnimationDuration, onClose]);

    const pan = useMemo(() => {
        return (
            Gesture.Pan()
                .simultaneousWithExternalGesture(scrollGesture)
                .failOffsetX([-10, 10])
                .activeOffsetY(5)
                .onUpdate(({ translationY: y }) => {
                    if (y > 0 && !scrolling.value && closable.value && scroll.value == 0) {
                        dragging.value = true;
                        translateY.value = y;
                    }
                })
                .onEnd(({ translationY: y }) => {
                    dragging.value = false;
                    if (scrolling.value || !closable.value || scroll.value != 0) {
                        translateY.value = withTiming(0, {
                            duration: 200,
                            easing: Easing.inOut(Easing.quad),
                        });
                        return;
                    }
                    if (y <= 100) {
                        ref.current?.scrollTo({
                            y: 0,
                        });
                        translateY.value = withTiming(0, {
                            duration: 200,
                            easing: Easing.inOut(Easing.quad),
                        });
                        return;
                    }
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

        if (modalActive) {
            timeout.current && clearTimeout(timeout.current);
            translateY.value = withTiming(0, {
                duration: animationDuration,
                easing: Easing.inOut(Easing.quad),
            });
        }
        else {
            handleClose();
        }

        return () => remove();
    }, [modalActive, animationDuration]);

    const containerAnimation = useAnimatedStyle(() => ({
        pointerEvents: active.value ? "auto" : "none",
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
            (
                dragHandlerBackground.value.trim().length > 0 ?
                    dragHandlerBackground.value
                    :
                    themeShared.value == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .5)"
            ),
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
        active.value = !!modalActive;
        closable.value = !!modalClosable;
        dragHandlerContainerBackground.value = dragHandlerContainerBackgroundProps;
        dragHandlerBackground.value = dragHandlerBackgroundProps;
    }, [draggingDragHandlerColor, modalClosable, dragHandlerContainerBackgroundProps, dragHandlerBackgroundProps, modalActive]);

    const onMomentumScrollBegin = useCallback(() => {
        scrolling.value = true;
    }, []);

    const onMomentumScrollEnd = useCallback(() => {
        scrolling.value = false;
    }, []);

    const dragHandlerContainerAnimation = useAnimatedStyle(() => ({
        backgroundColor: dragHandlerContainerBackground.value.trim().length > 0 ?
            dragHandlerContainerBackground.value
            :
            themeShared.value == "dark" ? "rgba(255, 255, 255, .2)" : "rgba(255, 255, 255, 1)"
    }));

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
            {
                modalActive && (
                    <PressableAnimated
                        onPress={() => handleClose()}
                        style={{
                            width: screenWidth,
                            height: screenHeight + (screenHeight * .2),
                            backgroundColor: backdropBackground,
                            transform: [
                                {
                                    translateY: -(screenHeight * .1),
                                }
                            ]
                        }}
                    />
                )
            }

            <GestureDetector gesture={pan}>
                <Animated.View
                    style={[
                        {
                            position: "absolute",
                            bottom: 0,
                            width: width ? width : screenWidth,
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
                            <Animated.View
                                style={dragHandlerContainerAnimation}
                                className="w-full flex justify-center items-center"
                            >
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
                            </Animated.View>
                        </View>

                        <GestureDetector gesture={scrollGesture}>
                            <Animated.ScrollView
                                {...rest}
                                ref={ref}
                                showsVerticalScrollIndicator={false}
                                onScroll={scrollHandler}
                                scrollEventThrottle={16}
                                onMomentumScrollBegin={onMomentumScrollBegin}
                                onMomentumScrollEnd={onMomentumScrollEnd}
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