import { INITIAL_RANGE, useHorizontalCalendar } from "@/hooks/use-calendar";
import { useCallback, useRef } from "react";
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, useWindowDimensions } from "react-native";
import { CalendarMonth } from "./calendar-month";

export const Calendar = () => {
    const flatListRef = useRef<FlatList<Date>>(null);
    const { months, appendFutureMonths, prependPastMonths } = useHorizontalCalendar();
    const { width } = useWindowDimensions();

    const renderItem = useCallback(({ item }: { item: Date }) => (
        <CalendarMonth month={item} />
    ), []);

    const handleMomentumScrollEnd = (
        event: NativeSyntheticEvent<NativeScrollEvent>
    ) => {
        const offsetX = event.nativeEvent.contentOffset.x;

        const index = Math.round(
            offsetX / width,
        );

        // futur
        if (index > months.length - 10) {
            appendFutureMonths();
        }

        // passé
        if (index < 10) {
            prependPastMonths();

            requestAnimationFrame(() => {
                flatListRef.current?.scrollToOffset({
                    offset:
                        offsetX + width * 20,
                    animated: false,
                });
            });
        }
    };

    return (
        <FlatList
            ref={flatListRef}
            data={months}
            horizontal
            pagingEnabled
            renderItem={renderItem}
            keyExtractor={(item) => item.toISOString()}
            showsHorizontalScrollIndicator={false}
            getItemLayout={(_, index) => ({
                length: width,
                offset: width * index,
                index,
            })}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            windowSize={5}
            initialNumToRender={3}
            maxToRenderPerBatch={3}
            initialScrollIndex={INITIAL_RANGE}
        />
    );
};