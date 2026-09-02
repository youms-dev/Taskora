import { TasksDataContext } from "@/hooks/tasks/use-tasks-data";
import { useTheme } from "@/hooks/use-theme";
import { FolderType } from "@/types/folder";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, useWindowDimensions, View } from "react-native";
import { SharedValue, useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Modal } from "../modal";
import { TaskList } from "./tasks-list";
import { event, HIDE_NAVBAR, SHOW_NAVBAR } from "@/lib/event-emitter";

export const DEFAULT_FOLDER: FolderType = {
    idFolder: "all_folder",
    title: "all",
    createdAt: new Date(),
    updatedAt: new Date(),
};

interface Props {
    context: TasksDataContext;
    foldersModalActive: SharedValue<boolean>;
}

export const TasksPager = memo(({ context, foldersModalActive }: Props) => {
    const { loading, folders, currentFolder } = context;
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const loadingShared = useSharedValue<boolean>(loading);
    const pager = useRef<FlatList>(null);
    const { theme } = useTheme();
    const [active, setActive] = useState<boolean>(false);

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

    useAnimatedReaction(
        () => foldersModalActive.value,
        (next, prev) => {
            if (next != prev) {
                scheduleOnRN(setActive, next);
            }
        }
    )

    return (
        <View>
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

            <Modal
                active={active}
                height={screenHeight * .6}
                scrollableContent={false}
                rounded={20}
                onClose={() => {
                    foldersModalActive.value = false;
                    event.emit(SHOW_NAVBAR);
                }}
                dragHandlerContainerBackground={theme == "dark" ? "rgba(255, 255, 255, .1)" : "rgba(255, 255, 255, 1)"}
                dragHandlerBackground={theme == "dark" ? "rgba(255, 255, 255, .2)" : "rgba(0, 0, 0, .2)"}
                backdropBackground={theme == "dark" ? "rgba(0, 0, 0, .2)" : "rgba(0, 0, 0, .2)"}
                className="dark:bg-black bg-white"
            >
                <View className="size-full dark:bg-white/10 bg-white">

                </View>
            </Modal>
        </View>
    );
});