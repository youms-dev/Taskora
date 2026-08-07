import { LIMIT, useTasksData } from "@/hooks/tasks/use-tasks-data";
import { useTheme } from "@/hooks/use-theme";
import { FolderType } from "@/types/folder";
import { TaskType } from "@/types/task";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, runOnJS, useAnimatedScrollHandler, useSharedValue, withTiming } from "react-native-reanimated";
import { Skeleton } from "../skeleton";
import { TextAnimated } from "../text-animated";
import { TaskCard } from "./task-card";

const FlatListAnimated = Animated.createAnimatedComponent(FlatList);

interface Props {
    folder: FolderType;
    index: number;
}

export const TaskList = memo(({ folder, index: folderIndex }: Props) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const taskHeight = 100;
    const tasksGap = 20;
    const { loading, scrollY, tasks, refreshTranslateY, scrolling, currentFolder, handleGetTasks, tasksSelected } = useTasksData();
    const nativeGesture = Gesture.Native();
    const folderTasks = useMemo(() => {
        if (folderIndex == 0) return tasks;
        return tasks.filter((t) => t.idFolder == folder.idFolder);
    }, [tasks, folder, folderIndex]);
    const [mounted, setMounted] = useState<boolean>(false);
    const areTasksSelected = useSharedValue<boolean>(false);
    const selectMap = useMemo(() => {
        return new Map(
            tasksSelected.map(t => [t.idTask, t])
        )
    }, [tasksSelected]);
    const loadingShared = useSharedValue<boolean>(false);

    const renderItem = useCallback(({ item: task }: { item: unknown }) => (
        <TaskCard task={task as TaskType} />
    ), [tasks]);

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
                .failOffsetX([-50, 50])
                .onUpdate(({ translationY: y }) => {
                    if (scrollY.value <= 0 && y > 0 && !scrolling.value && !areTasksSelected.value && !loadingShared.value) {
                        refreshTranslateY.value = y;
                    }
                })
                .onEnd(() => {
                    if (scrollY.value > 0 || refreshTranslateY.value < 90 || loadingShared.value) {
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

    const gesture = Gesture.Simultaneous(nativeGesture, panGesture);

    useEffect(() => {
        if (!currentFolder) {
            setMounted(true);
        }
        else if (!mounted && currentFolder == folder.idFolder) {
            setMounted(true);
        }
    }, [currentFolder]);

    useEffect(() => {
        areTasksSelected.value = selectMap.size > 0;
    }, [selectMap]);

    useEffect(() => {
        loadingShared.value = loading;
    }, [loading]);

    if (!mounted) return null;

    return (
        <View className="w-screen flex items-center shrink-0">
            <GestureDetector gesture={gesture}>
                <FlatListAnimated
                    nestedScrollEnabled
                    scrollEnabled
                    horizontal={false}
                    initialNumToRender={LIMIT}
                    maxToRenderPerBatch={Math.round(tasks.length / 2)}
                    windowSize={LIMIT}
                    removeClippedSubviews
                    showsVerticalScrollIndicator={false}
                    data={folderTasks}
                    keyExtractor={(item) => String((item as TaskType).idTask)}
                    renderItem={renderItem}
                    onEndReachedThreshold={.1}
                    scrollEventThrottle={16}
                    onScroll={handleScroll}
                    onMomentumScrollEnd={() => {
                        if (scrolling.value) scrolling.value = false;
                    }}
                    // onEndReached={onEndReached}
                    onEndReached={() => { }}
                    getItemLayout={(_, index) => ({
                        length: (taskHeight + tasksGap),
                        offset: index * (taskHeight + tasksGap),
                        index: index,
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
                                        {t("tasks_no_tasks")}
                                    </TextAnimated>
                                </View>
                            );
                        }
                    }}
                    ListFooterComponent={() => {
                        if (loading && selectMap.size == 0) return (
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
                    className="w-full"
                    contentContainerStyle={{
                        gap: tasksGap,
                    }}
                    contentContainerClassName="w-full flex flex-col items-center pt-[215px] pb-[80px] px-3"
                />
            </GestureDetector>
        </View>
    );
});