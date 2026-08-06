import { useTasks } from "@/hooks/database/use-tasks";
import { useTasksData } from "@/hooks/tasks/use-tasks-data";
import { useToast } from "@/hooks/use-toast";
import { TaskType } from "@/types/task";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { memo, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, PressableProps, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, Extrapolation, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { TextAnimated } from "../text-animated";

interface TaskCardProps extends Omit<PressableProps, "onLongPress" | "onPress"> {
    task: TaskType;
}
export const TaskCard = memo(({ task, ...rest }: TaskCardProps) => {
    const translateX = useSharedValue<number>(0);
    const { setToast, setDismiss } = useToast();
    const selected = useSharedValue<boolean>(false);
    const selection = useSharedValue<boolean>(false);
    const { deleteTasks, toggleArchiveTasks } = useTasks();
    const { t } = useTranslation();
    const [loading, setLoading] = useState<boolean>(false);
    const loadingShared = useSharedValue<boolean>(false);
    const height = 100;
    const { tasksSelected, setTasksSelected } = useTasksData();

    const swipeAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: translateX.value,
            },
        ]
    }));

    // const handleDelete = useCallback(() => {
    //     if (loading) return;
    //     onDelete?.(task);
    //     setDismiss(handleDeleteTask, () => onRefresh(true));
    // }, [onDelete, task, onRefresh, loading]);

    // const handleDeleteTask = useCallback(async () => {
    //     if (loading) return;
    //     try {
    //         setLoading(true);
    //         await deleteTasks([task.idTask]);
    //         setLoading(false);
    //         onRefresh();
    //     }
    //     catch (e) {
    //         onRefresh(true);
    //         setLoading(false);
    //         console.log(e);
    //     }
    // }, [task, onRefresh, loading]);

    // const handleArchive = useCallback(async () => {
    //     if (loading) return;
    //     onArchive?.(task);
    //     try {
    //         setLoading(true);
    //         await toggleArchiveTasks([task.idTask], true);
    //         setLoading(false);
    //         setToast(t("tasks_archived_item"), "default");
    //         onRefresh();
    //     }
    //     catch (e) {
    //         onRefresh(true);
    //         setLoading(false);
    //         console.log(e);
    //     }
    // }, [onArchive, task, loading]);

    // const handleLongPressLocal = useCallback(() => {
    //     if (!loading) {
    //         onLongPress && onLongPress(task);
    //         Vibration.vibrate(100);
    //     }
    // }, [onLongPress, task]);

    // const handlePress = useCallback(() => {
    //     onPress && onPress(task.idTask);
    // }, [onPress, task]);

    const r = (v: any) => console.log("x", v);

    const gesture = useMemo(() => {
        return (
            Gesture.Pan()
                .activeOffsetX([-5, 5])
                .failOffsetY([-10, 10])
                .onUpdate(({ translationX: x }) => {
                    runOnJS(r)(x);
                    // if (x >= -100 && x <= 100 && !loadingShared.value && !selected.value && !selection.value) {
                    // translateX.value = x;
                    //}
                    if (x >= -100 && x <= 100 && !selection.value) {
                        translateX.value = x;
                    }
                })
                .onEnd(({ translationX: x }) => {
                    translateX.value = withSpring(0, {
                        stiffness: 100,
                        mass: 2,
                        damping: 10,
                    });

                    if (selection.value) return;
                    //             if (selected.value || selection.value || loadingShared.value || (x >= -99 && x <= 99)) return;

                    if (x <= -100) {
                        //                 runOnJS(handleArchive)();
                        runOnJS(r)("Archive");
                    }
                    else if (x >= 100) {
                        //                 runOnJS(handleDelete)();
                        runOnJS(r)("Delete");
                    }
                })
        )
    }, []);
    // ), [handleLongPressLocal, handleArchive, handleDelete]);

    const opacityAnimation = useAnimatedStyle(() => ({
        opacity: interpolate(
            translateX.value,
            [-95, 0, 95],
            [1, 0, 1],
            Extrapolation.CLAMP,
        ),
    }));


    const selectAnimation = useAnimatedStyle(() => ({
        opacity: withTiming(selected.value ? 1 : 0, {
            duration: 200,
            easing: Easing.inOut(Easing.linear),
        }),
        pointerEvents: selected.value ? "auto" : "none",
    }));

    const textAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: !selected.value ? "100%" : withSequence(
                    withTiming(-20, {
                        duration: 200,
                        easing: Easing.inOut(Easing.quad),
                    }),
                    withTiming(20, {
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
        selection.value = tasksSelected.length > 0;
    }, [tasksSelected]);

    return (
        <GestureDetector gesture={gesture}>
            <Pressable
                {...rest}
                // onPress={handlePress}
                onPress={() => {
                    console.log("Press");
                }}
                onLongPress={() => {
                    setTasksSelected((prev) => [...prev, task]);
                }}
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
                                numberOfLines={2}
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

                {/* <Animated.View
                    style={selectAnimation}
                    className="absolute w-full h-[100%] flex justify-center items-center z-[20] dark:bg-black/70 bg-white/70 border dark:border-white/20 border-black/20 rounded-2xl"
                >
                    {
                        index > 0 && (
                            <TextAnimated
                                style={textAnimation}
                                className="absolute text-4xl"
                            >
                                {index}
                            </TextAnimated>
                        )
                    }
                </Animated.View> */}
            </Pressable>
        </GestureDetector>
    );
});