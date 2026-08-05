import { useTasksData } from "@/hooks/tasks/use-tasks-data";
import { FolderType } from "@/types/folder";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { FlatList, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS, useSharedValue } from "react-native-reanimated";
import { scrollCheckPoint } from "./header";
import { TaskList } from "./tasks-list";

export const Pager = memo(() => {
    const { refreshTranslateY, loading, folders, tasks, scrollY, extraGesture, scrolling, currentFilter, currentFolder, pager } = useTasksData();
    const { width: screenWidth } = useWindowDimensions();
    const flatListsRef = useRef<{
        id: string;
        value: FlatList;
    }[]>([]);
    const contentsSize = useRef<number[]>([]);
    const loadingShared = useSharedValue<boolean>(loading);
    const scrollTimeout = useRef<ReturnType<typeof setTimeout>>(null);

    const checkScroll = useCallback((index: number = 0, y: number) => {
        scrollTimeout.current && clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => {
            if (y >= (scrollCheckPoint * .3) && y <= scrollCheckPoint + 50) flatListsRef.current[index]?.value.scrollToOffset({
                offset: scrollCheckPoint + 50,
                animated: true,
            });
            else if (y < (scrollCheckPoint * .3)) flatListsRef.current[index]?.value.scrollToOffset({
                offset: 0,
                animated: true,
            });
        }, 100);
    }, [folders, tasks]);

    const listRenderItem = useCallback(({ item: folder, index }: { item: FolderType, index: number }) => {
        return (
            <TaskList />
        );
    }, [tasks, folders, currentFolder]);

    useEffect(() => {
        loadingShared.value = loading;
    }, [loading]);

    const e = (v: any) => console.log(v);

    const panGesture = useMemo(() => {
        return (
            Gesture.Pan()
                .simultaneousWithExternalGesture(extraGesture)
                .activeOffsetY(5)
                .failOffsetX([-50, 50])
                .onUpdate(({ translationY: y }) => {
                    // runOnJS(e)(scrolling.value);
                    if (scrollY.value <= 0 && y > 0 && !scrolling.value) {
                        refreshTranslateY.value = y;
                    }
                })
                .onEnd(() => {
                    // if (scrollY.value > 0 || loadingShared.value || refreshTranslateY.value < 90) {
                    if (scrollY.value > 0 || refreshTranslateY.value < 90) {
                        refreshTranslateY.value = 0;
                    }
                    else if (refreshTranslateY.value >= 90) {
                        // refreshTranslateY.value = withTiming(180, {
                        //     duration: 300,
                        //     easing: Easing.inOut(Easing.quad),
                        // });
                        refreshTranslateY.value = 0;
                        // runOnJS(handleGetTasks)(true);
                        runOnJS(e)({
                            tasks,
                            currentFilter,
                            currentFolder,
                        });
                    };
                })
        );
    }, [tasks, currentFolder]);

    return (
        <GestureDetector gesture={panGesture}>
            <FlatList
                ref={pager}
                horizontal
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                pagingEnabled
                decelerationRate="fast"
                initialNumToRender={3}
                maxToRenderPerBatch={folders.length / 2}
                removeClippedSubviews
                data={[
                    {
                        idFolder: "all_folder",
                        title: "all",
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    } as FolderType,
                    ...folders,
                ]}
                keyExtractor={(item) => item.idFolder}
                renderItem={listRenderItem}
                // renderItem={({ item, index }) => <></>}
                getItemLayout={(_, index) => ({
                    length: screenWidth,
                    offset: index * screenWidth,
                    index,
                })}
                className="w-full"
                contentContainerClassName="flex flex-row"
            />
        </GestureDetector>
    );
});