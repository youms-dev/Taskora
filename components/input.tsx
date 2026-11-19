import { COLORS } from "@/constants/colors";
import { useTheme } from "@/hooks/use-theme";
import { Entypo } from "@expo/vector-icons";
import { forwardRef, memo, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, TextInput, TextInputProps, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { PressableAnimated } from "./pressable-animated";
import { TextAnimated } from "./text-animated";

interface Props extends TextInputProps {
  placeholder?: string;
  label?: string;
  icon?: ReactNode;
  paddingLeft?: number;
  paddingRight?: number;
  value: TextInputProps["value"];
  eye?: boolean;
  visible?: boolean;
  eyeXPosition?: number;
  eyeYPosition?: number;
}

/**
 * @param placeholder
 * 
 * @param label
 * 
 * @param icon
 * 
 * @param paddingLeft
 * 
 * @param paddingRight
 * 
 * @param value
 * 
 * @param eye
 * 
 * @param visible
 * 
 * @param eyeXPosition
 * 
 * @param eyeYPosition
 * 
 * @returns The input component
 */

export const Input = memo(forwardRef<TextInput, Props>(({ placeholder, label, icon, paddingLeft = 50, paddingRight = 20, value, eye, visible: textVisible = true, eyeXPosition = -15, eyeYPosition = 44, ...rest }: Props, inputRef) => {
  const { theme, themeShared } = useTheme();
  const ref = useRef<TextInput>(null);
  const [focus, setFocus] = useState<boolean>(false);
  const focusShared = useSharedValue<boolean>(false);
  const [visible, setVisible] = useState<boolean>(eye ? false : textVisible);

  useEffect(() => {
    const { remove } = Keyboard.addListener("keyboardDidHide", () => {
      ref.current?.blur();
    });

    return () => remove();
  }, []);

  const handleRef = useCallback((entry: TextInput | null) => {
    ref.current = entry;

    if (typeof inputRef == "function") {
      inputRef(entry);
    }
    else if (inputRef) {
      inputRef.current = entry;
    }
  }, [inputRef]);

  useEffect(() => {
    focusShared.value = focus;
  }, [focus]);

  const focusAnimation = useAnimatedStyle(() => ({
    borderWidth: 2,
    borderColor: focusShared.value ?
      COLORS.emerald[500]
      :
      themeShared.value == "dark" ? "rgba(255, 255, 255, .1)" : "rgba(0, 0, 0, .1)"
  }));

  return (
    <View className="w-full flex items-center gap-2">
      {
        label && (
          <View className="w-full">
            <TextAnimated className="text-xl">
              {label}
            </TextAnimated>
          </View>
        )
      }

      <Animated.View
        style={focusAnimation}
        className="w-full dark:bg-black bg-white rounded-2xl"
      >
        <TextInput
          {...rest}
          ref={handleRef}
          cursorColor={COLORS.emerald[500]}
          selectionColor={COLORS.emerald[500]}
          placeholder={placeholder}
          placeholderTextColor={theme == "dark" ? "rgba(255, 255, 255, .4)" : "rgba(0, 0, 0, .4)"}
          secureTextEntry={!visible}
          value={value}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            paddingLeft,
            paddingRight: eye ? 50 : paddingRight,
          }}
          className="w-full h-[50px] dark:bg-white/10 bg-white rounded-2xl dark:text-white/80 text-black/80 text-xl tracking-wider"
        />
      </Animated.View>

      {
        icon && icon
      }

      {
        eye && (
          <View
            style={{
              transform: [
                {
                  translateX: eyeXPosition,
                },
                {
                  translateY: eyeYPosition,
                },
              ]
            }}
            className="absolute right-0 top-0 z-[10]"
          >
            <PressableAnimated onPress={() => setVisible(prev => !prev)}>
              {
                visible && (
                  <Animated.View
                    style={{
                      transform: [
                        {
                          translateX: -0,
                        },
                        {
                          translateY: 12,
                        },
                        {
                          rotate: "35deg",
                        },
                        {
                          scale: 1.2,
                        },
                      ]
                    }}
                    className="absolute left-0 top-0 w-full h-[3px] dark:bg-white/50 bg-black/50 rounded-2xl"
                  />
                )
              }

              <Entypo
                name="eye"
                size={28}
                color={theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)"}
              />
            </PressableAnimated>
          </View>
        )
      }
    </View>
  );
}));