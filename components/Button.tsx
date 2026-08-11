import clsx from 'clsx';
import { memo, useState } from 'react';
import { ActivityIndicator, DimensionValue, PressableProps, View } from 'react-native';
import { PressableAnimated } from './pressable-animated';

interface Props extends PressableProps {
  children: React.ReactNode;
  loaderSize?: number;
  loading?: boolean;
  width?: DimensionValue;
  height?: DimensionValue;
  scale?: number;
}

/**
 * 
 * @param children
 * @param loaderSize
 * @default 20
 * 
 * @param loading
 * @default false
 * 
 * @param Width
 * @default 250
 * 
 * @param Height
 * 
 * @param scale How the button scale when it's pressed
 * @default 1
 * 
 * @returns Button component
 */

export const Button = memo(({ children, loaderSize = 20, loading = false, width = 250, height = 50, scale = 1, ...rest }: Props) => {
  const [layout, setLayout] = useState<{
    width: DimensionValue;
    height: DimensionValue;
  }>();

  return (
    <PressableAnimated
      {...rest}
      scale={scale}
      disabled={loading}
      style={{
        width: layout?.width,
        height: layout?.height,
      }}
      className={clsx(
        'flex justify-center items-center rounded-xl p-2 bg-emerald-500',
        loading && "opacity-70 pointer-events-none",
      )}
    >
      {
        !loading && (
          <View
            style={{
              width,
              height,
            }}
            onLayout={(e) => setLayout(e.nativeEvent.layout)}
            className="absolute flex flex-row justify-center items-center gap-3"
          >
            {children}
          </View>
        )
      }

      {
        loading && (
          <ActivityIndicator
            size={loaderSize}
            color="black"
          />
        )
      }
    </PressableAnimated>
  );
});
