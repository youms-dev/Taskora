import { COLORS } from "@/constants/colors";
import { useTheme } from "@/hooks/use-theme";
import { ReactNode, useEffect, useRef, useState } from "react";
import { DimensionValue, Keyboard, TextInput, TextInputProps, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { TextAnimated } from "./text-animated";

interface Props extends TextInputProps {
  width?: DimensionValue;
  height?: DimensionValue;
  onFocus?: TextInputProps["onFocus"];
  onBlur?: TextInputProps["onBlur"];
  placeholder?: string;
  label?: string;
  icon?: ReactNode;
  paddingRight?: number;
  value: TextInputProps["value"];
}

/**
 * 
 * @param width Sets the input's width
 * 
 * @param height Sets the input's height
 * 
 * @param onFocus Define the method that will be called when the input will get the focus
 * 
 * @param onBlur Define the method that will be called when the input will lose the focus
 * 
 * @param onBlur Define the method that will be called when the input will lose the focus
 * 
 * @param placeholder Define the input's placeholder
 * 
 * @param label Define the input's label
 * 
 * @param icon Define the icon that will be show on the input's right side
 * 
 * @param paddingRight Define the right space that will be set to another element like a icon
 * 
 * @param value Define the input's value
 * 
 * @returns The input component
 */

export const Input = ({ width = "100%", height = 45, onFocus, onBlur, placeholder, label, icon, paddingRight, value: inputValue, ...rest }: Props) => {
  const focus = useSharedValue<boolean>(false);
  const { theme: appTheme } = useTheme();
  const theme = useSharedValue<typeof appTheme>(appTheme);
  const ref = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const text = useSharedValue<typeof inputValue>(inputValue);
  const [borderWidth, setBorderWidth] = useState<number>(0);
  const sharedBorderWidth = useSharedValue<number>(0);

  const animation = useAnimatedStyle(() => ({
    backgroundColor: withTiming(focus.value ? COLORS.emerald[500] : (theme.value == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"), {
      duration: 200,
      easing: Easing.inOut(Easing.quad),
    }),
    width: !focus.value ? sharedBorderWidth.value : withSequence(
      withTiming(0, {
        duration: 100,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(sharedBorderWidth.value, {
        duration: 300,
        easing: Easing.inOut(Easing.quad),
      }),
    ),
  }));

  useEffect(() => {
    theme.value = appTheme;
    text.value = inputValue;
    sharedBorderWidth.value = borderWidth;
  }, [appTheme, inputValue, borderWidth]);

  useEffect(() => {
    const onHide = () => {
      ref.current?.blur();
      setIsFocused(false);
    }
    const { remove } = Keyboard.addListener("keyboardDidHide", onHide);

    return () => remove();
  }, []);

  const labelAnimation = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: withTiming(focus.value ? -20 : (text.value && text.value.trim().length > 0 ? -20 : 9), {
          duration: 200,
          easing: Easing.inOut(Easing.quad),
        }),
      },
    ]
  }));

  return (
    <View className="w-full flex items-center px-3">
      <TextInput
        {...rest}
        ref={ref}
        onLayout={(e) => setBorderWidth(e.nativeEvent.layout.width)}
        onFocus={(e) => {
          onFocus && onFocus(e);
          focus.value = true;
          setIsFocused(true);
        }}
        onBlur={(e) => {
          onBlur && onBlur(e);
          focus.value = false;
          setIsFocused(false);
        }}
        cursorColor={appTheme == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"}
        placeholder={placeholder}
        placeholderTextColor={isFocused ? (appTheme == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .5)") : "transparent"}
        style={{
          width,
          height,
          paddingRight,
        }}
        className="text-xl dark:text-white/80 text-black/80"
      />
      <Animated.View
        style={animation}
        className="absolute bottom-0 h-[2px]"
      />
      {
        label && label.trim().length > 0 && (
          <TextAnimated
            style={labelAnimation}
            className="absolute left-4 text-xl font-bold"
          >
            {label}
          </TextAnimated>
        )
      }

      {
        icon && icon
      }
    </View>
  );
}