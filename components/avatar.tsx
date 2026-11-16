import { memo } from "react";
import { View } from "react-native";
import { TextAnimated } from "./text-animated";
import { useTheme } from "@/hooks/use-theme";
import { createAvatar } from "@/utils/tools";

interface Props {
    size?: number;
    name: string;
    background?: string;
}

/**
 * 
 * @param size
 * @default 100
 * 
 * @param name
 * 
 * @param background 
 * 
 * @returns Avatar component
 */

export const Avatar = memo(({ size = 100, name, background }: Props) => {
    const { theme } = useTheme();

    return (
        <View
            style={{
                width: size,
                height: size,
            }}
            className="shrink-0 rounded-full dark:bg-black bg-white"
        >
            <View
                style={{
                    backgroundColor: (
                        background ?
                            background
                            :
                            theme == "dark" ? "rgba(255, 255, 255, .2)" : "rgba(0, 0, 0, .05)"
                    ),
                    borderRadius: 9999,
                }}
                className="size-full flex justify-center items-center rounded-full border dark:border-white/10 border-black/10"
            >
                <TextAnimated
                    numberOfLines={1}
                    style={{
                        fontSize: size * .5,
                    }}
                    className="font-bold"
                >
                    {createAvatar(name)}
                </TextAnimated>
            </View>
        </View>
    );
})