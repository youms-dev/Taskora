import { Container } from "@/components/container";
import { Management } from "@/components/onboarding/managment";
import { Security } from "@/components/onboarding/security";
import { Success } from "@/components/onboarding/success";
import { PressableAnimated } from "@/components/pressable-animated";
import { TextAnimated } from "@/components/text-animated";
import { TextGradient } from "@/components/text-gradient";
import { COLORS } from "@/constants/colors";
import { REFRESH_AUTH } from "@/constants/emitters";
import { APP_NAME } from "@/constants/names";
import { useTheme } from "@/hooks/use-theme";
import { emitter } from "@/lib/event-emitter";
import clsx from "clsx";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, { Easing, FadeIn, FadeInDown, FadeInUp, FadeOutDown, SlideInLeft, SlideInRight, SlideOutLeft, SlideOutRight, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

interface Props {
    active: boolean;
}

const Dot = memo(({ active }: Props) => {
    const isActive = useSharedValue<boolean>(false);

    const animation = useAnimatedStyle(() => ({
        width: withTiming(isActive.value ? 50 : 18, {
            duration: 300,
            easing: Easing.inOut(Easing.quad),
        }),
        borderRadius: isActive.value ? 20 : 9999,
    }));

    const roundedAnimation = useAnimatedStyle(() => ({
        borderRadius: isActive.value ? 20 : 9999,
    }));

    useEffect(() => {
        isActive.value = active;
    }, [active]);

    return (
        <Animated.View
            style={[
                animation,
                roundedAnimation,
                {
                    height: 18,
                }
            ]}
            className="dark:bg-black bg-white"
        >
            <Animated.View
                style={roundedAnimation}
                className={clsx(
                    "size-full rounded-full",
                    active ? "bg-emerald-500" : "dark:bg-white/20 bg-black/80",
                )}
            />
        </Animated.View>
    )
});

export default function Onboarding() {
    const { theme } = useTheme();
    const [step, setStep] = useState<number>(1);
    const { t, i18n } = useTranslation();
    const router = useRouter();

    const changeStep = useCallback((value: "prev" | "next") => {
        setStep(prev => {
            if (value == "prev") {
                return prev > 1 ? prev - 1 : prev + 1;
            }
            return prev < 4 ? prev + 1 : prev;
        });
    }, []);

    const step1Tab = useMemo(() => ([
        t("onboarding_step_1_section_2_item_2"),
        t("onboarding_step_1_section_2_item_3"),
        t("onboarding_step_1_section_2_item_4"),
    ]), [i18n.language]);

    useEffect(() => {
        const { remove } = BackHandler.addEventListener("hardwareBackPress", () => {
            if (step > 1) {
                changeStep("prev");
                return true;
            }
            return false;
        });

        return () => remove();
    }, [step]);

    return (
        <Container centerX>

            {/* Top gradient */}

            <LinearGradient
                colors={theme == "dark" ?
                    ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .5)", "rgba(0, 0, 0, 0)"]
                    :
                    ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, .9)", "rgba(255, 255, 255, 0)"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                locations={[0, .6, 1]}
                className="absolute left-0 top-0 w-full h-[30px] z-[10]"
            >
                <LinearGradient
                    colors={theme == "dark" ?
                        ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .5)", "rgba(0, 0, 0, 0)"]
                        :
                        ["rgba(0, 0, 0, .05)", "rgba(0, 0, 0, .05)", "rgba(0, 0, 0, 0)"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    locations={[0, .6, 1]}
                    className="size-full"
                />
            </LinearGradient>

            {/* Back button */}

            {
                step > 1 && (
                    <View
                        style={{
                            transform: [
                                {
                                    translateX: 15,
                                },
                                {
                                    translateY: 5,
                                },
                            ]
                        }}
                        className="absolute left-0 top-0 z-[20]"
                    >
                        <Animated.View
                            entering={SlideInLeft
                                .duration(300)
                                .easing(Easing.inOut(Easing.quad))
                            }
                            exiting={SlideOutLeft
                                .duration(300)
                                .easing(Easing.inOut(Easing.quad))
                            }
                        >
                            <PressableAnimated
                                scale={.95}
                                onPress={() => changeStep("prev")}
                                className="dark:bg-black bg-white rounded-2xl"
                            >
                                <View
                                    style={{
                                        transform: [
                                            {
                                                translateY: 8,
                                            },
                                        ],
                                        filter: "blur(5px)",
                                    }}
                                    className="absolute size-full rounded-2xl bg-black/30"
                                />

                                <View className="dark:bg-white/10 bg-black/80 px-5 py-1 rounded-2xl border dark:border-white/5 border-black/5">
                                    <Text className="text-xl font-medium text-white/80">
                                        {t("onboarding_prev")}
                                    </Text>
                                </View>
                            </PressableAnimated>
                        </Animated.View>
                    </View>
                )
            }

            {/* Skip button */}

            <View
                style={{
                    transform: [
                        {
                            translateX: -15,
                        },
                        {
                            translateY: 5,
                        },
                    ]
                }}
                className="absolute right-0 top-0 z-[20]"
            >
                <Animated.View
                    entering={SlideInRight
                        .duration(300)
                        .easing(Easing.inOut(Easing.quad))
                    }
                    exiting={SlideOutRight
                        .duration(300)
                        .easing(Easing.inOut(Easing.quad))
                    }
                >
                    <PressableAnimated
                        scale={.95}
                        onPress={() => emitter.emit(REFRESH_AUTH)}
                        className="dark:bg-black bg-white rounded-2xl"
                    >
                        <View
                            style={{
                                transform: [
                                    {
                                        translateY: 8,
                                    },
                                ],
                                filter: "blur(5px)",
                            }}
                            className="absolute size-full rounded-2xl bg-black/30"
                        />

                        <View className="dark:bg-white/10 bg-black/80 px-5 py-1 rounded-2xl border dark:border-white/5 border-black/5">
                            <Text className="text-xl font-medium text-white/80">
                                {t("onboarding_skip")}
                            </Text>
                        </View>
                    </PressableAnimated>
                </Animated.View>
            </View>

            {/* Dots */}

            <View
                style={{
                    transform: [
                        {
                            translateY: 55,
                        },
                    ]
                }}
                className="absolute pointer-events-none"
            >
                <Animated.View
                    entering={FadeInUp
                        .duration(300)
                        .easing(Easing.inOut(Easing.quad))
                    }
                    className="flex flex-row items-center gap-1"
                >
                    {
                        Array(4).fill(0).map((_, i) => (
                            <Dot
                                key={i}
                                active={step == i + 1}
                            />
                        ))
                    }
                </Animated.View>
            </View>

            {/* Steps */}

            <KeyboardAwareScrollView
                showsVerticalScrollIndicator={false}
                bottomOffset={15}
                className="w-full h-full"
                contentContainerClassName="w-full min-h-full items-center px-3"
            >

                {/* Step 1 */}

                {
                    step == 1 && (
                        <Animated.View
                            entering={FadeInDown
                                .duration(300)
                                .easing(Easing.inOut(Easing.quad))
                            }
                            exiting={FadeOutDown
                                .duration(300)
                                .easing(Easing.inOut(Easing.quad))
                            }
                            className="sm:w-[500px] w-full h-full flex items-center pt-[150px]"
                        >

                            {/* Section 1 */}

                            <View className="w-full items-center gap-3 px-3">
                                <Animated.View entering={FadeIn
                                    .duration(1000)
                                    .easing(Easing.inOut(Easing.quad))
                                }>
                                    <TextAnimated className="text-5xl font-extrabold text-center">
                                        {t("onboarding_step_1_section_1_item_1")}
                                    </TextAnimated>
                                </Animated.View>

                                <Animated.View entering={FadeIn
                                    .delay(1000)
                                    .duration(1000)
                                    .easing(Easing.inOut(Easing.quad))
                                }>
                                    <TextGradient
                                        colors={[
                                            COLORS.emerald[500],
                                            theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)",
                                        ]}
                                        className="text-5xl font-extrabold"
                                    >
                                        {APP_NAME}
                                    </TextGradient>
                                </Animated.View>
                            </View>

                            {/* Section 2 */}

                            <View className="w-full flex gap-3 px-3 mt-[50px]">
                                <Animated.View entering={FadeIn
                                    .delay(1800)
                                    .duration(1000)
                                    .easing(Easing.inOut(Easing.quad))
                                }>
                                    <TextAnimated className="text-xl">
                                        {t("onboarding_step_1_section_2_item_1")}
                                    </TextAnimated>
                                </Animated.View>

                                {
                                    step1Tab.map((item, i) => (
                                        <Animated.View
                                            key={i}
                                            entering={FadeIn
                                                .delay(1800 + ((i + 1) * 1000))
                                                .duration(1000)
                                                .easing(Easing.inOut(Easing.quad))
                                            }
                                            className="flex flex-row gap-3"
                                        >
                                            <View
                                                style={{
                                                    transform: [
                                                        {
                                                            translateY: 9.5,
                                                        }
                                                    ]
                                                }}
                                                className="size-[8px] rounded-full bg-emerald-500"
                                            />

                                            <View className="w-[90%]">
                                                <TextAnimated className="text-xl">
                                                    {item}
                                                </TextAnimated>
                                            </View>
                                        </Animated.View>
                                    ))
                                }

                                <Animated.View entering={FadeIn
                                    .delay(6000)
                                    .duration(1000)
                                    .easing(Easing.inOut(Easing.quad))
                                }>
                                    <TextAnimated className="text-xl">
                                        {t("onboarding_step_1_section_2_item_5")}
                                    </TextAnimated>
                                </Animated.View>
                            </View>
                        </Animated.View>
                    )
                }

                {/* Step 2 */}

                {
                    step == 2 && (
                        <Animated.View
                            entering={FadeInDown
                                .duration(300)
                                .easing(Easing.inOut(Easing.quad))
                            }
                            exiting={FadeOutDown
                                .duration(300)
                                .easing(Easing.inOut(Easing.quad))
                            }
                            className="sm:w-[500px] w-full h-full flex items-center pt-[100px]"
                        >

                            {/* Section 1 */}

                            <View className="w-full items-center gap-3 px-3">
                                <Management />
                            </View>

                            {/* Section 2 */}

                            <View className="w-full flex gap-3 px-3 mt-10">
                                <TextAnimated
                                    dark="rgba(255, 255, 255, .9)"
                                    light="rgba(0, 0, 0, .9)"
                                    className="text-xl font-medium"
                                >
                                    {t("onboarding_step_2_section_2_item_1")}
                                </TextAnimated>

                                <TextAnimated className="text-xl">
                                    {t("onboarding_step_2_section_2_item_2")}
                                </TextAnimated>
                            </View>

                        </Animated.View>
                    )
                }

                {/* Step 3 */}

                {
                    step == 3 && (
                        <Animated.View
                            entering={FadeInDown
                                .duration(300)
                                .easing(Easing.inOut(Easing.quad))
                            }
                            exiting={FadeOutDown
                                .duration(300)
                                .easing(Easing.inOut(Easing.quad))
                            }
                            className="sm:w-[500px] w-full h-full flex items-center pt-[100px]"
                        >

                            {/* Section 1 */}

                            <View className="w-full items-center gap-3 px-3">
                                <Security />
                            </View>

                            {/* Section 2 */}

                            <View className="w-full flex gap-3 px-3 mt-10">
                                <TextAnimated
                                    dark="rgba(255, 255, 255, .9)"
                                    light="rgba(0, 0, 0, .9)"
                                    className="text-xl font-medium"
                                >
                                    {t("onboarding_step_3_section_2_item_1")}
                                </TextAnimated>

                                <TextAnimated className="text-xl">
                                    {t("onboarding_step_3_section_2_item_2")}
                                </TextAnimated>
                            </View>

                        </Animated.View>
                    )
                }

                {/* Step 3 */}

                {
                    step == 4 && (
                        <Animated.View
                            entering={FadeInDown
                                .duration(300)
                                .easing(Easing.inOut(Easing.quad))
                            }
                            exiting={FadeOutDown
                                .duration(300)
                                .easing(Easing.inOut(Easing.quad))
                            }
                            className="sm:w-[500px] w-full h-full flex justify-center items-center pb-[100px]"
                        >
                            <Success />
                        </Animated.View>
                    )
                }
            </KeyboardAwareScrollView>

            {/* Next button */}

            <View
                style={{
                    transform: [
                        {
                            translateY: -50,
                        }
                    ],
                }}
                className="absolute bottom-0 w-[90%] h-[45px] z-[20]"
            >
                <Animated.View
                    entering={FadeInDown
                        .delay(7000)
                        .duration(500)
                        .easing(Easing.inOut(Easing.quad))
                    }
                    className="size-full"
                >
                    <PressableAnimated
                        scale={.95}
                        onPress={() => {
                            if (step == 4) {
                                emitter.emit(REFRESH_AUTH);
                            }
                            else {
                                changeStep("next");
                            }
                        }}
                        className="size-full flex items-center rounded-3xl"
                    >
                        <View
                            style={{
                                transform: [
                                    {
                                        translateY: 8,
                                    },
                                ],
                                filter: "blur(5px)",
                            }}
                            className="absolute size-full rounded-3xl bg-black/20"
                        />

                        <View className="size-full flex flex-row justify-center items-center bg-emerald-500 rounded-3xl">
                            <Text className="text-black text-2xl font-bold">
                                {step < 4 ?
                                    t("onboarding_next")
                                    :
                                    t("onboarding_complete")
                                }
                            </Text>
                        </View>
                    </PressableAnimated>
                </Animated.View>
            </View>

            {/* Bottom gradient */}

            <LinearGradient
                colors={theme == "dark" ?
                    ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .5)", "rgba(0, 0, 0, 0)"]
                    :
                    ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, .9)", "rgba(255, 255, 255, 0)"]
                }
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                locations={[0, .6, 1]}
                style={{
                    transform: [
                        {
                            translateY: 2,
                        }
                    ]
                }}
                className="absolute left-0 bottom-0 w-full h-[50px] z-[10]"
            >
                <LinearGradient
                    colors={theme == "dark" ?
                        ["rgba(0, 0, 0, 1)", "rgba(0, 0, 0, .5)", "rgba(0, 0, 0, 0)"]
                        :
                        ["rgba(0, 0, 0, .05)", "rgba(0, 0, 0, .05)", "rgba(0, 0, 0, 0)"]
                    }
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    locations={[0, .6, 1]}
                    className="size-full"
                />
            </LinearGradient>
        </Container>
    );
}