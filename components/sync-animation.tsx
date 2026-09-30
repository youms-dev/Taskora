import { useTheme } from '@/hooks/use-theme';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, Extrapolation, SharedValue, cancelAnimation, interpolate, useAnimatedProps, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

const DURATION = 4000;

const C = {
  black: '#000000',
  skeleton: 'rgba(255,255,255,.2)',
  emerald: '#10B981',
  track: '#E4E4E7',
  white: '#FFFFFF',
};

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const ramp = (
  p: SharedValue<number>,
  input: number[],
  output: number[],
) => {
  'worklet';

  return interpolate(
    p.value,
    input,
    output,
    Extrapolation.CLAMP,
  );
};

const Phone = ({ x }: { x: number }) => {
  const { theme } = useTheme();

  return (
    <>
      <Rect
        x={x}
        y={105}
        width={90}
        height={190}
        rx={16}
        fill={theme == "dark" ? "rgba(0, 0, 0, 1)" : "rgba(255, 255, 255, 1)"}
      />

      <Rect
        x={x}
        y={105}
        width={90}
        height={190}
        rx={16}
        fill={theme == "dark" ? "rgba(0, 0, 0, 1)" : "rgba(0, 0, 0, .06)"}
      />

      <Rect
        x={x + 6}
        y={111}
        width={78}
        height={178}
        rx={11}
        fill={theme == "dark" ? "rgba(0, 0, 0, 1)" : "rgba(255, 255, 255, .06)"}
      />

      <Rect
        x={x + 34}
        y={116}
        width={22}
        height={4}
        rx={2}
        fill={theme == "dark" ? "rgba(255, 255, 255, .2)" : "rgba(0, 0, 0, .2)"}
      />
    </>
  );
}

type RowProps = { x: number; y: number; w1: number; w2: number };

const TaskRow = ({ x, y, w1, w2 }: RowProps) => {
  const { theme } = useTheme();

  return (
    <>
      <Circle
        cx={x + 20}
        cy={y}
        r={5}
        fill="none"
        stroke={theme == "dark" ? "rgba(255, 255, 255, .2)" : "rgba(0, 0, 0, .2)"}
        strokeWidth={1.5}
      />

      <Rect
        x={x + 33}
        y={y - 4}
        width={w1}
        height={4}
        rx={2}
        fill={theme == "dark" ? "rgba(255, 255, 255, .2)" : "rgba(0, 0, 0, .2)"}
      />

      <Rect
        x={x + 33}
        y={y + 4}
        width={w2}
        height={3.5}
        rx={1.75}
        fill={theme == "dark" ? "rgba(255, 255, 255, .2)" : "rgba(0, 0, 0, .2)"}
      />
    </>
  );
}

const ROWS = [
  { y: 160, w1: 42, w2: 26, start: 0.3 },
  { y: 198, w1: 36, w2: 24, start: 0.38 },
  { y: 236, w1: 40, w2: 20, start: 0.46 },
];

const AnimatedRow = ({
  progress,
  start,
  ...row
}: RowProps & { progress: SharedValue<number>; start: number }) => {
  const animatedProps = useAnimatedProps(() => ({
    opacity: ramp(
      progress,
      [0, start, start + 0.06, 0.9, 0.97, 1],
      [0, 0, 1, 1, 0, 0],
    ),
  }));

  return (
    <AnimatedG animatedProps={animatedProps}>
      <TaskRow {...row} />
    </AnimatedG>
  );
};

const Connection = ({ progress }: { progress: SharedValue<number> }) => {
  const lineProps = useAnimatedProps(() => ({
    strokeDashoffset: ramp(progress, [0, 0.1, 0.5], [80, 80, 0]),
    opacity: ramp(
      progress,
      [0, 0.1, 0.11, 0.56, 0.62, 1],
      [0, 0, 1, 1, 0, 0],
    ),
  }));

  const dotProps = useAnimatedProps(() => ({
    cx: ramp(progress, [0.1, 0.5], [160, 240]),
    opacity: ramp(progress, [0, 0.1, 0.14, 0.46, 0.5, 1], [0, 0, 1, 1, 0, 0]),
  }));

  return (
    <>
      <Path
        d="M160 200 H240"
        stroke={C.track}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      <AnimatedPath
        animatedProps={lineProps}
        d="M160 200 H240"
        stroke={C.emerald}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={[80, 80]}
        fill="none"
      />
      <AnimatedCircle animatedProps={dotProps} cy={200} r={4} fill={C.emerald} />
    </>
  );
};

const SuccessBadge = ({ progress }: { progress: SharedValue<number> }) => {
  const groupProps = useAnimatedProps(() => ({
    opacity: ramp(
      progress,
      [0, 0.54, 0.62, 0.9, 0.97, 1],
      [0, 0, 1, 1, 0, 0],
    ),
  }));

  const outerProps = useAnimatedProps(() => ({
    r: 19 * ramp(progress, [0.54, 0.62], [0.7, 1]),
  }));

  const innerProps = useAnimatedProps(() => ({
    r: 14 * ramp(progress, [0.54, 0.62], [0.7, 1]),
  }));

  const tickProps = useAnimatedProps(() => ({
    strokeDashoffset: ramp(
      progress,
      [0, 0.58, 0.68, 0.9, 0.97, 1],
      [20, 20, 0, 0, 20, 20],
    ),
  }));

  return (
    <AnimatedG animatedProps={groupProps}>
      <AnimatedCircle animatedProps={outerProps} cx={200} cy={200} fill={C.white} />
      <AnimatedCircle animatedProps={innerProps} cx={200} cy={200} fill={C.emerald} />
      <AnimatedPath
        animatedProps={tickProps}
        d="M193.5 200.5l4.5 4.5 8.5-9"
        fill="none"
        stroke={C.white}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={[20, 20]}
      />
    </AnimatedG>
  );
};

interface Props {
  width?: number;
  height?: number;
}

export const SyncAnimation = ({ width = 360, height }: Props) => {
  const h = height ?? width * (190 / 300);
  const progress = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 0.75;
      return;
    }
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: DURATION, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(progress);
  }, [reduceMotion, progress]);


  return (
    <View
      style={{ width, height: h }}
      className="items-center justify-center"
    >
      <Svg
        width={width}
        height={h}
        viewBox="50 105 300 190"
        preserveAspectRatio="xMidYMid meet"
      >

        {/* Current device */}

        <Phone x={60} />
        <TaskRow x={60} y={160} w1={42} w2={26} />
        <TaskRow x={60} y={198} w1={36} w2={24} />
        <TaskRow x={60} y={236} w1={40} w2={20} />

        {/* New device */}

        <Phone x={250} />
        {ROWS.map((row) => (
          <AnimatedRow key={row.y} x={250} progress={progress} {...row} />
        ))}

        <Connection progress={progress} />

        <SuccessBadge progress={progress} />
      </Svg>
    </View>
  );
};
