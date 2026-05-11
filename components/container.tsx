import { useTheme } from '@/hooks/use-theme';
import clsx from 'clsx';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  children: React.ReactNode;
  center?: boolean;
  centerX?: boolean;
  centerY?: boolean;
  safeArea?: boolean;
  background?: {
    dark: string;
    light: string;
  }
  statusBarColor?: "light" | "dark";
}

/**
 * 
 * @param children Container children
 * @param center Whether the container is centered
 * @default false
 * 
 * @param centerX Whether the container is centered in the x axis
 * @default false
 * 
 * @param centerY Whether the container is centered in the y axis
 * @default false
 * 
 * @param safeArea Whether the container is safe area
 * @default true
 * 
 * @param background The container background
 * 
 * @param statusBarColor The status bar text color
 * 
 * @returns Container component
 */

export const Container = ({ children, center, centerX, centerY, safeArea = true, background: bg, statusBarColor }: Props) => {
  const { theme } = useTheme();
  const appTheme = useSharedValue<typeof theme>("dark");
  const background = useSharedValue<typeof bg>(bg);

  useEffect(() => {
    appTheme.value = theme;
    background.value = bg;
  }, [theme, bg]);

  const viewAnimation = useAnimatedStyle(() => ({
    backgroundColor: withTiming(background.value ? (appTheme.value == "dark" ? background.value.dark : background.value.light) : "transparent", {
      duration: 300,
      easing: Easing.inOut(Easing.quad),
    }),
  }));
  const Render = (
    <>
      <StatusBar
        style={statusBarColor ? statusBarColor : (theme == "dark" ? "light" : "dark")}
        animated
      />
      <Animated.View
        style={viewAnimation}
        className={clsx(
          'size-full flex flex-col',
          center && !centerX && !centerY && 'items-center justify-center',
          !center && centerX && !centerY && 'items-center',
          !center && !centerX && centerY && 'justify-center',
        )}>
        {children}
      </Animated.View>
    </>
  );

  if (safeArea) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme == "dark" ? "rgba(0, 0, 0)" : "rgba(0, 0, 0, .05)" }}>
        {Render}
      </SafeAreaView>
    );
  }

  return Render;
};
