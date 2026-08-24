import Entypo from "@expo/vector-icons/Entypo";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Fontisto from "@expo/vector-icons/Fontisto";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { ReactNode } from "react";

interface Props {
    color?: string;
    parentSize?: number;
}

export function getIcons(theme: "light" | "dark"): Array<{
    [key: string]: (({ color, parentSize }: Props) => ReactNode);
}> {
    // export function getIcons(theme: "light" | "dark") {
    return [
        {
            "briefcase": ({ color, parentSize = 45 }: Props) => (
                <Entypo
                    name="briefcase"
                    size={parentSize * .5}
                    color={color ? color : (theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)")}
                />
            )
        },
        {
            "envelope": ({ color, parentSize = 45 }: Props) => (
                <FontAwesome
                    name="envelope"
                    size={parentSize * .5}
                    color={color ? color : (theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)")}
                />
            )
        },
        {
            "phone": ({ color, parentSize = 45 }: Props) => (
                <FontAwesome6
                    name="phone"
                    size={parentSize * .45}
                    color={color ? color : (theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)")}
                />
            )
        },
        {
            "users": ({ color, parentSize = 45 }: Props) => (
                <FontAwesome5
                    name="users"
                    size={parentSize * .45}
                    color={color ? color : (theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)")}
                />
            )
        },
        {
            "file-contract": ({ color, parentSize = 45 }: Props) => (
                <FontAwesome5
                    name="file-contract"
                    size={parentSize * .45}
                    color={color ? color : (theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)")}
                />
            )
        },
        {
            "home": ({ color, parentSize = 45 }: Props) => (
                <FontAwesome5
                    name="home"
                    size={parentSize * .45}
                    color={color ? color : (theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)")}
                />
            )
        },
        {
            "heart": ({ color, parentSize = 45 }: Props) => (
                <FontAwesome
                    name="heart"
                    size={parentSize * .45}
                    color={color ? color : (theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)")}
                />
            )
        },
        {
            "shopping-cart": ({ color, parentSize = 45 }: Props) => (
                <FontAwesome5
                    name="shopping-cart"
                    size={parentSize * .45}
                    color={color ? color : (theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)")}
                />
            )
        },
        {
            "dollar-sign": ({ color, parentSize = 45 }: Props) => (
                <FontAwesome5
                    name="dollar-sign"
                    size={parentSize * .5}
                    color={color ? color : (theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)")}
                />
            )
        },
        {
            "book-open-page-variant": ({ color, parentSize = 45 }: Props) => (
                <MaterialCommunityIcons
                    name="book-open-page-variant"
                    size={parentSize * .5}
                    color={color ? color : (theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)")}
                />
            )
        },
        {
            "activity": ({ color, parentSize = 45 }: Props) => (
                <Feather
                    name="activity"
                    size={parentSize * .5}
                    color={color ? color : (theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)")}
                />
            )
        },
        {
            "coffeescript": ({ color, parentSize = 45 }: Props) => (
                <Fontisto
                    name="coffeescript"
                    size={parentSize * .45}
                    color={color ? color : (theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)")}
                />
            )
        },
        {
            "music": ({ color, parentSize = 45 }: Props) => (
                <FontAwesome5
                    name="music"
                    size={parentSize * .45}
                    color={color ? color : (theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)")}
                />
            )
        },
        {
            "camera": ({ color, parentSize = 45 }: Props) => (
                <Entypo
                    name="camera"
                    size={parentSize * .5}
                    color={color ? color : (theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)")}
                />
            )
        },
        {
            "film": ({ color, parentSize = 45 }: Props) => (
                <Fontisto
                    name="film"
                    size={parentSize * .5}
                    color={color ? color : (theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)")}
                />
            )
        },
        {
            "alert-circle-sharp": ({ color, parentSize = 45 }: Props) => (
                <Ionicons
                    name="alert-circle-sharp"
                    size={parentSize * .6}
                    color={color ? color : (theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)")}
                />
            )
        },
        {
            "flag": ({ color, parentSize = 45 }: Props) => (
                <Entypo
                    name="flag"
                    size={parentSize * .6}
                    color={color ? color : (theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)")}
                />
            )
        },
        {
            "star-half-sharp": ({ color, parentSize = 45 }: Props) => (
                <Ionicons
                    name="star-half-sharp"
                    size={parentSize * .6}
                    color={color ? color : (theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)")}
                />
            )
        },
        {
            "map-pin": ({ color, parentSize = 45 }: Props) => (
                <Feather
                    name="map-pin"
                    size={parentSize * .5}
                    color={color ? color : (theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)")}
                />
            )
        },
        {
            "navigation-variant": ({ color, parentSize = 45 }: Props) => (
                <MaterialCommunityIcons
                    name="navigation-variant"
                    size={parentSize * .5}
                    color={color ? color : (theme == "dark" ? "rgba(255, 255, 255, .6)" : "rgba(0, 0, 0, .6)")}
                />
            )
        },
    ];
}