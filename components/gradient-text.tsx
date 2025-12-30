import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient, LinearGradientProps } from "expo-linear-gradient";
import { Text, View } from "react-native";

interface Props {
    text: string;
    colors: LinearGradientProps["colors"];
}

export const GradientText = ({ text, colors }: Props) => {
    return (
        <MaskedView
            style={{ height: 100, flexDirection: 'row' }}
            maskElement={
                <View
                    className="w-full h-full flex justify-center items-center"
                >
                    <Text
                        className="text-[60px] text-transparent font-bold"
                    >
                        Basic Mask
                    </Text>
                </View>
            }
        >
            <LinearGradient
                colors={["blue", "red"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Text
                    className="text-[60px] text-transparent font-bold"
                >
                    Basic Mask
                </Text>
            </LinearGradient>

        </MaskedView>
    );
}

