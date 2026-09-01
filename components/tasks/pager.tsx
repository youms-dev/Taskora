import { TasksDataContext } from "@/hooks/tasks/use-tasks-data";
import { FolderType } from "@/types/folder";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { FlatList, useWindowDimensions } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { TaskList } from "./tasks-list";

export const DEFAULT_FOLDER: FolderType = {
    idFolder: "all_folder",
    title: "all",
    createdAt: new Date(),
    updatedAt: new Date(),
};

interface Props {
    context: TasksDataContext;
}

export const TasksPager = memo(({ context }: Props) => {
    const { loading, folders, currentFolder } = context;
    const { width: screenWidth } = useWindowDimensions();
    const loadingShared = useSharedValue<boolean>(loading);
    const pager = useRef<FlatList>(null);

    const displayedFolders = useMemo(() => [
        DEFAULT_FOLDER,
        ...folders,
    ], [folders]);

    const foldersMap = useMemo(() => {
        return (
            new Map(
                [
                    DEFAULT_FOLDER,
                    ...folders,
                ].map((f, i) => [f.idFolder, {
                    index: i,
                    data: f,
                }])
            )
        );
    }, [folders]);

    const renderItem = useCallback(({ item: folder, index }: { item: FolderType, index: number }) => {
        return (
            <TaskList
                folder={folder}
                index={index}
                context={context}
            />
        );
    }, [context]);

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
    }, [currentFolder, foldersMap, scrollToFolder]);

    // return null;

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
            renderItem={renderItem}
            getItemLayout={getItemLayout}
            className="w-full"
            contentContainerClassName="flex flex-row"
        />
    );
});