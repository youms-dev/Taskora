import { useTasksData } from "@/hooks/tasks/use-tasks-data";
import { useTheme } from "@/hooks/use-theme";
import { TaskType } from "@/types/task";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { FlatList, Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedScrollHandler } from "react-native-reanimated";
import { Skeleton } from "../skeleton";
import { TextAnimated } from "../text-animated";
import { TaskCard } from "./task-card";

const FlatListAnimated = Animated.createAnimatedComponent(FlatList);

interface Props {
    gesture: ReturnType<typeof Gesture.Native>;
}

export const TaskList = memo(({ gesture }: Props) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const taskHeight = 100;
    const tasksGap = 20;
    const { loading, scrollY, extraGesture, tasks, refreshTranslateY } = useTasksData();

    // const handleContentSize = useCallback((x: number, y: number) => onContentSizeChange(x, y), [onContentSizeChange]);
    const handleContentSize = useCallback((x: number, y: number) => { }, []);

    const renderItem = useCallback((task: TaskType) => (
        <TaskCard task={task} />
    ), [tasks, loading]);

    const handleScroll = useAnimatedScrollHandler({
        onScroll: (e) => {
            const y = e.contentOffset.y;

            scrollY.value = y;
        }
    });

    
        const e = (v: any) => console.log(v);
    
        const panGesture = Gesture.Pan()
            .simultaneousWithExternalGesture(extraGesture)
            .activeOffsetY(50)
            .failOffsetX([-10, 10])
            .onUpdate(({ translationY: y }) => {
                if (scrollY.value <= 0 && y > 0) {
                    refreshTranslateY.value = y;
                }
                // if (scrollY.value == 0 && !loadingShared.value) {
                // }
                // runOnJS(e)(y);
            })
            .onEnd(() => {
                refreshTranslateY.value = 0;
                // if (scrollY.value > 0 || loadingShared.value || refreshTranslateY.value < 90) {
                //     refreshTranslateY.value = 0;
                // }
                // else if (refreshTranslateY.value >= 90) {
                //     refreshTranslateY.value = 180;
                //     // runOnJS(handleGetTasks)(true);
                // };
            });
        extraGesture.simultaneousWithExternalGesture(panGesture);

    return (
        <View className="w-screen flex items-center shrink-0">
            {/* <GestureDetector gesture={extraGesture}>
            </GestureDetector> */}

            <GestureDetector gesture={gesture}>
                <FlatListAnimated
                    // ref={handleRef}
                    nestedScrollEnabled
                    scrollEnabled
                    horizontal={false}
                    initialNumToRender={10}
                    maxToRenderPerBatch={20}
                    windowSize={10}
                    removeClippedSubviews
                    showsVerticalScrollIndicator={false}
                    data={tasks}
                    keyExtractor={(item) => String((item as TaskType).idTask)}
                    renderItem={({ item }) => renderItem(item as TaskType)}
                    // renderItem={({ item }) => <></>}
                    onEndReachedThreshold={.1}
                    scrollEventThrottle={16}
                    onScroll={handleScroll}
                    onMomentumScrollBegin={() => {

                    }}
                    onMomentumScrollEnd={() => {

                    }}
                    onContentSizeChange={handleContentSize}
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
                    className="w-full"
                    style={{
                        borderWidth: 2,
                        borderColor: "blue",
                    }}
                    contentContainerStyle={{
                        gap: tasksGap,
                        borderWidth: 2,
                        borderColor: "red",
                    }}
                    contentContainerClassName="w-full flex flex-col items-center pt-[220px] pb-[150px] px-3"
                />
            </GestureDetector>

            {/* <FlatListAnimated
                // ref={handleRef}
                nestedScrollEnabled
                horizontal={false}
                initialNumToRender={10}
                maxToRenderPerBatch={20}
                windowSize={10}
                removeClippedSubviews
                showsVerticalScrollIndicator={false}
                data={tasks}
                keyExtractor={(item) => String((item as TaskType).idTask)}
                renderItem={({ item }) => renderItem(item as TaskType)}
                // renderItem={({ item }) => <></>}
                onEndReachedThreshold={.1}
                scrollEventThrottle={16}
                onScroll={handleScroll}
                onMomentumScrollBegin={() => {

                }}
                onMomentumScrollEnd={() => {

                }}
                onContentSizeChange={handleContentSize}
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
                className="w-full"
                style={{
                    borderWidth: 2,
                    borderColor: "blue",
                }}
                contentContainerStyle={{
                    gap: tasksGap,
                    borderWidth: 2,
                    borderColor: "red",
                }}
                contentContainerClassName="w-full flex flex-col items-center pt-[220px] pb-[150px] px-3"
            /> */}
        </View>
    );
});