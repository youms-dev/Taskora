import { useTheme } from "@/hooks/use-theme";
import { BlurTint, BlurView } from "expo-blur";
import { CSSProperties, ReactNode, RefObject, useEffect, useRef } from "react";
import { BackHandler, DimensionValue, ScrollView, ScrollViewProps, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { PressableAnimated } from "./pressable-animated";

interface Props extends Omit<ScrollViewProps, "ref"> {
    height?: DimensionValue;
    rounded?: number;
    width?: DimensionValue;
    dragHandler?: ReactNode;
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
    blurTint?: BlurTint;
    blurIntensity?: number;
}

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

/**
 * Modal component
 * @param height Modal height
 * @default "60%"
 * 
 * @param rounded The number that's used to round the top left and top right modal corner.
 * @default 30
 * 
 * @param width Modal width
 * @default "100%"
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
 * @default "flex items-center border-t-2 dark:border-t-white/20 border-t-black/20 dark:bg-white bg-black"
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
 * @param blurIntensity The intensity of the blur
 * @default 100
 * 
 * @param blurTint The tint of the blur
 * @default "blur"
 * 
 * @returns Modal component 
 */

export const Modal = ({ height = "60%", rounded = 30, width = "100%", dragHandler, scrollViewClassName = "w-full h-full", contentContainerClassName = "w-full flex items-center", className = "flex items-center border-t-2 dark:border-t-white/20 border-t-black/20 dark:bg-white bg-black", animationDuration: modalAnimationDuration = 200, active: modalActive, onClose, containerRef, scrollViewRef, closable: modalClosable = true, zIndex: modalZIndex = 1000, background: modalBackground = "transparent", children, blurIntensity = 100, blurTint, ...rest }: Props) => {
    const { width: dW, height: dH } = useWindowDimensions();
    const hideValue = dH + (dH * .2);
    const translateY = useSharedValue<number>(hideValue);
    const duration = useSharedValue<typeof modalAnimationDuration>(modalAnimationDuration);
    const scroll = useSharedValue<number>(0);
    const scrollGesture = Gesture.Native();
    const active = useSharedValue<boolean>(!!modalActive);
    const timeout = useRef<ReturnType<typeof setTimeout>>(null);
    const closable = useSharedValue<boolean>(!!modalClosable);
    const zIndex = useSharedValue<number>(modalZIndex);
    const background = useSharedValue<typeof modalBackground>(modalBackground);
    const { theme } = useTheme();

    const panAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: withTiming(translateY.value, {
                    duration: duration.value,
                    easing: Easing.inOut(Easing.quad),
                }),
            }
        ]
    }));

    const handleClose = () => {
        timeout.current && clearTimeout(timeout.current);
        if (!modalClosable) return;
        translateY.value = dH + (dH * .2);
        timeout.current = setTimeout(() => {
            onClose && onClose();
        }, Math.ceil(modalAnimationDuration / 2) > 100 ? Math.ceil(modalAnimationDuration / 2) : 100);
    }

    const pan = Gesture.Pan()
        .simultaneousWithExternalGesture(scrollGesture)
        .onUpdate(({ translationY: y }) => {
            if (y > 0 && scroll.value <= 0 && closable.value) {
                translateY.value = y;
            }
        })
        .onEnd(({ translationY: y }) => {
            if (scroll.value > 0) {
                translateY.value = 0;
                return;
            }
            if (y <= 100) {
                translateY.value = 0;
                scroll.value = 0;
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
            translateY.value = 0;
        }
        else {
            translateY.value = hideValue;
        }

        return () => remove();
    }, [modalActive, modalClosable, modalZIndex, modalAnimationDuration, modalBackground]);

    const closedAnimation = useAnimatedStyle(() => ({
        opacity: active.value ? 1 : 0,
        pointerEvents: active.value ? "auto" : "none",
        zIndex: active.value ? zIndex.value : 0,
    }));

    const backgroundAnimation = useAnimatedStyle(() => ({
        backgroundColor: withTiming(background.value, {
            duration: 200,
            easing: Easing.inOut(Easing.quad),
        })
    }));

    return (
        <Animated.View
            style={[
                {
                    width: dW,
                    height: dH,
                },
                closedAnimation,
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
                            width,
                            height,
                            borderTopLeftRadius: rounded,
                            borderTopRightRadius: rounded,
                            overflow: "hidden",
                        },
                        panAnimation,
                    ]}
                    className={className}
                >
                    <BlurView
                        intensity={blurIntensity}
                        tint={!blurTint ? theme == "dark" ? "systemChromeMaterialDark" : "systemChromeMaterialLight" : blurTint}
                        className="w-full h-full"
                    >
                        <View className="w-full flex justify-center items-center py-2">
                            {
                                dragHandler ?
                                    dragHandler :
                                    (
                                        <View className="w-20 h-2 dark:bg-white/50 bg-black/50 rounded-2xl" />
                                    )
                            }
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
                    </BlurView>
                </Animated.View>
            </GestureDetector>
        </Animated.View>
    );
}