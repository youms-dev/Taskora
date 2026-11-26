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
    withDelay,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

const EMERALD = COLORS.emerald[500];

const SIZE = 200;
const CENTER = SIZE / 2;
const CIRCLE = 84;

const PARTICLES = Array.from({ length: 14 }).map((_, i) => {
    const angle = (i * 360 * Math.PI) / (14 * 180);
    const radius = i % 2 === 0 ? 86 : 68;

    return {
        tx: Math.cos(angle) * radius,
        ty: Math.sin(angle) * radius,
        size: i % 2 === 0 ? 6 : 4,
        green: i % 3 !== 0,
    };
});

type RingProps = {
    offset: number;
    ripple: SharedValue<number>;
    enter: SharedValue<number>;
};

const Ring = ({ offset, ripple, enter }: RingProps) => {
    const style = useAnimatedStyle(() => {
        const p = (ripple.value + offset) % 1;
        const e = interpolate(enter.value, [0.6, 1], [0, 1], Extrapolation.CLAMP);

        return {
            opacity: interpolate(p, [0, 1], [0.35, 0]) * e,
            transform: [{ scale: interpolate(p, [0, 1], [1, 2.2]) }],
        };
    });

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    left: CENTER - CIRCLE / 2,
                    top: CENTER - CIRCLE / 2,
                    width: CIRCLE,
                    height: CIRCLE,
                    borderRadius: CIRCLE / 2,
                    borderWidth: 2,
                    borderColor: EMERALD,
                },
                style,
            ]}
        />
    );
};

type ParticleProps = {
    tx: number;
    ty: number;
    size: number;
    color: string;
    burst: SharedValue<number>;
};

const Particle = ({ tx, ty, size, color, burst }: ParticleProps) => {
    const style = useAnimatedStyle(() => ({
        opacity: interpolate(burst.value, [0, 0.15, 0.7, 1], [0, 1, 1, 0]),
        transform: [
            { translateX: tx * burst.value },
            { translateY: ty * burst.value },
            { scale: interpolate(burst.value, [0, 0.3, 1], [0.4, 1, 0.6]) },
        ],
    }));

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    left: CENTER - size / 2,
                    top: CENTER - size / 2,
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color,
                },
                style,
            ]}
        />
    );
};

interface Props {
    size?: number;
}

export const Success = memo(({ size = 240 }: Props) => {
    const scale = size / SIZE;
    const { theme } = useTheme();
    const muted = theme === 'dark' ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.25)';

    const enter = useSharedValue(0);
    const check = useSharedValue(0);
    const burst = useSharedValue(0);
    const ripple = useSharedValue(0);

    const reduceMotion = useReducedMotion();

    useEffect(() => {
        if (reduceMotion) {
            enter.value = 1;
            check.value = 1;
            burst.value = 0;
            ripple.value = 0.5;
            return;
        }

        enter.value = withTiming(1, {
            duration: 700,
            easing: Easing.out(Easing.back(1.6)),
        });

        check.value = withDelay(
            450,
            withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
        );

        burst.value = withDelay(
            400,
            withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) }),
        );

        ripple.value = withDelay(
            600,
            withRepeat(
                withTiming(1, { duration: 2200, easing: Easing.out(Easing.ease) }),
                -1,
                false,
            ),
        );

        return () => {
            cancelAnimation(enter);
            cancelAnimation(check);
            cancelAnimation(burst);
            cancelAnimation(ripple);
        };
    }, [reduceMotion, enter, check, burst, ripple]);

    const circleStyle = useAnimatedStyle(() => ({
        opacity: interpolate(enter.value, [0, 0.4], [0, 1], Extrapolation.CLAMP),
        transform: [{ scale: enter.value }],
    }));

    const checkStyle = useAnimatedStyle(() => ({
        width: 34 * check.value,
    }));

    return (
        <View
            style={{
                width: size,
                height: size,
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <View
                style={{
                    width: SIZE,
                    height: SIZE,
                    transform: [{ scale }],
                }}
            >
                <Ring offset={0} ripple={ripple} enter={enter} />
                <Ring offset={0.5} ripple={ripple} enter={enter} />

                {PARTICLES.map((p, i) => (
                    <Particle
                        key={i}
                        tx={p.tx}
                        ty={p.ty}
                        size={p.size}
                        color={p.green ? EMERALD : muted}
                        burst={burst}
                    />
                ))}

                <Animated.View
                    style={[
                        {
                            position: 'absolute',
                            left: CENTER - CIRCLE / 2,
                            top: CENTER - CIRCLE / 2,
                            width: CIRCLE,
                            height: CIRCLE,
                            borderRadius: CIRCLE / 2,
                            backgroundColor: EMERALD,
                            alignItems: 'center',
                            justifyContent: 'center',
                        },
                        circleStyle,
                    ]}
                >
                    <View style={{ width: 34, height: 34 }}>
                        <Animated.View style={[{ height: 34, overflow: 'hidden' }, checkStyle]}>
                            <View
                                style={{
                                    position: 'absolute',
                                    left: 9,
                                    top: 3,
                                    width: 14,
                                    height: 26,
                                    borderRightWidth: 5,
                                    borderBottomWidth: 5,
                                    borderColor: '#fff',
                                    borderBottomRightRadius: 2,
                                    transform: [{ rotate: '45deg' }],
                                }}
                            />
                        </Animated.View>
                    </View>
                </Animated.View>
            </View>
        </View>
    );
});