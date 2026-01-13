import clsx from 'clsx';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { AUTH_STORAGE } from '@/constants/names';
import { AppState } from 'react-native';

interface Props {
  children: React.ReactNode;
  center?: boolean;
  centerX?: boolean;
  centerY?: boolean;
}

export const Container = ({ children, center = false, centerX = false, centerY = false }: Props) => {
  const { theme } = useTheme();
  const appTheme = useSharedValue<typeof theme>("dark");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    appTheme.value = theme;
  }, [theme]);

  const viewAnimation = useAnimatedStyle(() => ({
    backgroundColor: withTiming(appTheme.value == "dark" ? "black" : "white", {
      duration: 300,
      easing: Easing.inOut(Easing.quad),
    })
  }));

  useEffect(() => {
    const handleLocalAuth = async () => {
      const { getItem, setItem } = useAsyncStorage(AUTH_STORAGE);
      const exists = await getItem();

      if (
        exists != null
        &&
        (
          AppState.currentState === "background"
          ||
          AppState.currentState === "inactive"
        )
        &&
        !["/", "/login", "/register", "/hardware-auth", "/onboarding"].includes(pathname)
      ) {
        await setItem(JSON.stringify({
          verified: false,
        }));
        router.replace("/hardware-auth");
      }
    }
    const { remove } = AppState.addEventListener("change", handleLocalAuth);

    return () => remove();
  }, [pathname]);

  return (
    <Animated.View
      style={viewAnimation}
      className={clsx(
        'relative flex flex-1 flex-col pt-5',
        center && !centerX && !centerY && 'items-center justify-center',
        !center && centerX && !centerY && 'items-center',
        !center && !centerX && centerY && 'justify-center',
      )}>
      {children}
    </Animated.View>
  );
};
