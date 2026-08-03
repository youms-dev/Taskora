import { TaskType } from "@/types/task";
import { JSX, memo, useCallback } from "react";
import { NativeScrollEvent, NativeSyntheticEvent, View } from "react-native";
import { FlatList, Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedScrollHandler } from "react-native-reanimated";

const FlatListAnimated = Animated.createAnimatedComponent(FlatList);

interface Props {
    withGesture: ReturnType<typeof Gesture.Native>;
    data: TaskType[];
    renderItem: (item: TaskType) => JSX.Element;
    onScroll: ReturnType<typeof useAnimatedScrollHandler>;
    onMomentumScrollBegin?: () => void;
    onMomentumScrollEnd: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
    onEndReached: () => void;
    getItemLayout: (data?: TaskType[] | null, index?: number) => {
        length: number;
        offset: number;
        index: number;
    };
    ListEmptyComponent: () => JSX.Element | null | undefined;
    ListFooterComponent: () => JSX.Element | null | undefined;
    handleRef: (ref: FlatList | null) => void;
    loading: boolean;
    onContentSizeChange: (contentWidth: number, contentHeight: number) => void;
    gap?: number;
}

export const TaskList = memo(({
    withGesture,
    data,
    renderItem,
    onScroll,
    onMomentumScrollBegin,
    onMomentumScrollEnd,
    onEndReached,
    getItemLayout,
    ListEmptyComponent,
    ListFooterComponent,
    handleRef,
    loading,
    onContentSizeChange,
    gap,
}: Props) => {
    const handleMomentumScrollBegin = useCallback(() => onMomentumScrollBegin?.(), [onMomentumScrollBegin]);

    const handleMomentumScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => onMomentumScrollEnd(e), [onMomentumScrollEnd]);

    const handleItemLayout = useCallback((data: null, index: number) => getItemLayout(data, index), [getItemLayout]);

    const handleListEmptyComponent = useCallback(() => ListEmptyComponent(), [loading]);

    const handleListFooterComponent = useCallback(() => ListFooterComponent(), [loading]);

    const handleContentSize = useCallback((x: number, y: number) => onContentSizeChange(x, y), [onContentSizeChange]);

    return (
        <View className="w-screen flex items-center shrink-0">
            <GestureDetector gesture={withGesture}>
                <FlatListAnimated
                    ref={handleRef}
                    nestedScrollEnabled
                    horizontal={false}
                    initialNumToRender={10}
                    maxToRenderPerBatch={20}
                    windowSize={10}
                    removeClippedSubviews
                    showsVerticalScrollIndicator={false}
                    data={data}
                    keyExtractor={(item) => String((item as TaskType).idTask)}
                    renderItem={({ item }) => renderItem(item as TaskType)}
                    onEndReachedThreshold={.1}
                    scrollEventThrottle={16}
                    onScroll={onScroll}
                    onMomentumScrollBegin={handleMomentumScrollBegin}
                    onMomentumScrollEnd={handleMomentumScrollEnd}
                    onContentSizeChange={handleContentSize}
                    onEndReached={onEndReached}
                    getItemLayout={(data, index) => handleItemLayout(data as any, index)}
                    ListEmptyComponent={handleListEmptyComponent}
                    ListFooterComponent={handleListFooterComponent}
                    className="w-full"
                    contentContainerStyle={{
                        gap,
                    }}
                    contentContainerClassName="w-full flex flex-col items-center pt-[220px] pb-[100px] px-3"
                />
            </GestureDetector>
        </View>
    );
});