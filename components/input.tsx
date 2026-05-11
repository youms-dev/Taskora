import { COLORS } from "@/constants/colors";
import { useTheme } from "@/hooks/use-theme";
import { ReactNode, useEffect, useRef, useState } from "react";
import { DimensionValue, Keyboard, TextInput, TextInputProps, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
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
}

const InputAnimated = Animated.createAnimatedComponent(TextInput);

export const Input = ({ width = "100%", height = 45, onFocus, onBlur, placeholder, label, icon, paddingRight, ...rest }: Props) => {
  const focus = useSharedValue<boolean>(false);
  const { theme: appTheme } = useTheme();
  const theme = useSharedValue<typeof appTheme>(appTheme);
  const ref = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const animation = useAnimatedStyle(() => ({
    borderBottomColor: withTiming(focus.value ? COLORS.emerald[500] : (theme.value == "dark" ? "rgba(255, 255, 255, .8)" : "rgba(0, 0, 0, .8)"), {
      duration: 200,
      easing: Easing.inOut(Easing.quad),
    }),
  }));

  useEffect(() => {
    theme.value = appTheme;
  }, [appTheme]);

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
        translateY: withTiming(focus.value ? -20 : 9, {
          duration: 200,
          easing: Easing.inOut(Easing.quad),
        }),
      },
    ]
  }));

  return (
    <View className="w-full flex items-center px-3">
      <InputAnimated
        {...rest}
        ref={ref}
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
        // placeholderTextColor={appTheme == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .5)"}
        style={[
          {
            width,
            height,
            paddingRight,
          },
          animation,
        ]}
        className="border-b-2 text-xl dark:text-white/80 text-black/80"
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