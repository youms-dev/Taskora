import { TasksDataContext } from "@/hooks/tasks/use-tasks-data";
import { useTheme } from "@/hooks/use-theme";
import { event, SHOW_NAVBAR } from "@/lib/event-emitter";
import { FolderType } from "@/types/folder";
import { FontAwesome6 } from "@expo/vector-icons";
import clsx from "clsx";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, Text, useWindowDimensions, View } from "react-native";
import { SharedValue, useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Modal } from "../modal";
import { PressableAnimated } from "../pressable-animated";
import { TaskList } from "./tasks-list";

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
    const { loading, folders, currentFolder, handleMoveTasks } = context;
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const loadingShared = useSharedValue<boolean>(loading);
    const pager = useRef<FlatList>(null);
    const { theme } = useTheme();
    const [active, setActive] = useState<boolean>(false);
    const folderHeight = 40;
    const foldersGap = 15;
    const { t, i18n } = useTranslation();
    const router = useRouter();

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

    const pagerRenderItem = useCallback(({ item: folder, index }: { item: FolderType, index: number }) => {
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

    const foldersRenderItem = useCallback(({ item: folder, index }: { item: FolderType; index: number }) => {
        return (
            <Pressable
                onPress={() => {
                    handleClose();
                    handleMoveTasks(index == 0 ? null : folder.idFolder);
                }}
                style={{
                    height: folderHeight,
                }}
                className="w-full flex flex-row items-center px-3"
            >
                <View className={clsx(
                    index == 0 && "px-3 dark:bg-white/10 bg-black/80 rounded-xl border dark:border-white/5 border-black/5",
                )}>
                    <Text className={clsx(
                        "text-lg tracking-widest",
                        index == 0 ? "text-white/80" : "dark:text-white/80 text-black/80",
                    )}>
                        {index == 0 ?
                            i18n.language == "en" ? "Default" : "Par défaut"
                            :
                            folder.title
                        }
                    </Text>
                </View>
            </Pressable>
        );
    }, [i18n.language, handleMoveTasks]);

    const getFolderLayout = useCallback((_data: ArrayLike<FolderType> | null | undefined, index: number) => ({
        length: folderHeight + foldersGap,
        offset: index * (folderHeight + foldersGap),
        index,
    }), []);

    const handleClose = useCallback(() => {
        foldersModalActive.value = false;
        event.emit(SHOW_NAVBAR);
    }, []);

    return (
        <>
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
                updateCellsBatchingPeriod={0}
                scrollEventThrottle={16}
                removeClippedSubviews={false}
                data={displayedFolders}
                keyExtractor={(item) => item.idFolder}
                renderItem={pagerRenderItem}
                getItemLayout={getItemLayout}
                className="w-full"
                contentContainerClassName="flex flex-row"
            />

            <Modal
                active={active}
                height={screenHeight * .6}
                scrollableContent={false}
                rounded={20}
                onClose={handleClose}
                dragHandler={false}
                closable={false}
                backdropBackground="rgba(0, 0, 0, .4)"
                animationDuration={500}
                closeAnimationDuration={600}
                className="dark:bg-black bg-white"
            >
                <View className="absolute left-0 top-0 w-full h-[50px] z-[5]">
                    <LinearGradient
                        colors={
                            theme == "dark" ?
                                ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)"]
                                :
                                ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        locations={[0, .4, 1]}
                        className="size-full"
                    >
                        <LinearGradient
                            colors={
                                theme == "dark" ?
                                    ["rgba(255, 255, 255, .1)", "rgba(255, 255, 255, .1)", "rgba(255, 255, 255, 0)"]
                                    :
                                    ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            locations={[0, .4, 1]}
                            className="size-full"
                        />
                    </LinearGradient>
                </View>

                <View
                    style={{
                        transform: [
                            {
                                translateX: -10,
                            },
                            {
                                translateY: 5,
                            },
                        ],
                    }}
                    className="absolute right-0 top-0 z-[10]"
                >
                    <View
                        style={{
                            transform: [
                                {
                                    translateY: 8,
                                }
                            ],
                            filter: "blur(5px)",
                        }}
                        className="absolute size-full dark:bg-black/50 bg-black/30 rounded-full"
                    />

                    <PressableAnimated
                        scale={.95}
                        onPress={() => handleClose()}
                        className="size-[45px] flex justify-center items-center dark:bg-black bg-white rounded-full"
                    >
                        <FontAwesome6
                            name="xmark"
                            size={25}
                            color={theme == "dark" ? "white" : "black"}
                        />
                    </PressableAnimated>
                </View>

                <View className="size-full dark:bg-white/10 bg-white">
                    <FlatList
                        horizontal={false}
                        showsVerticalScrollIndicator={false}
                        data={displayedFolders}
                        keyExtractor={(item) => item.idFolder}
                        scrollEventThrottle={16}
                        updateCellsBatchingPeriod={0}
                        initialNumToRender={10}
                        maxToRenderPerBatch={10}
                        renderItem={foldersRenderItem}
                        getItemLayout={getFolderLayout}
                        className="w-full h-full"
                        contentContainerStyle={{
                            gap: foldersGap,
                        }}
                        contentContainerClassName="w-full flex px-3 pt-[60px] pb-[140px]"
                    />
                </View>

                <View
                    style={{
                        transform: [
                            {
                                translateY: -35,
                            },
                        ],
                    }}
                    className="absolute left-0 bottom-0 w-full h-[100px] z-[5]"
                >
                    <LinearGradient
                        colors={
                            theme == "dark" ?
                                ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)"]
                                :
                                ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                        }
                        start={{ x: 0, y: 1 }}
                        end={{ x: 0, y: 0 }}
                        locations={[0, .3, 1]}
                        className="size-full"
                    >
                        <LinearGradient
                            colors={
                                theme == "dark" ?
                                    ["rgba(255, 255, 255, .1)", "rgba(255, 255, 255, .1)", "rgba(255, 255, 255, 0)"]
                                    :
                                    ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                            }
                            start={{ x: 0, y: 1 }}
                            end={{ x: 0, y: 0 }}
                            locations={[0, .3, 1]}
                            className="size-full flex flex-row justify-center pt-5"
                        >
                            <PressableAnimated
                                scale={.95}
                                onPress={() => {
                                    router.navigate({
                                        pathname: "/(protected)/(folder)/create",
                                    });
                                    handleClose();
                                }}
                                className="w-[200px] h-[45px] rounded-xl"
                            >
                                <View
                                    style={{
                                        transform: [
                                            {
                                                translateY: 8,
                                            }
                                        ],
                                        filter: "blur(5px)",
                                    }}
                                    className="absolute size-full dark:bg-black/50 bg-black/40 rounded-2xl"
                                />

                                <View className="size-full flex flex-row justify-center items-center bg-black rounded-2xl">
                                    <Text className="text-xl font-bold text-white/80 text-center">
                                        {t("tasks_add_folder")}
                                    </Text>
                                </View>
                            </PressableAnimated>
                        </LinearGradient>
                    </LinearGradient>
                </View>
            </Modal>
        </>
    );
});