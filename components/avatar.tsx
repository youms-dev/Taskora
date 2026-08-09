import { memo } from "react";
import { View } from "react-native";
import { TextAnimated } from "./text-animated";

interface Props {
    size?: number;
    scale?: number;
    name: string;
}

/**
 * 
 * @param size Avatar size
 * @default 100
 * 
 * @param scale Avatar scale
 * @default 1
 * 
 * @param name Avatar name
 * 
 * @returns Avatar component
 */

export const Avatar = memo(({ size = 100, scale = 1, name }: Props) => {
    return (
        <View
            style={{
                width: size,
                height: size,
                transform: [{
                    scale
                }],
            }}
            className="shrink-0 rounded-full dark:bg-black bg-white"
        >
            <View className="size-full flex justify-center items-center rounded-full border dark:border-white/10 border-black/10 dark:bg-white/20 bg-black/5">
                <TextAnimated
                    numberOfLines={1}
                    style={{
                        fontSize: size * .5,
                    }}
                    className="font-bold"
                >
                    {name.trim().split(" ").map(l => l.charAt(0)).join("").toUpperCase().slice(0, 3)}
                </TextAnimated>
            </View>
        </View>
    );
})