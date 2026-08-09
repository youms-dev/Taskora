import { COLORS } from "@/constants/colors";
import { useTasksData } from "@/hooks/tasks/use-tasks-data";
import { TaskType } from "@/types/task";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { memo, useCallback, useEffect, useMemo } from "react";
import { Pressable, PressableProps, Vibration, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, Extrapolation, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { TextAnimated } from "../text-animated";
import { SELECT_LIMIT } from "./footer";

interface TaskCardProps extends Omit<PressableProps, "onLongPress" | "onPress"> {
    task: TaskType;
}
export const TaskCard = memo(({ task, ...rest }: TaskCardProps) => {
    const translateX = useSharedValue<number>(0);
    const selected = useSharedValue<boolean>(false);
    const selection = useSharedValue<boolean>(false);
    const loadingShared = useSharedValue<boolean>(false);
    const height = 100;
    const { tasksSelected, setTasksSelected, handleArchiveTask, handleDeleteTask, loading } = useTasksData();

    const selectMap = useMemo(() => {
        return new Map(
            tasksSelected.map(t => [t.idTask, t])
        )
    }, [tasksSelected]);

    const swipeAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: translateX.value,
            },
        ]
    }));

    const gesture = useMemo(() => {
        return (
            Gesture.Pan()
                .activeOffsetX([-5, 5])
                .failOffsetY([-10, 10])
                .onUpdate(({ translationX: x }) => {
                    if (x >= -100 && x <= 100 && !selection.value && !loadingShared.value) {
                        translateX.value = x;
                    }
                })
                .onEnd(({ translationX: x }) => {
                    translateX.value = withSpring(0, {
                        stiffness: 100,
                        mass: 2,
                        damping: 10,
                    });

                    if (selection.value || loadingShared.value) return;

                    if (x <= -100) {
                        runOnJS(handleArchiveTask)(task);
                    }
                    else if (x >= 100) {
                        runOnJS(handleDeleteTask)(task);
                    }
                })
        )
    }, []);

    const opacityAnimation = useAnimatedStyle(() => ({
        opacity: interpolate(
            translateX.value,
            [-95, 0, 95],
            [1, 0, 1],
            Extrapolation.CLAMP,
        ),
    }));

    const selectContainerAnimation = useAnimatedStyle(() => ({
        opacity: selected.value ? withTiming(1, {
            duration: 200,
            easing: Easing.inOut(Easing.quad),
        }) : 0,
        pointerEvents: selected.value ? "auto" : "none",
    }));

    const indicatorAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: !selected.value ? "100%" : withSequence(
                    withTiming(-50, {
                        duration: 200,
                        easing: Easing.inOut(Easing.quad),
                    }),
                    withTiming(50, {
                        duration: 200,
                        easing: Easing.inOut(Easing.quad),
                    }),
                    withTiming(0, {
                        duration: 200,
                        easing: Easing.inOut(Easing.quad),
                    }),
                ),
            }
        ]
    }));

    useEffect(() => {
        selection.value = selectMap.size > 0;
        selected.value = selectMap.has(task.idTask);
    }, [selectMap]);

    const onPress = useCallback(() => {
        if (loading) return;
        if (!selectMap.has(task.idTask) && selectMap.size == 0) {
            
        }
        else if (!selectMap.has(task.idTask) && selectMap.size > 0 && selectMap.size < SELECT_LIMIT) {
            setTasksSelected((prev) => [...prev, task]);
        }
        else if (selectMap.has(task.idTask)) {
            setTasksSelected((prev) => [...prev.filter(t => t.idTask != task.idTask)]);
        }
    }, [selectMap, tasksSelected, loading]);

    const onLongPress = useCallback(() => {
        if (loading) return;
        if (!selectMap.has(task.idTask) && selectMap.size < SELECT_LIMIT) {
            Vibration.vibrate(100);
            setTasksSelected((prev) => [...prev, task]);
        }
        else if (selectMap.has(task.idTask)) {
            setTasksSelected((prev) => [...prev.filter(t => t.idTask != task.idTask)]);
        }
    }, [selectMap, tasksSelected, loading]);

    useEffect(() => {
        loadingShared.value = loading;
    }, [loading]);

    return (
        <GestureDetector gesture={gesture}>
            <Pressable
                {...rest}
                onPress={onPress}
                onLongPress={onLongPress}
                delayLongPress={150}
                style={{
                    height,
                }}
                className="w-full flex justify-center items-center rounded-2xl"
            >
                <Animated.View
                    style={swipeAnimation}
                    className="absolute w-full h-full dark:bg-black bg-white border dark:border-white/20 border-black/20 rounded-2xl z-[1]"
                >
                    <View className="w-full h-full flex items-center gap-2 rounded-2xl py-2 px-3 dark:bg-white/10 bg-white">
                        {
                            task.title && (
                                <View className="w-full border-b dark:border-b-white/10 border-b-black/10 pb-1">
                                    <TextAnimated
                                        numberOfLines={1}
                                        className="text-lg tracking-widest"
                                    >
                                        {task.title}
                                    </TextAnimated>
                                </View>
                            )
                        }

                        <View className="w-full">
                            <TextAnimated
                                numberOfLines={task.title ? 2 : 3}
                                className="text-lg dark:opacity-70 opacity-60"
                            >
                                {task.content}
                            </TextAnimated>
                        </View>
                    </View>
                </Animated.View>

                <View className="w-full h-full flex flex-row justify-center items-center p-2 rounded-2xl pointer-events-none">
                    <Animated.View
                        style={opacityAnimation}
                        className="w-1/2 h-full flex justify-center bg-red-500 rounded-l-2xl pl-10"
                    >
                        <FontAwesome6
                            name="trash-alt"
                            size={25}
                            color="rgba(255, 255, 255, .8)"
                        />
                    </Animated.View>

                    <Animated.View
                        style={opacityAnimation}
                        className="w-1/2 h-full dark:bg-white/50 bg-black rounded-r-2xl overflow-hidden"
                    >
                        <View className="w-full h-full flex justify-center items-end pr-10 dark:bg-transparent bg-white/30">
                            <MaterialIcons
                                name="archive"
                                size={30}
                                color="rgba(255, 255, 255, .8)"
                            />
                        </View>
                    </Animated.View>
                </View>

                {/* Select View */}

                <Animated.View
                    style={selectContainerAnimation}
                    className="absolute w-full h-full flex justify-center items-center z-[20] dark:bg-black/70 bg-white/70 border dark:border-black border-black/10 rounded-2xl"
                >
                    <Animated.View style={indicatorAnimation}>
                        <MaterialIcons
                            name="playlist-add-check"
                            size={40}
                            color={COLORS.emerald[500]}
                        />
                    </Animated.View>
                </Animated.View>
            </Pressable>
        </GestureDetector>
    );
});