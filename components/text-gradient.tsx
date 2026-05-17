import { useEffect, useState } from "react";
import { ColorValue, Text, View } from "react-native";

interface Props {
    children: string | number;
    className?: string;
    colors: ColorValue[];
}

/**
 * 
 * @param children The chain of characters that will be display
 * 
 * @param className The list of classes that will be set the to the displayed element
 * 
 * @param colors The list of colors that will be used
 * 
 * @returns 
 */

export const TextGradient = ({ children, className, colors }: Props) => {
    const [text, setText] = useState<typeof children>(children);
    const [count, setCount] = useState<number>(0);

    useEffect(() => {
        setText(children);
        setCount(String(children).length / colors.length);
    }, [colors, children]);

    return (
        <View className="flex-row items-center">
            {
                colors.map((color, i) => {
                    const start = i * count;
                    const end = start + count;

                    return (
                        <Text
                            key={i}
                            className={className}
                            style={{ color }}
                        >
                            {String(text).slice(start, end)}
                        </Text>
                    );
                })
            }
        </View>
    );
};