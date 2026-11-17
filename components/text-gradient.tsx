import { memo, useEffect, useState } from "react";
import { ColorValue, Text, TextProps } from "react-native";

interface Props extends TextProps {
    children: string | number | Array<string | number>;
    className?: string;
    colors: ColorValue[];
    style?: TextProps["style"];
}

/**
 * 
 * @param children
 * 
 * @param className
 * 
 * @param colors 
 * 
 * @param style 
 * 
 * @returns 
 */

export const TextGradient = memo(({ children, className, colors: textColors, style, ...rest }: Props) => {
    const [text, setText] = useState<typeof children>(children);
    const [count, setCount] = useState<number>(0);

    useEffect(() => {
        setText(children);
        setCount(String(children).length / textColors.length);
    }, [textColors, children, textColors]);

    return (
        <Text
            {...rest}
            style={[
                {
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center"
                },
                style,
            ]}
            className={className}
        >
            {
                textColors.map((color, i) => {
                    const start = i * count;
                    const end = start + count;

                    return (
                        <Text
                            key={i}
                            style={{ color }}
                        >
                            {String(text).slice(start, end)}
                        </Text>
                    );
                })
            }
        </Text>
    );
});