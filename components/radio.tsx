import { COLORS } from "@/constants/colors";
import { useTheme } from "@/hooks/use-theme";
import { memo } from "react";
import { View } from "react-native";

interface Props {
    active?: boolean;
    size?: number;
    activeColor?: string;
    containerBackground?: string;
}

/**
 * 
 * @param active A boolean property that define whether it's active or not
 * @default false
 * 
 * @param size The size of the radio
 * @default 30
 * 
 * @param activeColor The color of the active radio
 * @default COLORS.emerald[500]
 * 
 * @param containerBackground The background color of the radio container
 * @default theme == "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)"
 * 
 * @returns The radio component
 */

export const Radio = memo(({ active = false, size = 30, activeColor, containerBackground }: Props) => {
    const { theme } = useTheme();

    return (
        <View
            style={{
                width: size,
                height: size,
                backgroundColor: containerBackground ?
                    containerBackground
                    :
                    theme == "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)"
            }}
            className="flex justify-center items-center rounded-full p-2"
        >
            {
                active && (
                    <View
                        style={{
                            backgroundColor: activeColor ? activeColor : COLORS.emerald[500],
                        }}
                        className="size-full rounded-full"
                    />
                )
            }
        </View>
    );
});