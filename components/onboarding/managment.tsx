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
    useDerivedValue,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

const EMERALD = COLORS.emerald[500];

const W = 300;
const H = 190;

type Clock = { readonly value: number };

const dayCx = (i: number) => 112.5 + i * 12.5;
const rowCy = (r: number) => 56 + r * 13;

const PILL_FROM = 112.5 + 2 * 12.5 - 5.5;
const PILL_TO = 112.5 + 4 * 12.5 - 5.5;

const EVENTS = [
    { r: 0, c: 2, color: EMERALD, at: 0.1 },
    { r: 1, c: 5, color: EMERALD, at: 0.22 },
    { r: 2, c: 1, color: EMERALD, at: 0.34 },
    { r: 3, c: 4, color: EMERALD, at: 0.46 },
    { r: 3, c: 1, color: EMERALD, at: 0.58 },
];

const RING_T = EVENTS.map((e) => e.at);
const RING_X = EVENTS.map((e) => dayCx(e.c) - 7);
const RING_Y = EVENTS.map((e) => rowCy(e.r) - 7);

const PLUS_IN = EVENTS.flatMap((e) => [e.at - 0.02, e.at, e.at + 0.04]);
const PLUS_OUT = EVENTS.flatMap(() => [1, 1.25, 1]);

const useColors = () => {
    const { theme } = useTheme();
    const dark = theme === 'dark';

    return {
        muted: dark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.2)',
        cell: dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.05)',
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

const WeekStrip = ({ t }: { t: Clock }) => {
    const { muted } = useColors();

    const pillStyle = useAnimatedStyle(() => ({
        left: interpolate(
            t.value,
            [0.55, 0.68],
            [PILL_FROM, PILL_TO],
            Extrapolation.CLAMP,
        ),
    }));

    return (
        <>
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        top: 28,
                        width: 11,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: EMERALD,
                        opacity: 0.25,
                    },
                    pillStyle,
                ]}
            />
            {Array.from({ length: 7 }).map((_, i) => (
                <View
                    key={i}
                    style={{
                        position: 'absolute',
                        left: dayCx(i) - 1.8,
                        top: 34 - 1.8,
                        width: 3.6,
                        height: 3.6,
                        borderRadius: 1.8,
                        backgroundColor: muted,
                    }}
                />
            ))}
        </>
    );
};

type RowProps = {
    y: number;
    w1: number;
    w2: number;
    from: number;
    to: number;
    t: Clock;
};

const TaskRow = ({ y, w1, w2, from, to, t }: RowProps) => {
    const { muted } = useColors();

    const fillStyle = useAnimatedStyle(() => {
        const p = interpolate(t.value, [from, to], [0, 1], Extrapolation.CLAMP);
        const fade = interpolate(t.value, [0.9, 0.98], [1, 0], Extrapolation.CLAMP);

        return {
            opacity: p * fade,
            transform: [{ scale: 0.6 + 0.4 * p }],
        };
    });

    return (
        <>
            <View
                style={{
                    position: 'absolute',
                    left: 115,
                    top: y - 6,
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    borderWidth: 1.5,
                    borderColor: muted,
                }}
            />

            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        left: 115,
                        top: y - 6,
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: EMERALD,
                        alignItems: 'center',
                        justifyContent: 'center',
                    },
                    fillStyle,
                ]}
            >
                <View
                    style={{
                        width: 3,
                        height: 6,
                        marginTop: -1,
                        borderRightWidth: 1.5,
                        borderBottomWidth: 1.5,
                        borderColor: '#fff',
                        transform: [{ rotate: '45deg' }],
                    }}
                />
            </Animated.View>

            <View
                style={{
                    position: 'absolute',
                    left: 133,
                    top: y - 4,
                    width: w1,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: muted,
                }}
            />
            <View
                style={{
                    position: 'absolute',
                    left: 133,
                    top: y + 4,
                    width: w2,
                    height: 3.5,
                    borderRadius: 2,
                    backgroundColor: muted,
                }}
            />
        </>
    );
};

const EventCard = ({ t }: { t: Clock }) => {
    const { muted } = useColors();

    const cardStyle = useAnimatedStyle(() => {
        const p = interpolate(t.value, [0.68, 0.78], [0, 1], Extrapolation.CLAMP);
        const fade = interpolate(t.value, [0.9, 0.98], [1, 0], Extrapolation.CLAMP);

        return {
            opacity: p * fade,
            transform: [{ translateY: (1 - p) * 8 }],
        };
    });

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    left: 110,
                    top: 140,
                    width: 80,
                    height: 32,
                    borderRadius: 8,
                    overflow: 'hidden',
                    backgroundColor: 'rgba(16,185,129,.14)',
                },
                cardStyle,
            ]}
        >
            <View
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: 3,
                    height: 32,
                    backgroundColor: EMERALD,
                }}
            />
            <View
                style={{
                    position: 'absolute',
                    left: 10,
                    top: 8,
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: muted,
                }}
            />
            <View
                style={{
                    position: 'absolute',
                    left: 10,
                    top: 18,
                    width: 26,
                    height: 3.5,
                    borderRadius: 2,
                    backgroundColor: muted,
                }}
            />

            <View
                style={{
                    position: 'absolute',
                    left: 61,
                    top: 10,
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    borderWidth: 1.4,
                    borderColor: EMERALD,
                }}
            >
                <View
                    style={{
                        position: 'absolute',
                        left: 4.4,
                        top: 1.6,
                        width: 1.2,
                        height: 4,
                        borderRadius: 1,
                        backgroundColor: EMERALD,
                    }}
                />
                <View
                    style={{
                        position: 'absolute',
                        left: 4.4,
                        top: 4.4,
                        width: 3.5,
                        height: 1.2,
                        borderRadius: 1,
                        backgroundColor: EMERALD,
                    }}
                />
            </View>
        </Animated.View>
    );
};

const CalendarHeader = ({ t }: { t: Clock }) => {
    const { muted } = useColors();

    const plusStyle = useAnimatedStyle(() => ({
        transform: [
            {
                scale: interpolate(t.value, PLUS_IN, PLUS_OUT, Extrapolation.CLAMP),
            },
        ],
    }));

    return (
        <>
            <View
                style={{
                    position: 'absolute',
                    left: 112,
                    top: 20,
                    width: 34,
                    height: 5,
                    borderRadius: 2.5,
                    backgroundColor: muted,
                }}
            />
            <View
                style={{
                    position: 'absolute',
                    left: 112,
                    top: 28,
                    width: 20,
                    height: 3.5,
                    borderRadius: 2,
                    backgroundColor: muted,
                }}
            />

            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        left: 176,
                        top: 18,
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: EMERALD,
                        alignItems: 'center',
                        justifyContent: 'center',
                    },
                    plusStyle,
                ]}
            >
                <View
                    style={{
                        position: 'absolute',
                        width: 6,
                        height: 1.6,
                        borderRadius: 1,
                        backgroundColor: '#fff',
                    }}
                />
                <View
                    style={{
                        position: 'absolute',
                        width: 1.6,
                        height: 6,
                        borderRadius: 1,
                        backgroundColor: '#fff',
                    }}
                />
            </Animated.View>

            {Array.from({ length: 7 }).map((_, i) => (
                <View
                    key={i}
                    style={{
                        position: 'absolute',
                        left: dayCx(i) - 3,
                        top: 41,
                        width: 6,
                        height: 2.5,
                        borderRadius: 1.2,
                        backgroundColor: muted,
                    }}
                />
            ))}
        </>
    );
};

const CalendarGrid = () => {
    const { cell } = useColors();

    return (
        <>
            {Array.from({ length: 35 }).map((_, n) => (
                <View
                    key={n}
                    style={{
                        position: 'absolute',
                        left: dayCx(n % 7) - 5,
                        top: rowCy(Math.floor(n / 7)) - 5,
                        width: 10,
                        height: 10,
                        borderRadius: 3,
                        backgroundColor: cell,
                    }}
                />
            ))}
        </>
    );
};

type EventCellProps = {
    r: number;
    c: number;
    color: string;
    at: number;
    t: Clock;
};

const EventCell = ({ r, c, color, at, t }: EventCellProps) => {
    const style = useAnimatedStyle(() => {
        const p = interpolate(t.value, [at, at + 0.05], [0, 1], Extrapolation.CLAMP);
        const fade = interpolate(t.value, [0.9, 0.98], [1, 0], Extrapolation.CLAMP);

        return {
            opacity: p * fade,
            transform: [{ scale: 0.5 + 0.5 * p }],
        };
    });

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    left: dayCx(c) - 5,
                    top: rowCy(r) - 5,
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    backgroundColor: color,
                },
                style,
            ]}
        />
    );
};

const SelectionRing = ({ t }: { t: Clock }) => {
    const style = useAnimatedStyle(() => {
        const fade = interpolate(t.value, [0.9, 0.98], [1, 0], Extrapolation.CLAMP);

        return {
            opacity: interpolate(t.value, [0.06, 0.1], [0, 1], Extrapolation.CLAMP) * fade,
            left: interpolate(t.value, RING_T, RING_X, Extrapolation.CLAMP),
            top: interpolate(t.value, RING_T, RING_Y, Extrapolation.CLAMP),
        };
    });

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    width: 14,
                    height: 14,
                    borderRadius: 5,
                    borderWidth: 1.5,
                    borderColor: EMERALD,
                },
                style,
            ]}
        />
    );
};

type AgendaProps = {
    top: number;
    color: string;
    from: number;
    to: number;
    t: Clock;
};

const AgendaRow = ({ top, color, from, to, t }: AgendaProps) => {
    const { muted, cell } = useColors();

    const style = useAnimatedStyle(() => {
        const p = interpolate(t.value, [from, to], [0, 1], Extrapolation.CLAMP);
        const fade = interpolate(t.value, [0.9, 0.98], [1, 0], Extrapolation.CLAMP);

        return {
            opacity: p * fade,
            transform: [{ translateY: (1 - p) * 8 }],
        };
    });

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    left: 110,
                    top,
                    width: 80,
                    height: 20,
                    borderRadius: 7,
                    overflow: 'hidden',
                    backgroundColor: cell,
                },
                style,
            ]}
        >
            <View
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: 3,
                    height: 20,
                    backgroundColor: color,
                }}
            />
            <View
                style={{
                    position: 'absolute',
                    left: 10,
                    top: 5,
                    width: 38,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: muted,
                }}
            />
            <View
                style={{
                    position: 'absolute',
                    left: 10,
                    top: 12,
                    width: 24,
                    height: 3.5,
                    borderRadius: 2,
                    backgroundColor: muted,
                }}
            />
            <View
                style={{
                    position: 'absolute',
                    left: 66,
                    top: 7,
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: color,
                }}
            />
        </Animated.View>
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

const TaskChip = ({ pulse }: { pulse: SharedValue<number> }) => {
    const style = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(pulse.value, [0, 1], [0.94, 1.06]) }],
    }));

    return (
        <Animated.View style={[chipBase, { left: 42 - 18 }, style]}>
            <View
                style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    borderWidth: 1.6,
                    borderColor: EMERALD,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <View
                    style={{
                        width: 4,
                        height: 8,
                        marginTop: -1.5,
                        borderRightWidth: 1.8,
                        borderBottomWidth: 1.8,
                        borderColor: EMERALD,
                        transform: [{ rotate: '45deg' }],
                    }}
                />
            </View>
        </Animated.View>
    );
};

const EventChip = ({ pulse }: { pulse: SharedValue<number> }) => {
    const style = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(pulse.value, [0, 1], [0.94, 1.06]) }],
    }));

    return (
        <Animated.View style={[chipBase, { left: 258 - 18 }, style]}>
            <View
                style={{
                    width: 18,
                    height: 17,
                    borderRadius: 4,
                    borderWidth: 1.6,
                    borderColor: EMERALD,
                    overflow: 'hidden',
                }}
            >
                <View
                    style={{
                        width: '100%',
                        height: 4,
                        backgroundColor: EMERALD,
                    }}
                />
                <View
                    style={{
                        position: 'absolute',
                        left: 3,
                        top: 7,
                        width: 3,
                        height: 3,
                        borderRadius: 1,
                        backgroundColor: EMERALD,
                    }}
                />
                <View
                    style={{
                        position: 'absolute',
                        left: 8,
                        top: 7,
                        width: 3,
                        height: 3,
                        borderRadius: 1,
                        backgroundColor: EMERALD,
                    }}
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

export const Management = memo(({ width = 360, height }: Props) => {
    const h = height ?? width * (H / W);
    const scale = Math.min(width / W, h / H);

    const t = useSharedValue(0);
    const pulse = useSharedValue(0);
    const flow = useSharedValue(0);

    const t1 = useDerivedValue(() => (t.value > 1 ? 0 : t.value));
    const t2 = useDerivedValue(() => (t.value < 1 ? 0 : t.value - 1));

    const reduceMotion = useReducedMotion();

    useEffect(() => {
        if (reduceMotion) {
            t.value = 0.85;
            pulse.value = 0.5;
            flow.value = 0;
            return;
        }

        t.value = withRepeat(
            withTiming(2, { duration: 14000, easing: Easing.linear }),
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

    const firstStyle = useAnimatedStyle(() => ({
        opacity: interpolate(t.value, [0.96, 1, 1.94, 2], [1, 0, 0, 1], Extrapolation.CLAMP),
    }));

    const secondStyle = useAnimatedStyle(() => ({
        opacity: interpolate(t.value, [0.96, 1.04, 1.9, 1.98], [0, 1, 1, 0], Extrapolation.CLAMP),
    }));

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

                <Animated.View
                    style={[
                        { position: 'absolute', left: 0, top: 0, width: W, height: H },
                        firstStyle,
                    ]}
                >
                    <WeekStrip t={t1} />

                    <TaskRow y={62} w1={50} w2={30} from={0.08} to={0.2} t={t1} />
                    <TaskRow y={90} w1={42} w2={26} from={0.28} to={0.4} t={t1} />
                    <TaskRow y={118} w1={46} w2={22} from={0.48} to={0.6} t={t1} />

                    <EventCard t={t1} />
                </Animated.View>

                <Animated.View
                    style={[
                        { position: 'absolute', left: 0, top: 0, width: W, height: H },
                        secondStyle,
                    ]}
                >
                    <CalendarHeader t={t2} />
                    <CalendarGrid />

                    {EVENTS.map((e, i) => (
                        <EventCell
                            key={i}
                            r={e.r}
                            c={e.c}
                            color={e.color}
                            at={e.at}
                            t={t2}
                        />
                    ))}

                    <SelectionRing t={t2} />

                    <AgendaRow top={126} color={EMERALD} from={0.64} to={0.72} t={t2} />
                    <AgendaRow top={150} color={EMERALD} from={0.74} to={0.82} t={t2} />
                </Animated.View>

                <DottedLine left={62} />
                <DottedLine left={202} />

                <TaskChip pulse={pulse} />
                <EventChip pulse={pulse} />

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