import { ICON_LIBRARIES } from "@/components/icon";

export type ICON_TYPE = {
    name: string;
    packageName: keyof typeof ICON_LIBRARIES;
}

export const ICONS: ICON_TYPE[] = [
    {
        name: "briefcase",
        packageName: "Entypo",
    },
    {
        name: "envelope",
        packageName: "FontAwesome",
    },
    {
        name: "phone",
        packageName: "FontAwesome6",
    },
    {
        name: "users",
        packageName: "FontAwesome5",
    },
    {
        name: "file-contract",
        packageName: "FontAwesome5",
    },
    {
        name: "home",
        packageName: "FontAwesome5",
    },
    {
        name: "heart",
        packageName: "FontAwesome",
    },
    {
        name: "shopping-cart",
        packageName: "FontAwesome5",
    },
    {
        name: "dollar-sign",
        packageName: "FontAwesome5",
    },
    {
        name: "book-open-page-variant",
        packageName: "MaterialCommunityIcons",
    },
    {
        name: "activity",
        packageName: "Feather",
    },
    {
        name: "coffeescript",
        packageName: "Fontisto",
    },
    {
        name: "music",
        packageName: "FontAwesome5",
    },
    {
        name: "camera",
        packageName: "Entypo",
    },
    {
        name: "film",
        packageName: "Fontisto",
    },
    {
        name: "alert-circle-sharp",
        packageName: "Ionicons",
    },
    {
        name: "flag",
        packageName: "Entypo",
    },
    {
        name: "star-half-sharp",
        packageName: "Ionicons",
    },
    {
        name: "map-pin",
        packageName: "Feather",
    },
    {
        name: "navigation-variant",
        packageName: "MaterialCommunityIcons",
    },
];