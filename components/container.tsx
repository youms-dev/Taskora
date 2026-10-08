import { useTheme } from "@/hooks/use-theme";
import clsx from "clsx";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  children: React.ReactNode;
  center?: boolean;
  centerX?: boolean;
  centerY?: boolean;
  safeArea?: boolean;
  background?: string
  statusBarColor?: "light" | "dark";
}

/**
 * 
 * @param children
 * @param center
 * @default false
 * 
 * @param centerX
 * @default false
 * 
 * @param centerY
 * @default false
 * 
 * @param safeArea Whether the container is safe area
 * @default true
 * 
 * @param background
 * 
 * @param statusBarColor
 * 
 * @returns Container component
 */

export const Container = ({ children, center, centerX, centerY, safeArea = true, background: bg, statusBarColor }: Props) => {
  const { theme } = useTheme();
  const background = useSharedValue<typeof bg>(bg);

  useEffect(() => {
    background.value = bg;
  }, [bg]);

  const viewAnimation = useAnimatedStyle(() => ({
    backgroundColor: withTiming((
      background.value ?
        background.value
        :
        "rgba(0, 0, 0, 0)"
    ),
      {
        duration: 300,
        easing: Easing.inOut(Easing.quad),
      }
    ),
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
          "flex-1 flex flex-col",
          center && !centerX && !centerY && "items-center justify-center",
          !center && centerX && !centerY && "items-center",
          !center && !centerX && centerY && "justify-center",
        )}>
        {children}
      </Animated.View>
    </>
  );


  if (safeArea) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme == "dark" ? "rgba(0, 0, 0, 1)" : "rgba(0, 0, 0, .01)" }}>
        {Render}
      </SafeAreaView>
    );
  }

  return Render;
};
