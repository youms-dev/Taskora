import { useTasksData } from "@/hooks/tasks/use-tasks-data";
import { FolderType } from "@/types/folder";
import { memo, useCallback, useEffect, useMemo } from "react";
import { FlatList, useWindowDimensions } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { TaskList } from "./tasks-list";

export const TasksPager = memo(() => {
    const { loading, folders, pager } = useTasksData();
    const { width: screenWidth } = useWindowDimensions();
    const loadingShared = useSharedValue<boolean>(loading);
    const displayedFolders = useMemo(() => [
        {
            idFolder: "all_folder",
            title: "all",
            createdAt: new Date(),
            updatedAt: new Date(),
        } as FolderType,
        ...folders,
    ], [folders]);

    const listRenderItem = useCallback(({ item: folder, index }: { item: FolderType, index: number }) => {
        return (
            <TaskList
                folder={folder}
                index={index}
            />
        );
    }, [folders]);

    useEffect(() => {
        loadingShared.value = loading;
    }, [loading]);

    const getItemLayout = useCallback((data: any, index: number) => ({
        length: screenWidth,
        offset: index * screenWidth,
        index,
    }), [screenWidth]);

    return (
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
            removeClippedSubviews={false}
            data={displayedFolders}
            keyExtractor={(item) => item.idFolder}
            renderItem={listRenderItem}
            getItemLayout={getItemLayout}
            className="w-full"
            contentContainerClassName="flex flex-row"
        />
    );
});