import { useEffect, useState } from "react";
import { Text } from "react-native";
import { View } from "react-native";

interface Props {
    name: string;
    size?: number | "full";
    textSize?: number;
}

/**
 * 
 * @param name Picture name
 * 
 * @param size Picture size
 * @default 50
 * 
 * @param textSize Picture text size
 * @default 20
 * 
 * @returns Picture component
 */

export const Picture = ({ name, size = 50, textSize = 20 }: Props) => {
    const [displayName, setDisplayName] = useState<string>("");

    useEffect(() => {
        let str = "";

        if (name.trim().length === 0) {
            setDisplayName("TD");
            return;
        }
        const tab = name.trim().split(" ");
        const first = tab[0].charAt(0).toUpperCase();

        str = first;
        if(tab.length > 1) {
            const last = tab[tab.length - 1].charAt(0).toUpperCase();

            str += last;
        }
        setDisplayName(str);
    }, [name]);

    return (
        <View
            style={{
                width: size === "full" ? "100%" : size,
                height: size === "full" ? "100%" : size,
                borderRadius: 9999
            }}
            className="flex flex-row justify-center items-center dark:bg-white/20 bg-emerald-500/20"
        >
            <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{
                    fontSize: textSize,
                }}
                className="dark:text-white text-emerald-500 font-extrabold overflow-hidden p-2"
            >
                {displayName}
            </Text>
        </View>
    );
}