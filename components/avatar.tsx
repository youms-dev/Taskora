import { View } from "react-native";
import { TextAnimated } from "./text-animated";

interface Props {
    size?: number;
    scale?: number;
    name: {
        value: string;
        size?: number;
    };
}

export const Avatar = ({ size = 100, scale = 1, name }: Props) => {
    return (
        <View
            style={{
                width: size,
                height: size,
                transform: [{
                    scale
                }],
            }}
            className="flex shrink-0 justify-center items-center dark:bg-white/20 bg-black/20 rounded-full"
        >
            <TextAnimated
                style={{
                    fontSize: name.size,
                }}
                className="font-bold"
            >
                {name.value.trim().split(" ").map(l => l.charAt(0)).join("").toUpperCase()}
            </TextAnimated>
        </View>
    );
}