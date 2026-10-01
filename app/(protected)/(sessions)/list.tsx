import { Container } from "@/components/container";
import { MultiSessionAnimation } from "@/components/multi-session-animation";
import { PressableAnimated } from "@/components/pressable-animated";
import { Skeleton } from "@/components/skeleton";
import { TextAnimated } from "@/components/text-animated";
import { COLORS } from "@/constants/colors";
import { useTheme } from "@/hooks/use-theme";
import { Entypo, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import * as Device from "expo-device";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, useWindowDimensions, View } from "react-native";
import Animated, { Easing, Extrapolation, FadeInUp, FadeOutDown, interpolate, SlideInLeft, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from "react-native-reanimated";

export default function SessionsPage() {
    const { theme, themeShared } = useTheme();
    const { t, i18n } = useTranslation();
    const [devices, setDevices] = useState([]);
    const deviceHeight = 100;
    const devicesGap = 15;
    const threshold = deviceHeight;
    const scrollY = useSharedValue<number>(0);
    const headerContainerWidth = useSharedValue<number>(0);
    const { width: screenWidth } = useWindowDimensions();
    const [loading, setLoading] = useState<boolean>(false);

    const headerContainerAnimation = useAnimatedStyle(() => ({
        borderWidth: 1,
        borderColor: (
            scrollY.value >= threshold ?
                themeShared.value == "dark" ? "rgba(255, 255, 255, .2)" : "rgba(0, 0, 0, .1)"
                :
                themeShared.value == "dark" ? "rgba(0, 0, 0, 1)" : "rgba(0, 0, 0, .06)"
        ),
    }));

    const headerBackgroundAnimation = useAnimatedStyle(() => ({
        width: interpolate(
            scrollY.value,
            [0, threshold],
            [50, headerContainerWidth.value],
            Extrapolation.CLAMP,
        )
    }));

    const headerShadowAnimation = useAnimatedStyle(() => ({
        opacity: interpolate(
            scrollY.value,
            [0, threshold],
            [0, 1],
            Extrapolation.CLAMP,
        )
    }));

    const renderItem = useCallback(({ item, index }: { item: any, index: number }) => {
        return (
            <Animated.View
                entering={FadeInUp
                    .delay(index * 100)
                    .duration(300)
                    .easing(Easing.inOut(Easing.quad))
                }
                exiting={FadeOutDown
                    .duration(300)
                    .easing(Easing.inOut(Easing.quad))
                }
                style={{
                    height: deviceHeight,
                }}
                className="w-full h-[200px] flex flex-row items-center gap-3 dark:bg-white/10 bg-white px-3 rounded-2xl"
            >
                <View className="py-2">
                    <View
                        style={{
                            borderRadius: 10 // 12 for IOS and 10 for android,
                        }}
                        className="w-[45px] h-full dark:bg-black bg-white"
                    >
                        <View
                            style={{
                                borderRadius: 10 // 12 for IOS and 10 for android,
                            }}
                            className="size-full flex items-center dark:bg-black bg-[rgba(0,0,0,.06)] py-1"
                        >
                            <View
                                style={{
                                    transform: [
                                        {
                                            translateY: 5,
                                        }
                                    ]
                                }}
                                className="absolute w-[40%] h-[4px] dark:bg-white/15 bg-black/15 rounded-2xl"
                            />

                            <View className="size-full flex justify-center items-center">
                                <MaterialCommunityIcons
                                    name="android"
                                    // name="apple"
                                    size={25}
                                    color={COLORS.emerald[500]}
                                // color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                                />
                            </View>
                        </View>
                    </View>
                </View>

                <View className="w-[80%] flex items-center gap-1">
                    <View className="w-full flex flex-row flex-wrap items-center gap-2">
                        <TextAnimated
                            numberOfLines={1}
                            className="text-lg font-medium opacity-90 tracking-widest"
                        >
                            {Device.deviceName ?? ""}
                        </TextAnimated>

                        <TextAnimated
                            numberOfLines={1}
                            className="text-lg font-medium opacity-90 tracking-widest"
                        >
                            &bull;
                        </TextAnimated>

                        <TextAnimated
                            numberOfLines={1}
                            className="text-lg font-medium opacity-90 tracking-widest"
                        >
                            {Device.modelName ?? ""}
                        </TextAnimated>
                    </View>

                    <View className="w-full flex flex-row flex-wrap items-center gap-2">
                        <View className="px-3 py-1 dark:bg-black/30 bg-[rgba(0,0,0,.06)] rounded-2xl border dark:border-white/10 border-black/10">
                            <Text
                                numberOfLines={1}
                                className="text-emerald-500 tracking-widest"
                            >
                                {(Device.brand ?? "").toUpperCase()}
                            </Text>
                        </View>

                        <TextAnimated
                            numberOfLines={1}
                            className="tracking-widest"
                        >
                            {format(new Date(), i18n.language == "en" ? "dd-MM-yyyy HH:mm:ss" : "yyyy-MM-dd HH:mm:ss")}
                        </TextAnimated>
                    </View>
                </View>
            </Animated.View>
        );
    }, [theme]);

    const onScroll = useAnimatedScrollHandler({
        onScroll: (e) => {
            const y = e.contentOffset.y;

            scrollY.value = y;
        }
    });

    const getItemLayout = useCallback((_data: unknown, index: number) => ({
        length: deviceHeight + devicesGap,
        offset: index * (deviceHeight + devicesGap),
        index,
    }), []);

    const overviewAnimation = useAnimatedStyle(() => ({
        opacity: interpolate(
            scrollY.value,
            [0, threshold * .6],
            [1, 0],
            Extrapolation.CLAMP,
        ),
        transform: [
            {
                translateY: interpolate(
                    scrollY.value,
                    [0, threshold],
                    [80, 100],
                    Extrapolation.CLAMP,
                ),
            }
        ]
    }));

    const listFooterComponent = useCallback(() => {
        // if (loading) {
        if (true) {
            return (
                <View
                    style={{
                        gap: devicesGap,
                    }}
                    className="w-screen flex items-center px-3"
                >
                    {
                        Array(3).fill(0).map((_, i) => (
                            <Animated.View
                                key={i}
                                entering={FadeInUp
                                    .delay(i * 100)
                                    .duration(300)
                                    .easing(Easing.inOut(Easing.quad))
                                }
                                style={{
                                    height: deviceHeight
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
    }, [loading]);

    return (
        <Container centerX>

            {/* Top linear gradient */}

            <LinearGradient
                colors={theme == "dark" ?
                    ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)"]
                    :
                    ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                locations={theme == "dark" ? [0, 0, 1] : [0, .4, 1]}
                className="absolute left-0 top-0 w-full z-[10]"
            >
                <LinearGradient
                    colors={theme == "dark" ?
                        ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)"]
                        :
                        ["rgba(0, 0, 0, .06)", "rgba(0, 0, 0, .06)", "rgba(0, 0, 0, 0)"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    locations={theme == "dark" ? [0, 0, 1] : [0, .4, 1]}
                    className="w-full h-[20px]"
                />
            </LinearGradient>

            {/* Header */}

            <Animated.View
                onLayout={(e) => headerContainerWidth.value = e.nativeEvent.layout.width}
                entering={SlideInLeft
                    .duration(300)
                    .easing(Easing.inOut(Easing.quad))
                }
                style={{
                    transform: [
                        {
                            translateX: 12,
                        },
                        {
                            translateY: 8,
                        },
                    ],
                }}
                className="absolute left-0 top-0 z-[10] rounded-[50px]"
            >
                <Animated.View
                    style={[
                        {
                            transform: [
                                {
                                    translateY: 8,
                                },
                            ],
                            filter: "blur(5px)",
                        },
                        headerShadowAnimation,
                    ]}
                    className="absolute left-0 top-0 size-full rounded-[50px] dark:bg-black/50 bg-black/30"
                />

                <Animated.View
                    style={headerContainerAnimation}
                    className="rounded-[50px] dark:bg-black bg-white"
                >
                    <View className="flex flex-row items-center gap-3 rounded-[50px] pr-5 dark:bg-black bg-[rgba(0,0,0,0.06)] overflow-hidden">
                        <Animated.View
                            style={headerBackgroundAnimation}
                            className="absolute left-0 top-0 size-full dark:bg-white/10 bg-white rounded-[50px]"
                        />

                        <PressableAnimated
                            scale={.95}
                            className="size-[50px] dark:bg-black bg-white rounded-full"
                        >
                            <View className="size-full flex justify-center items-center border-2 dark:border-white/5 border-black/5 rounded-full dark:bg-white/10 bg-white">
                                <Entypo
                                    name="chevron-left"
                                    size={25}
                                    color={theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
                                />
                            </View>
                        </PressableAnimated>

                        <View>
                            <TextAnimated
                                numberOfLines={1}
                                className="text-xl tracking-widest"
                            >
                                {t("sessions_list_title")}
                            </TextAnimated>
                        </View>
                    </View>
                </Animated.View>
            </Animated.View>

            {/* Overview */}

            <Animated.View
                style={overviewAnimation}
                className="absolute w-full flex justify-center items-center z-[2] px-5 rounded-[20px]"
            >
                <View className="w-full dark:bg-black bg-white rounded-[20px]">
                    <View className="w-full flex justify-center items-center dark:bg-white/10 bg-white pt-5 rounded-[20px] pb-3">
                        <View className="w-full flex-row justify-center">
                            <MultiSessionAnimation
                                width={screenWidth * .8}
                                height={200}
                            />
                        </View>

                        <View className="w-full flex flex-row justify-center px-5">
                            <TextAnimated className="text-center font-medium tracking-wider opacity-80">
                                {t("sessions_list_explanation")}
                            </TextAnimated>
                        </View>
                    </View>
                </View>
            </Animated.View>

            {/* Data */}

            <Animated.FlatList
                horizontal={false}
                showsVerticalScrollIndicator={false}
                updateCellsBatchingPeriod={0}
                data={Array(2)}
                keyExtractor={(item, i) => i.toString()}
                renderItem={renderItem}
                onScroll={onScroll}
                getItemLayout={getItemLayout}
                ListFooterComponent={listFooterComponent}
                className="w-full h-full"
                contentContainerStyle={{
                    gap: devicesGap,
                    paddingBottom: threshold,
                }}
                contentContainerClassName="w-full flex px-3 pt-[400px]"
            />

            {/* Bottom linear gradient */}

            <LinearGradient
                colors={theme == "dark" ?
                    ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .8)", "rgba(0, 0, 0, 0)"]
                    :
                    ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"]
                }
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                locations={[0, .3, 1]}
                className="absolute left-0 bottom-0 w-full z-[10]"
            >
                <LinearGradient
                    colors={theme == "dark" ?
                        ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, .8)", "rgba(0, 0, 0, 0)"]
                        :
                        ["rgba(0, 0, 0, .06)", "rgba(0, 0, 0, .06)", "rgba(0, 0, 0, 0)"]
                    }
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    locations={[0, .3, 1]}
                    className="w-full h-[30px]"
                />
            </LinearGradient>
        </Container>
    );
}