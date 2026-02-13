import { THEME_STORAGE } from "@/constants/names";
import { useAsyncStorage } from "@react-native-async-storage/async-storage";
import { useColorScheme } from "nativewind";
import { createContext, useContext, useEffect, useState } from "react";

type ThemeType = "light" | "dark";

const ThemeContext = createContext<{
    theme: ThemeType;
    setTheme: (value: ThemeType | "system") => void;
}>({
    theme: "dark",
    setTheme: () => null,
});

interface Props {
    children: React.ReactNode;
}

export const ThemeProvider = ({ children }: Props) => {
    const { colorScheme, setColorScheme } = useColorScheme();
    const [theme, setTheme] = useState<"light" | "dark">("dark");
    const { setItem, getItem } = useAsyncStorage(THEME_STORAGE);

    const getThemeSaved = async () => {
        const themeSaved = await getItem();

        if (themeSaved && ["light", "dark", "system"].includes(themeSaved)) {
            setColorScheme(themeSaved as ("light" | "dark" | "system"));
        }
    };

    useEffect(() => {
        getThemeSaved();
    }, []);

    useEffect(() => {
        if (!colorScheme) {
            setTheme(colorScheme! as ThemeType);
        }
        else if (colorScheme === "dark") {
            setTheme("dark");
        }
        else {
            setTheme("light");
        }
    }, [colorScheme]);

    const toggleTheme = async (value: "light" | "dark" | "system") => {
        setColorScheme(value);
        await setItem(value);
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme: toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);