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

export const FlatListHours = memo(({ height, onIndexChanged, initialIndex }: Props) => {
    const ref = useRef<FlatList>(null);
    const perDay = 24;
    const repeat = 10001;
    const [hourHeight, setHoursHeight] = useState<number>(0);
    const currentIndex = useRef<number>(null);
    const { theme, themeShared } = useTheme();
    const scrolling = useSharedValue<boolean>(false);
    const timeout = useRef<ReturnType<typeof setTimeout>>(null);
    const startPos = ((repeat * perDay) / 2) - (perDay / 2);
    const scrollTimeout = useRef<ReturnType<typeof setTimeout>>(null);

    const hours = useMemo(() => {
        return Array(repeat).fill(0).map(() => {
            return Array(perDay).fill(0).map((_, i) => String(i).padStart(2, "0"));
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
                        height: hourHeight,
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
    }, [hourHeight]);

    const getItemLayout = useCallback((data: unknown, index: number) => ({
        length: hourHeight,
        offset: index * hourHeight,
        index,
    }), [hourHeight]);

    const onMomentumScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const y = e.nativeEvent.contentOffset.y;
        const index = Math.round(y / hourHeight);

        if (currentIndex.current && index != currentIndex.current) {
            onIndexChanged(hours[index], "hour");
        }
        currentIndex.current = index;
        scrolling.value = false;
    }, [hourHeight]);

    useEffect(() => {
        scrollTimeout.current && clearTimeout(scrollTimeout.current);
        setHoursHeight(height / 3);
        scrollTimeout.current = setTimeout(() => {
            ref.current?.scrollToIndex({
                index: currentIndex.current ? currentIndex.current : startPos,
            });
        }, 100);
    }, [height, onIndexChanged]);

    const onScroll = useCallback(() => {
        timeout.current && clearTimeout(timeout.current);
        scrolling.value = true;
        timeout.current = setTimeout(() => {
            scrolling.value = false;
        }, 200);
    }, []);

    useEffect(() => {
        if (initialIndex && !currentIndex.current) {
            currentIndex.current = initialIndex;
        }
    }, [initialIndex]);

    return (
        <View className="w-full h-full">
            <View
                style={{
                    height: hourHeight,
                }}
                className="absolute left-0 top-0 w-full z-[1] pointer-events-none"
            >
                <LinearGradient
                    colors={theme == "dark" ?
                        ["rgba(0, 0, 0, .8)", "rgba(0, 0, 0, .8)", "rgba(0, 0, 0, 0)"]
                        :
                        ["rgba(255, 255, 255, .8)", "rgba(255, 255, 255, .8)", "rgba(255, 255, 255, 0)"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    locations={[0, .8, 1]}
                    className="size-full"
                />
            </View>

            <Animated.FlatList
                ref={ref}
                data={hours}
                snapToInterval={hourHeight}
                snapToAlignment="start"
                keyExtractor={(_, i) => String(i)}
                scrollEventThrottle={16}
                renderItem={renderItem}
                getItemLayout={getItemLayout}
                initialScrollIndex={initialIndex ? startPos + initialIndex : startPos}
                initialNumToRender={10}
                windowSize={10}
                maxToRenderPerBatch={perDay * 3}
                updateCellsBatchingPeriod={1}
                showsVerticalScrollIndicator={false}
                onScroll={onScroll}
                onMomentumScrollEnd={onMomentumScrollEnd}
                removeClippedSubviews
                className="w-full h-full"
                contentContainerStyle={{
                    paddingVertical: hourHeight,
                }}
                contentContainerClassName="w-full flex items-center"
            />

            <View
                style={{
                    height: hourHeight,
                }}
                className="absolute left-0 bottom-0 w-full z-[1] pointer-events-none"
            >
                <LinearGradient
                    colors={theme == "dark" ?
                        ["rgba(0, 0, 0, .8)", "rgba(0, 0, 0, .8)", "rgba(0, 0, 0, 0)"]
                        :
                        ["rgba(255, 255, 255, .8)", "rgba(255, 255, 255, .8)", "rgba(255, 255, 255, 0)"]
                    }
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    locations={[0, .8, 1]}
                    className="size-full"
                />
            </View>
        </View>
    );
});