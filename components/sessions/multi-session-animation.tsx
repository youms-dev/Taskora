import { COLORS } from '@/constants/colors';
import { useTheme } from '@/hooks/use-theme';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, cancelAnimation, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

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
        fill={
          theme === "dark"
            ? "rgba(0, 0, 0, 1)"
            : "rgba(255, 255, 255, 1)"
        }
      />

      <Rect
        x={x}
        y={105}
        width={90}
        height={190}
        rx={16}
        fill={theme === "dark" ?
          "rgba(0, 0, 0, 1)"
          :
          "rgba(0, 0, 0, .06)"
        }
      />

      <Rect
        x={x + 6}
        y={111}
        width={78}
        height={178}
        rx={11}
        fill={
          theme === "dark"
            ? "rgba(0, 0, 0, 1)"
            : 'rgba(255, 255, 255, .06)'
        }
      />

      <Rect
        x={x + 34}
        y={116}
        width={22}
        height={4}
        rx={2}
        fill={
          theme === "dark"
            ? 'rgba(255, 255, 255, .2)'
            : 'rgba(0, 0, 0, .2)'
        }
      />
    </>
  );
};

type RowProps = {
  x: number;
  y: number;
  w1: number;
  w2: number;
};

const TaskRow = ({ x, y, w1, w2 }: RowProps) => {
  const { theme } = useTheme();

  return (
    <>
      <Circle
        cx={x + 20}
        cy={y}
        r={5}
        fill="none"
        stroke={theme === "dark" ?
          "rgba(255,255,255,.2)"
          :
          "rgba(0,0,0,.2)"
        }
        strokeWidth={1.5}
      />

      <Rect
        x={x + 33}
        y={y - 4}
        width={w1}
        height={4}
        rx={2}
        fill={theme === "dark"
          ?
          "rgba(255,255,255,.2)"
          :
          "rgba(0,0,0,.2)"
        }
      />

      <Rect
        x={x + 33}
        y={y + 4}
        width={w2}
        height={3.5}
        rx={1.75}
        fill={theme === "dark" ?
          "rgba(255,255,255,.2)"
          :
          "rgba(0,0,0,.2)"
        }
      />
    </>
  );
};

interface Props {
  width?: number;
  height?: number;
}

export const MultiSessionAnimation = ({
  width = 360,
  height,
}: Props) => {
  const h = height ?? width * (190 / 300);

  const pulse = useSharedValue(0);
  const rotation = useSharedValue(0);
  const particles = useSharedValue(0);

  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      pulse.value = 0.5;
      rotation.value = 0;
      particles.value = 0;
      return;
    }

    pulse.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 1000,
          easing: Easing.out(Easing.ease),
        }),
        withTiming(0, {
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      false,
    );

    rotation.value = withRepeat(
      withTiming(360, {
        duration: 6000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    particles.value = withRepeat(
      withTiming(1, {
        duration: 1800,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      false,
    );

    return () => {
      cancelAnimation(pulse);
      cancelAnimation(rotation);
      cancelAnimation(particles);
    };
  }, [reduceMotion, pulse, rotation, particles]);

  const accountStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      pulse.value,
      [0, 1],
      [0.85, 1],
    ),
    transform: [
      {
        scale: interpolate(
          pulse.value,
          [0, 1],
          [0.92, 1.08],
        ),
      },
      {
        rotate: `${rotation.value}deg`,
      },
    ],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      pulse.value,
      [0, 1],
      [0.15, 0.45],
    ),
    transform: [
      {
        scale: interpolate(
          pulse.value,
          [0, 1],
          [0.7, 1.5],
        ),
      },
    ],
  }));

  const leftParticleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      particles.value,
      [0, 0.15, 0.75, 1],
      [0, 1, 1, 0],
    ),
    transform: [
      {
        translateX: interpolate(
          particles.value,
          [0, 1],
          [0, -70],
        ),
      },
    ],
  }));

  const rightParticleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      particles.value,
      [0, 0.15, 0.75, 1],
      [0, 1, 1, 0],
    ),
    transform: [
      {
        translateX: interpolate(
          particles.value,
          [0, 1],
          [0, 70],
        ),
      },
    ],
  }));

  return (
    <View
      style={{
        width,
        height: h,
      }}
      className="relative flex justify-center items-center"
    >
      <Svg
        width={width}
        height={h}
        viewBox="50 105 300 190"
        preserveAspectRatio="xMidYMid meet"
      >

        {/* Left device */}

        <Phone x={60} />

        <TaskRow
          x={60}
          y={160}
          w1={42}
          w2={26}
        />

        <TaskRow
          x={60}
          y={198}
          w1={36}
          w2={24}
        />

        <TaskRow
          x={60}
          y={236}
          w1={40}
          w2={20}
        />

        {/* Right device */}

        <Phone x={250} />

        <TaskRow
          x={250}
          y={160}
          w1={42}
          w2={26}
        />

        <TaskRow
          x={250}
          y={198}
          w1={36}
          w2={24}
        />

        <TaskRow
          x={250}
          y={236}
          w1={40}
          w2={20}
        />

        {/* Connection lines */}

        <Path
          d="M150 200 C165 200 170 200 182 200"
          stroke={COLORS.emerald[500]}
          strokeWidth={1.2}
          strokeDasharray="4 5"
          opacity={0.25}
        />

        <Path
          d="M218 200 C230 200 235 200 250 200"
          stroke={COLORS.emerald[500]}
          strokeWidth={1.2}
          strokeDasharray="4 5"
          opacity={0.25}
        />
      </Svg>

      {/* Central account */}

      <Animated.View
        style={haloStyle}
        className="absolute left-1/2 top-1/2 size-[52px] flex justify-center items-center -ml-[26px] -mt-[26px]"
      >
        <View className="absolute size-[46px] rounded-[23px] bg-emerald-500" />
      </Animated.View>

      <Animated.View
        style={accountStyle}
        className="absolute rounded-full dark:bg-black bg-white"
      >
        <View className="size-[50px] flex justify-center items-center p-2 rounded-full dark:bg-black bg-black/80">
          <MaterialIcons
            name="account-tree"
            size={27}
            color={COLORS.emerald[500]}
          />
        </View>
      </Animated.View>

      {/* Data particle → left phone */}

      <Animated.View
        style={leftParticleStyle}
        className="absolute size-[6px] rounded-full bg-emerald-500"
      />

      {/* Data particle → right phone */}

      <Animated.View
        style={rightParticleStyle}
        className="absolute size-[6px] rounded-full bg-emerald-500"
      />
    </View>
  );
};