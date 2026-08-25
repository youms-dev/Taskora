import { Entypo, Feather, FontAwesome, FontAwesome5, FontAwesome6, Fontisto, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export const ICON_LIBRARIES = {
    FontAwesome6,
    FontAwesome,
    FontAwesome5,
    MaterialCommunityIcons,
    Feather,
    Fontisto,
    Entypo,
    Ionicons,
} as const;

type IconProps = {
    library: keyof typeof ICON_LIBRARIES;
    name: string;
    size?: number;
    color?: string;
};

export function Icon({ library, name, size = 24, color = "black" }: IconProps) {
    const IconComponent = ICON_LIBRARIES[library];

    return (
        <IconComponent
            name={name as any}
            size={size}
            color={color}
        />
    );
}