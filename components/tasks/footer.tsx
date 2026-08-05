import { COLORS } from "@/constants/colors";
import { useTasksData } from "@/hooks/tasks/use-tasks-data";
import { useTheme } from "@/hooks/use-theme";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { memo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, useWindowDimensions, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { Checkbox } from "../checkbox";
import { PressableAnimated } from "../pressable-animated";
import { TextAnimated } from "../text-animated";

const PressableToScrollAnimated = Animated.createAnimatedComponent(Pressable);

export const Footer = memo(() => {
    const { } = useTasksData();
    const { theme } = useTheme();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const showScrollButton = useSharedValue<boolean>(false);
    const tasksSelectedShared = useSharedValue<boolean>(false);
    const showAddTaskButton = useSharedValue<boolean>(false);
    const screenWidthShared = useSharedValue<number>(screenWidth);
    const screenHeightShared = useSharedValue<number>(screenHeight);
    const { t } = useTranslation();

    const scrollButtonAnimation = useAnimatedStyle(() => ({
        opacity: withTiming(showScrollButton.value ? 1 : 0, {
            duration: 300,
            easing: Easing.inOut(Easing.quad),
        }),
        pointerEvents: showScrollButton.value ? "auto" : "none",
    }));

    const addTaskButtonAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: tasksSelectedShared.value ?
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
                translateY: withTiming(tasksSelectedShared.value ?
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

    return (
        <View className="w-full flex items-center">
            <PressableToScrollAnimated
                // onPress={() => flatListsRef.current[currentIndex].value.scrollToOffset({
                //     offset: 0,
                //     animated: true,
                // })}
                style={[
                    {
                        bottom: 0,
                        transform: [
                            {
                                // translateY: tasksSelected.length > 0 ? -screenHeight * .17 : -screenHeight * .1,
                                translateY: -screenHeight * .1,
                            }
                        ]
                    },
                    scrollButtonAnimation,
                ]}
                className="absolute dark:bg-black bg-white rounded-full overflow-hidden"
            >
                <View className="size-full dark:bg-white/20 bg-black/50 p-2">
                    <Ionicons
                        name="chevron-up-sharp"
                        size={30}
                        color={theme == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(255, 255, 255, .8)"}
                    />
                </View>
            </PressableToScrollAnimated>

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
                            {/* ({tasksSelected.length}) */}
                            ({0})
                        </TextAnimated>
                    </View>

                    <Checkbox
                        // checked={tasksSelected.length == selectLimit || tasksSelected.length == tasks.length}
                        checked={false}
                        // onPress={() => onCheckboxPress()}
                        onPress={() => { }}
                    />

                    {/* <PressableAnimated onPress={() => handleArchive()}> */}
                    <PressableAnimated onPress={() => { }}>
                        <MaterialIcons
                            name="archive"
                            size={30}
                            color={theme == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .5)"}
                        />
                    </PressableAnimated>

                    {/* <PressableAnimated onPress={() => handleDelete()}> */}
                    <PressableAnimated onPress={() => { }}>
                        <FontAwesome6
                            name="trash-alt"
                            size={25}
                            color="red"
                        />
                    </PressableAnimated>
                </View>
            </Animated.View>

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
                    onPress={() => {
                        // if (tasks.length > 0) {
                        //     setTasks([]);
                        //     tasksTmp.current = [];
                        //     setCount(0);
                        //     setCountTmp(0);
                        // }
                        // else getTasks();
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