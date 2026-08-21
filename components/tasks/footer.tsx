import { COLORS } from "@/constants/colors";
import { TasksDataContext } from "@/hooks/tasks/use-tasks-data";
import { useTheme } from "@/hooks/use-theme";
import { TaskType } from "@/types/task";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Pressable, useWindowDimensions, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { Checkbox } from "../checkbox";
import { PressableAnimated } from "../pressable-animated";
import { TextAnimated } from "../text-animated";

export const SELECT_LIMIT = 50;

interface Props {
    context: TasksDataContext;
}

export const TasksFooter = memo(({ context }: Props) => {
    const { theme } = useTheme();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const areTasksSelected = useSharedValue<boolean>(false);
    const screenWidthShared = useSharedValue<number>(screenWidth);
    const screenHeightShared = useSharedValue<number>(screenHeight);
    const { t } = useTranslation();
    const { setTasksSelected, tasksSelected, tasks, handleArchiveTasks, handleDeleteTasks, loading } = context;
    const showAddTaskButton = useSharedValue<boolean>(true);
    const router = useRouter();

    const selectMap = useMemo(() => {
        return new Map(
            tasksSelected.map(t => [t.idTask, t])
        )
    }, [tasksSelected]);

    const addTaskButtonAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: areTasksSelected.value ?
                    withTiming(100, {
                        duration: 200,
                        easing: Easing.inOut(Easing.quad),
                    })
                    :
                    withSpring(-20, {
                        stiffness: 30,
                        mass: 1,
                        damping: 5,
                    }),
            },
            {
                translateY: showAddTaskButton.value ?
                    withSpring(-120, {
                        stiffness: 50,
                        mass: 1,
                        damping: 6,
                    })
                    :
                    withTiming(screenHeightShared.value * .2, {
                        duration: 200,
                        easing: Easing.inOut(Easing.linear),
                    })
            },
        ],
    }));

    const taskSelectedAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: -20,
            },
            {
                translateY: withTiming(areTasksSelected.value ?
                    -(screenHeightShared.value - (screenHeightShared.value * .9))
                    :
                    screenHeightShared.value * .5,
                    {
                        duration: 300,
                        easing: Easing.inOut(Easing.quad),
                    }
                ),
            },
        ]
    }));

    useEffect(() => {
        screenWidthShared.value = screenWidth;
        screenHeightShared.value = screenHeight;
    }, [screenWidth, screenHeight]);

    useEffect(() => {
        const onBackPress = () => {
            if (selectMap.size > 0) {
                setTasksSelected([]);

                return true;
            }
            return false;
        }

        const { remove } = BackHandler.addEventListener("hardwareBackPress", onBackPress);

        areTasksSelected.value = selectMap.size > 0;

        return () => remove();
    }, [selectMap]);

    const onCheckboxPress = useCallback(() => {
        if (
            (tasksSelected.length == tasks.length)
            ||
            (tasksSelected.length == SELECT_LIMIT)
        ) {
            setTasksSelected([]);
        }
        else {
            const selected: TaskType[] = [];
            const tab = [...tasks];

            for (let i = 0; i < SELECT_LIMIT && i < tab.length; i++) {
                selected.push(tab[i]);
            }
            setTasksSelected([...selected]);
        }
    }, [tasksSelected, tasks, selectMap]);

    const deleteTasks = useCallback(() => handleDeleteTasks(), []);

    return (
        <View className="w-full flex items-center">
            {/* Selection section */}

            <Animated.View
                style={[
                    {
                        maxWidth: screenWidth * .9,
                    },
                    taskSelectedAnimation,
                ]}
                className="absolute right-0 bottom-0 dark:bg-black bg-white rounded-2xl"
            >
                <View
                    style={{
                        transform: [
                            {
                                translateY: 10,
                            }
                        ],
                        filter: "blur(5px)"
                    }}
                    className="absolute bottom-0 w-[100%] h-full bg-black/30 -z-[1] rounded-[50px]"
                />

                <View className="w-full h-full flex flex-row items-center gap-5 dark:bg-white/20 bg-white rounded-2xl px-3 py-1 dark:border-white/10 border border-black/20">
                    <View className="flex flex-row items-center gap-3">
                        <TextAnimated className="text-lg font-bold">
                            {t("tasks_selected")}
                        </TextAnimated>

                        <TextAnimated className="text-lg font-bold">
                            ({selectMap.size})
                        </TextAnimated>
                    </View>

                    <Checkbox
                        checked={selectMap.size == SELECT_LIMIT || selectMap.size == tasks.length}
                        onPress={() => onCheckboxPress()}
                    />

                    <PressableAnimated onPress={handleArchiveTasks}>
                        <MaterialIcons
                            name="archive"
                            size={30}
                            color={theme == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .5)"}
                        />
                    </PressableAnimated>

                    <PressableAnimated onPress={deleteTasks}>
                        <FontAwesome6
                            name="trash-alt"
                            size={25}
                            color="red"
                        />
                    </PressableAnimated>
                </View>
            </Animated.View>

            {/* Add task button */}

            <Animated.View
                style={addTaskButtonAnimation}
                className="absolute right-0 bottom-0 size-[50px] dark:bg-black bg-white rounded-full"
            >
                <View
                    style={{
                        transform: [
                            {
                                translateY: 5,
                            }
                        ],
                        filter: "blur(5px)"
                    }}
                    className="absolute bottom-0 w-full h-full bg-black/20 -z-[1] rounded-full"
                />

                <Pressable
                    onPress={() => router.navigate("/(protected)/(task)/create")}
                    android_ripple={{
                        color: theme == "dark" ? "rgba(255, 255, 255, .1)" : "rgba(0, 0, 0, .1)",
                        borderless: true,
                        foreground: true,
                        radius: 20,
                    }}
                    className="size-full flex justify-center items-center rounded-full border dark:border-white/10 border-black/10 dark:bg-white/15 bg-white"
                >
                    <FontAwesome5
                        name="plus"
                        size={20}
                        color={COLORS.emerald[500]}
                    />
                </Pressable>
            </Animated.View>

            <LinearGradient
                colors={theme == "dark" ?
                    ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .5)", "rgba(0, 0, 0, 0)"]
                    :
                    ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                }
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                style={{
                    transform: [
                        {
                            translateY: 20,
                        }
                    ]
                }}
                className="absolute left-0 bottom-0 w-full z-[10]"
            >
                <LinearGradient
                    colors={theme == "dark" ?
                        ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .5)", "rgba(0, 0, 0, 0)"]
                        :
                        ["rgba(0, 0, 0, .06)", "rgba(0, 0, 0, .06)", "rgba(255, 255, 255, .2)"]
                    }
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    className="w-full h-[80px]"
                />
            </LinearGradient>
        </View>
    );
});