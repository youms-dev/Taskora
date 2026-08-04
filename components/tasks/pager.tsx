import { useTasksData } from "@/hooks/tasks/use-tasks-data";
import { useTheme } from "@/hooks/use-theme";
import { FolderType } from "@/types/folder";
import { TaskType } from "@/types/task";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { FlatList, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, SharedValue, useSharedValue } from "react-native-reanimated";
import { scrollCheckPoint } from "./header";
import { TaskList } from "./tasks-list";

export const Pager = memo(() => {
    const { refreshTranslateY, loading, folders, tasks, scrollY, extraGesture } = useTasksData();
    const flatListRef = useRef<FlatList>(null);
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

    const listRenderItem = useCallback((folder: FolderType, index: number) => {
        return (
            <TaskList />
        );
    }, [tasks, folders]);

    useEffect(() => {
        loadingShared.value = loading;
    }, [loading]);

    const e = (v: any) => console.log(v);

    const panGesture = useMemo(() =>
        Gesture.Pan()
            .simultaneousWithExternalGesture(extraGesture)
            .activeOffsetY(5)
            .failOffsetX([-50, 50])
            .onUpdate(({ translationY: y }) => {
                if (scrollY.value <= 0 && y > 0) {
                    refreshTranslateY.value = y;
                    runOnJS(e)({
                        y,
                        scroll: scrollY.value,
                    });
                }
            })
            .onEnd(() => {
                refreshTranslateY.value = 0;
                // if (scrollY.value > 0 || loadingShared.value || refreshTranslateY.value < 90) {
                //     refreshTranslateY.value = 0;
                // }
                // else if (refreshTranslateY.value >= 90) {
                //     refreshTranslateY.value = 180;
                //     // runOnJS(handleGetTasks)(true);
                // };
            })
        , [tasks, loading]);

    return (
        <GestureDetector gesture={panGesture}>
            <FlatList
                ref={flatListRef}
                horizontal
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                pagingEnabled
                decelerationRate="fast"
                initialNumToRender={1}
                maxToRenderPerBatch={1}
                removeClippedSubviews
                data={[
                    {
                        idFolder: "all_folder",
                        title: "all",
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    } as FolderType,
                    // ...folders,
                    // folders[1]
                ]}
                keyExtractor={(item) => item.idFolder}
                renderItem={({ item, index }) => listRenderItem(item, index)}
                // renderItem={({ item, index }) => <></>}
                getItemLayout={(_, index) => ({
                    length: screenWidth,
                    offset: index * screenWidth,
                    index,
                })}
                className="w-full"
                // contentContainerStyle={{
                //     height: 300,
                // }}
                contentContainerClassName="flex flex-row"
            />
        </GestureDetector>
    );

    // return (
    //     <FlatList
    //         ref={flatListRef}
    //         horizontal
    //         scrollEnabled={false}
    //         showsHorizontalScrollIndicator={false}
    //         nestedScrollEnabled
    //         pagingEnabled
    //         decelerationRate="fast"
    //         initialNumToRender={1}
    //         maxToRenderPerBatch={1}
    //         removeClippedSubviews
    //         data={[
    //             {
    //                 idFolder: "all_folder",
    //                 title: "all",
    //                 createdAt: new Date(),
    //                 updatedAt: new Date(),
    //             } as FolderType,
    //             ...folders,
    //         ]}
    //         keyExtractor={(item) => item.idFolder}
    //         renderItem={({ item, index }) => listRenderItem(item, index)}
    //         // renderItem={({ item, index }) => <></>}
    //         getItemLayout={(_, index) => ({
    //             length: screenWidth,
    //             offset: index * screenWidth,
    //             index,
    //         })}
    //         className="w-full"
    //         // contentContainerStyle={{
    //         //     height: 300,
    //         // }}
    //         contentContainerClassName="flex flex-row"
    //     />
    // );
});