import { Keyboard, TextInput, TextInputProps, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome6';
import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import Animated, { useAnimatedStyle, withTiming, Easing, useSharedValue } from 'react-native-reanimated';
import { colors } from '@/constants/colors';
import { useTheme } from '@/hooks/use-theme';
import { PressableAnimated, PressableAnimatedProps } from './pressable';

interface Props extends TextInputProps {
  placeholder: string;
  icon?: {
    name: string;
    size?: number;
    touchable?: (() => void) | false;
    scale?: PressableAnimatedProps["scale"],
    top?: number;
  };
  value: string;
  big?: boolean;
}

export const Input = ({ placeholder, icon, value, big = false, ...rest }: Props) => {
  const Input = Animated.createAnimatedComponent(TextInput);
  const focused = useSharedValue<boolean>(false);
  const shine = useSharedValue<boolean>(false);
  const { theme } = useTheme();
  const ref = useRef<TextInput>(null);
  const appTheme = useSharedValue<typeof theme>("dark");

  useEffect(() => {
    appTheme.value = theme;
  }, [theme]);

  useEffect(() => {
    const { remove } = Keyboard.addListener("keyboardDidHide", () => {
      if (!ref.current) return;
      ref.current.blur();
    })

    return () => remove();
  }, []);

  const inputAnimation = useAnimatedStyle(() => ({
    borderBottomColor: withTiming(shine.value ? colors.emerald[500] : (appTheme.value == "dark" ? "white" : "black"), {
      duration: 400,
      easing: Easing.inOut(Easing.quad)
    }),
  }));

  return (
    <View className="relative flex h-max w-full flex-col">
      <Input
        {...rest}
        ref={ref}
        multiline={big}
        value={value}
        onFocus={() => {
          focused.value = true;
          shine.value = true;
        }}
        onBlur={() => {
          shine.value = false;
          if (value.trim().length == 0) {
            focused.value = false;
          }
        }}
        cursorColor={theme === "dark" ? "white" : colors.emerald[500]}
        textAlignVertical={"top"}
        placeholder={placeholder}
        placeholderTextColor={theme === "dark" ? "rgba(255, 255, 255, .6)" : "black"}
        style={inputAnimation}
        className={clsx(
          'w-full border-b-2 text-xl dark:text-white/90 text-black font-bold',
          big ? "h-[120px] px-2" : "h-12 pr-[50px]"
        )}
      />
      {
        icon && !big && (
          <PressableAnimated
            scale={icon.scale ?? 1}
            style={{
              top: icon.top ?? 5
            }}
            className="absolute right-2"
          >
            <FontAwesome
              name={icon.name}
              size={icon.size ?? 24}
              color={theme == "light" ? "black" : "white"}
              onPress={() => icon.touchable && icon.touchable()}
            />
          </PressableAnimated>
        )
      }
    </View>
  );
};
