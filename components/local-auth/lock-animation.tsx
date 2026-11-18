import { useTheme } from '@/hooks/use-theme';
import React, { memo, useEffect } from 'react';
import { View } from 'react-native';
import Animated, { cancelAnimation, Easing, Extrapolation, interpolate, SharedValue, useAnimatedProps, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

const DURATION = 4200;
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const ramp = (progress: SharedValue<number>, input: number[], output: number[]) => {
    'worklet';
    return interpolate(progress.value, input, output, Extrapolation.CLAMP);
};

interface Props {
    width?: number;
    height?: number;
}

const PinDot = ({ progress, index }: { progress: SharedValue<number>; index: number }) => {
    const animatedProps = useAnimatedProps(() => ({
        opacity: ramp(progress, [0.47 + index * 0.045, 0.51 + index * 0.045], [0.2, 1]),
    }));
    return <AnimatedCircle cx={156 + index * 16} cy={133} r={4.5} fill="#10B981" animatedProps={animatedProps} />;
};

export const LocalAuthAnimation = memo(({ width = 360, height }: Props) => {
    const { theme } = useTheme();
    const dark = theme === 'dark';
    const progress = useSharedValue(0);
    const reduceMotion = useReducedMotion();
    const h = height ?? width * (280 / 360);
    const ink = dark ? '#FFFFFF' : '#18181B';
    const muted = dark ? 'rgba(255,255,255,.24)' : 'rgba(24,24,27,.18)';
    const surface = dark ? '#09090B' : '#FFFFFF';
    const softSurface = dark ? '#18181B' : '#F4F4F5';
    const green = '#10B981';

    useEffect(() => {
        if (reduceMotion) {
            progress.value = 0.84;
            return;
        }
        progress.value = 0;
        progress.value = withRepeat(
            withTiming(1, { duration: DURATION, easing: Easing.linear }),
            -1,
            false,
        );
        return () => cancelAnimation(progress);
    }, [progress, reduceMotion]);

    const fingerProps = useAnimatedProps(() => ({
        opacity: ramp(progress, [0, 0.05, 0.12, 0.4, 0.48, 1], [0, 1, 1, 1, 0, 0]),
    }));
    const pinProps = useAnimatedProps(() => ({
        opacity: ramp(progress, [0, 0.42, 0.49, 0.72, 0.79, 1], [0, 0, 1, 1, 0, 0]),
    }));
    const scanProps = useAnimatedProps(() => ({
        y: ramp(progress, [0.08, 0.34], [122, 190]),
        opacity: ramp(progress, [0.06, 0.1, 0.32, 0.38], [0, 0.8, 0.8, 0]),
    }));
    const checkGroupProps = useAnimatedProps(() => ({
        opacity: ramp(progress, [0, 0.72, 0.8, 0.94, 1], [0, 0, 1, 1, 0]),
    }));
    const checkProps = useAnimatedProps(() => ({
        strokeDashoffset: ramp(progress, [0, 0.78, 0.88, 0.94, 1], [24, 24, 0, 0, 24]),
    }));
    const lockProps = useAnimatedProps(() => ({
        opacity: ramp(progress, [0, 0.72, 0.8], [1, 1, 0]),
    }));

    return (
        <View style={{ width, height: h }} className="items-center justify-center">
            <Svg width={width} height={h} viewBox="0 0 360 280" preserveAspectRatio="xMidYMid meet">

                <Rect x={105} y={12} width={150} height={256} rx={27} fill={muted} />
                <Rect x={108} y={15} width={144} height={250} rx={24} fill={surface} />
                <Rect x={115} y={23} width={130} height={234} rx={18} fill={softSurface} />
                <Rect x={164} y={29} width={32} height={5} rx={2.5} fill={muted} />

                <Circle cx={180} cy={72} r={20} fill={dark ? '#27272A' : '#E4E4E7'} />
                <AnimatedG animatedProps={lockProps}>
                    <Path d="M174 71v-4a6 6 0 0 1 12 0v4" fill="none" stroke={ink} strokeWidth={2.3} strokeLinecap="round" />
                    <Rect x={172} y={70} width={16} height={13} rx={3} fill="none" stroke={ink} strokeWidth={2.3} />
                    <Circle cx={180} cy={76} r={1.4} fill={ink} />
                </AnimatedG>

                <AnimatedG animatedProps={fingerProps}>
                    <Path d="M180 103c-15 0-27 12-27 27v8M180 111c-10 0-18 8-18 18v12M180 119c-6 0-10 5-10 10v13M180 103c15 0 27 12 27 27v8M180 111c10 0 18 8 18 18v12M180 119c6 0 10 5 10 10v13M180 135c0 12-3 20-8 27M180 135c0 11 2 19 6 26" fill="none" stroke={green} strokeWidth={2.4} strokeLinecap="round" />
                    <AnimatedRect animatedProps={scanProps} x={151} width={58} height={2} rx={1} fill={green} />
                </AnimatedG>

                <AnimatedG animatedProps={pinProps}>
                    {[0, 1, 2, 3].map((i) => (
                        <PinDot key={i} progress={progress} index={i} />
                    ))}
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <Circle key={`key-${i}`} cx={160 + (i % 3) * 20} cy={158 + Math.floor(i / 3) * 18} r={3.2} fill={muted} />
                    ))}
                </AnimatedG>

                <AnimatedG animatedProps={checkGroupProps}>
                    <Circle cx={180} cy={133} r={26} fill={green} />
                    <AnimatedPath
                        animatedProps={checkProps}
                        d="M168 133l8 8 16-17"
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth={3.2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={[24, 24]}
                    />
                    <Rect x={140} y={174} width={80} height={5} rx={2.5} fill={green} opacity={0.8} />
                    <Rect x={151} y={185} width={58} height={4} rx={2} fill={muted} />
                </AnimatedG>

                <Circle cx={180} cy={239} r={2} fill={muted} />
            </Svg>
        </View>
    );
});
