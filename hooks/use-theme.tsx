import { THEME_STORAGE } from "@/constants/names";
import { useAsyncStorage } from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Appearance, useColorScheme } from "react-native";
import { SharedValue, useSharedValue } from "react-native-reanimated";

type ThemeType = "light" | "dark";

type ContextType = {
    theme: ThemeType;
    target: ThemeType | "system";
    setTheme: (value: ThemeType | "system") => void;
    themeShared: SharedValue<ThemeType>;
};

const Context = createContext<ContextType | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const colorScheme = useColorScheme();

    const [theme, setTheme] = useState<ThemeType>(
        colorScheme === "dark" ? "dark" : "light"
    );

    const [target, setTarget] = useState<ThemeType | "system">("system");

    const themeShared = useSharedValue<ThemeType>(
        colorScheme === "dark" ? "dark" : "light"
    );

    const changeTheme = useCallback(async (value: ThemeType | "system") => {
        const { setItem, removeItem } = useAsyncStorage(THEME_STORAGE);

        if (value === "system") {
            Appearance.setColorScheme(null);
            setTarget("system");
            await removeItem();

            return;
        }

        await setItem(value);
        setTarget(value);
        setTheme(value);
        Appearance.setColorScheme(value);
    }, []);

    const handleThemeSaved = useCallback(async () => {
        const { getItem, removeItem } = useAsyncStorage(THEME_STORAGE);
        const themeSaved = await getItem();

        if (
            themeSaved
            &&
            ["light", "dark"].includes(themeSaved)
        ) {
            Appearance.setColorScheme(themeSaved as ThemeType);
            setTheme(themeSaved as ThemeType);
            setTarget(themeSaved as ThemeType);
        }
        else {
            await removeItem();
            Appearance.setColorScheme(null);
            setTarget("system");
        }
    }, []);

    useEffect(() => {
        handleThemeSaved();
    }, []);

    useEffect(() => {
        if (target === "system") {
            setTheme(colorScheme === "dark" ? "dark" : "light");
        }
    }, [colorScheme, target]);

    useEffect(() => {
        themeShared.value = theme;
    }, [theme, themeShared]);

    return (
        <Context.Provider
            value={{
                theme,
                target,
                setTheme: changeTheme,
                themeShared,
            }}
        >
            {children}
        </Context.Provider>
    );
};

export const useTheme = () => {
    const ctx = useContext(Context);

    if (!ctx) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }

    return ctx;
};