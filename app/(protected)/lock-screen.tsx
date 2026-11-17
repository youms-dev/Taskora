import { Container } from "@/components/container";
import { PressableAnimated } from "@/components/pressable-animated";
import { TextAnimated } from "@/components/text-animated";
import { TextGradient } from "@/components/text-gradient";
import { COLORS } from "@/constants/colors";
import { APP_NAME } from "@/constants/names";
import { useTheme } from "@/hooks/use-theme";
import { FontAwesome5 } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import clsx from "clsx";
import * as Authentication from "expo-local-authentication";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, useWindowDimensions, Vibration, View } from "react-native";
import Animated, { Easing, FadeIn, FadeOut, SharedValue, useAnimatedReaction, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const SIZE = 70;
const MARGIN = 10;
const LETTERS = [
    "ABC",
    "DEF",
    "GHI",
    "JKL",
    "MNO",
    "PQRS",
    "TUV",
    "WXYZ",
];

interface ButtonProps {
    index: number;
    value: number;
    onBackSpacePress: () => void;
    onFingerPrintPress: () => void;
    onPress: () => void;
    delayLongPress: number;
    onLongPress: () => void;
}

const Button = memo(({ index, value, onBackSpacePress, onFingerPrintPress, onPress, delayLongPress, onLongPress }: ButtonProps) => {
    const { theme } = useTheme();
    const isFingerPrint = index == 9;
    const isBackSpace = index == 11;

    const handlePress = useCallback(() => {
        if (isFingerPrint) {
            onFingerPrintPress();
        }
        else if (isBackSpace) {
            onBackSpacePress();
        }
        else {
            onPress();
        }
    }, [onBackSpacePress, onFingerPrintPress, onPress]);

    const handleLongPress = useCallback(() => {
        isBackSpace && onLongPress();
    }, [onLongPress, isFingerPrint, isBackSpace]);

    return (
        <PressableAnimated
            scale={.9}
            onPress={handlePress}
            delayLongPress={delayLongPress}
            onLongPress={handleLongPress}
            style={{
                width: SIZE,
                height: SIZE,
                marginHorizontal: MARGIN,
            }}
            className="rounded-full dark:bg-black bg-white"
        >
            <View
                style={{
                    transform: [
                        {
                            translateX: -6,
                        },
                        {
                            translateY: -6,
                        },
                    ],
                    filter: "blur(5px)",
                }}
                className="absolute size-full left-0 top-0 dark:bg-white/5 bg-white rounded-full pointer-events-none"
            />

            <View
                style={{
                    transform: [
                        {
                            translateX: 6,
                        },
                        {
                            translateY: 6,
                        },
                    ],
                    filter: "blur(5px)",
                }}
                className="absolute size-full right-0 bottom-0 dark:bg-black/50 bg-black/10 rounded-full pointer-events-none"
            />

            <View className="size-full rounded-full dark:bg-black bg-white">
                <View
                    style={{
                        backgroundColor: theme == "dark" ? "rgba(255, 255, 255, .1)" : "rgba(0, 0, 0, .05)"
                    }}
                    className="size-full flex justify-center items-center rounded-full"
                >
                    {
                        !isFingerPrint && !isBackSpace && (
                            <TextAnimated
                                style={{
                                    transform: [
                                        {
                                            translateY: -5,
                                        }
                                    ]
                                }}
                                className="text-2xl font-medium"
                            >
                                {value}
                            </TextAnimated>
                        )
                    }

                    {
                        isFingerPrint && (
                            <FontAwesome5
                                name="fingerprint"
                                size={25}
                                color={theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .8)"}
                            />
                        )
                    }

                    {
                        isBackSpace && (
                            <FontAwesome5
                                name="backspace"
                                size={25}
                                color={theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .8)"}
                            />
                        )
                    }

                    {
                        (value > 1 || index == 10) && (
                            <View
                                style={{
                                    transform: [
                                        {
                                            translateY: 15,
                                        }
                                    ]
                                }}
                                className="absolute"
                            >
                                <TextAnimated className={clsx(
                                    "tracking-widest",
                                    index != 10 ? "text-sm opacity-60" : "text-xl opacity-50",
                                )}>
                                    {index != 10 ? LETTERS[index - 1] : "+"}
                                </TextAnimated>
                            </View>
                        )
                    }
                </View>
            </View>
        </PressableAnimated>
    );
});

interface BoxProps {
    active: boolean;
    shake: SharedValue<boolean>;
}

const Box = memo(({ active, shake }: BoxProps) => {
    const { theme, themeShared } = useTheme();

    const animation = useAnimatedStyle(() => ({
        backgroundColor: (
            shake.value ?
                COLORS.red[500]
                :
                themeShared.value == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"
        ),
    }));

    const shakingAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: (
                    shake.value ?
                        withRepeat(
                            withSequence(
                                withTiming(-15, {
                                    duration: 50,
                                    easing: Easing.inOut(Easing.linear),
                                }),
                                withTiming(15, {
                                    duration: 50,
                                    easing: Easing.inOut(Easing.linear),
                                }),
                                withTiming(0, {
                                    duration: 50,
                                    easing: Easing.inOut(Easing.linear),
                                }),
                            ),
                            Infinity,
                            true,
                        )
                        :
                        0
                ),
            }
        ]
    }));

    return (
        <Animated.View
            style={shakingAnimation}
            className="size-[25px] rounded-full dark:bg-black bg-white"
        >
            <View
                style={{
                    transform: [
                        {
                            translateX: -6,
                        },
                        {
                            translateY: -6,
                        },
                    ],
                    filter: "blur(5px)",
                }}
                className="absolute size-full left-0 top-0 dark:bg-white/5 bg-white rounded-full pointer-events-none"
            />

            <View
                style={{
                    transform: [
                        {
                            translateX: 6,
                        },
                        {
                            translateY: 6,
                        },
                    ],
                    filter: "blur(5px)",
                }}
                className="absolute size-full right-0 bottom-0 dark:bg-black/50 bg-black/10 rounded-full pointer-events-none"
            />

            <View className="size-full rounded-full dark:bg-black bg-white">
                <View
                    style={{
                        backgroundColor: theme == "dark" ? "rgba(255, 255, 255, .1)" : "rgba(0, 0, 0, .05)"
                    }}
                    className="size-full flex justify-center items-center rounded-full p-2"
                >
                    {
                        active && (
                            <Animated.View
                                entering={FadeIn
                                    .duration(200)
                                    .easing(Easing.inOut(Easing.quad))
                                }
                                exiting={FadeOut
                                    .duration(200)
                                    .easing(Easing.inOut(Easing.quad))
                                }
                                style={animation}
                                className="size-full rounded-full"
                            />
                        )
                    }
                </View>
            </View>
        </Animated.View>
    );
});

export default function LockScreen() {
    const { theme } = useTheme();
    const [lock, setLock] = useState<boolean>(true);
    const lockShared = useSharedValue<boolean>(true);
    const themeShared = useSharedValue<typeof theme>(theme);
    const scale = useSharedValue<number>(0);
    const timeout = useRef<ReturnType<typeof setTimeout>>(null);
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const [value, setValue] = useState<string>("");
    const shake = useSharedValue<boolean>(false);
    const shakeTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    const { t, i18n } = useTranslation();

    const numbers = useMemo(() => Array(12).fill(0).map((_, i, tab) => i < tab.length - 3 ? i + 1 : 0), []);

    const upHalfAnimation = useAnimatedStyle(() => ({
        transform: [{
            translateY: withDelay(500,
                withTiming(lockShared.value ? 32 : 20, {
                    duration: 300,
                    easing: Easing.inOut(Easing.quad)
                })
            )
        }],
        borderColor: withDelay(500,
            withTiming((
                !lockShared.value ?
                    COLORS.emerald[500]
                    :
                    (themeShared.value == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)")
            ), {
                duration: 300,
                easing: Easing.inOut(Easing.quad),
            })
        )
    }));

    const upHalfChildAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: 10,
            },
            {
                translateY: withDelay(500,
                    withTiming(lockShared.value ? 10 : 0, {
                        duration: 300,
                        easing: Easing.inOut(Easing.quad)
                    })
                )
            },
        ],
    }));

    const lowerHalfAnimation = useAnimatedStyle(() => ({
        backgroundColor: withDelay(500,
            withTiming((
                !lockShared.value ?
                    COLORS.emerald[500]
                    :
                    (themeShared.value == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)")
            ), {
                duration: 300,
                easing: Easing.inOut(Easing.quad)
            })
        )
    }));

    const animation = useAnimatedStyle(() => ({
        transform: [
            {
                scale: scale.value,
            }
        ]
    }));

    useEffect(() => {
        themeShared.value = theme;
    }, [theme]);

    const onSuccess = useCallback(() => {
        lockShared.value = false;
        setLock(false);
        timeout.current = setTimeout(() => {
            setLock(true);
            lockShared.value = true;
        }, 1500);
    }, []);

    const handleLocalAuth = useCallback(async () => {
        timeout.current && clearTimeout(timeout.current);
        const { success } = await Authentication.authenticateAsync({
            requireConfirmation: false,
            biometricsSecurityLevel: "strong",
            promptMessage: t("lock_screen_item_1", { name: APP_NAME }),
            promptDescription: t("lock_screen_item_2", { name: APP_NAME }),
        });

        if (success) {
            onSuccess();
        }
    }, [i18n.language]);

    useEffect(() => {
        if (!lock) {
            scale.value = withRepeat(
                withSequence(
                    withTiming(1, {
                        duration: 300,
                        easing: Easing.inOut(Easing.quad)
                    }),
                    withTiming(1.2, {
                        duration: 300,
                        easing: Easing.inOut(Easing.quad)
                    }),
                    withDelay(
                        600,
                        withTiming(1, {
                            duration: 300,
                            easing: Easing.inOut(Easing.quad)
                        }),
                    )
                ),
                1
            );
        }
        else {
            scale.value = 1;
        }
    }, [lock]);

    useEffect(() => {
        return () => {
            timeout.current && clearTimeout(timeout.current);
            shakeTimeout.current && clearTimeout(shakeTimeout.current);
        }
    }, []);

    const renderItem = useCallback(({ item, index }: { item: number; index: number }) => {
        return (
            <Button
                index={index}
                value={item}
                onBackSpacePress={() => setValue(prev => {
                    if (prev.length > 0) {
                        return prev.slice(0, prev.length - 1);
                    }
                    return prev;
                })}
                onFingerPrintPress={handleLocalAuth}
                onPress={() => setValue(prev => {
                    const value = (prev + String(item)).slice(0, 5);

                    if (value.trim().length == 5) {
                        if (value == "12345") {
                            onSuccess();
                        }
                        else {
                            shake.value = true;
                        }
                    }

                    return value;
                })}
                delayLongPress={150}
                onLongPress={() => setValue("")}
            />
        );
    }, []);

    const getItemLayout = useCallback((_data: any, index: number) => ({
        length: SIZE,
        offset: index * (SIZE + MARGIN),
        index,
    }), []);

    const handleShaking = useCallback(() => {
        shakeTimeout.current && clearTimeout(shakeTimeout.current);
        Vibration.vibrate(500);
        shakeTimeout.current = setTimeout(() => {
            shake.value = false;
            setValue("");
        }, 800);
    }, []);

    useAnimatedReaction(
        () => shake.value,
        (next, prev) => {
            if (next && next != prev) {
                scheduleOnRN(handleShaking);
            }
        }
    );

    return (
        <Container centerX>
            <View
                style={{
                    width: screenWidth,
                    height: screenHeight + (screenHeight * .2),
                    transform: [
                        {
                            translateY: -screenHeight * .1,
                        }
                    ]
                }}
                className="absolute left-0 top-0 size-full dark:bg-white/10 pointer-events-none"
            />

            {/* Section 1 */}

            <View className="w-full flex justify-center items-center">
                <Animated.View
                    style={animation}
                    className="w-[120px] flex justify-center items-center shrink-0"
                >
                    {/* Lock top */}

                    <Animated.View
                        style={upHalfAnimation}
                        className="relative w-[60%] h-[80px] border-[10px] rounded-3xl"
                    >
                        <Animated.View
                            style={upHalfChildAnimation}
                            className="absolute right-0 bottom-0 w-[10px] h-[50%] dark:bg-black bg-white"
                        >
                            <View
                                style={{
                                    backgroundColor: theme == "dark" ? "black" : "rgba(0, 0, 0, .05)"
                                }}
                                className="size-full"
                            />
                        </Animated.View>
                    </Animated.View>

                    {/* Lock bottom */}

                    <View className="w-[80%] h-[60px] rounded-xl dark:bg-black bg-white">
                        <Animated.View
                            style={lowerHalfAnimation}
                            className="size-full flex justify-center items-center rounded-xl"
                        >
                            <FontAwesome6
                                name="key"
                                size={35}
                                color={lock ?
                                    (theme === "dark" ? "black" : "rgba(255, 255, 255, .8)")
                                    :
                                    "black"
                                }
                            />
                        </Animated.View>
                    </View>
                </Animated.View>
            </View>

            {/* Section 2 */}

            <View className="w-full h-[75%] flex items-center gap-10 pt-20">
                <View className="w-full flex flex-row justify-center items-center gap-5 px-3">
                    {
                        Array(5).fill(0).map((_, i) => {
                            return (
                                <Box
                                    key={i}
                                    active={!!value[i]}
                                    shake={shake}
                                />
                            );
                        })
                    }
                </View>

                <View className="w-full flex items-center">
                    <FlatList
                        data={numbers}
                        keyExtractor={(_, i) => String(i)}
                        numColumns={3}
                        renderItem={renderItem}
                        getItemLayout={getItemLayout}
                        contentContainerStyle={{
                            rowGap: 20,
                            paddingVertical: 10,
                        }}
                        contentContainerClassName="w-full flex items-center"
                    />
                </View>
            </View>

            {/* Section 3 */}

            <View className="w-full h-[10%] flex flex-row justify-center gap-3 p-3">
                <TextGradient
                    colors={[
                        COLORS.emerald[500],
                        theme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="clip"
                    className="text-3xl font-extrabold"
                >
                    {APP_NAME}
                </TextGradient>
            </View>
        </Container>
    );
}