import { useTasksData } from "@/hooks/tasks/use-tasks-data";
import { FolderType } from "@/types/folder";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { FlatList, useWindowDimensions } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { TaskList } from "./tasks-list";

export const TasksPager = memo(() => {
    const { loading, folders, currentFolder } = useTasksData();
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
    const pager = useRef<FlatList>(null);
    const foldersMap = useMemo(() => {
        return (
            new Map(
                folders.map((f, i) => [f.idFolder, {
                    index: i + 1,
                    data: f,
                }])
            )
        );
    }, [folders]);

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

    const scrollToFolder = useCallback((index: number) => {
        pager.current?.scrollToIndex({
            index,
            animated: false,
        });
    }, []);

    useEffect(() => {
        const index = !currentFolder ? 0 : foldersMap.get(currentFolder)?.index ?? 0;

        scrollToFolder(index);
    }, [currentFolder, foldersMap]);

    return (
        <FlatList
            ref={pager}
            horizontal
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            pagingEnabled
            decelerationRate="fast"
            initialNumToRender={1}
            maxToRenderPerBatch={1}
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