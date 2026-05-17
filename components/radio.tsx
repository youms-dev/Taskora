import { View } from "react-native";

interface Props {
    active?: boolean;
    size?: number;
}

/**
 * 
 * @param active A boolean property that define whether it's active or not
 * @default false
 * 
 * @param size The size of the radio
 * @default 30
 * 
 * @returns The radio component
 */

export const Radio = ({ active = false, size = 30 }: Props) => {
    return (
        <View
            style={{
                width: size,
                height: size,
            }}
            className="flex justify-center items-center dark:bg-white/20 bg-black/20 rounded-full p-2"
        >
            {
                active && (
                    <View className="size-full rounded-full bg-emerald-500" />
                )
            }
        </View>
    );
}