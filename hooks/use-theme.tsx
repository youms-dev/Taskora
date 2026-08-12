import { THEME_STORAGE } from "@/constants/names";
import { useAsyncStorage } from "@react-native-async-storage/async-storage";
import { useColorScheme } from "nativewind";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
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
    const { colorScheme, setColorScheme } = useColorScheme();
    const [theme, setTheme] = useState<ThemeType>(colorScheme == "dark" ? "dark" : "light");
    const [target, setTarget] = useState<ThemeType | "system">("system");
    const themeShared = useSharedValue<ThemeType>(colorScheme == "dark" ? "dark" : "light");

    const changeTheme = useCallback(async (value: ThemeType | "system") => {
        const { setItem } = useAsyncStorage(THEME_STORAGE);

        setColorScheme(value);
        await setItem(value);
        if (value === "system") {
            setTheme(colorScheme as ThemeType);
            setTarget("system");
        }
        else {
            setTarget(colorScheme == "light" ? "light" : "dark");
            setTheme(colorScheme == "light" ? "light" : "dark");
        }
    }, []);

    useEffect(() => {
        (async () => {
            const { getItem, removeItem } = useAsyncStorage(THEME_STORAGE);
            const themeSaved = await getItem();

            if (themeSaved && ["light", "dark", "system"].includes(themeSaved)) {
                setColorScheme(themeSaved as ThemeType | "system");
                if (themeSaved == "system") {
                    setTheme(colorScheme! as ThemeType);
                    setTarget("system");
                }
                else {
                    setTarget(themeSaved == "light" ? "light" : "dark");
                    setTheme(themeSaved == "light" ? "light" : "dark");
                }
            }
            else {
                await removeItem();
            }
        })();
    }, [colorScheme]);

    useEffect(() => {
        themeShared.value = theme;
    }, [theme]);

    return (
        <Context.Provider value={{
            theme,
            target,
            setTheme: changeTheme,
            themeShared,
        }}>
            {children}
        </Context.Provider>
    );
}

export const useTheme = () => {
    const ctx = useContext(Context);

    if (!ctx) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    
    return ctx;
};