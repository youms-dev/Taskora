import { LIMIT, useTasksData } from "@/hooks/tasks/use-tasks-data";
import { useTheme } from "@/hooks/use-theme";
import { FolderType } from "@/types/folder";
import { TaskType } from "@/types/task";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, FadeIn, FadeInUp, FadeOutUp, runOnJS, useAnimatedScrollHandler, useSharedValue, withTiming } from "react-native-reanimated";
import { Skeleton } from "../skeleton";
import { TextAnimated } from "../text-animated";
import { TaskCard } from "./task-card";

interface Props {
    folder: FolderType;
    index: number;
}

export const TaskList = memo(({ folder, index: folderIndex }: Props) => {
    const { t, i18n } = useTranslation();
    const { theme } = useTheme();
    const taskHeight = 100;
    const tasksGap = 20;
    const { loading, scrollY, tasks, refreshTranslateY, scrolling, currentFolder, handleGetTasks, tasksSelected, tasksCount, currentFilter } = useTasksData();
    const nativeGesture = useMemo(() => Gesture.Native(), []);
    const [mounted, setMounted] = useState<boolean>(false);
    const areTasksSelected = useSharedValue<boolean>(false);
    const loadingShared = useSharedValue<boolean>(false);
    const filtering = useSharedValue<boolean>(false);

    const selectMap = useMemo(() => {
        return new Map(
            tasksSelected.map(t => [t.idTask, t])
        )
    }, [tasksSelected]);

    const folderTasks = useMemo(() => {
        if (folderIndex == 0) return tasks;
        return tasks.filter((t) => t.idFolder == folder.idFolder);
    }, [tasks, folder, folderIndex]);

    const renderItem = useCallback(({ item: task, index }: { item: unknown; index: number }) => (
        <Animated.View
            entering={FadeInUp
                .delay(index * 100)
                .springify()
                .stiffness(100)
                .damping(5)
                .mass(1)
            }
            exiting={FadeOutUp
                .duration(500)
                .easing(Easing.inOut(Easing.quad))
            }
            className="w-full"
        >
            <TaskCard task={task as TaskType} />
        </Animated.View>
    ), []);

    const handleScroll = useAnimatedScrollHandler({
        onScroll: (e) => {
            const y = e.contentOffset.y;

            scrollY.value = y;

            if (!scrolling.value) {
                scrolling.value = true;
            }
        }
    });

    const panGesture = useMemo(() => {
        return (
            Gesture.Pan()
                .activeOffsetY([-5, 5])
                .failOffsetX([-10, 10])
                .onUpdate(({ translationY: y }) => {
                    if (scrollY.value <= 0 && y > 0 && !scrolling.value && !areTasksSelected.value && !loadingShared.value && !filtering.value) {
                        refreshTranslateY.value = y;
                    }
                })
                .onEnd(() => {
                    if (scrollY.value > 0 || refreshTranslateY.value < 90 || loadingShared.value || filtering.value) {
                        refreshTranslateY.value = withTiming(0, {
                            duration: 200,
                            easing: Easing.inOut(Easing.quad),
                        });
                    }
                    else if (refreshTranslateY.value >= 90) {
                        refreshTranslateY.value = withTiming(180, {
                            duration: 300,
                            easing: Easing.inOut(Easing.quad),
                        });
                        runOnJS(handleGetTasks)(true);
                    };
                })
        );
    }, []);

    const gesture = useMemo(() => Gesture.Simultaneous(nativeGesture, panGesture), []);


    useEffect(() => {
        areTasksSelected.value = selectMap.size > 0;
    }, [selectMap]);

    useEffect(() => {
        loadingShared.value = loading;
    }, [loading]);

    const listFooterComponent = useCallback(() => {
        if (loading && selectMap.size == 0) {
            return (
                <View
                    style={{
                        gap: tasksGap,
                    }}
                    className="w-screen flex items-center px-3"
                >
                    {
                        Array(3).fill(0).map((_, i) => (
                            <Animated.View
                                key={i}
                                entering={FadeIn
                                    .delay(i * 100)
                                    .duration(300)
                                    .easing(Easing.inOut(Easing.quad))
                                }
                                style={{
                                    height: taskHeight
                                }}
                                className="w-full rounded-2xl overflow-hidden"
                            >
                                <Skeleton delay={i * 200} />
                            </Animated.View>
                        ))
                    }
                </View>
            );
        }
        return null;
    }, [loading, selectMap]);

    const listEmptyComponent = useCallback(() => {
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
                        {t("tasks_no_tasks")}
                    </TextAnimated>
                </View>
            );
        }
        return null;
    }, [loading, i18n.language, theme]);

    const onEndReached = useCallback(() => {
        if (loading || tasks.length >= tasksCount || selectMap.size > 0 || currentFilter != 1 || folderIndex != 0) return;
        handleGetTasks();
    }, [loading, selectMap, currentFilter, folderIndex]);

    const getItemLayout = useCallback((data: any, index: number) => ({
        length: (taskHeight + tasksGap),
        offset: index * (taskHeight + tasksGap),
        index: index,
    }), [taskHeight, tasksGap]);

    const onMomentumScrollEnd = useCallback(() => {
        if (scrolling.value) scrolling.value = false;
    }, []);

    useEffect(() => {
        filtering.value = currentFilter != 1;
    }, [currentFilter]);

    const isActive = currentFolder == null
        ? folderIndex === 0
        : currentFolder === folder.idFolder;

    if (isActive && !mounted) {
        setMounted(true);
    }

    if (!mounted) return null;

    return (
        <View className="w-screen flex items-center shrink-0">
            <GestureDetector gesture={gesture}>
                <Animated.FlatList
                    nestedScrollEnabled
                    scrollEnabled
                    horizontal={false}
                    initialNumToRender={LIMIT}
                    maxToRenderPerBatch={Math.round(folderTasks.length / 2)}
                    windowSize={LIMIT}
                    removeClippedSubviews
                    showsVerticalScrollIndicator={false}
                    data={folderTasks}
                    keyExtractor={(item) => String((item as TaskType).idTask)}
                    renderItem={renderItem}
                    onEndReachedThreshold={.1}
                    scrollEventThrottle={16}
                    onScroll={handleScroll}
                    onMomentumScrollEnd={onMomentumScrollEnd}
                    onEndReached={onEndReached}
                    getItemLayout={getItemLayout}
                    ListEmptyComponent={listEmptyComponent}
                    ListFooterComponent={listFooterComponent}
                    className="w-full"
                    contentContainerStyle={{
                        gap: tasksGap,
                    }}
                    extraData={mounted}
                    contentContainerClassName="w-full flex flex-col items-center pt-[215px] pb-[80px] px-3"
                />
            </GestureDetector>
        </View>
    );
});