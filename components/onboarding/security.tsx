import { COLORS } from '@/constants/colors';
import { useTheme } from '@/hooks/use-theme';
import React, { memo, useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
    Easing,
    Extrapolation,
    SharedValue,
    cancelAnimation,
    interpolate,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

const EMERALD = COLORS.emerald[500];

const W = 300;
const H = 190;

const PIN = [
    { key: 0, at: 0.15 },
    { key: 4, at: 0.25 },
    { key: 8, at: 0.35 },
    { key: 9, at: 0.45 },
];

const KEY_X = [124, 150, 176];

const KEYS = Array.from({ length: 10 }).map((_, n) => ({
    x: n < 9 ? KEY_X[n % 3] : 150,
    y: n < 9 ? 104 + Math.floor(n / 3) * 21 : 167,
}));

const useColors = () => {
    const { theme } = useTheme();
    const dark = theme === 'dark';

    return {
        muted: dark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.2)',
        key: dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)',
        phone: dark ? 'rgb(0,0,0)' : 'rgb(242,242,242)',
    };
};

const Phone = () => {
    const { muted, phone } = useColors();

    return (
        <View
            style={{
                position: 'absolute',
                left: 100,
                top: 6,
                width: 100,
                height: 178,
                borderRadius: 16,
                backgroundColor: phone,
                borderWidth: 1,
                borderColor: muted,
            }}
        >
            <View
                style={{
                    position: 'absolute',
                    left: 34,
                    top: 5,
                    width: 30,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: muted,
                }}
            />
        </View>
    );
};

const Lock = ({ t }: { t: SharedValue<number> }) => {
    const haloStyle = useAnimatedStyle(() => ({
        opacity: interpolate(t.value, [0.6, 0.68, 0.76], [0, 0.35, 0], Extrapolation.CLAMP),
        transform: [
            { scale: interpolate(t.value, [0.6, 0.76], [0.6, 1.6], Extrapolation.CLAMP) },
        ],
    }));

    const shackleStyle = useAnimatedStyle(() => {
        const c = interpolate(t.value, [0.55, 0.63], [0, 1], Extrapolation.CLAMP);
        const fade = interpolate(t.value, [0.9, 0.98], [1, 0], Extrapolation.CLAMP);
        const p = c * fade;

        return {
            opacity: 0.45 + 0.55 * p,
            transform: [{ translateY: -5 * (1 - p) }],
        };
    });

    const bodyStyle = useAnimatedStyle(() => {
        const c = interpolate(t.value, [0.55, 0.63], [0, 1], Extrapolation.CLAMP);
        const fade = interpolate(t.value, [0.9, 0.98], [1, 0], Extrapolation.CLAMP);

        return {
            opacity: 0.45 + 0.55 * c * fade,
        };
    });

    return (
        <>
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        left: 150 - 22,
                        top: 52 - 22,
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: EMERALD,
                    },
                    haloStyle,
                ]}
            />

            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        left: 144,
                        top: 33,
                        width: 12,
                        height: 12,
                        borderTopLeftRadius: 6,
                        borderTopRightRadius: 6,
                        borderWidth: 2.2,
                        borderBottomWidth: 0,
                        borderColor: EMERALD,
                    },
                    shackleStyle,
                ]}
            />

            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        left: 140,
                        top: 44,
                        width: 20,
                        height: 16,
                        borderRadius: 4,
                        backgroundColor: EMERALD,
                        alignItems: 'center',
                        justifyContent: 'center',
                    },
                    bodyStyle,
                ]}
            >
                <View
                    style={{
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: 'rgba(0,0,0,.45)',
                    }}
                />
            </Animated.View>
        </>
    );
};

type DotProps = {
    index: number;
    at: number;
    t: SharedValue<number>;
};

const PinDot = ({ index, at, t }: DotProps) => {
    const { muted } = useColors();

    const fillStyle = useAnimatedStyle(() => {
        const p = interpolate(t.value, [at, at + 0.05], [0, 1], Extrapolation.CLAMP);
        const fade = interpolate(t.value, [0.9, 0.98], [1, 0], Extrapolation.CLAMP);

        return {
            opacity: p * fade,
            transform: [{ scale: 0.6 + 0.4 * p }],
        };
    });

    const left = 150 + (index - 1.5) * 16 - 4;

    return (
        <>
            <View
                style={{
                    position: 'absolute',
                    left,
                    top: 74,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    borderWidth: 1.5,
                    borderColor: muted,
                }}
            />
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        left,
                        top: 74,
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: EMERALD,
                    },
                    fillStyle,
                ]}
            />
        </>
    );
};

const KeyPad = () => {
    const { key } = useColors();

    return (
        <>
            {KEYS.map((k, i) => (
                <View
                    key={i}
                    style={{
                        position: 'absolute',
                        left: k.x - 7,
                        top: k.y - 7,
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: key,
                    }}
                />
            ))}
        </>
    );
};

type PressProps = {
    x: number;
    y: number;
    at: number;
    t: SharedValue<number>;
};

const KeyPress = ({ x, y, at, t }: PressProps) => {
    const style = useAnimatedStyle(() => ({
        opacity: interpolate(
            t.value,
            [at - 0.02, at, at + 0.05],
            [0, 0.9, 0],
            Extrapolation.CLAMP,
        ),
        transform: [
            {
                scale: interpolate(
                    t.value,
                    [at - 0.02, at, at + 0.05],
                    [0.8, 1.1, 1],
                    Extrapolation.CLAMP,
                ),
            },
        ],
    }));

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    left: x - 7,
                    top: y - 7,
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: EMERALD,
                },
                style,
            ]}
        />
    );
};

const chipBase = {
    position: 'absolute' as const,
    top: 95 - 18,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,.8)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
};

const PinChip = ({ pulse }: { pulse: SharedValue<number> }) => {
    const style = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(pulse.value, [0, 1], [0.94, 1.06]) }],
    }));

    return (
        <Animated.View style={[chipBase, { left: 42 - 18 }, style]}>
            <View style={{ flexDirection: 'row', gap: 4 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                    <View
                        key={i}
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: EMERALD,
                        }}
                    />
                ))}
            </View>
        </Animated.View>
    );
};

const ToggleChip = ({
    t,
    pulse,
}: {
    t: SharedValue<number>;
    pulse: SharedValue<number>;
}) => {
    const style = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(pulse.value, [0, 1], [0.94, 1.06]) }],
    }));

    const onStyle = useAnimatedStyle(() => {
        const c = interpolate(t.value, [0.55, 0.63], [0, 1], Extrapolation.CLAMP);
        const fade = interpolate(t.value, [0.9, 0.98], [1, 0], Extrapolation.CLAMP);

        return { opacity: c * fade };
    });

    const knobStyle = useAnimatedStyle(() => {
        const c = interpolate(t.value, [0.55, 0.63], [0, 1], Extrapolation.CLAMP);
        const fade = interpolate(t.value, [0.9, 0.98], [1, 0], Extrapolation.CLAMP);

        return { transform: [{ translateX: 10 * c * fade }] };
    });

    return (
        <Animated.View style={[chipBase, { left: 258 - 18 }, style]}>
            <View
                style={{
                    width: 24,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: 'rgba(255,255,255,.3)',
                    overflow: 'hidden',
                }}
            >
                <Animated.View
                    style={[
                        {
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: 24,
                            height: 14,
                            backgroundColor: EMERALD,
                        },
                        onStyle,
                    ]}
                />
                <Animated.View
                    style={[
                        {
                            position: 'absolute',
                            left: 2,
                            top: 2,
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: '#fff',
                        },
                        knobStyle,
                    ]}
                />
            </View>
        </Animated.View>
    );
};

const DottedLine = ({ left }: { left: number }) => (
    <>
        {Array.from({ length: 6 }).map((_, i) => (
            <View
                key={i}
                style={{
                    position: 'absolute',
                    left: left + i * 7,
                    top: 95 - 0.75,
                    width: 3,
                    height: 1.5,
                    borderRadius: 1,
                    backgroundColor: EMERALD,
                    opacity: 0.25,
                }}
            />
        ))}
    </>
);

interface Props {
    width?: number;
    height?: number;
}

export const Security = memo(({ width = 360, height }: Props) => {
    const h = height ?? width * (H / W);
    const scale = Math.min(width / W, h / H);

    const t = useSharedValue(0);
    const pulse = useSharedValue(0);
    const flow = useSharedValue(0);

    const reduceMotion = useReducedMotion();

    useEffect(() => {
        if (reduceMotion) {
            t.value = 0.85;
            pulse.value = 0.5;
            flow.value = 0;
            return;
        }

        t.value = withRepeat(
            withTiming(1, { duration: 7000, easing: Easing.linear }),
            -1,
            false,
        );

        pulse.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1000, easing: Easing.out(Easing.ease) }),
                withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
            ),
            -1,
            false,
        );

        flow.value = withRepeat(
            withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
            -1,
            false,
        );

        return () => {
            cancelAnimation(t);
            cancelAnimation(pulse);
            cancelAnimation(flow);
        };
    }, [reduceMotion, t, pulse, flow]);

    const leftParticleStyle = useAnimatedStyle(() => ({
        opacity: interpolate(flow.value, [0, 0.15, 0.75, 1], [0, 1, 1, 0]),
        transform: [{ translateX: interpolate(flow.value, [0, 1], [0, 34]) }],
    }));

    const rightParticleStyle = useAnimatedStyle(() => ({
        opacity: interpolate(flow.value, [0, 0.15, 0.75, 1], [0, 1, 1, 0]),
        transform: [{ translateX: interpolate(flow.value, [0, 1], [0, -34]) }],
    }));

    return (
        <View
            style={{
                width,
                height: h,
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <View
                style={{
                    width: W,
                    height: H,
                    transform: [{ scale }],
                }}
            >
                <Phone />
                <Lock t={t} />

                {PIN.map((p, i) => (
                    <PinDot key={i} index={i} at={p.at} t={t} />
                ))}

                <KeyPad />

                {PIN.map((p, i) => (
                    <KeyPress
                        key={i}
                        x={KEYS[p.key].x}
                        y={KEYS[p.key].y}
                        at={p.at}
                        t={t}
                    />
                ))}

                <DottedLine left={62} />
                <DottedLine left={202} />

                <PinChip pulse={pulse} />
                <ToggleChip t={t} pulse={pulse} />

                <Animated.View
                    style={[
                        {
                            position: 'absolute',
                            left: 66 - 3,
                            top: 95 - 3,
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: EMERALD,
                        },
                        leftParticleStyle,
                    ]}
                />
                <Animated.View
                    style={[
                        {
                            position: 'absolute',
                            left: 234 - 3,
                            top: 95 - 3,
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: EMERALD,
                        },
                        rightParticleStyle,
                    ]}
                />
            </View>
        </View>
    );
});