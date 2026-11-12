import { ReactNode } from "react";
import { pixelBasedPreset, Tailwind } from "react-email";
import { COLORS } from "../constants/colors";

interface Props {
    children: ReactNode;
}

export const Base = ({ children }: Props) => {
    return (
        <Tailwind
            config={{
                presets: [pixelBasedPreset],
                theme: {
                    extend: {
                        colors: {
                            primary: COLORS.emerald[500],
                            secondary: COLORS.emerald[400],
                            offwhite: '#fafbfb',
                        },
                        spacing: {
                            0: '0px',
                            20: '20px',
                            45: '45px',
                        },
                    },
                },
            }}
        >
            {children}
        </Tailwind>
    );
};