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
    target?: "hours" | "minutes";
}

export const TimePager = memo(({ height, onIndexChanged, initialIndex, target = "hours" }: Props) => {
    const ref = useRef<FlatList>(null);
    const range = target == "hours" ? 24 : 60;
    const repeat = Math.round(10000 / range);
    const [itemHeight, setItemHeight] = useState<number>(height / 3);
    const { theme, themeShared } = useTheme();
    const scrolling = useSharedValue<boolean>(false);
    const timeout = useRef<ReturnType<typeof setTimeout>>(null);
    const startPos = Math.round((repeat * range) / 2) - (range / 2);
    const currentIndex = useRef<number>(initialIndex ? startPos + initialIndex : startPos);
    const scrollTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    const mounted = useRef<boolean>(false);

    const times = useMemo(() => {
        return Array(repeat).fill(0).map(() => {
            return Array(range).fill(0).map((_, i) => String(i).padStart(2, "0"));
        }).join(",").split(",");
    }, []);

    const timesMap = useMemo(() => {
        return (
            new Map(
                times.map((t, i) => [i, t]),
            )
        );
    }, [times]);

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

    const renderItem = useCallback(({ item, index }: { item: string; index: number }) => {
        return (
            <GestureDetector gesture={tapGesture(index)}>
                <View
                    style={{
                        height: itemHeight,
                    }}
                    className="w-full flex justify-center items-center"
                >
                    <Animated.Text
                        style={textAnimation}
                        className="text-5xl font-bold"
                    >
                        {item}
                    </Animated.Text>
                </View>
            </GestureDetector>
        );
    }, [itemHeight]);

    const getItemLayout = useCallback((data: unknown, index: number) => ({
        length: itemHeight,
        offset: index * itemHeight,
        index,
    }), [itemHeight]);

    const onMomentumScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const y = e.nativeEvent.contentOffset.y;
        const index = Math.round(y / itemHeight);

        if (currentIndex.current && index != currentIndex.current) {
            onIndexChanged(timesMap.get(index) ?? "00", target == "hours" ? "hour" : "minute");
        }
        currentIndex.current = index;
        scrolling.value = false;
    }, [itemHeight, onIndexChanged, target, timesMap]);

    useEffect(() => {
        scrollTimeout.current && clearTimeout(scrollTimeout.current);
        setItemHeight(height / 3);
        if (mounted.current) {
            scrollTimeout.current = setTimeout(() => {
                ref.current?.scrollToIndex({
                    index: currentIndex.current,
                    animated: false,
                });
            }, 200);
        }
        mounted.current = true;
    }, [height]);

    const onScroll = useCallback(() => {
        timeout.current && clearTimeout(timeout.current);
        scrolling.value = true;
        timeout.current = setTimeout(() => {
            scrolling.value = false;
        }, 200);
    }, []);

    useEffect(() => {
        scrollTimeout.current && clearTimeout(scrollTimeout.current);
        if (initialIndex && mounted.current) {
            ref.current?.scrollToIndex({
                index: startPos + initialIndex,
                animated: false,
            });
        }
    }, [initialIndex]);

    return (
        <View className="w-full h-full">
            <View
                style={{
                    height: itemHeight,
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
                data={times}
                snapToInterval={itemHeight}
                snapToAlignment="start"
                keyExtractor={(_, i) => String(i)}
                scrollEventThrottle={16}
                renderItem={renderItem}
                getItemLayout={getItemLayout}
                initialScrollIndex={initialIndex ? startPos + initialIndex : startPos}
                initialNumToRender={10}
                windowSize={100}
                maxToRenderPerBatch={range * 3}
                updateCellsBatchingPeriod={0}
                showsVerticalScrollIndicator={false}
                onScroll={onScroll}
                onMomentumScrollEnd={onMomentumScrollEnd}
                removeClippedSubviews={false}
                className="w-full h-full"
                contentContainerStyle={{
                    paddingVertical: itemHeight,
                }}
                contentContainerClassName="w-full flex items-center"
            />

            <View
                style={{
                    height: itemHeight,
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