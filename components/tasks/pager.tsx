import { useTheme } from "@/hooks/use-theme";
import { FolderType } from "@/types/folder";
import { TaskType } from "@/types/task";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Octicons from "@expo/vector-icons/Octicons";
import { useCallback, useMemo, useRef, useState } from "react";
import { FlatList, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, Extrapolation, interpolate, runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { Skeleton } from "../skeleton";
import { TextAnimated } from "../text-animated";
import { scrollCheckPoint } from "./header";
import { TaskCard } from "./task-card";
import { TaskList } from "./tasks-list";

export const Pager = () => {
    const flatListRef = useRef<FlatList>(null);
    const otherElement = Gesture.Native();
    const { width: screenWidth } = useWindowDimensions();
    const flatListsRef = useRef<{
        id: string;
        value: FlatList;
    }[]>([]);
    const contentsSize = useRef<number[]>([]);
    const tasksGap = 20;
    const [left, setLeft] = useState<number>(0);
    const { theme } = useTheme();
    const translateY = useSharedValue<number>(0);
    const taskHeight = 100;

    const panGesture = useMemo(() => Gesture.Pan()
        .simultaneousWithExternalGesture(otherElement)
        .activeOffsetY(50)
        .failOffsetX([-10, 10])
        .onUpdate(({ translationY: y }) => {
            if (scrollYShared.value == 0 && !quietProcessing.value) {
                translateY.value = y;
            }
        })
        .onEnd(() => {
            if (scrollYShared.value > 0 || quietProcessing.value || translateY.value < 90) {
                translateY.value = 0;
            }
            else if (translateY.value >= 90) {
                translateY.value = 180;
                runOnJS(handleGetTasks)(true);
            }
        }), []);

    const setScrollYValue = (value: number) => setScrollY(value);

    const handleScroll = useAnimatedScrollHandler({
        onScroll: (e) => {
            const y = e.contentOffset.y;

            if (y >= 0 && y <= scrollYShared.value) {
                showAddTaskButton.value = true;
            }
            else {
                showAddTaskButton.value = false;
            }

            if (y > 0 && y < scrollYShared.value) {
                runOnJS(toggleShowScrollButton)();
            }
            else {
                showScrollButton.value = false;
            }
            scrollYShared.value = y;
            runOnJS(setScrollYValue)(y);
        }
    });

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

    const renderItem = useCallback((task: TaskType) => (
        <TaskCard
            height={taskHeight}
            loading={isBlocked}
            task={task}
            selection={selectMap.size > 0}
            selectedIndex={selectMap.get(task.idTask) ?? 0}
            onPress={handleTaskPress}
            onRefresh={handleRefresh}
            onLongPress={handleLongPress}
            onDelete={handleDeleteTask}
            onArchive={handleArchiveTask}
        />
    ), [selectMap, handleRefresh, handleLongPress, handleDeleteTask, handleArchiveTask, handleTaskPress, isBlocked]);

    const listRenderItem = useCallback((folder: FolderType, index: number) => {
        return (
            <TaskList
                key={folder.idFolder}
                handleRef={(ref) => {
                    if (ref) {
                        flatListsRef.current[index] = {
                            id: folder.idFolder,
                            value: ref as FlatList,
                        }
                    }
                }}
                loading={loading || processing}
                withGesture={otherElement}
                data={index == 0 ? tasks : (folderDataMap.get(folder.idFolder) ?? [])}
                renderItem={renderItem}
                onScroll={handleScroll}
                onMomentumScrollEnd={(e) => {
                    const y = e.nativeEvent.contentOffset.y;

                    checkScroll(index, y);
                }}
                onEndReached={() => index == 0 && handleEndReached()}
                onContentSizeChange={(_, y) => contentsSize.current[index] = y}
                getItemLayout={(_, index?: number) => ({
                    length: (taskHeight + tasksGap),
                    offset: (index ?? 0) * (taskHeight + tasksGap),
                    index: (index ?? 0),
                })}
                ListEmptyComponent={() => {
                    if (!loading) {
                        return (
                            <View className="w-screen flex justify-center items-center gap-4 pt-10">
                                <MaterialIcons
                                    name="playlist-remove"
                                    size={120}
                                    color={theme == "dark" ? "rgba(255, 255, 255, .2)" : "rgba(0, 0, 0, .2)"}
                                />
                                <TextAnimated
                                    dark="rgba(255, 255, 255, .5)"
                                    light="rgba(0, 0, 0, .5)"
                                    className="font-bold text-lg tracking-wider"
                                >
                                    {value.trim().length > 0 ? t("tasks_search_tasks_empty") : t("tasks_no_tasks")}
                                </TextAnimated>
                            </View>
                        );
                    }
                }}
                ListFooterComponent={() => {
                    if (loading) return (
                        <View className="w-screen flex gap-6 px-3 overflow-hidden pt-5">
                            {
                                Array(3).fill(0).map((_, i) => (
                                    <View
                                        key={i}
                                        className="w-full h-[100px] rounded-2xl overflow-hidden"
                                    >
                                        <Skeleton />
                                    </View>
                                ))
                            }
                        </View>
                    );
                }}
                gap={tasksGap}
            />
        );
    }, [tasks, selectMap, loading, processing, checkScroll, folderDataMap]);

    const toggleShowScrollButton = () => {
        showButtonTimeout.current && clearTimeout(showButtonTimeout.current);
        showScrollButton.value = true;
        showButtonTimeout.current = setTimeout(() => {
            showScrollButton.value = false;
        }, 500);
    }

    const refreshPanAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: interpolate(
                    translateY.value,
                    [0, 90],
                    [160, 230],
                    Extrapolation.CLAMP,
                ),
            }
        ],
        opacity: quietProcessing.value && translateY.value >= 90 ? withRepeat(
            withSequence(
                withTiming(.5, {
                    duration: 1000,
                    easing: Easing.inOut(Easing.quad),
                }),
                withDelay(
                    300,
                    withTiming(1, {
                        duration: 1000,
                        easing: Easing.inOut(Easing.quad),
                    }),
                )
            ),
            Infinity,
            true,
        )
            :
            translateY.value == 0 ? 0 : 1,
    }));

    const showRefreshAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: interpolate(
                    translateY.value,
                    [60, 100],
                    [0, 150],
                    Extrapolation.CLAMP,
                ),
            }
        ]
    }));

    return (
        <View>
            <Animated.View
                onLayout={(e) => setLeft((screenWidth / 2) - (e.nativeEvent.layout.width / 2))}
                style={[
                    refreshPanAnimation,
                    {
                        left,
                    }
                ]}
                className="absolute z-[100] rounded-full overflow-hidden pointer-events-none dark:bg-white bg-black"
            >
                <View className="size-full flex justify-center items-center rounded-full dark:bg-black/80 bg-white p-4">
                    <Octicons
                        name="tasklist"
                        size={25}
                        color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                    />
                </View>

                <Animated.View
                    style={showRefreshAnimation}
                    className="absolute size-full flex justify-center items-center z-[1] rounded-full overflow-hidden dark:bg-white bg-black"
                >
                    <View className="size-full dark:bg-black/90 bg-white/80" />
                </Animated.View>
            </Animated.View>

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
                        ...folders,
                    ]}
                    keyExtractor={(item) => item.idFolder}
                    renderItem={({ item, index }) => listRenderItem(item, index)}
                    getItemLayout={(_, index) => ({
                        length: screenWidth,
                        offset: index * screenWidth,
                        index,
                    })}
                    className="w-full"
                    contentContainerClassName="flex flex-row"
                />
            </GestureDetector>
        </View>
    );
}