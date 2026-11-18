import clsx from "clsx";
import { forwardRef, memo, useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, TextInput, TextInputProps, Vibration, View } from "react-native";
import Animated, { Easing, FadeInDown, FadeOutUp } from "react-native-reanimated";
import { PressableAnimated } from "./pressable-animated";

interface Props extends Pick<TextInputProps, "onSubmitEditing"> {
    value: string;
    setValue: (value: string) => void;
}

/**
 * @param value
 * 
 * @param setValue
 * 
 * @returns Code input component
 */

export const CodeInput = memo(forwardRef<TextInput, Props>(({ value, setValue, ...rest }: Props, ref) => {
    const codeRef = useRef<TextInput>(null);
    const [focus, setCodeFocus] = useState<boolean>(false);

    const handleRef = useCallback((entry: TextInput | null) => {
        codeRef.current = entry;

        if (typeof ref == "function") {
            ref(entry);
        }
        else if (ref) {
            ref.current = entry;
        }
    }, [ref]);

    useEffect(() => {
        const { remove } = Keyboard.addListener("keyboardDidHide", () => {
            codeRef.current?.blur();
        });

        return () => remove();
    }, []);

    return (
        <View className="w-full flex items-center mt-5">
            <View className="w-full flex flex-row flex-wrap justify-center gap-5 px-3">
                {
                    Array(5).fill(0).map((_, i) => {
                        const isFocus = (focus && (value.trim().length == i || (value.trim().length == 5 && i == 4)));

                        return (
                            <PressableAnimated
                                key={i}
                                scale={.95}
                                onPress={() => codeRef.current?.focus()}
                                className="w-[45px] h-[60px] flex justify-center items-center dark:bg-black bg-white rounded-2xl"
                            >
                                {
                                    isFocus && (
                                        <View
                                            style={{
                                                transform: [
                                                    {
                                                        translateY: 6,
                                                    },
                                                ],
                                                filter: "blur(5px)",
                                            }}
                                            className="absolute size-full bg-black/10 rounded-2xl"
                                        />
                                    )
                                }

                                <View className={clsx(
                                    "size-full flex justify-center items-center dark:bg-white/10 bg-white rounded-2xl border",
                                    isFocus ? "border-emerald-500/50" : "dark:border-white/5 border-black/5",
                                )}>
                                    {
                                        value[i]?.trim().length > 0 && (
                                            <Animated.Text
                                                entering={FadeInDown
                                                    .springify()
                                                    .stiffness(60)
                                                    .mass(1)
                                                    .damping(5)
                                                }
                                                exiting={FadeOutUp
                                                    .duration(300)
                                                    .easing(Easing.inOut(Easing.quad))
                                                }
                                                className="text-3xl font-bold text-emerald-500"
                                            >
                                                {value[i]}
                                            </Animated.Text>
                                        )
                                    }
                                </View>
                            </PressableAnimated>
                        )
                    })
                }
            </View>

            <TextInput
                {...rest}
                ref={handleRef}
                keyboardType="number-pad"
                onFocus={() => setCodeFocus(true)}
                onBlur={() => setCodeFocus(false)}
                value={value}
                onChangeText={(e) => {
                    if (/\D/gi.test(e)) {
                        Vibration.vibrate(100);
                        return;
                    }
                    setValue(e.slice(0, 5));
                }}
                style={{
                    transform: [
                        {
                            translateY: 70
                        }
                    ],
                }}
                className="absolute size-0 pointer-events-none -z-[100]"
            />
        </View>

    );
}));