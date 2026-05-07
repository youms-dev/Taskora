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
}

export const Container = ({ children, center = false, centerX = false, centerY = false }: Props) => {
  const { theme } = useTheme();
  const appTheme = useSharedValue<typeof theme>("dark");

  useEffect(() => {
    appTheme.value = theme;
  }, [theme]);

  const viewAnimation = useAnimatedStyle(() => ({
    backgroundColor: withTiming(appTheme.value == "dark" ? "black" : "white", {
      duration: 300,
      easing: Easing.inOut(Easing.quad),
    }),
  }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme == "dark" ? "black" : "white" }}>
      <StatusBar style={theme == "dark" ? "light" : "dark"} animated />
      <Animated.View
        style={viewAnimation}
        className={clsx(
          'size-full flex flex-1 flex-col pt-5',
          center && !centerX && !centerY && 'items-center justify-center',
          !center && centerX && !centerY && 'items-center',
          !center && !centerX && centerY && 'justify-center',
        )}>
        {children}
      </Animated.View>
    </SafeAreaView>
  );
};
