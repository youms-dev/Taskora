import { Container } from "@/components/container";
import { Loader } from "@/components/loader";
import { PressableAnimated } from "@/components/pressable-animated";
import { TextAnimated } from "@/components/text-animated";
import { daysTranslation, monthsTranslation } from "@/constants/calendar";
import { useTasks } from "@/hooks/database/use-tasks";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { TaskType } from "@/types/task";
import { Entypo, FontAwesome, FontAwesome6 } from "@expo/vector-icons";
import { eachDayOfInterval, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, useWindowDimensions, View } from "react-native";
import Animated, { Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from "react-native-reanimated";

export default function Task() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(true);
    const { setToast } = useToast();
    const [task, setTask] = useState<TaskType | null>(null);
    const { theme } = useTheme();
    const { getTask } = useTasks();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const { i18n } = useTranslation();
    const ref = useRef<Animated.ScrollView>(null);
    const mapDateFormat = "dd/MM/yyyy";
    const dateSystem = useMemo(() => new Date(), []);
    const taskDateFormatted = useMemo(() => new Date(task?.plannedDate ?? dateSystem), []);
    const scrollCheckPoint = 200;
    const scrollY = useSharedValue<number>(0);

    console.log("\n");
    console.log("\n");

    const displayedDate = useMemo(() => {
        if (!task) return "";
        const date = taskDateFormatted;

        return daysTranslation[i18n.language == "fr" ? "fr" : "en"][date.getDay() > 0 ? date.getDay() - 1 : 0] + ", " + format(date, i18n.language == "fr" ? "dd / MM / yyyy" : "M / dd / yyyy");
    }, [i18n.language, task]);

    const displayedMonth = useMemo(() => {
        if (!task) return "";
        const date = taskDateFormatted;

        return monthsTranslation[i18n.language == "fr" ? "fr" : "en"][date.getMonth()] + ", " + format(date, "yyyy");
    }, [i18n.language, task]);

    const days = useMemo(() => {
        if (!task) return [];
        const start = startOfWeek(startOfMonth(dateSystem), {
            weekStartsOn: i18n.language == "fr" ? 1 : 0,
        });
        const end = endOfWeek(endOfMonth(dateSystem), {
            weekStartsOn: i18n.language == "fr" ? 1 : 0,
        });

        return eachDayOfInterval({
            start,
            end,
        });
    }, [task, i18n.language]);

    const daysMap = useMemo(() => {
        return (
            new Map(
                days.map((d, i) => [format(d, mapDateFormat), {
                    data: d,
                    index: i,
                }]),
            )
        );
    }, [task, i18n.language]);

    const dayWidth = useMemo(() => {
        return screenWidth / 7;
    }, [screenWidth]);

    if (!id) {
        if (router.canGoBack()) {
            router.back();
        }
        else {
            router.navigate({
                pathname: "/(protected)/(tabs)",
            });
        }
    }

    const handleGetTask = useCallback(async () => {
        try {
            const data = await getTask(id) as TaskType;

            setLoading(false);
            setTask(data);
        }
        catch (e) {
            setLoading(false);
            if (router.canGoBack()) {
                router.back();
            }
            else {
                router.navigate({
                    pathname: "/(protected)/(tabs)",
                });
            }
        }
    }, []);

    useEffect(() => {
        handleGetTask();
    }, []);

    useEffect(() => {
        if (task) {
            const date = taskDateFormatted;
            const index = (((daysMap.get(format(date, mapDateFormat))?.index ?? 0) * dayWidth) - (dayWidth * 3));

            ref.current?.scrollTo({
                x: index,
                animated: false,
            });
        }
    }, [task, screenWidth]);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: ((e) => {
            const y = e.contentOffset.y;

            scrollY.value = y;
        }),
    });

    const opacityAnimation = useAnimatedStyle(() => ({
        opacity: interpolate(
            scrollY.value,
            [0, scrollCheckPoint * .2],
            [1, 0],
            Extrapolation.CLAMP,
        )
    }));

    if (loading) {
        return (
            <Container centerX>
                <View className="size-full flex justify-center items-center">
                    <Loader />
                </View>
            </Container>
        );
    }
    else if (!task) {
        return null;
    }

    return (
        <Container centerX>
            <View
                style={{
                    width: screenWidth,
                    height: screenHeight + (screenHeight * .2),
                    transform: [
                        {
                            translateY: -screenHeight * .1
                        }
                    ]
                }}
                className="absolute left-0 top-0 dark:bg-black bg-white -z-[10]"
            >
                <View className="size-full dark:bg-white/5 bg-black/5" />
            </View>

            <View className="size-full">
                <View className="absolute left-0 top-0 w-full z-[10]">
                    <LinearGradient
                        colors={theme == "dark" ?
                            ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)"]
                            :
                            ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        locations={[0, .6, 1]}
                        className="w-full"
                    >
                        <LinearGradient
                            colors={theme == "dark" ?
                                ["rgba(255, 255, 255, .05)", "rgba(255, 255, 255, .05)", "rgba(255, 255, 255, 0)"]
                                :
                                ["rgba(0, 0, 0, .05)", "rgba(0, 0, 0, .05)", "rgba(0, 0, 0, 0)"]
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            locations={[0, .6, 1]}
                            className="w-full flex flex-row justify-between gap-2 items-center px-3 pb-5"
                        >
                            <PressableAnimated
                                scale={.95}
                                onPress={() => {
                                    if (router.canGoBack()) {
                                        router.back();
                                    }
                                    else {
                                        router.navigate({
                                            pathname: "/(protected)/(tabs)",
                                        })
                                    }
                                }}
                                className="size-[50px] dark:bg-black bg-white rounded-full"
                            >
                                <View className="size-full dark:bg-black bg-white border-2 dark:border-white/5 border-black/5 rounded-full flex justify-center items-center">
                                    <Entypo
                                        name="chevron-left"
                                        size={25}
                                        color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                                    />
                                </View>
                            </PressableAnimated>

                            <Animated.View
                                style={{}}
                                className="w-[70%]"
                            >
                                <TextAnimated
                                    numberOfLines={1}
                                    className="text-xl text-center tracking-widest"
                                >
                                    {displayedDate}
                                </TextAnimated>
                            </Animated.View>

                            <View className="w-[10%] flex items-center">
                                <PressableAnimated>
                                    <FontAwesome6
                                        name="ellipsis-vertical"
                                        size={25}
                                        color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                                    />
                                </PressableAnimated>
                            </View>
                        </LinearGradient>
                    </LinearGradient>
                </View>

                <Animated.View
                    style={[
                        {
                            transform: [
                                {
                                    translateY: 60,
                                }
                            ]
                        },
                        opacityAnimation,
                    ]}
                    className="absolute w-full h-[150px] flex justify-center items-center gap-6 z-[10] pointer-events-none"
                >
                    <View className="w-full flex flex-row justify-center items-center gap-5 px-3">
                        <View>
                            <FontAwesome
                                name="calendar"
                                size={20}
                                color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                            />
                        </View>

                        <View>
                            <TextAnimated className="text-lg font-medium tracking-widest">
                                {displayedMonth}
                            </TextAnimated>
                        </View>
                    </View>

                    <View className="w-full">
                        <ScrollView
                            ref={ref}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            scrollEnabled={false}
                            className="w-full"
                            contentContainerClassName="flex flex-row items-center"
                        >
                            {
                                days.map((day, i) => {
                                    const isTaskDate = format(day, mapDateFormat) == format(taskDateFormatted, mapDateFormat);
                                    const mapIndex = daysMap.get(format(taskDateFormatted, mapDateFormat))?.index ?? 0;
                                    const distance = Math.abs(i - mapIndex);
                                    const effect = Math.max(
                                        0.2,
                                        1 - distance * 0.20,
                                    );

                                    return (
                                        <View
                                            key={i}
                                            style={{
                                                width: dayWidth,
                                                transform: [
                                                    {
                                                        scale: effect,
                                                    }
                                                ],
                                                opacity: effect,
                                            }}
                                            className="flex justify-center items-center gap-2"
                                        >
                                            <TextAnimated
                                                numberOfLines={1}
                                                className="text-3xl font-medium"
                                            >
                                                {day.getDate()}
                                            </TextAnimated>

                                            <TextAnimated
                                                numberOfLines={1}
                                                className="text-lg"
                                            >
                                                {(daysTranslation[i18n.language == "fr" ? "fr" : "en"][day.getDay() > 0 ? day.getDay() - 1 : 0]).slice(0, 3)}
                                            </TextAnimated>
                                        </View>
                                    );
                                })
                            }
                        </ScrollView>
                    </View>
                </Animated.View>

                <Animated.ScrollView
                    horizontal={false}
                    showsVerticalScrollIndicator={false}
                    scrollEventThrottle={16}
                    onScroll={scrollHandler}
                    className="size-full"
                    contentContainerStyle={{
                        paddingTop: scrollCheckPoint,
                    }}
                    contentContainerClassName="w-full flex items-center"
                >
                    <View
                        style={{
                            paddingBottom: scrollCheckPoint,
                        }}
                        className="w-full min-h-full dark:bg-black bg-white rounded-t-[40px] px-3"
                    >
                        <View className="w-full h-[200px] bg-cyan-950 my-3"></View>
                        <View className="w-full h-[200px] bg-cyan-950 my-3"></View>
                        <View className="w-full h-[200px] bg-cyan-950 my-3"></View>
                        <View className="w-full h-[200px] bg-cyan-950 my-3"></View>
                        <View className="w-full h-[200px] bg-cyan-950 my-3"></View>
                        <View className="w-full h-[200px] bg-cyan-950 my-3"></View>
                        <View className="w-full h-[200px] bg-cyan-950 my-3"></View>
                        <View className="w-full h-[200px] bg-cyan-950 my-3"></View>
                        <View className="w-full h-[200px] bg-cyan-950 my-3"></View>
                        <View className="w-full h-[200px] bg-cyan-950 my-3"></View>
                        <View className="w-full h-[200px] bg-cyan-950 my-3"></View>
                        <View className="w-full h-[200px] bg-cyan-950 my-3"></View>
                        <View className="w-full h-[200px] bg-cyan-950 my-3"></View>
                        <View className="w-full h-[200px] bg-cyan-950 my-3"></View>
                        <View className="w-full h-[200px] bg-cyan-950 my-3"></View>
                        <View className="w-full h-[200px] bg-cyan-950 my-3"></View>
                        <View className="w-full h-[200px] bg-cyan-950 my-3"></View>
                        <View className="w-full h-[200px] bg-cyan-950 my-3"></View>
                        <View className="w-full h-[200px] bg-cyan-950 my-3"></View>
                    </View>
                </Animated.ScrollView>

                <View
                    style={{
                        transform: [
                            {
                                translateY: 15,
                            }
                        ]
                    }}
                    className="absolute left-0 bottom-0 w-full h-[50px]"
                >
                    <LinearGradient
                        colors={theme == "dark" ?
                            ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .8)", "rgba(0, 0, 0, 0)"]
                            :
                            ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", " rgba(255, 255, 255, 0)"]
                        }
                        start={{ x: 0, y: 1 }}
                        end={{ x: 0, y: 0 }}
                        locations={[0, .6, 1]}
                        className="size-full"
                    />
                </View>
            </View>
        </Container>
    );
};