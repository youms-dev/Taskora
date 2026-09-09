import { TasksDataContext } from "@/hooks/tasks/use-tasks-data";
import { useTheme } from "@/hooks/use-theme";
import { event, SHOW_NAVBAR, TOUCHABLE_NAVBAR } from "@/lib/event-emitter";
import { FolderType } from "@/types/folder";
import { Entypo, FontAwesome6, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import clsx from "clsx";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, FlatList, Pressable, Text, useWindowDimensions, View } from "react-native";
import Animated, { Easing, SharedValue, useAnimatedReaction, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Modal } from "../modal";
import { PressableAnimated } from "../pressable-animated";
import { TextAnimated } from "../text-animated";
import { PositionType } from "./header";
import { TaskList } from "./tasks-list";

export const DEFAULT_FOLDER: FolderType = {
    idFolder: "all_folder",
    title: "all",
    createdAt: new Date(),
    updatedAt: new Date(),
};

export const folderContextMenuWidth = 180;

interface Props {
    context: TasksDataContext;
    foldersModalActive: SharedValue<boolean>;
    position: SharedValue<PositionType>;
}

export const TasksPager = memo(({ context, foldersModalActive, position: selectPosition }: Props) => {
    const { loading, folders, currentFolder, handleMoveTasks, folderSelected, setFolderSelected, handleDeleteFolder } = context;
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const loadingShared = useSharedValue<boolean>(loading);
    const pager = useRef<FlatList>(null);
    const { theme, themeShared } = useTheme();
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

    const contextMenuContainerAnimation = useAnimatedStyle(() => ({
        pointerEvents: selectPosition.value ? "auto" : "none",
        backgroundColor: (
            selectPosition.value ?
                themeShared.value == "dark" ? "rgba(0, 0, 0, .4)" : "rgba(0, 0, 0, .2)"
                :
                "rgba(0, 0, 0, 0)"
        )
    }));

    const contextMenuAnimation = useAnimatedStyle(() => ({
        left: selectPosition.value ?
            selectPosition.value
            :
            withDelay(
                100,
                withTiming(0),
            ),
        transform: [
            {
                translateY: 240,
            },
            {
                scale: selectPosition.value ?
                    withTiming(1, {
                        duration: 300,
                        easing: Easing.inOut(Easing.quad),
                    })
                    :
                    withTiming(0, {
                        duration: 200,
                        easing: Easing.inOut(Easing.quad),
                    }),
            },
        ],
    }));

    const handlePress = useCallback((value: "edit" | "duplicate") => {
        if (!folderSelected) return;
        router.navigate({
            pathname: "/(protected)/(folder)/create",
            params: {
                folder: JSON.stringify(folderSelected),
                action: value,
            }
        });
        handleCloseContextMenu();
    }, [folderSelected]);

    const handleCloseContextMenu = useCallback(() => {
        setFolderSelected(null);
        selectPosition.value = null;
        event.emit(TOUCHABLE_NAVBAR);

        const onBackPress = () => {
            if (selectPosition.value) {
                handleCloseContextMenu();

                return true;
            }
            return false;
        }
        const { remove } = BackHandler.addEventListener("hardwareBackPress", onBackPress);

        return () => remove();
    }, []);

    return (
        <>
            {/* Folders context menu */}

            <Animated.View
                style={[
                    contextMenuContainerAnimation,
                    {
                        height: screenHeight + (screenHeight * .2),
                        transform: [
                            {
                                translateY: -(screenHeight * .1),
                            }
                        ]
                    },
                ]}
                className="absolute left-0 top-0 w-screen z-[200]"
            >
                <Pressable
                    onPress={handleCloseContextMenu}
                    className="size-full"
                />

                <Animated.View
                    style={[
                        contextMenuAnimation,
                        {
                            width: folderContextMenuWidth,
                        }
                    ]}
                    className="absolute top-0 dark:bg-black bg-white rounded-xl z-[10]"
                >
                    <View
                        style={{
                            transform: [
                                {
                                    translateY: 8,
                                },
                            ],
                            filter: "blur(5px)",
                        }}
                        className="absolute size-full dark:bg-black/50 bg-black/30 rounded-xl"
                    />

                    <View className="size-full flex items-center gap-5 dark:bg-white/10 bg-white border-2 dark:border-white/5 border-black/5 rounded-xl px-3 py-2">
                        <PressableAnimated
                            scale={.95}
                            onPress={() => handlePress("edit")}
                            className="w-full flex flex-row items-center gap-4"
                        >
                            <View>
                                <MaterialCommunityIcons
                                    name="folder-edit"
                                    size={24}
                                    color={theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)"}
                                />
                            </View>

                            <View className="max-w-[75%]">
                                <TextAnimated className="text-lg">
                                    {t("folders_list_edit")}
                                </TextAnimated>
                            </View>
                        </PressableAnimated>

                        <PressableAnimated
                            scale={.95}
                            onPress={() => handlePress("duplicate")}
                            className="w-full flex flex-row items-center gap-5"
                        >
                            <View>
                                <Ionicons
                                    name="duplicate"
                                    size={22}
                                    color={theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)"}
                                />
                            </View>

                            <View className="max-w-[75%]">
                                <TextAnimated className="text-lg">
                                    {t("folders_list_duplicate")}
                                </TextAnimated>
                            </View>
                        </PressableAnimated>

                        <PressableAnimated
                            scale={.95}
                            onPress={() => {
                                if (folderSelected) {
                                    handleCloseContextMenu();
                                    handleDeleteFolder(true, folderSelected);
                                }
                            }}
                            className="w-full flex flex-row items-center gap-5"
                        >
                            <View>
                                <Entypo
                                    name="trash"
                                    size={22}
                                    color={theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)"}
                                />
                            </View>

                            <View className="max-w-[75%]">
                                <TextAnimated className="text-lg">
                                    {t("folders_list_delete")}
                                </TextAnimated>
                            </View>
                        </PressableAnimated>
                    </View>
                </Animated.View>
            </Animated.View>

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