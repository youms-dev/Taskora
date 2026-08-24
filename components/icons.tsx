import { Entypo, Feather, Ionicons, MaterialCommunityIcons, FontAwesome, FontAwesome5, FontAwesome6, Fontisto, MaterialIcons } from "@expo/vector-icons";

const ICON_LIBRARIES = {
    Entypo,
    Feather,
    Ionicons,
    MaterialCommunityIcons,
} as const;

type IconProps = {
    library: keyof typeof ICON_LIBRARIES;
    name: string;
    size?: number;
    color?: string;
};

export function Icon({ library, name, size = 24, color = "black"}: IconProps) {
    const IconComponent = ICON_LIBRARIES[library];

    return (
        <IconComponent
            name={name as any}
            size={size}
            color={color}
        />
    );
}