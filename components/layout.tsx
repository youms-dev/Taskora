import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import "../app/global.css";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider } from "@/hooks/use-theme";
import { useEffect, useState } from "react";
import { useColorScheme } from "nativewind";
import { AuthProvider } from "@/hooks/auth-provider";

interface Props {
    children: React.ReactNode;
}

export const LayoutComponent = ({ children }: Props) => {
    const { colorScheme } = useColorScheme();
    const [themeValue, setThemeValue] = useState<"dark" | "light">("dark");

    useEffect(() => {
        if (colorScheme === "dark") setThemeValue("dark");
        else setThemeValue("light");
    }, [colorScheme]);

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: themeValue == "dark" ? "black" : "white" }}>
                <StatusBar style={themeValue == "dark" ? "light" : "dark"} animated />
                <GestureHandlerRootView>
                    <ThemeProvider>
                        <AuthProvider>
                            {children}
                        </AuthProvider>
                    </ThemeProvider>
                </GestureHandlerRootView>
            </SafeAreaView>
        </SafeAreaProvider>
    )
}