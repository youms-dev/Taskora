import { COLORS } from "@/constants/colors";
import { useTheme } from "@/hooks/use-theme";
import { LinearGradient } from "expo-linear-gradient";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated";

interface Props {
    height: number;
    onIndexChanged: (value: string, target?: "hour" | "minute") => void;
    initialIndex?: number;
}

export const FlatListMinutes = memo(({ height, onIndexChanged, initialIndex }: Props) => {
    const ref = useRef<FlatList>(null);
    const perHour = 60;
    const repeat = perHour * 101;
    const [minuteHeight, setMinuteHeight] = useState<number>(0);
    const { theme, themeShared } = useTheme();
    const scrolling = useSharedValue<boolean>(false);
    const timeout = useRef<ReturnType<typeof setTimeout>>(null);
    const startPos = Math.round(((repeat * perHour) / 2) - (perHour / 2));
    const currentIndex = useRef<number>(startPos);
    const scrollTimeout = useRef<ReturnType<typeof setTimeout>>(null);

    const minutes = useMemo(() => {
        return Array(repeat).fill(0).map(() => {
            return Array(perHour).fill(0).map((_, i) => String(i).padStart(2, "0"));
        }).join(",").split(",");
    }, []);

    const textAnimation = useAnimatedStyle(() => ({
        color: scrolling.value ?
            COLORS.emerald[500]
            :
            themeShared.value == "dark" ? "rgba(255, 255, 255, .9)" : "rgba(0, 0, 0, .9)"
        ,
    }));

    const changeIndex = useCallback((index: number) => {
        ref.current?.scrollToIndex({
            index,
        });
    }, []);

    const tapGesture = useCallback((index: number) => {
        return (
            Gesture.Tap()
                .maxDeltaY(5)
                .onEnd((_event, success) => {
                    if (success) {
                        runOnJS(changeIndex)(index);
                    }
                })
        );
    }, []);

    const renderItem = useCallback(({ item: hour, index }: { item: string; index: number }) => {
        return (
            <GestureDetector gesture={tapGesture(index)}>
                <View
                    style={{
                        height: minuteHeight,
                    }}
                    className="w-full flex justify-center items-center"
                >
                    <Animated.Text
                        style={textAnimation}
                        className="text-5xl font-bold"
                    >
                        {hour}
                    </Animated.Text>
                </View>
            </GestureDetector>
        );
    }, [minuteHeight]);

    const getItemLayout = useCallback((data: unknown, index: number) => ({
        length: minuteHeight,
        offset: index * minuteHeight,
        index,
    }), [minuteHeight]);

    const onMomentumScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const y = e.nativeEvent.contentOffset.y;
        const index = Math.round(y / minuteHeight);

        if (currentIndex.current && index != currentIndex.current) {
            onIndexChanged(minutes[index], "minute");
        }
        currentIndex.current = index;
        scrolling.value = false;
    }, [minuteHeight, onIndexChanged]);

    useEffect(() => {
        scrollTimeout.current && clearTimeout(scrollTimeout.current);
        setMinuteHeight(height / 3);
        scrollTimeout.current = setTimeout(() => {
            ref.current?.scrollToIndex({
                index: currentIndex.current ? currentIndex.current : startPos,
            });
        }, 100);
    }, [height]);

    const onScroll = useCallback(() => {
        timeout.current && clearTimeout(timeout.current);
        scrolling.value = true;
        timeout.current = setTimeout(() => {
            scrolling.value = false;
        }, 200);
    }, []);

    return (
        <View className="w-full h-full">
            <View
                style={{
                    height: minuteHeight,
                    transform: [
                        {
                            translateY: -1,
                        }
                    ],
                }}
                className="absolute left-0 top-0 w-full z-[1] pointer-events-none dark:opacity-80 opacity-60"
            >
                <LinearGradient
                    colors={theme == "dark" ?
                        ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)"]
                        :
                        ["rgba(255, 255, 255, .8)", "rgba(255, 255, 255, .8)", "rgba(255, 255, 255, 0)"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    locations={[0, .8, 1]}
                    className="size-full"
                >
                    <LinearGradient
                        colors={theme == "dark" ?
                            ["rgba(255, 255, 255, .05)", "rgba(255, 255, 255, .05)", "rgba(0, 0, 0, 0)"]
                            :
                            ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        locations={[0, .8, 1]}
                        className="size-full"
                    />
                </LinearGradient>
            </View>

            <Animated.FlatList
                ref={ref}
                data={minutes}
                snapToInterval={minuteHeight}
                snapToAlignment="start"
                keyExtractor={(_, i) => String(i)}
                scrollEventThrottle={16}
                renderItem={renderItem}
                getItemLayout={getItemLayout}
                initialScrollIndex={initialIndex ? startPos + initialIndex : startPos}
                initialNumToRender={10}
                windowSize={10}
                maxToRenderPerBatch={perHour * 3}
                updateCellsBatchingPeriod={1}
                showsVerticalScrollIndicator={false}
                onScroll={onScroll}
                onMomentumScrollEnd={onMomentumScrollEnd}
                removeClippedSubviews
                className="w-full h-full"
                contentContainerStyle={{
                    paddingVertical: minuteHeight,
                }}
                contentContainerClassName="w-full flex items-center"
            />

            <View
                style={{
                    height: minuteHeight,
                    transform: [
                        {
                            translateY: 1,
                        }
                    ],
                }}
                className="absolute left-0 bottom-0 w-full z-[1] pointer-events-none dark:opacity-80 opacity-60"
            >
                <LinearGradient
                    colors={theme == "dark" ?
                        ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)"]
                        :
                        ["rgba(255, 255, 255, .8)", "rgba(255, 255, 255, .8)", "rgba(255, 255, 255, 0)"]
                    }
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    locations={[0, .8, 1]}
                    className="size-full"
                >
                    <LinearGradient
                        colors={theme == "dark" ?
                            ["rgba(255, 255, 255, .05)", "rgba(255, 255, 255, .05)", "rgba(0, 0, 0, 0)"]
                            :
                            ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                        }
                        start={{ x: 0, y: 1 }}
                        end={{ x: 0, y: 0 }}
                        locations={[0, .8, 1]}
                        className="size-full"
                    />
                </LinearGradient>
            </View>
        </View>
    );
});