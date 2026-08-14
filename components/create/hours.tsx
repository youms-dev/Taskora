import { memo, useCallback, useMemo, useRef } from "react";
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, View } from "react-native";
import { TextAnimated } from "../text-animated";

export const HOUR_HEIGHT = 70;

export const FlatListHours = memo(() => {
    const ref = useRef<FlatList>(null);
    const perDay = 24;
    const repeat = perDay * 10;
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
                <TextAnimated className="text-5xl font-bold">
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

        console.log("Last index :", currentIndex.current);
        console.log("Current index :", index);
        console.log("Tab index :", String(hours[index + 1]).padStart(2, "0"));

        if (index >= currentIndex.current) {
            console.log("bottom");

            ref.current?.scrollToOffset({
                offset: y + (HOUR_HEIGHT / 4),
                animated: false,
            });
        }
        else if (index < currentIndex.current) {
            console.log("top");

            ref.current?.scrollToOffset({
                offset: y - (HOUR_HEIGHT / 4),
                animated: false,
            });
        }

        currentIndex.current = index + 1;
    }, []);

    return (
        <View className="w-full h-full">
            <FlatList
                ref={ref}
                data={hours}
                keyExtractor={(_, i) => String(i)}
                scrollEventThrottle={16}
                renderItem={renderItem}
                getItemLayout={getItemLayout}
                initialScrollIndex={Math.ceil(((repeat * perDay) / 2) - 1)}
                initialNumToRender={perDay * 3}
                // windowSize={Math.ceil(hours.length / (HOUR_HEIGHT * 3))}
                // windowSize={Math.ceil(hours.length / (HOUR_HEIGHT * 3))}
                windowSize={Math.ceil(hours.length)}
                // maxToRenderPerBatch={perDay * 2}
                maxToRenderPerBatch={5}
                updateCellsBatchingPeriod={1}
                // onMomentumScrollEnd={onMomentumScrollEnd}
                removeClippedSubviews={false}
                className="w-full h-full"
                contentContainerStyle={{
                    // gap: HOURS_GAP,
                }}
                contentContainerClassName="w-full flex items-center"
            />
        </View>
    );
});