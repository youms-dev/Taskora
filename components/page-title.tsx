import { useAuth } from "@/hooks/auth-provider";
import { useTheme } from "@/hooks/use-theme";
import Entypo from "@expo/vector-icons/Entypo";
import { Image } from "expo-image";
import { usePathname, useRouter } from "expo-router";
import { ReactNode } from "react";
import { useWindowDimensions, View, ViewProps } from "react-native";
import { Avatar } from "./avatar";
import { PressableAnimated } from "./pressable-animated";

interface Props extends Pick<ViewProps, "onLayout"> {
    children: ReactNode;
}

/**
 * @param children
 * 
 * @returns Page title component
 */

export const PageTitle = ({ children, ...rest }: Props) => {
    const { user } = useAuth();
    const router = useRouter();
    const { theme } = useTheme();
    const pathname = usePathname();
    const { width } = useWindowDimensions();

    return (
        <View
            {...rest}
            className="w-full h-[50px] flex flex-row justify-between items-center px-4"
        >
            {
                width > 200 && (
                    <View className="w-[50%] h-full flex flex-row items-center gap-3 overflow-hidden">
                        {children}
                    </View>
                )
            }

            <View className="absolute right-0 size-full flex flex-row justify-end items-center gap-6 px-3 pl-6 z-[1]">
                {
                    !["/settings"].includes(pathname) && (
                        <PressableAnimated onPress={() => router.navigate("/(protected)/(task)/archives")}>
                            <Entypo
                                name="archive"
                                size={25}
                                color={theme == "dark" ? "rgba(255, 255, 255, .5)" : "rgba(0, 0, 0, .5)"}
                            />
                        </PressableAnimated>
                    )
                }

                <PressableAnimated
                    className="size-[50px] rounded-full p-1"
                    onPress={() => router.navigate("/(protected)/(user)/profile")}
                >
                    {
                        user && !user.user_metadata.photoUrl && (
                            <Avatar
                                name={user.user_metadata.name}
                                size={50}
                            />
                        )
                    }
                    {
                        user && user.user_metadata.photoUrl && (
                            <Image
                                source={{ uri: process.env.EXPO_PUBLIC_SUPABASE_URL + "/storage/v1/object/public/files/" + user.user_metadata.photoUrl }}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: 9999,
                                }}
                                contentFit="cover"
                            />
                        )
                    }
                </PressableAnimated>
            </View>
        </View>
    );
} 