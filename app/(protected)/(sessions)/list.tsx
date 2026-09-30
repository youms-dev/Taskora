import { Container } from "@/components/container";
import { MultiSessionAnimation } from "@/components/multi-session-animation";
import { PressableAnimated } from "@/components/pressable-animated";
import { TextAnimated } from "@/components/text-animated";
import { useTheme } from "@/hooks/use-theme";
import { Entypo } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useWindowDimensions, View } from "react-native";
import Animated, { Easing, Extrapolation, FadeInUp, FadeOutDown, FadeOutUp, interpolate, SlideInLeft, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from "react-native-reanimated";

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
                className="w-full h-[200px] dark:bg-white/10 bg-white rounded-2xl"
            >

            </Animated.View>
        );
    }, []);

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