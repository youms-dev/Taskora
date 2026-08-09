import { COLORS } from "@/constants/colors";
import { useTasksData } from "@/hooks/tasks/use-tasks-data";
import { useTheme } from "@/hooks/use-theme";
import { event, HIDE_NAVBAR } from "@/lib/event-emitter";
import { FolderType } from "@/types/folder";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Octicons from "@expo/vector-icons/Octicons";
import clsx from "clsx";
import { LinearGradient } from "expo-linear-gradient";
import { memo, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Animated, { Easing, Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { PageTitle } from "../page-title";
import { PressableAnimated, PressableAnimatedProps } from "../pressable-animated";
import { Skeleton } from "../skeleton";
import { TextAnimated } from "../text-animated";

interface FolderButtonProps extends PressableAnimatedProps {
    children: Array<string> | string;
    active?: boolean;
}

const FolderButton = memo(({ children, active = false, ...rest }: FolderButtonProps) => {
    const { theme } = useTheme();

    return (
        <PressableAnimated
            {...rest}
            scale={.95}
            style={{
                backgroundColor: active ?
                    (theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)")
                    :
                    (theme == "dark" ? "rgba(255, 255, 255, .2)" : "rgba(255, 255, 255, .8)")
            }}
            className="min-w-[100px] flex flex-row justify-center items-center dark:bg-white/20 bg-white/80 px-3 rounded-xl border dark:border-white/20 border-black/20"
        >
            <TextAnimated
                dark={active ? "rgba(0, 0, 0, .8)" : "rgba(255, 255, 255, .8)"}
                light={active ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                className={clsx(
                    "text-lg",
                    active && "font-bold",
                )}
            >
                {children}
            </TextAnimated>
        </PressableAnimated>
    );
});

export const scrollCheckPoint = 100;

export const TasksHeader = memo(() => {
    const { handleGetTasks, handleGetFolders, loading, tasks, folders, currentFilter, currentFolder, refreshTranslateY, setCurrentFolder, pager, setSearchSectionActive, setCurrentFilter, setTasksSelected } = useTasksData();
    const { theme, themeShared } = useTheme();
    const { t } = useTranslation();
    const foldersFlatListRef = useRef<FlatList>(null);
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const screenWidthShared = useSharedValue<number>(screenWidth);
    const filterScrollViewRef = useRef<ScrollView>(null);
    const loadingShared = useSharedValue<boolean>(loading);
    const refreshPosition = useSharedValue<number>(0);
    const foldersButtonsSizes = useRef<number[]>([]);

    // const folderDataMap = useMemo(() => {
    //     const map = new Map(
    //         folders.map(folder => [folder.idFolder, tasks.filter(t => t.idFolder == folder.idFolder)]),
    //     );

    //     return map;
    // }, [tasks, folders]);

    const onFolderPress = useCallback((folder: FolderType, index: number) => {
        if ((!currentFolder && index == 0) || (currentFolder && folder.idFolder == currentFolder)) return;
        setCurrentFolder(index == 0 ? null : folder.idFolder);
        foldersFlatListRef.current?.scrollToOffset({
            offset: index == 0 ? 0 : (index * foldersButtonsSizes.current[index]),
        });
        // setTasksSelected([]);
        // pager.current.forEach(item => {
        //     item.value.scrollToOffset({
        //         offset: 0,
        //         animated: false,
        //     });
        // });
        pager.current?.scrollToIndex({
            index,
            animated: false,
        });

        // if (contentsSize.current[index] < screenHeight) {
        //     flatListsRef.current && flatListsRef.current[index]?.value.scrollToOffset({
        //         offset: 0,
        //         animated: true,
        //     });
        // }
        // else {
        //     flatListsRef.current && flatListsRef.current[index]?.value.scrollToOffset({
        //         offset: scrollCheckPoint,
        //         animated: true,
        //     });
        // }
    }, [folders, currentFolder]);

    const foldersRenderItem = useCallback(({ item: folder, index }: { item: FolderType; index: number }) => {
        const isActive = index === 0 ? currentFolder === null : currentFolder === folder.idFolder;

        return (
            <FolderButton
                key={folder.idFolder}
                active={isActive}
                onPress={() => onFolderPress(folder, index)}
                onLayout={(e) => foldersButtonsSizes.current[index] = e.nativeEvent.layout.width}
            >
                {index == 0 ? t("tasks_all_folders") : folder.title}
            </FolderButton>
        );
    }, [folders, currentFolder, onFolderPress]);

    useEffect(() => {
        screenWidthShared.value = screenWidth;
    }, [screenWidth]);

    const refreshPanAnimation = useAnimatedStyle(() => ({
        left: refreshPosition.value,
        transform: [
            {
                translateY: interpolate(
                    refreshTranslateY.value,
                    [0, 90],
                    [185, 230],
                    Extrapolation.CLAMP,
                ),
            }
        ],
        opacity: loadingShared.value ?
            (
                refreshTranslateY.value >= 100 ?
                    withRepeat(
                        withSequence(
                            withTiming(.5, {
                                duration: 500,
                                easing: Easing.inOut(Easing.quad),
                            }),
                            withDelay(
                                500,
                                withTiming(1, {
                                    duration: 500,
                                    easing: Easing.inOut(Easing.quad),
                                }),
                            )
                        ),
                        Infinity,
                        true,
                    )
                    :
                    0
            )
            :
            refreshTranslateY.value == 0 ? 0 : 1,
    }));

    const showRefreshAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: interpolate(
                    refreshTranslateY.value,
                    [60, 100],
                    [0, 150],
                    Extrapolation.CLAMP,
                ),
            }
        ]
    }));

    useEffect(() => {
        loadingShared.value = loading;
        if (!loading) {
            refreshTranslateY.value = withTiming(0, {
                duration: 500,
                easing: Easing.inOut(Easing.quad),
            });
        }
    }, [loading]);

    const onFilterButtonPress = useCallback((value: typeof currentFilter) => {
        setCurrentFilter(value);
        setTasksSelected([]);
    }, []);

    useEffect(() => {
        filterScrollViewRef.current?.scrollTo({
            x: (currentFilter - 1) * (100 + 10),
        });
    }, [currentFilter]);

    return (
        <View className="absolute w-full z-[50]">
            <LinearGradient
                colors={theme == "dark" ?
                    ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)"]
                    :
                    ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                locations={theme == "dark" ? [0, .8, 1] : [0, .9, 1]}
                className="w-full h-full"
            >
                <LinearGradient
                    colors={theme == "dark" ?
                        ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)"]
                        :
                        ["rgba(0, 0, 0, .06)", "rgba(0, 0, 0, .06)", "rgba(255, 255, 255, .2)"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    locations={theme == "dark" ? [0, .8, 1] : [0, .9, 1]}
                    className="w-full h-full flex items-center pb-10"
                >
                    {/* Header */}

                    <View className="w-full flex items-center">
                        <PageTitle>
                            <View className="w-full flex flex-row items-center gap-2 overflow-hidden">
                                <FontAwesome6
                                    name="list-check"
                                    size={20}
                                    color={COLORS.emerald[500]}
                                />
                                <Text
                                    numberOfLines={1}
                                    className="text-2xl text-emerald-500 font-bold"
                                >
                                    {t("tasks_page_title")}
                                </Text>
                            </View>
                        </PageTitle>
                    </View>

                    {/* Fake search input */}

                    <View className="w-full flex items-center px-3">
                        <Pressable
                            onPress={() => {
                                setSearchSectionActive(true);
                                event.emit(HIDE_NAVBAR);
                            }}
                            className="w-full h-14 flex flex-row items-center mb-3 mt-2 px-2 dark:text-white/90 text-black dark:bg-white/10 bg-white/85 rounded-2xl border-b dark:border-white/20 border-black/20 pl-4 pr-12"
                        >
                            <TextAnimated className="opacity-40 text-lg">
                                {t("tasks_search")}
                            </TextAnimated>

                            <View
                                style={{
                                    transform: [
                                        {
                                            translateX: -20,
                                        },
                                        {
                                            translateY: 10,
                                        },
                                    ]
                                }}
                                className="absolute top-0 right-0 -z-[1] pointer-events-none"
                            >
                                <FontAwesome5
                                    name="search"
                                    size={24}
                                    color={theme == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .6)"}
                                />
                            </View>
                        </Pressable>
                    </View>

                    {/* Folders & filters */}

                    <View className="w-full flex items-center gap-1">
                        {/* Folders */}

                        <View className="flex items-center">
                            <View className="w-full flex flex-row items-center gap-5 px-3 py-1 overflow-hidden">
                                {
                                    loading && folders.length == 0 && (
                                        <View className="w-full">
                                            <View className="w-[70%] sm:w-[300px] h-[30px] flex flex-row items-center rounded-3xl overflow-hidden">
                                                <Skeleton />
                                            </View>
                                        </View>
                                    )
                                }

                                {
                                    (!loading || folders.length > 0) && (
                                        <>
                                            <FlatList
                                                ref={foldersFlatListRef}
                                                horizontal
                                                showsHorizontalScrollIndicator={false}
                                                nestedScrollEnabled
                                                data={[
                                                    {
                                                        idFolder: "all_folders",
                                                        title: "all",
                                                        createdAt: new Date(),
                                                        updatedAt: new Date(),
                                                    } as FolderType,
                                                    ...folders,
                                                ]}
                                                keyExtractor={(folder) => folder.idFolder}
                                                renderItem={foldersRenderItem}
                                                className="w-[90%]"
                                                contentContainerClassName="flex flex-row items-center gap-[10px] pr-[50px]"
                                            />

                                            <View className="absolute right-0 top-0 dark:bg-black bg-white z-[10]">
                                                <View className="w-full h-full flex justify-center items-center px-4 py-1 dark:bg-black bg-[rgba(0,0,0,.06)]">
                                                    <PressableAnimated>
                                                        <FontAwesome5
                                                            name="folder-plus"
                                                            size={25}
                                                            color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                                                        />
                                                    </PressableAnimated>
                                                </View>
                                            </View>
                                        </>
                                    )
                                }
                            </View>
                        </View>

                        {/* Filters */}

                        <View className="w-full flex flex-row items-center gap-3 px-3 py-1">
                            {
                                loading && tasks.length == 0 && (
                                    <View className="w-[50%] sm:w-[200px] h-[30px] flex flex-row items-center rounded-3xl overflow-hidden">
                                        <Skeleton />
                                    </View>
                                )
                            }

                            {
                                (!loading || tasks.length > 0) && (
                                    <LinearGradient
                                        colors={theme == "dark" ?
                                            ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)"]
                                            :
                                            ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                                        }
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        locations={theme == "dark" ? [.5, .7, 1] : [.5, .8, 1]}
                                        className="absolute left-0 top-0 z-[1]"
                                    >
                                        <LinearGradient
                                            colors={theme == "dark" ?
                                                ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)"]
                                                :
                                                ["rgba(0, 0, 0, .06)", "rgba(0, 0, 0, .06)", "rgba(255, 255, 255, .2)"]
                                            }
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            locations={theme == "dark" ? [.5, .7, 1] : [.5, .8, 1]}
                                            className="w-[100px] h-full flex flex-row items-center gap-2 px-3 py-1"
                                        >
                                            <TextAnimated className="text-lg">
                                                {t("tasks_filter")}
                                            </TextAnimated>

                                            <FontAwesome5
                                                name="filter"
                                                size={15}
                                                color={theme === "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .5)"}
                                            />
                                        </LinearGradient>
                                    </LinearGradient>
                                )
                            }

                            {
                                (!loading || tasks.length > 0) && (
                                    <ScrollView
                                        ref={filterScrollViewRef}
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        nestedScrollEnabled
                                        className="w-full"
                                        contentContainerClassName="flex flex-row items-center gap-[10px] pl-[85px] pr-[30px]"
                                    >
                                        {
                                            [
                                                t("tasks_filter_all"),
                                                t("tasks_filter_done"),
                                                t("tasks_filter_not_done"),
                                            ].map((item, i) => (
                                                <PressableAnimated
                                                    key={i}
                                                    scale={.95}
                                                    onPress={() => currentFilter != (i + 1) && onFilterButtonPress((i + 1) as 1 | 2 | 3)}
                                                    style={{
                                                        backgroundColor: currentFilter == (i + 1) ?
                                                            (theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)")
                                                            :
                                                            (theme == "dark" ? "rgba(255, 255, 255, .2)" : "rgba(255, 255, 255, .8)")
                                                    }}
                                                    className="w-[100px] flex flex-row justify-center items-center px-3 rounded-xl border dark:border-white/20 border-black/20"
                                                >
                                                    <TextAnimated
                                                        dark={currentFilter == (i + 1) ? "rgba(0, 0, 0, .8)" : "rgba(255, 255, 255, .8)"}
                                                        light={currentFilter == (i + 1) ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                                                        className={clsx(
                                                            "text-lg",
                                                            currentFilter == i + 1 && "font-bold",
                                                        )}
                                                    >
                                                        {item}
                                                    </TextAnimated>
                                                </PressableAnimated>
                                            ))
                                        }
                                    </ScrollView>
                                )
                            }

                            <LinearGradient
                                colors={theme == "dark" ?
                                    ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .5)", "rgba(0, 0, 0, 0)"]
                                    :
                                    ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, .8)", "rgba(255, 255, 255, 0)"]
                                }
                                start={{ x: 1, y: 0 }}
                                end={{ x: 0, y: 0 }}
                                locations={[.5, .6, 1]}
                                className="absolute right-0 h-full z-[1]"
                            >
                                <LinearGradient
                                    colors={theme == "dark" ?
                                        ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .5)", "rgba(0, 0, 0, 0)"]
                                        :
                                        ["rgba(0, 0, 0, .06)", "rgba(0, 0, 0, .06)", "rgba(0, 0, 0, 0)"]
                                    }
                                    start={{ x: 1, y: 0 }}
                                    end={{ x: 0, y: 0 }}
                                    locations={[.5, .6, 1]}
                                    className="w-[50px] h-full"
                                />
                            </LinearGradient>
                        </View>
                    </View>
                </LinearGradient>
            </LinearGradient>

            {/* Refresh */}

            <Animated.View
                onLayout={(e) => refreshPosition.value = (screenWidth / 2) - (e.nativeEvent.layout.width / 2)}
                style={refreshPanAnimation}
                className="absolute size-[50px] z-[100] rounded-full pointer-events-none dark:bg-black bg-white"
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
                    className="absolute size-full rounded-full bg-black/30"
                />

                <View className="size-full flex justify-center items-center rounded-full dark:bg-white/10 bg-white border dark:border-white/10 border-black/20">
                    <Octicons
                        name="tasklist"
                        size={25}
                        color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                    />
                </View>

                <View className="absolute size-full flex justify-center items-center z-[1] rounded-full overflow-hidden">
                    <Animated.View
                        style={showRefreshAnimation}
                        className="absolute size-full flex justify-center items-center rounded-full dark:bg-black bg-white"
                    >
                        <View className="size-full dark:bg-white/20 bg-black/80 rounded-full" />
                    </Animated.View>
                </View>
            </Animated.View>
        </View>
    );
});