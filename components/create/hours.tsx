import { memo, useCallback, useMemo, useRef } from "react";
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, View } from "react-native";
import { TextAnimated } from "../text-animated";

export const HOURS_LIST_HEIGHT = 250;

export const HOUR_HEIGHT = HOURS_LIST_HEIGHT / 3;

export const FlatListHours = memo(() => {
    const ref = useRef<FlatList>(null);
    const perDay = 24;
    const repeat = 1;
    const currentIndex = useRef<number>(Math.ceil((repeat * perDay) / 2) - 1);

    const hours = useMemo(() => {
        return Array(repeat).fill(0).map(() => {
            return Array(perDay).fill(0).map((_, i) => i);
        }).join(",").split(",");
    }, []);

    const renderItem = useCallback(({ item: hour, index }: { item: string; index: number }) => {
        return (
            <View
                style={{
                    height: HOUR_HEIGHT
                }}
                className="w-full flex justify-center items-center"
            >
                <TextAnimated className="text-5xl font-bold text-white">
                    {hour.padStart(2, "0")}
                </TextAnimated>
            </View>
        );
    }, []);

    const getItemLayout = useCallback((data: unknown, index: number) => ({
        length: HOUR_HEIGHT,
        offset: index * HOUR_HEIGHT,
        index,
    }), []);

    const onMomentumScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const y = e.nativeEvent.contentOffset.y;
        const index = Math.round(y / HOUR_HEIGHT);

        // console.log("Last index :", currentIndex.current);
        console.log("Current index :", index);
        // currentIndex.current = index + 1;
    }, []);

    return (
        <View className="w-full h-full">
            <View
                style={{
                    height: HOUR_HEIGHT,
                }}
                className="absolute left-0 top-0 w-full bg-black/50"
            />

            <FlatList
                ref={ref}
                data={hours}
                snapToInterval={HOUR_HEIGHT}
                keyExtractor={(_, i) => String(i)}
                scrollEventThrottle={1}
                renderItem={renderItem}
                getItemLayout={getItemLayout}
                initialScrollIndex={Math.ceil(((repeat * perDay) / 2) - 1)}
                initialNumToRender={10}
                windowSize={10}
                maxToRenderPerBatch={perDay * 3}
                updateCellsBatchingPeriod={1}
                onMomentumScrollEnd={onMomentumScrollEnd}
                removeClippedSubviews
                className="w-full h-full"
                contentContainerClassName="w-full flex items-center"
            />
        </View>
    );
});