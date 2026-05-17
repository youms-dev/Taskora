import { ColorValue, View } from "react-native";

interface Props {
    border?: number;
    scale?: number;
    color?: ColorValue;
    blur?: `${string}px`;
    opacity?: number;
    translateY?: number;
}

/**
 * 
 * @param border Define the border width
 * @default 2
 * 
 * @param scale Define the scale of the shadow
 * @default 1.05
 * 
 * @param color Define the shadow color
 * @default "black"
 * 
 * @param blur Define how the shadow is visible 
 * @default "5px"
 * 
 * @param opacity Give the shadow's opacity 
 * @default 0.15
 * 
 * @param translateY Define the translation on y of the shadow 
 * @default 0
 * 
 * @returns Your shadow appearance 
 */

export const Shadow = ({ border = 2, scale = 1.05, color = "black", blur = "5px", opacity = .15, translateY = 0 }: Props) => {
    return (
        <View
            style={{
                borderWidth: border,
                borderColor: color,
                transform: [
                    {
                        scale,
                    },
                    {
                        translateY,
                    }
                ],
                filter: `blur(${blur})`,
                opacity,
            }}
            className="absolute top-0 size-full rounded-full border-t-transparent -z-10"
        />
    );
}